# Migration Supabase — procédure

Choix retenus : **Supabase Auth** · **multi-tenant** · **base vide** · **temps réel**.

L'app bascule automatiquement : sans les 3 variables d'env → mode mock (localStorage) ;
avec les 3 variables → Supabase (auth + données + temps réel). Rien ne casse tant que ce n'est pas configuré.

---

## 1. Créer le projet Supabase
1. Sur ton **nouveau compte Supabase** → **New project**.
2. Note le mot de passe DB (pas indispensable ici).
3. Attends que le projet soit prêt.

## 2. Créer le schéma
1. Supabase → **SQL Editor** → **New query**.
2. Colle tout le contenu de [`supabase/schema.sql`](supabase/schema.sql) → **Run**.
3. En bas, la dernière requête affiche l'**app_id** (ligne `aux-terrasses-troinex`).
   **Copie cet UUID** → ce sera `VITE_APP_ID`.

## 3. Créer les 2 comptes
1. Supabase → **Authentication → Users → Add user** (Auto-confirm user coché).
2. Crée le **directeur** (ex. `directeur@…`) et le **staff** (ex. `staff@…`) avec leurs mots de passe.
3. SQL Editor → colle [`supabase/link-users.sql`](supabase/link-users.sql).
   - Lance les 2 premiers `select` pour récupérer `app_id` et les `user_id`.
   - Remplace les `<...>`, puis lance l'`insert` (memberships) + les `update` (noms).

## 4. Récupérer les clés API
Supabase → **Project Settings → API** :
- **Project URL** → `VITE_SUPABASE_URL`
- **anon public** (clé) → `VITE_SUPABASE_ANON_KEY`

## 5. Configurer les variables
### En local
`cp .env.local.example .env.local` puis remplis les 3 valeurs (URL, anon, app_id).
`npm run dev` → l'app est en mode Supabase. Teste la connexion avec le compte directeur.

### Sur Cloudflare Pages
Projet `resa-dashboard` → **Settings → Variables and Secrets** → ajoute les **3** variables
(`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_APP_ID`) **pour Production**.
Puis **redéploie** (Deployments → Retry / ou un nouveau push).

## 6. Vérifier
- Connexion directeur → accès à tout ; staff → Arrivée + « + ».
- Crée une résa (staff) → elle apparaît **en direct** chez le directeur (temps réel).
- Recharge : les données persistent (elles sont dans Supabase, plus dans le navigateur).

---

## Sécurité (RLS) — résumé
- Chaque table est protégée par **Row Level Security**.
- On ne voit / modifie que les données des **apps dont on est membre** (`memberships`).
- Suppression réservée au **directeur** (l'app archive plutôt que supprimer).
- Impossible qu'un autre projet (autre `app_id`) voie les données du resto.

## Ajouter un futur projet sur le même Supabase
1. `insert into apps (slug, nom) values ('mon-projet','Mon Projet');`
2. Crée ses users + `memberships` (comme à l'étape 3).
3. Déploie le nouveau front avec **son** `VITE_APP_ID`. Tout est isolé automatiquement.
