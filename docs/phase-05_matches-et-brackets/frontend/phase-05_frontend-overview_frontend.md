# Développement Frontend - Plateforme de Tournois d'Échecs (Skill-Based)

**Date de création :** 5 décembre 2025  
**Dernière mise à jour :** Décembre 2025 (Phase 5 - Pages tournois)  
**Statut :** ✅ Complété et fonctionnel

## 📋 Vue d'ensemble

Ce document décrit l'implémentation complète de la couche frontend pour la plateforme Elite64, une application de tournois d'échecs basée sur la **compétence** (skill game), **PAS un site de paris**.

### Technologies utilisées

- **Framework :** Next.js 14.0.0 (Pages Router)
- **Language :** TypeScript
- **Styling :** Tailwind CSS
- **Authentification :** JWT (stocké dans localStorage)
- **State Management :** React Context API

### Architecture

- **Backend API :** NestJS + Prisma (port 4000)
- **Frontend :** Next.js (port 3000)
- **Base de données :** PostgreSQL

---

## 🏗️ Structure du Projet

### Arborescence complète

```
frontend/
├── components/
│   └── Layout.tsx              # Layout global avec header et footer
├── hooks/
│   └── useAuth.tsx             # Contexte d'authentification et hook useAuth
├── lib/
│   └── api.ts                  # Utilitaire pour les requêtes API
├── pages/
│   ├── _app.tsx                # App wrapper avec AuthProvider
│   ├── index.tsx                # Landing page
│   ├── register.tsx             # Page d'inscription
│   ├── login.tsx                # Page de connexion
│   ├── verify-email.tsx         # Vérification d'email
│   ├── forgot-password.tsx      # Mot de passe oublié
│   ├── reset-password.tsx       # Réinitialisation du mot de passe
│   ├── lobby.tsx                # Lobby des tournois (protégé)
│   ├── tournaments/             # Pages tournois (Phase 5)
│   │   ├── index.tsx            # Liste de tous les tournois
│   │   └── [id].tsx             # Détail d'un tournoi (matches + classement)
│   ├── wallet.tsx               # Page mon portefeuille (protégé)
│   ├── profile.tsx              # Page profil (protégé)
│   ├── terms.tsx                # Conditions Générales
│   └── privacy.tsx              # Politique de Confidentialité
├── styles/
│   └── globals.css              # Styles globaux + TailwindCSS
├── .env.local.example           # Exemple de configuration
├── next.config.js               # Configuration Next.js
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

---

## 📄 Pages Implémentées

### 1. Landing Page (`/` - `pages/index.tsx`)

**Objectif :** Page d'accueil avec informations légales claires et call-to-action.

**Contenu :**

- **Hero Section :**
  - Titre : "Tournois d'échecs à enjeu, 100% basés sur la compétence"
  - Sous-titre : "Pas de paris. Pas de hasard. Des compétitions de skill avec des prize pools fixes, déterminés à l'avance."
  - Boutons : "Créer un compte" et "Se connecter"

- **Section "Comment ça marche ?" :**
  - 3 colonnes avec icônes :
    - 🎯 "Compétence, pas de hasard"
    - ⚡ "Tournois rapides (≤ 1h)"
    - 💰 "Multi-niveaux de buy-in"

- **Section "Conformité légale" :**
  - Explication des jeux de compétence
  - Mention "18+ uniquement"
  - Restrictions géographiques
  - "Void where prohibited"

**Style :** Design moderne avec Tailwind, pas de visuels "casino" ou "paris sportifs".

---

### 2. Page d'Inscription (`/register` - `pages/register.tsx`)

**Objectif :** Permettre la création de compte avec validation d'âge et acceptation des CGU.

**Formulaire :**

- **Champs requis :**
  - `username` (texte)
  - `email` (email)
  - `password` (password, min 8 caractères)
  - `countryCode` (texte, ISO 3166-1 alpha-2, ex: "FR", "CH", "US")
  - `dateOfBirth` (date)

- **Checkboxes obligatoires :**
  - ☑ "Je confirme avoir au moins **18 ans** et que la participation est autorisée dans ma juridiction."
  - ☑ "J'accepte les [Conditions Générales](/terms) et la [Politique de Confidentialité](/privacy)."

**Fonctionnalités :**

- Validation côté client (longueur du mot de passe, checkboxes)
- POST vers `${NEXT_PUBLIC_API_BASE_URL}/players` avec :
  ```json
  {
    "username": "string",
    "email": "string",
    "password": "string",
    "countryCode": "string",
    "dateOfBirth": "YYYY-MM-DD"
  }
  ```
- Message de succès : "Compte créé. Merci de vérifier votre e-mail pour activer votre compte."
- Gestion des erreurs API (ex: < 18 ans, email déjà utilisé)
- Redirection vers `/login` après succès

**Textes légaux :**
- Avertissement : "Vous devez avoir au moins **18 ans** pour créer un compte."

---

### 3. Page de Connexion (`/login` - `pages/login.tsx`)

**Objectif :** Authentification des utilisateurs avec JWT.

**Formulaire :**

- `email` (email, requis)
- `password` (password, requis)
- Lien "Mot de passe oublié ?" vers `/forgot-password`

**Fonctionnalités :**

- POST vers `${NEXT_PUBLIC_API_BASE_URL}/auth/login` avec :
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- En cas de succès :
  - Récupération de `accessToken` et `player`
  - Stockage du token dans `localStorage.setItem('authToken', accessToken)`
  - Stockage du player dans le contexte d'authentification
  - Redirection vers `/lobby`
- Gestion des erreurs :
  - "Please verify your email before logging in." → affiché clairement
  - "Invalid credentials" → message générique

---

### 4. Page de Vérification d'Email (`/verify-email` - `pages/verify-email.tsx`)

**Objectif :** Activer le compte après réception de l'email de vérification.

**Fonctionnalités :**

- Lecture du token depuis l'URL : `?token=...`
- Au chargement (useEffect) :
  - POST vers `${NEXT_PUBLIC_API_BASE_URL}/auth/verify-email` avec :
    ```json
    {
      "token": "string"
    }
    ```
- Affichage :
  - ✅ **Succès :** "Votre adresse e-mail a été vérifiée. Vous pouvez maintenant vous connecter." + bouton vers `/login`
  - ❌ **Erreur :** "Lien invalide ou expiré." + liens vers `/login` et `/`

**États :**
- `loading` : "Vérification en cours..."
- `success` : Message de succès
- `error` : Message d'erreur

---

### 5. Page Mot de Passe Oublié (`/forgot-password` - `pages/forgot-password.tsx`)

**Objectif :** Demander l'envoi d'un email de réinitialisation.

**Formulaire :**

- `email` (email, requis)

**Fonctionnalités :**

- POST vers `${NEXT_PUBLIC_API_BASE_URL}/auth/forgot-password` avec :
  ```json
  {
    "email": "string"
  }
  ```
- **Toujours** afficher le même message (pour des raisons de sécurité) :
  - "Si un compte existe pour cet e-mail, un lien de réinitialisation a été envoyé."
  - "Vérifiez votre boîte de réception et vos spams. Le lien est valide pendant une durée limitée."
- Lien vers `/login`

---

### 6. Page Réinitialisation Mot de Passe (`/reset-password` - `pages/reset-password.tsx`)

**Objectif :** Permettre la réinitialisation du mot de passe avec un token.

**Fonctionnalités :**

- Lecture du token depuis l'URL : `?token=...`
- Formulaire :
  - `newPassword` (password, min 8 caractères)
  - `confirmPassword` (password, doit correspondre)
- Validation :
  - Longueur minimale : 8 caractères
  - Correspondance des deux champs
- POST vers `${NEXT_PUBLIC_API_BASE_URL}/auth/reset-password` avec :
  ```json
  {
    "token": "string",
    "newPassword": "string"
  }
  ```
- Affichage :
  - ✅ **Succès :** "Mot de passe réinitialisé. Vous pouvez maintenant vous connecter." + lien vers `/login`
  - ❌ **Erreur :** "Le lien de réinitialisation est invalide ou a expiré."

---

### 7. Page Lobby (`/lobby` - `pages/lobby.tsx`)

**Objectif :** Page protégée affichant le lobby des tournois avec possibilité de s'inscrire.

**Fonctionnalités :**

- **Protection par authentification :**
  - Vérification du token dans localStorage
  - Si non authentifié → redirection vers `/login`
  - Appel à `/auth/me` pour récupérer les infos du joueur

- **Chargement des tournois :**
  - Appel automatique à `GET /tournaments` au montage de la page
  - Affichage de tous les tournois visibles (statut SCHEDULED, READY, RUNNING)
  - Rechargement automatique après inscription réussie

- **Affichage des tournois :**
  - **Informations principales :**
    - Nom du tournoi
    - Time control (ex: "10+0")
    - Buy-in formaté en monnaie
    - Nombre de joueurs (current / max)
    - Date de début
    - Statut du tournoi (badge coloré)
  
  - **Badges Prize Pool avec code couleur :**
    - **État 1 (< minPlayers) :** Badge gris (`bg-gray-100`)
      - Texte : "Prize pool min : X"
      - Sous-texte : "Inscrits : N / min minPlayers / max maxPlayers – Tournoi annulé si < minPlayers."
    
    - **État 2 (entre min et max) :** Badge bleu (`bg-blue-100`)
      - Texte : "Prize pool actuel : Z"
      - Sous-texte : "Peut monter jusqu'à Y."
    
    - **État 3 (max atteint) :** Badge vert (`bg-green-100`)
      - Texte : "Prize pool max atteint : Y"
      - Sous-texte : "Tournoi complet (maxPlayers / maxPlayers)."

- **Bouton "Rejoindre" :**
  - Affiché uniquement si :
    - Statut = `SCHEDULED` ou `READY`
    - `currentPlayers < maxPlayers`
    - Date actuelle < `registrationClosesAt` (si définie)
  - Au clic :
    - Appel à `POST /tournaments/:id/join` avec token JWT
    - Gestion des erreurs (fonds insuffisants, déjà inscrit, etc.)
    - Rechargement automatique de la liste après succès

- **Formatage des montants :**
  - Fonction utilitaire `formatCents()` pour convertir les centimes en monnaie formatée
  - Format : `Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })`
  - Exemple : `1000` centimes → `"10,00 €"`

- **Gestion des erreurs :**
  - Affichage des messages d'erreur API
  - Messages clairs pour les cas d'échec (fonds insuffisants, tournoi complet, etc.)

- **Message de contexte :**
  - Explication : "Les prize pools indiqués dépendent du nombre de joueurs inscrits."
  - Avertissement : "Le tournoi est annulé et remboursé si moins de joueurs minimum s'inscrivent."

- **États :**
  - `loading` : "Chargement..." pendant la récupération des tournois
  - `loadingTournaments` : État de chargement spécifique aux tournois
  - `error` : Affichage des erreurs avec message clair
  - `authenticated` : Affichage du lobby avec liste des tournois
  - `not authenticated` : Redirection automatique vers `/login`

---

### 8. Page Mon Portefeuille (`/wallet` - `pages/wallet.tsx`)

**Objectif :** Afficher le solde du wallet et l'historique des transactions du joueur connecté.

**Fonctionnalités :**

- **Protection par authentification :**
  - Vérification via `useAuth()`
  - Si non authentifié → redirection automatique vers `/login`
  - Appel à `GET /wallets/me` avec token JWT automatique

- **Affichage du solde :**
  - Solde formaté en euros : `(balanceCents / 100).toFixed(2)`
  - Devise affichée (EUR, USD, etc.)

- **Liste des transactions :**
  - Tableau avec colonnes : Date, Type, Montant, Description
  - Montants colorés :
    - Vert (`text-green-400`) pour les crédits (montant > 0) avec préfixe "+"
    - Rouge (`text-red-400`) pour les débits (montant < 0) avec préfixe "−"
  - Date formatée en français : `new Date(createdAt).toLocaleString('fr-FR')`
  - Types traduits en français (DEPOSIT → "Dépôt", etc.)

- **Bouton de crédit de test (DEV uniquement) :**
  - Affiché uniquement si `NEXT_PUBLIC_ENABLE_TEST_CREDIT === 'true'`
  - Bouton "Ajouter 10€ de crédit de test"
  - Appel à `POST /wallets/test-credit` avec `amountCents: 1000`
  - Rafraîchissement automatique du wallet après crédit

- **États gérés :**
  - `loading` : "Chargement..." pendant la récupération du wallet
  - `error` : Affichage de l'erreur si la requête échoue
  - `401 Unauthorized` : Redirection automatique vers `/login`

**Exemple d'utilisation :**

```typescript
// La page utilise automatiquement le token JWT stocké dans localStorage
// via l'utilitaire api.ts qui ajoute le header Authorization
const wallet = await api.getMyWallet()
```

**Types TypeScript :**

Les types sont définis dans `lib/api.ts` :
- `Wallet` : Interface pour le wallet avec transactions
- `Transaction` : Interface pour une transaction
- `TransactionType` : Union type pour les types de transactions
- `TournamentStatus` : Union type pour les statuts de tournoi (DRAFT, SCHEDULED, READY, RUNNING, FINISHED, CANCELED)
- `PrizePoolView` : Interface pour un prize pool (totalEntriesCents, commissionCents, distributableCents)
- `TournamentListItem` : Interface complète pour un tournoi avec prize pools min/current/max
- `JoinTournamentResponse` : Réponse de l'API lors de l'inscription à un tournoi

---

### 9. Pages Légales

#### Conditions Générales (`/terms` - `pages/terms.tsx`)

**Contenu :**
- Section 1 : Objet
- Section 2 : Nature du service (skill games, pas de paris)
- Section 3 : Conditions d'accès (18+)
- Section 4 : Inscription et compte
- Section 5 : Responsabilité
- Section 6 : Modifications
- Section 7 : Contact
- Mention "Void where prohibited"

#### Politique de Confidentialité (`/privacy` - `pages/privacy.tsx`)

**Contenu :**
- Section 1 : Collecte des données
- Section 2 : Utilisation des données
- Section 3 : Protection des données
- Section 4 : Partage des données
- Section 5 : Vos droits (RGPD)
- Section 6 : Conservation des données
- Section 7 : Cookies
- Section 8 : Contact

---

## 🔐 Système d'Authentification

### Contexte d'Authentification (`hooks/useAuth.tsx`)

**Fonctionnalités :**

- **AuthProvider :** Contexte React global
- **Hook `useAuth()` :** Expose :
  - `isAuthenticated` : boolean
  - `player` : Player | null
  - `loading` : boolean
  - `login(email, password)` : Promise<void>
  - `logout()` : void
  - `refreshPlayer()` : Promise<void>

**Comportement :**

- Vérification automatique du token au chargement de l'app
- Appel à `/auth/me` pour valider le token et récupérer le player
- Stockage du token dans `localStorage` (clé : `authToken`)
- Logout : suppression du token + redirection vers `/`

**Intégration :**

- Wrapper dans `_app.tsx` :
  ```tsx
  <AuthProvider>
    <Component {...pageProps} />
  </AuthProvider>
  ```

---

### Utilitaire API (`lib/api.ts`)

**Fonctionnalités :**

- Fonction générique `apiRequest<T>()` :
  - Gestion automatique des headers
  - Ajout automatique du token JWT si disponible
  - Gestion des erreurs avec types TypeScript
- Fonctions API :
  - `api.login(email, password)` - Connexion
  - `api.register(data)` - Inscription
  - `api.verifyEmail(token)` - Vérification d'email
  - `api.forgotPassword(email)` - Mot de passe oublié
  - `api.resetPassword(token, newPassword)` - Réinitialisation du mot de passe
  - `api.getMe()` - Récupérer les infos du joueur connecté
  - `api.getMyWallet()` - Récupérer le wallet avec transactions (protégé JWT)
  - `api.testCredit(amountCents)` - Créditer le wallet de test (DEV uniquement, protégé JWT)
  - `api.getTournaments()` - Récupérer la liste des tournois (public)
  - `api.getTournament(id)` - Récupérer le détail d'un tournoi (public)
  - `api.joinTournament(tournamentId)` - S'inscrire à un tournoi (protégé JWT)

**Configuration :**

- URL de base : `process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'`
- Headers automatiques : `Content-Type: application/json`
- Token JWT : `Authorization: Bearer {token}` (si disponible)

