# Phase 6.0.D - Cadrage d'Exécution - Documentation Transversale

**Date de création** : 01 janvier 2026  
**Dernière mise à jour** : 01 janvier 2026  
**Statut** : 📋 Cadrage (pré-implémentation)  
**Version** : 1.3 (nettoyage section 0.3 + comportement accès non autorisé getActivePlayableMatchId)  
**Dépendances** : Phase 5 (FIGÉE), Phase 6.0.A, 6.0.B, 6.0.C (FIGÉES)  
**Scope** : Backend uniquement (paramètres tournoi, logique tie-break)

---

## 📋 Vue d'ensemble

Ce document constitue la **BASE D'EXÉCUTION** de la Phase 6.0.D. Il définit précisément le périmètre fonctionnel, le découpage technique, les contraintes strictes et la stratégie de tests avant toute implémentation.

**Objectif** : Implémenter la Phase 6.0.D conformément au design existant (`phase-06.0.D_advanced-rules-tiebreaks_backend.md`), sans modifier les phases précédentes, ni introduire de nouvelles règles.

**Règle absolue** : Aucune implémentation ne doit commencer avant validation de ce cadrage.

---

## 0. Décisions d'Implémentation Figées (Critiques)

Cette section verrouille les décisions techniques critiques pour éviter toute divergence lors de l'implémentation.

### 0.1 DrawRuleMode : Sémantique et Portée

**Décision figée** :

`DrawRuleMode` ne modifie **que** le traitement des DRAW automatiques (stalemate, 50 moves, threefold) et/ou la permissivité du résultat final. Il **ne gouverne pas** l'offre de match nul par les joueurs, car cette fonctionnalité n'existe pas encore dans la Phase 6.0.D.

**Comportement actuel** :
- `ALLOW_ALL` : Les DRAW automatiques sont acceptés comme résultat final
- `NO_DRAW_OFFER` : **Aucun effet actuellement** (l'API "offer draw" n'existe pas). Les DRAW automatiques sont acceptés comme résultat final
- `NO_DRAW` : Aucun DRAW accepté. Les DRAW automatiques déclenchent un tie-break (si `tieBreakPolicy != NONE`)

**Justification** : Éviter un enum "marketing" qui ne produit aucun effet. La sémantique est explicite : `DrawRuleMode` gouverne uniquement la tolérance aux DRAW automatiques jusqu'à une phase future où "draw offer" existera.

---

### 0.2 Comportement Phase 5 : DRAW dans les Brackets

**Décision figée** :

En Phase 5 (baseline), un match nul (`DRAW`) fait **avancer les deux joueurs** dans le bracket. Cela peut créer un nombre impair de joueurs pour la ronde suivante, géré automatiquement par un match BYE.

