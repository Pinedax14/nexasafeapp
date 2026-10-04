-- Pruebas de políticas RLS y funciones de la épica E1 (RNF-27).
-- Usuarios simulados: dos guardianes, personal de dos colegios (uno inactivo) y un administrador.
begin;
create extension if not exists pgtap with schema extensions;
select plan(38);

-- ---------------------------------------------------------------------------
-- Datos de prueba (como postgres)
-- ---------------------------------------------------------------------------
insert into public.colegios (id, nombre, nit) values
  ('c0000000-0000-0000-0000-000000000001', 'Colegio X', '800000001'),
  ('c0000000-0000-0000-0000-000000000002', 'Colegio Y', '800000002');

insert into auth.users (id, email, raw_user_meta_data, raw_app_meta_data, aud, role) values
  ('10000000-0000-0000-0000-000000000001', 'g1@example.com', '{"nombre": "Guardián Uno"}', null, 'authenticated', 'authenticated'),
  ('10000000-0000-0000-0000-000000000002', 'g2@example.com', '{"nombre": "Guardián Dos"}', null, 'authenticated', 'authenticated'),
  ('20000000-0000-0000-0000-000000000001', 'px@example.com', '{}', '{"rol": "institucion"}', 'authenticated', 'authenticated'),
  ('20000000-0000-0000-0000-000000000002', 'py@example.com', '{}', '{"rol": "institucion"}', 'authenticated', 'authenticated'),
  ('20000000-0000-0000-0000-000000000003', 'pi@example.com', '{}', '{"rol": "institucion"}', 'authenticated', 'authenticated'),
  ('30000000-0000-0000-0000-000000000001', 'ad@example.com', '{}', '{"rol": "admin"}', 'authenticated', 'authenticated');

