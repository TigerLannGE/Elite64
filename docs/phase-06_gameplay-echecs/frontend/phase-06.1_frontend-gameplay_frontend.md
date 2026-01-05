# Phase 6.1 - Frontend Gameplay MVP - Documentation Frontend

**Date de création** : 15 décembre 2025  
**Dernière mise à jour** : 03 janvier 2026 (Phase 6.1.B complétée)  
**Statut** : ✅ Complété

---

## 📋 Vue d'ensemble

La **Phase 6.1 Frontend Gameplay (MVP)** implémente l'interface utilisateur pour jouer des matches d'échecs en temps réel sur la plateforme ChessBet. Cette phase connecte le frontend au backend gameplay (Phase 6.0.C) et permet aux joueurs de :

- ✅ Rejoindre un match depuis la page tournoi
- ✅ Voir l'échiquier en temps réel avec les coups joués
- ✅ Jouer leurs coups (incluant la promotion des pions)
- ✅ Abandonner un match
- ✅ Voir l'état du match mis à jour automatiquement (polling)

**⚠️ Important** : Cette phase est un **MVP strict** - pas de chronomètre visuel, pas de WebSocket, pas d'historique des coups. Le focus est sur la jouabilité de base.

---

## 🎯 Objectifs

### Objectifs Frontend

- ✅ Intégrer une bibliothèque d'échiquier React (non-GPL, licence MIT)
- ✅ Créer la page `/matches/[id]` pour jouer un match
- ✅ Ajouter la navigation depuis `/tournaments/[id]` vers les matches jouables
- ✅ Implémenter le polling pour les mises à jour en temps réel (2 secondes)
- ✅ Gérer les coups avec validation backend
- ✅ Gérer la promotion des pions (popup de sélection)
- ✅ Implémenter la résignation avec double confirmation
- ✅ Respecter TypeScript strict (pas de `any`)

### Prérequis

- ✅ Backend Phase 6.0.C complété (endpoints `/join`, `/state`, `/move`, `/resign`)
- ✅ Authentification JWT fonctionnelle
- ✅ API client configuré (`frontend/lib/api.ts`)

---

## 📦 Dépendances Ajoutées

### react-chessboard

**Version installée** : `4.7.2`

```bash
npm install react-chessboard@4.7.2
```

#### Pourquoi cette version spécifique ?

**Problème initial** : La version `5.8.6` (latest) était incompatible avec React 18 :
- ❌ `react-chessboard@5.8.6` utilise `React.use()` (API React 19)
- ❌ Le projet utilise React 18
- ❌ Erreur runtime : `TypeError: (0 , react__WEBPACK_IMPORTED_MODULE_1__.use) is not a function`

**Solution adoptée** : Downgrade vers `4.7.2`
- ✅ Compatible avec React 18
- ✅ Licence MIT (non-GPL, conforme aux exigences légales)
- ✅ Toutes les fonctionnalités nécessaires présentes
- ✅ Stable et éprouvée

**Alternative envisagée** : Upgrade vers React 19
- ❌ Rejeté : Next.js 14 et l'écosystème ne supportent pas encore pleinement React 19
- ❌ Risque de breaking changes dans d'autres dépendances

#### Licence

**react-chessboard** est sous licence MIT, permettant :
- ✅ Usage commercial
- ✅ Modification
- ✅ Distribution
- ✅ Usage privé

**Pas de problème GPL** contrairement à d'autres bibliothèques d'échecs.

---

## 🏗️ Structure des Fichiers

### Fichiers créés

```
frontend/
└── pages/
    └── matches/
        └── [id].tsx        # Page de match (gameplay)
```

### Fichiers modifiés

```
frontend/
├── lib/
│   └── api.ts              # Ajout types et fonctions gameplay
└── pages/
    └── tournaments/
        └── [id].tsx        # Ajout navigation vers matches
```

---

## 🔧 Implémentation Détaillée

### 1. Extension de l'API Client (`frontend/lib/api.ts`)

#### Types ajoutés

