# Phase 6.0.D.5 - Intégration avec Brackets et Validations Finales - Documentation Backend

**Date de création** : 03 janvier 2026  
**Dernière mise à jour** : 03 janvier 2026  
**Statut** : ✅ Complété  
**Tag Git** : `phase-6.0.D.5`

---

## 📋 Vue d'ensemble

Cette phase finalise l'intégration des tie-breaks dans la progression des brackets et ajoute les validations finales pour les DRAW automatiques dans `playMove()`. Elle complète la Phase 6.0.D en ajoutant les garde-fous runtime pour `requiresDecisiveResult` et `drawRuleMode`.

**⚠️ Important** : Cette phase ne modifie pas les endpoints publics, ne touche pas aux services ChessEngine, et respecte les phases 5/6.0.A/6.0.B/6.0.C figées.

---

## 🎯 Objectifs

- ✅ Intégration avec brackets : `generateNextRoundIfNeeded()` conforme (Décision B3 déjà implémentée en D.4)
- ✅ Validations finales dans `playMove()` : garde-fous runtime pour `requiresDecisiveResult` et `drawRuleMode`
- ✅ Correction de la redirection D.4 : utilisation de `activeMatchId` dans la transaction
- ✅ Remplacement de `console.error` par `logger.error` (format standardisé)
- ✅ Tests unitaires complets (3 tests Phase 6.0.D.5)

---

## 🏗️ Architecture

### Fichiers modifiés

```
backend/src/modules/matches/
├── matches.service.ts                    (modifié)
└── matches.gameplay.service.spec.ts     (modifié - ajout tests Phase 6.0.D.5)
```

---

## 🔧 Implémentation

### 1. Import DrawRuleMode

**Fichier** : `backend/src/modules/matches/matches.service.ts`

**Ligne ~19** : Ajout de l'import `DrawRuleMode` depuis `@prisma/client`

```typescript
import {
  Match,
  MatchStatus,
  MatchResult,
  MatchColor,
  TournamentStatus,
  TournamentEntryStatus,
  TieBreakPolicy,
  DrawRuleMode,  // ⭐ Ajout Phase 6.0.D.5
  Prisma,
} from '@prisma/client';
```

---

### 2. Correction de la redirection D.4 dans la transaction

**Fichier** : `backend/src/modules/matches/matches.service.ts`

**Problème identifié** : Dans `playMove()`, `activeMatchId` était utilisé pour charger le match mais `matchId` (original) était utilisé dans `matchMove.create` et `match.update`.

**Corrections appliquées** :

- **Ligne ~1099** : `matchMove.create` utilise maintenant `activeMatchId`
- **Ligne ~1219** : `match.update` utilise maintenant `activeMatchId`

**Justification** : Si un joueur est redirigé vers un tie-break actif, tous les opérations de la transaction doivent utiliser `activeMatchId` pour garantir la cohérence.

---

### 3. Validations finales pour DRAW automatiques

**Fichier** : `backend/src/modules/matches/matches.service.ts`

**Lignes ~1156-1213** : Modification du bloc de gestion DRAW dans `playMove()`

**Modifications** :

1. **Chargement du tournoi** (lignes ~1159-1166) :
   - Ajout de `requiresDecisiveResult` et `drawRuleMode` dans le `select`
   - Chargement uniquement si `result === MatchResult.DRAW`

2. **Garde-fou 1** (lignes ~1172-1185) :
   - Si `requiresDecisiveResult === true` ET `tieBreakPolicy === NONE`
   - → `logger.error` (format `key=value`) + `throw BadRequestException` avec code `DRAW_NOT_ALLOWED`

3. **Garde-fou 2** (lignes ~1187-1200) :
   - Si `drawRuleMode === NO_DRAW` ET `tieBreakPolicy === NONE`
   - → `logger.error` (format `key=value`) + `throw BadRequestException` avec code `DRAW_NOT_ALLOWED`

4. **Comportement D.3 conservé** (lignes ~1202-1209) :
   - Si `tieBreakPolicy !== NONE` → `resultReason = RESULT_REASON_TIEBREAK_PENDING`
   - Sinon → `resultReason = resultReason` (raison normale, comportement Phase 5)

