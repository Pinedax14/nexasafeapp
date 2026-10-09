-- Sprint 02 — Rutas (E3-01a, E3-02, E3-03), trayectos (E4-01, E4-04) y
-- contactos de apoyo (E2-01).
-- Diseño aprobado: docs/architecture/modelo-datos-sprint-02.md (D8–D17, 09/10/2026).
-- Reglas: RLS en todas las tablas, sin acceso para `anon` salvo ver_invitacion,
-- cambios solo mediante funciones que verifican el rol y escriben en audit_log.

create extension if not exists postgis with schema extensions;

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------
create type public.sentido_ruta as enum ('CASA_COLEGIO', 'COLEGIO_CASA');
-- Fase 1. DESVIADO, ALERTA y VENCIDO se agregan en la fase 2 (E5).
create type public.estado_trayecto as enum ('EN_CURSO', 'CERRADO');
-- Fase 1. E2-02 (fase 2) agrega más alcances.
create type public.alcance_visibilidad as enum ('SOLO_ALERTAS');

-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------
create table public.rutas (
  id uuid primary key default gen_random_uuid(),
  protegido_id uuid not null references public.protegidos (id),
  sentido public.sentido_ruta not null,
  geometria extensions.geography(LineString, 4326) not null,
  corredor_m int not null default 50 check (corredor_m between 25 and 200),
  duracion_esperada_min int not null check (duracion_esperada_min between 5 and 120),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  unique (protegido_id, sentido)
);

create table public.trayectos (
  id uuid primary key default gen_random_uuid(),
  protegido_id uuid not null references public.protegidos (id),
  ruta_id uuid not null references public.rutas (id),
  inicio_en timestamptz not null default now(),
  fin_en timestamptz,
  estado public.estado_trayecto not null default 'EN_CURSO'
);
create index trayectos_protegido_idx on public.trayectos (protegido_id);
-- Un solo trayecto en curso por menor.
create unique index trayectos_uno_en_curso_key on public.trayectos (protegido_id)
  where estado = 'EN_CURSO';

create table public.contactos_apoyo (
  id uuid primary key default gen_random_uuid(),
  guardian_id uuid not null references public.guardianes (id),
  protegido_id uuid not null references public.protegidos (id),
  alcance_visibilidad public.alcance_visibilidad not null default 'SOLO_ALERTAS',
  token_hash text not null unique,
  vence_en timestamptz not null default now() + interval '72 hours',
  usuario_id uuid references auth.users (id) on delete cascade,
  nombre text,
  aceptada_en timestamptz,
  creado_en timestamptz not null default now(),
  check ((usuario_id is null) = (aceptada_en is null))
);
create index contactos_apoyo_guardian_idx on public.contactos_apoyo (guardian_id, creado_en);
create index contactos_apoyo_usuario_idx on public.contactos_apoyo (usuario_id);
-- Un contacto acepta una sola vez por menor.
create unique index contactos_apoyo_menor_usuario_key on public.contactos_apoyo (protegido_id, usuario_id)
  where usuario_id is not null;

