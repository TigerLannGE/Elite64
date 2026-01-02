# Phase 6.0.D.2 - Extension DTOs et Validations Métier - Documentation Backend

**Date de création** : 01 janvier 2026  
**Dernière mise à jour** : 01 janvier 2026  
**Statut** : ✅ Complété  
**Version** : 1.1 (correction test resignMatch + confirmation typage drawConfig)

---

## 📋 Vue d'ensemble

Cette phase étend les DTOs de création et mise à jour de tournois avec les 5 nouveaux champs de configuration des règles avancées (Phase 6.0.D) et implémente les validations métier pour rejeter les configurations incompatibles.

**⚠️ Important** : Cette phase ne modifie pas les endpoints publics, ne touche pas aux services Matches/ChessEngine, et respecte les phases 5/6.0.A/6.0.B/6.0.C figées.

---

## 🎯 Objectifs

- ✅ Étendre `CreateTournamentDto` et `UpdateTournamentDto` avec 5 nouveaux champs optionnels
- ✅ Ajouter les validations `class-validator` pour chaque champ
- ✅ Implémenter les validations métier dans `TournamentsService` (create + update)
- ✅ Créer les tests unitaires pour toutes les validations
- ✅ Extraire les messages d'erreur en constantes pour stabilité des tests

---

## 🏗️ Architecture

### Fichiers créés/modifiés

```
backend/src/modules/tournaments/
├── tournament-validation.constants.ts  (nouveau)
├── dto/
│   ├── create-tournament.dto.ts        (modifié)
│   └── update-tournament.dto.ts        (modifié)
├── tournaments.service.ts               (modifié)
└── tournaments.service.spec.ts         (nouveau)
```

---

## 🔧 Implémentation

### 1. Constantes de Validation

**Fichier** : `backend/src/modules/tournaments/tournament-validation.constants.ts`

Messages d'erreur extraits en constantes pour garantir la stabilité des tests :

```typescript
export const TOURNAMENT_VALIDATION_ERRORS = {
  REQUIRES_DECISIVE_RESULT_WITHOUT_TIEBREAK:
    'Configuration invalide : requiresDecisiveResult=true nécessite un tieBreakPolicy != NONE.',
  NO_DRAW_WITHOUT_TIEBREAK:
    'Configuration invalide : drawRuleMode=NO_DRAW nécessite un tieBreakPolicy != NONE.',
} as const;
```

**Justification** : Les messages d'erreur sont utilisés dans les tests unitaires. Les constantes garantissent qu'un changement de message ne casse pas les tests.

---

### 2. Extension des DTOs

#### 2.1 CreateTournamentDto

**Fichier** : `backend/src/modules/tournaments/dto/create-tournament.dto.ts`

**5 nouveaux champs ajoutés** :

```typescript
// Phase 6.0.D - Règles avancées
@IsOptional()
@IsEnum(DrawRuleMode)
drawRuleMode?: DrawRuleMode;

@IsOptional()
@IsObject()
drawConfig?: Record<string, unknown>; // JSON optionnel (non implémenté en 6.0.D)

@IsOptional()
@IsBoolean()
requiresDecisiveResult?: boolean;

@IsOptional()
@IsEnum(TieBreakPolicy)
tieBreakPolicy?: TieBreakPolicy;

@IsOptional()
@IsString()
tieBreakTimeControl?: string; // ex: "3+2", "10+5"
```

**Validations** :
- `@IsOptional()` : Tous les champs sont optionnels (rétrocompatibilité)
- `@IsEnum()` : Validation des enums `DrawRuleMode` et `TieBreakPolicy`
- `@IsBoolean()` : Validation pour `requiresDecisiveResult`
- `@IsString()` : Validation pour `tieBreakTimeControl`
- `@IsObject()` : Validation pour `drawConfig` (permissif mais typé)

**Typage `drawConfig`** :
- Type : `Record<string, unknown>` (permissif mais typé)
- Validation : `@IsObject()` pour rejeter les non-objets
  - **Comportement** : Rejette les tableaux (souhaitable pour 6.0.D), rejette les primitives (string, number, boolean), accepte uniquement les objets JSON
  - **Note** : Si un jour on veut autoriser un JSON plus libre (tableaux, primitives), il faudra passer à une validation custom. Pour 6.0.D, ce choix est cohérent.
- Service : Cast vers `Prisma.InputJsonValue` pour compatibilité Prisma

#### 2.2 UpdateTournamentDto

**Fichier** : `backend/src/modules/tournaments/dto/update-tournament.dto.ts`

**Mêmes 5 champs ajoutés** avec les mêmes validations.

---

### 3. Validations Métier dans le Service

#### 3.1 createTournamentAsAdmin()

**Fichier** : `backend/src/modules/tournaments/tournaments.service.ts`

**Validations ajoutées** (après les validations existantes, avant le `prisma.tournament.create`) :

