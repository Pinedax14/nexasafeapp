-- E1 / E11-01 — Esquema base de identidad, vinculación y consentimiento.
-- Diseño aprobado: docs/architecture/modelo-datos-e1.md (decisiones D1–D7, 03/10/2026).
-- Reglas: RLS en todas las tablas, sin acceso para `anon`, cambios sensibles solo
-- mediante funciones que verifican el rol y escriben en audit_log.

-- ---------------------------------------------------------------------------
-- Esquema privado: funciones auxiliares que no expone la API de Supabase.
-- ---------------------------------------------------------------------------
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

-- ---------------------------------------------------------------------------
-- Llave de cifrado del documento del menor (RNF-02, decisión D4).
-- Se genera dentro de cada base de datos; nunca está en el repositorio.
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'documento_protegido_key') then
    perform vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'base64'),
      'documento_protegido_key',
      'Llave de cifrado de protegidos.documento_cifrado (RNF-02)'
    );
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------
create type public.estado_protegido as enum ('PENDIENTE_VALIDACION', 'ACTIVO', 'INACTIVO');
create type public.tipo_consentimiento as enum ('OTORGADO', 'REVOCADO');

-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------
create table public.colegios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (length(trim(nombre)) > 0),
  nit text not null unique check (length(trim(nit)) > 0),
  creado_en timestamptz not null default now()
);

create table public.personal_institucion (
  id uuid primary key references auth.users (id) on delete cascade,
  colegio_id uuid not null references public.colegios (id),
  nombre text not null check (length(trim(nombre)) > 0),
  cargo text,
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);
create index personal_institucion_colegio_idx on public.personal_institucion (colegio_id);

create table public.guardianes (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null,
  email text not null,
  creado_en timestamptz not null default now()
);

create table public.protegidos (
  id uuid primary key default gen_random_uuid(),
  guardian_id uuid not null references public.guardianes (id),
  colegio_id uuid not null references public.colegios (id),
  nombre text not null check (length(trim(nombre)) > 0),
  documento_cifrado bytea not null,
  foto_path text,
  pin_hash text,
  estado public.estado_protegido not null default 'PENDIENTE_VALIDACION',
  validado_por uuid references public.personal_institucion (id),
  validado_en timestamptz,
  creado_en timestamptz not null default now()
);
create index protegidos_guardian_idx on public.protegidos (guardian_id);
create index protegidos_colegio_estado_idx on public.protegidos (colegio_id, estado);

create table public.consentimientos (
  id uuid primary key default gen_random_uuid(),
  guardian_id uuid not null references public.guardianes (id),
  protegido_id uuid not null references public.protegidos (id),
  tipo public.tipo_consentimiento not null,
  version_politica text not null,
  aceptado_en timestamptz not null default now()
);
create index consentimientos_protegido_idx on public.consentimientos (protegido_id);

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid,
  entidad text not null,
  entidad_id uuid,
  accion text not null,
  creado_en timestamptz not null default now()
);
create index audit_log_entidad_idx on public.audit_log (entidad, entidad_id);

-- ---------------------------------------------------------------------------
-- Funciones auxiliares (esquema privado)
-- ---------------------------------------------------------------------------
create function private.rol_actual()
returns text
language sql
stable
set search_path = ''
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'rol', '');
$$;

create function private.es_personal_activo_de(p_colegio_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.personal_institucion
    where id = auth.uid() and colegio_id = p_colegio_id and activo
  );
$$;

create function private.version_politica_vigente()
returns text
language sql
immutable
set search_path = ''
as $$
  select '1.0'::text;
$$;

create function private.llave_documento()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'documento_protegido_key';
$$;

