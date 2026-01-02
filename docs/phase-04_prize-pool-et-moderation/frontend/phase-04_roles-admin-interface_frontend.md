# Rôles et Espace Admin v1 - Documentation Frontend

**Date de création** : 01 décembre 2025  
**Dernière mise à jour** : 01 décembre 2025  
**Statut** : ✅ Complété

---

## 📋 Vue d'ensemble

Ce document décrit l'implémentation du système de rôles côté frontend et la création de l'espace d'administration v1 pour la plateforme Elite64.

---

## 🎯 Objectifs

Cette implémentation ajoute au frontend :
- ✅ Support du système de rôles (PLAYER, ADMIN, SUPER_ADMIN)
- ✅ Affichage visuel des rôles (couleurs + icônes)
- ✅ Hook `useAuth` étendu avec `isAdmin` et `isSuperAdmin`
- ✅ Lien "Admin" dans le header pour les administrateurs
- ✅ Espace admin protégé avec 3 pages :
  - Dashboard admin (`/admin`)
  - Gestion des joueurs (`/admin/players`)
  - Gestion des tournois (`/admin/tournaments`)
- ✅ Protection des pages admin (redirection si non admin)

---

## 🔧 Modifications apportées

### 1. Types et interfaces

#### `lib/api.ts`

Ajout du type `PlayerRole` et mise à jour de l'interface `Player` :

```typescript
export type PlayerRole = 'PLAYER' | 'ADMIN' | 'SUPER_ADMIN'

export interface Player {
  id: string
  username: string
  email: string
  countryCode: string
  dateOfBirth: string
  emailVerified: boolean
  role: PlayerRole  // Nouveau champ
}
```

#### Types pour l'API Admin

```typescript
// Admin - Players
export interface AdminPlayer {
  id: string
  username: string
  email: string
  countryCode: string
  role: PlayerRole
  isActive: boolean
  createdAt: string
}

export interface AdminPlayersResponse {
  data: AdminPlayer[]
  total: number
  skip: number
  take: number
}

// Admin - Tournaments
export interface AdminTournament {
  id: string
  name: string
  status: TournamentStatus
  timeControl: string
  buyInCents: number
  currency: string
  minPlayers: number
  maxPlayers: number
  currentPlayers: number
  eloMin: number | null
  eloMax: number | null
  startsAt: string | null
  endsAt: string | null
  registrationClosesAt: string | null
  legalZoneCode: string
  createdAt: string
  updatedAt: string
}
```

#### Fonctions API Admin

```typescript
// Admin - Players
getAdminPlayers: (skip?: number, take?: number, search?: string) => 
  apiRequest<AdminPlayersResponse>(`/admin/players?...`)

updateAdminPlayerStatus: (id: string, isActive: boolean) =>
  apiRequest<AdminPlayer>(`/admin/players/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  })

// Admin - Tournaments
getAdminTournaments: () =>
  apiRequest<AdminTournament[]>('/admin/tournaments')

closeRegistration: (tournamentId: string) =>
  apiRequest<{ message: string }>(`/admin/tournaments/${tournamentId}/close-registration`, {
    method: 'POST',
  })
```

### 2. Système de couleurs et icônes

#### `lib/roleColors.ts`

Fichier utilitaire pour gérer les couleurs des rôles :

```typescript
export function getRoleColor(role: PlayerRole | undefined | null): string {
  const roleColors = {
    PLAYER: '#71717a',        // Acier
    ADMIN: '#1e40af',         // Bleu marine
    SUPER_ADMIN: '#B87333',   // Cuivre satiné
  }
  return roleColors[role] || roleColors.PLAYER
}
```

**Code couleur** :
- **PLAYER** : Acier (`#71717a`) - pas d'icône
- **ADMIN** : Bleu marine (`#1e40af`) - icône bouclier
- **SUPER_ADMIN** : Cuivre satiné (`#B87333`) - icône couronne

#### `components/RoleIcon.tsx`

Composant SVG pour afficher les icônes de rôle :
- **PLAYER** : Aucune icône
- **ADMIN** : Bouclier avec flèche
- **SUPER_ADMIN** : Couronne

### 3. Hook `useAuth` étendu

#### `hooks/useAuth.tsx`

Ajout de `isAdmin` et `isSuperAdmin` dans le contexte :

```typescript
interface AuthContextType {
  isAuthenticated: boolean
  player: Player | null
  loading: boolean
  isAdmin: boolean           // Nouveau
  isSuperAdmin: boolean       // Nouveau
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshPlayer: () => Promise<void>
}
```

