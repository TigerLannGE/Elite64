# Phase 6.0.C - Orchestration Gameplay - Documentation Transversale

**Date de création** : 14 décembre 2025  
**Dernière mise à jour** : 14 décembre 2025  
**Statut** : ✅ Complété  
**Dépendances** : Phase 6.0.A (Prisma), Phase 6.0.B (ChessEngineService)  
**Scope** : Parties jouables par HTTP via `MatchesService`, sans WebSockets.

---

## 1. Objectif

Permettre de **jouer une partie d'échecs complète** entre deux joueurs inscrits à un tournoi, en utilisant uniquement des requêtes HTTP :

- Rejoindre un match (`join`).
- Consulter l'état canonique du match (`state`).
- Jouer des coups (`move`).

Tout en respectant :
- La Phase 5 (brackets, standings, payouts) inchangée.
- Le moteur d'échecs existant (Phase 6.0.B).
- La base de données comme **source de vérité**.

---

## 2. Endpoints HTTP

### 2.1 `POST /matches/:id/join`

**But** : signaler que le joueur est présent ; démarrer la partie quand les deux sont là.

- **Route** : `MatchesController.joinMatch()`
- **Protection** : `JwtAuthGuard` + `ActivePlayerGuard`
- **Input** : `:id` = ID du match (path), JWT = joueur.
- **Output** : `MatchStateViewDto`.

Règles :
- Le `playerId` doit être soit le joueur de l'entrée blanche (`whiteEntry.playerId`), soit de l'entrée noire (`blackEntry.playerId`). Sinon → 403 `PLAYER_NOT_IN_MATCH`.
- Si `status ∈ {FINISHED, CANCELED}` → 400 `MATCH_NOT_JOINABLE`.
- Si c'est le premier join : `readyAt = now`.
- `whiteJoinedAt` ou `blackJoinedAt` sont remplis selon le joueur.
- Si les deux ont rejoint et `status === PENDING` :
  - `status = RUNNING`.
  - `startedAt = now`.
  - `initialFen` et `currentFen` = FEN de départ standard.
  - `readyAt` reste inchangé (premier join).
  - `lastMoveAt = now`.
  - `whiteTimeMsRemaining` et `blackTimeMsRemaining` = temps de base dérivé de `Tournament.timeControl` ("M+I").

---

### 2.2 `GET /matches/:id/state`

**But** : exposer l'état **canonique** d'un match au frontend.

- **Route** : `MatchesController.getMatchState()`
- **Protection** : `JwtAuthGuard` + `ActivePlayerGuard`
- **Input** : `:id` = ID du match, JWT.
- **Output** : `MatchStateViewDto`.

Règles :
- Vérifie que le joueur est bien dans le match, sinon 403 `PLAYER_NOT_IN_MATCH`.
- Ne fait **aucune modification** de la DB.
- Retourne :
  - `matchId`, `tournamentId`, `status`, `result`, `resultReason`.
  - `whitePlayerId`, `blackPlayerId`.
  - `fen` (position actuelle) = `currentFen` ou `initialFen` ou FEN de départ.
  - `moveNumber` = nombre de coups joués.
  - `turn` = couleur au trait, dérivée du FEN via `ChessEngineService`.
  - `whiteTimeMsRemaining`, `blackTimeMsRemaining`.
  - `lastMove` (SAN, from, to, promotion) ou `null`.
  - `serverTimeUtc` = heure serveur UTC (ISO string).

---

### 2.3 `POST /matches/:id/move`

**But** : jouer un coup, mettre à jour la DB, renvoyer l'état à jour.

- **Route** : `MatchesController.playMove()`
- **Protection** : `JwtAuthGuard` + `ActivePlayerGuard`
- **DTO** : `PlayMoveDto` (`from`, `to`, `promotion?`).
- **Output** : `MatchStateViewDto`.

