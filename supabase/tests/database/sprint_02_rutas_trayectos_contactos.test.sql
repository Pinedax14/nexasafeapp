-- Pruebas del Sprint 02: rutas (E3-01a, E3-02, E3-03), trayectos (E4-01) y
-- contactos de apoyo (E2-01), con sus políticas RLS (RNF-27).
begin;
create extension if not exists pgtap with schema extensions;
select plan(46);

insert into public.colegios (id, nombre, nit) values
  ('c0000000-0000-0000-0000-000000000001', 'Colegio X', '800000001');

-- Guardianes (el trigger les asigna el rol), menor con cuenta, personal y administrador.
insert into auth.users (id, email, raw_user_meta_data, raw_app_meta_data, aud, role) values
  ('10000000-0000-0000-0000-000000000001', 'g1@example.com', '{"nombre": "Guardián Uno"}', null, 'authenticated', 'authenticated'),
  ('10000000-0000-0000-0000-000000000002', 'g2@example.com', '{"nombre": "Guardián Dos"}', null, 'authenticated', 'authenticated'),
  ('40000000-0000-0000-0000-000000000001', 'protegido-1@example.org', '{}', '{"rol": "protegido"}', 'authenticated', 'authenticated'),
  ('20000000-0000-0000-0000-000000000001', 'i1@example.com', '{}', '{"rol": "institucion"}', 'authenticated', 'authenticated');

insert into public.personal_institucion (id, colegio_id, nombre) values
  ('20000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Coordinación');

insert into public.protegidos (id, guardian_id, colegio_id, nombre, documento_cifrado, documento_huella, estado, usuario_id) values
  ('a0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001',
   'Menor Uno Pérez', '\x00', 'h1', 'ACTIVO', '40000000-0000-0000-0000-000000000001'),
  ('a0000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001',
   'Menor Pendiente', '\x00', 'h2', 'PENDIENTE_VALIDACION', null),
  ('a0000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001',
   'Menor Tres', '\x00', 'h3', 'ACTIVO', null);

-- ---------------------------------------------------------------------------
-- Rutas: guardar (1–12)
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub": "10000000-0000-0000-0000-000000000001", "role": "authenticated", "app_metadata": {"rol": "guardian"}}';

select lives_ok(
  $$select public.guardar_ruta('a0000000-0000-0000-0000-000000000001', 'CASA_COLEGIO',
    '{"type": "LineString", "coordinates": [[-74.08, 4.60], [-74.07, 4.61]]}', 50, 25)$$,
  'el guardián guarda la ruta de su menor activo');
select lives_ok(
  $$select public.guardar_ruta('a0000000-0000-0000-0000-000000000001', 'CASA_COLEGIO',
    '{"type": "LineString", "coordinates": [[-74.08, 4.60], [-74.075, 4.605], [-74.07, 4.61]]}', 80, 30)$$,
  'guardar otra ruta en el mismo sentido la reemplaza');
select throws_ok(
  $$select public.guardar_ruta('a0000000-0000-0000-0000-000000000001', 'COLEGIO_CASA',
    '{"type": "LineString", "coordinates": [[-74.08, 4.60], [-74.07, 4.61]]}', 20, 25)$$,
  '22023', null, 'corredor menor de 25 m rechazado (D10)');
select throws_ok(
  $$select public.guardar_ruta('a0000000-0000-0000-0000-000000000001', 'COLEGIO_CASA',
    '{"type": "LineString", "coordinates": [[-74.08, 4.60], [-74.07, 4.61]]}', 50, 121)$$,
  '22023', null, 'duración mayor de 120 min rechazada (D10)');
select throws_ok(
  $$select public.guardar_ruta('a0000000-0000-0000-0000-000000000001', 'COLEGIO_CASA',
    '{"type": "LineString", "coordinates": [[-74.08, 4.60]]}', 50, 25)$$,
  '22023', null, 'ruta de un solo punto rechazada (D15)');
select throws_ok(
  $$select public.guardar_ruta('a0000000-0000-0000-0000-000000000001', 'COLEGIO_CASA',
    '{"type": "LineString", "coordinates": [[-3.70, 40.41], [-3.69, 40.42]]}', 50, 25)$$,
  '22023', null, 'ruta fuera de Colombia rechazada (D15)');