**Calcul automatique** :
```typescript
const isAdmin = player?.role === 'ADMIN' || player?.role === 'SUPER_ADMIN'
const isSuperAdmin = player?.role === 'SUPER_ADMIN'
```

### 4. Header mis à jour

#### `components/Layout.tsx`

- **Lien "Admin"** : Visible uniquement si `isAdmin === true`
  - Style : bordure bleue, fond bleu semi-transparent
  - Visible mais discret (pas "flashy")
- **Pseudo coloré** : Couleur selon le rôle avec icône pour ADMIN/SUPER_ADMIN

### 5. Pages admin créées

#### `/admin/index.tsx` - Dashboard Admin

- Titre : "Tableau de bord administrateur"
- Message de bienvenue : "Bonjour {username} ({role})"
- Liens vers :
  - `/admin/players` - Gestion des joueurs
  - `/admin/tournaments` - Gestion des tournois
- Lien "Retour au lobby"

#### `/admin/players.tsx` - Gestion des joueurs

**Fonctionnalités** :
- Liste paginée des joueurs (tableau)
- Colonnes : username, email, pays, rôle, statut, actions
- Affichage des rôles avec couleurs et icônes
- Badges de statut : "Actif" (vert) / "Suspendu" (rouge)
- Boutons d'action :
  - "Suspendre" si `isActive === true`
  - "Réactiver" si `isActive === false`
- Mise à jour du state local après succès
- Gestion du loading et des erreurs

**API utilisée** :
- `GET /admin/players` - Liste des joueurs
- `PATCH /admin/players/:id/status` - Suspendre/réactiver

#### `/admin/tournaments.tsx` - Gestion des tournois

**Fonctionnalités** :
- Liste complète des tournois (tous statuts)
- Colonnes : nom, statut, joueurs, buy-in, début, clôture inscriptions, zone légale, actions
- Badges de statut colorés :
  - DRAFT : gris
  - SCHEDULED : bleu
  - READY : vert
  - RUNNING : jaune
  - FINISHED : violet
  - CANCELED : rouge
- Bouton "Clôturer les inscriptions" pour les tournois SCHEDULED/DRAFT
- Formatage des dates en français
- Formatage des montants en monnaie
- Gestion du loading et des erreurs

**API utilisée** :
- `GET /admin/tournaments` - Liste des tournois
- `POST /admin/tournaments/:id/close-registration` - Clôturer les inscriptions

#### Affichage Financier pour Super-Admins

**Exigence** : Pour le suivi financier, l'espace d'administration des super-admins doit afficher clairement, pour chaque tournoi avec prize pool figé :

1. **Commission plateforme** : Montant et pourcentage (5% du total des inscriptions)
2. **Frais de tournoi** : Montant et pourcentage (4.75% du total des inscriptions)
3. **Total des prélèvements** : Somme des deux éléments (9.75% du total des inscriptions)

**Calcul des frais de tournoi** :
- Depuis le prize pool : `fraisTournoiCents = totalEntriesCents - commissionCents - distributableCents`
- Ou depuis le total : `fraisTournoiCents = floor(totalEntriesCents × 0.0475)`

**Affichage recommandé** :
- Section dédiée "Suivi financier" dans la page de détail d'un tournoi (pour SUPER_ADMIN uniquement)
- Tableau ou cartes affichant :
  - Total des inscriptions : X CHF
  - Commission plateforme : Y CHF (5%)
  - Frais de tournoi : Z CHF (4.75%)
  - **Total prélèvements** : Y + Z CHF (9.75%)
  - Prize pool distributable : W CHF

**Justification** : Transparence financière, suivi comptable, conformité réglementaire.

**Voir** : [Clarification structure des frais](../../governance/audits/clarification-structure-frais-2026-01-01.md) pour le détail complet du calcul.

### 6. Protection des pages admin

Toutes les pages `/admin/*` sont protégées :

```typescript
const { player, isAdmin, loading } = useAuth()
const router = useRouter()

useEffect(() => {
  if (!loading) {
    if (!isAdmin) {
      router.replace('/login')
    }
  }
}, [loading, isAdmin, router])

if (loading || !isAdmin) {
  return <div>Chargement...</div>
}
```

**Comportement** :
- Si `isAdmin === false` → redirection vers `/login`
- Si `loading === true` → affichage du message de chargement
- Si `isAdmin === true` → affichage du contenu admin

---

## 🎨 Design et UX

### Code couleur des rôles

Le système utilise un code couleur sur les pseudos pour identifier les rôles :

