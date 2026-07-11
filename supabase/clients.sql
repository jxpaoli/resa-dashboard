-- ============================================================================
-- BASE CLIENTS — se remplit automatiquement à partir des réservations
-- (dédoublonnage par téléphone). À coller dans Supabase → SQL Editor → Run.
-- ============================================================================

create table if not exists clients (
  id         uuid primary key default gen_random_uuid(),
  app_id     uuid not null references apps(id) on delete cascade,
  civilite   text,
  nom        text not null,
  prenom     text,
  email      text,
  telephone  text,
  notes      text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists clients_app_nom_idx on clients (app_id, lower(nom));
-- Un client = un téléphone (par app). Index partiel : ignore les tél vides.
create unique index if not exists clients_app_tel_uidx
  on clients (app_id, telephone) where telephone is not null and telephone <> '';

drop trigger if exists trg_clients_updated on clients;
create trigger trg_clients_updated before update on clients
  for each row execute function set_updated_at();

alter table clients enable row level security;
drop policy if exists clients_all on clients;
create policy clients_all on clients for all
  using (is_app_member(app_id)) with check (is_app_member(app_id));

-- Upsert du client à chaque réservation (création ou édition), par téléphone
create or replace function upsert_client_from_resa() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(new.telephone, '') <> '' then
    insert into clients (app_id, civilite, nom, prenom, email, telephone)
    values (new.app_id, nullif(new.civilite,''), new.nom, nullif(new.prenom,''), nullif(new.email,''), new.telephone)
    on conflict (app_id, telephone) where telephone is not null and telephone <> ''
    do update set
      nom      = excluded.nom,
      prenom   = coalesce(excluded.prenom, clients.prenom),
      email    = coalesce(excluded.email, clients.email),
      civilite = coalesce(excluded.civilite, clients.civilite),
      updated_at = now();
  end if;
  return new;
end $$;

drop trigger if exists trg_upsert_client on reservations;
create trigger trg_upsert_client after insert or update on reservations
  for each row execute function upsert_client_from_resa();

-- (Optionnel) pré-remplir la base clients depuis les réservations déjà présentes :
insert into clients (app_id, civilite, nom, prenom, email, telephone)
select distinct on (app_id, telephone)
       app_id, nullif(civilite,''), nom, nullif(prenom,''), nullif(email,''), telephone
from reservations
where coalesce(telephone,'') <> ''
order by app_id, telephone, created_at desc
on conflict do nothing;
