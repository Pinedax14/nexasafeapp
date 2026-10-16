-- Pruebas del Sprint 04: bitácora (E9-01), "voy en camino" (E7-02), cierre
-- clasificado (E9-02), puesto de control (E8-01), aviso push (E7-01) y RF-41
-- (E11-04), con sus políticas RLS (RNF-27).
begin;
create extension if not exists pgtap with schema extensions;
select plan(46);

insert into public.colegios (id, nombre, nit) values
  ('c0000000-0000-0000-0000-000000000001', 'Colegio X', '800000001'),
  ('c0000000-0000-0000-0000-000000000002', 'Colegio Y', '800000002');

insert into auth.users (id, email, raw_user_meta_data, raw_app_meta_data, aud, role) values
  ('10000000-0000-0000-0000-000000000001', 'g1@example.com', '{"nombre": "Ana Guardiana"}', null, 'authenticated', 'authenticated'),
  ('10000000-0000-0000-0000-000000000002', 'g2@example.com', '{"nombre": "Otro Guardián"}', null, 'authenticated', 'authenticated'),
  ('40000000-0000-0000-0000-000000000001', 'protegido-1@example.org', '{}', '{"rol": "protegido"}', 'authenticated', 'authenticated'),
  ('30000000-0000-0000-0000-000000000001', 'apoyo@example.com', '{}', '{"rol": "apoyo"}', 'authenticated', 'authenticated'),
  ('20000000-0000-0000-0000-000000000001', 'i1@example.com', '{}', '{"rol": "institucion"}', 'authenticated', 'authenticated'),
  ('20000000-0000-0000-0000-000000000002', 'i2@example.com', '{}', '{"rol": "institucion"}', 'authenticated', 'authenticated');

insert into public.personal_institucion (id, colegio_id, nombre) values
  ('20000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Coordinación X'),
  ('20000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'Coordinación Y');

insert into public.protegidos (id, guardian_id, colegio_id, nombre, documento_cifrado, documento_huella, estado, usuario_id) values
  ('a0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001',
   'Menor Uno Pérez', '\x00', 'h1', 'ACTIVO', '40000000-0000-0000-0000-000000000001');

insert into public.contactos_apoyo (guardian_id, protegido_id, token_hash, usuario_id, nombre, aceptada_en) values
  ('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'x',
   '30000000-0000-0000-0000-000000000001', 'Tía Rosa', now());

insert into public.rutas (id, protegido_id, sentido, geometria, corredor_m, duracion_esperada_min) values
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'CASA_COLEGIO',
   'SRID=4326;LINESTRING(-74.08 4.60, -74.07 4.605)', 50, 25);

-- ---------------------------------------------------------------------------
-- Estructura y permisos
-- ---------------------------------------------------------------------------
select ok((select relrowsecurity from pg_class where oid = 'public.eventos_incidente'::regclass), 'RLS activo en eventos_incidente');
select ok((select relrowsecurity from pg_class where oid = 'public.dispositivos_push'::regclass), 'RLS activo en dispositivos_push');
select ok(exists (select 1 from vault.secrets where name = 'notify_push_secret'), 'el secreto de notify-push vive en Vault (D25)');
select ok(not has_table_privilege('authenticated', 'public.eventos_incidente', 'INSERT, UPDATE, DELETE'),
  'los clientes no escriben en la bitácora');
select ok(not has_table_privilege('authenticated', 'public.dispositivos_push', 'SELECT'), 'nadie lee los tokens push');
select ok(not has_function_privilege('authenticated', 'public.tomar_alerta_para_aviso(uuid)', 'EXECUTE'),
  'solo notify-push (service_role) toma alertas para avisar');

-- ---------------------------------------------------------------------------
-- RF-41 y D26: en un trayecto sin alerta solo el guardián ve la posición
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub": "40000000-0000-0000-0000-000000000001", "role": "authenticated", "app_metadata": {"rol": "protegido"}}';
select lives_ok($$select public.iniciar_trayecto('b0000000-0000-0000-0000-000000000001')$$, 'el menor inicia su trayecto');
select is((select aceptada from public.registrar_posicion(4.6, -74.08, 10, now())), true, 'posición del trayecto aceptada');

set local request.jwt.claims = '{"sub": "30000000-0000-0000-0000-000000000001", "role": "authenticated", "app_metadata": {"rol": "apoyo"}}';
select is((select count(*)::int from public.obtener_ultima_posicion('a0000000-0000-0000-0000-000000000001')), 0,
  'el contacto de apoyo no ve la posición del trayecto (RF-41)');
set local request.jwt.claims = '{"sub": "20000000-0000-0000-0000-000000000001", "role": "authenticated", "app_metadata": {"rol": "institucion"}}';
select is((select count(*)::int from public.obtener_ultima_posicion('a0000000-0000-0000-0000-000000000001')), 0,
  'el colegio no ve la posición del trayecto (RF-41)');