-- ---------------------------------------------------------------------------
-- Funciones auxiliares (esquema privado)
-- ---------------------------------------------------------------------------
create function private.es_guardian_de(p_protegido_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.rol_actual() = 'guardian'
     and exists (
       select 1 from public.protegidos
       where id = p_protegido_id and guardian_id = auth.uid()
     );
$$;

create function private.es_el_protegido(p_protegido_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.rol_actual() = 'protegido'
     and exists (
       select 1 from public.protegidos
       where id = p_protegido_id and usuario_id = auth.uid()
     );
$$;

create function private.hash_token(p_token text)
returns text
language sql
immutable
set search_path = ''
as $$
  select encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex');
$$;

-- D15: la ruta es una línea de 2 a 200 puntos, válida, de hasta 30 km y
-- dentro de Colombia.
create function private.validar_geometria_ruta(p_geojson jsonb)
returns extensions.geography
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_geom extensions.geometry;
begin
  begin
    v_geom := extensions.st_setsrid(extensions.st_geomfromgeojson(p_geojson::text), 4326);
  exception when others then
    raise exception 'Ruta inválida' using errcode = '22023';
  end;

  if v_geom is null
     or extensions.geometrytype(v_geom) <> 'LINESTRING'
     or extensions.st_npoints(v_geom) not between 2 and 200
     or not extensions.st_isvalid(v_geom)
     or extensions.st_xmin(v_geom::extensions.box3d) < -82
     or extensions.st_xmax(v_geom::extensions.box3d) > -66
     or extensions.st_ymin(v_geom::extensions.box3d) < -4.3
     or extensions.st_ymax(v_geom::extensions.box3d) > 13.5
     or extensions.st_length(v_geom::extensions.geography) > 30000 then
    raise exception 'Ruta inválida' using errcode = '22023';
  end if;

  return v_geom::extensions.geography;
end;
$$;

revoke all on function private.es_guardian_de(uuid) from public, anon, authenticated;
revoke all on function private.es_el_protegido(uuid) from public, anon, authenticated;
revoke all on function private.hash_token(text) from public, anon, authenticated;
revoke all on function private.validar_geometria_ruta(jsonb) from public, anon, authenticated;
grant execute on function private.es_guardian_de(uuid) to authenticated;
grant execute on function private.es_el_protegido(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Alta de la cuenta del contacto de apoyo (D8): si el registro trae una
-- invitación válida, la cuenta nace con rol apoyo; si la invitación no sirve,
-- el registro se rechaza. Sin invitación, todo registro sigue siendo guardián.
-- ---------------------------------------------------------------------------
create or replace function private.asignar_rol_por_defecto()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token text := new.raw_user_meta_data ->> 'invitacion';
begin
  if coalesce(new.raw_app_meta_data ->> 'rol', '') <> '' then
    return new;
  end if;

  if v_token is not null then
    if not exists (
      select 1 from public.contactos_apoyo
      where token_hash = private.hash_token(v_token)
        and aceptada_en is null
        and vence_en > now()
    ) then
      raise exception 'Invitación no válida' using errcode = 'NX410';
    end if;
    new.raw_app_meta_data := coalesce(new.raw_app_meta_data, '{}'::jsonb)
      || jsonb_build_object('rol', 'apoyo');
  else
    new.raw_app_meta_data := coalesce(new.raw_app_meta_data, '{}'::jsonb)
      || jsonb_build_object('rol', 'guardian');
  end if;
  return new;
end;
$$;

create function private.vincular_contacto_apoyo()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if new.raw_app_meta_data ->> 'rol' = 'apoyo' and new.raw_user_meta_data ? 'invitacion' then
    update public.contactos_apoyo
    set usuario_id = new.id,
        nombre = nullif(trim(new.raw_user_meta_data ->> 'nombre'), ''),
        aceptada_en = now()
    where token_hash = private.hash_token(new.raw_user_meta_data ->> 'invitacion')
      and aceptada_en is null
      and vence_en > now()
    returning id into v_id;

    if v_id is null then
      raise exception 'Invitación no válida' using errcode = 'NX410';
    end if;

    insert into public.audit_log (actor_id, entidad, entidad_id, accion)
    values (new.id, 'contactos_apoyo', v_id, 'ACEPTAR_INVITACION');
  end if;
  return new;
end;
$$;

revoke all on function private.vincular_contacto_apoyo() from public, anon, authenticated;

create trigger vincular_contacto_apoyo
  after insert on auth.users
  for each row execute function private.vincular_contacto_apoyo();

-- ---------------------------------------------------------------------------
-- Permisos y RLS
-- ---------------------------------------------------------------------------
alter table public.rutas enable row level security;
alter table public.trayectos enable row level security;
alter table public.contactos_apoyo enable row level security;

revoke all on public.rutas, public.trayectos, public.contactos_apoyo from anon, authenticated;

-- rutas: sin acceso directo. Se leen con obtener_rutas (auditada) y se
-- escriben con guardar_ruta.

-- trayectos: lectura del propio menor y de su guardián; el alta la hace
-- iniciar_trayecto.
grant select on public.trayectos to authenticated;

create policy trayectos_lectura_protegido on public.trayectos
  for select to authenticated
  using (private.es_el_protegido(protegido_id));
create policy trayectos_lectura_guardian on public.trayectos
  for select to authenticated
  using (private.es_guardian_de(protegido_id));

-- contactos_apoyo: sin token_hash para los clientes.
grant select (id, guardian_id, protegido_id, alcance_visibilidad, vence_en, usuario_id, nombre, aceptada_en, creado_en)
  on public.contactos_apoyo to authenticated;

create policy contactos_apoyo_lectura_guardian on public.contactos_apoyo
  for select to authenticated
  using (private.rol_actual() = 'guardian' and guardian_id = auth.uid());
create policy contactos_apoyo_lectura_apoyo on public.contactos_apoyo
  for select to authenticated
  using (private.rol_actual() = 'apoyo' and usuario_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Funciones públicas (RPC)
-- ---------------------------------------------------------------------------

-- E3-01a, E3-02, E3-03: crea o reemplaza la ruta de un sentido (D12).
create function public.guardar_ruta(
  p_protegido_id uuid,
  p_sentido public.sentido_ruta,
  p_geojson jsonb,
  p_corredor_m int,
  p_duracion_min int
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_geografia extensions.geography;
  v_id uuid;
begin
  if not private.es_guardian_de(p_protegido_id) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  if not exists (select 1 from public.protegidos where id = p_protegido_id and estado = 'ACTIVO') then
    raise exception 'El menor no está activo' using errcode = 'P0001';
  end if;

  if p_sentido is null
     or coalesce(p_corredor_m, 0) not between 25 and 200
     or coalesce(p_duracion_min, 0) not between 5 and 120 then
    raise exception 'Datos de la ruta inválidos' using errcode = '22023';
  end if;

  v_geografia := private.validar_geometria_ruta(p_geojson);

  insert into public.rutas (protegido_id, sentido, geometria, corredor_m, duracion_esperada_min)
  values (p_protegido_id, p_sentido, v_geografia, p_corredor_m, p_duracion_min)
  on conflict (protegido_id, sentido) do update
  set geometria = excluded.geometria,
      corredor_m = excluded.corredor_m,
      duracion_esperada_min = excluded.duracion_esperada_min,
      actualizado_en = now()
  returning id into v_id;

  perform private.registrar_auditoria('rutas', v_id, 'GUARDAR_RUTA');
  return v_id;
end;
$$;

-- Lectura de las rutas del menor (guardián o el propio menor), auditada (D1).
create function public.obtener_rutas(p_protegido_id uuid)
returns table (
  id uuid,
  sentido public.sentido_ruta,
  geojson jsonb,
  corredor_m int,
  duracion_esperada_min int,
  actualizado_en timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (private.es_guardian_de(p_protegido_id) or private.es_el_protegido(p_protegido_id)) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  perform private.registrar_auditoria('protegidos', p_protegido_id, 'LEER_RUTAS');

  return query
  select r.id, r.sentido, extensions.st_asgeojson(r.geometria)::jsonb,
         r.corredor_m, r.duracion_esperada_min, r.actualizado_en
  from public.rutas r
  where r.protegido_id = p_protegido_id
  order by r.sentido;
end;
$$;

-- E4-01: el menor inicia su trayecto con un toque; hora del servidor.
create function public.iniciar_trayecto(p_ruta_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_protegido uuid;
  v_id uuid;
begin
  select r.protegido_id into v_protegido
  from public.rutas r
  where r.id = p_ruta_id;

  if not found or not private.es_el_protegido(v_protegido) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  if not exists (select 1 from public.protegidos where id = v_protegido and estado = 'ACTIVO') then
    raise exception 'El menor no está activo' using errcode = 'P0001';
  end if;

  begin
    insert into public.trayectos (protegido_id, ruta_id)
    values (v_protegido, p_ruta_id)
    returning id into v_id;
  exception when unique_violation then
    raise exception 'Ya hay un trayecto en curso' using errcode = 'P0001';
  end;

  perform private.registrar_auditoria('trayectos', v_id, 'INICIAR_TRAYECTO');
  return v_id;
end;
$$;

-- E2-01: el guardián crea una invitación de un solo uso que vence en 72 h.
-- El token se devuelve una sola vez; solo se guarda su hash.
create function public.crear_invitacion(p_protegido_id uuid)
returns table (id uuid, token text, vence_en timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token text;
  v_id uuid;
  v_vence timestamptz;
begin
  if not private.es_guardian_de(p_protegido_id) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  if not exists (select 1 from public.protegidos p where p.id = p_protegido_id and p.estado = 'ACTIVO') then
    raise exception 'El menor no está activo' using errcode = 'P0001';
  end if;

  if (
    select count(*) from public.contactos_apoyo c
    where c.guardian_id = auth.uid() and c.creado_en > now() - interval '1 hour'
  ) >= 10 then
    raise exception 'Demasiadas invitaciones' using errcode = 'NX429';
  end if;

  v_token := translate(encode(extensions.gen_random_bytes(18), 'base64'), '+/', '-_');

  insert into public.contactos_apoyo (guardian_id, protegido_id, token_hash)
  values (auth.uid(), p_protegido_id, private.hash_token(v_token))
  returning contactos_apoyo.id, contactos_apoyo.vence_en into v_id, v_vence;

  perform private.registrar_auditoria('contactos_apoyo', v_id, 'CREAR_INVITACION');
  return query select v_id, v_token, v_vence;
end;
$$;

-- E2-01, D17: datos mínimos para la pantalla de la invitación (W6).
create function public.ver_invitacion(p_token text)
returns table (menor text, guardian text)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  return query
  select split_part(trim(p.nombre), ' ', 1), g.nombre
  from public.contactos_apoyo c
  join public.protegidos p on p.id = c.protegido_id
  join public.guardianes g on g.id = c.guardian_id
  where c.token_hash = private.hash_token(p_token)
    and c.aceptada_en is null
    and c.vence_en > now();

  if not found then
    raise exception 'Invitación no válida' using errcode = 'NX410';
  end if;
end;
$$;

-- E2-01: un contacto de apoyo que ya tiene cuenta acepta otra invitación.
create function public.aceptar_invitacion(p_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null or private.rol_actual() <> 'apoyo' then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  begin
    update public.contactos_apoyo
    set usuario_id = auth.uid(),
        nombre = nullif(trim(auth.jwt() -> 'user_metadata' ->> 'nombre'), ''),
        aceptada_en = now()
    where token_hash = private.hash_token(p_token)
      and aceptada_en is null
      and vence_en > now()
    returning id into v_id;
  exception when unique_violation then
    v_id := null;
  end;

  if v_id is null then
    raise exception 'Invitación no válida' using errcode = 'NX410';
  end if;

  perform private.registrar_auditoria('contactos_apoyo', v_id, 'ACEPTAR_INVITACION');
  return v_id;
end;
$$;

revoke all on function public.guardar_ruta(uuid, public.sentido_ruta, jsonb, int, int) from public, anon;
revoke all on function public.obtener_rutas(uuid) from public, anon;
revoke all on function public.iniciar_trayecto(uuid) from public, anon;
revoke all on function public.crear_invitacion(uuid) from public, anon;
revoke all on function public.aceptar_invitacion(text) from public, anon;
revoke all on function public.ver_invitacion(text) from public;
grant execute on function public.ver_invitacion(text) to anon, authenticated;