```typescript
// Couleur du joueur dans un match
export type MatchColor = 'WHITE' | 'BLACK'

// DTO canonique retourné par tous les endpoints gameplay
export interface MatchStateViewDto {
  matchId: string
  tournamentId: string
  status: MatchStatus
  result?: MatchResult | null
  resultReason?: string | null
  whitePlayerId: string
  blackPlayerId: string
  fen: string
  moveNumber: number
  turn: MatchColor
  whiteTimeMsRemaining: number
  blackTimeMsRemaining: number
  lastMove?: { san: string; from: string; to: string; promotion?: string | null } | null
  serverTimeUtc: string
}
```

#### Fonctions ajoutées

```typescript
// Rejoindre un match (premier appel pour initialiser la connexion)
joinMatch: (matchId: string) =>
  apiRequest<MatchStateViewDto>(`/matches/${matchId}/join`, {
    method: 'POST',
  }),

// Récupérer l'état actuel du match (polling)
getMatchState: (matchId: string) =>
  apiRequest<MatchStateViewDto>(`/matches/${matchId}/state`),

// Jouer un coup
playMove: (matchId: string, move: { from: string; to: string; promotion?: 'q' | 'r' | 'b' | 'n' }) =>
  apiRequest<MatchStateViewDto>(`/matches/${matchId}/move`, {
    method: 'POST',
    body: JSON.stringify(move),
  }),

// Abandonner le match
resignMatch: (matchId: string) =>
  apiRequest<MatchStateViewDto>(`/matches/${matchId}/resign`, {
    method: 'POST',
  }),
```

---

### 2. Page de Match (`frontend/pages/matches/[id].tsx`)

#### Architecture de la page

La page suit ce flux :

1. **Auth Guard** : Redirection vers `/login` si non authentifié
2. **Initial Join & Load** : Appel à `joinMatch()` au montage
3. **Polling** : Appel à `getMatchState()` toutes les 2 secondes (si match actif)
4. **Chessboard** : Affichage dynamique avec `react-chessboard` (SSR désactivé)
5. **Move Handling** : Gestion des coups via `playMove()`
6. **Resignation** : Double confirmation avant abandon

#### États React

```typescript
const [matchState, setMatchState] = useState<MatchStateViewDto | null>(null)
const [loading, setLoading] = useState(true)
const [error, setError] = useState<string | null>(null)
```

#### Auth Guard

```typescript
useEffect(() => {
  if (!authLoading && !isAuthenticated) {
    router.push('/login')
  }
}, [authLoading, isAuthenticated, router])
```

#### Initial Join & Load

```typescript
useEffect(() => {
  if (!matchId || !isAuthenticated || !user) {
    return
  }

  const joinAndLoadMatch = async () => {
    try {
      setLoading(true)
      const state = await api.joinMatch(matchId)
      setMatchState(state)
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.message || 'Erreur lors du chargement du match')
    } finally {
      setLoading(false)
    }
  }

  joinAndLoadMatch()
}, [matchId, isAuthenticated, user])
```

**⚠️ Bug corrigé** : `useAuth()` retourne `player`, pas `user`
- **Erreur initiale** : `const { user, ... } = useAuth()`
- **Correction** : `const { player: user, ... } = useAuth()`

#### Polling Mechanism

```typescript
useEffect(() => {
  if (!matchId || !matchState) return
  
  // Arrêter le polling si le match est terminé
  if (matchState.status === 'FINISHED' || matchState.status === 'CANCELED') {
    return
  }

  const interval = setInterval(async () => {
    try {
      const state = await api.getMatchState(matchId)
      setMatchState(state)
    } catch (err) {
      console.error('Erreur polling:', err)
    }
  }, 2000) // 2 secondes

  return () => clearInterval(interval)
}, [matchId, matchState])
```

**Caractéristiques** :
- ✅ Polling toutes les 2 secondes
- ✅ Arrêt automatique si match terminé
- ✅ Gestion d'erreur silencieuse (pour ne pas perturber l'UX)
- ✅ Cleanup avec `clearInterval` au démontage

#### Chessboard avec Dynamic Import

```typescript
const Chessboard = dynamic(() => import('react-chessboard').then((mod) => mod.Chessboard), {
  ssr: false,
})
```