---

## 🎨 Composants

### Layout Global (`components/Layout.tsx`)

**Structure :**

- **Header :**
  - Logo "Elite64" (lien vers `/`)
  - Navigation conditionnelle :
    - Si **non authentifié** : "Connexion" + "Inscription"
    - Si **authentifié** : "Lobby" + "Mon portefeuille" + "{username}" + "Déconnexion"

- **Main :** Contenu des pages (children)

- **Footer :**
  - Colonne 1 : "À propos" (skill games, pas de paris)
  - Colonne 2 : "Conformité légale" (18+, restrictions géographiques, "Void where prohibited")
  - Colonne 3 : "Mentions légales" (liens vers `/terms` et `/privacy`)
  - Copyright

**Props :**

```tsx
interface LayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
}
```

**Utilisation :**

Toutes les pages utilisent le composant `<Layout>` pour un design cohérent.

---

## ⚙️ Configuration

### Variables d'Environnement

**Fichier :** `frontend/.env.local`

```env
# URL de base de l'API backend
# Exemple pour développement local : http://localhost:4000
# En production, remplacer par l'URL de votre API déployée
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000

# Activer le bouton de crédit de test (DEV uniquement)
# ⚠️ IMPORTANT : En production, mettre à 'false' ou supprimer cette variable
# pour désactiver le bouton de crédit de test
NEXT_PUBLIC_ENABLE_TEST_CREDIT=true
```

