# Rapport d'audit — Phase 6.0.C (Backend Gameplay Orchestration)

**Date d'audit** : 14 Décembre 2025  
**Périmètre** : Phase 6.0.C — Orchestration gameplay HTTP dans `MatchesService`  
**Mode** : Lecture seule (aucune modification de code pendant l'audit)

---

## 1. Résumé exécutif

- ✅ Les endpoints HTTP `POST /matches/:id/join`, `GET /matches/:id/state`, `POST /matches/:id/move`, `POST /matches/:id/resign` sont bien implémentés dans `MatchesController` et délèguent à `MatchesService`.
- ✅ La validation des coups s'appuie correctement sur `ChessEngineService` (Phase 6.0.B, déjà testée).
- ✅ Les coups sont persistés dans `MatchMove` (1 ligne par coup) avec FEN avant/après, SAN et temps restants.
- ✅ Le statut du match, les pendules et `currentFen` sont mis à jour de manière atomique dans une transaction Prisma.
- ✅ La fin de partie (checkmate, stalemate, timeout, résignation, etc.) est détectée ou enregistrée et déclenche `generateNextRoundIfNeeded()` sans casser la Phase 5.
- ✅ La logique de no-show (JOIN_WINDOW_SECONDS + NO_SHOW_GRACE_SECONDS, soit 90s après `readyAt`) est implémentée via une évaluation lazy dans `MatchesService.maybeResolveNoShow()`, appelée par `joinMatch`, `getMatchState` et `playMove`.
- ⚠️ L'incrément de temps (partie "+I" dans le time control) est parsé mais pas appliqué après chaque coup.

Conclusion : **Phase 6.0.C (incluant 6.0.C1 résignation et 6.0.C2 no-show lazy)** est fonctionnelle et conforme au périmètre défini ; seule l'application de l'incrément reste à implémenter.

---

## 2. Fichiers inspectés

- `backend/src/modules/matches/matches.controller.ts`
- `backend/src/modules/matches/matches.service.ts`
- `backend/src/modules/matches/dto/play-move.dto.ts`
- `backend/src/modules/matches/dto/match-state-view.dto.ts`
- `backend/src/modules/matches/matches.gameplay.service.spec.ts`
- `backend/src/modules/matches/chess-engine.service.ts` (Phase 6.0.B, pour cohérence)
- `backend/prisma/schema.prisma` (modèles `Match`, `MatchMove`)

---

## 3. Présence des endpoints

### 3.1 `POST /matches/:id/join`

- **Controller** : `MatchesController.joinMatch()`  
- **Service** : `MatchesService.joinMatch(matchId, playerId)`  
- **Statut** : ✅ **Présent et conforme**

Fonctionnalités :
- Vérifie que le joueur est bien `whiteEntry.playerId` ou `blackEntry.playerId` (403 `PLAYER_NOT_IN_MATCH` sinon).
- Refuse les matches `FINISHED` ou `CANCELED` (400 `MATCH_NOT_JOINABLE`).
- Initialise `readyAt` au premier join.
- Renseigne `whiteJoinedAt` / `blackJoinedAt` selon le joueur.
- Lorsque les deux ont rejoint et que le match est `PENDING` :
  - Met `status = RUNNING`.
  - Initialise `initialFen` et `currentFen` à la position de départ standard.
  - Parse `tournament.timeControl` ("M+I") et initialise les pendules (`whiteTimeMsRemaining`, `blackTimeMsRemaining`).
  - Met `startedAt` et `lastMoveAt` à `now`.
- Retourne un `MatchStateViewDto` complet.

Limites :
- ❌ Aucune logique de no-show n'est appliquée dans `joinMatch`.

---

### 3.2 `GET /matches/:id/state`

- **Controller** : `MatchesController.getMatchState()`  
- **Service** : `MatchesService.getMatchState(matchId, playerId)`  
- **Statut** : ✅ **Présent et conforme au périmètre minimal**

Fonctionnalités :
- Vérifie que le joueur est bien dans le match (403 `PLAYER_NOT_IN_MATCH` sinon).
- Charge le match + dernier `MatchMove`.
- Construit un `MatchStateViewDto` avec :
  - `fen` (currentFen ou initialFen ou FEN de départ par défaut).
  - `moveNumber` (nombre de coups joués).
  - `turn` dérivé du FEN via `ChessEngineService`.
  - Dernier coup (`lastMove`) si présent.
  - `serverTimeUtc` = `new Date().toISOString()` (UTC).

Limites :
- ❌ Pas de flags avancés type `canMove`, `myColor`, `canOfferDraw` (non exigés au strict minimum).
- ❌ Aucune logique no-show évaluée ici.

---

### 3.3 `POST /matches/:id/move`

- **Controller** : `MatchesController.playMove()`  
- **Service** : `MatchesService.playMove(matchId, playerId, dto)`  
- **Statut** : ✅ **Présent et correctement orchestré**

Principales étapes (dans une `prisma.$transaction`) :
1. Charge le match, le tournoi et les coups existants.
2. Vérifie joueur dans le match (403 si non).
3. Vérifie `match.status === RUNNING` (400 `MATCH_NOT_RUNNING` sinon).
4. Détermine la couleur du joueur (`WHITE`/`BLACK`).
5. Déduit le trait courant à partir de `currentFen` via `ChessEngineService`.
6. Refuse si ce n'est pas au joueur de jouer (400 `NOT_YOUR_TURN`).
7. Calcule le temps écoulé depuis `lastMoveAt` et décrémente le temps du joueur actif.
8. Si temps <= 0 **avant** le coup : timeout → match terminé (`result` gagnant adverse, `resultReason = "TIMEOUT"`).
9. Appelle `ChessEngineService.validateAndApplyMove(fen, {from,to,promotion})`.
10. Si illégal : 400 `ILLEGAL_MOVE`.
11. Compte les coups pour déterminer `moveNumber`.
12. Crée `MatchMove` avec : `fenBefore`, `fenAfter`, `san`, temps restants, couleur, etc.
13. Met à jour `Match` : `currentFen`, `lastMoveAt`, pendules.
14. Si le moteur signale une fin de partie (checkmate, stalemate, etc.) :
    - Map vers `MatchResult` + `resultReason`.
    - Met `status = FINISHED`, `finishedAt = now`.
    - Planifie un appel à `generateNextRoundIfNeeded(tournamentId)` après la transaction.
15. Retourne un `MatchStateViewDto` basé sur l'état mis à jour.

Limites :
- ❌ L'incrément (partie "+I" du time control) n'est pas ajouté au temps du joueur après un coup.
- ❌ Pas de logique no-show évaluée ici.

---

### 3.4 `POST /matches/:id/resign`

- **Statut** : ✅ **Implémenté**.
- **Controller** : `MatchesController.resignMatch()`  
- **Service** : `MatchesService.resignMatch(matchId, playerId)`  

Comportement :
- Vérifie que le joueur est bien participant, sinon 403 `PLAYER_NOT_IN_MATCH`.
- Vérifie que le match est `RUNNING`, sinon 400 `MATCH_NOT_RUNNING`.
- Marque le match comme terminé avec :
  - `status = FINISHED`
  - `result = WHITE_WIN` ou `BLACK_WIN` (l'adversaire du joueur qui abandonne)
  - `resultReason = "RESIGNATION"`
  - `finishedAt = nowUTC`
- Planifie l'appel à `generateNextRoundIfNeeded(tournamentId)` après la transaction.
- Retourne un `MatchStateViewDto` du match terminé.

---

## 4. No-show, tie-break et invariants Phase 5

### 4.1 No-show

- Les champs Prisma `readyAt`, `whiteJoinedAt`, `blackJoinedAt`, `noShowResolvedAt` existent dans le modèle `Match`.
- Des constantes de configuration sont définies dans `backend/src/modules/matches/match.config.ts` :
  - `JOIN_WINDOW_SECONDS = 30`
  - `NO_SHOW_GRACE_SECONDS = 60`
  - `TOTAL_NO_SHOW_MS = (JOIN_WINDOW_SECONDS + NO_SHOW_GRACE_SECONDS) * 1000`
- Une méthode privée `MatchesService.maybeResolveNoShow(matchId)` implémente la résolution lazy :
  - S'exécute uniquement si :
    - `match.status === PENDING`
    - `readyAt` non nul
    - `noShowResolvedAt` null
    - `now >= readyAt + TOTAL_NO_SHOW_MS`
  - Cas 0 joined :
    - `status = FINISHED`
    - `result = DRAW`
    - `resultReason = "DOUBLE_NO_SHOW"`
    - `finishedAt = nowUTC`
    - `noShowResolvedAt = nowUTC`
  - Cas 1 joined :
    - Le joueur présent est déclaré vainqueur (`WHITE_WIN` ou `BLACK_WIN`)
    - `resultReason = "NO_SHOW"`
    - `status = FINISHED`
    - `finishedAt = nowUTC`
    - `noShowResolvedAt = nowUTC`
- Après commit :
  - `generateNextRoundIfNeeded(tournamentId)` est appelé (async) pour faire avancer le tournoi.
- La méthode est **idempotente** : si `noShowResolvedAt` est déjà renseigné, elle ne modifie rien.

Appels :
- `maybeResolveNoShow(matchId)` est appelée au début de :
  - `joinMatch(matchId, playerId)`
  - `getMatchState(matchId, playerId)`
  - `playMove(matchId, playerId, dto)`

**Conclusion** : la logique no-show prévue pour 6.0.C2 (JOIN_WINDOW_SECONDS + NO_SHOW_GRACE_SECONDS) est bien implémentée et intégrée dans le flux gameplay.

### 4.2 Tie-break

- Les champs `parentMatchId`, `isTieBreak`, `tieBreakIndex`, `tieBreakType` sont présents.
- `generateNextRoundIfNeeded()` garde le comportement Phase 5 :
  - `DRAW` fait avancer les deux joueurs.
  - Si nombre impair de winners : BYE automatique.
- Aucun match tie-break enfant n'est créé quand un match se termine par `DRAW`.

**Conclusion** : tie-break **non implémenté** en 6.0.C, comportement Phase 5 conservé.

### 4.3 Invariants Phase 5

- `MatchesService.reportResult()` est intact.
- `MatchesService.generateNextRoundIfNeeded()` est intact.
- `TournamentsService.finalizeTournamentAndPayouts()` n'a pas été modifié.
- `playMove()` appelle `generateNextRoundIfNeeded()` après avoir terminé un match, sans court-circuiter la logique Phase 5.

**Conclusion** : la Phase 5 (standings/payouts basés sur `Match.result`) est **préservée**.

---

## 5. Problèmes et risques identifiés

### 5.1 Bloquants

- Aucun point bloquant identifié au niveau backend pour la Phase 6.0.C (incluant résignation et no-show lazy).

### 5.2 Non bloquants mais à surveiller

1. **Incrément ignoré**
   - Aucun impact pour "10+0", "3+0", "1+0".
   - Impact potentiel si de futurs time controls avec incrément sont proposés.

2. **Documentation Phase 6.0.C**
   - La documentation doit rester alignée avec l'implémentation (ce fichier + `PHASE-6.0.C.md` sont désormais à jour).

---

## 6. Exit criteria — Check-list Phase 6.0.C

1. [x] Endpoints `join`, `state`, `move` implémentés et protégés par `JwtAuthGuard` + `ActivePlayerGuard`.
2. [x] Endpoint `POST /matches/:id/resign` implémenté et protégé par `JwtAuthGuard` + `ActivePlayerGuard`.
3. [x] `PlayMoveDto` créé et utilisé.
4. [x] `MatchStateViewDto` créé, utilisé et renvoyé par toutes les routes gameplay.
5. [x] Validation des coups via `ChessEngineService` (`validateAndApplyMove`).
6. [x] Persistance des coups dans `MatchMove` avec `moveNumber` unique par match.
7. [x] Mise à jour de `Match.currentFen`, `lastMoveAt`, `whiteTimeMsRemaining`, `blackTimeMsRemaining` à chaque coup.
8. [x] Détection et gestion des fins de partie (checkmate, stalemate, insufficient material, fifty-move rule, threefold, timeout, resignation).
9. [x] Appel de `generateNextRoundIfNeeded()` après un match terminé via gameplay.
10. [x] Tests unitaires de base sur `joinMatch`, `getMatchState`, `playMove`, `resignMatch`.
11. [x] Logique no-show (JOIN_WINDOW_SECONDS + NO_SHOW_GRACE_SECONDS) implémentée (lazy via `maybeResolveNoShow()`).
12. [ ] Incrément de temps appliqué après chaque coup.
13. [ ] Documentation dédiée Phase 6.0.C référencée dans `docs/README.md`.

---

## 7. Commandes de validation

### 7.1 Backend

```powershell
cd backend

# Build
npm run build

# Tests (incluant gameplay et moteur d'échecs)
npm test

# État des migrations
npx prisma migrate status

# Génération du client Prisma
npx prisma generate
```

### 7.2 Séquence HTTP minimale (curl)

```bash
# Variables
TOKEN_WHITE="<jwt-joueur-blanc>"
TOKEN_BLACK="<jwt-joueur-noir>"
MATCH_ID="<id-match-pending>"

# 1. Blanc rejoint
curl -X POST http://localhost:4000/matches/$MATCH_ID/join \
  -H "Authorization: Bearer $TOKEN_WHITE" \
  -H "Content-Type: application/json"

# 2. Noir rejoint (doit passer RUNNING)
curl -X POST http://localhost:4000/matches/$MATCH_ID/join \
  -H "Authorization: Bearer $TOKEN_BLACK" \
  -H "Content-Type: application/json"

# 3. État du match
curl -X GET http://localhost:4000/matches/$MATCH_ID/state \
  -H "Authorization: Bearer $TOKEN_WHITE"

# 4. Coup légal e2-e4
curl -X POST http://localhost:4000/matches/$MATCH_ID/move \
  -H "Authorization: Bearer $TOKEN_WHITE" \
  -H "Content-Type: application/json" \
  -d '{"from":"e2","to":"e4"}'

# 5. Coup illégal (doit échouer)
curl -X POST http://localhost:4000/matches/$MATCH_ID/move \
  -H "Authorization: Bearer $TOKEN_WHITE" \
  -H "Content-Type: application/json" \
  -d '{"from":"e2","to":"e5"}'
```

---

## 8. Recommandations

1. **Implémenter `/matches/:id/resign`** avec une méthode dédiée dans `MatchesService` et un endpoint dans `MatchesController`.
2. **Introduire une fonction `checkAndResolveNoShow(match)`** et l'appeler dans `joinMatch`, `getMatchState`, `playMove`.
3. **Activer l'incrément de temps** après chaque coup en interprétant la partie "+I" du time control.
4. **Documenter clairement la Phase 6.0.C** dans un fichier `PHASE-6.0.C.md` (description des endpoints, limitations, roadmap).

Ce fichier (`AUDIT-PHASE-6.0.C.md`) sert de référence rapide sur l'état de la Phase 6.0.C au 14/12/2025.
