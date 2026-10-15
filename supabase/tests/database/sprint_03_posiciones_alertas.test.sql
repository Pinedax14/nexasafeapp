-- Pruebas del Sprint 03: alertas (E6-01, E6-03), posiciones (E4-02, E6-05)
-- y cierre por geocerca (E4-03), con sus políticas RLS (RNF-27).
begin;
create extension if not exists pgtap with schema extensions;
select plan(43);

insert into public.colegios (id, nombre, nit) values
  ('c0000000-0000-0000-0000-000000000001', 'Colegio X', '800000001');

insert into auth.users (id, email, raw_user_meta_data, raw_app_meta_data, aud, role) values
  ('10000000-0000-0000-0000-000000000001', 'g1@example.com', '{"nombre": "Guardián Uno"}', null, 'authenticated', 'authenticated'),
  ('10000000-0000-0000-0000-000000000002', 'g2@example.com', '{"nombre": "Guardián Dos"}', null, 'authenticated', 'authenticated'),
  ('40000000-0000-0000-0000-000000000001', 'protegido-1@example.org', '{}', '{"rol": "protegido"}', 'authenticated', 'authenticated'),
  ('40000000-0000-0000-0000-000000000002', 'protegido-2@example.org', '{}', '{"rol": "protegido"}', 'authenticated', 'authenticated'),
  ('30000000-0000-0000-0000-000000000001', 'apoyo@example.com', '{}', '{"rol": "apoyo"}', 'authenticated', 'authenticated'),
  ('20000000-0000-0000-0000-000000000001', 'i1@example.com', '{}', '{"rol": "institucion"}', 'authenticated', 'authenticated');

insert into public.personal_institucion (id, colegio_id, nombre) values
  ('20000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Coordinación');

insert into public.protegidos (id, guardian_id, colegio_id, nombre, documento_cifrado, documento_huella, estado, usuario_id) values
  ('a0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001',
   'Menor Uno', '\x00', 'h1', 'ACTIVO', '40000000-0000-0000-0000-000000000001'),
  ('a0000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001',
   'Menor Dos', '\x00', 'h2', 'ACTIVO', '40000000-0000-0000-0000-000000000002');

insert into public.contactos_apoyo (guardian_id, protegido_id, token_hash, usuario_id, nombre, aceptada_en) values
  ('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'x', '30000000-0000-0000-0000-000000000001', 'Apoyo', now());

-- Ruta de unos 1,1 km hacia el noreste; el destino es el último punto.
insert into public.rutas (id, protegido_id, sentido, geometria, corredor_m, duracion_esperada_min) values
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'CASA_COLEGIO',
   'SRID=4326;LINESTRING(-74.08 4.60, -74.07 4.605)', 50, 25);

-- ---------------------------------------------------------------------------
-- Estructura y RLS
-- ---------------------------------------------------------------------------
select ok((select relrowsecurity from pg_class where oid = 'public.alertas'::regclass), 'RLS activo en alertas');
select ok((select relrowsecurity from pg_class where oid = 'public.posiciones'::regclass), 'RLS activo en posiciones');
select ok(exists (select 1 from vault.secrets where name = 'posiciones_key'), 'la llave de posiciones vive en Vault (D19)');
select ok(not has_table_privilege('authenticated', 'public.posiciones', 'SELECT'), 'nadie lee posiciones directamente');
select ok(not has_table_privilege('authenticated', 'public.alertas', 'INSERT, UPDATE, DELETE'), 'los clientes no escriben en alertas');
select ok(not has_function_privilege('authenticated', 'public.cancelar_alerta_verificada(uuid, uuid, uuid)', 'EXECUTE'),
  'solo auth-pin (service_role) cancela alertas (D23)');

-- ---------------------------------------------------------------------------
-- Posiciones sin trayecto ni alerta
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub": "40000000-0000-0000-0000-000000000001", "role": "authenticated", "app_metadata": {"rol": "protegido"}}';

select throws_ok($$select * from public.registrar_posicion(4.6, -74.08, 10, now())$$,
  'NX409', null, 'sin trayecto ni alerta el servidor rechaza la posición (RF-41)');