**Fichier d'exemple :** `frontend/.env.local.example`

**Variables disponibles :**

- `NEXT_PUBLIC_API_BASE_URL` : URL de base de l'API backend (requis)
- `NEXT_PUBLIC_ENABLE_TEST_CREDIT` : Active le bouton de crédit de test sur la page `/wallet` (optionnel, `true` en dev, `false` ou absent en production)

**Utilisation dans le code :**

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'
const enableTestCredit = process.env.NEXT_PUBLIC_ENABLE_TEST_CREDIT === 'true'
```

---

### Configuration Next.js (`next.config.js`)

```javascript
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
}
```

---

## ✅ Exigences Légales Respectées

### 1. Textes clairs sur les skill games

✅ **Landing page :**
- "Tournois d'échecs à enjeu, 100% basés sur la compétence"
- "Pas de paris. Pas de hasard. Des compétitions de skill avec des prize pools fixes, déterminés à l'avance."

✅ **Footer :**
- "Compétitions d'échecs basées sur la compétence, pas de jeux de hasard."
- "Pas de paris. Pas de hasard. Prize pools fixes déterminés à l'avance."

### 2. Accès réservé aux adultes (18+)

✅ **Page d'inscription :**
- Texte : "Vous devez avoir au moins **18 ans** pour créer un compte."
- Champ `dateOfBirth` obligatoire
- Checkbox : "Je confirme avoir au moins **18 ans** et que la participation est autorisée dans ma juridiction."

✅ **Footer :**
- "**18+ uniquement**"

### 3. Restrictions géographiques

✅ **Footer :**
- "Service réservé aux zones où les jeux de compétence payants sont autorisés."
- "Indisponible dans certaines juridictions."
- "**Void where prohibited.**"

### 4. Acceptation des CGU

✅ **Page d'inscription :**
- Checkbox : "J'accepte les [Conditions Générales](/terms) et la [Politique de Confidentialité](/privacy)."
- Liens fonctionnels vers `/terms` et `/privacy`

---

## 🚀 Démarrage du Projet

### Prérequis

- Node.js 18+
- Backend NestJS démarré sur `http://localhost:4000`
- Base de données PostgreSQL accessible

