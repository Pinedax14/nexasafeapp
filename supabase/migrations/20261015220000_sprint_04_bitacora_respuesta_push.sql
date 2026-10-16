-- Sprint 04 — Bitácora (E9-01), "voy en camino" (E7-02), cierre clasificado
-- (E9-02), puesto de control (E8-01), aviso push (E7-01) y RF-41 (E11-04).
-- Decisiones aprobadas: docs/scrum/sprint-04/refinement.md (D25–D31, 15/10/2026).
-- Reglas: RLS en todas las tablas, sin acceso para `anon`, cambios solo mediante
-- funciones que verifican el rol y escriben en audit_log y en la bitácora.

create extension if not exists pg_net with schema extensions;

-- ---------------------------------------------------------------------------
-- Secreto compartido con la Edge Function notify-push (D25). Se genera dentro
-- de cada base de datos; nunca está en el repositorio. La URL de la función se
-- guarda en Vault por ambiente ('notify_push_url'); sin ella no se envía aviso.
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'notify_push_secret') then
    perform vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'hex'),
      'notify_push_secret',
      'Secreto compartido con la Edge Function notify-push (D25)'
    );
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------
create type public.tipo_evento_incidente as enum (
  'DISPARADA', 'CANCELADA', 'NOTIFICADA', 'VOY_EN_CAMINO', 'CERRADA'
);
create type public.clasificacion_alerta as enum (
  'FALSA_ALARMA', 'SITUACION_RESUELTA', 'REMITIDA_A_AUTORIDAD'
);

-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------
-- D29: cierre clasificado. D25: notificada_en evita avisar dos veces.
alter table public.alertas
  add column clasificacion public.clasificacion_alerta,
  add column nota text check (length(nota) <= 280),
  add column cerrada_en timestamptz,
  add column cerrada_por uuid references auth.users (id),
  add column notificada_en timestamptz;

-- D27: bitácora append-only (RF-32).
create table public.eventos_incidente (
  id bigint generated always as identity primary key,
  alerta_id uuid not null references public.alertas (id),
  tipo_evento public.tipo_evento_incidente not null,
  actor_id uuid references auth.users (id),
  detalle text check (length(detalle) <= 280),
  creado_en timestamptz not null default now()
);
create index eventos_incidente_alerta_idx on public.eventos_incidente (alerta_id, creado_en);

-- D25: tokens de Expo Push de cada sesión.
create table public.dispositivos_push (
  token text primary key check (token ~ '^ExponentPushToken\[[A-Za-z0-9_-]{10,100}\]$'),
  usuario_id uuid not null references auth.users (id) on delete cascade,
  actualizado_en timestamptz not null default now()
);
create index dispositivos_push_usuario_idx on public.dispositivos_push (usuario_id);

