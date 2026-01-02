# Phase 6.0.D.4 - Redirection Anti-Friction et Résolution Déterministe - Documentation Backend

**Date de création** : 01 janvier 2026  
**Dernière mise à jour** : 01 janvier 2026  
**Statut** : ✅ Complété

---

## 📋 Vue d'ensemble

Cette phase implémente la redirection anti-friction vers les tie-breaks actifs et la résolution déterministe des tie-breaks. L'objectif est de permettre au frontend de rester sur le `parentMatchId` tout en étant automatiquement redirigé vers le tie-break actif, et de résoudre automatiquement les tie-breaks terminés pour mettre à jour le match parent.

**⚠️ Important** : Cette phase ne modifie pas les endpoints publics, ne touche pas aux services ChessEngine, et respecte les phases 5/6.0.A/6.0.B/6.0.C figées.

---

## 🎯 Objectifs

- ✅ Implémenter `getActivePlayableMatchId()` : redirection sécurisée vers tie-break actif
- ✅ Implémenter `resolveTieBreak()` : résolution déterministe selon toutes les politiques
- ✅ Implémenter `findBestOfNWinner()` : helper pour BEST_OF_3/5 avec comptage par entryId
- ✅ Modifier `generateNextRoundIfNeeded()` selon Décision B3 (return immédiat si tie-break pending)
- ✅ Intégrer la redirection dans `getMatchState()`, `joinMatch()`, `playMove()`
- ✅ Résolution automatique après chaque coup/result sur un tie-break terminé
- ✅ Patch d'observabilité : logs améliorés avec matchId/parentId/tournamentId systématiquement inclus

---

## 🏗️ Architecture

### Fichiers modifiés

```
backend/src/modules/matches/
├── matches.service.ts                    (modifié)
└── matches.tiebreak.service.spec.ts     (modifié - ajout tests Phase 6.0.D.4)
```

---

## 🔧 Implémentation

### 1. Méthode `getActivePlayableMatchId()`

**Fichier** : `backend/src/modules/matches/matches.service.ts`

**Signature** :
```typescript
private async getActivePlayableMatchId(
  matchId: string, 
  playerId: string
): Promise<string>
```

**Fonctionnalité** :
- Retourne l'ID du match jouable actif à partir d'un `matchId`
- Si le match est un parent avec `result = DRAW` et `resultReason = RESULT_REASON_TIEBREAK_PENDING`, retourne le tie-break actif (tieBreakIndex minimal non terminé)
- Sinon, retourne le `matchId` original

**Sécurité** :
- ⚠️ `playerId` est **obligatoire** (non-optionnel) pour garantir la sécurité
- Vérification que les `entryIds` existent (pas de BYE/PENDING incomplet)
- Vérification que le joueur est autorisé (whiteEntry.playerId ou blackEntry.playerId)
- Si `playerId` n'est pas autorisé → `throw ForbiddenException` avec code `PLAYER_NOT_IN_MATCH`
- Si match inexistant → `throw NotFoundException`

**Edge case "tie-breaks finis mais parent pas à jour"** :
- Si tous les tie-breaks sont terminés mais le parent n'est pas encore mis à jour (fenêtre de course), déclenche `resolveTieBreak()` en best effort (non bloquant)
- Log : `[getActivePlayableMatchId] best-effort resolveTieBreak failed - matchId=<...>, tournamentId=<...>, error=<err.message>`

**Vérification des entryIds du tie-break** :
- Option A (implémentée) : Vérification par `entryIds` (Set) plutôt que par `whiteEntry/blackEntry`
- Les entryIds du tie-break doivent correspondre au set `{parent.whiteEntryId, parent.blackEntryId}`

**Exemple d'utilisation** :
```typescript
// Dans getMatchState(), joinMatch(), playMove()
const activeMatchId = await this.getActivePlayableMatchId(matchId, playerId);
// Utiliser activeMatchId au lieu de matchId pour les opérations suivantes
```

---

### 2. Méthode `resolveTieBreak()`

**Fichier** : `backend/src/modules/matches/matches.service.ts`

**Signature** :
```typescript
async resolveTieBreak(parentMatchId: string): Promise<void>
```

**Fonctionnalité** :
- Résout un tie-break et met à jour le match parent
- Appelée en "best effort" : les erreurs sont loggées mais ne sont pas propagées
- Vérifie que tous les tie-breaks sont terminés avant de résoudre
- Détermine le vainqueur selon la politique et met à jour le parent
- Appelle `generateNextRoundIfNeeded()` après mise à jour du parent

**Politiques supportées** :