### Installation

```bash
cd frontend
npm install
```

### Configuration

1. Créer le fichier `.env.local` :
   ```bash
   copy .env.local.example .env.local
   ```

2. Vérifier/modifier `NEXT_PUBLIC_API_BASE_URL` si nécessaire

### Démarrage

```bash
npm run dev
```

Le frontend sera accessible sur `http://localhost:3000`

---

## 📝 Flux Utilisateur Complet

### 1. Inscription

1. Utilisateur va sur `/register`
2. Remplit le formulaire (18+, accepte CGU)
3. Soumet → POST `/players`
4. Reçoit : "Compte créé. Merci de vérifier votre e-mail."
5. Reçoit un email avec lien de vérification

### 2. Vérification d'Email

1. Utilisateur clique sur le lien dans l'email
2. Redirigé vers `/verify-email?token=...`
3. Appel automatique à POST `/auth/verify-email`
4. Message : "Email vérifié. Vous pouvez maintenant vous connecter."

### 3. Connexion

1. Utilisateur va sur `/login`
2. Entre email et mot de passe
3. Soumet → POST `/auth/login`
4. Token stocké dans localStorage
5. Redirection vers `/lobby`

### 4. Lobby (Protégé)

1. Utilisateur accède à `/lobby`
2. Vérification automatique du token
3. Appel à GET `/auth/me` pour vérifier l'authentification
4. Appel à GET `/tournaments` pour charger la liste des tournois
5. Affichage : "Bonjour {username} !" + liste des tournois avec prize pools
6. Utilisateur peut cliquer sur "Rejoindre" pour s'inscrire à un tournoi
7. Après inscription réussie, la liste se recharge automatiquement