set local request.jwt.claims = '{"sub": "10000000-0000-0000-0000-000000000001", "role": "authenticated", "app_metadata": {"rol": "guardian"}}';
select is((select count(*)::int from public.obtener_ultima_posicion('a0000000-0000-0000-0000-000000000001')), 1,
  'el guardián sí ve la posición del trayecto');

-- ---------------------------------------------------------------------------
-- Alerta: visibilidad (D26) y bitácora (E9-01)
-- ---------------------------------------------------------------------------
set local request.jwt.claims = '{"sub": "40000000-0000-0000-0000-000000000001", "role": "authenticated", "app_metadata": {"rol": "protegido"}}';
select is((select estado::text from public.disparar_alerta()), 'ENVIADA', 'el menor dispara una alerta');
reset role;
update public.posiciones set recibida_en = now() - interval '30 seconds';
set local role authenticated;
select is((select alerta_activa from public.registrar_posicion(4.6005, -74.0795, 10, now())), true,
  'posición durante la alerta aceptada');

reset role;
select ok(exists (select 1 from public.eventos_incidente where tipo_evento = 'DISPARADA'
                  and actor_id = '40000000-0000-0000-0000-000000000001'), 'el disparo queda en la bitácora');
set local role authenticated;

set local request.jwt.claims = '{"sub": "30000000-0000-0000-0000-000000000001", "role": "authenticated", "app_metadata": {"rol": "apoyo"}}';
select is((select menor from public.listar_alertas(true)), 'Menor', 'el contacto de apoyo ve la alerta con el primer nombre (D17)');
select is((select count(*)::int from public.obtener_ultima_posicion('a0000000-0000-0000-0000-000000000001')), 1,
  'el contacto de apoyo ve la posición de la alerta activa');
select is((select count(*)::int from public.alertas), 1, 'RLS: el contacto de apoyo lee la alerta');

set local request.jwt.claims = '{"sub": "20000000-0000-0000-0000-000000000001", "role": "authenticated", "app_metadata": {"rol": "institucion"}}';
select is((select menor from public.listar_alertas(true)), 'Menor Uno Pérez', 'el colegio del menor ve la alerta');
select is((select count(*)::int from public.obtener_ultima_posicion('a0000000-0000-0000-0000-000000000001')), 1,
  'el colegio ve la posición de la alerta activa');

set local request.jwt.claims = '{"sub": "20000000-0000-0000-0000-000000000002", "role": "authenticated", "app_metadata": {"rol": "institucion"}}';
select is((select count(*)::int from public.listar_alertas(false)), 0, 'otro colegio no ve la alerta');
select throws_ok($$select * from public.obtener_ultima_posicion('a0000000-0000-0000-0000-000000000001')$$,
  '42501', null, 'otro colegio no ve la posición');

set local request.jwt.claims = '{"sub": "10000000-0000-0000-0000-000000000002", "role": "authenticated", "app_metadata": {"rol": "guardian"}}';
select is((select count(*)::int from public.alertas), 0, 'el guardián de otro menor no ve la alerta');

-- ---------------------------------------------------------------------------
-- "Voy en camino" (E7-02, D28)
-- ---------------------------------------------------------------------------
set local request.jwt.claims = '{"sub": "20000000-0000-0000-0000-000000000001", "role": "authenticated", "app_metadata": {"rol": "institucion"}}';
select throws_ok($$select public.responder_alerta((select id from public.alertas limit 1))$$,
  '42501', null, 'el colegio no marca "voy en camino"');

set local request.jwt.claims = '{"sub": "30000000-0000-0000-0000-000000000001", "role": "authenticated", "app_metadata": {"rol": "apoyo"}}';
select lives_ok($$select public.responder_alerta((select id from public.alertas limit 1))$$,
  'el contacto de apoyo marca "voy en camino"');
select lives_ok($$select public.responder_alerta((select id from public.alertas limit 1))$$, 'responder dos veces no falla');
reset role;
select is((select estado::text from public.alertas), 'ATENDIDA', 'la alerta pasa a ATENDIDA');
select is((select count(*)::int from public.eventos_incidente where tipo_evento = 'VOY_EN_CAMINO'), 1,
  'la respuesta queda una sola vez en la bitácora');
set local role authenticated;

-- ---------------------------------------------------------------------------
-- Cierre clasificado (E9-02, D29)
-- ---------------------------------------------------------------------------
select throws_ok($$select public.cerrar_alerta((select id from public.alertas limit 1), 'SITUACION_RESUELTA', null)$$,
  '42501', null, 'el contacto de apoyo no cierra la alerta');

set local request.jwt.claims = '{"sub": "20000000-0000-0000-0000-000000000001", "role": "authenticated", "app_metadata": {"rol": "institucion"}}';
select throws_ok(format($$select public.cerrar_alerta((select id from public.alertas limit 1), 'SITUACION_RESUELTA', %L)$$, repeat('x', 281)),
  '22023', null, 'una nota de más de 280 caracteres se rechaza');
select lives_ok($$select public.cerrar_alerta((select id from public.alertas limit 1), 'SITUACION_RESUELTA', 'Llegó bien')$$,
  'el colegio cierra la alerta clasificándola');