#### RAPID / BLITZ
- 1 match → winner direct
- Si `result === WHITE_WIN` → `winnerEntryId = whiteEntryId`
- Si `result === BLACK_WIN` → `winnerEntryId = blackEntryId`
- Si `result === DRAW` → cas edge, ne pas résoudre (log warn)
- `resultReason` : `'TIE_BREAK_RAPID'` ou `'TIE_BREAK_BLITZ'`

#### ARMAGEDDON
- 1 match avec inversion des couleurs (décision 0.6)
- Si `result === WHITE_WIN` → `winnerEntryId = whiteEntryId`
- Si `result === BLACK_WIN` → `winnerEntryId = blackEntryId`
- Si `result === DRAW` → **noir gagne** (décision 0.6) : `winnerEntryId = blackEntryId`
- `resultReason` : `'TIE_BREAK_ARMAGEDDON'`

#### BEST_OF_3 / BEST_OF_5
- Utilise `findBestOfNWinner()` pour compter les victoires par entryId
- BEST_OF_3 : premier à 2 victoires
- BEST_OF_5 : premier à 3 victoires
- Si égalité ou pas assez de victoires → cas edge, ne pas résoudre (log warn avec résumé des résultats)
- `resultReason` : `'TIE_BREAK_BEST_OF_3'` ou `'TIE_BREAK_BEST_OF_5'`

**Mise à jour du parent** :
```typescript
await this.prisma.match.update({
  where: { id: parentMatchId },
  data: {
    result: parentResult, // WHITE_WIN ou BLACK_WIN selon winnerEntryId
    resultReason, // 'TIE_BREAK_RAPID', 'TIE_BREAK_BLITZ', etc.
  },
});
```

**Appel automatique** :
- Après chaque coup sur un tie-break terminé (dans `playMove()`)
- Après chaque résultat sur un tie-break terminé (dans `reportResult()`)
- En best effort depuis `getActivePlayableMatchId()` si tous les tie-breaks sont terminés mais parent pas encore mis à jour

---

### 3. Méthode `findBestOfNWinner()`

**Fichier** : `backend/src/modules/matches/matches.service.ts`

**Signature** :
```typescript
private findBestOfNWinner(tieBreakMatches: Array<{
  result: MatchResult;
  whiteEntryId: string;
  blackEntryId: string;
}>): string | null
```

**Fonctionnalité** :
- Trouve le vainqueur d'un BEST_OF_N en comptant les victoires par entryId
- Gère l'alternance des couleurs (les entryIds peuvent être swappés entre les matchs)
- Retourne `null` si égalité ou pas assez de victoires

**Algorithme** :
1. Compter les victoires par entryId (pas par couleur)
2. Trouver l'entryId avec le plus de victoires
3. Vérifier le seuil de victoires (BEST_OF_3 = 2, BEST_OF_5 = 3)
4. Retourner l'entryId du vainqueur ou `null` si pas de vainqueur déterminé

**Exemple** :
```typescript
// Match 1: WHITE_WIN (whiteEntryId = entryA, blackEntryId = entryB)
// Match 2: BLACK_WIN (whiteEntryId = entryB, blackEntryId = entryA) // Swap
// Match 3: WHITE_WIN (whiteEntryId = entryA, blackEntryId = entryB)
// → entryA a 2 victoires, entryB a 1 victoire
// → Vainqueur : entryA (BEST_OF_3)
```

---

### 4. Modification de `generateNextRoundIfNeeded()` - Décision B3

**Fichier** : `backend/src/modules/matches/matches.service.ts`

**Décision B3 - Règle simple et robuste** :
- Calculer la ronde courante (parent matches only, ignore les tie-breaks)
- Si un parent est `DRAW + resultReason = RESULT_REASON_TIEBREAK_PENDING` → **return immédiatement** (pas de progression)
- Sinon, calculer winners (pas de relecture dans la boucle)

**Modifications** :
1. Filtrer les matchs tie-break dans le calcul de la ronde courante
2. Vérifier qu'aucun parent n'a de tie-break pending avant de calculer les winners
3. Pas de relecture dans la boucle : utiliser les données déjà chargées

**Code** :
```typescript
// 4. ⭐ DÉCISION B3 - Vérifier qu'aucun match DRAW n'a de tie-break pending
// Règle simple : si un parent est DRAW + TIEBREAK_PENDING → return immédiatement
for (const match of currentRoundMatches) {
  if (
    match.result === MatchResult.DRAW &&
    match.resultReason === RESULT_REASON_TIEBREAK_PENDING &&
    match.tournament.tieBreakPolicy !== TieBreakPolicy.NONE
  ) {
    // ⭐ Return immédiatement sans inspecter les tie-breaks (respect strict B3)
    return;
  }
}
```

---

### 5. Intégration dans les méthodes existantes

