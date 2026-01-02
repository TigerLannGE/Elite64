⚠️ **DOCUMENT OBSOLÈTE** - Ce document est archivé pour référence historique uniquement.  
**Raison** : Ce rapport précède l'implémentation des phases 6.0.B et 6.0.C. Les informations sur l'état des phases 6.0+ sont obsolètes.

---

# 📋 Rapport d'Audit Technique du Codebase - 14 Décembre 2025

**Date de l'audit** : 14 Décembre 2025  
**Mode** : Lecture seule (aucune modification effectuée)  
**Objectif** : Évaluer l'état actuel du codebase par rapport aux phases 5, 6.0, 6.1, 6.2 et 6.3

---

## 📊 Résumé Exécutif

| Phase | Statut | Complétion |
|-------|--------|------------|
| **Phase 5** : Matches et résultats de tournoi | ✅ **OK** | 100% |
| **Phase 6.0** : Backend - Jeu en direct | ❌ **Manquant** | 0% |
| **Phase 6.1** : Frontend - Page match | ❌ **Manquant** | 0% |
| **Phase 6.2** : ChessBoard | ❌ **Manquant** | 0% |
| **Phase 6.3** : WebSockets | ❌ **Manquant** | 0% |

**État global** : La Phase 5 est complète et fonctionnelle. Les Phases 6.0 à 6.3 sont entièrement à implémenter.

**Risque** : Bloquant pour le gameplay en direct. Les matches existent mais ne peuvent pas être joués.

**Estimation** : ~15-20 fichiers à créer/modifier, ~2000-3000 lignes de code à ajouter.

---

## 1. INVENTAIRE BACKEND (NestJS)

### 1.1 Prisma Schema

**Fichier inspecté** : `backend/prisma/schema.prisma`

#### Modèle Match

**✅ Présent** : Modèle de base Phase 5

```prisma
model Match {
  id             String       @id @default(cuid())
  tournamentId   String
  roundNumber    Int
  boardNumber    Int
  whiteEntryId   String
  blackEntryId   String
  status         MatchStatus  @default(PENDING)
  result         MatchResult?
  resultReason   String?
  startedAt      DateTime?
  finishedAt     DateTime?
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  // Relations
  tournament     Tournament   @relation(...)
  whiteEntry     TournamentEntry @relation(...)
  blackEntry     TournamentEntry @relation(...)
}
```

**❌ Absent** : Champs Phase 6.0 requis
- `initialFen` (String?)
- `currentFen` (String?)
- `pgn` (String?)
- `movesJson` (Json?)
- `whiteTimeMsRemaining` (Int?)
- `blackTimeMsRemaining` (Int?)
- `lastMoveAt` (DateTime?)
- `readyAt` (DateTime?)
- `whiteJoinedAt` (DateTime?)
- `blackJoinedAt` (DateTime?)
- `noShowResolvedAt` (DateTime?)
- `isRated` (Boolean)
- `ratingDelta` (Int?)
- Relation `moves` vers `MatchMove[]`

#### Modèle MatchMove

**❌ Absent** : Modèle non présent dans le schema

Champs attendus :
- `id` (String @id)
- `matchId` (String)
- `moveNumber` (Int)
- `playerId` (String)
- `color` (MatchColor)
- `san` (String)
- `from` (String)
- `to` (String)
- `promotion` (String?)
- `fenBefore` (String)
- `fenAfter` (String)
- `whiteTimeMsRemaining` (Int?)
- `blackTimeMsRemaining` (Int?)
- `createdAt` (DateTime)

#### Enum MatchColor

**❌ Absent** : Enum non défini

Attendu :
```prisma
enum MatchColor {
  WHITE
  BLACK
}
```

### 1.2 Migrations

**Fichier inspecté** : `backend/prisma/migrations/20251209225539_add_matches_and_results/migration.sql`

**✅ Présent** : Migration Phase 5
- Création enum `MatchStatus`
- Modification enum `MatchResult`
- Refonte modèle `Match` (suppression `whitePlayerId`/`blackPlayerId`, ajout `whiteEntryId`/`blackEntryId`, `roundNumber`, `boardNumber`, `status`, `resultReason`)

**❌ Absent** : Migration Phase 6.0
- Pas de migration pour `MatchMove`
- Pas de migration pour les champs Phase 6.0 du modèle `Match`

### 1.3 Modules / Routes Matches

**Fichier inspecté** : `backend/src/modules/matches/matches.controller.ts`

