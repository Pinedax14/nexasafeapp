-- Pruebas de E1-02: fotos de menores en Storage y alta atómica con foto (RNF-27, D4).
begin;
create extension if not exists pgtap with schema extensions;
select plan(16);

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
  ('30000000-0000-0000-0000-000000000001', 'ad@example.com', '{}', '{"rol": "admin"}', 'authenticated', 'authenticated');

insert into public.personal_institucion (id, colegio_id, nombre, activo) values
  ('20000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Personal X', true),
  ('20000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'Personal Y', true);

-- Foto que el guardián 2 subió a su propia carpeta.
insert into storage.objects (bucket_id, name) values
  ('fotos-protegidos', '10000000-0000-0000-0000-000000000002/foto-g2.jpg');

-- ---------------------------------------------------------------------------
-- Bucket (1–2)
-- ---------------------------------------------------------------------------
select ok(exists (select 1 from storage.buckets where id = 'fotos-protegidos'), 'existe el bucket fotos-protegidos');
select is((select public from storage.buckets where id = 'fotos-protegidos'), false, 'el bucket de fotos es privado');

-- ---------------------------------------------------------------------------
-- Guardián 1: subida y alta (3–9)
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub": "10000000-0000-0000-0000-000000000001", "role": "authenticated", "app_metadata": {"rol": "guardian"}}';

select lives_ok(
  $$insert into storage.objects (bucket_id, name) values ('fotos-protegidos', '10000000-0000-0000-0000-000000000001/foto-g1.jpg')$$,
  'el guardián sube una foto a su propia carpeta');
select throws_ok(
  $$insert into storage.objects (bucket_id, name) values ('fotos-protegidos', '10000000-0000-0000-0000-000000000002/intruso.jpg')$$,
  '42501', null, 'el guardián no sube fotos a la carpeta de otro guardián');
select is(
  (select count(*)::int from storage.objects where bucket_id = 'fotos-protegidos'),
  1, 'el guardián solo ve las fotos de su carpeta');
select throws_ok(
  $$select public.registrar_protegido('Menor', '1001', 'c0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002/foto-g2.jpg', '1.0')$$,
  '22023', 'La foto no es válida', 'no se registra un menor con la foto de otro guardián');
select throws_ok(
  $$select public.registrar_protegido('Menor', '1001', 'c0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001/no-existe.jpg', '1.0')$$,
  '22023', 'La foto no es válida', 'no se registra un menor con una foto que no se subió');
select ok(
  set_config('pruebas.protegido',
    public.registrar_protegido('Menor Uno', '1001', 'c0000000-0000-0000-0000-000000000001',
      '10000000-0000-0000-0000-000000000001/foto-g1.jpg', '1.0')::text,
    true) is not null,
  'el guardián registra un menor con su foto');
select throws_ok(
  $$select public.registrar_protegido('Menor Dos', '1002', 'c0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001/foto-g1.jpg', '1.0')$$,
  '22023', 'La foto no es válida', 'una foto no se reutiliza para otro menor');

-- ---------------------------------------------------------------------------
-- Guardián 2 (10)
-- ---------------------------------------------------------------------------
set local request.jwt.claims = '{"sub": "10000000-0000-0000-0000-000000000002", "role": "authenticated", "app_metadata": {"rol": "guardian"}}';

select is(
  (select count(*)::int from storage.objects
   where name = '10000000-0000-0000-0000-000000000001/foto-g1.jpg'),
  0, 'otro guardián no ve la foto de un menor ajeno');

-- ---------------------------------------------------------------------------
-- Personal de los colegios (11–12)
-- ---------------------------------------------------------------------------
set local request.jwt.claims = '{"sub": "20000000-0000-0000-0000-000000000001", "role": "authenticated", "app_metadata": {"rol": "institucion"}}';

select is(
  (select count(*)::int from storage.objects
   where name = '10000000-0000-0000-0000-000000000001/foto-g1.jpg'),
  1, 'el personal del colegio X ve la foto de su menor');

set local request.jwt.claims = '{"sub": "20000000-0000-0000-0000-000000000002", "role": "authenticated", "app_metadata": {"rol": "institucion"}}';

select is(
  (select count(*)::int from storage.objects where bucket_id = 'fotos-protegidos'),
  0, 'el personal del colegio Y no ve fotos del colegio X');

-- ---------------------------------------------------------------------------
-- Administrador (13–14)
-- ---------------------------------------------------------------------------
set local request.jwt.claims = '{"sub": "30000000-0000-0000-0000-000000000001", "role": "authenticated", "app_metadata": {"rol": "admin"}}';

select is(
  (select count(*)::int from storage.objects where bucket_id = 'fotos-protegidos'),
  0, 'el administrador no ve fotos de menores');
select throws_ok(
  $$insert into storage.objects (bucket_id, name) values ('fotos-protegidos', '30000000-0000-0000-0000-000000000001/x.jpg')$$,
  '42501', null, 'el administrador no sube fotos');

-- ---------------------------------------------------------------------------
-- Resultado del alta (15–16)
-- ---------------------------------------------------------------------------
reset role;

select is(
  (select foto_path from public.protegidos where id = current_setting('pruebas.protegido')::uuid),
  '10000000-0000-0000-0000-000000000001/foto-g1.jpg', 'el menor queda vinculado a su foto');
select is(
  (select count(*)::int from public.consentimientos where protegido_id = current_setting('pruebas.protegido')::uuid),
  1, 'el alta con foto también registra el consentimiento');

select * from finish();
rollback;