#### `getMatchState()`
```typescript
async getMatchState(matchId: string, playerId: string): Promise<MatchStateViewDto> {
  // Phase 6.0.D.4 - Redirection vers tie-break actif si nécessaire
  const activeMatchId = await this.getActivePlayableMatchId(matchId, playerId);
  
  // Utiliser activeMatchId pour charger le match
  const match = await this.prisma.match.findUnique({
    where: { id: activeMatchId },
    // ...
  });
  // ...
}
```

#### `joinMatch()`
```typescript
async joinMatch(matchId: string, playerId: string): Promise<MatchStateViewDto> {
  // Phase 6.0.D.4 - Redirection vers tie-break actif si nécessaire
  const activeMatchId = await this.getActivePlayableMatchId(matchId, playerId);
  
  // Utiliser activeMatchId pour charger le match
  // ...
}
```

#### `playMove()`
```typescript
async playMove(matchId: string, playerId: string, dto: PlayMoveDto): Promise<MatchStateViewDto> {
  // Phase 6.0.D.4 - Redirection vers tie-break actif si nécessaire (avant la transaction)
  const activeMatchId = await this.getActivePlayableMatchId(matchId, playerId);
  
  // Utiliser activeMatchId dans la transaction
  const stateView = await this.prisma.$transaction(async (tx) => {
    const match = await tx.match.findUnique({
      where: { id: activeMatchId },
      // ...
    });
    // ...
  });
  
  // Après la transaction : si tie-break terminé, résoudre
  if (wasMatchFinished && originalMatchIdForTieBreak && !isDrawWithTieBreak) {
    await this.resolveTieBreak(originalMatchIdForTieBreak);
  }
  // ...
}
```

**⚠️ Important** : Dans `playMove()` et `reportResult()`, utiliser `originalMatchIdForTieBreak` (parent) et non `activeMatchId` (peut être un tie-break) pour créer les tie-breaks.

---

### 6. Patch d'Observabilité

**Objectif** : Améliorer les logs pour faciliter le debugging et l'observabilité en production.

**Modifications** :

#### `getActivePlayableMatchId()` - ligne ~1833
```typescript
this.logger.warn(
  `[getActivePlayableMatchId] best-effort resolveTieBreak failed - matchId=${matchId}, tournamentId=${tournamentId}, error=${err.message}`,
);
```

#### `resolveTieBreak()` - Cas RAPID/BLITZ DRAW - ligne ~1962
```typescript
this.logger.warn(
  `[resolveTieBreak] DRAW in tie-break - parentId=${parentMatchId}, tournamentId=${parentMatch.tournamentId}, policy=${tieBreakPolicy} - not resolved`,
);
```

#### `resolveTieBreak()` - Cas BEST_OF_3/5 égalité - ligne ~1998
```typescript
const resultsSummary = parentMatch.tieBreakMatches
  .map((m, idx) => `${idx + 1}:${m.result}`)
  .join(',');
this.logger.warn(
  `[resolveTieBreak] no winner - parentId=${parentMatchId}, tournamentId=${parentMatch.tournamentId}, policy=BEST_OF_${policyLabel}, results=[${resultsSummary}] - not resolved`,
);
```

#### `resolveTieBreak()` - Catch `generateNextRoundIfNeeded()` - ligne ~2035
```typescript
this.logger.error(
  `[resolveTieBreak] generateNextRoundIfNeeded failed - parentId=${parentMatchId}, tournamentId=${parentMatch.tournamentId}`,
  err instanceof Error ? err.stack : String(err),
);
```

**Format standardisé** :
- `[methodName] action - key1=value1, key2=value2, ... - status`
- Les IDs sont systématiquement inclus (`matchId`, `parentId`, `tournamentId`)
- Les erreurs incluent le stack trace
- Les cas edge utilisent `logger.warn`, les erreurs réelles `logger.error`

---

## 🧪 Tests

### Tests unitaires ajoutés

**Fichier** : `backend/src/modules/matches/matches.tiebreak.service.spec.ts`

#### Tests `getActivePlayableMatchId()` (6 tests)
- ✅ Retourne `matchId` si match n'est pas un parent avec tie-break pending
- ✅ Retourne `tieBreakId` si parent a tie-break pending et tie-break actif existe
- ✅ Throw `ForbiddenException` si `playerId` n'est pas autorisé
- ✅ Throw `NotFoundException` si match inexistant
- ✅ Déclenche `resolveTieBreak` si tous les tie-breaks sont terminés mais parent pas mis à jour
- ✅ Throw `BadRequestException` si match n'a pas d'entrées complètes (BYE)

#### Tests `resolveTieBreak()` (5 tests)
- ✅ Résout RAPID : winner direct
- ✅ Résout ARMAGEDDON : noir gagne si nul
- ✅ Résout BEST_OF_3 : majorité de victoires
- ✅ No-op si pas tous les tie-breaks sont terminés
- ✅ No-op si DRAW dans RAPID (cas edge)

