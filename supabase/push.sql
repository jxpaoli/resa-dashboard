-- ============================================================================
-- NOTIFICATIONS PUSH — table des abonnements des appareils
-- À coller dans Supabase → SQL Editor → Run (après schema.sql).
-- ============================================================================

create table if not exists push_subscriptions (
  id           uuid primary key default gen_random_uuid(),
  app_id       uuid not null references apps(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  subscription jsonb not null,
  endpoint     text generated always as (subscription->>'endpoint') stored,
  created_at   timestamptz default now(),
  unique (user_id, endpoint)
);

alter table push_subscriptions enable row level security;

-- Chacun gère UNIQUEMENT ses propres abonnements
drop policy if exists push_select_own on push_subscriptions;
create policy push_select_own on push_subscriptions for select using (user_id = auth.uid());
drop policy if exists push_insert_own on push_subscriptions;
create policy push_insert_own on push_subscriptions for insert
  with check (user_id = auth.uid() and is_app_member(app_id));
drop policy if exists push_delete_own on push_subscriptions;
create policy push_delete_own on push_subscriptions for delete using (user_id = auth.uid());