-- ---------------------------------------------------------------------------
-- Funciones auxiliares (esquema privado)
-- ---------------------------------------------------------------------------
create function private.es_apoyo_de(p_protegido_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.rol_actual() = 'apoyo'
     and exists (
       select 1 from public.contactos_apoyo
       where protegido_id = p_protegido_id and usuario_id = auth.uid() and aceptada_en is not null
     );
$$;

create function private.es_personal_de_menor(p_protegido_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.rol_actual() = 'institucion'
     and exists (
       select 1 from public.protegidos p
       where p.id = p_protegido_id and private.es_personal_activo_de(p.colegio_id)
     );
$$;

-- Quién ve una alerta: el menor, su guardián, sus contactos de apoyo y el
-- personal activo de su colegio (D26).
create function private.puede_ver_alerta(p_alerta_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.alertas a
    where a.id = p_alerta_id
      and (
        private.es_el_protegido(a.protegido_id)
        or private.es_guardian_de(a.protegido_id)
        or private.es_apoyo_de(a.protegido_id)
        or private.es_personal_de_menor(a.protegido_id)
      )
  );
$$;

create function private.registrar_evento(
  p_alerta_id uuid,
  p_tipo public.tipo_evento_incidente,
  p_actor_id uuid,
  p_detalle text
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.eventos_incidente (alerta_id, tipo_evento, actor_id, detalle)
  values (p_alerta_id, p_tipo, p_actor_id, p_detalle);
$$;

-- RF-32: nadie modifica ni borra eventos, ni siquiera un rol con privilegios.
create function private.rechazar_cambio_evento()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'La bitácora no se modifica' using errcode = '42501';
end;
$$;

create trigger eventos_incidente_append_only
  before update or delete on public.eventos_incidente
  for each row execute function private.rechazar_cambio_evento();

-- D25: al crear una alerta se pide a notify-push que avise cuando venza la
-- ventana de 10 s. Si el aviso falla, la alerta igual queda creada.
create function private.pedir_aviso_push()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_url text;
  v_secreto text;
begin
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'notify_push_url';
  select decrypted_secret into v_secreto from vault.decrypted_secrets where name = 'notify_push_secret';
  if v_url is null or v_secreto is null or to_regnamespace('net') is null then
    return new;
  end if;
  begin
    execute 'select net.http_post(url := $1, body := $2, headers := $3)'
      using v_url,
            jsonb_build_object('alerta_id', new.id),
            jsonb_build_object('Content-Type', 'application/json', 'x-nexasafe-secret', v_secreto);
  exception when others then
    null;
  end;
  return new;
end;
$$;

create trigger alertas_pedir_aviso_push
  after insert on public.alertas
  for each row execute function private.pedir_aviso_push();

revoke all on function private.es_apoyo_de(uuid) from public, anon;
revoke all on function private.es_personal_de_menor(uuid) from public, anon;
revoke all on function private.puede_ver_alerta(uuid) from public, anon;
revoke all on function private.registrar_evento(uuid, public.tipo_evento_incidente, uuid, text) from public, anon, authenticated;
revoke all on function private.rechazar_cambio_evento() from public, anon, authenticated;
revoke all on function private.pedir_aviso_push() from public, anon, authenticated;
grant execute on function private.es_apoyo_de(uuid) to authenticated;
grant execute on function private.es_personal_de_menor(uuid) to authenticated;
grant execute on function private.puede_ver_alerta(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Permisos y RLS
-- ---------------------------------------------------------------------------
alter table public.eventos_incidente enable row level security;
alter table public.dispositivos_push enable row level security;

revoke all on public.eventos_incidente, public.dispositivos_push from anon, authenticated;

-- D26: el contacto de apoyo y el personal del colegio también leen las alertas.
create policy alertas_lectura_apoyo on public.alertas
  for select to authenticated
  using (private.es_apoyo_de(protegido_id));
create policy alertas_lectura_institucion on public.alertas
  for select to authenticated
  using (private.es_personal_de_menor(protegido_id));

-- eventos_incidente: lectura de quien ve la alerta; nadie escribe directo.
grant select on public.eventos_incidente to authenticated;
create policy eventos_incidente_lectura on public.eventos_incidente
  for select to authenticated
  using (private.puede_ver_alerta(alerta_id));

-- dispositivos_push: sin acceso directo (registrar_dispositivo y
-- borrar_dispositivo).

-- ---------------------------------------------------------------------------
-- Funciones del Sprint 03 con su evento en la bitácora (E9-01)
-- ---------------------------------------------------------------------------
create or replace function public.disparar_alerta()
returns table (id uuid, estado public.estado_alerta, creada_en timestamptz, cancelable_hasta timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_protegido uuid := private.protegido_actual();
  v_id uuid;
begin
  if v_protegido is null then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  if not exists (select 1 from public.protegidos p where p.id = v_protegido and p.estado = 'ACTIVO') then
    raise exception 'El menor no está activo' using errcode = 'P0001';
  end if;

  select a.id into v_id
  from public.alertas a
  where a.protegido_id = v_protegido and a.estado in ('ENVIADA', 'ATENDIDA');

  if v_id is null then
    if (
      select count(*) from public.alertas a
      where a.protegido_id = v_protegido and a.creada_en > now() - interval '10 minutes'
    ) >= 3 then
      raise exception 'Demasiadas alertas' using errcode = 'NX429';
    end if;

    insert into public.alertas (protegido_id, trayecto_id)
    values (
      v_protegido,
      (select t.id from public.trayectos t where t.protegido_id = v_protegido and t.estado = 'EN_CURSO')
    )
    returning alertas.id into v_id;

    perform private.registrar_auditoria('alertas', v_id, 'DISPARAR_ALERTA');
    perform private.registrar_evento(v_id, 'DISPARADA', auth.uid(), null);
    perform private.publicar_en_canal(v_protegido, 'alerta', jsonb_build_object('id', v_id, 'estado', 'ENVIADA'));
  end if;

  return query
  select a.id, a.estado, a.creada_en, a.cancelable_hasta
  from public.alertas a
  where a.id = v_id;
end;
$$;

create or replace function public.cancelar_alerta_verificada(p_alerta_id uuid, p_protegido_id uuid, p_actor_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  update public.alertas
  set estado = 'CANCELADA'
  where id = p_alerta_id
    and protegido_id = p_protegido_id
    and estado = 'ENVIADA'
    and now() < cancelable_hasta
  returning id into v_id;

  if v_id is null then
    return false;
  end if;

  insert into public.audit_log (actor_id, entidad, entidad_id, accion)
  values (p_actor_id, 'alertas', v_id, 'CANCELAR_ALERTA');
  perform private.registrar_evento(v_id, 'CANCELADA', p_actor_id, null);
  perform private.publicar_en_canal(p_protegido_id, 'alerta', jsonb_build_object('id', v_id, 'estado', 'CANCELADA'));
  return true;
end;
$$;

-- D26: el guardián ve la última posición del trayecto o de la alerta; el
-- contacto de apoyo y el personal del colegio, solo la de una alerta activa.
create or replace function public.obtener_ultima_posicion(p_protegido_id uuid)
returns table (lat double precision, lng double precision, precision_m real, recibida_en timestamptz,
               trayecto_id uuid, alerta_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_guardian boolean := private.es_guardian_de(p_protegido_id);
begin
  if not (v_guardian or private.es_apoyo_de(p_protegido_id) or private.es_personal_de_menor(p_protegido_id)) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  perform private.registrar_auditoria('protegidos', p_protegido_id, 'LEER_POSICION');

  return query
  select split_part(d.texto, ',', 1)::double precision, split_part(d.texto, ',', 2)::double precision,
         p.precision_m, p.recibida_en, p.trayecto_id, p.alerta_id
  from public.posiciones p
  cross join lateral (
    select extensions.pgp_sym_decrypt(p.ubicacion_cifrada, private.llave_posiciones()) as texto
  ) d
  where p.protegido_id = p_protegido_id
    and (
      exists (select 1 from public.alertas a where a.id = p.alerta_id and a.estado in ('ENVIADA', 'ATENDIDA'))
      or (v_guardian and exists (
        select 1 from public.trayectos t where t.id = p.trayecto_id and t.estado = 'EN_CURSO'
      ))
    )
  order by p.recibida_en desc
  limit 1;
end;
$$;

-- ---------------------------------------------------------------------------
-- Funciones públicas nuevas (RPC)
-- ---------------------------------------------------------------------------

-- Nombre de una persona para la bitácora y las listas.
create function private.nombre_actor(p_usuario_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select nombre from public.guardianes where id = p_usuario_id),
    (select nombre from public.personal_institucion where id = p_usuario_id),
    (select nombre from public.contactos_apoyo where usuario_id = p_usuario_id and nombre is not null limit 1),
    (select split_part(trim(nombre), ' ', 1) from public.protegidos where usuario_id = p_usuario_id),
    'NexaSafe'
  );
$$;
revoke all on function private.nombre_actor(uuid) from public, anon, authenticated;

-- W11, W13: alertas que ve la sesión. El contacto de apoyo solo ve el primer
-- nombre del menor (D17).
create function public.listar_alertas(p_solo_activas boolean)
returns table (id uuid, protegido_id uuid, menor text, estado public.estado_alerta,
               creada_en timestamptz, cancelable_hasta timestamptz,
               clasificacion public.clasificacion_alerta, cerrada_en timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  return query
  select a.id, a.protegido_id,
         case when private.rol_actual() = 'apoyo' then split_part(trim(p.nombre), ' ', 1) else p.nombre end,
         a.estado, a.creada_en, a.cancelable_hasta, a.clasificacion, a.cerrada_en
  from public.alertas a
  join public.protegidos p on p.id = a.protegido_id
  where private.puede_ver_alerta(a.id)
    and a.estado <> 'CANCELADA'
    and (not p_solo_activas or a.estado in ('ENVIADA', 'ATENDIDA'))
  order by a.creada_en desc
  limit 50;
end;
$$;

-- E9-01: bitácora de una alerta con el nombre de cada actor. Auditada.
create function public.obtener_bitacora(p_alerta_id uuid)
returns table (tipo_evento public.tipo_evento_incidente, actor text, detalle text, creado_en timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.puede_ver_alerta(p_alerta_id) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  perform private.registrar_auditoria('alertas', p_alerta_id, 'LEER_BITACORA');

  return query
  select e.tipo_evento,
         case when e.actor_id is null then 'NexaSafe' else private.nombre_actor(e.actor_id) end,
         e.detalle, e.creado_en
  from public.eventos_incidente e
  where e.alerta_id = p_alerta_id
  order by e.creado_en, e.id;
end;
$$;

-- E7-02 (D28): el guardián o un contacto de apoyo responde "voy en camino".
create function public.responder_alerta(p_alerta_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_protegido uuid;
  v_estado public.estado_alerta;
begin
  select a.protegido_id, a.estado into v_protegido, v_estado
  from public.alertas a where a.id = p_alerta_id;

  if v_protegido is null or not (private.es_guardian_de(v_protegido) or private.es_apoyo_de(v_protegido)) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  if v_estado not in ('ENVIADA', 'ATENDIDA') then
    raise exception 'La alerta ya no está activa' using errcode = 'P0001';
  end if;

  if exists (
    select 1 from public.eventos_incidente e
    where e.alerta_id = p_alerta_id and e.tipo_evento = 'VOY_EN_CAMINO' and e.actor_id = auth.uid()
  ) then
    return;
  end if;

  update public.alertas set estado = 'ATENDIDA' where id = p_alerta_id and estado = 'ENVIADA';
  perform private.registrar_auditoria('alertas', p_alerta_id, 'RESPONDER_ALERTA');
  perform private.registrar_evento(p_alerta_id, 'VOY_EN_CAMINO', auth.uid(), null);
  perform private.publicar_en_canal(v_protegido, 'alerta', jsonb_build_object('id', p_alerta_id, 'estado', 'ATENDIDA'));
end;
$$;

-- E9-02 (D29): el guardián o el personal del colegio cierra y clasifica.
create function public.cerrar_alerta(
  p_alerta_id uuid,
  p_clasificacion public.clasificacion_alerta,
  p_nota text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_protegido uuid;
  v_estado public.estado_alerta;
  v_nota text := nullif(trim(coalesce(p_nota, '')), '');
begin
  select a.protegido_id, a.estado into v_protegido, v_estado
  from public.alertas a where a.id = p_alerta_id;

  if v_protegido is null or not (private.es_guardian_de(v_protegido) or private.es_personal_de_menor(v_protegido)) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  if v_estado not in ('ENVIADA', 'ATENDIDA') then
    raise exception 'La alerta ya no está activa' using errcode = 'P0001';
  end if;

  if p_clasificacion is null or length(coalesce(v_nota, '')) > 280 then
    raise exception 'Datos del cierre inválidos' using errcode = '22023';
  end if;

  update public.alertas
  set estado = 'CERRADA', clasificacion = p_clasificacion, nota = v_nota,
      cerrada_en = now(), cerrada_por = auth.uid()
  where id = p_alerta_id;

  perform private.registrar_auditoria('alertas', p_alerta_id, 'CERRAR_ALERTA');
  perform private.registrar_evento(p_alerta_id, 'CERRADA', auth.uid(), p_clasificacion::text);
  perform private.publicar_en_canal(v_protegido, 'alerta', jsonb_build_object('id', p_alerta_id, 'estado', 'CERRADA'));
end;
$$;

-- E8-01 (D26): conteos de alertas del colegio por día y clasificación, sin
-- datos personales, para el gráfico del puesto de control.
create function public.resumen_alertas_colegio(p_dias int)
returns table (dia date, clasificacion text, total int)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if private.rol_actual() <> 'institucion' then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  return query
  select (a.creada_en at time zone 'America/Bogota')::date,
         coalesce(a.clasificacion::text, 'SIN_CERRAR'),
         count(*)::int
  from public.alertas a
  join public.protegidos p on p.id = a.protegido_id
  where private.es_personal_activo_de(p.colegio_id)
    and a.estado <> 'CANCELADA'
    and a.creada_en > now() - make_interval(days => least(greatest(coalesce(p_dias, 14), 1), 90))
  group by 1, 2
  order by 1, 2;
end;
$$;

-- D25: la sesión registra o quita el token push de su teléfono.
create function public.registrar_dispositivo(p_token text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or private.rol_actual() not in ('guardian', 'apoyo', 'institucion') then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  if coalesce(p_token, '') !~ '^ExponentPushToken\[[A-Za-z0-9_-]{10,100}\]$' then
    raise exception 'Token inválido' using errcode = '22023';
  end if;

  insert into public.dispositivos_push (token, usuario_id)
  values (p_token, auth.uid())
  on conflict (token) do update set usuario_id = excluded.usuario_id, actualizado_en = now();
end;
$$;

create function public.borrar_dispositivo(p_token text)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.dispositivos_push where token = p_token and usuario_id = auth.uid();
$$;

-- D25: notify-push (service_role) toma la alerta una sola vez si sigue
-- ENVIADA tras la ventana y recibe los tokens de quienes deben enterarse.
create function public.tomar_alerta_para_aviso(p_alerta_id uuid)
returns table (menor text, tokens text[])
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_protegido uuid;
begin
  update public.alertas
  set notificada_en = now()
  where id = p_alerta_id
    and estado = 'ENVIADA'
    and notificada_en is null
    and now() >= cancelable_hasta
  returning protegido_id into v_protegido;

  if v_protegido is null then
    return;
  end if;

  perform private.registrar_evento(p_alerta_id, 'NOTIFICADA', null, null);

  return query
  select split_part(trim(p.nombre), ' ', 1),
         coalesce(array_agg(distinct d.token) filter (where d.token is not null), '{}')
  from public.protegidos p
  left join public.dispositivos_push d on d.usuario_id in (
    select p.guardian_id
    union
    select c.usuario_id from public.contactos_apoyo c
    where c.protegido_id = p.id and c.aceptada_en is not null
    union
    select pi.id from public.personal_institucion pi
    where pi.colegio_id = p.colegio_id and pi.activo
  )
  where p.id = v_protegido
  group by p.nombre;
end;
$$;

revoke all on function public.listar_alertas(boolean) from public, anon;
revoke all on function public.obtener_bitacora(uuid) from public, anon;
revoke all on function public.responder_alerta(uuid) from public, anon;
revoke all on function public.cerrar_alerta(uuid, public.clasificacion_alerta, text) from public, anon;
revoke all on function public.resumen_alertas_colegio(int) from public, anon;
revoke all on function public.registrar_dispositivo(text) from public, anon;
revoke all on function public.borrar_dispositivo(text) from public, anon;
revoke all on function public.tomar_alerta_para_aviso(uuid) from public, anon, authenticated;
grant execute on function public.tomar_alerta_para_aviso(uuid) to service_role;