```typescript
// Phase 6.0.D - Validation des configurations incompatibles
// Résoudre les valeurs finales (DTO + defaults DB)
const finalDrawRuleMode = dto.drawRuleMode ?? DrawRuleMode.ALLOW_ALL;
const finalTieBreakPolicy = dto.tieBreakPolicy ?? TieBreakPolicy.NONE;
const finalRequiresDecisiveResult = dto.requiresDecisiveResult ?? false;

// Validation A : requiresDecisiveResult = true nécessite un tieBreakPolicy != NONE
if (finalRequiresDecisiveResult === true && finalTieBreakPolicy === TieBreakPolicy.NONE) {
  throw new BadRequestException(
    TOURNAMENT_VALIDATION_ERRORS.REQUIRES_DECISIVE_RESULT_WITHOUT_TIEBREAK,
  );
}

// Validation B : drawRuleMode = NO_DRAW nécessite un tieBreakPolicy != NONE
if (finalDrawRuleMode === DrawRuleMode.NO_DRAW && finalTieBreakPolicy === TieBreakPolicy.NONE) {
  throw new BadRequestException(
    TOURNAMENT_VALIDATION_ERRORS.NO_DRAW_WITHOUT_TIEBREAK,
  );
}
```

**Persistance des nouveaux champs** :

```typescript
const tournament = await this.prisma.tournament.create({
  data: {
    // ... champs existants ...
    // Phase 6.0.D - Règles avancées
    drawRuleMode: dto.drawRuleMode ?? DrawRuleMode.ALLOW_ALL,
    drawConfig: (dto.drawConfig as Prisma.InputJsonValue) ?? null,
    requiresDecisiveResult: dto.requiresDecisiveResult ?? false,
    tieBreakPolicy: dto.tieBreakPolicy ?? TieBreakPolicy.NONE,
    tieBreakTimeControl: dto.tieBreakTimeControl ?? null,
  },
});
```

**Rétrocompatibilité** : Tous les champs ont des defaults rétrocompatibles (ALLOW_ALL, NONE, false, null).

#### 3.2 updateTournamentAsAdmin()

**Validations ajoutées** (après la vérification des champs restreints, avant la préparation de `updateData`) :

```typescript
// Phase 6.0.D - Validation des configurations incompatibles (après merge)
// Construire l'état final après merge DTO + DB (respecter undefined vs null)
const finalDrawRuleMode = dto.drawRuleMode !== undefined ? dto.drawRuleMode : tournament.drawRuleMode;
const finalTieBreakPolicy = dto.tieBreakPolicy !== undefined ? dto.tieBreakPolicy : tournament.tieBreakPolicy;
const finalRequiresDecisiveResult = dto.requiresDecisiveResult !== undefined ? dto.requiresDecisiveResult : tournament.requiresDecisiveResult;

// Validation A : requiresDecisiveResult = true nécessite un tieBreakPolicy != NONE
if (finalRequiresDecisiveResult === true && finalTieBreakPolicy === TieBreakPolicy.NONE) {
  throw new BadRequestException(
    TOURNAMENT_VALIDATION_ERRORS.REQUIRES_DECISIVE_RESULT_WITHOUT_TIEBREAK,
  );
}

// Validation B : drawRuleMode = NO_DRAW nécessite un tieBreakPolicy != NONE
if (finalDrawRuleMode === DrawRuleMode.NO_DRAW && finalTieBreakPolicy === TieBreakPolicy.NONE) {
  throw new BadRequestException(
    TOURNAMENT_VALIDATION_ERRORS.NO_DRAW_WITHOUT_TIEBREAK,
  );
}
```

**Important** : Les validations sont effectuées **après merge** DTO + DB pour gérer les updates partiels. Si le DTO ne contient que `requiresDecisiveResult=true` mais que la DB a `tieBreakPolicy=NONE`, la validation doit rejeter.

**Persistance des nouveaux champs** :

```typescript
// Phase 6.0.D - Règles avancées
if (dto.drawRuleMode !== undefined) updateData.drawRuleMode = dto.drawRuleMode;
if (dto.drawConfig !== undefined) updateData.drawConfig = dto.drawConfig as Prisma.InputJsonValue;
if (dto.requiresDecisiveResult !== undefined) updateData.requiresDecisiveResult = dto.requiresDecisiveResult;
if (dto.tieBreakPolicy !== undefined) updateData.tieBreakPolicy = dto.tieBreakPolicy;
if (dto.tieBreakTimeControl !== undefined) updateData.tieBreakTimeControl = dto.tieBreakTimeControl;
```

---

## 🧪 Tests

### Fichier de tests

**Fichier** : `backend/src/modules/tournaments/tournaments.service.spec.ts`

### Tests CREATE

**4 tests** :

1. ✅ **Rejette `requiresDecisiveResult=true` avec `tieBreakPolicy=NONE`**
   - Vérifie que `BadRequestException` est levée
   - Vérifie le message d'erreur exact
   - Vérifie que `prisma.tournament.create` n'est pas appelé