select throws_ok(
  $$select public.guardar_ruta('a0000000-0000-0000-0000-000000000001', 'COLEGIO_CASA',
    '{"type": "LineString", "coordinates": [[-74.08, 4.60], [-73.36, 5.53]]}', 50, 25)$$,
  '22023', null, 'ruta de más de 30 km rechazada (D15)');
select throws_ok(
  $$select public.guardar_ruta('a0000000-0000-0000-0000-000000000001', 'COLEGIO_CASA',
    '{"type": "Point", "coordinates": [-74.08, 4.60]}', 50, 25)$$,
  '22023', null, 'una geometría que no es línea es rechazada');
select throws_ok(
  $$select public.guardar_ruta('a0000000-0000-0000-0000-000000000002', 'CASA_COLEGIO',
    '{"type": "LineString", "coordinates": [[-74.08, 4.60], [-74.07, 4.61]]}', 50, 25)$$,
  'P0001', null, 'un menor pendiente de validación no recibe rutas');
select throws_ok('select * from public.rutas', '42501', null, 'la app no lee la tabla rutas directamente');

set local request.jwt.claims = '{"sub": "10000000-0000-0000-0000-000000000002", "role": "authenticated", "app_metadata": {"rol": "guardian"}}';
select throws_ok(
  $$select public.guardar_ruta('a0000000-0000-0000-0000-000000000001', 'COLEGIO_CASA',
    '{"type": "LineString", "coordinates": [[-74.08, 4.60], [-74.07, 4.61]]}', 50, 25)$$,
  '42501', null, 'el guardián de otro menor no cambia la ruta');

set local request.jwt.claims = '{"sub": "40000000-0000-0000-0000-000000000001", "role": "authenticated", "app_metadata": {"rol": "protegido"}}';
select throws_ok(
  $$select public.guardar_ruta('a0000000-0000-0000-0000-000000000001', 'COLEGIO_CASA',
    '{"type": "LineString", "coordinates": [[-74.08, 4.60], [-74.07, 4.61]]}', 50, 25)$$,
  '42501', null, 'el protegido no cambia su propia ruta');
reset role;

-- ---------------------------------------------------------------------------
-- Rutas: estado y lectura (13–19)
-- ---------------------------------------------------------------------------
select is(
  (select count(*)::int from public.rutas where protegido_id = 'a0000000-0000-0000-0000-000000000001'),
  1, 'el menor tiene una sola ruta Casa → colegio');
select is(
  (select corredor_m from public.rutas where protegido_id = 'a0000000-0000-0000-0000-000000000001'),
  80, 'la ruta guardada es la última');
select is(
  (select count(*)::int from public.audit_log where accion = 'GUARDAR_RUTA'),
  2, 'cada ruta guardada queda en audit_log');

set local role authenticated;
set local request.jwt.claims = '{"sub": "10000000-0000-0000-0000-000000000001", "role": "authenticated", "app_metadata": {"rol": "guardian"}}';
select is(
  (select count(*)::int from public.obtener_rutas('a0000000-0000-0000-0000-000000000001')),
  1, 'el guardián lee las rutas de su menor');

set local request.jwt.claims = '{"sub": "40000000-0000-0000-0000-000000000001", "role": "authenticated", "app_metadata": {"rol": "protegido"}}';
select is(
  (select geojson ->> 'type' from public.obtener_rutas('a0000000-0000-0000-0000-000000000001')),
  'LineString', 'el protegido lee su ruta en GeoJSON');

set local request.jwt.claims = '{"sub": "20000000-0000-0000-0000-000000000001", "role": "authenticated", "app_metadata": {"rol": "institucion"}}';
select throws_ok(
  $$select * from public.obtener_rutas('a0000000-0000-0000-0000-000000000001')$$,
  '42501', null, 'el personal del colegio no lee la ruta');
reset role;

select is(
  (select count(*)::int from public.audit_log where accion = 'LEER_RUTAS'),
  2, 'cada lectura de rutas queda en audit_log');