**Raison** : `react-chessboard` utilise des APIs browser-only (window, document), donc SSR doit être désactivé.

#### Move Handling avec Promotion

```typescript
const handlePieceDrop = async (
  sourceSquare: string,
  targetSquare: string,
  piece: string
): Promise<boolean> => {
  if (!matchState || !user) return false

  try {
    // Détection de la promotion (pion sur dernière rangée)
    const isPromotion =
      piece[1] === 'P' &&
      ((piece[0] === 'w' && targetSquare[1] === '8') ||
       (piece[0] === 'b' && targetSquare[1] === '1'))

    let promotion: 'q' | 'r' | 'b' | 'n' | undefined

    // Si promotion, demander la pièce au joueur
    if (isPromotion) {
      const choice = window.prompt(
        'Promotion du pion ! Choisissez : q (dame), r (tour), b (fou), n (cavalier)',
        'q'
      )
      
      if (!choice || !['q', 'r', 'b', 'n'].includes(choice)) {
        promotion = 'q' // Par défaut : dame
      } else {
        promotion = choice as 'q' | 'r' | 'b' | 'n'
      }
    }

    // Envoyer le coup au backend
    const newState = await api.playMove(matchId, {
      from: sourceSquare,
      to: targetSquare,
      promotion,
    })

    // Mettre à jour l'état local
    setMatchState(newState)
    return true
  } catch (err) {
    const apiError = err as ApiError
    alert(`Erreur: ${apiError.message || 'Coup invalide'}`)
    return false
  }
}
```

**Caractéristiques** :
- ✅ Détection automatique de la promotion
- ✅ Popup de sélection de pièce (MVP avec `window.prompt`)
- ✅ Validation backend
- ✅ Mise à jour immédiate de l'état local
- ✅ Gestion d'erreur avec alert

#### Resignation avec Double Confirmation

```typescript
const handleResign = async () => {
  if (!matchState || !user) return

  // Première confirmation
  const confirm1 = window.confirm(
    'Êtes-vous sûr de vouloir abandonner ce match ? Cette action est irréversible.'
  )
  if (!confirm1) return

  // Deuxième confirmation
  const confirm2 = window.confirm(
    'Confirmer l\'abandon ? Vous perdrez le match.'
  )
  if (!confirm2) return

  try {
    const newState = await api.resignMatch(matchId)
    setMatchState(newState)
    alert('Match abandonné.')
  } catch (err) {
    const apiError = err as ApiError
    alert(`Erreur: ${apiError.message || 'Impossible d\'abandonner'}`)
  }
}
```

**Sécurité** : Double confirmation pour éviter les abandons accidentels.

---

### 3. Navigation depuis Tournoi (`frontend/pages/tournaments/[id].tsx`)

#### Modification ajoutée

Ajout d'un lien "Jouer le match" ou "Rejoindre le match" pour chaque match où le joueur participe :

```typescript
// Importer Link
import Link from 'next/link'

// Dans le rendu des matches
const isPlayerMatch = 
  player && 
  (match.whiteEntry.player.id === player.id || 
   match.blackEntry.player.id === player.id)

{isPlayerMatch && (match.status === 'PENDING' || match.status === 'RUNNING') && (
  <Link
    href={`/matches/${match.id}`}
    className={`ml-4 px-4 py-2 rounded-lg font-semibold transition-colors ${
      match.status === 'RUNNING'
        ? 'bg-green-600 hover:bg-green-700 text-white'
        : 'bg-blue-600 hover:bg-blue-700 text-white'
    }`}
  >
    {match.status === 'RUNNING' ? 'Jouer le match' : 'Rejoindre le match'}
  </Link>
)}
```

**Logique** :
- ✅ Lien visible uniquement pour le joueur participant
- ✅ Couleur verte si `RUNNING`, bleue si `PENDING`
- ✅ Pas de lien si match `FINISHED` ou `CANCELED`

---

## 🎨 Interface Utilisateur

### Page `/matches/[id]`

#### États de la page

