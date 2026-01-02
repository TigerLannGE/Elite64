# Phase 6.0.D.3 - Création Automatique de Tie-Breaks - Documentation Backend

**Date de création** : 01 janvier 2026  
**Dernière mise à jour** : 01 janvier 2026  
**Statut** : ✅ Complété

---

## 📋 Vue d'ensemble

Cette phase implémente la création automatique de matchs tie-break lorsqu'un match parent se termine en DRAW. La création est déclenchée **après persistance du DRAW du parent, puis création des tie-breaks après commit (post-transaction)**, avec idempotence garantie via contrainte unique DB.

**⚠️ Important** : Cette phase ne modifie pas les endpoints publics, ne touche pas aux services ChessEngine, et respecte les phases 5/6.0.A/6.0.B/6.0.C figées.

---

## 🎯 Objectifs

- ✅ Créer automatiquement les matchs tie-break après un DRAW (automatique ou manuel)
- ✅ Respecter la séquence unique : Transaction → Commit → Post-transaction
- ✅ Garantir l'idempotence via contrainte unique DB (`@@unique([parentMatchId, tieBreakIndex])`)
- ✅ Gérer toutes les politiques de tie-break (RAPID, BLITZ, ARMAGEDDON, BEST_OF_3, BEST_OF_5)
- ✅ Assignation déterministe des couleurs (alternance, ARMAGEDDON avec inversion)
- ✅ Persister `timeControlOverride` selon la décision 0.5

---

## 🏗️ Architecture

### Fichiers créés/modifiés

```
backend/src/modules/matches/
├── match.constants.ts                    (nouveau)
├── matches.service.ts                    (modifié)
└── matches.tiebreak.service.spec.ts     (nouveau)
```

---

## 🔧 Implémentation

### 1. Constante RESULT_REASON_TIEBREAK_PENDING

**Fichier** : `backend/src/modules/matches/match.constants.ts`

```typescript
export const RESULT_REASON_TIEBREAK_PENDING = 'TIEBREAK_PENDING' as const;
```

**Justification** : Éviter une migration Prisma supplémentaire. Le champ `resultReason` reste `String?` dans le schéma, compatible avec les valeurs legacy existantes.

---

### 2. Méthode createTieBreakMatches()

**Fichier** : `backend/src/modules/matches/matches.service.ts`

**Signature** :
```typescript
async createTieBreakMatches(parentMatchId: string): Promise<void>
```

**Logique** :

1. **Chargement** : Charge le match parent avec tournoi et entries
2. **Vérifications** :
   - Match parent existe → throw `NotFoundException` si absent
   - Match n'est pas déjà un tie-break → no-op si `isTieBreak === true`
   - Match est terminé en DRAW → no-op si pas DRAW
   - Tournoi a `tieBreakPolicy != NONE` → no-op si `NONE`
3. **Détermination du nombre** :
   - `RAPID` / `BLITZ` / `ARMAGEDDON` → 1 match
   - `BEST_OF_3` → 3 matches
   - `BEST_OF_5` → 5 matches
4. **Time control** : `tournament.tieBreakTimeControl ?? tournament.timeControl`
5. **Création idempotente** : Pour chaque `tieBreakIndex` (1..N) :
   - Tente `createSingleTieBreakMatch()`
   - Si erreur `P2002` (contrainte unique) → ignore (déjà créé)
   - Si autre erreur → throw

**Idempotence** : Gestion de `P2002` pour garantir qu'un double appel ne crée pas de doublons.

---

### 3. Méthode createSingleTieBreakMatch() (privée)

**Fichier** : `backend/src/modules/matches/matches.service.ts`

**Signature** :
```typescript
private async createSingleTieBreakMatch(
  parentMatch: Match & { ... },
  tieBreakIndex: number,
  timeControl: string,
  tieBreakPolicy: TieBreakPolicy,
): Promise<Match>
```

**Assignation déterministe des couleurs** :

- **ARMAGEDDON** (décision 0.6) : Inversion systématique
  - `whiteEntryId = parentMatch.blackEntry.id`
  - `blackEntryId = parentMatch.whiteEntry.id`
- **Autres politiques** : Alternance selon `tieBreakIndex`
  - Index impair (1, 3, 5...) : Mêmes couleurs que le parent
  - Index pair (2, 4, 6...) : Swap des couleurs

**Champs persistés** :
- `isTieBreak = true`
- `parentMatchId = parentMatch.id`
- `tieBreakIndex = tieBreakIndex` (1..N)
- `tieBreakType = tieBreakPolicy`
- `timeControlOverride = timeControl` (décision 0.5)
- `roundNumber` et `boardNumber` : Mêmes que le parent

---

### 4. Intégration dans playMove()

**Fichier** : `backend/src/modules/matches/matches.service.ts`