#### MatchesController

**✅ Présent** : Routes Phase 5
- `GET /matches/tournament/:tournamentId` (ligne 22-30)
- `GET /matches/me?tournamentId=xxx` (ligne 38-53)
- `GET /matches/:id` (ligne 60-62)

**❌ Absent** : Routes Phase 6.0
- `POST /matches/:id/join` (joinMatch)
- `GET /matches/:id/state` (getMatchState)
- `POST /matches/:id/move` (playMove)

**Guards utilisés** :
- ✅ `JwtAuthGuard` (ligne 11, 38)
- ✅ `ActivePlayerGuard` (ligne 12, 38)
- `RolesGuard` : non utilisé dans `MatchesController` (présent dans `MatchesAdminController`)

**Fichier inspecté** : `backend/src/modules/matches/matches.service.ts`

#### MatchesService

**✅ Présent** : Méthodes Phase 5
- `generateInitialMatchesForTournament` (ligne 30-163)
- `listMatchesForTournament` (ligne 168-277)
- `getMatchById` (ligne 283-327)
- `reportResult` (ligne 332-436)
- `generateNextRoundIfNeeded` (ligne 441-533)

**❌ Absent** : Méthodes Phase 6.0
- `joinMatch(matchId, playerId)`
- `getMatchState(matchId)`
- `playMove(matchId, playerId, move)`

**Logique no-show** :
- ❌ Constantes `JOIN_WINDOW_SECONDS` / `NO_SHOW_GRACE_SECONDS` : absentes
- ❌ Champs `readyAt`, `whiteJoinedAt`, `blackJoinedAt`, `noShowResolvedAt` : absents du modèle
- ❌ Fonction `maybeResolveNoShow` : absente

**Logique pendule** :
- ⚠️ Parsing `timeControl` : présent dans `TournamentsService` (ligne 314 de `matches.service.ts` inclut `timeControl`), mais pas de logique de décompte
- ❌ `lastMoveAt` : absent
- ❌ Décrément/increment : absent
- ❌ Détection timeout : absente

**Création MatchMove en DB** : ❌ absente (modèle inexistant)

**Fin de partie** :
- ✅ `set result/status/finishedAt` : présent dans `reportResult` (ligne 388-428)
- ✅ Déclenchement round suivant : présent via `generateNextRoundIfNeeded` (ligne 433)
- ✅ `finalizeTournamentAndPayouts` : appelé dans `generateNextRoundIfNeeded` (ligne 529-531)

### 1.4 Moteur d'échecs

**Fichier recherché** : `ChessEngineService` ou équivalent

**❌ Absent** : Service non trouvé

**Dépendance chess.js** :

**Fichier inspecté** : `backend/package.json`

**❌ Absent** : `chess.js` non présent dans les dépendances (lignes 25-42)

**Méthode `validateAndApplyMove`** : ❌ absente

### 1.5 Configuration

**Fichier recherché** : `match.config.ts` ou équivalent

**❌ Absent** : Fichier de config non trouvé

Constantes attendues :
- `JOIN_WINDOW_SECONDS`
- `NO_SHOW_GRACE_SECONDS`
- Defaults time control

### 1.6 WebSockets (Phase 6.3)

**Recherche** : `@WebSocketGateway` dans `backend/src`

**❌ Absent** : Aucun gateway WebSocket trouvé

**MatchesGateway** : ❌ absent

Fonctionnalités attendues :
- Auth handshake (`token` via `socket.handshake.auth.token`)
- Event `join_match`
- Rooms `match:<matchId>`
- Events : `match_state_updated`, `move_played`, `game_over`, `match_joined`
- Intégration service → gateway : absente

**Dépendance socket.io** :

**Fichier inspecté** : `backend/package.json`

**❌ Absent** : `@nestjs/websockets` et `socket.io` non présents

---

## 2. INVENTAIRE FRONTEND (Next.js Pages Router)

### 2.1 API Client

**Fichier inspecté** : `frontend/lib/api.ts`

#### Types

**✅ Présent** : Types Phase 5
- `MatchStatus` (ligne 193)
- `MatchResult` (ligne 195)
- `TournamentMatch` (ligne 197-227)

**❌ Absent** : Types Phase 6.0
- `MatchStateView` (ou équivalent avec `currentFen`, `moves`, `whiteTimeMsRemaining`, `blackTimeMsRemaining`, etc.)

