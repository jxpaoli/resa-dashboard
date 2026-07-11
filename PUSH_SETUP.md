# Notifications push — mise en place

Objectif : quand le **staff propose** une réservation, le **directeur** reçoit une
notification push (même app fermée).

Clés VAPID (déjà générées) :
- **Publique** : `BIa8PpHHXIw5fcavKOI_JYLKnbVu1o7_sfxzOwxNINld07O7wO2EHonlSGy032MHEjENjUVvl4EdnOQoYYcc6W4`
- **Privée** (SECRÈTE) : `4okcRBsKjYNpmquGQo2p5u9oNc5bGYcm9cnlWctIAu0`
- **WEBHOOK_SECRET** (choisis une chaîne au hasard, ex.) : `t2t_push_9f3a1c7b`

---

## 1. Table des abonnements
Supabase → **SQL Editor** → colle [`supabase/push.sql`](supabase/push.sql) → **Run**.

## 2. Déployer l'Edge Function
Supabase → **Edge Functions** → **Create a function** (éditeur web) :
- Nom : **`notify-directeur`**
- Colle le contenu de [`supabase/functions/notify-directeur/index.ts`](supabase/functions/notify-directeur/index.ts)
- **Deploy**
- Dans les réglages de la fonction : **désactive « Verify JWT »** (le webhook n'est pas un utilisateur connecté).

*(Alternative CLI : `supabase functions deploy notify-directeur --no-verify-jwt`)*

## 3. Secrets de la fonction
Edge Functions → **notify-directeur → Secrets** (ou Settings → Edge Functions → Secrets) — ajoute :
```
VAPID_PUBLIC_KEY   = BIa8PpHHXIw5fcavKOI_JYLKnbVu1o7_sfxzOwxNINld07O7wO2EHonlSGy032MHEjENjUVvl4EdnOQoYYcc6W4
VAPID_PRIVATE_KEY  = 4okcRBsKjYNpmquGQo2p5u9oNc5bGYcm9cnlWctIAu0
WEBHOOK_SECRET     = t2t_push_9f3a1c7b
```
*(SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont déjà fournis automatiquement.)*

## 4. Database Webhook
Supabase → **Database → Webhooks** → **Create a new hook** :
- Name : `resa-proposee`
- Table : **`reservations`** · Events : **Insert**
- Type : **HTTP Request** · Method : **POST**
- URL : `https://lrittnexagnqcnnxbzrx.supabase.co/functions/v1/notify-directeur`
- **HTTP Headers** → ajoute :
  - `Content-Type` : `application/json`
  - `x-webhook-secret` : `t2t_push_9f3a1c7b`
- **Create**

## 5. Clé VAPID publique dans Cloudflare
Cloudflare → projet `resa-dashboard` → **Settings → Variables** → ajoute :
```
VITE_VAPID_PUBLIC_KEY = BIa8PpHHXIw5fcavKOI_JYLKnbVu1o7_sfxzOwxNINld07O7wO2EHonlSGy032MHEjENjUVvl4EdnOQoYYcc6W4
```
Puis **redéploie** (les variables `VITE_` sont utilisées au build).

## 6. Tester
1. Sur un appareil, connecte-toi **directeur** → clique la **🔔** (bandeau) → « Notifications activées ».
   *(Sur mobile : ajoute d'abord le site à l'écran d'accueil (PWA) pour un push fiable, surtout iOS 16.4+.)*
2. Sur un autre appareil / onglet, connecte-toi **staff** → crée une réservation (« + »).
3. Le directeur reçoit la **notification push** 🔔.

---

### Notes
- La cloche 🔔 est **grise** si les notifs ne sont pas activées, **avec un point vert** quand elles le sont.
- Un abonnement expiré est nettoyé automatiquement par la fonction.
- iOS : le push web ne marche que si le site est **installé sur l'écran d'accueil** (PWA), à partir d'iOS 16.4.