select throws_ok($$select public.cerrar_alerta((select id from public.alertas limit 1), 'FALSA_ALARMA', null)$$,
  'P0001', null, 'una alerta cerrada no se vuelve a cerrar');
reset role;
select ok((select estado = 'CERRADA' and clasificacion = 'SITUACION_RESUELTA' and cerrada_en is not null
                  and cerrada_por = '20000000-0000-0000-0000-000000000001' from public.alertas),
  'queda CERRADA con clasificación, hora y quién la cerró');
set local role authenticated;

-- Bitácora completa, en orden y con nombres.
set local request.jwt.claims = '{"sub": "10000000-0000-0000-0000-000000000001", "role": "authenticated", "app_metadata": {"rol": "guardian"}}';
select is((select array_agg(tipo_evento::text || ':' || actor) from public.obtener_bitacora((select id from public.alertas limit 1))),
  array['DISPARADA:Menor', 'VOY_EN_CAMINO:Tía Rosa', 'CERRADA:Coordinación X'],
  'la bitácora muestra cada evento con su actor (E9-01)');
set local request.jwt.claims = '{"sub": "10000000-0000-0000-0000-000000000002", "role": "authenticated", "app_metadata": {"rol": "guardian"}}';
select throws_ok($$select * from public.obtener_bitacora((select id from public.alertas limit 1))$$,
  '42501', null, 'otro guardián no lee la bitácora');

-- E11-04: sin trayecto ni alerta activos no hay posiciones.
reset role;
update public.trayectos set estado = 'CERRADO', fin_en = now();
update public.posiciones set recibida_en = now() - interval '1 minute';
set local role authenticated;
set local request.jwt.claims = '{"sub": "40000000-0000-0000-0000-000000000001", "role": "authenticated", "app_metadata": {"rol": "protegido"}}';
select throws_ok($$select * from public.registrar_posicion(4.6, -74.08, 10, now())$$,
  'NX409', null, 'con la alerta cerrada y sin trayecto se rechaza la posición (RF-41)');

-- Bitácora append-only, incluso para el dueño de la base.
reset role;
select throws_ok($$update public.eventos_incidente set detalle = 'cambio'$$, '42501', null, 'la bitácora no se modifica (RF-32)');
select throws_ok($$delete from public.eventos_incidente$$, '42501', null, 'la bitácora no se borra (RF-32)');

-- ---------------------------------------------------------------------------
-- Tokens push y aviso (E7-01, D25)
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub": "10000000-0000-0000-0000-000000000001", "role": "authenticated", "app_metadata": {"rol": "guardian"}}';
select throws_ok($$select public.registrar_dispositivo('token-falso')$$, '22023', null, 'un token con otro formato se rechaza');
select lives_ok($$select public.registrar_dispositivo('ExponentPushToken[guardian-token-1]')$$, 'el guardián registra su teléfono');
set local request.jwt.claims = '{"sub": "40000000-0000-0000-0000-000000000001", "role": "authenticated", "app_metadata": {"rol": "protegido"}}';
select throws_ok($$select public.registrar_dispositivo('ExponentPushToken[protegido-token-1]')$$, '42501', null,
  'el menor no recibe avisos de alertas');

reset role;
insert into public.alertas (id, protegido_id, cancelable_hasta) values
  ('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', now() - interval '1 second');
select is((select tokens from public.tomar_alerta_para_aviso('e0000000-0000-0000-0000-000000000001')),
  array['ExponentPushToken[guardian-token-1]'], 'tras la ventana se avisa a quienes registraron su teléfono');
select is((select count(*)::int from public.tomar_alerta_para_aviso('e0000000-0000-0000-0000-000000000001')), 0,
  'la misma alerta no se avisa dos veces');
select ok(exists (select 1 from public.eventos_incidente where alerta_id = 'e0000000-0000-0000-0000-000000000001'
                  and tipo_evento = 'NOTIFICADA' and actor_id is null), 'el aviso queda en la bitácora');
update public.alertas set estado = 'CERRADA' where id = 'e0000000-0000-0000-0000-000000000001';
insert into public.alertas (id, protegido_id, estado, cancelable_hasta) values
  ('e0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'CANCELADA', now() - interval '1 second');
select is((select count(*)::int from public.tomar_alerta_para_aviso('e0000000-0000-0000-0000-000000000002')), 0,
  'una alerta cancelada no se avisa');

-- ---------------------------------------------------------------------------
-- Gráfico del puesto de control (E8-01)
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub": "20000000-0000-0000-0000-000000000001", "role": "authenticated", "app_metadata": {"rol": "institucion"}}';
select ok(exists (select 1 from public.resumen_alertas_colegio(14) where clasificacion = 'SITUACION_RESUELTA' and total = 1),
  'el colegio ve los conteos por clasificación');
set local request.jwt.claims = '{"sub": "10000000-0000-0000-0000-000000000001", "role": "authenticated", "app_metadata": {"rol": "guardian"}}';
select throws_ok($$select * from public.resumen_alertas_colegio(14)$$, '42501', null, 'solo el colegio ve el resumen');

select * from finish();
rollback;