2. ✅ **Rejette `drawRuleMode=NO_DRAW` avec `tieBreakPolicy=NONE`**
   - Même logique que le test 1

3. ✅ **Accepte `requiresDecisiveResult=true` avec `tieBreakPolicy=ARMAGEDDON`**
   - Vérifie que le tournoi est créé avec succès

4. ✅ **Accepte `drawRuleMode=NO_DRAW` avec `tieBreakPolicy=RAPID`**
   - Vérifie que le tournoi est créé avec succès

### Tests UPDATE

**4 tests** :

1. ✅ **Rejette update partiel : `requiresDecisiveResult=true` alors que DB `tieBreakPolicy=NONE`**
   - Simule un tournoi existant avec `tieBreakPolicy=NONE`
   - Envoie seulement `requiresDecisiveResult=true` dans le DTO
   - Vérifie que la validation après merge rejette

2. ✅ **Rejette update partiel : `drawRuleMode=NO_DRAW` alors que DB `tieBreakPolicy=NONE`**
   - Même logique que le test 1

3. ✅ **Accepte update partiel : `requiresDecisiveResult=true` avec `tieBreakPolicy=ARMAGEDDON`**
   - Vérifie que l'update partiel fonctionne si les deux champs sont envoyés

4. ✅ **Accepte update partiel : `drawRuleMode=NO_DRAW` avec `tieBreakPolicy=RAPID`**
   - Vérifie que l'update partiel fonctionne si les deux champs sont envoyés

### Résultats

**8/8 tests passent** ✅

```powershell
# Lancer les tests spécifiques
npm test -- tournaments.service.spec.ts

# Lancer tous les tests (vérification intégration)
npm test
```

---

## ⚠️ Points d'Attention

1. **Rétrocompatibilité** : Tous les nouveaux champs ont des defaults rétrocompatibles. Les tournois existants continuent de fonctionner.

2. **Validation après merge (UPDATE)** : Les validations dans `updateTournamentAsAdmin()` sont effectuées **après merge** DTO + DB pour gérer les updates partiels. Ne pas valider uniquement le DTO sinon on rate des cas edge.

3. **Typage `drawConfig`** : 
   - DTO : `Record<string, unknown>` avec `@IsObject()`
   - Service : Cast vers `Prisma.InputJsonValue` pour compatibilité Prisma
   - Évite le `any` silencieux tout en gardant la permissivité
   - **Comportement `@IsObject()`** : Rejette les tableaux (souhaitable pour 6.0.D), rejette les primitives, accepte uniquement les objets JSON

4. **Messages d'erreur** : Les messages sont extraits en constantes (`TOURNAMENT_VALIDATION_ERRORS`) pour garantir la stabilité des tests.

5. **Aucun impact sur les endpoints gameplay** : Cette phase ne modifie pas `MatchStateViewDto`, `PlayMoveDto`, ni les services `MatchesService` / `ChessEngineService`.

6. **Correction test `resignMatch`** : Un mock de `generateNextRoundIfNeeded()` a été ajouté dans les tests `resignMatch` pour éviter les erreurs internes masquées. Cela garantit que la base est solide avant la Phase 6.0.D.3 qui va renforcer `generateNextRoundIfNeeded()` avec la règle "return immédiat si tie-break pending".

---

## 📚 Références

- **[Phase 6.0.D - Cadrage d'Exécution](../cross/phase-06.0.D_cadrage-execution_cross.md)**  
  Document de référence avec les 6 décisions critiques figées et le découpage technique.

- **[Phase 6.0.D - Design Règles Avancées](./phase-06.0.D_advanced-rules-tiebreaks_backend.md)**  
  Design complet de la Phase 6.0.D avec les algorithmes de résolution et les cas limites.

- **[Phase 6.0.D.1 - Modélisation DB](../cross/phase-06.0.D_cadrage-execution_cross.md#21-phase-60d1--modélisation-db--enums)**  
  Phase précédente : création des enums et extension du schéma Prisma.

---

## 📊 Checklist de Complétion

- [x] Constantes de validation créées
- [x] DTOs étendus avec 5 nouveaux champs
- [x] Validations `class-validator` ajoutées
- [x] Validations métier dans `createTournamentAsAdmin()`
- [x] Validations métier dans `updateTournamentAsAdmin()` (après merge)
- [x] Nouveaux champs persistés dans create
- [x] Nouveaux champs persistés dans update
- [x] Tests unitaires CREATE (4 tests)
- [x] Tests unitaires UPDATE (4 tests)
- [x] Compilation TypeScript OK
- [x] Tests passent (8/8)
- [x] Tests intégrés au runner global (`npm test`)
- [x] Linter OK
- [x] Typage `drawConfig` propre (pas de `any`)
- [x] Correction test `resignMatch` (mock `generateNextRoundIfNeeded`)
- [x] Aucune erreur console dans les tests (56/56 tests passent)

---

**Statut final** : ✅ **100% complété**

