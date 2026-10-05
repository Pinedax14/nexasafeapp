-- Pruebas de E1-04: huella del documento, columnas del PIN y perfil propio del protegido.
begin;
create extension if not exists pgtap with schema extensions;
select plan(11);

insert into public.colegios (id, nombre, nit) values
  ('c0000000-0000-0000-0000-000000000001', 'Colegio X', '800000001');

insert into auth.users (id, email, raw_user_meta_data, raw_app_meta_data, aud, role) values
  ('10000000-0000-0000-0000-000000000001', 'g1@example.com', '{"nombre": "Guardián Uno"}', null, 'authenticated', 'authenticated'),
  ('40000000-0000-0000-0000-000000000001', 'protegido-1@example.org', '{"nombre": "Menor Uno"}', '{"rol": "protegido"}', 'authenticated', 'authenticated'),
  ('40000000-0000-0000-0000-000000000002', 'protegido-2@example.org', '{"nombre": "Menor Dos"}', '{"rol": "protegido"}', 'authenticated', 'authenticated');

insert into storage.objects (bucket_id, name) values
  ('fotos-protegidos', '10000000-0000-0000-0000-000000000001/a.jpg'),
  ('fotos-protegidos', '10000000-0000-0000-0000-000000000001/b.jpg');

-- Dos menores del guardián 1, registrados por la función (que calcula la huella).
set local role authenticated;
set local request.jwt.claims = '{"sub": "10000000-0000-0000-0000-000000000001", "role": "authenticated", "app_metadata": {"rol": "guardian"}}';
do $$ begin perform set_config('pruebas.p1', public.registrar_protegido('Menor Uno', '1001', 'c0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001/a.jpg', '1.0')::text, true); end $$;
do $$ begin perform set_config('pruebas.p2', public.registrar_protegido('Menor Dos', '1002', 'c0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001/b.jpg', '1.0')::text, true); end $$;
reset role;

-- ---------------------------------------------------------------------------
-- Huella del documento (1–4)
-- ---------------------------------------------------------------------------
select is(
  (select documento_huella from public.protegidos where id = current_setting('pruebas.p1')::uuid),
  public.pin_huella_documento('1001'),
  'registrar_protegido guarda la huella del documento');
select isnt(
  public.pin_huella_documento('1001'), public.pin_huella_documento('1002'),
  'documentos distintos tienen huellas distintas');
select ok(
  public.pin_huella_documento('1001') !~ '1001',
  'la huella no contiene el documento');

set local role authenticated;
set local request.jwt.claims = '{"sub": "10000000-0000-0000-0000-000000000001", "role": "authenticated", "app_metadata": {"rol": "guardian"}}';
select throws_ok($$select public.pin_huella_documento('1001')$$, '42501', null, 'la app no puede calcular huellas');

-- ---------------------------------------------------------------------------
-- Columnas protegidas (5–6)
-- ---------------------------------------------------------------------------
select throws_ok('select documento_huella from public.protegidos', '42501', null, 'la huella no es legible desde la app');
select throws_ok('select pin_intentos_fallidos from public.protegidos', '42501', null, 'los intentos de PIN no son legibles desde la app');
reset role;

-- La Edge Function asigna el PIN: vincula cada menor con su cuenta interna.
update public.protegidos set estado = 'ACTIVO', usuario_id = '40000000-0000-0000-0000-000000000001', pin_hash = 'x'
  where id = current_setting('pruebas.p1')::uuid;
update public.protegidos set estado = 'ACTIVO', usuario_id = '40000000-0000-0000-0000-000000000002', pin_hash = 'x'
  where id = current_setting('pruebas.p2')::uuid;

-- ---------------------------------------------------------------------------
-- El protegido ve solo su propio perfil (7–9)
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub": "40000000-0000-0000-0000-000000000001", "role": "authenticated", "app_metadata": {"rol": "protegido"}}';

select is((select count(*)::int from public.protegidos), 1, 'el protegido ve un solo perfil');
select is((select nombre from public.protegidos), 'Menor Uno', 'el protegido ve su propio perfil');
select throws_ok('select pin_hash from public.protegidos', '42501', null, 'el protegido no lee su pin_hash');
reset role;

-- ---------------------------------------------------------------------------
-- Un documento, un solo PIN activo (10–11)
-- ---------------------------------------------------------------------------
select throws_ok(
  $$update public.protegidos set documento_huella = (select documento_huella from public.protegidos where id = current_setting('pruebas.p1')::uuid)
    where id = current_setting('pruebas.p2')::uuid$$,
  '23505', null, 'dos menores con PIN no pueden compartir documento');
select lives_ok(
  $$insert into public.protegidos (guardian_id, colegio_id, nombre, documento_cifrado, documento_huella)
    values ('10000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Duplicado sin PIN', '\x00',
            (select documento_huella from public.protegidos where id = current_setting('pruebas.p1')::uuid))$$,
  'un registro duplicado sin PIN sí se permite (lo resuelve el colegio)');

select * from finish();
rollback;