set local request.jwt.claims = '{"sub": "10000000-0000-0000-0000-000000000001", "role": "authenticated", "app_metadata": {"rol": "guardian"}}';
select throws_ok($$select * from public.registrar_posicion(4.6, -74.08, 10, now())$$,
  '42501', null, 'un guardián no puede enviar posiciones');

-- ---------------------------------------------------------------------------
-- Trayecto en vivo
-- ---------------------------------------------------------------------------
set local request.jwt.claims = '{"sub": "40000000-0000-0000-0000-000000000001", "role": "authenticated", "app_metadata": {"rol": "protegido"}}';
select lives_ok($$select public.iniciar_trayecto('b0000000-0000-0000-0000-000000000001')$$, 'el menor inicia su trayecto');

select is((select aceptada from public.registrar_posicion(4.6, -74.08, 10, now())), true,
  'con trayecto EN_CURSO la posición se acepta');
select is((select aceptada from public.registrar_posicion(4.6001, -74.0801, 10, now())), false,
  'una segunda posición en el mismo segundo se descarta');
select throws_ok($$select * from public.registrar_posicion(40.41, -3.70, 10, now())$$,
  '22023', null, 'posición fuera de Colombia rechazada');

reset role;
-- Simula que la primera posición llegó hace 30 s.
update public.posiciones set recibida_en = now() - interval '30 seconds';
set local role authenticated;

select is((select aceptada from public.registrar_posicion(4.6, -74.08, 150, now())), false,
  'precisión peor de 100 m se descarta');
select is((select aceptada from public.registrar_posicion(4.7, -74.08, 10, now())), false,
  'un salto de 11 km en 30 s (más de 200 km/h) se descarta');
select is((select trayecto_activo from public.registrar_posicion(4.6005, -74.0795, 10, now())), true,
  'una posición plausible se acepta y el trayecto sigue activo');

reset role;
select is((select count(*)::int from public.posiciones), 2, 'solo se guardaron las 2 posiciones aceptadas');
select ok((select pg_typeof(ubicacion_cifrada)::text = 'bytea' and position('4.6' in encode(ubicacion_cifrada, 'escape')) = 0
           from public.posiciones limit 1), 'la ubicación se guarda cifrada (RNF-02)');
set local role authenticated;

-- Guardián del menor: lee la última posición, auditada.
set local request.jwt.claims = '{"sub": "10000000-0000-0000-0000-000000000001", "role": "authenticated", "app_metadata": {"rol": "guardian"}}';
select is((select lat from public.obtener_ultima_posicion('a0000000-0000-0000-0000-000000000001')), 4.6005::double precision,
  'el guardián lee la última posición descifrada');
reset role;
select ok(exists (select 1 from public.audit_log where accion = 'LEER_POSICION'
                  and actor_id = '10000000-0000-0000-0000-000000000001'), 'la lectura queda en audit_log');
set local role authenticated;
select ok(private.puede_escuchar_canal('protegido:a0000000-0000-0000-0000-000000000001'),
  'el guardián puede escuchar el canal de su menor (D20)');

-- Otros roles no ven la posición ni escuchan el canal.
set local request.jwt.claims = '{"sub": "10000000-0000-0000-0000-000000000002", "role": "authenticated", "app_metadata": {"rol": "guardian"}}';
select throws_ok($$select * from public.obtener_ultima_posicion('a0000000-0000-0000-0000-000000000001')$$,
  '42501', null, 'el guardián de otro menor no lee la posición');
select ok(not private.puede_escuchar_canal('protegido:a0000000-0000-0000-0000-000000000001'),
  'el guardián de otro menor no escucha el canal');

-- ---------------------------------------------------------------------------
-- Roles sin acceso
-- ---------------------------------------------------------------------------
set local request.jwt.claims = '{"sub": "30000000-0000-0000-0000-000000000001", "role": "authenticated", "app_metadata": {"rol": "apoyo"}}';
select throws_ok($$select * from public.obtener_ultima_posicion('a0000000-0000-0000-0000-000000000001')$$,
  '42501', null, 'el contacto de apoyo no lee la posición (D8)');
select ok(not private.puede_escuchar_canal('protegido:a0000000-0000-0000-0000-000000000001'),
  'el contacto de apoyo no escucha el canal');

