-- E1-02 — Foto del menor en un bucket privado (decisión D4) y alta atómica:
-- protegido + foto + consentimiento en una sola transacción.

-- ---------------------------------------------------------------------------
-- Bucket privado: solo JPG o PNG de hasta 2 MB.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos-protegidos', 'fotos-protegidos', false, 2097152, array['image/jpeg', 'image/png'])
on conflict (id) do nothing;

-- Cada foto se usa para un solo menor.
create unique index protegidos_foto_path_key on public.protegidos (foto_path)
  where foto_path is not null;

-- El personal activo del colegio ve la foto de los menores de su colegio.
create function private.foto_visible_para_institucion(p_nombre_objeto text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.protegidos p
    where p.foto_path = p_nombre_objeto and private.es_personal_activo_de(p.colegio_id)
  );
$$;

revoke all on function private.foto_visible_para_institucion(text) from public, anon, authenticated;
grant execute on function private.foto_visible_para_institucion(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Políticas de Storage. Ruta de cada foto: <guardian_id>/<archivo>.
-- El administrador no tiene ninguna política: no ve fotos de menores.
-- ---------------------------------------------------------------------------
create policy fotos_protegidos_subida_guardian on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'fotos-protegidos'
    and private.rol_actual() = 'guardian'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy fotos_protegidos_lectura_guardian on storage.objects
  for select to authenticated
  using (
    bucket_id = 'fotos-protegidos'
    and private.rol_actual() = 'guardian'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy fotos_protegidos_lectura_institucion on storage.objects
  for select to authenticated
  using (
    bucket_id = 'fotos-protegidos'
    and private.rol_actual() = 'institucion'
    and private.foto_visible_para_institucion(name)
  );

-- ---------------------------------------------------------------------------
-- registrar_protegido ahora exige la foto, ya subida a la carpeta del guardián.
-- ---------------------------------------------------------------------------
drop function public.registrar_protegido(text, text, uuid, text);

create function public.registrar_protegido(
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

  insert into public.protegidos (guardian_id, colegio_id, nombre, documento_cifrado, foto_path)
  values (
    v_guardian,
    p_colegio_id,
    trim(p_nombre),
    extensions.pgp_sym_encrypt(trim(p_documento), private.llave_documento()),
    p_foto_path
  )
  returning id into v_id;

  insert into public.consentimientos (guardian_id, protegido_id, tipo, version_politica)
  values (v_guardian, v_id, 'OTORGADO', p_version_politica);

  perform private.registrar_auditoria('protegidos', v_id, 'INSERT');
  return v_id;
end;
$$;

revoke all on function public.registrar_protegido(text, text, uuid, text, text) from public, anon;
grant execute on function public.registrar_protegido(text, text, uuid, text, text) to authenticated;