**Référence** : [Phase 5 Baseline - Comportement DRAW](../phase-05_matches-et-brackets/cross/phase-05_baseline-reference_cross.md#33-comportement-des-résultats)

**Comportement Phase 6.0.D** :
- Si `tieBreakPolicy = NONE` et `requiresDecisiveResult = false` : **Comportement Phase 5 conservé** (les deux joueurs avancent)
- Si `tieBreakPolicy != NONE` : Le DRAW déclenche un tie-break, et une fois résolu, seul le vainqueur avance

**Justification** : Éviter d'introduire un second mécanisme concurrent. La Phase 6.0.D étend la Phase 5 sans la modifier.

---

### 0.3 Déclenchement Tie-Break : Idempotence et Atomicité

**Décision figée** :

Le tie-break est déclenché **après persistance du DRAW du match parent, puis création des tie-breaks après commit (post-transaction), avec idempotence via contrainte unique**. La méthode `createTieBreakMatches()` est **idempotente** via :
- Contrainte unique DB : `@@unique([parentMatchId, tieBreakIndex])` dans le schéma Prisma
- Gestion des conflits : Si erreur `P2002` (contrainte unique violée), récupérer les tie-breaks existants

**Points d'entrée** :
- `playMove()` : Après détection d'un DRAW automatique et mise à jour du match parent
- `reportResult()` : Après enregistrement d'un DRAW manuel et mise à jour du match parent

**Séquence figée (unique, non négociable)** :
1. **Transaction** : Persister le parent en DRAW + `resultReason = RESULT_REASON_TIEBREAK_PENDING`
2. **Commit** : Transaction commitée
3. **Post-transaction** : Appel de `createTieBreakMatches(parentMatchId)` (idempotent via contrainte unique)

**Justification** : 
- Éviter le double-déclenchement grâce à l'idempotence via contrainte unique
- Éviter les couplages complexes (verrous, ordre des writes, risques de deadlocks)
- L'Option B (contrainte unique + récupération sur P2002) est précisément pensée pour fonctionner en post-commit, y compris en cas de concurrence
- Séparation claire entre "fin du parent" et "création enfants" pour robustesse aux erreurs partielles

**⚠️ Pas d'alternative** : Cette séquence est la seule séquence valide. Toute modification (ex: création dans la même transaction) réintroduirait les risques de couplage et de deadlocks.

---

### 0.4 Modèle de Liaison Parent ↔ Tie-Break

**Décision figée** :

La liaison entre match parent et matchs tie-break utilise les champs suivants (déjà présents en Phase 6.0.A) :

- `parentMatchId` : `String?` (nullable, FK vers `Match.id`)
- `isTieBreak` : `Boolean` (défaut `false`)
- `tieBreakIndex` : `Int` (défaut `0`, 1..N pour les tie-breaks)
- `tieBreakType` : `String?` (nullable, type de tie-break)

**Contrainte d'unicité** :
```prisma
@@unique([parentMatchId, tieBreakIndex], name: "unique_tiebreak_per_parent")
```

**Relation Prisma** :
```prisma
parentMatch     Match?          @relation("MatchTieBreak", fields: [parentMatchId], references: [id])
tieBreakMatches Match[]         @relation("MatchTieBreak")
```

**Justification** : Rendre l'algorithme déterministe et simplifier les requêtes. La contrainte unique garantit l'unicité des tie-breaks par match parent et index.

---

### 0.5 Sémantique timeControlOverride

**Décision figée** :

- **Tous les matchs tie-break** ont `timeControlOverride = tournament.tieBreakTimeControl ?? tournament.timeControl`
- **Le match parent** ne change jamais de time control (utilise `tournament.timeControl`)
- **L'API `/matches/:id/state`** expose déjà le time control effectif via le champ `timeControl` du match (ou `timeControlOverride` si présent)

**Règle de calcul** :
```typescript
const effectiveTimeControl = match.timeControlOverride ?? tournament.timeControl;
```

**Justification** : Permettre des time controls différents pour les tie-breaks (ex: "3+2" pour tie-break vs "10+0" pour match principal) tout en conservant la traçabilité.

---

### 0.6 ARMAGEDDON : Règle Simplifiée

**Décision figée** :

ARMAGEDDON = match unique avec les règles suivantes :
- **Couleurs déterministes** : Inversion systématique par rapport au match parent (celui qui avait les blancs joue avec les noirs)
- **Time control** : `timeControlOverride = tournament.tieBreakTimeControl ?? tournament.timeControl` (pas d'asymétrie de temps)
- **Règle de résolution** : Si résultat en DRAW → `winner = BLACK side` → `winnerEntryId = entryId assigned to black`

**Exclusion explicite** :
- ❌ Pas d'asymétrie de temps (blanc plus de temps que noir)
- ❌ Pas de choix de couleur par les joueurs

**Justification** : Simplifier l'implémentation tout en conservant la règle essentielle (noir gagne si nul). L'asymétrie de temps peut être ajoutée dans une phase future si nécessaire.

---

## 1. Synthèse Fonctionnelle de la Phase 6.0.D

### 1.1 Ce que couvre EXACTEMENT la Phase 6.0.D

#### 1.1.1 Configuration des règles de match nul (Draw Rules)

- **Enum `DrawRuleMode`** : Trois modes configurables par tournoi
  - `ALLOW_ALL` : Tous les matchs nuls acceptés (comportement Phase 5 par défaut)
  - `NO_DRAW_OFFER` : **Aucun effet actuellement** (l'API "offer draw" n'existe pas). Les DRAW automatiques sont acceptés comme résultat final
  - `NO_DRAW` : Pas de match nul (tie-break obligatoire si DRAW automatique)

- **Champ `drawConfig`** : Configuration JSON optionnelle pour règles avancées (ex: `{"minMove": 30, "maxOffers": 1}`)
  - **Note** : Ce champ est défini dans le schéma mais **non implémenté** dans la Phase 6.0.D (réservé pour phases futures)

- **Champ `requiresDecisiveResult`** : Règle "hard" qui détermine si un match parent peut rester en DRAW final
  - `false` (défaut) : DRAW accepté comme résultat final (comportement Phase 5 si `tieBreakPolicy = NONE`)
  - `true` : Match doit avoir un vainqueur (pas de DRAW accepté sauf via tie-break)

#### 1.1.2 Configuration de la politique de tie-break

- **Enum `TieBreakPolicy`** : Six politiques configurables par tournoi
  - `NONE` : Pas de tie-break (DRAW autorisé seulement si `requiresDecisiveResult=false`)
  - `RAPID` : 1 match rapide (time control réduit)
  - `BLITZ` : 1 match blitz (time control très réduit)
  - `ARMAGEDDON` : 1 match armageddon (noir gagne si nul, couleurs inversées, pas d'asymétrie de temps)
  - `BEST_OF_3` : Meilleur de 3 matchs (premier à 2 victoires)
  - `BEST_OF_5` : Meilleur de 5 matchs (premier à 3 victoires)

- **Champ `tieBreakTimeControl`** : Time control spécifique pour les tie-breaks (optionnel, utilise `timeControl` si `null`)

#### 1.1.3 Création automatique de matchs tie-break

- **Déclenchement** : Automatique **après persistance du DRAW du match parent, puis création des tie-breaks après commit (post-transaction), avec idempotence via contrainte unique**
- **Point d'entrée** : `MatchesService.playMove()` ou `MatchesService.reportResult()` après mise à jour du match parent
- **Méthode** : `MatchesService.createTieBreakMatches(parentMatchId: string)` (idempotente)
- **Gestion de la concurrence** : Option B (contrainte unique + idempotence)

#### 1.1.4 Résolution automatique des tie-breaks

- **Méthode** : `MatchesService.resolveTieBreak(parentMatchId: string)`
- **Déclenchement** : Après chaque `playMove()` ou `reportResult()` sur un match tie-break
- **Algorithme** : Comptage des victoires par `entryId` (pas par couleur)
- **Règles spéciales** :
  - ARMAGEDDON : Noir gagne en cas de nul (couleurs inversées, pas d'asymétrie de temps)
  - BEST_OF_3/5 : Premier à N victoires (comptage par entryId)
  - RAPID/BLITZ : Vainqueur du match unique

#### 1.1.5 Intégration avec les brackets (Phase 5)

- **Modification** : `MatchesService.generateNextRoundIfNeeded()` pour ignorer les matchs tie-break et attendre leur résolution
- **Comportement** : Les matchs tie-break ne comptent pas pour la progression des brackets
- **Résolution** : Une fois le tie-break résolu, le match parent est mis à jour avec le résultat final (WIN/LOSS) et la progression continue
- **Compatibilité Phase 5** : Si `tieBreakPolicy = NONE` et `requiresDecisiveResult = false`, comportement Phase 5 conservé (les deux joueurs avancent en cas de DRAW)

#### 1.1.6 Validation des configurations incompatibles

- **Validation au niveau tournoi** : `TournamentsService.create()` et `update()`
- **Configurations rejetées** :
  1. `requiresDecisiveResult = true` avec `tieBreakPolicy = NONE`
  2. `drawRuleMode = NO_DRAW` avec `tieBreakPolicy = NONE`

### 1.2 Ce qui est EXCLUS de la Phase 6.0.D

#### 1.2.1 Fonctionnalités non implémentées

- **Offre de match nul par les joueurs** : L'endpoint `POST /matches/:id/offer-draw` n'est **pas** implémenté
  - Le champ `drawRuleMode` gouverne uniquement la tolérance aux DRAW automatiques (stalemate, 50 moves, threefold)
  - Les joueurs ne peuvent pas proposer un match nul via l'API (réservé pour phases futures)
  - **Conséquence** : `NO_DRAW_OFFER` n'a aucun effet actuellement (voir section 0.1)

- **Configuration JSON avancée (`drawConfig`)** : Le champ existe dans le schéma mais n'est **pas** utilisé
  - Règles comme `minMove`, `maxOffers` ne sont pas implémentées
  - Réservé pour phases futures

- **Gestion des litiges** : Aucun système de contestation ou d'arbitrage
  - Les résultats des tie-breaks sont déterministes et non contestables

- **Interface frontend** : Aucune modification frontend dans la Phase 6.0.D
  - Les tie-breaks sont jouables via les endpoints existants (`/matches/:id/join`, `/matches/:id/move`)
  - Aucune indication visuelle spéciale pour les matchs tie-break (réservé pour phases futures)

- **Asymétrie de temps ARMAGEDDON** : Pas d'implémentation d'asymétrie de temps (blanc plus de temps que noir)
  - ARMAGEDDON utilise le même time control pour les deux joueurs (voir section 0.6)

#### 1.2.2 Modifications interdites

- **Phase 5 (FIGÉE)** : Aucun champ Phase 5 modifié ou supprimé
  - Les tournois sans `tieBreakPolicy` (ou `NONE`) conservent le comportement Phase 5
  - Les tournois avec `drawRuleMode = ALLOW_ALL` (défaut) conservent le comportement Phase 5

- **Phase 6.0.B (FIGÉE)** : Le moteur d'échecs (`ChessEngineService`) n'est **pas** modifié
  - Aucune nouvelle règle d'échecs ajoutée
  - Aucune modification de la validation des coups

- **Phase 6.0.C (FIGÉE)** : Les endpoints existants ne sont **pas** modifiés
  - `POST /matches/:id/join` : Inchangé
  - `GET /matches/:id/state` : Inchangé
  - `POST /matches/:id/move` : Modifié uniquement pour déclencher les tie-breaks (intégration interne)
  - `POST /matches/:id/resign` : Inchangé

---

## 2. Découpage Technique en Sous-Phases Exécutables

### 2.1 Phase 6.0.D.1 — Modélisation DB & Enums

**Objectif** : Étendre le schéma Prisma avec les nouveaux enums et champs nécessaires pour les règles avancées et tie-breaks.

**Composants impactés** :
- `backend/prisma/schema.prisma`
- Migration Prisma : `20251216_phase6_0d_add_advanced_rules`

**Entrées** :
- Design document : `phase-06.0.D_advanced-rules-tiebreaks_backend.md` (sections 2.1, 2.2, 2.3, 2.4)
- **Décision figée 0.4** : Utiliser `parentMatchId`, `isTieBreak`, `tieBreakIndex` (déjà présents en Phase 6.0.A)

**⚠️ Note importante** : Ne pas re-ajouter les champs `parentMatchId`, `isTieBreak`, `tieBreakIndex`, `tieBreakType` s'ils sont déjà présents depuis la Phase 6.0.A. Uniquement :
- Vérifier leur conformité (types, defaults, index)
- Ajouter uniquement ce qui manque : `timeControlOverride` + contrainte unique + champs tournoi/enums

**Sorties attendues** :
- Enums `DrawRuleMode` et `TieBreakPolicy` créés dans PostgreSQL
- Champs `drawRuleMode`, `drawConfig`, `requiresDecisiveResult`, `tieBreakPolicy`, `tieBreakTimeControl` ajoutés au modèle `Tournament`
- Champ `timeControlOverride` ajouté au modèle `Match`
- **Contrainte unique** : `@@unique([parentMatchId, tieBreakIndex])` ajoutée au modèle `Match` (voir décision 0.3)
- Index créés pour les requêtes de recherche
- Migration Prisma appliquée avec succès
- `npx prisma generate` exécuté avec succès

**Critères de complétion** :
- ✅ Migration Prisma créée et appliquée
- ✅ Enums visibles dans PostgreSQL (`\dT+` dans psql)
- ✅ Types TypeScript générés dans `@prisma/client`
- ✅ Contrainte unique `unique_tiebreak_per_parent` créée dans PostgreSQL
- ✅ Aucune régression sur les données existantes (valeurs par défaut appliquées)
- ✅ Tests de migration sur base de données de test

**Durée estimée** : 2-3 heures

---

### 2.2 Phase 6.0.D.2 — Extension DTOs et Validation

**Objectif** : Étendre les DTOs de création/mise à jour de tournoi avec les nouveaux champs et ajouter les validations de configurations incompatibles.

**Composants impactés** :
- `backend/src/modules/tournaments/dto/create-tournament.dto.ts`
- `backend/src/modules/tournaments/dto/update-tournament.dto.ts`
- `backend/src/modules/tournaments/tournaments.service.ts`

**Entrées** :
- Design document : `phase-06.0.D_advanced-rules-tiebreaks_backend.md` (sections 3.1, 3.2, 4.4)

**Sorties attendues** :
- `CreateTournamentDto` étendu avec les 5 nouveaux champs (optionnels)
- `UpdateTournamentDto` étendu avec les 5 nouveaux champs (optionnels)
- Validations `class-validator` ajoutées (`@IsEnum`, `@IsBoolean`, `@IsString`, `@IsOptional`)
- Validation dans `TournamentsService.create()` pour rejeter les configurations incompatibles
- Validation dans `TournamentsService.update()` pour rejeter les configurations incompatibles (après merge DTO + DB)

**Critères de complétion** :
- ✅ DTOs compilent sans erreur
- ✅ Tests unitaires pour les validations de DTOs
- ✅ Tests unitaires pour les validations de configurations incompatibles dans `create()`
- ✅ Tests unitaires pour les validations de configurations incompatibles dans `update()` (cas edge : update partiel)
- ✅ Messages d'erreur explicites et en français

**Durée estimée** : 3-4 heures

---

### 2.3 Phase 6.0.D.3 — Création Automatique de Tie-Breaks

**Objectif** : Implémenter la création automatique de matchs tie-break lorsqu'un match se termine en DRAW.

**Composants impactés** :
- `backend/src/modules/matches/matches.service.ts`
  - Nouvelle méthode : `createTieBreakMatches(parentMatchId: string)`
  - Nouvelle méthode privée : `createSingleTieBreakMatch(...)`
  - Modification : `playMove()` pour déclencher la création **après persistance du DRAW du parent, puis création des tie-breaks après commit (post-transaction)**
  - Modification : `reportResult()` pour déclencher la création **après persistance du DRAW du parent, puis création des tie-breaks après commit (post-transaction)**

**Entrées** :
- Design document : `phase-06.0.D_advanced-rules-tiebreaks_backend.md` (sections 4.1, 4.2)
- **Décision figée 0.3** : Déclenchement après persistance, idempotence via contrainte unique
- **Décision figée 0.5** : `timeControlOverride = tournament.tieBreakTimeControl ?? tournament.timeControl`
- **Décision figée 0.6** : ARMAGEDDON avec inversion des couleurs, pas d'asymétrie de temps

**Sorties attendues** :
- Méthode `createTieBreakMatches()` implémentée avec gestion de la concurrence (Option B : contrainte unique + idempotence)
- Méthode `createSingleTieBreakMatch()` implémentée avec assignation déterministe des couleurs
- Intégration dans `playMove()` : appel automatique **après persistance du DRAW du parent, puis création des tie-breaks après commit (post-transaction)**
- Intégration dans `reportResult()` : appel automatique **après persistance du DRAW du parent, puis création des tie-breaks après commit (post-transaction)**
- Gestion des cas edge : match déjà tie-break, tie-breaks déjà créés (idempotence), politique NONE
- **Persistance de `timeControlOverride`** : Tous les matchs tie-break ont `timeControlOverride` défini

**Critères de complétion** :
- ✅ Tests unitaires pour chaque politique de tie-break (RAPID, BLITZ, ARMAGEDDON, BEST_OF_3, BEST_OF_5)
- ✅ Tests unitaires pour l'assignation déterministe des couleurs (alternance, ARMAGEDDON avec inversion)
- ✅ Tests de concurrence (race conditions) pour `createTieBreakMatches()` : idempotence vérifiée
- ✅ Tests d'intégration : création déclenchée depuis `playMove()` et `reportResult()` **après persistance**
- ✅ Validation : `timeControlOverride` persiste correctement selon la décision 0.5

**Durée estimée** : 6-8 heures

#### 2.3.1 Implémentation Anti-Friction : Parent Pending Decision

**Objectif produit** : Le joueur ne doit avoir qu'un seul endroit où continuer. L'UI doit pouvoir rester sur le même écran match et être redirigée automatiquement vers le tie-break actif.

**Décision B1 - Marquage explicite avec constante TypeScript** :

- **Constante** : `export const RESULT_REASON_TIEBREAK_PENDING = 'TIEBREAK_PENDING' as const;`
- **Fichier** : `backend/src/modules/matches/match.constants.ts` (nouveau fichier) ou dans `matches.service.ts`
- **Justification** : Éviter une migration Prisma supplémentaire. Le champ `resultReason` reste `String?` dans le schéma, compatible avec les valeurs legacy existantes.

**Où définir le marquage** :

1. **Dans `playMove()`** (après détection d'un DRAW automatique, ligne ~1127-1132) :
   ```typescript
   // Dans la transaction
   if (result === MatchResult.DRAW) {
     const tournament = await tx.tournament.findUnique({
       where: { id: match.tournamentId },
       select: { tieBreakPolicy: true, requiresDecisiveResult: true }
     });

     if (tournament.tieBreakPolicy !== TieBreakPolicy.NONE) {
       updateData.status = MatchStatus.FINISHED;
       updateData.result = MatchResult.DRAW;
       updateData.resultReason = RESULT_REASON_TIEBREAK_PENDING; // ⭐ Marquage explicite
       updateData.finishedAt = now;
     }
     // ... reste de la logique
   }
   
   // Après commit de la transaction
   if (wasMatchFinished && updatedMatch.result === MatchResult.DRAW && 
       updatedMatch.resultReason === RESULT_REASON_TIEBREAK_PENDING) {
     // Appel post-transaction (idempotent via contrainte unique)
     await this.createTieBreakMatches(matchId).catch(err => {
       console.error('[playMove] Erreur lors de la création des tie-breaks:', err);
     });
   }
   ```

2. **Dans `reportResult()`** (après enregistrement d'un DRAW manuel, ligne ~480-490) :
   ```typescript
   // Dans la transaction
   if (dto.result === MatchResult.DRAW) {
     const tournament = await this.prisma.tournament.findUnique({
       where: { id: match.tournamentId },
       select: { tieBreakPolicy: true, requiresDecisiveResult: true }
     });

     if (tournament.tieBreakPolicy !== TieBreakPolicy.NONE) {
       updateData.resultReason = RESULT_REASON_TIEBREAK_PENDING; // ⭐ Marquage explicite
     }
     // ... reste de la logique
   }
   
   // Après commit de la transaction
   if (updatedMatch.result === MatchResult.DRAW && 
       updatedMatch.resultReason === RESULT_REASON_TIEBREAK_PENDING) {
     // Appel post-transaction (idempotent via contrainte unique)
     await this.createTieBreakMatches(matchId).catch(err => {
       console.error('[reportResult] Erreur lors de la création des tie-breaks:', err);
     });
   }
   ```

**Décision B2 - Fonction de redirection sécurisée** :

**Fonction** : `getActivePlayableMatchId(matchId: string, playerId: string): Promise<string>`

**⚠️ Signature verrouillée** :
- Le paramètre `playerId` est **obligatoire** (non-optionnel) pour garantir la sécurité
- Le filtrage d'accès doit être fait **au moment du chargement** (ou, à défaut, avant de retourner l'ID redirigé)
- **Interdit** : Simplifier la fonction en retirant `playerId` ou en rendant la vérification optionnelle

**⚠️ Piège 1 - Sécurité/Autorisation** : La redirection doit vérifier que le joueur a le droit de voir/jouer ce tie-break (mêmes entryIds). Sinon, un joueur pourrait appeler `/matches/:parentId/state` d'un autre match et se faire rediriger vers un tie-break.

**⚠️ Comportement en cas d'accès non autorisé** :
- Si `playerId` n'est pas autorisé sur le parent → **throw `ForbiddenException`** (code: `PLAYER_NOT_IN_MATCH`)
- **Interdit** : Retourner `matchId` en cas d'accès non autorisé (évite la fuite d'information et les timings)
- **Justification** : Échec immédiat et cohérent, pas de continuation du flux avec une erreur différente

**⚠️ Piège 2 - Cas "tie-breaks créés mais tous FINISHED"** : Si tous les tie-breaks sont terminés mais le parent n'est pas encore mis à jour (fenêtre de course), forcer une relecture ou déclencher `resolveTieBreak()`.

**Implémentation corrigée** :

```typescript
/**
 * Retourne l'ID du match jouable actif à partir d'un matchId.
 * Si le match est un parent avec tie-break pending, retourne le tie-break actif (tieBreakIndex minimal non terminé).
 * Sinon, retourne le matchId original.
 * 
 * ⚠️ SÉCURITÉ : Vérifie que le joueur a le droit d'accéder au match (mêmes entryIds).
 * 
 * @param matchId - ID du match (parent ou tie-break)
 * @param playerId - ID du joueur (pour vérification d'autorisation)
 * @returns ID du match jouable actif
 */
private async getActivePlayableMatchId(
  matchId: string, 
  playerId: string
): Promise<string> {
  const match = await this.prisma.match.findUnique({
    where: { id: matchId },
    include: {
      tournament: {
        select: { tieBreakPolicy: true }
      },
      whiteEntry: {
        include: { player: { select: { id: true } } }
      },
      blackEntry: {
        include: { player: { select: { id: true } } }
      },
      tieBreakMatches: {
        where: {
          status: { not: MatchStatus.FINISHED }
        },
        orderBy: { tieBreakIndex: 'asc' },
        take: 1
      }
    }
  });

  if (!match) {
    throw new NotFoundException(`Match avec l'ID "${matchId}" introuvable`);
  }

  // ⚠️ PIÈGE 1 - Vérification d'autorisation
  const whitePlayerId = match.whiteEntry.playerId;
  const blackPlayerId = match.blackEntry.playerId;
  
  if (playerId !== whitePlayerId && playerId !== blackPlayerId) {
    // Le joueur n'a pas le droit d'accéder à ce match
    // ⚠️ DÉCISION : Throw ForbiddenException immédiatement (pas de retour de matchId)
    // Pourquoi : éviter la fuite d'information et les timings, échec immédiat et cohérent
    throw new ForbiddenException({
      code: 'PLAYER_NOT_IN_MATCH',
      message: 'Vous n\'êtes pas un participant de ce match'
    });
  }

  // Si c'est un tie-break, retourner directement
  if (match.isTieBreak) {
    return matchId;
  }

  // Si c'est un parent avec resultReason = "TIEBREAK_PENDING" et tie-break actif
  if (
    match.result === MatchResult.DRAW &&
    match.resultReason === RESULT_REASON_TIEBREAK_PENDING &&
    match.tournament.tieBreakPolicy !== TieBreakPolicy.NONE
  ) {
    // ⚠️ PIÈGE 2 - Cas où tous les tie-breaks sont terminés mais parent pas encore mis à jour
    if (match.tieBreakMatches.length === 0) {
      // Tous les tie-breaks sont terminés, mais parent pas encore mis à jour
      // Recharger le parent et, si encore DRAW, déclencher resolveTieBreak() (best effort)
      const updatedParent = await this.prisma.match.findUnique({
        where: { id: matchId }
      });
      
      if (updatedParent && updatedParent.result === MatchResult.DRAW) {
        // Parent toujours en DRAW : déclencher résolution (best effort, non bloquant)
        this.resolveTieBreak(matchId).catch(err => {
          console.error('[getActivePlayableMatchId] Erreur lors de la résolution du tie-break:', err);
        });
      }
      
      // Retourner le parent (même s'il est encore en DRAW, l'utilisateur verra l'état actuel)
      return matchId;
    }
    
    // Retourner le tie-break actif (tieBreakIndex minimal non terminé)
    const activeTieBreak = match.tieBreakMatches[0];
    
    // ⚠️ PIÈGE 1 - Vérification redondante (sécurité supplémentaire)
    // Les entryIds du tie-break doivent correspondre aux entryIds du parent
    // (théoriquement toujours vrai si le tie-break est bien créé, mais vérification de sécurité)
    const tieBreakWhitePlayerId = activeTieBreak.whiteEntry?.playerId;
    const tieBreakBlackPlayerId = activeTieBreak.blackEntry?.playerId;
    
    if (
      (tieBreakWhitePlayerId === whitePlayerId || tieBreakWhitePlayerId === blackPlayerId) &&
      (tieBreakBlackPlayerId === whitePlayerId || tieBreakBlackPlayerId === blackPlayerId)
    ) {
      return activeTieBreak.id;
    } else {
      // Cas théoriquement impossible mais sécurité : throw ForbiddenException
      throw new ForbiddenException({
        code: 'PLAYER_NOT_IN_MATCH',
        message: 'Vous n\'êtes pas un participant de ce match'
      });
    }
  }

  // Sinon, retourner le match original
  return matchId;
}
```

**Utilisation dans les endpoints existants** :

- `getMatchState(matchId, playerId)` : Utiliser `getActivePlayableMatchId(matchId, playerId)` avant de charger le match
  - ⚠️ **Signature verrouillée** : `playerId` obligatoire pour la sécurité
- `joinMatch(matchId, playerId)` : Utiliser `getActivePlayableMatchId(matchId, playerId)` avant de charger le match
  - ⚠️ **Signature verrouillée** : `playerId` obligatoire pour la sécurité
- `playMove(matchId, playerId, dto)` : Utiliser `getActivePlayableMatchId(matchId, playerId)` avant la transaction
  - ⚠️ **Signature verrouillée** : `playerId` obligatoire pour la sécurité

**Avantages** :
- ✅ Aucun changement d'API publique
- ✅ Redirection transparente pour le frontend
- ✅ Pas de friction utilisateur
- ✅ Sécurité : vérification d'autorisation intégrée
- ✅ Robustesse : gestion du cas "tie-breaks terminés mais parent pas mis à jour"

---

### 2.4 Phase 6.0.D.4 — Résolution Déterministe des Tie-Breaks

**Objectif** : Implémenter la résolution automatique des tie-breaks et la mise à jour du match parent.

**Composants impactés** :
- `backend/src/modules/matches/matches.service.ts`
  - Nouvelle méthode : `resolveTieBreak(parentMatchId: string)`
  - Nouvelle méthode privée : `findBestOfNWinner(...)`
  - Modification : `playMove()` pour appeler `resolveTieBreak()` après chaque coup sur un tie-break
  - Modification : `reportResult()` pour appeler `resolveTieBreak()` après chaque résultat sur un tie-break

**Entrées** :
- Design document : `phase-06.0.D_advanced-rules-tiebreaks_backend.md` (section 4.3)
- **Décision figée 0.6** : ARMAGEDDON simplifié (noir gagne si nul, pas d'asymétrie de temps)

**Sorties attendues** :
- Méthode `resolveTieBreak()` implémentée avec support de toutes les politiques
- Méthode `findBestOfNWinner()` implémentée avec comptage par entryId
- Règle ARMAGEDDON : noir gagne en cas de nul (couleurs inversées, pas d'asymétrie de temps)
- Mise à jour du match parent : `result` et `resultReason` mis à jour une fois le tie-break résolu
  - `result` : `WHITE_WIN` ou `BLACK_WIN` (selon le vainqueur du tie-break)
  - `resultReason` : `"TIE_BREAK_RAPID"`, `"TIE_BREAK_BLITZ"`, `"TIE_BREAK_ARMAGEDDON"`, `"TIE_BREAK_BEST_OF_3"`, `"TIE_BREAK_BEST_OF_5"` (selon la politique)
- Appel automatique de `generateNextRoundIfNeeded()` après résolution

**Critères de complétion** :
- ✅ Tests unitaires pour chaque politique de tie-break (RAPID, BLITZ, ARMAGEDDON, BEST_OF_3, BEST_OF_5)
- ✅ Tests unitaires pour le comptage par entryId dans BEST_OF_3/5 (cas edge : alternance des couleurs)
- ✅ Tests unitaires pour la règle ARMAGEDDON (noir gagne si nul, couleurs inversées)
- ✅ Tests d'intégration : résolution déclenchée depuis `playMove()` et `reportResult()`
- ✅ Tests d'intégration : `generateNextRoundIfNeeded()` appelé après résolution

**Durée estimée** : 6-8 heures

---

### 2.5 Phase 6.0.D.5 — Intégration avec Brackets et Validations Finales

**Objectif** : Intégrer les tie-breaks dans la progression des brackets et ajouter les validations finales pour les DRAW automatiques.

**Composants impactés** :
- `backend/src/modules/matches/matches.service.ts`
  - Modification : `generateNextRoundIfNeeded()` pour ignorer les matchs tie-break et attendre leur résolution
  - Modification : `playMove()` pour gérer `requiresDecisiveResult` et `drawRuleMode`

**Entrées** :
- Design document : `phase-06.0.D_advanced-rules-tiebreaks_backend.md` (sections 4.4, 4.5)
- **Décision figée 0.2** : Comportement Phase 5 conservé si `tieBreakPolicy = NONE` et `requiresDecisiveResult = false`

**Sorties attendues** :
- `generateNextRoundIfNeeded()` modifié pour :
  - Ignorer les matchs tie-break dans le comptage des matches terminés
  - **Décision B3 - Règle simple et robuste** : 
    - Calculer la ronde courante (parent matches only)
    - Si un parent est `DRAW + resultReason = "TIEBREAK_PENDING"` → `return` immédiatement (pas de progression)
    - Sinon, calculer winners (pas de relecture dans la boucle)
  - **Conserver le comportement Phase 5** : Si `tieBreakPolicy = NONE` et `requiresDecisiveResult = false`, les deux joueurs avancent en cas de DRAW
- `playMove()` modifié pour :
  - Gérer `requiresDecisiveResult = true` : déclencher tie-break ou erreur si DRAW automatique
  - Gérer `drawRuleMode = NO_DRAW` : déclencher tie-break si DRAW automatique

**Décision B3 - Simplification de `generateNextRoundIfNeeded()`** :

**Règle simple et robuste** (éviter la relecture dans la boucle) :

```typescript
async generateNextRoundIfNeeded(tournamentId: string): Promise<void> {
  // 1. Récupérer toutes les rounds existantes du tournoi, trouver la ronde max
  const allMatches = await this.prisma.match.findMany({
    where: { tournamentId },
    include: {
      tournament: {
        select: { tieBreakPolicy: true }
      },
      tieBreakMatches: {
        where: { status: { not: MatchStatus.FINISHED } }
      }
    },
    orderBy: { roundNumber: 'desc' },
  });

  if (allMatches.length === 0) {
    return;
  }

  const maxRoundNumber = allMatches[0].roundNumber;

  // 2. Filtrer les matchs tie-break (ils ne comptent pas pour la progression)
  const currentRoundMatches = allMatches.filter(
    (m) => m.roundNumber === maxRoundNumber && !m.isTieBreak
  );

  // 3. Vérifier si tous les matches de cette ronde sont FINISHED
  const allFinished = currentRoundMatches.every(
    (m) => m.status === MatchStatus.FINISHED,
  );

  if (!allFinished) {
    return; // Pas tous terminés, on attend
  }

  // 4. ⭐ DÉCISION B3 - Vérifier qu'aucun match DRAW n'a de tie-break pending
  // Règle simple : si un parent est DRAW + TIEBREAK_PENDING → return immédiatement
  for (const match of currentRoundMatches) {
    if (
      match.result === MatchResult.DRAW &&
      match.resultReason === RESULT_REASON_TIEBREAK_PENDING &&
      match.tournament.tieBreakPolicy !== TieBreakPolicy.NONE
    ) {
      const unfinishedTieBreaks = match.tieBreakMatches.filter(
        tb => tb.status !== MatchStatus.FINISHED
      );
      if (unfinishedTieBreaks.length > 0) {
        return; // ⭐ Attendre que les tie-breaks se terminent (pas de progression)
      }
    }
  }

  // 5. Construire la liste des winners de la ronde
  // ⭐ Pas de relecture dans la boucle : on utilise les données déjà chargées
  const winners: string[] = [];

  for (const match of currentRoundMatches) {
    if (match.result === MatchResult.WHITE_WIN) {
      winners.push(match.whiteEntryId);
    } else if (match.result === MatchResult.BLACK_WIN) {
      winners.push(match.blackEntryId);
    } else if (match.result === MatchResult.BYE) {
      winners.push(match.whiteEntryId);
    } else if (match.result === MatchResult.DRAW) {
      // Si DRAW avec tie-break pending, on a déjà vérifié plus haut → skip
      if (
        match.resultReason === RESULT_REASON_TIEBREAK_PENDING &&
        match.tournament.tieBreakPolicy !== TieBreakPolicy.NONE
      ) {
        // Ne pas ajouter de winner (déjà géré par le return plus haut)
        continue;
      }
      
      // DRAW sans tie-break : comportement Phase 5 (les deux avancent)
      winners.push(match.whiteEntryId);
      winners.push(match.blackEntryId);
    }
  }

  // 6. Si la liste des winners a plus d'un joueur: créer une nouvelle ronde
  // ... reste inchangé
}
```

**Avantages de cette approche** :
- ✅ Pas de relecture dans la boucle (évite les anti-patterns et la flakiness)
- ✅ Règle simple et robuste : vérification avant le calcul des winners
- ✅ Performance : une seule requête DB avec les includes nécessaires

**Critères de complétion** :
- ✅ Tests d'intégration : progression des brackets avec tie-breaks
- ✅ Tests d'intégration : cas où un DRAW a un tie-break en cours (attente) - **vérifier que generateNextRoundIfNeeded() return immédiatement**
- ✅ Tests d'intégration : cas où un DRAW a un tie-break résolu (progression) - **vérifier qu'aucune relecture n'est effectuée dans la boucle**
- ✅ Tests d'intégration : **comportement Phase 5 conservé** si `tieBreakPolicy = NONE` et `requiresDecisiveResult = false`
- ✅ Tests unitaires : gestion de `requiresDecisiveResult` dans `playMove()`
- ✅ Tests unitaires : gestion de `drawRuleMode` dans `playMove()`
- ✅ Tests unitaires : `getActivePlayableMatchId()` - **vérifier la sécurité (autorisation avec playerId obligatoire) et le cas "tie-breaks terminés"**
- ✅ Tests unitaires : **Signature verrouillée** - Vérifier que `playerId` est obligatoire et que le filtrage d'accès est fait au moment du chargement
- ✅ Tests unitaires : **Comportement accès non autorisé** - Vérifier que `getActivePlayableMatchId()` throw `ForbiddenException` (code: `PLAYER_NOT_IN_MATCH`) si `playerId` n'est pas autorisé (pas de retour de `matchId`)
- ✅ Validation : les payouts fonctionnent correctement après résolution de tie-breaks

**Durée estimée** : 4-6 heures

---

## 3. Tableau des Dépendances et Impacts

| Composant | Phase 5 | Phase 6.0.A | Phase 6.0.B | Phase 6.0.C | Impact Phase 6.0.D |
|-----------|---------|-------------|-------------|-------------|-------------------|
| **Schéma Prisma** | | | | | |
| `Tournament` | ✅ Aucun changement | ✅ Aucun changement | ✅ Aucun changement | ✅ Aucun changement | ➕ **5 nouveaux champs** (drawRuleMode, drawConfig, requiresDecisiveResult, tieBreakPolicy, tieBreakTimeControl) |
| `Match` | ✅ Aucun changement | ✅ **Champs tie-break présents** (parentMatchId, isTieBreak, tieBreakIndex) | ✅ Aucun changement | ✅ Aucun changement | ➕ **1 nouveau champ** (timeControlOverride) ➕ **Contrainte unique** (`@@unique([parentMatchId, tieBreakIndex])`) |
| **Services Backend** | | | | | |
| `TournamentsService` | ✅ Inchangé | ✅ Inchangé | ✅ Inchangé | ✅ Inchangé | 🔄 **Modifications** : Validation configurations incompatibles dans `create()` et `update()` |
| `MatchesService` | ✅ Inchangé | ✅ Inchangé | ✅ Inchangé | ✅ **Endpoints gameplay** | 🔄 **Modifications** : `playMove()`, `reportResult()`, `generateNextRoundIfNeeded()` ➕ **Nouvelles méthodes** : `createTieBreakMatches()`, `resolveTieBreak()`, `findBestOfNWinner()`, `createSingleTieBreakMatch()` |
| `ChessEngineService` | ❌ N'existe pas | ❌ N'existe pas | ✅ **Moteur d'échecs** | ✅ Inchangé | ✅ **Aucun changement** (FIGÉ) |
| **DTOs** | | | | | |
| `CreateTournamentDto` | ✅ Inchangé | ✅ Inchangé | ✅ Inchangé | ✅ Inchangé | ➕ **5 nouveaux champs optionnels** |
| `UpdateTournamentDto` | ✅ Inchangé | ✅ Inchangé | ✅ Inchangé | ✅ Inchangé | ➕ **5 nouveaux champs optionnels** |
| `MatchStateViewDto` | ❌ N'existe pas | ❌ N'existe pas | ❌ N'existe pas | ✅ **DTO canonique** | ✅ **Aucun changement** |
| `PlayMoveDto` | ❌ N'existe pas | ❌ N'existe pas | ❌ N'existe pas | ✅ **DTO gameplay** | ✅ **Aucun changement** |
| **Endpoints HTTP** | | | | | |
| `POST /matches/:id/join` | ❌ N'existe pas | ❌ N'existe pas | ❌ N'existe pas | ✅ **Endpoint gameplay** | ✅ **Aucun changement** |
| `GET /matches/:id/state` | ❌ N'existe pas | ❌ N'existe pas | ❌ N'existe pas | ✅ **Endpoint gameplay** | ✅ **Aucun changement** |
| `POST /matches/:id/move` | ❌ N'existe pas | ❌ N'existe pas | ❌ N'existe pas | ✅ **Endpoint gameplay** | 🔄 **Modification interne** : Déclenchement tie-breaks **après persistance** (pas de changement d'API) |
| `POST /matches/:id/resign` | ❌ N'existe pas | ❌ N'existe pas | ❌ N'existe pas | ✅ **Endpoint gameplay** | ✅ **Aucun changement** |
| `POST /admin/matches/:id/result` | ✅ **Endpoint admin** | ✅ Inchangé | ✅ Inchangé | ✅ Inchangé | 🔄 **Modification interne** : Déclenchement tie-breaks **après persistance** (pas de changement d'API) |

**Légende** :
- ✅ **Aucun changement** : Composant inchangé
- ➕ **Ajout** : Nouveaux champs/méthodes ajoutés
- 🔄 **Modification** : Modifications internes (logique) sans changement d'API
- ❌ **N'existe pas** : Composant n'existait pas dans cette phase

---

## 4. Contraintes Strictes à Respecter

### 4.1 Ne PAS modifier les phases précédentes

#### Phase 5 (FIGÉE)
- ❌ **Interdit** : Modifier ou supprimer un champ Phase 5
- ❌ **Interdit** : Changer le comportement des brackets existants
- ✅ **Autorisé** : Ajouter de nouveaux champs avec valeurs par défaut compatibles
- ✅ **Autorisé** : Conserver le comportement Phase 5 si `tieBreakPolicy = NONE` et `requiresDecisiveResult = false` (les deux joueurs avancent en cas de DRAW)

#### Phase 6.0.B (FIGÉE)
- ❌ **Interdit** : Modifier `ChessEngineService`
- ❌ **Interdit** : Ajouter de nouvelles règles d'échecs
- ❌ **Interdit** : Modifier la validation des coups
- ✅ **Autorisé** : Utiliser `ChessEngineService` tel quel

#### Phase 6.0.C (FIGÉE)
- ❌ **Interdit** : Modifier les signatures des endpoints HTTP
- ❌ **Interdit** : Modifier les DTOs `MatchStateViewDto` et `PlayMoveDto`
- ✅ **Autorisé** : Modifier la logique interne de `playMove()` et `reportResult()` pour déclencher les tie-breaks **après persistance du DRAW du parent, puis création des tie-breaks après commit (post-transaction)**

### 4.2 Ne PAS introduire de nouvelles règles

- ❌ **Interdit** : Ajouter de nouvelles politiques de tie-break non présentes dans le design
- ❌ **Interdit** : Ajouter de nouveaux modes de draw rules non présents dans le design
- ❌ **Interdit** : Implémenter des fonctionnalités non documentées dans le design (ex: offre de match nul par les joueurs)
- ❌ **Interdit** : Ajouter l'asymétrie de temps pour ARMAGEDDON (voir décision 0.6)

### 4.3 Déterminisme et traçabilité

- ✅ **Obligatoire** : Tous les calculs doivent être déterministes (même entrée = même sortie)
- ✅ **Obligatoire** : Pas de tirage aléatoire (skill game)
- ✅ **Obligatoire** : Assignation déterministe des couleurs dans les tie-breaks (voir décision 0.6)
- ✅ **Obligatoire** : Comptage des victoires par `entryId` (pas par couleur)
- ✅ **Obligatoire** : Tous les timestamps en UTC (générés côté serveur)
- ✅ **Obligatoire** : Historique complet dans `MatchMove` pour chaque match tie-break
- ✅ **Obligatoire** : Idempotence de `createTieBreakMatches()` via contrainte unique (voir décision 0.3)

### 4.4 Compatibilité rétroactive

- ✅ **Obligatoire** : Les tournois existants (Phase 5) conservent le comportement Phase 5
  - `drawRuleMode = ALLOW_ALL` (défaut)
  - `tieBreakPolicy = NONE` (défaut)
  - `requiresDecisiveResult = false` (défaut)
- ✅ **Obligatoire** : Les brackets existants continuent de fonctionner
- ✅ **Obligatoire** : Les migrations Prisma sont rétrocompatibles (valeurs par défaut)
- ✅ **Obligatoire** : Si `tieBreakPolicy = NONE` et `requiresDecisiveResult = false`, comportement Phase 5 conservé (les deux joueurs avancent en cas de DRAW)

---

## 5. Stratégie de Tests

### 5.1 Tests Unitaires

#### 5.1.1 Création de Tie-Breaks

**Fichier** : `backend/src/modules/matches/matches.service.spec.ts`

**Cas de test** :
- ✅ Marquage `resultReason = RESULT_REASON_TIEBREAK_PENDING` dans `playMove()` après DRAW automatique
- ✅ Marquage `resultReason = RESULT_REASON_TIEBREAK_PENDING` dans `reportResult()` après DRAW manuel
- ✅ Création d'un tie-break RAPID (1 match)
- ✅ Création d'un tie-break BLITZ (1 match)
- ✅ Création d'un tie-break ARMAGEDDON (1 match, **inversion des couleurs**, pas d'asymétrie de temps)
- ✅ Création d'un tie-break BEST_OF_3 (3 matchs, alternance des couleurs)
- ✅ Création d'un tie-break BEST_OF_5 (5 matchs, alternance des couleurs)
- ✅ Assignation déterministe des couleurs (alternance pair/impair pour BEST_OF_3/5)
- ✅ Assignation déterministe des couleurs (**inversion systématique** pour ARMAGEDDON)
- ✅ Persistance de `timeControlOverride` selon la décision 0.5 : `tournament.tieBreakTimeControl ?? tournament.timeControl`
- ✅ **Idempotence** : Si tie-breaks déjà créés (concurrence), retourner les tie-breaks existants
- ✅ Gestion de la concurrence : Test de race condition avec contrainte unique
- ✅ Erreur si match n'est pas en DRAW
- ✅ Erreur si match est déjà un tie-break
- ✅ Erreur si tie-breaks existent et ne sont pas tous terminés

#### 5.1.2 Fonction de Redirection Anti-Friction

**Fichier** : `backend/src/modules/matches/matches.service.spec.ts`

**Cas de test** :
- ✅ `getActivePlayableMatchId()` : Retourne `matchId` si match n'est pas un parent avec tie-break pending
- ✅ `getActivePlayableMatchId()` : Retourne `tieBreakId` si parent a `resultReason = RESULT_REASON_TIEBREAK_PENDING` et tie-break actif existe
- ✅ `getActivePlayableMatchId()` : **Sécurité** - Throw `ForbiddenException` (code: `PLAYER_NOT_IN_MATCH`) si joueur n'a pas le droit d'accéder au match (entryIds différents) - **playerId obligatoire, filtrage au moment du chargement**
- ✅ `getActivePlayableMatchId()` : **Cas edge** - Si tous les tie-breaks sont terminés mais parent pas encore mis à jour, déclencher `resolveTieBreak()` (best effort)
- ✅ `getActivePlayableMatchId()` : Retourne `matchId` si parent a tie-break pending mais tous les tie-breaks sont terminés et parent mis à jour

#### 5.1.3 Résolution de Tie-Breaks

**Fichier** : `backend/src/modules/matches/matches.service.spec.ts`

**Cas de test** :
- ✅ Résolution RAPID : vainqueur du match unique
- ✅ Résolution BLITZ : vainqueur du match unique
- ✅ Résolution ARMAGEDDON : **noir gagne en cas de nul** (couleurs inversées, pas d'asymétrie de temps)
- ✅ Résolution BEST_OF_3 : premier à 2 victoires (comptage par entryId)
- ✅ Résolution BEST_OF_5 : premier à 3 victoires (comptage par entryId)
- ✅ Comptage par entryId : cas où les couleurs alternent (BEST_OF_3/5)
- ✅ Mise à jour du match parent : `result` et `resultReason` mis à jour
- ✅ Appel de `generateNextRoundIfNeeded()` après résolution
- ✅ Pas de résolution si pas encore de vainqueur (BEST_OF_3/5 partiel)

#### 5.1.3 Validation des Configurations

**Fichier** : `backend/src/modules/tournaments/tournaments.service.spec.ts`

**Cas de test** :
- ✅ Rejet de `requiresDecisiveResult = true` avec `tieBreakPolicy = NONE` dans `create()`
- ✅ Rejet de `drawRuleMode = NO_DRAW` avec `tieBreakPolicy = NONE` dans `create()`
- ✅ Rejet de `requiresDecisiveResult = true` avec `tieBreakPolicy = NONE` dans `update()` (après merge)
- ✅ Rejet de `drawRuleMode = NO_DRAW` avec `tieBreakPolicy = NONE` dans `update()` (après merge)
- ✅ Cas edge : update partiel (un seul champ modifié) avec validation après merge

#### 5.1.4 Gestion des DRAW Automatiques

**Fichier** : `backend/src/modules/matches/matches.service.spec.ts`

**Cas de test** :
- ✅ Marquage `resultReason = RESULT_REASON_TIEBREAK_PENDING` avec constante TypeScript (pas d'enum Prisma)
- ✅ DRAW automatique (stalemate) avec `requiresDecisiveResult = true` : déclenchement tie-break **après persistance du DRAW du parent, puis création des tie-breaks après commit (post-transaction)**
- ✅ DRAW automatique (50 moves) avec `drawRuleMode = NO_DRAW` : déclenchement tie-break **après persistance du DRAW du parent, puis création des tie-breaks après commit (post-transaction)**
- ✅ DRAW automatique (threefold) avec `drawRuleMode = NO_DRAW` : déclenchement tie-break **après persistance du DRAW du parent, puis création des tie-breaks après commit (post-transaction)**
- ✅ DRAW automatique avec `requiresDecisiveResult = false` et `tieBreakPolicy = NONE` : DRAW accepté (Phase 5)
- ✅ DRAW automatique avec `requiresDecisiveResult = false` et `tieBreakPolicy != NONE` : tie-break créé **après persistance du DRAW du parent, puis création des tie-breaks après commit (post-transaction)**

### 5.2 Tests d'Intégration

#### 5.2.1 Intégration avec Brackets

**Fichier** : `backend/src/modules/matches/matches.service.integration.spec.ts`

**Cas de test** :
- ✅ Progression des brackets avec tie-break RAPID résolu
- ✅ Progression des brackets avec tie-break BEST_OF_3 résolu
- ✅ Attente de la résolution des tie-breaks avant génération de la ronde suivante
- ✅ **Décision B3** : `generateNextRoundIfNeeded()` return immédiatement si un DRAW a `resultReason = RESULT_REASON_TIEBREAK_PENDING` et tie-break en cours (pas de relecture dans la boucle)
- ✅ Cas où un DRAW a un tie-break en cours : pas de progression (vérifier que la fonction return avant le calcul des winners)
- ✅ Cas où un DRAW a un tie-break résolu : progression avec le vainqueur (vérifier qu'aucune relecture n'est effectuée)
- ✅ **Comportement Phase 5 conservé** : Si `tieBreakPolicy = NONE` et `requiresDecisiveResult = false`, les deux joueurs avancent en cas de DRAW
- ✅ Payouts fonctionnent correctement après résolution de tie-breaks

#### 5.2.2 Intégration avec Gameplay

**Fichier** : `backend/src/modules/matches/matches.service.integration.spec.ts`

**Cas de test** :
- ✅ Déclenchement tie-break depuis `playMove()` **après persistance du DRAW du parent, puis création des tie-breaks après commit (post-transaction)** du DRAW automatique
- ✅ Déclenchement tie-break depuis `reportResult()` **après persistance du DRAW du parent, puis création des tie-breaks après commit (post-transaction)** du DRAW manuel
- ✅ Résolution tie-break depuis `playMove()` sur un match tie-break
- ✅ Résolution tie-break depuis `reportResult()` sur un match tie-break
- ✅ Appel de `generateNextRoundIfNeeded()` après résolution
- ✅ **Redirection transparente** : `getMatchState(parentMatchId)` retourne l'état du tie-break actif (pas du parent)
- ✅ **Redirection transparente** : `playMove(parentMatchId, ...)` joue sur le tie-break actif (redirection transparente)
- ✅ **Sécurité** : Un joueur ne peut pas accéder à un tie-break d'un autre match via `getActivePlayableMatchId()` (vérification d'autorisation avec `playerId` obligatoire, throw `ForbiddenException` immédiatement en cas d'accès non autorisé)

### 5.3 Cas Limites

#### 5.3.1 Égalité Parfaite

**Scénario** : BEST_OF_3 avec 1-1 (match 3 en cours)
- ✅ Pas de résolution tant que le match 3 n'est pas terminé
- ✅ Résolution après le match 3 (vainqueur ou DRAW si `requiresDecisiveResult = false`)

#### 5.3.2 Multi Tie-Breaks

**Scénario** : Plusieurs matchs DRAW dans une même ronde avec tie-breaks
- ✅ Chaque match DRAW déclenche son propre tie-break **après persistance du DRAW du parent, puis création des tie-breaks après commit (post-transaction)**
- ✅ Progression attend la résolution de tous les tie-breaks
- ✅ Génération de la ronde suivante une fois tous les tie-breaks résolus

#### 5.3.3 Concurrence

**Scénario** : Deux appels concurrents à `createTieBreakMatches()` pour le même match
- ✅ **Idempotence** : un seul set de tie-breaks créé (contrainte unique)
- ✅ Pas d'erreur si tie-breaks déjà créés (Option B : récupération des tie-breaks existants)

### 5.4 Aucun Test E2E Requis

- ❌ **Pas de tests E2E** dans la Phase 6.0.D
- ✅ Les tests E2E seront ajoutés dans une phase ultérieure (Phase 6.3 ou similaire)

---

## 6. Checklist d'Implémentation

### 6.1 Préparation

- [ ] Lire et comprendre le design document : `phase-06.0.D_advanced-rules-tiebreaks_backend.md`
- [ ] **Valider ce document de cadrage** avec l'équipe (notamment les 6 décisions figées)
- [ ] Créer une branche Git : `feature/phase6-0d-tiebreaks`
- [ ] Vérifier que les phases précédentes sont bien taggées et figées

### 6.2 Phase 6.0.D.1 — Modélisation DB & Enums

- [ ] **Vérifier** que `parentMatchId`, `isTieBreak`, `tieBreakIndex`, `tieBreakType` sont présents et conformes (ne pas les re-ajouter)
- [ ] Ajouter les enums `DrawRuleMode` et `TieBreakPolicy` dans `schema.prisma`
- [ ] Ajouter les champs dans `Tournament` (5 nouveaux champs)
- [ ] Ajouter le champ `timeControlOverride` dans `Match`
- [ ] **Ajouter la contrainte unique** : `@@unique([parentMatchId, tieBreakIndex])` dans `Match` (décision 0.3)
- [ ] Créer la migration Prisma : `20251216_phase6_0d_add_advanced_rules`
- [ ] Ajouter les index nécessaires
- [ ] Appliquer la migration sur une base de données de test
- [ ] Vérifier `npx prisma generate` fonctionne
- [ ] Vérifier que les enums sont créés dans PostgreSQL
- [ ] Vérifier que la contrainte unique est créée dans PostgreSQL
- [ ] Vérifier la compatibilité avec les données existantes (valeurs par défaut)

### 6.3 Phase 6.0.D.2 — Extension DTOs et Validation

- [ ] Étendre `CreateTournamentDto` avec les 5 nouveaux champs
- [ ] Étendre `UpdateTournamentDto` avec les 5 nouveaux champs
- [ ] Ajouter les validations `class-validator`
- [ ] Implémenter la validation dans `TournamentsService.create()`
- [ ] Implémenter la validation dans `TournamentsService.update()` (après merge)
- [ ] Écrire les tests unitaires pour les validations
- [ ] Vérifier les messages d'erreur (explicites, en français)

### 6.4 Phase 6.0.D.3 — Création Automatique de Tie-Breaks

- [ ] **Créer la constante** : `export const RESULT_REASON_TIEBREAK_PENDING = 'TIEBREAK_PENDING' as const;` dans `match.constants.ts` ou `matches.service.ts`
- [ ] Implémenter `createTieBreakMatches(parentMatchId: string)` avec **idempotence** (décision 0.3)
- [ ] Implémenter `createSingleTieBreakMatch(...)`
- [ ] Gérer l'assignation déterministe des couleurs (décision 0.6 : ARMAGEDDON avec inversion)
- [ ] **Persister `timeControlOverride`** selon la décision 0.5 : `tournament.tieBreakTimeControl ?? tournament.timeControl`
- [ ] Intégrer dans `playMove()` : déclenchement **après persistance du DRAW du parent, puis création des tie-breaks après commit (post-transaction)** (décision 0.3)
  - [ ] Marquage `resultReason = RESULT_REASON_TIEBREAK_PENDING` après DRAW automatique (dans la transaction)
  - [ ] Appel de `createTieBreakMatches()` après commit de la transaction
- [ ] Intégrer dans `reportResult()` : déclenchement **après persistance du DRAW du parent, puis création des tie-breaks après commit (post-transaction)** (décision 0.3)
  - [ ] Marquage `resultReason = RESULT_REASON_TIEBREAK_PENDING` après DRAW manuel (dans la transaction)
  - [ ] Appel de `createTieBreakMatches()` après commit de la transaction
- [ ] Implémenter `getActivePlayableMatchId(matchId, playerId)` avec :
  - [ ] **Signature verrouillée** : `playerId` obligatoire (non-optionnel)
  - [ ] **Filtrage d'accès** : Vérification d'autorisation (mêmes entryIds) au moment du chargement
  - [ ] **Comportement accès non autorisé** : Throw `ForbiddenException` (code: `PLAYER_NOT_IN_MATCH`) si `playerId` n'est pas autorisé (pas de retour de `matchId`)
  - [ ] Gestion du cas "tie-breaks terminés mais parent pas mis à jour"
- [ ] Intégrer `getActivePlayableMatchId()` dans `getMatchState()`, `joinMatch()`, `playMove()`
- [ ] Écrire les tests unitaires pour chaque politique
- [ ] Écrire les tests unitaires pour `getActivePlayableMatchId()` (sécurité, cas edge)
- [ ] Écrire les tests de concurrence (race conditions) avec vérification de l'idempotence
- [ ] Écrire les tests d'intégration

### 6.5 Phase 6.0.D.4 — Résolution Déterministe des Tie-Breaks

- [ ] Implémenter `resolveTieBreak(parentMatchId: string)`
- [ ] Implémenter `findBestOfNWinner(...)` avec comptage par entryId
- [ ] Gérer la règle ARMAGEDDON selon la décision 0.6 (noir gagne si nul, couleurs inversées, pas d'asymétrie de temps)
- [ ] Mettre à jour le match parent après résolution
- [ ] Appeler `generateNextRoundIfNeeded()` après résolution
- [ ] Intégrer dans `playMove()` : appel après chaque coup sur tie-break
- [ ] Intégrer dans `reportResult()` : appel après chaque résultat sur tie-break
- [ ] Écrire les tests unitaires pour chaque politique
- [ ] Écrire les tests d'intégration

### 6.6 Phase 6.0.D.5 — Intégration avec Brackets et Validations Finales

- [ ] Modifier `generateNextRoundIfNeeded()` pour ignorer les matchs tie-break
- [ ] Modifier `generateNextRoundIfNeeded()` selon **Décision B3** :
  - [ ] Vérifier qu'aucun parent n'est `DRAW + resultReason = RESULT_REASON_TIEBREAK_PENDING` avec tie-break en cours
  - [ ] Return immédiatement si tie-break pending (avant le calcul des winners)
  - [ ] **Pas de relecture dans la boucle** : utiliser les données déjà chargées
- [ ] **Conserver le comportement Phase 5** : Si `tieBreakPolicy = NONE` et `requiresDecisiveResult = false`, les deux joueurs avancent en cas de DRAW (décision 0.2)
- [ ] Modifier `playMove()` pour gérer `requiresDecisiveResult`
- [ ] Modifier `playMove()` pour gérer `drawRuleMode`
- [ ] Écrire les tests d'intégration pour la progression des brackets (vérifier qu'aucune relecture n'est effectuée)
- [ ] Écrire les tests d'intégration pour les payouts
- [ ] Vérifier que les payouts fonctionnent correctement

### 6.7 Validation Finale

- [ ] Exécuter tous les tests unitaires (`npm test`)
- [ ] Exécuter tous les tests d'intégration
- [ ] Vérifier la compatibilité avec les tournois Phase 5 existants
- [ ] Vérifier qu'aucun champ Phase 5 n'a été modifié
- [ ] Vérifier que les migrations s'appliquent correctement
- [ ] Code review et validation
- [ ] Mettre à jour la documentation : `phase-06.0.D_advanced-rules-tiebreaks_backend.md` (statut : ✅ Complété)
- [ ] Mettre à jour `docs/README.md` avec le lien vers la documentation

---

## 7. Critères de Sortie de la Phase 6.0.D (Definition of Done)

### 7.1 Fonctionnel

- ✅ Tous les objectifs de la Phase 6.0.D sont implémentés
- ✅ Les configurations incompatibles sont rejetées avec des messages d'erreur explicites
- ✅ Les tie-breaks sont créés automatiquement **après persistance du DRAW du parent, puis création des tie-breaks après commit (post-transaction), avec idempotence via contrainte unique** lorsqu'un match se termine en DRAW
- ✅ Les tie-breaks sont résolus automatiquement selon la politique configurée
- ✅ Les brackets progressent correctement après résolution des tie-breaks
- ✅ **Comportement Phase 5 conservé** si `tieBreakPolicy = NONE` et `requiresDecisiveResult = false`
- ✅ Les payouts fonctionnent correctement après résolution des tie-breaks

### 7.2 Technique

- ✅ Migration Prisma appliquée avec succès
- ✅ **Contrainte unique `unique_tiebreak_per_parent` créée** (décision 0.3)
- ✅ Types TypeScript générés correctement
- ✅ Aucune régression sur les phases précédentes
- ✅ Code compilé sans erreur (`npm run build`)
- ✅ Tous les tests unitaires passent (`npm test`)
- ✅ Tous les tests d'intégration passent
- ✅ **Idempotence de `createTieBreakMatches()` vérifiée** (tests de concurrence)
- ✅ Code review validé

### 7.3 Qualité

- ✅ Code conforme aux standards du projet (ESLint, Prettier)
- ✅ Documentation à jour (design document marqué comme ✅ Complété)
- ✅ Messages d'erreur explicites et en français
- ✅ Logs appropriés pour le debugging
- ✅ Gestion d'erreurs robuste (try/catch, validation)

### 7.4 Compatibilité

- ✅ Compatibilité rétroactive : les tournois Phase 5 existants conservent le comportement Phase 5
- ✅ Aucun champ Phase 5 modifié ou supprimé
- ✅ Les endpoints existants continuent de fonctionner
- ✅ Les migrations sont rétrocompatibles (valeurs par défaut)
- ✅ **Comportement Phase 5 conservé** : Si `tieBreakPolicy = NONE` et `requiresDecisiveResult = false`, les deux joueurs avancent en cas de DRAW

### 7.5 Documentation

- ✅ Design document mis à jour : `phase-06.0.D_advanced-rules-tiebreaks_backend.md` (statut : ✅ Complété)
- ✅ Ce document de cadrage archivé (statut : ✅ Complété)
- ✅ `docs/README.md` mis à jour avec le lien vers la documentation
- ✅ Commentaires de code appropriés pour les méthodes complexes
- ✅ **Décisions figées documentées** (section 0)

---

## 8. Risques et Mitigations

### 8.1 Risques Identifiés

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| **Concurrence lors de la création de tie-breaks** | Moyenne | Élevé | **Option B (contrainte unique + idempotence)** recommandée (décision 0.3) |
| **Régression sur les brackets Phase 5** | Faible | Élevé | Tests d'intégration exhaustifs, valeurs par défaut compatibles, **comportement Phase 5 conservé** (décision 0.2) |
| **Complexité de la résolution BEST_OF_3/5** | Moyenne | Moyen | Tests unitaires dédiés pour le comptage par entryId |
| **Performance avec plusieurs tie-breaks simultanés** | Faible | Moyen | Index PostgreSQL, requêtes optimisées |
| **Double-déclenchement de tie-breaks** | Moyenne | Élevé | **Déclenchement après persistance du DRAW du parent, puis création des tie-breaks après commit (post-transaction) + idempotence via contrainte unique** (décision 0.3) |

### 8.2 Points d'Attention

- **Gestion de la concurrence** : Bien tester les race conditions lors de la création de tie-breaks (décision 0.3)
- **Comptage par entryId** : S'assurer que le comptage fonctionne correctement même si les couleurs alternent
- **Intégration avec brackets** : Vérifier que `generateNextRoundIfNeeded()` attend bien la résolution des tie-breaks
- **Compatibilité rétroactive** : Tester avec des tournois Phase 5 existants (décision 0.2)
- **Déclenchement après persistance** : S'assurer que les tie-breaks sont créés uniquement après persistance du DRAW du parent, puis création des tie-breaks après commit (post-transaction), avec idempotence via contrainte unique (décision 0.3)

---

## 9. Références

### Documentation Connexe

- **[Phase 6.0.D - Design Document](./backend/phase-06.0.D_advanced-rules-tiebreaks_backend.md)**  
  Design complet de la Phase 6.0.D (~1000+ lignes) : enums, schémas Prisma, algorithmes, cas limites.

- **[Phase 5 - Baseline Reference](../phase-05_matches-et-brackets/cross/phase-05_baseline-reference_cross.md)**  
  Référence complète de la Phase 5 (FIGÉE) : invariants, comportements, structure technique. **Comportement DRAW** : les deux joueurs avancent.

- **[Phase 6.0.C - Orchestration Gameplay](./phase-06.0.C_gameplay-orchestration_cross.md)**  
  Documentation de la Phase 6.0.C (FIGÉE) : endpoints HTTP, DTOs, gestion du temps, no-show.

- **[Phase 6.0.A - Extension Schéma Prisma](./phase-06.0.A_schema-extension_cross.md)**  
  Extension du schéma Prisma pour le gameplay : champs Match, modèle MatchMove, enum MatchColor. **Champs tie-break** : `parentMatchId`, `isTieBreak`, `tieBreakIndex` déjà présents.

---

## 10. Conclusion

Ce document constitue la **BASE D'EXÉCUTION** de la Phase 6.0.D. Il définit précisément :

1. ✅ **Décisions d'implémentation figées** : 6 points critiques verrouillés (section 0)
2. ✅ **Périmètre fonctionnel** : Ce qui est inclus et exclu
3. ✅ **Découpage technique** : 5 sous-phases exécutables avec critères de complétion
4. ✅ **Dépendances et impacts** : Tableau complet des modifications
5. ✅ **Contraintes strictes** : Règles à respecter impérativement
6. ✅ **Stratégie de tests** : Tests unitaires, intégration, cas limites
7. ✅ **Checklist d'implémentation** : Étapes détaillées
8. ✅ **Definition of Done** : Critères de sortie de la phase

**Règle finale** : Aucune implémentation ne doit commencer avant validation de ce cadrage, notamment les 6 décisions figées de la section 0.

---

**Statut** : 📋 **Cadrage validé avec décisions figées, prêt pour implémentation**