#### Fonctions API

**✅ Présent** : Fonctions Phase 5
- `getTournamentMatches` (ligne 357-358)
- `adminReportMatchResult` (ligne 399-407)

**❌ Absent** : Fonctions Phase 6.0
- `getMatchState(matchId)`
- `joinMatch(matchId)`
- `playMove(matchId, move)`

### 2.2 Page Match

**Fichier recherché** : `frontend/pages/matches/[id].tsx`

**❌ Absent** : Page non trouvée

**Fichiers présents** : `frontend/pages/tournaments/[id].tsx` (page détail tournoi, pas page match)

Fonctionnalités attendues :
- Join au montage
- Polling HTTP (interval et conditions)
- Affichage pendules / statuts

### 2.3 ChessBoard

**Fichier recherché** : `frontend/components/ChessBoard.tsx`

**❌ Absent** : Composant non trouvé

**Composants présents** : `Layout.tsx`, `RoleIcon.tsx` uniquement

Fonctionnalités attendues :
- Parsing FEN (même minimal)
- Orientation
- Sélection case source/destination
- LastMove highlight

### 2.4 WebSockets Frontend (Phase 6.3)

**Dépendance socket.io-client** :

**Fichier inspecté** : `frontend/package.json`

**❌ Absent** : `socket.io-client` non présent (lignes 11-14)

**Fichier recherché** : `frontend/lib/socket.ts`

**❌ Absent** : Fichier non trouvé

Fonction attendue : `createSocket(token)`

**Hook recherché** : `frontend/hooks/useMatchSocket.ts`

**❌ Absent** : Hook non trouvé

**Intégration dans `/matches/[id].tsx`** : N/A (page absente)

---

## 3. RAPPORT FINAL PAR PHASE

### Phase 5 : Matches et résultats de tournoi

**Statut** : ✅ **OK**

**Éléments présents** :
- ✅ Modèle `Match` dans Prisma avec champs de base
- ✅ Enums `MatchStatus`, `MatchResult`
- ✅ Migration `20251209225539_add_matches_and_results`
- ✅ `MatchesService` avec génération brackets, enregistrement résultats, génération rondes suivantes
- ✅ `MatchesController` avec routes publiques/joueurs
- ✅ `MatchesAdminController` avec routes admin
- ✅ Finalisation automatique tournoi avec distribution gains
- ✅ Intégration dans `app.module.ts`

**Références** :
- `backend/prisma/schema.prisma` (lignes 48-60, 195-223)
- `backend/src/modules/matches/matches.service.ts` (lignes 20-534)
- `backend/src/modules/matches/matches.controller.ts` (lignes 1-64)
- `backend/src/modules/matches/matches.admin.controller.ts`

---

### Phase 6.0 : Backend - Jeu en direct

**Statut** : ❌ **Manquant**

**Éléments manquants** :

1. **Modèle Prisma**
   - Champs Phase 6.0 dans `Match` : `initialFen`, `currentFen`, `pgn`, `movesJson`, `whiteTimeMsRemaining`, `blackTimeMsRemaining`, `lastMoveAt`, `readyAt`, `whiteJoinedAt`, `blackJoinedAt`, `noShowResolvedAt`, `isRated`, `ratingDelta`
   - Modèle `MatchMove` complet
   - Enum `MatchColor`
   - Migration pour ces ajouts

2. **Routes API**
   - `POST /matches/:id/join` dans `MatchesController`
   - `GET /matches/:id/state` dans `MatchesController`
   - `POST /matches/:id/move` dans `MatchesController`

3. **Service MatchesService**
   - `joinMatch(matchId: string, playerId: string)`
   - `getMatchState(matchId: string)`
   - `playMove(matchId: string, playerId: string, move: PlayMoveDto)`
   - Logique no-show : `maybeResolveNoShow()`, constantes `JOIN_WINDOW_SECONDS`, `NO_SHOW_GRACE_SECONDS`
   - Logique pendule : parsing `timeControl`, décrément temps, détection timeout

4. **Moteur d'échecs**
   - `ChessEngineService` avec `validateAndApplyMove(move: Move)`
   - Dépendance `chess.js` dans `package.json`

5. **Configuration**
   - Fichier `match.config.ts` (ou équivalent) avec constantes