Pipeline (dans une transaction Prisma) :
1. Charger le match + tournoi + coups existants.
2. Vérifier que le joueur est un des deux participants.
3. Vérifier `status === RUNNING`, sinon 400 `MATCH_NOT_RUNNING`.
4. Déterminer la couleur du joueur (WHITE/BLACK).
5. Dériver le trait courant à partir de `currentFen` via `ChessEngineService`. Si mauvais trait → 400 `NOT_YOUR_TURN`.
6. Calculer `elapsedMs = now - lastMoveAt` et décrémenter le temps du joueur.
   - Si temps <= 0 **avant coup** : déclarer un timeout (adversaire gagne, `resultReason = "TIMEOUT"`) et terminer.
7. Appeler `ChessEngineService.validateAndApplyMove(fen, move)`.
   - Si coup illégal → 400 `ILLEGAL_MOVE`.
8. Créer un `MatchMove` avec :
   - `moveNumber`, `playerId`, `color`, `san`, `from`, `to`, `promotion`.
   - `fenBefore`, `fenAfter`, `whiteTimeMsRemaining`, `blackTimeMsRemaining`.
9. Mettre à jour `Match` :
   - `currentFen`, `lastMoveAt`, `whiteTimeMsRemaining`, `blackTimeMsRemaining`.
10. Si le moteur signale une fin de partie (`gameEnd`) :
    - Mapper vers `MatchResult` (`WHITE_WIN`, `BLACK_WIN`, `DRAW`).
    - Renseigner `resultReason` (`CHECKMATE`, `STALEMATE`, `INSUFFICIENT_MATERIAL`, `FIFTY_MOVE_RULE`, `THREE_FOLD_REPETITION`).
    - Passer `status = FINISHED`, `finishedAt = now`.
    - Appeler `generateNextRoundIfNeeded(tournamentId)` **après** la transaction.
11. Retourner `MatchStateViewDto` issu du match mis à jour.

Remarques Phase 6.0.C :
- L'incrément de temps (partie "+I") est parsé mais pas encore ajouté au temps après chaque coup.
- La logique de no-show est évaluée de façon **lazy** avant chaque appel via `maybeResolveNoShow(matchId)`.

---

### 2.4 `POST /matches/:id/resign`

**But** : permettre à un joueur de s'**abandonner** (résignation) sans jouer de coup supplémentaire.

- **Route** : `MatchesController.resignMatch()`
- **Protection** : `JwtAuthGuard` + `ActivePlayerGuard`
- **Input** : `:id` = ID du match, body vide
- **Output** : `MatchStateViewDto` du match terminé

Règles :
- Le joueur doit être `whiteEntry.playerId` ou `blackEntry.playerId`, sinon 403 :

```json
{ "code": "PLAYER_NOT_IN_MATCH", "message": "Vous n'êtes pas un participant de ce match" }
```

- Le match doit être en statut `RUNNING`. Si le match est `PENDING`, `FINISHED` ou `CANCELED` :

```json
{ "code": "MATCH_NOT_RUNNING", "message": "Ce match n'est pas en cours" }
```

- Le joueur qui abandonne perd, l'adversaire gagne :

| Qui abandonne | `result` renvoyé |
|---------------|------------------|
| Blanc         | `BLACK_WIN`      |
| Noir          | `WHITE_WIN`      |

- Le match est mis à jour avec :

```json
{
  "status": "FINISHED",
  "result": "WHITE_WIN" | "BLACK_WIN",
  "resultReason": "RESIGNATION",
  "finishedAt": "<nowUTC>"
}
```

Exemple curl :

```bash
TOKEN_WHITE="jwt-du-joueur-blanc"
MATCH_ID="match-123"

curl -X POST http://localhost:4000/matches/$MATCH_ID/resign \
  -H "Authorization: Bearer $TOKEN_WHITE"
```

---

## 3. DTOs

### 3.1 `PlayMoveDto`

```ts
export class PlayMoveDto {
  @IsString()
  from: string; // "e2"

  @IsString()
  to: string;   // "e4"

  @IsOptional()
  @IsIn(['q', 'r', 'b', 'n'])
  promotion?: 'q' | 'r' | 'b' | 'n';
}
```

### 3.2 `MatchStateViewDto`