create function private.registrar_auditoria(p_entidad text, p_entidad_id uuid, p_accion text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.audit_log (actor_id, entidad, entidad_id, accion)
  values (auth.uid(), p_entidad, p_entidad_id, p_accion);
$$;

create function private.auditar_cambio()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.registrar_auditoria(tg_table_name, new.id, tg_op);
  return new;
end;
$$;

create function private.impedir_cambios()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'La tabla % es append-only', tg_table_name using errcode = 'P0001';
end;
$$;

revoke all on all functions in schema private from public, anon, authenticated;
grant execute on function private.rol_actual() to authenticated;
grant execute on function private.es_personal_activo_de(uuid) to authenticated;
grant execute on function private.version_politica_vigente() to authenticated;

-- ---------------------------------------------------------------------------
-- Alta de usuarios: todo registro desde la app es un guardián (E1-01).
-- Las cuentas creadas por el servidor (institucion, admin) ya traen su rol.
-- ---------------------------------------------------------------------------
create function private.asignar_rol_por_defecto()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(new.raw_app_meta_data ->> 'rol', '') = '' then
    new.raw_app_meta_data := coalesce(new.raw_app_meta_data, '{}'::jsonb)
      || jsonb_build_object('rol', 'guardian');
  end if;
  return new;
end;
$$;

create function private.crear_guardian()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.raw_app_meta_data ->> 'rol' = 'guardian' then
    insert into public.guardianes (id, nombre, email)
    values (
      new.id,
      coalesce(nullif(trim(new.raw_user_meta_data ->> 'nombre'), ''), split_part(coalesce(new.email, ''), '@', 1)),
      coalesce(new.email, '')
    );
  end if;
  return new;
end;
$$;

revoke all on function private.asignar_rol_por_defecto() from public, anon, authenticated;
revoke all on function private.crear_guardian() from public, anon, authenticated;

create trigger asignar_rol_por_defecto
  before insert on auth.users
  for each row execute function private.asignar_rol_por_defecto();

create trigger crear_guardian
  after insert on auth.users
  for each row execute function private.crear_guardian();

-- ---------------------------------------------------------------------------
-- Append-only y auditoría
-- ---------------------------------------------------------------------------
create trigger consentimientos_append_only
  before update or delete on public.consentimientos
  for each row execute function private.impedir_cambios();
create trigger consentimientos_sin_truncate
  before truncate on public.consentimientos
  for each statement execute function private.impedir_cambios();

create trigger audit_log_append_only
  before update or delete on public.audit_log
  for each row execute function private.impedir_cambios();
create trigger audit_log_sin_truncate
  before truncate on public.audit_log
  for each statement execute function private.impedir_cambios();

create trigger colegios_auditoria
  after insert or update on public.colegios
  for each row execute function private.auditar_cambio();
create trigger personal_institucion_auditoria
  after insert or update on public.personal_institucion
  for each row execute function private.auditar_cambio();

-- ---------------------------------------------------------------------------
-- Permisos y RLS
-- ---------------------------------------------------------------------------
alter table public.colegios enable row level security;
alter table public.personal_institucion enable row level security;
alter table public.guardianes enable row level security;
alter table public.protegidos enable row level security;
alter table public.consentimientos enable row level security;
alter table public.audit_log enable row level security;

revoke all on public.colegios, public.personal_institucion, public.guardianes,
  public.protegidos, public.consentimientos, public.audit_log
  from anon, authenticated;

-- colegios
grant select, insert on public.colegios to authenticated;
grant update (nombre, nit) on public.colegios to authenticated;

create policy colegios_lectura on public.colegios
  for select to authenticated
  using (private.rol_actual() in ('guardian', 'institucion', 'admin'));
create policy colegios_alta_admin on public.colegios
  for insert to authenticated
  with check (private.rol_actual() = 'admin');
create policy colegios_edicion_admin on public.colegios
  for update to authenticated
  using (private.rol_actual() = 'admin')
  with check (private.rol_actual() = 'admin');

-- personal_institucion (el alta la hace la Edge Function admin-personal)
grant select on public.personal_institucion to authenticated;
grant update (activo, cargo) on public.personal_institucion to authenticated;

create policy personal_lectura on public.personal_institucion
  for select to authenticated
  using (id = auth.uid() or private.rol_actual() = 'admin');
create policy personal_edicion_admin on public.personal_institucion
  for update to authenticated
  using (private.rol_actual() = 'admin')
  with check (private.rol_actual() = 'admin');

-- guardianes (el alta la hace el trigger crear_guardian)
grant select on public.guardianes to authenticated;
grant update (nombre) on public.guardianes to authenticated;

create policy guardianes_lectura_propia on public.guardianes
  for select to authenticated
  using (id = auth.uid());
create policy guardianes_edicion_propia on public.guardianes
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- protegidos: sin documento_cifrado ni pin_hash para los clientes;
-- altas y cambios de estado solo mediante funciones.
grant select (id, guardian_id, colegio_id, nombre, foto_path, estado, validado_en, creado_en)
  on public.protegidos to authenticated;

create policy protegidos_lectura_guardian on public.protegidos
  for select to authenticated
  using (private.rol_actual() = 'guardian' and guardian_id = auth.uid());
create policy protegidos_lectura_institucion on public.protegidos
  for select to authenticated
  using (private.rol_actual() = 'institucion' and private.es_personal_activo_de(colegio_id));

-- consentimientos: lectura propia; el alta la hace registrar_protegido
grant select on public.consentimientos to authenticated;

create policy consentimientos_lectura_propia on public.consentimientos
  for select to authenticated
  using (guardian_id = auth.uid());

-- audit_log: sin acceso para los clientes.

-- ---------------------------------------------------------------------------
-- Funciones públicas (RPC)
-- ---------------------------------------------------------------------------

-- Versión de la política de tratamiento que la app debe mostrar y registrar.
create function public.version_politica_vigente()
returns text
language sql
immutable
set search_path = ''
as $$
  select private.version_politica_vigente();
$$;

-- E1-02 + E11-01: alta del menor y consentimiento en una sola transacción.
create function public.registrar_protegido(
  p_nombre text,
  p_documento text,
  p_colegio_id uuid,
  p_version_politica text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_guardian uuid := auth.uid();
  v_id uuid;
begin
  if v_guardian is null
     or private.rol_actual() <> 'guardian'
     or not exists (select 1 from public.guardianes where id = v_guardian) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  if p_version_politica is distinct from private.version_politica_vigente() then
    raise exception 'Debe aceptar la política de tratamiento vigente' using errcode = 'P0001';
  end if;

  if coalesce(trim(p_nombre), '') = '' or coalesce(trim(p_documento), '') = '' then
    raise exception 'El nombre y el documento son obligatorios' using errcode = '22023';
  end if;

  if not exists (select 1 from public.colegios where id = p_colegio_id) then
    raise exception 'Colegio no encontrado' using errcode = '22023';
  end if;

  insert into public.protegidos (guardian_id, colegio_id, nombre, documento_cifrado)
  values (
    v_guardian,
    p_colegio_id,
    trim(p_nombre),
    extensions.pgp_sym_encrypt(trim(p_documento), private.llave_documento())
  )
  returning id into v_id;

  insert into public.consentimientos (guardian_id, protegido_id, tipo, version_politica)
  values (v_guardian, v_id, 'OTORGADO', p_version_politica);

  perform private.registrar_auditoria('protegidos', v_id, 'INSERT');
  return v_id;
end;
$$;

-- E1-03: el personal activo del colegio valida la matrícula.
create function public.validar_protegido(p_protegido_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_colegio uuid;
  v_estado public.estado_protegido;
begin
  select colegio_id, estado into v_colegio, v_estado
  from public.protegidos
  where id = p_protegido_id
  for update;

  if not found
     or private.rol_actual() <> 'institucion'
     or not private.es_personal_activo_de(v_colegio) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  if v_estado <> 'PENDIENTE_VALIDACION' then
    raise exception 'El protegido no está pendiente de validación' using errcode = 'P0001';
  end if;

  update public.protegidos
  set estado = 'ACTIVO', validado_por = auth.uid(), validado_en = now()
  where id = p_protegido_id;

  perform private.registrar_auditoria('protegidos', p_protegido_id, 'VALIDAR');
end;
$$;

-- D1: el detalle del menor (con el documento descifrado) solo se lee aquí,
-- y cada lectura queda en audit_log.
create function public.obtener_protegido(p_protegido_id uuid)
returns table (
  id uuid,
  nombre text,
  documento text,
  colegio_id uuid,
  estado public.estado_protegido,
  foto_path text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_guardian uuid;
  v_colegio uuid;
begin
  select p.guardian_id, p.colegio_id into v_guardian, v_colegio
  from public.protegidos p
  where p.id = p_protegido_id;

  if not found or not (
    (private.rol_actual() = 'guardian' and v_guardian = auth.uid())
    or (private.rol_actual() = 'institucion' and private.es_personal_activo_de(v_colegio))
  ) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  perform private.registrar_auditoria('protegidos', p_protegido_id, 'LEER');

  return query
  select p.id, p.nombre,
         extensions.pgp_sym_decrypt(p.documento_cifrado, private.llave_documento()),
         p.colegio_id, p.estado, p.foto_path
  from public.protegidos p
  where p.id = p_protegido_id;
end;
$$;

revoke all on function public.version_politica_vigente() from public, anon;
revoke all on function public.registrar_protegido(text, text, uuid, text) from public, anon;
revoke all on function public.validar_protegido(uuid) from public, anon;
revoke all on function public.obtener_protegido(uuid) from public, anon;
grant execute on function public.version_politica_vigente() to authenticated;
grant execute on function public.registrar_protegido(text, text, uuid, text) to authenticated;
grant execute on function public.validar_protegido(uuid) to authenticated;
grant execute on function public.obtener_protegido(uuid) to authenticated;
