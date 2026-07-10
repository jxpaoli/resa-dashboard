-- ============================================================================
-- LIER LES COMPTES À L'APP  (à lancer APRÈS avoir créé les 2 users
-- dans Supabase → Authentication → Users → Add user)
-- ============================================================================

-- 1) Retrouve les IDs dont tu as besoin :
select id as app_id from apps where slug = 'aux-terrasses-troinex';
select id as user_id, email from auth.users order by created_at;

-- 2) Remplace les <...> par les UUID récupérés ci-dessus, puis lance :
insert into memberships (app_id, user_id, role) values
  ('<APP_ID>', '<UID_DIRECTEUR>', 'directeur'),
  ('<APP_ID>', '<UID_STAFF>',     'staff')
on conflict (app_id, user_id) do update set role = excluded.role;

-- 3) (optionnel) noms affichés :
update profiles set nom = 'Le Directeur'   where id = '<UID_DIRECTEUR>';
update profiles set nom = 'Camille (Staff)' where id = '<UID_STAFF>';
