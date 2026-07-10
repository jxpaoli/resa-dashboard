-- ============================================================================
-- SCHÉMA MULTI-TENANT — Réservations
-- (Aux Terrasses de Troinex = 1ère app ; réutilisable pour d'autres projets)
-- À coller dans Supabase → SQL Editor → Run.
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------- ENUMS ---------------------------------------
do $$ begin create type app_role     as enum ('directeur','staff');                       exception when duplicate_object then null; end $$;
do $$ begin create type resa_status  as enum ('proposed','validated','archived');          exception when duplicate_object then null; end $$;
do $$ begin create type resa_source  as enum ('thefork','wix','directeur','staff');        exception when duplicate_object then null; end $$;
do $$ begin create type resa_service as enum ('midi','soir','evenement');                  exception when duplicate_object then null; end $$;

-- ----------------------------- TABLES --------------------------------------
create table if not exists apps (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,
  nom        text not null,
  created_at timestamptz default now()
);

-- profiles : 1 ligne par utilisateur (lié à auth.users)
create table if not exists profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  nom        text,
  created_at timestamptz default now()
);

-- memberships : qui a accès à quelle app + avec quel rôle
create table if not exists memberships (
  id         uuid primary key default gen_random_uuid(),
  app_id     uuid not null references apps(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       app_role not null default 'staff',
  created_at timestamptz default now(),
  unique (app_id, user_id)
);

-- reservations : porte un app_id
create table if not exists reservations (
  id            uuid primary key default gen_random_uuid(),
  app_id        uuid not null references apps(id) on delete cascade,
  civilite      text,
  nom           text not null,
  prenom        text,
  email         text,
  telephone     text,
  date          date not null,
  heure         text not null,                 -- 'HH:MM'
  couverts      int  not null default 2,
  remise        text,                          -- 'plein' | '-30%' | '-50%' | null (à définir)
  notes         text,
  numero_table  int,
  status        resa_status  not null default 'proposed',
  source        resa_source,
  service       resa_service,
  presence      text,                          -- null | present | validated | noshow | annule
  evenement     boolean not null default false,
  type_evenement text,
  created_by    uuid references auth.users(id),
  validated_by  uuid references auth.users(id),
  validated_at  timestamptz,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index if not exists reservations_app_date_idx on reservations (app_id, date);

-- ----------------------- updated_at automatique ----------------------------
create or replace function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists trg_resa_updated on reservations;
create trigger trg_resa_updated before update on reservations
  for each row execute function set_updated_at();

-- ------------------- profil créé auto à l'inscription ----------------------
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nom)
  values (new.id, coalesce(new.raw_user_meta_data->>'nom', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists trg_new_user on auth.users;
create trigger trg_new_user after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------- helpers RLS (SECURITY DEFINER = pas de récursion) ---------
create or replace function is_app_member(p_app uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from memberships m where m.app_id = p_app and m.user_id = auth.uid());
$$;

create or replace function is_app_directeur(p_app uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from memberships m
                 where m.app_id = p_app and m.user_id = auth.uid() and m.role = 'directeur');
$$;

-- ------------------------------- RLS ---------------------------------------
alter table apps         enable row level security;
alter table profiles     enable row level security;
alter table memberships  enable row level security;
alter table reservations enable row level security;

drop policy if exists apps_select on apps;
create policy apps_select on apps for select using (is_app_member(id));

drop policy if exists profiles_select_own on profiles;
create policy profiles_select_own on profiles for select using (id = auth.uid());
drop policy if exists profiles_update_own on profiles;
create policy profiles_update_own on profiles for update using (id = auth.uid());

drop policy if exists memberships_select_own on memberships;
create policy memberships_select_own on memberships for select using (user_id = auth.uid());

drop policy if exists resa_select on reservations;
create policy resa_select on reservations for select using (is_app_member(app_id));
drop policy if exists resa_insert on reservations;
create policy resa_insert on reservations for insert with check (is_app_member(app_id));
drop policy if exists resa_update on reservations;
create policy resa_update on reservations for update using (is_app_member(app_id)) with check (is_app_member(app_id));
drop policy if exists resa_delete on reservations;
create policy resa_delete on reservations for delete using (is_app_directeur(app_id));

-- ----------------------------- Realtime ------------------------------------
do $$ begin
  alter publication supabase_realtime add table reservations;
exception when duplicate_object then null; end $$;

-- --------------------------- L'app resto -----------------------------------
insert into apps (slug, nom)
values ('aux-terrasses-troinex', 'Aux Terrasses de Troinex')
on conflict (slug) do nothing;

-- Récupère l'app_id (à mettre dans VITE_APP_ID) :
select id as app_id, slug from apps where slug = 'aux-terrasses-troinex';