set local request.jwt.claims = '{"sub": "20000000-0000-0000-0000-000000000001", "role": "authenticated", "app_metadata": {"rol": "institucion"}}';
select throws_ok($$select * from public.obtener_ultima_posicion('a0000000-0000-0000-0000-000000000001')$$,
  '42501', null, 'el personal del colegio no lee la posición');
select ok(not private.puede_escuchar_canal('otro-canal'), 'un canal con otro formato se rechaza');

-- ---------------------------------------------------------------------------
-- Geocerca
-- ---------------------------------------------------------------------------
reset role;
update public.posiciones set recibida_en = now() - interval '2 minutes';
set local role authenticated;
set local request.jwt.claims = '{"sub": "40000000-0000-0000-0000-000000000001", "role": "authenticated", "app_metadata": {"rol": "protegido"}}';

select is((select trayecto_cerrado from public.registrar_posicion(4.6049, -74.0701, 8, now())), true,
  'a menos de 50 m del destino el trayecto se cierra (D21)');
reset role;
select is((select estado::text from public.trayectos where ruta_id = 'b0000000-0000-0000-0000-000000000001'), 'CERRADO',
  'el trayecto queda CERRADO');
select ok((select fin_en is not null from public.trayectos where ruta_id = 'b0000000-0000-0000-0000-000000000001'),
  'fin_en con la hora del servidor');
select ok(exists (select 1 from public.audit_log where accion = 'CERRAR_TRAYECTO'), 'el cierre queda en audit_log');

-- ---------------------------------------------------------------------------
-- Alertas
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub": "10000000-0000-0000-0000-000000000001", "role": "authenticated", "app_metadata": {"rol": "guardian"}}';
select throws_ok($$select * from public.disparar_alerta()$$, '42501', null, 'un guardián no dispara alertas');
select is((select count(*)::int from public.obtener_ultima_posicion('a0000000-0000-0000-0000-000000000001')), 0,
  'con el trayecto cerrado el guardián ya no ve la posición (RF-41)');

set local request.jwt.claims = '{"sub": "40000000-0000-0000-0000-000000000001", "role": "authenticated", "app_metadata": {"rol": "protegido"}}';
select is((select estado::text from public.disparar_alerta()), 'ENVIADA', 'el menor dispara una alerta sin trayecto (D22)');
select is((select count(*)::int from public.alertas), 1, 'disparar otra vez con una alerta activa no crea otra');
select ok((select cancelable_hasta = creada_en + interval '10 seconds' from public.alertas),
  'la ventana de cancelación es de 10 s con hora del servidor');
select is((select alerta_activa from public.registrar_posicion(4.6049, -74.0701, 8, now())), true,
  'durante la alerta se aceptan posiciones sin trayecto (E6-05)');

reset role;
select ok(exists (select 1 from public.audit_log where accion = 'DISPARAR_ALERTA'), 'el disparo queda en audit_log');
select is(public.cancelar_alerta_verificada(
  (select id from public.alertas), 'a0000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002'),
  false, 'no se cancela la alerta de otro menor');
select is(public.cancelar_alerta_verificada(
  (select id from public.alertas), 'a0000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001'),
  true, 'dentro de la ventana la alerta se cancela (E6-03)');
select ok(exists (select 1 from public.audit_log where accion = 'CANCELAR_ALERTA'), 'la cancelación queda en audit_log');

-- Ventana vencida y límite de alertas.
set local role authenticated;
select lives_ok($$select * from public.disparar_alerta()$$, 'segunda alerta tras cancelar la primera');
reset role;
update public.alertas set cancelable_hasta = now() - interval '1 second' where estado = 'ENVIADA';
select is(public.cancelar_alerta_verificada(
  (select id from public.alertas where estado = 'ENVIADA'), 'a0000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001'),
  false, 'pasados 10 s la alerta no se cancela');
update public.alertas set estado = 'CERRADA' where estado = 'ENVIADA';
insert into public.alertas (protegido_id, estado) values ('a0000000-0000-0000-0000-000000000001', 'CERRADA');
set local role authenticated;
select throws_ok($$select * from public.disparar_alerta()$$, 'NX429', null,
  'más de 3 alertas en 10 minutos se rechazan (RNF-06)');

select * from finish();
rollback;