### 5. Mot de Passe Oublié

1. Utilisateur va sur `/forgot-password`
2. Entre son email
3. Soumet → POST `/auth/forgot-password`
4. Message : "Si un compte existe, un lien a été envoyé."
5. Reçoit un email avec lien de réinitialisation

### 6. Réinitialisation

1. Utilisateur clique sur le lien dans l'email
2. Redirigé vers `/reset-password?token=...`
3. Entre nouveau mot de passe
4. Soumet → POST `/auth/reset-password`
5. Message : "Mot de passe réinitialisé."

---

## 🔒 Sécurité

### Points d'Attention

- ⚠️ **Token JWT dans localStorage :** Actuellement stocké dans `localStorage` pour simplifier le développement. En production, considérer :
  - HttpOnly cookies
  - Refresh tokens
  - Rotation des tokens

### Bonnes Pratiques Implémentées

- ✅ Validation côté client ET serveur
- ✅ Messages d'erreur génériques (sécurité)
- ✅ Protection des routes sensibles (`/lobby`)
- ✅ Vérification du token à chaque requête API
- ✅ Gestion des erreurs réseau

---

## 📊 État d'Avancement

### ✅ Complété

- [x] Structure de base (Pages Router)
- [x] Layout global avec header et footer
- [x] Landing page avec sections légales
- [x] Page d'inscription avec validation 18+
- [x] Page de connexion avec JWT
- [x] Page de vérification d'email
- [x] Page mot de passe oublié
- [x] Page réinitialisation mot de passe
- [x] Page lobby protégée avec liste des tournois et inscription
- [x] Pages légales (CGU, Privacy)
- [x] Système d'authentification (Context + Hook)
- [x] Utilitaire API avec gestion des erreurs
- [x] Configuration des variables d'environnement
- [x] Textes légaux complets
- [x] Design moderne avec Tailwind
- [x] Gestion des comptes suspendus (Phase 4.6)
- [x] Page liste des tournois `/tournaments` (Phase 5)
- [x] Page détail tournoi `/tournaments/[id]` avec matches et classement (Phase 5)
- [x] Actions admin pour démarrer un tournoi (Phase 5)
- [x] Navigation améliorée (lien "Tournois" dans Layout et lobby)