```ts
export class MatchStateViewDto {
  matchId: string;
  tournamentId: string;
  status: MatchStatus;           // PENDING | RUNNING | FINISHED | CANCELED
  result?: MatchResult | null;   // WHITE_WIN | BLACK_WIN | DRAW | BYE
  resultReason?: string | null;  // "CHECKMATE", "TIMEOUT", ...
  whitePlayerId: string;
  blackPlayerId: string;
  fen: string;                   // FEN courante
  moveNumber: number;            // Nombre de coups joués
  turn: MatchColor;              // WHITE ou BLACK (dérivé du FEN)
  whiteTimeMsRemaining: number;
  blackTimeMsRemaining: number;
  lastMove?: {
    san: string;
    from: string;
    to: string;
    promotion?: string | null;
  } | null;
  serverTimeUtc: string;         // `new Date().toISOString()`
}
```

---

## 4. Gestion du temps

### 4.1 Format `Tournament.timeControl`

- Format : `"M+I"` (exemples : `"10+0"`, `"3+0"`, `"1+0"`).
- `M` = minutes de base.
- `I` = incrément en secondes par coup (non appliqué en 6.0.C, mais parsé).

### 4.2 Initialisation des pendules

Lors du passage en `RUNNING` (dans `joinMatch`) :
- `whiteTimeMsRemaining = baseMinutes * 60 * 1000`.
- `blackTimeMsRemaining = baseMinutes * 60 * 1000`.
- `lastMoveAt = now`.

### 4.3 Décrément & timeout

À chaque coup (`playMove`) :
- `elapsedMs = now - lastMoveAt`.
- Décrémenter le temps du joueur qui joue.
- Si temps <= 0 **avant** de valider le coup :
  - Timeout, adversaire gagne (`result = WHITE_WIN` ou `BLACK_WIN`).
  - `resultReason = "TIMEOUT"`.
  - Match `FINISHED`, `finishedAt = now`.

### 4.4 Incrément (non appliqué en 6.0.C)

- L'incrément `I` est parsé mais non ajouté après un coup.
- Pour les time controls actuels (`10+0`, `3+0`, `1+0`), ce n'est pas bloquant.

---

## 5. No-show et tie-break (statut)

### 5.1 No-show (lazy evaluation)

Infrastructure :
- Champs Prisma : `readyAt`, `whiteJoinedAt`, `blackJoinedAt`, `noShowResolvedAt`.
- Fichier de config : `backend/src/modules/matches/match.config.ts` avec :
  - `JOIN_WINDOW_SECONDS = 30`
  - `NO_SHOW_GRACE_SECONDS = 60`
  - `TOTAL_NO_SHOW_MS = (JOIN_WINDOW_SECONDS + NO_SHOW_GRACE_SECONDS) * 1000`

Logique (méthode privée `MatchesService.maybeResolveNoShow(matchId)`) :

- Conditions pour tenter une résolution :
  - `match.status === PENDING`.
  - `readyAt` non nul (défini au **premier join**).
  - `noShowResolvedAt` nul (idempotence).
  - `now >= readyAt + TOTAL_NO_SHOW_MS` (soit 30s de fenêtre de join + 60s de grâce = 90s).
- Cas traités à l'intérieur d'une transaction Prisma :
  - **0 joueurs ont rejoint** (`whiteJoinedAt` null, `blackJoinedAt` null) :
    - `status = FINISHED`
    - `result = DRAW`
    - `resultReason = "DOUBLE_NO_SHOW"`
    - `finishedAt = nowUTC`
    - `noShowResolvedAt = nowUTC`
  - **1 seul joueur a rejoint** :
    - Le joueur présent est déclaré vainqueur :
      - `result = WHITE_WIN` ou `BLACK_WIN` selon `whiteJoinedAt` ou `blackJoinedAt`.
      - `resultReason = "NO_SHOW"`.
    - `status = FINISHED`
    - `finishedAt = nowUTC`
    - `noShowResolvedAt = nowUTC`
- Après commit :
  - `generateNextRoundIfNeeded(tournamentId)` est appelé de manière asynchrone.

Timeline simplifiée :