1. **Loading** : Spinner pendant le chargement initial
2. **Error** : Message d'erreur si problème de chargement
3. **Playing** : Échiquier interactif + informations de match
4. **Finished** : Affichage du résultat final

#### Informations affichées

- **Statut du match** : Badge coloré (RUNNING, FINISHED, etc.)
- **Joueurs** : Nom des joueurs Blancs et Noirs
- **Tour actuel** : "Tour des Blancs" / "Tour des Noirs"
- **Nombre de coups** : Compteur de coups
- **Résultat** : Si match terminé (WHITE_WIN, BLACK_WIN, DRAW)
- **Raison** : Motif de fin (CHECKMATE, STALEMATE, RESIGNATION, etc.)

#### Boutons d'action

- **Abandonner** : Visible uniquement si le match est en cours et que le joueur participe
- **Retour au tournoi** : Lien vers la page du tournoi parent

#### Styles

Utilisation de **Tailwind CSS** avec thème sombre :
- Fond : `bg-gray-900`
- Texte : `text-white`, `text-gray-300`
- Cartes : `bg-white/10 backdrop-blur-sm`
- Badges : Colorés selon le statut

---

## 🐛 Problèmes Rencontrés et Solutions

### Problème 1 : useAuth() retourne `player`, pas `user`

**Symptôme** :
```
const { user, ... } = useAuth()
// user est toujours null
```

**Cause** : Le hook `useAuth()` exporte `player`, pas `user`.

**Solution** :
```typescript
const { player: user, isAuthenticated, loading: authLoading } = useAuth()
```

**Impact** : Le match ne se chargeait jamais car l'effet initial retournait prématurément.

---

### Problème 2 : react-chessboard@5.8.6 incompatible avec React 18

**Symptôme** :
```
TypeError: (0 , react__WEBPACK_IMPORTED_MODULE_1__.use) is not a function
  at useChessboardContext (index.esm.js:4146:78)
```

**Cause** : 
- `react-chessboard@5.8.6` utilise l'API `React.use()` (React 19)
- Le projet utilise React 18

**Solutions envisagées** :
1. ❌ Upgrade vers React 19 : Rejeté (Next.js 14 non compatible)
2. ✅ **Downgrade vers `react-chessboard@4.7.2`** : Adopté

**Commandes** :
```bash
npm uninstall react-chessboard
npm install react-chessboard@4.7.2
```

**Résultat** : Échiquier fonctionne parfaitement avec React 18.

---

### Problème 3 : Tournoi reste en RUNNING après match terminé (Backend)

**Symptôme** : Après un échec et mat, le match est FINISHED mais le tournoi reste RUNNING.

**Cause** : 
- `playMove()` et `resignMatch()` utilisaient `setImmediate()` pour appeler `generateNextRoundIfNeeded()`
- `setImmediate()` est asynchrone et peut échouer silencieusement
- La finalisation automatique ne se déclenchait jamais

**Solution** (Backend) :
- Remplacement de `setImmediate()` par un appel synchrone `await`
- Ajout de try/catch pour logger les erreurs sans faire échouer le coup joué

**Fichier modifié** : `backend/src/modules/matches/matches.service.ts`

**Code corrigé** :
```typescript
// Avant (dans playMove)
if (updateData.status === MatchStatus.FINISHED) {
  setImmediate(() => {
    this.generateNextRoundIfNeeded(match.tournamentId).catch(...)
  })
}

// Après
const stateView = await this.prisma.$transaction(async (tx) => {
  // ... logique de transaction ...
  wasMatchFinished = updateData.status === MatchStatus.FINISHED
  tournamentId = match.tournamentId
  return this.buildMatchStateViewDto(updatedMatch)
})

if (wasMatchFinished) {
  try {
    await this.generateNextRoundIfNeeded(tournamentId)
  } catch (err) {
    console.error('[playMove] Erreur génération ronde:', err)
  }
}
```

**Impact** : Les tournois se finalisent maintenant automatiquement après le dernier match.

---

### Problème 4 : Promotion impossible (pion capturant en dernière rangée)

**Symptôme** :
```
POST http://localhost:4000/matches/{matchId}/move 400 (Bad Request)
Invalid move: {"from":"g2","to":"h1"}
```