### ⚠️ Limitations Phase 5 (Historique)

**Note** : Ces limitations concernaient la Phase 5 figée (tag: `baseline-phase5-202512`). Elles ont été levées par les phases suivantes :

- **Plateau d'échecs intégré** : ✅ **Implémenté en Phase 6.1** (tag: `phase6-1-20251216`)  
  - Page `/matches/[id]` avec échiquier interactif (`react-chessboard`)
  - Gameplay complet : coups, promotion, résignation
  - Polling automatique (2s) pour mises à jour temps réel
  
- **Enregistrement des résultats** : ✅ **Automatisé en Phase 6.0.C** (tag: `phase6-0c-20251215`)
  - Endpoints backend : `/matches/:id/move`, `/matches/:id/resign`
  - Résultats enregistrés automatiquement après chaque coup ou résignation
  - Finalisation automatique des tournois et distribution des gains
  
- **Tests E2E complets** : ✅ **Validés en Phase 6.2** (tag: `phase6-2-20251216`)
  - Scripts E2E exhaustifs : 11/11 tests PASS (100%)
  - Validation de tous les types de mouvements aux échecs

### 🔄 À Développer (Futur)

- [ ] Page de profil utilisateur
- [x] Liste des tournois disponibles (implémentée dans `/lobby` et `/tournaments`)
- [x] Inscription aux tournois (bouton "Rejoindre" dans `/lobby`)
- [x] Gestion du wallet (page `/wallet` implémentée)
- [x] Page de détail d'un tournoi (`/tournaments/[id]`) ✅ Phase 5
- [ ] **Plateau d'échecs interactif** (intégration chess.js)
- [ ] **Interface de jeu en temps réel** pour les matches
- [ ] **Interface admin pour enregistrer les résultats** depuis la page du tournoi
- [ ] Historique des matchs personnels
- [x] Classements par tournoi (implémenté dans `/tournaments/[id]`) ✅ Phase 5
- [ ] Classements globaux (leaderboard)
- [ ] Notifications
- [ ] Amélioration de la sécurité (HttpOnly cookies)