1. Premier joueur rejoint : `readyAt = now`.
2. Deuxième joueur ne rejoint pas :
   - Tant que `now < readyAt + 90s` : rien ne se passe, le match reste `PENDING`.
   - À partir de `readyAt + 90s` :
     - Lors du prochain appel à :
       - `POST /matches/:id/join`
       - `GET /matches/:id/state`
       - `POST /matches/:id/move`
     - `maybeResolveNoShow(matchId)` est exécutée et applique la résolution appropriée (`NO_SHOW` ou `DOUBLE_NO_SHOW`).

Idempotence :
- Si `noShowResolvedAt` est déjà renseigné, `maybeResolveNoShow()` **ne fait rien** et retourne immédiatement.

### 5.2 Tie-break

- Champs : `parentMatchId`, `isTieBreak`, `tieBreakIndex`, `tieBreakType`.
- Comportement actuel : `DRAW` fait avancer les deux joueurs (hérité de la Phase 5).
- Aucune création de match enfant tie-break.

---

## 6. Intégration avec la Phase 5

La Phase 6.0.C **n'altère pas** la chaîne existante :

```text
reportResult() 
  → generateNextRoundIfNeeded() 
    → (nouvelle ronde ou finalisation)
```

- `reportResult()` reste le chemin administrateur pour enregistrer un résultat.
- `playMove()` ajoute un nouveau chemin de terminaison (résultat calculé par le moteur), mais appelle ensuite `generateNextRoundIfNeeded()` comme `reportResult()`.
- `finalizeTournamentAndPayouts()` n'est pas modifiée.

Conclusion : la logique de brackets et de payouts Phase 5 reste la **source de vérité**.

---

## 7. Limitations connues de la Phase 6.0.C

1. **Incrément de temps ignoré** : pas critique pour `10+0`, `3+0`, `1+0`.
2. **Pas de WebSockets** : le frontend devra poller `GET /matches/:id/state`.
3. **Pas d'interface de jeu frontend** : la partie est jouable via HTTP, mais aucun plateau n'est encore exposé côté Next.js.

---

## 8. Validation rapide

### 8.1 Commandes backend

```powershell
cd backend
npm run build
npm test
npx prisma migrate status
npx prisma generate
```

### 8.2 Séquence HTTP minimale

```bash
TOKEN_WHITE="<jwt-blanc>"
TOKEN_BLACK="<jwt-noir>"
MATCH_ID="<id-match>"

# Blanc rejoint
curl -X POST http://localhost:4000/matches/$MATCH_ID/join \
  -H "Authorization: Bearer $TOKEN_WHITE"

# Noir rejoint
curl -X POST http://localhost:4000/matches/$MATCH_ID/join \
  -H "Authorization: Bearer $TOKEN_BLACK"

# État
curl -X GET http://localhost:4000/matches/$MATCH_ID/state \
  -H "Authorization: Bearer $TOKEN_WHITE"

# Coup légal
curl -X POST http://localhost:4000/matches/$MATCH_ID/move \
  -H "Authorization: Bearer $TOKEN_WHITE" \
  -H "Content-Type: application/json" \
  -d '{"from":"e2","to":"e4"}'

# Coup illégal (doit échouer)
curl -X POST http://localhost:4000/matches/$MATCH_ID/move \
  -H "Authorization: Bearer $TOKEN_WHITE" \
  -H "Content-Type: application/json" \
  -d '{"from":"e2","to":"e5"}'
```

---

Ce document résume **ce qui est réellement implémenté en Phase 6.0.C**, ce qui est **structurellement prêt** (no-show, tie-break), et ce qui est **reporté** aux phases suivantes.

---

## 📚 Références

### Documentation Connexe

- [Phase 6.0.A - Extension Schéma Prisma](./phase-06.0.A_schema-extension_cross.md)
- [Phase 6.0.B - Moteur d'échecs backend](../backend/phase-06.0.B_chess-engine_backend.md)
- [Phase 6.1 - Frontend Gameplay MVP](../frontend/phase-06.1_frontend-gameplay_frontend.md)

### Tests et Validation

- [Phase 6.2 - Tests E2E Gameplay Complets](./phase-06.2_e2e-gameplay-tests_cross.md)  
  Suite complète de tests End-to-End validant tous les types de mouvements aux échecs via l'API REST. **Résultat : 11/11 PASS (100%)**

---

**Statut final** : ✅ **Phase 6.0.C complétée et validée**