Un pion atteignant la dernière rangée via une capture ne déclenche pas la popup de promotion.

**Cause** : 
- `react-chessboard@4.7.2` ne passe **pas toujours** le 3ème paramètre `piece` dans le callback `onPieceDrop`
- Le code dépendait de ce paramètre pour détecter qu'un pion atteignait la dernière rangée
- Sans le paramètre `piece`, la vérification échouait silencieusement

**Code problématique** :
```typescript
const handlePieceDrop = async (sourceSquare: string, targetSquare: string, piece: string) => {
  // piece peut être undefined !
  const isPawn = piece.toLowerCase().includes('p')  // ❌ Erreur si piece undefined
  const isLastRank = (piece[0] === 'w' && targetSquare[1] === '8') // ❌ Cannot read property '0' of undefined
  // ...
}
```

**Solution** :
Au lieu de se fier au paramètre `piece`, utiliser **`chess.js` pour inspecter le FEN** et déterminer la pièce sur `sourceSquare` :

```typescript
const handlePieceDrop = async (sourceSquare: string, targetSquare: string, piece?: string) => {
  // Déterminer la pièce depuis la position actuelle (FEN)
  const { Chess } = require('chess.js')
  const chess = new Chess(matchState.fen)
  const pieceOnSquare = chess.get(sourceSquare)
  
  if (!pieceOnSquare) {
    setMoveError('Erreur : aucune pièce sur cette case')
    return false
  }

  // Vérifier si c'est un pion qui arrive sur la dernière rangée
  const isPawn = pieceOnSquare.type === 'p'
  const isWhitePawn = pieceOnSquare.color === 'w' && targetSquare[1] === '8'
  const isBlackPawn = pieceOnSquare.color === 'b' && targetSquare[1] === '1'
  const isLastRank = isWhitePawn || isBlackPawn

  if (isPawn && isLastRank) {
    // Demander la promotion via prompt
    const choice = window.prompt('Promotion du pion. Choisissez une pièce:\nq = Dame\nr = Tour\nb = Fou\nn = Cavalier', 'q')
    if (choice && ['q', 'r', 'b', 'n'].includes(choice.toLowerCase())) {
      promotion = choice.toLowerCase() as 'q' | 'r' | 'b' | 'n'
    } else {
      setMoveError('Promotion invalide ou annulée')
      return false
    }
  }
  // ...
}
```

**Fichier modifié** : `frontend/pages/matches/[id].tsx`

**Avantages de cette approche** :
- ✅ **Robuste** : Ne dépend pas d'un paramètre optionnel de `react-chessboard`
- ✅ **Source de vérité** : Utilise le FEN (état canonique du backend)
- ✅ **Compatible** : Fonctionne avec toutes les versions de `react-chessboard`
- ✅ **Maintenable** : Logique claire et documentée

**Impact** : La promotion fonctionne maintenant dans tous les cas (avancement simple ou capture).

**Tests validés** :
- ✅ Promotion en Dame après capture
- ✅ Promotion en Tour après capture
- ✅ Promotion en Fou après capture
- ✅ Promotion en Cavalier après capture
- ✅ Promotion sans capture (avancement simple)

**Validation en production (15 décembre 2025)** :
- ✅ Bug reproduit : Match `cmj7p3ams0279js33bov1gkej` - Pion noir en g2 capturant tour en h1
- ✅ Erreur initiale : `Invalid move: {"from":"g2","to":"h1"}` (400 Bad Request)
- ✅ Cause confirmée : `piece` paramètre undefined dans `onPieceDrop`
- ✅ Solution appliquée : Utilisation de `chess.get(sourceSquare)` pour détecter la pièce depuis le FEN
- ✅ Tests manuels réussis : Promotion par capture fonctionne correctement
- ✅ Logs de debug ajoutés pour diagnostic futur (console.log avec emojis 🎯🔍✅❌)

**Recommandations** :
- 🔍 Les logs de debug peuvent être retirés en production si les performances deviennent un problème
- 📊 Considérer l'ajout d'analytics pour tracker les promotions réussies/échouées
- 🧪 Ajouter un test E2E spécifique pour la promotion par capture (déjà couvert dans Phase 6.2)

