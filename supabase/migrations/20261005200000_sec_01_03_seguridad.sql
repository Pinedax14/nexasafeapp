-- Hallazgos de la Security Review del Sprint 01.
--  SEC-01: auth-pin limita también los ingresos fallidos por IP.
--  SEC-03: el personal institucional debe cambiar la contraseña temporal en su primer ingreso.

-- ---------------------------------------------------------------------------
-- SEC-01 · Intentos fallidos de ingreso con PIN por IP.
-- Se guarda la huella HMAC de la IP (nunca la IP) en el esquema privado, que
-- la API no expone. Solo auth-pin (service_role) la usa, a través de funciones.
-- ---------------------------------------------------------------------------
create table private.intentos_pin_ip (
  ip_huella text primary key,
  intentos integer not null default 0,
  ventana_inicio timestamptz not null default now()
);

alter table private.intentos_pin_ip enable row level security;
revoke all on table private.intentos_pin_ip from public, anon, authenticated;

-- 20 fallos por IP en una ventana de 15 minutos.
create function public.pin_ip_bloqueada(p_ip text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from private.intentos_pin_ip
    where ip_huella = private.huella_documento(p_ip)
      and intentos >= 20
      and ventana_inicio > now() - interval '15 minutes'
  );
$$;

create function public.pin_registrar_fallo_ip(p_ip text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Minimización: no se conservan huellas de más de un día.
  delete from private.intentos_pin_ip where ventana_inicio < now() - interval '1 day';

  insert into private.intentos_pin_ip as t (ip_huella, intentos, ventana_inicio)
  values (private.huella_documento(p_ip), 1, now())
  on conflict (ip_huella) do update set
    intentos = case
      when t.ventana_inicio <= now() - interval '15 minutes' then 1
      else t.intentos + 1
    end,
    ventana_inicio = case
      when t.ventana_inicio <= now() - interval '15 minutes' then now()
      else t.ventana_inicio
    end;
end;
$$;

revoke all on function public.pin_ip_bloqueada(text) from public, anon, authenticated;
revoke all on function public.pin_registrar_fallo_ip(text) from public, anon, authenticated;
grant execute on function public.pin_ip_bloqueada(text) to service_role;
grant execute on function public.pin_registrar_fallo_ip(text) to service_role;

-- ---------------------------------------------------------------------------
-- SEC-03 · Contraseña temporal del personal institucional.
-- admin-personal crea la cuenta con app_metadata.debe_cambiar_contrasena = true.
-- Mientras la marca exista, el personal no ve ningún menor (RLS y funciones
-- usan es_personal_activo_de). La marca se borra solo cuando cambia la contraseña.
-- ---------------------------------------------------------------------------
create or replace function private.es_personal_activo_de(p_colegio_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'debe_cambiar_contrasena')::boolean, false) = false
    and exists (
      select 1
      from public.personal_institucion
      where id = auth.uid() and colegio_id = p_colegio_id and activo
    );
$$;

create function private.quitar_contrasena_temporal()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.encrypted_password is distinct from old.encrypted_password
     and new.raw_app_meta_data ? 'debe_cambiar_contrasena' then
    new.raw_app_meta_data := new.raw_app_meta_data - 'debe_cambiar_contrasena';
  end if;
  return new;
end;
$$;

create trigger quitar_contrasena_temporal
  before update of encrypted_password on auth.users
  for each row execute function private.quitar_contrasena_temporal();