**Modifications** :

1. **Dans la transaction** (ligne ~1127-1135) :
   ```typescript
   if (result === MatchResult.DRAW) {
     const tournament = await tx.tournament.findUnique({
       where: { id: match.tournamentId },
       select: { tieBreakPolicy: true },
     });

     if (tournament && tournament.tieBreakPolicy !== TieBreakPolicy.NONE) {
       // Marquage explicite : DRAW avec tie-break pending
       updateData.resultReason = RESULT_REASON_TIEBREAK_PENDING;
     } else {
       // DRAW sans tie-break : utiliser la raison normale
       updateData.resultReason = resultReason;
     }
   }
   ```

2. **Après commit** (post-transaction, ligne ~1184-1195) :
   ```typescript
   // Phase 6.0.D.3 - Si DRAW avec tie-break pending, créer les tie-breaks APRÈS commit
   if (wasMatchFinished && isDrawWithTieBreak) {
     try {
       await this.createTieBreakMatches(matchIdForTieBreak);
     } catch (err) {
       console.error('[playMove] Erreur lors de la création des tie-breaks:', err);
       // On ne propage pas l'erreur pour ne pas faire échouer le coup qui a été joué avec succès
     }
   }
   ```

**Séquence respectée** : Transaction → Commit → Post-transaction (décision 0.3).

---

### 5. Intégration dans reportResult()

**Fichier** : `backend/src/modules/matches/matches.service.ts`

**Modifications** :

1. **Avant update** (ligne ~484-495) :
   ```typescript
   // Phase 6.0.D.3 - Si DRAW, vérifier si tie-break nécessaire
   let resultReason: string | null = dto.resultReason || null;
   if (dto.result === MatchResult.DRAW) {
     const tournament = await this.prisma.tournament.findUnique({
       where: { id: match.tournamentId },
       select: { tieBreakPolicy: true },
     });

     if (tournament && tournament.tieBreakPolicy !== TieBreakPolicy.NONE) {
       // Marquage explicite : DRAW avec tie-break pending
       resultReason = RESULT_REASON_TIEBREAK_PENDING;
     }
   }
   ```

2. **Après update** (post-transaction, ligne ~542-555) :
   ```typescript
   // Phase 6.0.D.3 - Si DRAW avec tie-break pending, créer les tie-breaks APRÈS commit
   const isDrawWithTieBreak =
     dto.result === MatchResult.DRAW &&
     resultReason === RESULT_REASON_TIEBREAK_PENDING;
   
   if (isDrawWithTieBreak) {
     try {
       await this.createTieBreakMatches(matchId);
     } catch (err) {
       console.error('[reportResult] Erreur lors de la création des tie-breaks:', err);
       // On ne propage pas l'erreur pour ne pas faire échouer le report qui a réussi
     }
   }
   ```

**Séquence respectée** : Update → Commit → Post-transaction (décision 0.3).

---

## 🧪 Tests

### Fichier de tests

**Fichier** : `backend/src/modules/matches/matches.tiebreak.service.spec.ts`

### Tests CREATE

**14 tests** :

1. ✅ **Créer 1 match tie-break pour RAPID**
   - Vérifie que `create()` est appelé 1 fois
   - Vérifie les champs (`isTieBreak`, `parentMatchId`, `tieBreakIndex`, `tieBreakType`, `timeControlOverride`)

2. ✅ **Créer 1 match tie-break pour BLITZ**
   - Même logique que RAPID

3. ✅ **Créer 1 match tie-break pour ARMAGEDDON avec inversion des couleurs**
   - Vérifie que les couleurs sont inversées (`whiteEntryId = blackEntryId parent`)

4. ✅ **Créer 3 matchs tie-break pour BEST_OF_3**
   - Vérifie que `create()` est appelé 3 fois
   - Vérifie les `tieBreakIndex` (1, 2, 3)

5. ✅ **Créer 5 matchs tie-break pour BEST_OF_5**
   - Vérifie que `create()` est appelé 5 fois

6. ✅ **Idempotence : ignorer P2002 (contrainte unique violée)**
   - Simule `P2002` sur `create()`
   - Vérifie qu'aucune exception n'est levée

7. ✅ **Throw si erreur autre que P2002**
   - Simule une autre erreur (ex: `P2001`)
   - Vérifie que l'erreur est propagée

8. ✅ **Throw NotFoundException si match parent inexistant**
   - Simule `findUnique()` retournant `null`
   - Vérifie que `NotFoundException` est levée

9. ✅ **No-op si match est déjà un tie-break**
   - Simule `isTieBreak === true`
   - Vérifie que `create()` n'est pas appelé

10. ✅ **No-op si match n'est pas DRAW**
    - Simule `result !== DRAW`
    - Vérifie que `create()` n'est pas appelé