**Fichiers à créer/modifier** :
- `backend/prisma/schema.prisma` (ajout champs + modèle `MatchMove`)
- `backend/prisma/migrations/[timestamp]_add_match_gameplay_fields/migration.sql`
- `backend/src/modules/matches/matches.controller.ts` (ajout 3 routes)
- `backend/src/modules/matches/matches.service.ts` (ajout méthodes)
- `backend/src/modules/matches/dto/play-move.dto.ts` (nouveau)
- `backend/src/modules/matches/dto/match-state-view.dto.ts` (nouveau)
- `backend/src/modules/matches/chess-engine.service.ts` (nouveau)
- `backend/src/modules/matches/match.config.ts` (nouveau)
- `backend/src/modules/matches/matches.module.ts` (ajout `ChessEngineService`)
- `backend/package.json` (ajout `chess.js`)

**Impact** : ⚠️ **BLOQUANT** pour Phase 6.1/6.2/6.3

---

### Phase 6.1 : Frontend - Page match

**Statut** : ❌ **Manquant**

**Éléments manquants** :

1. **Types API**
   - `MatchStateView` dans `frontend/lib/api.ts`

2. **Fonctions API**
   - `getMatchState(matchId: string)`
   - `joinMatch(matchId: string)`
   - `playMove(matchId: string, move: PlayMovePayload)`

3. **Page match**
   - `frontend/pages/matches/[id].tsx`
   - Join au montage
   - Polling HTTP (interval et conditions)
   - Affichage pendules / statuts

**Fichiers à créer/modifier** :
- `frontend/lib/api.ts` (ajout types + fonctions)
- `frontend/pages/matches/[id].tsx` (nouveau)

**Impact** : ⚠️ **BLOQUANT** pour Phase 6.2/6.3

---

### Phase 6.2 : ChessBoard

**Statut** : ❌ **Manquant**

**Éléments manquants** :

1. **Composant ChessBoard**
   - `frontend/components/ChessBoard.tsx`
   - Parsing FEN
   - Orientation
   - Sélection case source/destination
   - LastMove highlight

**Fichiers à créer/modifier** :
- `frontend/components/ChessBoard.tsx` (nouveau)

**Dépendances possibles** :
- `react-chessboard` ou bibliothèque équivalente (à vérifier)

**Impact** : ⚠️ **BLOQUANT** pour Phase 6.1 (affichage du plateau)

---

### Phase 6.3 : WebSockets

**Statut** : ❌ **Manquant**

**Éléments manquants** :

1. **Backend**
   - `MatchesGateway` avec `@WebSocketGateway`
   - Auth handshake (`token` via `socket.handshake.auth.token`)
   - Event `join_match`
   - Rooms `match:<matchId>`
   - Events : `match_state_updated`, `move_played`, `game_over`, `match_joined`
   - Intégration `MatchesService` → `MatchesGateway` (broadcast après join/move/finish)

2. **Frontend**
   - `socket.io-client` dans `package.json`
   - `frontend/lib/socket.ts` avec `createSocket(token)`
   - `frontend/hooks/useMatchSocket.ts`
   - Intégration dans `/matches/[id].tsx` (join_match, écoute events, réduction polling)

**Fichiers à créer/modifier** :
- `backend/src/modules/matches/matches.gateway.ts` (nouveau)
- `backend/src/modules/matches/matches.module.ts` (ajout `MatchesGateway`)
- `backend/package.json` (ajout `@nestjs/websockets`, `socket.io`)
- `frontend/package.json` (ajout `socket.io-client`)
- `frontend/lib/socket.ts` (nouveau)
- `frontend/hooks/useMatchSocket.ts` (nouveau)
- `frontend/pages/matches/[id].tsx` (intégration WebSocket)

