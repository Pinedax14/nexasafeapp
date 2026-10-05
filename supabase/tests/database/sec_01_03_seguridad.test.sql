-- Pruebas de SEC-01 (intentos de PIN por IP) y SEC-03 (contraseña temporal del personal).
begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

insert into public.colegios (id, nombre, nit) values
  ('c0000000-0000-0000-0000-000000000001', 'Colegio X', '800000001');

insert into auth.users (id, email, raw_user_meta_data, raw_app_meta_data, aud, role, encrypted_password) values
  ('10000000-0000-0000-0000-000000000001', 'g1@example.com', '{"nombre": "Guardián Uno"}', null, 'authenticated', 'authenticated', 'x'),
  ('20000000-0000-0000-0000-000000000001', 'nuevo@example.com', '{}', '{"rol": "institucion", "debe_cambiar_contrasena": true}', 'authenticated', 'authenticated', 'temporal'),
  ('20000000-0000-0000-0000-000000000002', 'antiguo@example.com', '{}', '{"rol": "institucion"}', 'authenticated', 'authenticated', 'x');

insert into public.personal_institucion (id, colegio_id, nombre) values
  ('20000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Personal Nuevo'),
  ('20000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'Personal Antiguo');

insert into storage.objects (bucket_id, name) values
  ('fotos-protegidos', '10000000-0000-0000-0000-000000000001/a.jpg');

set local role authenticated;
set local request.jwt.claims = '{"sub": "10000000-0000-0000-0000-000000000001", "role": "authenticated", "app_metadata": {"rol": "guardian"}}';
do $$ begin perform set_config('pruebas.p1', public.registrar_protegido('Menor Uno', '1001', 'c0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001/a.jpg', '1.0')::text, true); end $$;
reset role;

-- ---------------------------------------------------------------------------
-- SEC-01 · Intentos por IP (1–6)
-- ---------------------------------------------------------------------------
select ok(
  (select relrowsecurity from pg_class where oid = 'private.intentos_pin_ip'::regclass),
  'RLS activo en private.intentos_pin_ip');

select is(public.pin_ip_bloqueada('203.0.113.7'), false, 'una IP sin fallos no está bloqueada');

do $$ begin for i in 1..19 loop perform public.pin_registrar_fallo_ip('203.0.113.7'); end loop; end $$;
select is(public.pin_ip_bloqueada('203.0.113.7'), false, '19 fallos no bloquean la IP');

select public.pin_registrar_fallo_ip('203.0.113.7');
select is(public.pin_ip_bloqueada('203.0.113.7'), true, 'el fallo 20 bloquea la IP');

update private.intentos_pin_ip set ventana_inicio = now() - interval '16 minutes';
select is(public.pin_ip_bloqueada('203.0.113.7'), false, 'el bloqueo se levanta tras 15 minutos');

select is(
  (select count(*)::int from private.intentos_pin_ip where ip_huella like '%203.0.113.7%'),
  0, 'la tabla guarda la huella, no la IP');

-- ---------------------------------------------------------------------------
-- SEC-01 · La app no accede a la tabla ni a las funciones (7–8)
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub": "10000000-0000-0000-0000-000000000001", "role": "authenticated", "app_metadata": {"rol": "guardian"}}';
select throws_ok('select public.pin_registrar_fallo_ip(''1.1.1.1'')', '42501', null,
  'la app no puede registrar fallos por IP');
select throws_ok('select * from private.intentos_pin_ip', '42501', null,
  'la app no puede leer los intentos por IP');
reset role;

-- ---------------------------------------------------------------------------
-- SEC-03 · Contraseña temporal (9–12)
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub": "20000000-0000-0000-0000-000000000001", "role": "authenticated", "app_metadata": {"rol": "institucion", "debe_cambiar_contrasena": true}}';
select is(
  (select count(*)::int from public.protegidos), 0,
  'el personal con contraseña temporal no ve menores');
reset role;

set local role authenticated;
set local request.jwt.claims = '{"sub": "20000000-0000-0000-0000-000000000002", "role": "authenticated", "app_metadata": {"rol": "institucion"}}';
select is(
  (select count(*)::int from public.protegidos), 1,
  'el personal sin la marca sí ve los menores de su colegio');
reset role;

update auth.users set raw_user_meta_data = '{"nombre": "Otro"}'
  where id = '20000000-0000-0000-0000-000000000001';
select ok(
  (select raw_app_meta_data ? 'debe_cambiar_contrasena' from auth.users
   where id = '20000000-0000-0000-0000-000000000001'),
  'otros cambios de la cuenta no quitan la marca');

update auth.users set encrypted_password = 'nueva'
  where id = '20000000-0000-0000-0000-000000000001';
select is(
  (select raw_app_meta_data from auth.users where id = '20000000-0000-0000-0000-000000000001'),
  '{"rol": "institucion"}'::jsonb,
  'cambiar la contraseña quita la marca y conserva el rol');

select * from finish();
rollback;