insert into public.personal_institucion (id, colegio_id, nombre, activo) values
  ('20000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Personal X', true),
  ('20000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'Personal Y', true),
  ('20000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'Personal X inactivo', false);

-- ---------------------------------------------------------------------------
-- RLS activado en todas las tablas (1–6)
-- ---------------------------------------------------------------------------
select ok((select relrowsecurity from pg_class where oid = 'public.colegios'::regclass), 'RLS activo en colegios');
select ok((select relrowsecurity from pg_class where oid = 'public.personal_institucion'::regclass), 'RLS activo en personal_institucion');
select ok((select relrowsecurity from pg_class where oid = 'public.guardianes'::regclass), 'RLS activo en guardianes');
select ok((select relrowsecurity from pg_class where oid = 'public.protegidos'::regclass), 'RLS activo en protegidos');
select ok((select relrowsecurity from pg_class where oid = 'public.consentimientos'::regclass), 'RLS activo en consentimientos');
select ok((select relrowsecurity from pg_class where oid = 'public.audit_log'::regclass), 'RLS activo en audit_log');

-- ---------------------------------------------------------------------------
-- Registro de usuarios (7–9)
-- ---------------------------------------------------------------------------
select is(
  (select raw_app_meta_data ->> 'rol' from auth.users where id = '10000000-0000-0000-0000-000000000001'),
  'guardian', 'un registro desde la app recibe el rol guardian');
select is(
  (select nombre from public.guardianes where id = '10000000-0000-0000-0000-000000000001'),
  'Guardián Uno', 'el registro crea la fila en guardianes');
select is(
  (select count(*)::int from public.guardianes where id = '20000000-0000-0000-0000-000000000001'),
  0, 'una cuenta institucional no se convierte en guardián');

-- ---------------------------------------------------------------------------
-- Sin sesión (anon) (10–11)
-- ---------------------------------------------------------------------------
set local role anon;
select throws_ok('select count(*) from public.protegidos', '42501', null, 'anon no lee protegidos');
select throws_ok(
  $$select public.registrar_protegido('Menor', '1', 'c0000000-0000-0000-0000-000000000001', '1.0')$$,
  '42501', null, 'anon no registra protegidos');
reset role;

-- ---------------------------------------------------------------------------
-- Guardián 1: alta del menor y consentimiento (12–21)
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub": "10000000-0000-0000-0000-000000000001", "role": "authenticated", "app_metadata": {"rol": "guardian"}}';

select throws_ok(
  $$select public.registrar_protegido('Menor Uno', '1001', 'c0000000-0000-0000-0000-000000000001', '0.9')$$,
  'P0001', 'Debe aceptar la política de tratamiento vigente', 'sin aceptar la política vigente no hay alta');
select ok(
  set_config('pruebas.protegido',
    public.registrar_protegido('Menor Uno', '1001', 'c0000000-0000-0000-0000-000000000001', '1.0')::text,
    true) is not null,
  'el guardián registra un menor con la política vigente');
select is(
  (select estado::text from public.protegidos where id = current_setting('pruebas.protegido')::uuid),
  'PENDIENTE_VALIDACION', 'el menor queda pendiente de validación');
select is(
  (select count(*)::int from public.consentimientos
   where protegido_id = current_setting('pruebas.protegido')::uuid and tipo = 'OTORGADO' and version_politica = '1.0'),
  1, 'queda registrado el consentimiento con la versión de la política');
select throws_ok('select documento_cifrado from public.protegidos', '42501', null, 'el documento cifrado no es legible desde la app');
select throws_ok('select pin_hash from public.protegidos', '42501', null, 'pin_hash no es legible desde la app');
select throws_ok($$update public.protegidos set estado = 'ACTIVO'$$, '42501', null, 'el guardián no puede cambiar el estado');
select is(
  (select documento from public.obtener_protegido(current_setting('pruebas.protegido')::uuid)),
  '1001', 'el guardián lee el documento descifrado de su menor');
select throws_ok($$insert into public.colegios (nombre, nit) values ('Otro', '999')$$, '42501', null, 'el guardián no crea colegios');
select throws_ok('select count(*) from public.audit_log', '42501', null, 'el guardián no lee audit_log');

-- ---------------------------------------------------------------------------
-- Guardián 2: aislamiento entre guardianes (22–24)
-- ---------------------------------------------------------------------------
set local request.jwt.claims = '{"sub": "10000000-0000-0000-0000-000000000002", "role": "authenticated", "app_metadata": {"rol": "guardian"}}';

select is((select count(*)::int from public.protegidos), 0, 'otro guardián no ve menores ajenos');
select throws_ok(
  format('select * from public.obtener_protegido(%L)', current_setting('pruebas.protegido')),
  '42501', null, 'otro guardián no lee el detalle de un menor ajeno');
select is((select count(*)::int from public.consentimientos), 0, 'otro guardián no ve consentimientos ajenos');

-- ---------------------------------------------------------------------------
-- Personal de otro colegio e inactivo (25–27)
-- ---------------------------------------------------------------------------
set local request.jwt.claims = '{"sub": "20000000-0000-0000-0000-000000000002", "role": "authenticated", "app_metadata": {"rol": "institucion"}}';

select is((select count(*)::int from public.protegidos), 0, 'el colegio Y no ve menores del colegio X');
select throws_ok(
  format('select public.validar_protegido(%L)', current_setting('pruebas.protegido')),
  '42501', null, 'el colegio Y no valida menores del colegio X');

set local request.jwt.claims = '{"sub": "20000000-0000-0000-0000-000000000003", "role": "authenticated", "app_metadata": {"rol": "institucion"}}';

select throws_ok(
  format('select public.validar_protegido(%L)', current_setting('pruebas.protegido')),
  '42501', null, 'el personal inactivo no valida');

-- ---------------------------------------------------------------------------
-- Personal activo del colegio X: validación (28–31)
-- ---------------------------------------------------------------------------
set local request.jwt.claims = '{"sub": "20000000-0000-0000-0000-000000000001", "role": "authenticated", "app_metadata": {"rol": "institucion"}}';

select is(
  (select count(*)::int from public.protegidos where estado = 'PENDIENTE_VALIDACION'),
  1, 'el colegio X ve sus menores pendientes');
select lives_ok(
  format('select public.validar_protegido(%L)', current_setting('pruebas.protegido')),
  'el personal activo del colegio X valida la matrícula');
select is(
  (select estado::text from public.protegidos where id = current_setting('pruebas.protegido')::uuid),
  'ACTIVO', 'el menor queda ACTIVO');
select throws_ok(
  format('select public.validar_protegido(%L)', current_setting('pruebas.protegido')),
  'P0001', null, 'un menor no se valida dos veces');

-- ---------------------------------------------------------------------------
-- Administrador (32–34)
-- ---------------------------------------------------------------------------
set local request.jwt.claims = '{"sub": "30000000-0000-0000-0000-000000000001", "role": "authenticated", "app_metadata": {"rol": "admin"}}';

select lives_ok($$insert into public.colegios (nombre, nit) values ('Colegio Nuevo', '900000003')$$, 'el administrador crea colegios');
select is((select count(*)::int from public.protegidos), 0, 'el administrador no ve menores');
select throws_ok(
  format('select * from public.obtener_protegido(%L)', current_setting('pruebas.protegido')),
  '42501', null, 'el administrador no lee el detalle de menores');

-- ---------------------------------------------------------------------------
-- Auditoría y append-only (35–38)
-- ---------------------------------------------------------------------------
reset role;

select is(
  (select count(*)::int from public.audit_log
   where entidad = 'protegidos' and entidad_id = current_setting('pruebas.protegido')::uuid
     and accion = 'VALIDAR' and actor_id = '20000000-0000-0000-0000-000000000001'),
  1, 'audit_log registra quién validó');
select is(
  (select count(*)::int from public.audit_log
   where entidad = 'protegidos' and entidad_id = current_setting('pruebas.protegido')::uuid
     and accion = 'LEER' and actor_id = '10000000-0000-0000-0000-000000000001'),
  1, 'audit_log registra la lectura del detalle');
select throws_ok('delete from public.consentimientos', 'P0001', null, 'consentimientos es append-only');
select throws_ok($$update public.audit_log set accion = 'X'$$, 'P0001', null, 'audit_log es append-only');

select * from finish();
rollback;