---

## 🧪 Tests Manuels

### Scénario de test complet

#### 1. Créer et préparer un tournoi

```bash
# 1. Créer un tournoi (admin)
POST http://localhost:4000/admin/tournaments
{
  "name": "Test Gameplay",
  "timeControl": "10+0",
  "buyInCents": 1000,
  "minPlayers": 2,
  "maxPlayers": 2,
  "startsAt": "2025-12-16T18:00:00Z",
  "registrationClosesAt": "2025-12-16T17:55:00Z",
  "status": "SCHEDULED"
}

# 2. Inscrire 2 joueurs
POST http://localhost:4000/tournaments/{tournamentId}/join
Authorization: Bearer {player1-token}

POST http://localhost:4000/tournaments/{tournamentId}/join
Authorization: Bearer {player2-token}

# 3. Clôturer les inscriptions
POST http://localhost:4000/admin/tournaments/{tournamentId}/close-registration

# 4. Démarrer le tournoi
POST http://localhost:4000/admin/tournaments/{tournamentId}/start
```

#### 2. Naviguer vers le match

1. **Joueur 1** : Ouvrir `http://localhost:3000/tournaments/{tournamentId}`
2. Voir le Board 1 avec le bouton "Jouer le match" (vert)
3. Cliquer sur "Jouer le match"
4. Redirection vers `http://localhost:3000/matches/{matchId}`

#### 3. Jouer le match

1. **Vérifier** : L'échiquier s'affiche
2. **Vérifier** : Les informations du match sont visibles
3. **Jouer** : Faire des coups alternés (Joueur 1 en blanc, Joueur 2 en noir)
4. **Tester promotion** :
   - Amener un pion sur la dernière rangée
   - Popup de sélection : choisir `q` (dame)
5. **Tester polling** :
   - Ouvrir deux onglets (Joueur 1 et Joueur 2)
   - Jouer un coup dans un onglet
   - Vérifier que l'autre onglet se met à jour (~2 secondes)

#### 4. Terminer le match

**Option A : Échec et mat**
- Jouer jusqu'à l'échec et mat
- Vérifier : Badge "Terminé"
- Vérifier : Résultat affiché (WHITE_WIN / BLACK_WIN)
- Vérifier : Motif "CHECKMATE"

**Option B : Résignation**
- Cliquer sur "Abandonner"
- Confirmer 2 fois
- Vérifier : Match terminé (RESIGNATION)

#### 5. Vérifier la finalisation du tournoi

1. Retourner sur `http://localhost:3000/tournaments/{tournamentId}`
2. **Vérifier** : Statut "Terminé"
3. **Vérifier** : Classement affiché
4. **Vérifier** : Gains distribués (consulter les wallets)

#### 6. Vérifier l'historique

1. Aller sur `http://localhost:3000/tournaments`
2. Cliquer sur l'onglet "Terminés"
3. **Vérifier** : Le tournoi apparaît dans l'historique

---

## 🔗 Intégration Backend

### Endpoints utilisés

| Endpoint | Méthode | Description | Auth |
|----------|---------|-------------|------|
| `/matches/:id/join` | POST | Rejoindre un match (initialiser la connexion) | JWT |
| `/matches/:id/state` | GET | Récupérer l'état actuel du match (polling) | JWT |
| `/matches/:id/move` | POST | Jouer un coup | JWT |
| `/matches/:id/resign` | POST | Abandonner le match | JWT |

### DTO Canonique : MatchStateViewDto

Tous les endpoints retournent le même DTO pour cohérence :

```typescript
{
  matchId: string
  tournamentId: string
  status: 'PENDING' | 'RUNNING' | 'FINISHED' | 'CANCELED'
  result?: 'WHITE_WIN' | 'BLACK_WIN' | 'DRAW' | null
  resultReason?: string | null
  whitePlayerId: string
  blackPlayerId: string
  fen: string                    // Position actuelle (FEN)
  moveNumber: number
  turn: 'WHITE' | 'BLACK'
  whiteTimeMsRemaining: number
  blackTimeMsRemaining: number
  lastMove?: { san: string; from: string; to: string; promotion?: string | null } | null
  serverTimeUtc: string
}
```