11. ✅ **No-op si tieBreakPolicy = NONE**
    - Simule `tieBreakPolicy === NONE`
    - Vérifie que `create()` n'est pas appelé

12. ✅ **Utiliser tieBreakTimeControl si présent, sinon timeControl**
    - Test avec `tieBreakTimeControl = '5+3'`
    - Vérifie que `timeControlOverride = '5+3'`

13. ✅ **Utiliser timeControl si tieBreakTimeControl absent**
    - Test avec `tieBreakTimeControl = null`
    - Vérifie que `timeControlOverride = timeControl`

14. ✅ **Alterner les couleurs pour BEST_OF_3 (index pair = swap)**
    - Vérifie que :
      - Index 1 (impair) : mêmes couleurs que parent
      - Index 2 (pair) : swap des couleurs
      - Index 3 (impair) : mêmes couleurs que parent

### Résultats

**14/14 tests passent** ✅

```powershell
# Lancer les tests spécifiques
npm test -- matches.tiebreak.service.spec.ts

# Lancer tous les tests (vérification intégration)
npm test
```

---

## ⚠️ Points d'Attention

1. **Séquence unique (décision 0.3)** : Transaction → Commit → Post-transaction. **Pas d'alternative**. Toute modification réintroduirait les risques de couplage et de deadlocks.

2. **Idempotence** : Gestion de `P2002` pour garantir qu'un double appel (race condition) ne crée pas de doublons. La contrainte unique DB `@@unique([parentMatchId, tieBreakIndex])` garantit l'unicité.

3. **Assignation déterministe des couleurs** :
   - ARMAGEDDON : Inversion systématique (décision 0.6)
   - Autres : Alternance selon `tieBreakIndex` (pair = swap, impair = même)

4. **Time control (décision 0.5)** : `timeControlOverride = tournament.tieBreakTimeControl ?? tournament.timeControl`. Tous les tie-breaks ont `timeControlOverride` défini.

5. **Gestion d'erreurs** : Les erreurs lors de la création des tie-breaks sont loggées mais ne font pas échouer `playMove()` ou `reportResult()`. Le match parent est déjà persisté en DRAW, donc l'opération principale a réussi.

6. **Aucun changement d'API publique** : Cette phase ne modifie pas les DTOs, les endpoints, ni les signatures publiques. La création de tie-breaks est transparente pour le frontend.

---

## 📚 Références

- **[Phase 6.0.D - Cadrage d'Exécution](../cross/phase-06.0.D_cadrage-execution_cross.md)**  
  Document de référence avec les 6 décisions critiques figées (décision 0.3, 0.5, 0.6) et le découpage technique.

- **[Phase 6.0.D - Design Règles Avancées](./phase-06.0.D_advanced-rules-tiebreaks_backend.md)**  
  Design complet de la Phase 6.0.D avec les algorithmes de résolution et les cas limites.

- **[Phase 6.0.D.1 - Modélisation DB](../cross/phase-06.0.D_cadrage-execution_cross.md#21-phase-60d1--modélisation-db--enums)**  
  Phase précédente : création des enums et extension du schéma Prisma (contrainte unique `@@unique([parentMatchId, tieBreakIndex])`).

- **[Phase 6.0.D.2 - Extension DTOs](./phase-06.0.D.2_dto-validation_backend.md)**  
  Phase précédente : extension des DTOs tournois avec les nouveaux champs de configuration.

---

## 📊 Checklist de Complétion

- [x] Constante `RESULT_REASON_TIEBREAK_PENDING` créée
- [x] Méthode `createTieBreakMatches()` implémentée
- [x] Méthode `createSingleTieBreakMatch()` implémentée (privée)
- [x] Gestion de toutes les politiques (RAPID, BLITZ, ARMAGEDDON, BEST_OF_3, BEST_OF_5)
- [x] Assignation déterministe des couleurs (alternance, ARMAGEDDON avec inversion)
- [x] Persistance `timeControlOverride` selon décision 0.5
- [x] Idempotence via gestion P2002
- [x] Intégration dans `playMove()` (marquage + appel post-transaction)
- [x] Intégration dans `reportResult()` (marquage + appel post-transaction)
- [x] Tests unitaires pour chaque politique (14 tests)
- [x] Tests unitaires pour l'idempotence (P2002)
- [x] Tests unitaires pour les cas edge (no-op, NotFoundException)
- [x] Tests unitaires pour l'assignation des couleurs (alternance, ARMAGEDDON)
- [x] Tests unitaires pour timeControlOverride
- [x] Compilation TypeScript OK
- [x] Tests passent (70/70, dont 14 nouveaux)
- [x] Linter OK
- [x] Aucun changement d'API publique

---

**Statut final** : ✅ **100% complété**