- **PLAYER** : Acier (`#71717a`) - pas d'icône
- **ADMIN** : Bleu marine (`#1e40af`) - icône bouclier
- **SUPER_ADMIN** : Cuivre satiné (`#B87333`) - icône couronne

**Avantages** :
- Identification visuelle rapide
- Pas de texte explicite "ADMIN" ou "SUPER_ADMIN"
- Design élégant et discret

### Navigation

- **Header** : Lien "Admin" visible uniquement pour les admins
- **Pages admin** : Lien "Retour au lobby" sur toutes les pages
- **Pages de gestion** : Liens "Retour au lobby" et "Dashboard"

### Cohérence légale

Tous les textes respectent le positionnement légal :
- ✅ Vocabulaire : "tournois", "compétitions", "frais d'organisation"
- ❌ Pas de vocabulaire : "paris", "casino", "gambling", "mises"
- ✅ Footer : "Pas de paris. Pas de hasard. Prize pools fixes déterminés à l'avance."

---

## 🚀 Utilisation

### Accès à l'espace admin

1. **Se connecter** avec un compte ADMIN ou SUPER_ADMIN
2. **Vérifier** que le lien "Admin" apparaît dans le header
3. **Cliquer** sur "Admin" pour accéder au dashboard
4. **Naviguer** vers les pages de gestion

### Gestion des joueurs

1. Aller sur `/admin/players`
2. Voir la liste des joueurs dans le tableau
3. Identifier les admins (icône + couleur)
4. Suspendre un joueur : cliquer sur "Suspendre"
5. Réactiver un joueur : cliquer sur "Réactiver"

### Gestion des tournois

1. Aller sur `/admin/tournaments`
2. Voir tous les tournois (tous statuts)
3. Identifier le statut via les badges colorés
4. Clôturer les inscriptions : cliquer sur "Clôturer les inscriptions" (pour SCHEDULED/DRAFT)

---

## 🧪 Tests

### Test 1 : Affichage du rôle

1. Se connecter avec un compte SUPER_ADMIN
2. Vérifier dans le header :
   - Le pseudo est en cuivre satiné
   - Une icône couronne apparaît à côté
3. Aller sur `/profile` :
   - Le pseudo est coloré en cuivre satiné
   - L'icône couronne est visible
   - Message "Vous avez accès aux fonctionnalités d'administration"

### Test 2 : Lien Admin dans le header

1. Se connecter avec un compte ADMIN ou SUPER_ADMIN
2. Vérifier que le lien "Admin" apparaît dans le header
3. Cliquer sur "Admin" → doit rediriger vers `/admin`
4. Se connecter avec un compte PLAYER
5. Vérifier que le lien "Admin" n'apparaît pas

### Test 3 : Protection des pages admin

1. Se connecter avec un compte PLAYER
2. Essayer d'accéder directement à `/admin`
3. Vérifier la redirection vers `/login`
4. Essayer d'accéder à `/admin/players`
5. Vérifier la redirection vers `/login`

### Test 4 : Dashboard admin

1. Se connecter avec un compte ADMIN ou SUPER_ADMIN
2. Aller sur `/admin`
3. Vérifier :
   - Le titre "Tableau de bord administrateur"
   - Le message "Bonjour {username} ({role})"
   - Les deux cartes : "Gestion des joueurs" et "Gestion des tournois"
   - Le lien "Retour au lobby"

### Test 5 : Gestion des joueurs

1. Aller sur `/admin/players`
2. Vérifier :
   - Le tableau s'affiche avec les joueurs
   - Les admins ont une icône et une couleur différente
   - Les boutons "Suspendre"/"Réactiver" fonctionnent
   - Les statuts se mettent à jour après action
3. Tester la suspension d'un joueur
4. Tester la réactivation d'un joueur

### Test 6 : Gestion des tournois

1. Aller sur `/admin/tournaments`
2. Vérifier :
   - Le tableau s'affiche avec tous les tournois
   - Les badges de statut sont colorés correctement
   - Les dates sont formatées en français
   - Les montants sont formatés en monnaie
3. Pour un tournoi SCHEDULED, tester "Clôturer les inscriptions"
4. Vérifier que le statut se met à jour après clôture

---

## 📝 Fichiers modifiés/créés

### Fichiers créés

- `frontend/lib/roleColors.ts` - Utilitaires pour les couleurs de rôle
- `frontend/components/RoleIcon.tsx` - Composant icône de rôle
- `frontend/pages/admin/index.tsx` - Dashboard admin
- `frontend/pages/admin/players.tsx` - Gestion des joueurs
- `frontend/pages/admin/tournaments.tsx` - Gestion des tournois

