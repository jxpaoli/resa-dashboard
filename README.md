# Dashboard Réservations — Aux Terrasses de Troinex 🍽️

Dashboard de gestion des réservations pour restaurant — **React** + **Vite** + **Supabase**.

- ✅ **Mobile-first** et responsive desktop
- ✅ Réceptionnistes + Directeur
- ✅ Interface française
- ✅ Prêt pour la production

## Démarrer en local

```bash
npm install
npm run dev
```

Ouvre http://localhost:5173

### Comptes de démo (mode mock)

| Rôle       | Email               | Mot de passe |
|------------|---------------------|--------------|
| Directeur  | directeur@resto.fr  | directeur    |
| Staff      | staff@resto.fr      | staff        |

Sur la page de login, clique sur **Directeur** ou **Staff** pour pré-remplir.

---

## Fonctionnalités

### 📋 Formulaire (`/formulaire`)
Staff et Directeur créent des réservations.
- Staff : créée en **proposée** → notification au Directeur
- Directeur : créée directement en **validée**
- Créneaux horaires : 09:00 → 23:00, pas de 15 min
- Service (midi/soir) **auto** selon l'heure

### 🚪 Arrivée (`/arrivee`)
Suivi des arrivées — Staff et Directeur.
- Réservations validées avec table attribuée
- Boutons : **Arrivé** · **Validation**
- Tri dynamique par état

### 📅 Réservations (`/reservations`) — Directeur uniquement
Gestion complète des réservations.

**Onglet 1 — Listes**
- Proposées : Valider / Rejeter
- Validées : **Éditer complètement** (client + horaires)

**Onglet 2 — Tableau de service**
- Cases par remise (-30%, -50%, Plein)
- Modal : **Remise + N° table**
- Récap couverts

---

## Architecture

### Aujourd'hui : Mock localStorage
Données de démo, 100% fonctionnel, prêt à passer à Supabase.

### Demain : Supabase + Cloudflare Pages
```
GitHub (code)
    ↓
Cloudflare Pages (build + déploiement auto)
    ↓
Supabase (auth + données)
```

## Configuration Supabase

1. Crée un projet Supabase
2. Copie `.env.local.example` → `.env.local`
3. Remplis les clés :
   ```
   VITE_SUPABASE_URL=https://...supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```
4. L'app bascule automatiquement du mock au vrai Supabase

## Structure

```
src/
├── pages/        Login, Formulaire, Arrivee, Reservations
├── components/   Navbar, ModalEditResa, ModalTable, RemiseBadge, etc.
├── context/      AuthContext, ToastContext
├── hooks/        useReservations
├── utils/        supabase (couche données), auth, notifications, constants
└── data/         store.js (mock)
```

## Données de démo

~10 réservations pré-chargées (validées et proposées), avec tables et remises variées.

---

## Déploiement

### Cloudflare Pages
1. Connecte ce repo à Cloudflare Pages
2. Build command: `npm run build`
3. Build output: `dist`
4. Ajoute les variables d'env (Supabase)

### GitHub Actions
Un workflow CI/CD viendra construire et déployer auto à chaque push.

---

## Licence

MIT (ou autre, à définir)

---

**Besoin d'aide ?** Consulte le [CLAUDE.md](CLAUDE.md) pour les détails d'architecture et les ajustements UX.