**Impact** : ✅ **Non bloquant** (améliore l'expérience, polling HTTP possible en fallback)

---

## 4. CHECKLIST "NEXT ACTIONS" PRIORISÉE

### P0 - Bloquant (Phase 6.0 Backend)

1. ✅ Ajouter champs Phase 6.0 au modèle `Match` dans `schema.prisma`
   - Fichier : `backend/prisma/schema.prisma`
   - Champs : `initialFen`, `currentFen`, `pgn`, `movesJson`, `whiteTimeMsRemaining`, `blackTimeMsRemaining`, `lastMoveAt`, `readyAt`, `whiteJoinedAt`, `blackJoinedAt`, `noShowResolvedAt`, `isRated`, `ratingDelta`

2. ✅ Créer modèle `MatchMove` dans `schema.prisma`
   - Fichier : `backend/prisma/schema.prisma`
   - Champs : `id`, `matchId`, `moveNumber`, `playerId`, `color`, `san`, `from`, `to`, `promotion`, `fenBefore`, `fenAfter`, `whiteTimeMsRemaining`, `blackTimeMsRemaining`, `createdAt`

3. ✅ Créer enum `MatchColor` dans `schema.prisma`
   - Fichier : `backend/prisma/schema.prisma`
   - Valeurs : `WHITE`, `BLACK`

4. ✅ Créer migration Prisma
   - Commande : `npx prisma migrate dev --name add_match_gameplay_fields`
   - Vérifier : `backend/prisma/migrations/[timestamp]_add_match_gameplay_fields/migration.sql`

5. ✅ Installer `chess.js`
   - Fichier : `backend/package.json`
   - Commande : `npm install chess.js`
   - Ajouter dans `dependencies`

6. ✅ Créer `ChessEngineService`
   - Fichier : `backend/src/modules/matches/chess-engine.service.ts`
   - Méthode : `validateAndApplyMove(move: Move): { valid: boolean, fenAfter?: string, error?: string }`

7. ✅ Créer fichier de config
   - Fichier : `backend/src/modules/matches/match.config.ts`
   - Constantes : `JOIN_WINDOW_SECONDS`, `NO_SHOW_GRACE_SECONDS`, defaults time control

8. ✅ Ajouter méthodes dans `MatchesService`
   - Fichier : `backend/src/modules/matches/matches.service.ts`
   - Méthodes : `joinMatch()`, `getMatchState()`, `playMove()`
   - Logique no-show : `maybeResolveNoShow()`
   - Logique pendule : parsing `timeControl`, décrément, timeout

9. ✅ Ajouter routes dans `MatchesController`
   - Fichier : `backend/src/modules/matches/matches.controller.ts`
   - Routes : `POST /matches/:id/join`, `GET /matches/:id/state`, `POST /matches/:id/move`
   - Guards : `JwtAuthGuard`, `ActivePlayerGuard`

10. ✅ Créer DTOs
    - `backend/src/modules/matches/dto/play-move.dto.ts`
    - `backend/src/modules/matches/dto/match-state-view.dto.ts`

11. ✅ Enregistrer `ChessEngineService` dans `MatchesModule`
    - Fichier : `backend/src/modules/matches/matches.module.ts`
    - Ajouter dans `providers`

---

### P1 - Bloquant (Phase 6.1 Frontend + Phase 6.2 ChessBoard)

12. ✅ Ajouter types et fonctions API dans `api.ts`
    - Fichier : `frontend/lib/api.ts`
    - Types : `MatchStateView`, `PlayMovePayload`
    - Fonctions : `getMatchState()`, `joinMatch()`, `playMove()`

13. ✅ Créer composant `ChessBoard`
    - Fichier : `frontend/components/ChessBoard.tsx`
    - Props : `fen`, `orientation`, `onMove`, `lastMove`, etc.
    - Fonctionnalités : parsing FEN, sélection cases, highlight lastMove

14. ✅ Créer page match
    - Fichier : `frontend/pages/matches/[id].tsx`
    - Fonctionnalités : join au montage, polling HTTP, affichage pendules, intégration `ChessBoard`

---

### P2 - Non bloquant (Phase 6.3 WebSockets)

15. ✅ Installer dépendances WebSocket backend
    - Fichier : `backend/package.json`
    - Commandes : `npm install @nestjs/websockets socket.io`
    - Ajouter dans `dependencies`

16. ✅ Créer `MatchesGateway`
    - Fichier : `backend/src/modules/matches/matches.gateway.ts`
    - Décorateur : `@WebSocketGateway()`
    - Méthodes : `handleConnection()`, `handleJoinMatch()`, `broadcastMatchState()`, etc.
    - Auth : vérifier `socket.handshake.auth.token`

17. ✅ Intégrer gateway dans `MatchesService`
    - Fichier : `backend/src/modules/matches/matches.service.ts`
    - Injecter `MatchesGateway`
    - Broadcast après `joinMatch()`, `playMove()`, fin de partie

18. ✅ Enregistrer `MatchesGateway` dans `MatchesModule`
    - Fichier : `backend/src/modules/matches/matches.module.ts`
    - Ajouter dans `providers`

19. ✅ Installer `socket.io-client` frontend
    - Fichier : `frontend/package.json`
    - Commande : `npm install socket.io-client`
    - Ajouter dans `dependencies`

20. ✅ Créer `socket.ts`
    - Fichier : `frontend/lib/socket.ts`
    - Fonction : `createSocket(token: string)`

21. ✅ Créer hook `useMatchSocket`
    - Fichier : `frontend/hooks/useMatchSocket.ts`
    - Fonctionnalités : connexion, join_match, écoute events, gestion reconnexion

22. ✅ Intégrer WebSocket dans page match
    - Fichier : `frontend/pages/matches/[id].tsx`
    - Utiliser `useMatchSocket`
    - Réduire polling quand WebSocket connecté
    - Fallback sur polling HTTP si WebSocket déconnecté

---

## 5. VÉRIFICATIONS TECHNIQUES CRITIQUES

### 5.1 Contrat d'Auth JWT

**Configuration JWT** :
- **Secret** : `process.env.JWT_SECRET` (fallback : `'your-secret-key-change-in-production'`)
- **Expiration** : `7d`
- **Fichier** : `backend/src/auth/auth.module.ts` (lignes 17-20)

**Payload JWT** :
```typescript
interface JwtPayload {
  sub: string;      // player.id
  email: string;
  username: string;
  role: PlayerRole;
}
```
- **Fichier** : `backend/src/auth/types/jwt-payload.interface.ts`

**Guards** :
- `JwtAuthGuard` : `backend/src/auth/guards/jwt-auth.guard.ts`
- `ActivePlayerGuard` : `backend/src/auth/guards/active-player.guard.ts`

**Note WebSockets** : Réutiliser `JwtStrategy` pour valider le token depuis `socket.handshake.auth.token`. Le payload sera identique (`sub`, `email`, `username`, `role`).

### 5.2 Modèle TournamentEntry et récupération playerId

**Modèle TournamentEntry** :
- **Fichier** : `backend/prisma/schema.prisma` (lignes 174-193)
- **Champs** : `id`, `playerId`, `tournamentId`, `status`, `buyInPaidCents`
- **Relations** : `player` (Player), `matchesAsWhite`, `matchesAsBlack`

**Récupération des joueurs** :
- `match.whiteEntry.playerId` → joueur blanc
- `match.blackEntry.playerId` → joueur noir
- **Fichier** : `backend/src/modules/matches/matches.service.ts` (ligne 337-344)

**Note Phase 6.0** : Pour `joinMatch()` et `playMove()`, vérifier que `req.user.sub` (playerId) correspond à `match.whiteEntry.playerId` ou `match.blackEntry.playerId`.

### 5.3 Logique de fin de match

**Fonctions responsables** :

1. **Génération ronde suivante** :
   - **Signature** : `generateNextRoundIfNeeded(tournamentId: string): Promise<void>`
   - **Fichier** : `backend/src/modules/matches/matches.service.ts` (lignes 441-533)

2. **Finalisation tournoi et payouts** :
   - **Signature** : `finalizeTournamentAndPayouts(tournamentId: string): Promise<void>`
   - **Fichier** : `backend/src/modules/tournaments/tournaments.service.ts` (lignes 596-793)

**Déclenchement** :
- **Fichier** : `backend/src/modules/matches/matches.service.ts` (ligne 433)
- Appelé depuis `reportResult()` après mise à jour du match

**Note Phase 6.0** : Quand un match se termine via `playMove()` (checkmate/timeout), appeler la même logique :
1. Mettre à jour `match.status = FINISHED`, `match.result`, `match.finishedAt`
2. Appeler `this.generateNextRoundIfNeeded(match.tournamentId)`
3. Ne pas réécrire la logique de payouts

### 5.4 Format timeControl et validation

**Type Prisma** :
- **Type** : `String` (non-null)
- **Format attendu** : `"10+0"`, `"3+0"`, `"1+0"` (minutes + secondes d'incrément)
- **Fichier** : `backend/prisma/schema.prisma` (ligne 149)

**Validation DTOs** :
- `@IsString()` (obligatoire, non-null)
- **Fichier** : `backend/src/modules/tournaments/dto/create-tournament.dto.ts` (ligne 17)

**Note Phase 6.0** : Parser `timeControl` (ex: `"10+0"` → `{ minutes: 10, increment: 0 }`). Pas de validation de format actuellement, à ajouter si besoin.

### 5.5 Conventions d'erreurs API

**Format standard** :
```typescript
interface ApiError {
  message: string
  statusCode?: number
  code?: string
}
```
- **Fichier** : `frontend/lib/api.ts` (lignes 3-7)

**Codes d'erreur existants** :
- `ACCOUNT_SUSPENDED`
- `TOURNAMENTS_BLOCKED`
- `DEPOSITS_BLOCKED`
- `WITHDRAWALS_BLOCKED`
- **Fichier** : `frontend/lib/api.ts` (lignes 10-13)

**Format backend** : NestJS peut retourner :
- `{ message: string }` (simple)
- `{ message: { code: string, message: string } }` (objet imbriqué)
- `{ code: string, message: string }` (au niveau racine)

**Note Phase 6.0** : Introduire des codes d'erreur pour les matches :
- `ILLEGAL_MOVE`
- `NOT_YOUR_TURN`
- `MATCH_NOT_RUNNING`
- `PLAYER_NOT_IN_MATCH`
- `TIMEOUT`
- `INVALID_MOVE_FORMAT`

### 5.6 Pré-check WebSockets (CORS, URL, Proxy)

**URL API Backend (Frontend)** :
- Variable d'environnement : `NEXT_PUBLIC_API_BASE_URL`
- Fallback : `http://localhost:4000`
- **Fichier** : `frontend/lib/api.ts` (ligne 1)

**Configuration CORS (Backend)** :
- Origin : `process.env.FRONTEND_URL` (fallback : `http://localhost:3000`)
- Credentials : `true`
- **Fichier** : `backend/src/main.ts` (lignes 23-26)

**URL WebSocket cible** :
- **Recommandation** : `ws://localhost:4000` (même host/port que REST)
- Ou : `http://localhost:4000` (socket.io gère le protocole)

**Code frontend suggéré** :
```typescript
const WS_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'
const socket = io(WS_URL, {
  auth: { token: localStorage.getItem('authToken') }
})
```

### 5.7 Scripts et commandes de démarrage

**Scripts package.json** :

**Backend** :
- `start:dev` : `nest start --watch`
- `prisma:generate` : `prisma generate`
- `prisma:migrate` : `prisma migrate dev`
- **Fichier** : `backend/package.json` (lignes 8-23)

**Frontend** :
- `dev` : `next dev`
- **Fichier** : `frontend/package.json` (lignes 5-10)

**Commandes de démarrage** :
- PostgreSQL (Docker) : `docker compose -f infra/docker-compose.yml up -d postgres`
- Backend : `cd backend && npm run start:dev`
- Frontend : `cd frontend && npm run dev`
- Migrations : `cd backend && npx prisma migrate deploy`

---

## 6. CONCLUSION

**État actuel** : Phase 5 complète et fonctionnelle. Phases 6.0-6.3 entièrement à implémenter.

**Prochaines étapes** : Suivre la checklist priorisée (P0 → P1 → P2) pour implémenter les phases manquantes.

**Risques identifiés** :
- ⚠️ Bloquant : Pas de gameplay possible sans Phase 6.0
- ⚠️ Complexité : Intégration moteur d'échecs et gestion temps
- ✅ Non bloquant : WebSockets (amélioration UX, polling HTTP possible)

**Estimation effort** :
- Phase 6.0 : ~10-12 fichiers, ~1500-2000 lignes
- Phase 6.1 + 6.2 : ~3-4 fichiers, ~500-800 lignes
- Phase 6.3 : ~5-6 fichiers, ~300-500 lignes
- **Total** : ~18-22 fichiers, ~2300-3300 lignes

---

**Document généré le** : 14 Décembre 2025  
**Auditeur** : Assistant technique Cursor  
**Mode** : Lecture seule (aucune modification effectuée)

---

## 📝 Mise à jour post-audit

**Date** : 14 Décembre 2025 (soir)

**Actions effectuées** :
- ✅ Base de données restaurée depuis backup du 10.12.2025
- ✅ PostgreSQL mis à jour vers version 17 (compatibilité avec dumps récents)
- ✅ Migrations Prisma marquées comme appliquées
- ✅ Script d'import automatisé créé (`backend/import-database.ps1`)
- ✅ Documentation de restauration créée (`docs/audits/README - Restauration base de données PostgreSQL.md`)

**Configuration actuelle** :
- PostgreSQL : 17.7 (via Docker `postgres:17-alpine`)
- Port : 5433 (Docker) / 5432 (local)
- Base de données : `chessbet_db` restaurée avec succès

