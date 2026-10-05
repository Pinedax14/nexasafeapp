-- E1-04 — Ingreso del protegido con documento + PIN de 4 dígitos (RF-04, D5, D7).
-- El PIN solo lo escribe y verifica la Edge Function auth-pin (service_role).

-- ---------------------------------------------------------------------------
-- Huella del documento: HMAC-SHA256 con una llave de Vault. Permite buscar al
-- menor por su documento sin descifrar documento_cifrado ni poder revertirla.
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'documento_huella_key') then
    perform vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'base64'),
      'documento_huella_key',
      'Llave de la huella HMAC de protegidos.documento (E1-04)'
    );
  end if;
end;
$$;

create function private.huella_documento(p_documento text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select encode(
    extensions.hmac(
      p_documento,
      (select decrypted_secret from vault.decrypted_secrets where name = 'documento_huella_key'),
      'sha256'
    ),
    'hex'
  );
$$;

revoke all on function private.huella_documento(text) from public, anon, authenticated;

-- Solo la Edge Function auth-pin (service_role) calcula huellas desde la API.
create function public.pin_huella_documento(p_documento text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select private.huella_documento(p_documento);
$$;

revoke all on function public.pin_huella_documento(text) from public, anon, authenticated;
grant execute on function public.pin_huella_documento(text) to service_role;

-- ---------------------------------------------------------------------------
-- Columnas nuevas de protegidos (ninguna se concede a los clientes)
-- ---------------------------------------------------------------------------
alter table public.protegidos
  add column documento_huella text,
  add column usuario_id uuid unique references auth.users (id) on delete set null,
  add column pin_intentos_fallidos integer not null default 0,
  add column pin_bloqueado_hasta timestamptz;

update public.protegidos
set documento_huella = private.huella_documento(
  extensions.pgp_sym_decrypt(documento_cifrado, private.llave_documento())
);

alter table public.protegidos alter column documento_huella set not null;
create index protegidos_documento_huella_idx on public.protegidos (documento_huella);
-- Un documento solo puede tener un PIN activo.
create unique index protegidos_documento_con_pin_key on public.protegidos (documento_huella)
  where usuario_id is not null;

-- El protegido ve solo su propio perfil.
create policy protegidos_lectura_propia on public.protegidos
  for select to authenticated
  using (private.rol_actual() = 'protegido' and usuario_id = auth.uid());

-- ---------------------------------------------------------------------------
-- registrar_protegido guarda también la huella (misma firma que en E1-02).
-- ---------------------------------------------------------------------------
create or replace function public.registrar_protegido(
  p_nombre text,
  p_documento text,
  p_colegio_id uuid,
  p_foto_path text,
  p_version_politica text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_guardian uuid := auth.uid();
  v_id uuid;
begin
  if v_guardian is null
     or private.rol_actual() <> 'guardian'
     or not exists (select 1 from public.guardianes where id = v_guardian) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  if p_version_politica is distinct from private.version_politica_vigente() then
    raise exception 'Debe aceptar la política de tratamiento vigente' using errcode = 'P0001';
  end if;

  if coalesce(trim(p_nombre), '') = '' or coalesce(trim(p_documento), '') = '' then
    raise exception 'El nombre y el documento son obligatorios' using errcode = '22023';
  end if;

  if not exists (select 1 from public.colegios where id = p_colegio_id) then
    raise exception 'Colegio no encontrado' using errcode = '22023';
  end if;

  if p_foto_path is null
     or split_part(p_foto_path, '/', 1) <> v_guardian::text
     or not exists (
       select 1 from storage.objects
       where bucket_id = 'fotos-protegidos' and name = p_foto_path
     )
     or exists (select 1 from public.protegidos where foto_path = p_foto_path) then
    raise exception 'La foto no es válida' using errcode = '22023';
  end if;

  insert into public.protegidos (
    guardian_id, colegio_id, nombre, documento_cifrado, documento_huella, foto_path
  )
  values (
    v_guardian,
    p_colegio_id,
    trim(p_nombre),
    extensions.pgp_sym_encrypt(trim(p_documento), private.llave_documento()),
    private.huella_documento(trim(p_documento)),
    p_foto_path
  )
  returning id into v_id;

  insert into public.consentimientos (guardian_id, protegido_id, tipo, version_politica)
  values (v_guardian, v_id, 'OTORGADO', p_version_politica);

  perform private.registrar_auditoria('protegidos', v_id, 'INSERT');
  return v_id;
end;
$$;
