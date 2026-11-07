-- Registro de usuarios: países permitidos, perfiles y creación automática del perfil al registrarse.
-- Ejecutar completo en Supabase > SQL Editor.

-- Países habilitados para registro y su mayoría de edad legal.
create table public.countries (
  code char(2) primary key,
  name text not null unique,
  adult_age smallint not null check (adult_age between 14 and 25)
);

insert into public.countries (code, name, adult_age) values
  ('AR', 'Argentina', 18),
  ('BO', 'Bolivia', 18),
  ('CL', 'Chile', 18),
  ('CO', 'Colombia', 18),
  ('CR', 'Costa Rica', 18),
  ('CU', 'Cuba', 18),
  ('EC', 'Ecuador', 18),
  ('SV', 'El Salvador', 18),
  ('GT', 'Guatemala', 18),
  ('HN', 'Honduras', 21),
  ('MX', 'México', 18),
  ('NI', 'Nicaragua', 18),
  ('PA', 'Panamá', 18),
  ('PY', 'Paraguay', 18),
  ('PE', 'Perú', 18),
  ('PR', 'Puerto Rico', 21),
  ('DO', 'República Dominicana', 18),
  ('UY', 'Uruguay', 18),
  ('VE', 'Venezuela', 18);

alter table public.countries enable row level security;
grant select on public.countries to anon, authenticated;
create policy "Países visibles para todos"
  on public.countries for select to anon, authenticated
  using (true);

-- Perfil del usuario: todos los datos del registro excepto la contraseña (que vive solo en Supabase Auth).
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  username text not null check (username ~ '^[A-Za-z0-9_]{3,20}$'),
  country_code char(2) not null references public.countries (code),
  birth_date date not null,
  created_at timestamptz not null default now()
);

create unique index profiles_username_lower_key on public.profiles (lower(username));

alter table public.profiles enable row level security;
grant select on public.profiles to authenticated;
create policy "Cada usuario ve su propio perfil"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

-- Crea el perfil en la misma transacción que el usuario de Auth.
-- Si el país no existe o la persona es menor de edad, el registro completo se cancela.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_country text := new.raw_user_meta_data ->> 'country';
  v_birth_date date := (new.raw_user_meta_data ->> 'birth_date')::date;
  v_adult_age smallint;
begin
  select adult_age into v_adult_age from public.countries where code = v_country;

  if v_adult_age is null then
    raise exception 'País no permitido: %', v_country;
  end if;

  if v_birth_date > (current_date - make_interval(years => v_adult_age))::date then
    raise exception 'El usuario no es mayor de edad en %', v_country;
  end if;

  insert into public.profiles (id, email, username, country_code, birth_date)
  values (new.id, new.email, new.raw_user_meta_data ->> 'username', v_country, v_birth_date);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Permite validar el nombre de usuario antes de registrarse sin exponer la tabla de perfiles.
create or replace function public.is_username_available(p_username text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (select 1 from public.profiles where lower(username) = lower(p_username));
$$;

revoke execute on function public.is_username_available(text) from public;
grant execute on function public.is_username_available(text) to anon, authenticated;