-- ---------------------------------------------------------------------------
-- Trayectos (20–27)
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub": "10000000-0000-0000-0000-000000000001", "role": "authenticated", "app_metadata": {"rol": "guardian"}}';
select throws_ok(
  $$select public.iniciar_trayecto((select id from public.obtener_rutas('a0000000-0000-0000-0000-000000000001') limit 1))$$,
  '42501', null, 'el guardián no inicia el trayecto del menor');

set local request.jwt.claims = '{"sub": "40000000-0000-0000-0000-000000000001", "role": "authenticated", "app_metadata": {"rol": "protegido"}}';
select lives_ok(
  $$select public.iniciar_trayecto((select id from public.obtener_rutas('a0000000-0000-0000-0000-000000000001') limit 1))$$,
  'el protegido inicia su trayecto con un toque');
select throws_ok(
  $$select public.iniciar_trayecto((select id from public.obtener_rutas('a0000000-0000-0000-0000-000000000001') limit 1))$$,
  'P0001', null, 'no se inicia un segundo trayecto en curso');
select is((select count(*)::int from public.trayectos), 1, 'el protegido ve su trayecto');
select is((select estado::text from public.trayectos), 'EN_CURSO', 'el trayecto nace EN_CURSO');
select throws_ok(
  $$insert into public.trayectos (protegido_id, ruta_id)
    values ('a0000000-0000-0000-0000-000000000001', (select id from public.obtener_rutas('a0000000-0000-0000-0000-000000000001') limit 1))$$,
  '42501', null, 'la app no inserta trayectos directamente');

set local request.jwt.claims = '{"sub": "10000000-0000-0000-0000-000000000001", "role": "authenticated", "app_metadata": {"rol": "guardian"}}';
select is((select count(*)::int from public.trayectos), 1, 'el guardián ve el trayecto de su menor');

set local request.jwt.claims = '{"sub": "10000000-0000-0000-0000-000000000002", "role": "authenticated", "app_metadata": {"rol": "guardian"}}';
select is((select count(*)::int from public.trayectos), 0, 'el guardián de otro menor no ve el trayecto');
reset role;

-- ---------------------------------------------------------------------------
-- Invitaciones: crear y ver (28–33)
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub": "10000000-0000-0000-0000-000000000001", "role": "authenticated", "app_metadata": {"rol": "guardian"}}';
do $$ begin perform set_config('pruebas.token1', (select token from public.crear_invitacion('a0000000-0000-0000-0000-000000000001')), true); end $$;

select ok(length(current_setting('pruebas.token1')) >= 22, 'la invitación devuelve un token de al menos 128 bits');
select is((select count(*)::int from public.contactos_apoyo), 1, 'el guardián ve su invitación');
select throws_ok('select token_hash from public.contactos_apoyo', '42501', null, 'el hash del token no es legible desde la app');

set local request.jwt.claims = '{"sub": "10000000-0000-0000-0000-000000000002", "role": "authenticated", "app_metadata": {"rol": "guardian"}}';
select throws_ok(
  $$select * from public.crear_invitacion('a0000000-0000-0000-0000-000000000001')$$,
  '42501', null, 'el guardián de otro menor no invita contactos');
reset role;

set local role anon;
set local request.jwt.claims = '{"role": "anon"}';
select is(
  (select menor from public.ver_invitacion(current_setting('pruebas.token1'))),
  'Menor', 'la invitación muestra solo el primer nombre del menor (D17)');
select throws_ok(
  $$select * from public.ver_invitacion('token-que-no-existe')$$,
  'NX410', null, 'un token desconocido da el error genérico');
reset role;

-- ---------------------------------------------------------------------------
-- Invitaciones: alta del contacto con el token (34–40)
-- ---------------------------------------------------------------------------
do $$
begin
  insert into auth.users (id, email, raw_user_meta_data, raw_app_meta_data, aud, role) values
    ('50000000-0000-0000-0000-000000000001', 'apoyo1@example.com',
     jsonb_build_object('nombre', 'Ana Tía', 'invitacion', current_setting('pruebas.token1')),
     null, 'authenticated', 'authenticated');
end $$;

select is(
  (select raw_app_meta_data ->> 'rol' from auth.users where id = '50000000-0000-0000-0000-000000000001'),
  'apoyo', 'la cuenta registrada con invitación nace con rol apoyo');