### Fichiers modifiés

- `frontend/lib/api.ts` - Types et fonctions API admin
- `frontend/hooks/useAuth.tsx` - Ajout de `isAdmin` et `isSuperAdmin`
- `frontend/components/Layout.tsx` - Lien "Admin" et pseudo coloré
- `frontend/pages/profile.tsx` - Utilisation de `isAdmin` et affichage du rôle

---

## ✅ Checklist de vérification

- [ ] Le type `Player` inclut le champ `role`
- [ ] `useAuth` expose `isAdmin` et `isSuperAdmin`
- [ ] Le lien "Admin" apparaît dans le header pour les admins
- [ ] Le pseudo est coloré selon le rôle dans le header
- [ ] Les icônes de rôle s'affichent correctement (ADMIN/SUPER_ADMIN)
- [ ] La page `/admin` est accessible et protégée
- [ ] La page `/admin/players` affiche la liste des joueurs
- [ ] La suspension/réactivation des joueurs fonctionne
- [ ] La page `/admin/tournaments` affiche la liste des tournois
- [ ] La clôture des inscriptions fonctionne
- [ ] Les pages admin redirigent les non-admins vers `/login`
- [ ] Les textes respectent le positionnement légal
- [ ] Le lien "Retour au lobby" est présent sur toutes les pages admin

---

## 🔗 Liens utiles

- Backend API : `http://localhost:4000`
- Frontend : `http://localhost:3000`
- Dashboard admin : `http://localhost:3000/admin`
- Gestion joueurs : `http://localhost:3000/admin/players`
- Gestion tournois : `http://localhost:3000/admin/tournaments`

---

## 📚 Notes importantes

### Sécurité frontend

- La protection des pages admin est faite côté client (redirection)
- **Important** : Le backend doit toujours vérifier les rôles côté serveur
- La protection frontend est une **UX amélioration**, pas une sécurité réelle

### Suivi Financier pour Super-Admins

**Exigence** : Dans l'espace d'administration des super-admins, le frontend doit afficher clairement, pour le suivi financier de chaque tournoi avec prize pool figé :

1. **Commission plateforme** : Montant et pourcentage (5% du total des inscriptions)
2. **Frais de tournoi** : Montant et pourcentage (4.75% du total des inscriptions)
3. **Total des prélèvements** : Somme des deux éléments (9.75% du total des inscriptions)

**Calcul des frais de tournoi** :
- Depuis le prize pool : `fraisTournoiCents = totalEntriesCents - commissionCents - distributableCents`
- Ou depuis le total : `fraisTournoiCents = Math.floor(totalEntriesCents × 0.0475)`

**Affichage recommandé** :
- Section dédiée "Suivi financier" dans la page de détail d'un tournoi (pour SUPER_ADMIN uniquement)
- Tableau ou cartes affichant :
  - Total des inscriptions : X CHF
  - Commission plateforme : Y CHF (5%)
  - Frais de tournoi : Z CHF (4.75%)
  - **Total prélèvements** : Y + Z CHF (9.75%)
  - Prize pool distributable : W CHF

**Données nécessaires** :
- Pour les tournois avec prize pool figé (statut READY, RUNNING, FINISHED), récupérer le `PrizePool` via :
  - `GET /tournaments/:id` (endpoint public qui retourne `prizePools` calculés)
  - Ou extension de l'API admin pour inclure le `prizePool` dans `GET /admin/tournaments/:id`

**Justification** : Transparence financière, suivi comptable, conformité réglementaire.

**Voir** : [Clarification structure des frais](../../governance/audits/clarification-structure-frais-2026-01-01.md) pour le détail complet du calcul.

### Évolutions futures

- Formulaire de création de tournois
- Formulaire de modification de tournois
- Recherche et filtres avancés pour les joueurs
- Statistiques et graphiques dans le dashboard
- Export des données (CSV, etc.)
- **Affichage financier détaillé** : Section "Suivi financier" pour SUPER_ADMIN avec distinction commission/frais

---

## 🎯 Résultat final

À l'issue de cette implémentation :

✅ Les administrateurs peuvent identifier visuellement leur rôle (couleur + icône)  
✅ Les administrateurs ont accès à un espace admin dédié  
✅ Les administrateurs peuvent gérer les joueurs (suspendre/réactiver)  
✅ Les administrateurs peuvent gérer les tournois (voir tous, clôturer inscriptions)  
✅ L'interface est cohérente avec le positionnement légal  
✅ La navigation est intuitive et claire