---

## 🐛 Dépannage

### Problèmes Courants

**1. Erreur CORS**
- Vérifier que le backend autorise les requêtes depuis `http://localhost:3000`
- Vérifier `FRONTEND_URL` dans le `.env` du backend

**2. Token non reconnu**
- Vérifier que le token est bien stocké dans localStorage
- Vérifier que le backend est démarré
- Vérifier `NEXT_PUBLIC_API_BASE_URL` dans `.env.local`

**3. Email non reçu**
- Vérifier la configuration SMTP du backend
- Vérifier les spams
- Vérifier les logs du backend

**4. Redirection infinie**
- Vérifier que le token est valide
- Vérifier que `/auth/me` fonctionne
- Vérifier la logique de redirection dans `useAuth`

---

## 📚 Ressources

### Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

### Documentation Interne

- [Gérer les comptes suspendus côté frontend](../../phase-04_prize-pool-et-moderation/frontend/phase-04_suspended-accounts-ux_frontend.md) - Phase 4.6
- [Implémenter les rôles et l'espace admin v1](../../phase-04_prize-pool-et-moderation/frontend/phase-04_roles-admin-interface_frontend.md)
- [React Context API](https://react.dev/reference/react/useContext)

### Fichiers de Référence

- `docs/backend/README - Renforcer l'authentification et la conformité légale.md`
- `docs/backend/README - Configuration SMTP Infomaniak.md`

---

## 👥 Contribution

Pour toute modification ou amélioration :

1. Respecter la structure existante
2. Maintenir les textes légaux
3. Tester tous les flux d'authentification
4. Vérifier la compatibilité avec le backend

---

**Dernière mise à jour :** Décembre 2025  
**Version :** 1.1.0  
**Statut :** ✅ Production Ready (avec améliorations de sécurité recommandées)