#### Tests `generateNextRoundIfNeeded()` - Décision B3 (1 test)
- ✅ Return immédiatement si un parent est DRAW + TIEBREAK_PENDING

### Tests gameplay existants

**Fichier** : `backend/src/modules/matches/matches.gameplay.service.spec.ts`

- ✅ Mock ajouté pour `getActivePlayableMatchId()` dans les tests gameplay (retourne simplement `matchId` car ces tests ne testent pas la redirection tie-break)

### Commandes de test

```powershell
# Tous les tests
cd backend
npm test

# Tests spécifiques Phase 6.0.D.4
npm test -- matches.tiebreak.service.spec.ts

# Tests gameplay (avec mock getActivePlayableMatchId)
npm test -- matches.gameplay.service.spec.ts
```

---

## ⚠️ Points d'Attention

### Sécurité
1. **`playerId` obligatoire** : `getActivePlayableMatchId()` exige `playerId` pour vérifier l'autorisation. Ne jamais simplifier en retirant ce paramètre.
2. **Vérification BYE/incomplets** : Vérifier que les `entryIds` existent avant de continuer (pas de BYE/PENDING incomplet).
3. **ForbiddenException immédiate** : Si `playerId` n'est pas autorisé, throw `ForbiddenException` immédiatement (pas de retour de `matchId`).

### Performance
1. **Pas de requête DB supplémentaire** : `tournamentId` est récupéré depuis les données déjà chargées (pas de requête supplémentaire pour les logs).
2. **Best effort non bloquant** : `resolveTieBreak()` appelé en best effort depuis `getActivePlayableMatchId()` ne bloque pas le flux principal.

### Edge Cases
1. **Tie-breaks finis mais parent pas à jour** : Fenêtre de course gérée par `getActivePlayableMatchId()` qui déclenche `resolveTieBreak()` en best effort.
2. **DRAW dans RAPID/BLITZ** : Cas edge non résolu (log warn), nécessite intervention manuelle ou policy de fallback.
3. **Égalité BEST_OF_3/5** : Cas edge non résolu (log warn avec résumé des résultats), nécessite intervention manuelle ou policy de fallback.

### Décision B3
1. **Return immédiat** : `generateNextRoundIfNeeded()` doit return immédiatement si un parent est `DRAW + TIEBREAK_PENDING`, sans inspecter les tie-breaks.
2. **Pas de relecture dans la boucle** : Utiliser les données déjà chargées, pas de relecture dans la boucle.

### Ciblage correct du parent
1. **Création des tie-breaks** : Utiliser `originalMatchIdForTieBreak` (parent) et non `activeMatchId` (peut être un tie-break) dans `playMove()` et `reportResult()`.

---

## 📊 Résumé des Méthodes

| Méthode | Type | Description |
|---------|------|-------------|
| `getActivePlayableMatchId()` | `private` | Redirection sécurisée vers tie-break actif |
| `resolveTieBreak()` | `public` | Résolution déterministe des tie-breaks |
| `findBestOfNWinner()` | `private` | Helper pour BEST_OF_3/5 avec comptage par entryId |

---

## 🔗 Références

- **[Phase 6.0.D - Cadrage d'Exécution](../cross/phase-06.0.D_cadrage-execution_cross.md)**  
  Document de référence avec toutes les décisions figées (0.1 à 0.6, B1 à B3).

- **[Phase 6.0.D.3 - Création Automatique de Tie-Breaks](./phase-06.0.D.3_tiebreak-creation_backend.md)**  
  Documentation de la création automatique des tie-breaks (prérequis).

- **[Phase 6.0.D.2 - Extension DTOs et Validations](./phase-06.0.D.2_dto-validation_backend.md)**  
  Documentation de l'extension des DTOs et validations métier.

- **[Phase 6.0.D - Design](./phase-06.0.D_advanced-rules-tiebreaks_backend.md)**  
  Design complet de la Phase 6.0.D (référence).

---

## ✅ Checklist de Complétion

- [x] `getActivePlayableMatchId()` implémentée avec sécurité verrouillée
- [x] `resolveTieBreak()` implémentée avec support de toutes les politiques
- [x] `findBestOfNWinner()` implémentée avec comptage par entryId
- [x] `generateNextRoundIfNeeded()` modifiée selon Décision B3
- [x] Intégration dans `getMatchState()`, `joinMatch()`, `playMove()`
- [x] Résolution automatique après coup/result sur tie-break terminé
- [x] Patch d'observabilité appliqué (logs améliorés)
- [x] Tests unitaires complets (12 tests Phase 6.0.D.4)
- [x] Tests gameplay mockés correctement
- [x] Build passe sans erreurs
- [x] Tous les tests passent (82 tests)

---

**Statut final** : ✅ **100% complété**