### Gestion des erreurs

Le backend retourne des erreurs structurées :

```typescript
{
  statusCode: number
  message: string
  error: string
  code?: string  // Ex: 'PLAYER_NOT_IN_MATCH', 'NOT_YOUR_TURN'
}
```

Le frontend affiche ces erreurs via `alert()` (MVP).

---

## ⚠️ Limitations (MVP)

Cette phase est un **MVP strict**. Les fonctionnalités suivantes ne sont **PAS** implémentées :

### Non implémenté

- ❌ **Chronomètre visuel** : Le temps est géré backend mais pas affiché
- ❌ **WebSocket** : Utilisation de polling simple (2s)
- ❌ **Historique des coups** : Pas d'affichage de la notation PGN
- ❌ **Sons** : Pas de son pour les coups
- ❌ **Animations** : Pas d'animation des pièces
- ❌ **Chat** : Pas de chat entre joueurs
- ❌ **Offre de nulle** : Pas de système de draw offer
- ❌ **Analyses post-match** : Pas d'analyse Stockfish
- ❌ **UI mobile optimisée** : Fonctionne mais pas optimisé

### Améliorations UI (MVP)

- ⚠️ Promotion : `window.prompt()` (basique)
- ⚠️ Erreurs : `alert()` (basique)
- ⚠️ Confirmations : `window.confirm()` (basique)

Ces éléments seront améliorés dans les phases 6.2+ avec des modals React.

---

## 🚀 Prochaines Étapes (Phases Futures)

### Phase 6.1.B - Gameplay UX Completion ✅

- ✅ Affichage du chronomètre avec compte à rebours (implémenté en 6.1.B)
- ✅ États UI DRAW et TIEBREAK_PENDING (implémenté en 6.1.B)
- ✅ Mapping codes d'erreur backend → messages UX (implémenté en 6.1.B)
- ✅ Polling robuste avec retry/backoff (implémenté en 6.1.B)
- ✅ Indicateur de connexion (implémenté en 6.1.B)

**Voir** : [Phase 6.1.B - Gameplay UX Completion](./phase-06.1.B_gameplay-ux-completion_frontend.md)

### Phase 6.2.A - UX Clarity Gameplay ✅

- ✅ Historique des coups en notation algébrique (implémenté en 6.2.A)
- ✅ Highlight du dernier coup joué (implémenté en 6.2.A)

**Voir** : [Phase 6.2.A - UX Clarity Gameplay](./phase-06.2.A_ux-clarity-gameplay_frontend.md)

### Phase 6.2.B - Tests UI E2E (futures)

- [ ] Tests E2E de l'interface utilisateur avec outil de test navigateur (Playwright/Cypress)
- [ ] Tests de l'échiquier interactif (drag/drop, validation visuelle)
- [ ] Tests des états UI (DRAW, TIEBREAK_PENDING, timer, erreurs)
- [ ] Tests de navigation et flux utilisateur complets

**Voir** : [Phase 6.2.B - Tests UI E2E](./phase-06.2.B_ui-e2e-tests_frontend.md)

### Phase 6.2.C - UX Polish Gameplay (futures)

- [ ] Modals React pour promotion/confirmations (remplacer prompt/alert)
- [ ] Sons pour les coups (déplacement, capture, échec)
- [ ] Animations fluides des pièces
- [ ] Highlight des cases menacées (échec)

### Phase 6.3 - WebSocket et Temps Réel

- [ ] Remplacement du polling par WebSocket
- [ ] Notifications push pour "C'est votre tour"
- [ ] Indicateur de connexion de l'adversaire
- [ ] Synchronisation instantanée des coups
- [ ] Gestion de la reconnexion automatique

### Phase 6.4 - Fonctionnalités Avancées

- [ ] Offre de nulle (draw offer)
- [ ] Chat entre joueurs (avec modération)
- [ ] Analyse post-match (Stockfish)
- [ ] Export PGN
- [ ] Partage de partie
- [ ] UI mobile optimisée