select is(
  (select usuario_id from public.contactos_apoyo where guardian_id = '10000000-0000-0000-0000-000000000001'),
  '50000000-0000-0000-0000-000000000001'::uuid, 'la invitación queda vinculada a la cuenta del contacto');
select is(
  (select count(*)::int from public.guardianes where id = '50000000-0000-0000-0000-000000000001'),
  0, 'el contacto de apoyo no queda como guardián');
select throws_ok(
  $$insert into auth.users (id, email, raw_user_meta_data, raw_app_meta_data, aud, role) values
    ('50000000-0000-0000-0000-000000000002', 'apoyo2@example.com',
     jsonb_build_object('invitacion', current_setting('pruebas.token1')), null, 'authenticated', 'authenticated')$$,
  'NX410', null, 'una invitación ya usada no sirve para otra cuenta');
select throws_ok(
  $$select * from public.ver_invitacion(current_setting('pruebas.token1'))$$,
  'NX410', null, 'una invitación usada ya no se puede ver');

set local role authenticated;
set local request.jwt.claims = '{"sub": "50000000-0000-0000-0000-000000000001", "role": "authenticated", "app_metadata": {"rol": "apoyo"}}';
select is((select count(*)::int from public.contactos_apoyo), 1, 'el contacto ve su vínculo');
select throws_ok(
  $$select * from public.obtener_rutas('a0000000-0000-0000-0000-000000000001')$$,
  '42501', null, 'el contacto de apoyo no lee las rutas (D8)');
reset role;

-- ---------------------------------------------------------------------------
-- Invitaciones: vencimiento, aceptar con cuenta y límite (41–45)
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub": "50000000-0000-0000-0000-000000000001", "role": "authenticated", "app_metadata": {"rol": "apoyo"}}';
select is((select count(*)::int from public.trayectos), 0, 'el contacto de apoyo no ve los trayectos (D8)');

set local request.jwt.claims = '{"sub": "10000000-0000-0000-0000-000000000002", "role": "authenticated", "app_metadata": {"rol": "guardian"}}';
do $$ begin perform set_config('pruebas.token2', (select token from public.crear_invitacion('a0000000-0000-0000-0000-000000000003')), true); end $$;
do $$ begin perform set_config('pruebas.token3', (select token from public.crear_invitacion('a0000000-0000-0000-0000-000000000003')), true); end $$;
reset role;

update public.contactos_apoyo set vence_en = now() - interval '1 minute'
  where token_hash = private.hash_token(current_setting('pruebas.token2'));
select throws_ok(
  $$select * from public.ver_invitacion(current_setting('pruebas.token2'))$$,
  'NX410', null, 'una invitación vencida da el error genérico');

set local role authenticated;
set local request.jwt.claims = '{"sub": "50000000-0000-0000-0000-000000000001", "role": "authenticated", "app_metadata": {"rol": "apoyo"}, "user_metadata": {"nombre": "Ana Tía"}}';
select lives_ok(
  $$select public.aceptar_invitacion(current_setting('pruebas.token3'))$$,
  'un contacto con cuenta acepta otra invitación');
reset role;

select is(
  (select count(*)::int from public.audit_log where accion = 'ACEPTAR_INVITACION'),
  2, 'cada aceptación queda en audit_log');

set local role authenticated;
set local request.jwt.claims = '{"sub": "10000000-0000-0000-0000-000000000002", "role": "authenticated", "app_metadata": {"rol": "guardian"}}';
do $$ begin for i in 1..8 loop perform public.crear_invitacion('a0000000-0000-0000-0000-000000000003'); end loop; end $$;
select throws_ok(
  $$select * from public.crear_invitacion('a0000000-0000-0000-0000-000000000003')$$,
  'NX429', null, 'máximo 10 invitaciones por guardián cada hora');
reset role;

insert into auth.users (id, email, raw_user_meta_data, raw_app_meta_data, aud, role) values
  ('10000000-0000-0000-0000-000000000003', 'g3@example.com', '{"nombre": "Guardián Tres"}', null, 'authenticated', 'authenticated');
select is(
  (select raw_app_meta_data ->> 'rol' from auth.users where id = '10000000-0000-0000-0000-000000000003'),
  'guardian', 'sin invitación, el registro sigue siendo guardián');

select * from finish();
rollback;