**Logique minimale** : Aucune logique `needsTieBreak` ajoutée. Le comportement D.3 existant est conservé, seuls les garde-fous sont ajoutés.

---

### 4. Remplacement console.error par logger.error

**Fichier** : `backend/src/modules/matches/matches.service.ts`

**Ligne ~1478** : Remplacement de `console.error` par `logger.error` avec format standardisé `key=value`

```typescript
// Avant
console.error(
  '[resignMatch] Erreur lors de la génération de la ronde suivante:',
  err,
);

// Après
this.logger.error(
  `[resignMatch] Erreur lors de la génération de la ronde suivante - tournamentId=${finishedMatch.tournamentId}`,
  err instanceof Error ? err.stack : String(err),
);
```

---

### 5. Intégration avec brackets (déjà conforme)

**Fichier** : `backend/src/modules/matches/matches.service.ts`

**Méthode** : `generateNextRoundIfNeeded()` (lignes ~592-712)

**Conformité vérifiée** :
- ✅ Ignore les matchs tie-break dans le comptage (ligne 612)
- ✅ Décision B3 : return immédiat si DRAW + TIEBREAK_PENDING (lignes 624-635)
- ✅ Comportement Phase 5 conservé : les deux joueurs avancent si DRAW sans tie-break (lignes 658-660)

**Aucune modification nécessaire** : La Décision B3 a été implémentée en Phase 6.0.D.4.

---

## 🧪 Tests

### Fichier de tests

**Fichier** : `backend/src/modules/matches/matches.gameplay.service.spec.ts`

### Tests Phase 6.0.D.5

**3 tests** ajoutés dans la section `describe('Phase 6.0.D.5 - Validations DRAW automatiques', () => { ... })` :

1. ✅ **Test 1** : `requiresDecisiveResult=true + tieBreakPolicy=NONE` → `BadRequestException`
   - Vérifie que la configuration invalide est détectée et rejetée
   - Vérifie que `logger.error` est appelé (mais silencé dans les tests)

2. ✅ **Test 2** : `drawRuleMode=NO_DRAW + tieBreakPolicy=NONE` → `BadRequestException`
   - Vérifie que la configuration invalide est détectée et rejetée
   - Vérifie que `logger.error` est appelé (mais silencé dans les tests)

3. ✅ **Test 3** : `requiresDecisiveResult=true + tieBreakPolicy=RAPID` → `resultReason=TIEBREAK_PENDING`
   - Vérifie que le marquage `TIEBREAK_PENDING` est correctement appliqué
   - Vérifie que `match.update` est appelé avec `resultReason = RESULT_REASON_TIEBREAK_PENDING`

### Silencing de logger.error dans les tests

**Implémentation** (lignes ~465-478) :

```typescript
let loggerErrorSpy: jest.SpyInstance;

beforeEach(() => {
  // ... autres mocks ...
  
  // Silencer logger.error pour ces tests (configurations invalides testées volontairement)
  loggerErrorSpy = jest.spyOn((service as any).logger, 'error').mockImplementation(() => {});
});

afterEach(() => {
  loggerErrorSpy.mockRestore();
});
```

**Justification** : Les tests vérifient volontairement des configurations invalides qui déclenchent `logger.error`. Pour éviter la pollution de la sortie Jest, `logger.error` est silencé uniquement dans ces tests.

### Utilisation de la constante RESULT_REASON_TIEBREAK_PENDING

**Import ajouté** (ligne ~8) :
```typescript
import { RESULT_REASON_TIEBREAK_PENDING } from './match.constants';
```

**Utilisation** (2 occurrences) :
- Ligne ~568 : Dans `updatedMatch.resultReason`
- Ligne ~587 : Dans l'assertion `expect(...).toHaveBeenCalledWith(...)`

### Résultats

**3/3 tests passent** ✅

```powershell
# Lancer les tests spécifiques
npm test -- matches.gameplay.service.spec.ts -t "Phase 6.0.D.5"

# Lancer tous les tests (vérification intégration)
npm test
```