---

## 📊 Récapitulatif

| Composant | Backend | Frontend |
|-----------|---------|----------|
| Endpoints gameplay | ✅ Phase 6.0.C | ✅ Phase 6.1 |
| Types TypeScript | ✅ Phase 6.0.C | ✅ Phase 6.1 |
| Page de match | N/A | ✅ Phase 6.1 |
| Navigation tournoi → match | N/A | ✅ Phase 6.1 |
| Échiquier React | N/A | ✅ Phase 6.1 |
| Polling état | N/A | ✅ Phase 6.1 |
| Jouer des coups | ✅ Phase 6.0.C | ✅ Phase 6.1 |
| Promotion des pions | ✅ Phase 6.0.C | ✅ Phase 6.1 |
| Résignation | ✅ Phase 6.0.C | ✅ Phase 6.1 |
| Finalisation automatique | ✅ Phase 6.1 (fix) | N/A |
| Chronomètre visuel | ✅ Backend | ✅ Phase 6.1.B |
| Historique des coups | N/A | ✅ Phase 6.2.A |
| Highlight dernier coup | N/A | ✅ Phase 6.2.A |
| WebSocket | ❌ Phase 6.3 | ❌ Phase 6.3 |

---

## 📚 Références

### Documentation Backend

- [Phase 6.0.C - Orchestration Gameplay](../cross/phase-06.0.C_gameplay-orchestration_cross.md)
- [Phase 6.0.B - Moteur d'échecs](../backend/phase-06.0.B_chess-engine_backend.md)
- [Phase 6.0.A - Extension Schéma](../cross/phase-06.0.A_schema-extension_cross.md)

### Documentation Connexe

- [Phase 5 - Frontend Overview](../../phase-05_matches-et-brackets/frontend/phase-05_frontend-overview_frontend.md)
- [Phase 3 - Tournaments Module](../../phase-03_tournois-structure/backend/phase-03_tournaments-prize-pool_backend.md)

### Tests et Validation

- [Phase 6.1.B - Gameplay UX Completion](./phase-06.1.B_gameplay-ux-completion_frontend.md)  
  Améliorations UX : timer, états DRAW/TIEBREAK_PENDING, mapping erreurs, polling robuste
- [Phase 6.2.A - UX Clarity Gameplay](./phase-06.2.A_ux-clarity-gameplay_frontend.md)  
  Améliorations UX clarté : historique des coups (SAN), highlight dernier coup
- [Phase 6.2 - Tests E2E Gameplay Complets](../cross/phase-06.2_e2e-gameplay-tests_cross.md)  
  Suite complète de tests End-to-End validant tous les types de mouvements aux échecs via l'API. **Résultat : 11/11 PASS (100%)**

### Documentation Externe

- [react-chessboard Documentation](https://github.com/Clariity/react-chessboard)
- [Chess.js Documentation](https://github.com/jhlywa/chess.js)
- [Next.js Dynamic Imports](https://nextjs.org/docs/pages/building-your-application/optimizing/lazy-loading)

---

## ✅ Checklist de Complétion

- [x] Types et fonctions API ajoutés (`api.ts`)
- [x] Dépendance `react-chessboard@4.7.2` installée et documentée
- [x] Page `/matches/[id]` créée avec gameplay complet
- [x] Navigation depuis `/tournaments/[id]` implémentée
- [x] Auth guard fonctionnel
- [x] Polling toutes les 2 secondes
- [x] Gestion des coups avec promotion
- [x] Résignation avec double confirmation
- [x] Gestion des états (loading, error, playing, finished)
- [x] TypeScript strict (pas de `any`)
- [x] Tests manuels réussis (création tournoi → match → finalisation)
- [x] Bug `useAuth` corrigé
- [x] Bug `react-chessboard` version corrigé
- [x] Bug finalisation tournoi corrigé (backend)
- [x] Bug promotion par capture corrigé et validé en production
- [x] Documentation créée et à jour

---

**Statut final** : ✅ **100% complété**

**Date de finalisation** : 15 décembre 2025

