-- Sprint 03 — Ubicación en vivo (E4-02, E6-05), cierre por geocerca (E4-03),
-- botón de pánico (E6-01) y cancelación con PIN (E6-03).
-- Decisiones aprobadas: docs/scrum/sprint-03/refinement.md (D18–D24, 15/10/2026).
-- Reglas: RLS en todas las tablas, sin acceso para `anon`, cambios solo mediante
-- funciones que verifican el rol y escriben en audit_log.

-- ---------------------------------------------------------------------------
-- Llave de cifrado de las posiciones (RNF-02, D19).
-- Se genera dentro de cada base de datos; nunca está en el repositorio.
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'posiciones_key') then
    perform vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'base64'),
      'posiciones_key',
      'Llave de cifrado de posiciones.ubicacion_cifrada (RNF-02)'
    );
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------
-- Fase 1. MANUAL_SACUDIDA y AUTOMATICA_DESVIO se agregan en la fase 2.
create type public.tipo_alerta as enum ('MANUAL_BOTON');
create type public.estado_alerta as enum ('ENVIADA', 'CANCELADA', 'ATENDIDA', 'CERRADA');

-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------
-- D22: la alerta pertenece al menor; el trayecto es opcional porque el botón
-- funciona con o sin trayecto.
create table public.alertas (
  id uuid primary key default gen_random_uuid(),
  protegido_id uuid not null references public.protegidos (id),
  trayecto_id uuid references public.trayectos (id),
  tipo public.tipo_alerta not null default 'MANUAL_BOTON',
  estado public.estado_alerta not null default 'ENVIADA',
  creada_en timestamptz not null default now(),
  cancelable_hasta timestamptz not null default now() + interval '10 seconds'
);
create index alertas_protegido_idx on public.alertas (protegido_id, creada_en);
-- Una sola alerta activa por menor.
create unique index alertas_una_activa_key on public.alertas (protegido_id)
  where estado in ('ENVIADA', 'ATENDIDA');

-- D19: posiciones cifradas, solo durante un trayecto o una alerta activos.
create table public.posiciones (
  id bigint generated always as identity primary key,
  protegido_id uuid not null references public.protegidos (id),
  trayecto_id uuid references public.trayectos (id),
  alerta_id uuid references public.alertas (id),
  ubicacion_cifrada bytea not null,
  precision_m real not null,
  capturada_en timestamptz not null,
  recibida_en timestamptz not null default now(),
  check (trayecto_id is not null or alerta_id is not null)
);
create index posiciones_protegido_idx on public.posiciones (protegido_id, recibida_en desc);

-- ---------------------------------------------------------------------------
-- Funciones auxiliares (esquema privado)
-- ---------------------------------------------------------------------------
create function private.llave_posiciones()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'posiciones_key';
$$;

-- Menor de la sesión actual (rol protegido), o null.
create function private.protegido_actual()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.id from public.protegidos p
  where private.rol_actual() = 'protegido' and p.usuario_id = auth.uid();
$$;