---

## ⚠️ Points d'Attention

1. **Garde-fous runtime** : Les validations dans `playMove()` sont des garde-fous de sécurité. Les configurations invalides doivent être rejetées à la création du tournoi (Phase 6.0.D.2). Si elles passent, elles sont loggées en erreur et rejetées en runtime.

2. **Comportement D.3 conservé** : Aucune logique `needsTieBreak` ajoutée. Le comportement existant de marquage `TIEBREAK_PENDING` est conservé. Seuls les garde-fous sont ajoutés.

3. **Redirection D.4** : Correction de l'utilisation de `activeMatchId` dans la transaction pour garantir la cohérence lors de la redirection vers un tie-break actif.

4. **Logs** : Format standardisé `key=value` avec `logger.error` pour les configurations invalides. Aucun `console.*` résiduel.

5. **Tests** : `logger.error` est silencé uniquement dans les tests D.5 pour éviter la pollution de la sortie Jest. Les logs sont toujours émis en production.

6. **Aucun changement d'API publique** : Cette phase ne modifie pas les DTOs, les endpoints, ni les signatures publiques.

---

## 📊 Résumé des Méthodes Modifiées

| Méthode | Type | Modification |
|---------|------|--------------|
| `playMove()` | `public` | Ajout validations `requiresDecisiveResult` et `drawRuleMode` |
| `generateNextRoundIfNeeded()` | `public` | Aucune modification (déjà conforme Décision B3) |

---

## 🔗 Références

- **[Phase 6.0.D - Cadrage d'Exécution](../cross/phase-06.0.D_cadrage-execution_cross.md)**  
  Document de référence avec toutes les décisions figées (0.1 à 0.6, B1 à B3) et le découpage technique.

- **[Phase 6.0.D.4 - Redirection Anti-Friction et Résolution Déterministe](./phase-06.0.D.4_redirection-resolution_backend.md)**  
  Documentation de la redirection anti-friction et de la résolution déterministe des tie-breaks (prérequis).

- **[Phase 6.0.D.3 - Création Automatique de Tie-Breaks](./phase-06.0.D.3_tiebreak-creation_backend.md)**  
  Documentation de la création automatique des tie-breaks (prérequis).

- **[Phase 6.0.D.2 - Extension DTOs et Validations](./phase-06.0.D.2_dto-validation_backend.md)**  
  Documentation de l'extension des DTOs et validations métier (prérequis).

- **[Phase 6.0.D - Design](./phase-06.0.D_advanced-rules-tiebreaks_backend.md)**  
  Design complet de la Phase 6.0.D (référence).

---

## ✅ Checklist de Complétion

- [x] Import `DrawRuleMode` ajouté
- [x] Correction `activeMatchId` dans `matchMove.create` et `match.update`
- [x] Validations `requiresDecisiveResult` et `drawRuleMode` ajoutées avec logs `logger.error`
- [x] Comportement D.3 conservé (pas de logique `needsTieBreak`)
- [x] `console.error` remplacé par `logger.error` avec format standardisé
- [x] `generateNextRoundIfNeeded()` vérifié (déjà conforme Décision B3)
- [x] Tests unitaires complets (3 tests Phase 6.0.D.5)
- [x] `logger.error` silencé dans les tests D.5 uniquement
- [x] Constante `RESULT_REASON_TIEBREAK_PENDING` utilisée dans les tests
- [x] Build passe sans erreurs
- [x] Tous les tests passent (85/85)
- [x] Aucune nouvelle erreur de linter introduite

---

## 📝 Commandes de Validation

```powershell
# Tests spécifiques Phase 6.0.D.5
cd backend
npm test -- matches.gameplay.service.spec.ts -t "Phase 6.0.D.5"

# Tous les tests gameplay
npm test -- matches.gameplay.service.spec.ts

# Tous les tests (vérification non-régression)
npm test

# Build TypeScript
npm run build

# Linter
npm run lint
```

---

**Statut final** : ✅ **100% complété**