-- D20: canal privado de Realtime de cada menor ("protegido:<id>").
create function private.puede_escuchar_canal(p_topic text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if p_topic !~ '^protegido:[0-9a-f-]{36}$' then
    return false;
  end if;
  return private.es_guardian_de(substring(p_topic from 11)::uuid);
end;
$$;

-- Publica en el canal del menor. Si Realtime no existe en la base (pruebas
-- locales solo con Postgres), no hace nada.
create function private.publicar_en_canal(p_protegido_id uuid, p_evento text, p_datos jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if to_regprocedure('realtime.send(jsonb,text,text,boolean)') is not null then
    execute 'select realtime.send($1, $2, $3, true)'
      using p_datos, p_evento, 'protegido:' || p_protegido_id;
  end if;
end;
$$;

revoke all on function private.llave_posiciones() from public, anon, authenticated;
revoke all on function private.protegido_actual() from public, anon, authenticated;
revoke all on function private.puede_escuchar_canal(text) from public, anon;
revoke all on function private.publicar_en_canal(uuid, text, jsonb) from public, anon, authenticated;
grant execute on function private.puede_escuchar_canal(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Permisos y RLS
-- ---------------------------------------------------------------------------
alter table public.alertas enable row level security;
alter table public.posiciones enable row level security;

revoke all on public.alertas, public.posiciones from anon, authenticated;

-- alertas: lectura del propio menor y de su guardián; el alta la hace
-- disparar_alerta y la cancelación la Edge Function auth-pin.
grant select on public.alertas to authenticated;

create policy alertas_lectura_protegido on public.alertas
  for select to authenticated
  using (private.es_el_protegido(protegido_id));
create policy alertas_lectura_guardian on public.alertas
  for select to authenticated
  using (private.es_guardian_de(protegido_id));

-- posiciones: sin acceso directo. Se escriben con registrar_posicion y la
-- última se lee con obtener_ultima_posicion (auditada).

-- Realtime (D20): solo el guardián del menor escucha su canal privado; nadie
-- publica desde el cliente.
do $$
begin
  if to_regclass('realtime.messages') is not null then
    execute $p$
      create policy canal_protegido_guardian on realtime.messages
        for select to authenticated
        using (
          realtime.messages.extension = 'broadcast'
          and private.puede_escuchar_canal(realtime.topic())
        )
    $p$;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Funciones públicas (RPC)
-- ---------------------------------------------------------------------------

-- E6-01 (D22): el menor dispara la alerta tras mantener el botón 3 s. Si ya
-- tiene una alerta activa, devuelve esa.
create function public.disparar_alerta()
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
    perform private.publicar_en_canal(v_protegido, 'alerta', jsonb_build_object('id', v_id, 'estado', 'ENVIADA'));
  end if;

  return query
  select a.id, a.estado, a.creada_en, a.cancelable_hasta
  from public.alertas a
  where a.id = v_id;
end;
$$;

-- E6-03 (D23): la Edge Function auth-pin cancela la alerta después de
-- verificar el PIN. Solo dentro de la ventana de 10 s, con hora del servidor.
create function public.cancelar_alerta_verificada(p_alerta_id uuid, p_protegido_id uuid, p_actor_id uuid)
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
  perform private.publicar_en_canal(p_protegido_id, 'alerta', jsonb_build_object('id', v_id, 'estado', 'CANCELADA'));
  return true;
end;
$$;

-- E4-02, E6-05, E4-03 (D19, D20, D21): el menor envía su posición. Solo se
-- guarda con un trayecto EN_CURSO o una alerta activa (RF-41). Devuelve si
-- la posición se aceptó y qué sigue activo, para que la app sepa cuándo parar.
create function public.registrar_posicion(
  p_lat double precision,
  p_lng double precision,
  p_precision_m real,
  p_capturada_en timestamptz
)
returns table (aceptada boolean, trayecto_activo boolean, alerta_activa boolean, trayecto_cerrado boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_protegido uuid := private.protegido_actual();
  v_trayecto uuid;
  v_ruta uuid;
  v_alerta uuid;
  v_punto extensions.geography;
  v_anterior record;
  v_anterior_punto extensions.geography;
  v_segundos double precision;
  v_cerrado boolean := false;
begin
  if v_protegido is null then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  select t.id, t.ruta_id into v_trayecto, v_ruta
  from public.trayectos t
  where t.protegido_id = v_protegido and t.estado = 'EN_CURSO';

  select a.id into v_alerta
  from public.alertas a
  where a.protegido_id = v_protegido and a.estado in ('ENVIADA', 'ATENDIDA');

  if v_trayecto is null and v_alerta is null then
    raise exception 'Sin trayecto ni alerta activos' using errcode = 'NX409';
  end if;

  -- Datos válidos, dentro de Colombia (D15) y con precisión útil (RNF-10).
  if p_lat is null or p_lng is null or p_precision_m is null or p_capturada_en is null
     or p_lat not between -4.3 and 13.5 or p_lng not between -82 and -66
     or p_precision_m < 0 then
    raise exception 'Posición inválida' using errcode = '22023';
  end if;

  v_punto := extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography;

  select p.ubicacion_cifrada, p.recibida_en into v_anterior
  from public.posiciones p
  where p.protegido_id = v_protegido
  order by p.recibida_en desc
  limit 1;

  -- Máximo una posición por segundo; precisión peor de 100 m se descarta.
  if p_precision_m > 100 or (v_anterior.recibida_en is not null and v_anterior.recibida_en > now() - interval '1 second') then
    return query select false, v_trayecto is not null, v_alerta is not null, false;
    return;
  end if;

  -- Saltos imposibles (más de 200 km/h frente a la posición anterior).
  if v_anterior.recibida_en is not null and v_anterior.recibida_en > now() - interval '10 minutes' then
    v_anterior_punto := (
      select extensions.st_setsrid(
        extensions.st_makepoint(split_part(d, ',', 2)::double precision, split_part(d, ',', 1)::double precision), 4326
      )::extensions.geography
      from extensions.pgp_sym_decrypt(v_anterior.ubicacion_cifrada, private.llave_posiciones()) as d
    );
    v_segundos := greatest(extract(epoch from now() - v_anterior.recibida_en), 1);
    if extensions.st_distance(v_punto, v_anterior_punto) / v_segundos > 55.6 then
      return query select false, v_trayecto is not null, v_alerta is not null, false;
      return;
    end if;
  end if;

  insert into public.posiciones (protegido_id, trayecto_id, alerta_id, ubicacion_cifrada, precision_m, capturada_en)
  values (
    v_protegido, v_trayecto, v_alerta,
    extensions.pgp_sym_encrypt(p_lat::text || ',' || p_lng::text, private.llave_posiciones()),
    p_precision_m, p_capturada_en
  );

  perform private.publicar_en_canal(v_protegido, 'posicion', jsonb_build_object(
    'lat', p_lat, 'lng', p_lng, 'precision_m', p_precision_m, 'recibida_en', now(),
    'trayecto_id', v_trayecto, 'alerta_id', v_alerta
  ));

  -- E4-03 (D21): llegada a menos de 50 m del último punto de la ruta.
  if v_trayecto is not null and extensions.st_dwithin(
    v_punto,
    (select extensions.st_endpoint(r.geometria::extensions.geometry)::extensions.geography
     from public.rutas r where r.id = v_ruta),
    50
  ) then
    update public.trayectos set estado = 'CERRADO', fin_en = now() where id = v_trayecto;
    perform private.registrar_auditoria('trayectos', v_trayecto, 'CERRAR_TRAYECTO');
    perform private.publicar_en_canal(v_protegido, 'trayecto', jsonb_build_object('id', v_trayecto, 'estado', 'CERRADO'));
    v_cerrado := true;
  end if;

  return query select true, v_trayecto is not null and not v_cerrado, v_alerta is not null, v_cerrado;
end;
$$;

-- E4-02 (D20): el guardián lee la última posición al abrir el mapa, solo
-- mientras haya un trayecto o una alerta activos (RF-41). Auditada.
create function public.obtener_ultima_posicion(p_protegido_id uuid)
returns table (lat double precision, lng double precision, precision_m real, recibida_en timestamptz,
               trayecto_id uuid, alerta_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.es_guardian_de(p_protegido_id) then
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
      exists (select 1 from public.trayectos t where t.id = p.trayecto_id and t.estado = 'EN_CURSO')
      or exists (select 1 from public.alertas a where a.id = p.alerta_id and a.estado in ('ENVIADA', 'ATENDIDA'))
    )
  order by p.recibida_en desc
  limit 1;
end;
$$;

revoke all on function public.disparar_alerta() from public, anon;
revoke all on function public.cancelar_alerta_verificada(uuid, uuid, uuid) from public, anon, authenticated;
revoke all on function public.registrar_posicion(double precision, double precision, real, timestamptz) from public, anon;
revoke all on function public.obtener_ultima_posicion(uuid) from public, anon;
grant execute on function public.cancelar_alerta_verificada(uuid, uuid, uuid) to service_role;
