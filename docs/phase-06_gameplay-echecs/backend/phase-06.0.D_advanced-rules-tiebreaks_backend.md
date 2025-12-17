# Phase 6.0.D — Règles Avancées et Tie-Breaks

**Date de création** : 16 décembre 2025  
**Statut** : 📋 Design (non implémenté)  
**Dépendances** : Phase 6.0.A, 6.0.B, 6.0.C  
**Scope** : Backend uniquement (paramètres tournoi, logique tie-break)

---

## 📋 Vue d'ensemble

La Phase 6.0.D ajoute la configuration des règles de match nul (draw rules) et la politique de tie-break au niveau du tournoi, ainsi que l'implémentation de l'algorithme de création automatique de matchs de départage.

**Objectifs** :
- ✅ Permettre la configuration des règles de match nul par tournoi
- ✅ Permettre la configuration de la politique de tie-break par tournoi
- ✅ Implémenter la création automatique de matchs tie-break en cas de DRAW
- ✅ Intégrer les tie-breaks dans la progression des brackets
- ✅ Préserver la compatibilité avec les phases gelées (Phase 5, 6.0.A-C)

---

## 🗂️ Schéma Prisma

### 2.1 Nouveaux Enums

**Fichier** : `backend/prisma/schema.prisma`

```prisma
enum DrawRuleMode {
  ALLOW_ALL      // Tous les matchs nuls acceptés (comportement Phase 5)
  NO_DRAW_OFFER  // Pas d'offre de match nul (seulement automatiques)
  NO_DRAW        // Pas de match nul (tie-break obligatoire)
}

enum TieBreakPolicy {
  NONE       // Pas de tie-break (DRAW autorisé seulement si requiresDecisiveResult=false)
  RAPID      // 1 match rapide (time control réduit)
  BLITZ      // 1 match blitz (time control très réduit)
  ARMAGEDDON // 1 match armageddon (noir gagne si nul)
  BEST_OF_3  // Meilleur de 3 matchs (premier à 2 victoires)
  BEST_OF_5  // Meilleur de 5 matchs (premier à 3 victoires)
}
```

**Comportement de `TieBreakPolicy.NONE`** :
- Si `requiresDecisiveResult = false` : Les matchs nuls (DRAW) sont acceptés et progression selon la règle Phase 5 existante (les deux joueurs avancent à la ronde suivante)
- Si `requiresDecisiveResult = true` : Les matchs nuls ne sont **pas** autorisés. Si un DRAW survient (automatique : stalemate, 50 moves, threefold), le système doit soit :
  - Bloquer le DRAW et forcer un tie-break (si `tieBreakPolicy !== NONE`)
  - Rejeter le match comme invalide (si `tieBreakPolicy === NONE`)

### 2.2 Extension du modèle `Tournament`

**Nouveaux champs** :

```prisma
model Tournament {
  // ... champs existants ...
  timeControl          String // "10+0", "3+0", "1+0" (existant)
  
  // Phase 6.0.D - Règles avancées
  drawRuleMode         DrawRuleMode    @default(ALLOW_ALL)
  drawConfig           Json?           // Règles riches optionnelles (minMove, maxOffers, etc.)
  requiresDecisiveResult Boolean       @default(false) // Match doit être décisif
  tieBreakPolicy       TieBreakPolicy  @default(NONE)
  tieBreakTimeControl  String?         // Time control pour les tie-breaks (ex: "3+2")
  
  // ... relations existantes ...
}
```

**Explication des champs** :
- `drawRuleMode` : Mode de gestion des matchs nuls (enum natif Prisma, non-nullable, défaut `ALLOW_ALL`)
- `drawConfig` : Configuration JSON optionnelle pour règles avancées (ex: `{"minMove": 30, "maxOffers": 1}`)
- `requiresDecisiveResult` : Si `true`, tous les matchs doivent avoir un vainqueur (pas de DRAW accepté sauf via tie-break)
- `tieBreakPolicy` : Politique de tie-break (enum natif Prisma, non-nullable, défaut `NONE`)
- `tieBreakTimeControl` : Time control spécifique pour les tie-breaks (si `null`, utilise `timeControl`)

**Interaction `requiresDecisiveResult` + `tieBreakPolicy`** :
- `requiresDecisiveResult = false` + `tieBreakPolicy = NONE` : Comportement Phase 5 (DRAW accepté, les deux avancent)
- `requiresDecisiveResult = false` + `tieBreakPolicy != NONE` : Le DRAW est autorisé comme résultat provisoire du match parent, mais un tie-break est créé automatiquement et le match parent est ensuite résolu en WIN/LOSS selon le résultat du tie-break
- `requiresDecisiveResult = true` + `tieBreakPolicy = NONE` : **Incompatible** - doit être rejeté à la création du tournoi
- `requiresDecisiveResult = true` + `tieBreakPolicy != NONE` : DRAW déclenche automatiquement un tie-break

**Interaction `drawRuleMode` + `tieBreakPolicy`** :
- `drawRuleMode = NO_DRAW` + `tieBreakPolicy = NONE` : **Incompatible** - aucun mécanisme de résolution si un DRAW automatique survient (stalemate, 50 moves, threefold). Doit être rejeté à la création du tournoi.

**Clarification du contrat entre `drawRuleMode`, `requiresDecisiveResult` et `tieBreakPolicy`** :

- **`requiresDecisiveResult`** : Règle "hard" qui détermine si un match parent peut rester en DRAW final. Si `true`, un match ne peut **jamais** se terminer en DRAW (sauf via tie-break qui résout le match parent).

- **`drawRuleMode`** : Gouverne uniquement l'UX/API d'offre de nulle et la tolérance "soft" si `requiresDecisiveResult = false`. 
  - `ALLOW_ALL` : Les joueurs peuvent proposer un match nul et les DRAW automatiques sont acceptés
  - `NO_DRAW_OFFER` : Les joueurs ne peuvent pas proposer un match nul, mais les DRAW automatiques (stalemate, 50 moves, threefold) sont acceptés
  - `NO_DRAW` : Aucun DRAW accepté. **Nécessite** `tieBreakPolicy != NONE` pour résoudre les DRAW automatiques (stalemate, 50 moves, threefold). Si `tieBreakPolicy = NONE`, la configuration est **incompatible** et doit être rejetée.

- **`tieBreakPolicy`** : Gouverne la méthode de départage lorsqu'un DRAW survient et qu'un tie-break est nécessaire.

### 2.3 Extension du modèle `Match`

**Pré-requis schéma Match** :

La Phase 6.0.D utilise les champs suivants du modèle `Match` qui doivent exister (déjà présents en Phase 6.0.A ou à ajouter) :
- `parentMatchId` : Référence vers le match parent (pour les tie-breaks)
- `isTieBreak` : Indicateur booléen
- `tieBreakIndex` : Index du match tie-break (1, 2, 3...)
- `tieBreakType` : Type de tie-break (string)
- Relation `tieBreakMatches` : Relation vers les matchs tie-break enfants

Ces champs sont déjà présents en Phase 6.0.A (voir [Phase 6.0.A - Extension Schéma Prisma](../cross/phase-06.0.A_schema-extension_cross.md)).

**Nouveaux champs** :

```prisma
model Match {
  // ... champs existants ...
  
  // Phase 6.0.D - Time control override pour tie-breaks
  timeControlOverride  String? // Time control réellement utilisé (pour tie-breaks)
  
  // ... autres champs Phase 6.0.A ...
  
  // Option B (gestion concurrence) : Contrainte d'unicité pour éviter les doublons
  // @@unique([parentMatchId, tieBreakIndex], name: "unique_tiebreak_per_parent")
}
```

**Explication** :
- `timeControlOverride` : Permet de persister le time control réellement utilisé dans un match tie-break (différent du `timeControl` du tournoi)
- **Contrainte d'unicité (optionnelle)** : Si l'Option B de gestion de la concurrence est choisie (voir section 4.2), ajouter la contrainte `@@unique([parentMatchId, tieBreakIndex])` pour garantir l'unicité des tie-breaks par match parent et index.

### 2.4 Migration Prisma

**Nom** : `20251216_phase6_0d_add_advanced_rules`

**Contenu SQL** :

```sql
-- Créer les nouveaux enums
CREATE TYPE "DrawRuleMode" AS ENUM ('ALLOW_ALL', 'NO_DRAW_OFFER', 'NO_DRAW');
CREATE TYPE "TieBreakPolicy" AS ENUM ('NONE', 'RAPID', 'BLITZ', 'ARMAGEDDON', 'BEST_OF_3', 'BEST_OF_5');

-- Ajouter les champs dans tournaments
ALTER TABLE "tournaments" 
  ADD COLUMN "drawRuleMode" "DrawRuleMode" NOT NULL DEFAULT 'ALLOW_ALL',
  ADD COLUMN "drawConfig" JSONB,
  ADD COLUMN "requiresDecisiveResult" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "tieBreakPolicy" "TieBreakPolicy" NOT NULL DEFAULT 'NONE',
  ADD COLUMN "tieBreakTimeControl" TEXT;

-- Ajouter le champ dans matches
ALTER TABLE "matches"
  ADD COLUMN "timeControlOverride" TEXT;

-- Index pour les requêtes de recherche
CREATE INDEX "tournaments_drawRuleMode_idx" ON "tournaments"("drawRuleMode");
CREATE INDEX "tournaments_tieBreakPolicy_idx" ON "tournaments"("tieBreakPolicy");
CREATE INDEX "tournaments_requiresDecisiveResult_idx" ON "tournaments"("requiresDecisiveResult");

-- Option B (gestion concurrence) : Contrainte d'unicité pour éviter les doublons de tie-breaks
-- 
-- Décision : Prisma comme source of truth (recommandé)
-- La contrainte @@unique([parentMatchId, tieBreakIndex]) dans le schéma Prisma est suffisante.
-- PostgreSQL autorise plusieurs NULL dans une contrainte UNIQUE, ce qui est acceptable ici
-- car les tie-breaks ont toujours parentMatchId non-null (seuls les matchs parents ont parentMatchId=null).
-- 
-- Alternative (plus stricte) : Index unique partiel SQL
-- Si vous préférez un index unique partiel SQL (WHERE parentMatchId IS NOT NULL), notez que :
-- - Prisma ne reflètera pas parfaitement cette contrainte dans le schéma (acceptable)
-- - La gestion idempotente repose sur l'erreur DB (P2002) lors de la création
-- Décommenter la ligne suivante si cette approche est choisie :
-- CREATE UNIQUE INDEX "unique_tiebreak_per_parent" ON "matches"("parentMatchId", "tieBreakIndex") WHERE "parentMatchId" IS NOT NULL;
```

**Compatibilité** :
- ✅ Les nouveaux champs n'introduisent aucune rupture : certains sont NOT NULL avec valeurs par défaut, les autres sont optionnels
- ✅ `drawRuleMode` et `tieBreakPolicy` sont non-nullables avec valeurs par défaut (`ALLOW_ALL` et `NONE`)
- ✅ `tieBreakTimeControl` est nullable (optionnel)
- ✅ `drawConfig` est nullable (optionnel)
- ✅ `requiresDecisiveResult` est non-nullable avec valeur par défaut (`false`)
- ✅ `timeControlOverride` (dans `Match`) est nullable (optionnel)
- ✅ Les tournois existants conservent le comportement Phase 5 (`ALLOW_ALL`, `NONE`)
- ✅ Aucun champ Phase 5 modifié ou supprimé

---

## 🔌 DTOs et Endpoints

### 3.1 Extension `CreateTournamentDto`

**Fichier** : `backend/src/modules/tournaments/dto/create-tournament.dto.ts`

**Nouveaux champs** :

```typescript
import { DrawRuleMode, TieBreakPolicy } from '@prisma/client';

export class CreateTournamentDto {
  // ... champs existants ...
  
  @IsOptional()
  @IsEnum(DrawRuleMode)
  drawRuleMode?: DrawRuleMode;
  
  @IsOptional()
  drawConfig?: Record<string, any>; // JSON validation optionnelle
  
  @IsOptional()
  @IsBoolean()
  requiresDecisiveResult?: boolean;
  
  @IsOptional()
  @IsEnum(TieBreakPolicy)
  tieBreakPolicy?: TieBreakPolicy;
  
  @IsOptional()
  @IsString()
  tieBreakTimeControl?: string; // "3+2", "10+5", etc.
}
```

**Note sur les valeurs par défaut** : Si le client n'envoie pas `drawRuleMode` ou `tieBreakPolicy`, la base de données appliquera automatiquement les valeurs par défaut (`ALLOW_ALL` pour `drawRuleMode` et `NONE` pour `tieBreakPolicy`) via les contraintes NOT NULL DEFAULT définies dans le schéma Prisma.

**Validation** : Ajouter des validations dans `TournamentsService.create()` et `update()` pour rejeter les configurations incompatibles :
1. `requiresDecisiveResult = true` avec `tieBreakPolicy = NONE` (pas de mécanisme de résolution)
2. `drawRuleMode = NO_DRAW` avec `tieBreakPolicy = NONE` (pas de mécanisme de résolution pour les DRAW automatiques)

**⚠️ Note importante pour `update()`** : En `update()`, le client peut n'envoyer qu'un seul champ (ex: `drawRuleMode=NO_DRAW`) sans envoyer `tieBreakPolicy`. Il faut donc valider sur la **configuration finale résolue** construite à partir des valeurs DB existantes + overrides du DTO. Sinon, on risque de laisser passer une config invalide (ou de bloquer à tort).

**Exemple** :
```typescript
// Dans TournamentsService.update()
const existingTournament = await this.prisma.tournament.findUnique({ where: { id } });
const nextDrawRuleMode = dto.drawRuleMode ?? existingTournament.drawRuleMode;
const nextTieBreakPolicy = dto.tieBreakPolicy ?? existingTournament.tieBreakPolicy;
const nextRequiresDecisiveResult = dto.requiresDecisiveResult ?? existingTournament.requiresDecisiveResult;

// Valider sur la configuration finale (après merge)
if (nextRequiresDecisiveResult === true && nextTieBreakPolicy === TieBreakPolicy.NONE) {
  throw new BadRequestException(...);
}
if (nextDrawRuleMode === DrawRuleMode.NO_DRAW && nextTieBreakPolicy === TieBreakPolicy.NONE) {
  throw new BadRequestException(...);
}
```

### 3.2 Extension `UpdateTournamentDto`

**Fichier** : `backend/src/modules/tournaments/dto/update-tournament.dto.ts`

**Nouveaux champs** : Identiques à `CreateTournamentDto` (tous optionnels)

**Validation** : Valider après merge DTO + DB (voir note ci-dessus).

### 3.3 DTOs existants (non modifiés)

- `ReportMatchResultDto` : Utilisé pour les matchs tie-break (pas de modification)
- `PlayMoveDto` : Pas de modification

---

## ⚙️ Algorithmes

### 4.1 Déclenchement du Tie-Break

**Point d'entrée** : `MatchesService.playMove()` ou `MatchesService.reportResult()`

**Conditions** :
1. Le match se termine avec `result = DRAW`
2. Le tournoi a `tieBreakPolicy !== NONE`
3. Le match n'est **pas** déjà un tie-break (`isTieBreak = false`)
4. Le match n'a **pas** déjà de tie-breaks en cours (tous `FINISHED` ou aucun créé)

**Action** : Appel de `MatchesService.createTieBreakMatches(matchId)`

### 4.2 Création des Matchs Tie-Break

**Méthode** : `MatchesService.createTieBreakMatches(parentMatchId: string): Promise<Match[]>`

**Algorithme corrigé** :

```typescript
async createTieBreakMatches(parentMatchId: string): Promise<Match[]> {
  // 1. Charger le match parent + tournoi
  const parentMatch = await this.prisma.match.findUnique({
    where: { id: parentMatchId },
    include: { 
      tournament: true,
      tieBreakMatches: true
    }
  });
  
  if (!parentMatch) {
    throw new NotFoundException('Parent match not found');
  }
  
  // 2. Vérifier les conditions
  if (parentMatch.result !== MatchResult.DRAW) {
    throw new BadRequestException('Tie-break only for DRAW matches');
  }
  
  if (parentMatch.isTieBreak) {
    throw new BadRequestException('Cannot create tie-break for tie-break match');
  }
  
  // Vérifier si des tie-breaks existent déjà et ne sont pas tous terminés
  const unfinishedTieBreaks = parentMatch.tieBreakMatches.filter(
    m => m.status !== MatchStatus.FINISHED
  );
  if (unfinishedTieBreaks.length > 0) {
    throw new BadRequestException('Tie-break matches already exist and are not finished');
  }
  
  const tournament = parentMatch.tournament;
  const tieBreakPolicy = tournament.tieBreakPolicy;
  
  if (!tieBreakPolicy || tieBreakPolicy === TieBreakPolicy.NONE) {
    // Comportement Phase 5 : progression selon la règle Phase 5 existante
    return [];
  }
  
  // 3. Déterminer le time control
  const timeControl = tournament.tieBreakTimeControl || tournament.timeControl;
  
  // 4. Créer les matchs selon la politique
  const matches: Match[] = [];
  
  switch (tieBreakPolicy) {
    case TieBreakPolicy.RAPID:
    case TieBreakPolicy.BLITZ:
    case TieBreakPolicy.ARMAGEDDON:
      // 1 match
      matches.push(await this.createSingleTieBreakMatch(
        parentMatch, tournament, tieBreakPolicy, timeControl, 1
      ));
      break;
      
    case TieBreakPolicy.BEST_OF_3:
      // 3 matchs (premier à 2 victoires)
      for (let i = 1; i <= 3; i++) {
        matches.push(await this.createSingleTieBreakMatch(
          parentMatch, tournament, tieBreakPolicy, timeControl, i
        ));
      }
      break;
      
    case TieBreakPolicy.BEST_OF_5:
      // 5 matchs (premier à 3 victoires)
      for (let i = 1; i <= 5; i++) {
        matches.push(await this.createSingleTieBreakMatch(
          parentMatch, tournament, tieBreakPolicy, timeControl, i
        ));
      }
      break;
  }
  
  return matches;
}

private async createSingleTieBreakMatch(
  parentMatch: Match,
  tournament: Tournament,
  tieBreakType: TieBreakPolicy,
  timeControl: string,
  index: number
): Promise<Match> {
  // Déterminer les couleurs de façon déterministe
  let whiteEntryId = parentMatch.whiteEntryId;
  let blackEntryId = parentMatch.blackEntryId;
  
  if (tieBreakType === TieBreakPolicy.BEST_OF_3 || 
      tieBreakType === TieBreakPolicy.BEST_OF_5) {
    // Alternance : match 1 = blanc original, match 2 = inversion, match 3 = blanc original, etc.
    if (index % 2 === 0) {
      // Match pair : inversion des couleurs
      [whiteEntryId, blackEntryId] = [blackEntryId, whiteEntryId];
    }
    // Match impair : couleurs originales (déjà assignées)
  } else if (tieBreakType === TieBreakPolicy.ARMAGEDDON) {
    // ARMAGEDDON : inversion systématique (noir = celui qui avait les blancs dans le match original)
    // Règle : noir gagne si nul, donc on inverse pour que celui qui avait les blancs joue avec les noirs
    [whiteEntryId, blackEntryId] = [blackEntryId, whiteEntryId];
  }
  // RAPID et BLITZ : couleurs originales (pas d'inversion)
  
  return await this.prisma.match.create({
    data: {
      tournamentId: tournament.id,
      roundNumber: parentMatch.roundNumber, // Même ronde
      boardNumber: parentMatch.boardNumber,  // Même board
      whiteEntryId,
      blackEntryId,
      status: MatchStatus.PENDING,
      parentMatchId: parentMatch.id,
      isTieBreak: true,
      tieBreakIndex: index,
      tieBreakType: tieBreakType,
      timeControlOverride: timeControl, // Persister le time control utilisé
    }
  });
}
```

**⚠️ Gestion de la concurrence et idempotence** :

En conditions réelles (polling + double appel API / retry réseau), deux exécutions concurrentes de `createTieBreakMatches()` peuvent se produire avant que la première n'ait commit ses créations. L'algorithme actuel vérifie les tie-breaks existants, mais cette vérification n'est pas atomique avec la création.

**Recommandation : implémenter l'une des deux approches suivantes** :

**Option A : Transaction Prisma avec verrou via SQL raw (pattern "check then create" atomique)**

⚠️ **Note** : Prisma ne supporte pas `SELECT FOR UPDATE` dans `findUnique()`. Il faut utiliser `$queryRaw` pour obtenir un verrou de ligne, ou préférer l'Option B (contrainte unique) qui offre un meilleur ratio effort/robustesse.

```typescript
import { Prisma } from '@prisma/client';

async createTieBreakMatches(parentMatchId: string): Promise<Match[]> {
  return await this.prisma.$transaction(async (tx) => {
    // 1. Charger le match parent avec verrou via SQL raw (SELECT FOR UPDATE)
    const parentMatchRaw = await tx.$queryRaw<Array<{
      id: string;
      tournamentId: string;
      whiteEntryId: string;
      blackEntryId: string;
      result: string;
      isTieBreak: boolean;
    }>>`
      SELECT id, "tournamentId", "whiteEntryId", "blackEntryId", result, "isTieBreak"
      FROM matches
      WHERE id = ${parentMatchId}
      FOR UPDATE
    `;
    
    if (parentMatchRaw.length === 0) {
      throw new NotFoundException('Parent match not found');
    }
    
    // 2. Charger les tie-breaks existants (tous, finished ou non, pour idempotence)
    const existingTieBreaks = await tx.match.findMany({
      where: { 
        parentMatchId,
        isTieBreak: true
      },
      orderBy: { tieBreakIndex: 'asc' }
    });
    
    // Si des tie-breaks existent déjà, retourner tous (idempotence)
    if (existingTieBreaks.length > 0) {
      return existingTieBreaks;
    }
    
    // 3. Charger le tournoi et valider
    const tournament = await tx.tournament.findUnique({
      where: { id: parentMatchRaw[0].tournamentId }
    });
    
    // ... validations existantes ...
    
    // 4. Créer les tie-breaks dans la même transaction
    const matches: Match[] = [];
    // ... logique de création ...
    
    return matches;
  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable // Selon version Prisma
  });
}
```

**Recommandation** : Si vous souhaitez éviter le SQL raw, l'**Option B (contrainte unique + idempotence)** est généralement préférable car plus simple à implémenter et offre une robustesse équivalente.

**Option B : Contrainte d'unicité DB + gestion idempotente des conflits**

**Décision : Prisma comme source of truth (recommandé)**

La contrainte `@@unique([parentMatchId, tieBreakIndex])` dans le schéma Prisma est suffisante. PostgreSQL autorise plusieurs NULL dans une contrainte UNIQUE, ce qui est acceptable ici car les tie-breaks ont toujours `parentMatchId` non-null (seuls les matchs parents ont `parentMatchId=null`).

**Alternative : Index unique partiel SQL (plus strict)**

Si vous préférez un index unique partiel SQL (`WHERE parentMatchId IS NOT NULL`), notez que :
- Prisma ne reflètera pas parfaitement cette contrainte dans le schéma (acceptable)
- La gestion idempotente repose sur l'erreur DB (P2002) lors de la création
- Voir la section Migration Prisma pour l'index SQL commenté

1. **Ajouter une contrainte d'unicité dans le schéma Prisma** :

```prisma
model Match {
  // ... champs existants ...
  
  @@unique([parentMatchId, tieBreakIndex], name: "unique_tiebreak_per_parent")
  @@map("matches")
}
```

2. **Gérer les conflits de manière idempotente** :

```typescript
async createTieBreakMatches(parentMatchId: string): Promise<Match[]> {
  try {
    // Tentative de création
    const matches = await this.createTieBreakMatchesInternal(parentMatchId);
    return matches;
  } catch (error) {
    // Si erreur de contrainte unique (tie-breaks déjà créés)
    if (error.code === 'P2002' && error.meta?.target?.includes('unique_tiebreak_per_parent')) {
      // Récupérer les tie-breaks existants (idempotence)
      const parentMatch = await this.prisma.match.findUnique({
        where: { id: parentMatchId },
        include: { tieBreakMatches: true }
      });
      return parentMatch?.tieBreakMatches || [];
    }
    throw error;
  }
}
```

**Recommandation** : L'**Option B (contrainte unique + idempotence)** est généralement préférable car plus simple à implémenter (pas de SQL raw) et offre une robustesse équivalente. L'Option A (transaction avec verrou via SQL raw) garantit l'atomicité complète mais nécessite du SQL raw.

### 4.3 Résolution des Tie-Breaks

**Méthode** : `MatchesService.resolveTieBreak(parentMatchId: string): Promise<void>`

**Déclenchement** : Après chaque `playMove()` ou `reportResult()` sur un match tie-break

**Algorithme corrigé** (comptage par entryId) :

```typescript
async resolveTieBreak(parentMatchId: string): Promise<void> {
  // 1. Charger le match parent + tous ses tie-breaks
  const parentMatch = await this.prisma.match.findUnique({
    where: { id: parentMatchId },
    include: {
      tournament: true,
      tieBreakMatches: {
        orderBy: { tieBreakIndex: 'asc' }
      },
      whiteEntry: true,
      blackEntry: true
    }
  });
  
  if (!parentMatch) {
    throw new NotFoundException('Parent match not found');
  }
  
  const tieBreakPolicy = parentMatch.tournament.tieBreakPolicy;
  const tieBreakMatches = parentMatch.tieBreakMatches.filter(
    m => m.status === MatchStatus.FINISHED && m.result !== null
  );
  
  if (tieBreakMatches.length === 0) {
    return; // Aucun tie-break terminé, attendre
  }
  
  // 2. Déterminer le vainqueur selon la politique
  let winnerEntryId: string | null = null;
  
  switch (tieBreakPolicy) {
    case TieBreakPolicy.RAPID:
    case TieBreakPolicy.BLITZ:
      // 1 match : le vainqueur gagne
      if (tieBreakMatches.length > 0) {
        const match = tieBreakMatches[0];
        if (match.result === MatchResult.WHITE_WIN) {
          winnerEntryId = match.whiteEntryId;
        } else if (match.result === MatchResult.BLACK_WIN) {
          winnerEntryId = match.blackEntryId;
        }
        // DRAW : pas de vainqueur (devrait être rare avec NO_DRAW)
      }
      break;
      
    case TieBreakPolicy.ARMAGEDDON:
      // 1 match : noir gagne si nul
      if (tieBreakMatches.length > 0) {
        const match = tieBreakMatches[0];
        if (match.result === MatchResult.WHITE_WIN) {
          winnerEntryId = match.whiteEntryId;
        } else if (match.result === MatchResult.BLACK_WIN) {
          winnerEntryId = match.blackEntryId;
        } else if (match.result === MatchResult.DRAW) {
          // Règle ARMAGEDDON : noir gagne en cas de nul
          winnerEntryId = match.blackEntryId;
        }
      }
      break;
      
    case TieBreakPolicy.BEST_OF_3:
      // Premier à 2 victoires (comptage par entryId)
      winnerEntryId = this.findBestOfNWinner(
        tieBreakMatches, 
        parentMatch.whiteEntryId,
        parentMatch.blackEntryId,
        2
      );
      break;
      
    case TieBreakPolicy.BEST_OF_5:
      // Premier à 3 victoires (comptage par entryId)
      winnerEntryId = this.findBestOfNWinner(
        tieBreakMatches,
        parentMatch.whiteEntryId,
        parentMatch.blackEntryId,
        3
      );
      break;
  }
  
  // 3. Si un vainqueur est déterminé, mettre à jour le match parent
  // Note : Le match parent est déjà en status=FINISHED (défini dans playMove())
  // On met seulement à jour result et resultReason pour refléter le résultat final du tie-break
  if (winnerEntryId) {
    await this.prisma.match.update({
      where: { id: parentMatchId },
      data: {
        result: winnerEntryId === parentMatch.whiteEntryId 
          ? MatchResult.WHITE_WIN 
          : MatchResult.BLACK_WIN,
        resultReason: `TIE_BREAK_${tieBreakPolicy}`,
        // finishedAt n'est pas modifié (déjà défini lors du DRAW initial)
      }
    });
    
    // 4. Appeler generateNextRoundIfNeeded() pour continuer le bracket
    await this.generateNextRoundIfNeeded(parentMatch.tournamentId);
  }
  // Sinon, attendre que plus de matchs tie-break se terminent
}

/**
 * Trouve le vainqueur d'un BEST_OF_N en comptant les victoires par entryId
 * @param matches Matchs tie-break terminés
 * @param whiteEntryId Entry ID du joueur blanc dans le match parent
 * @param blackEntryId Entry ID du joueur noir dans le match parent
 * @param requiredWins Nombre de victoires requises
 * @returns Entry ID du vainqueur, ou null si pas encore déterminé
 */
private findBestOfNWinner(
  matches: Match[],
  whiteEntryId: string,
  blackEntryId: string,
  requiredWins: number
): string | null {
  // Compter les victoires par entryId (pas par couleur)
  let whitePlayerWins = 0;
  let blackPlayerWins = 0;
  
  for (const match of matches) {
    if (match.result === MatchResult.WHITE_WIN) {
      // Le joueur qui avait les blancs dans ce match a gagné
      // Il faut identifier quel entryId c'était
      if (match.whiteEntryId === whiteEntryId) {
        whitePlayerWins++;
      } else if (match.whiteEntryId === blackEntryId) {
        blackPlayerWins++;
      }
    } else if (match.result === MatchResult.BLACK_WIN) {
      // Le joueur qui avait les noirs dans ce match a gagné
      if (match.blackEntryId === whiteEntryId) {
        whitePlayerWins++;
      } else if (match.blackEntryId === blackEntryId) {
        blackPlayerWins++;
      }
    }
    // DRAW : pas de victoire (devrait être rare avec NO_DRAW)
  }
  
  if (whitePlayerWins >= requiredWins) {
    return whiteEntryId;
  }
  if (blackPlayerWins >= requiredWins) {
    return blackEntryId;
  }
  
  return null; // Pas encore de vainqueur
}
```

### 4.4 Validation des Draw Rules

**Validation au niveau tournoi (create/update)** :

Dans `TournamentsService.create()` et `TournamentsService.update()`, ajouter des validations pour interdire les combinaisons incompatibles :

```typescript
// Dans TournamentsService.create()
// Pour create(), valider sur des valeurs résolues avec defaults DB
// (car si non envoyés, la DB appliquera NONE / ALLOW_ALL / false)
const nextDrawRuleMode = dto.drawRuleMode ?? DrawRuleMode.ALLOW_ALL;
const nextTieBreakPolicy = dto.tieBreakPolicy ?? TieBreakPolicy.NONE;
const nextRequiresDecisiveResult = dto.requiresDecisiveResult ?? false;

// Validation 1 : requiresDecisiveResult=true nécessite un tie-break
if (nextRequiresDecisiveResult === true && nextTieBreakPolicy === TieBreakPolicy.NONE) {
  throw new BadRequestException(
    'requiresDecisiveResult=true is incompatible with tieBreakPolicy=NONE. ' +
    'Either set requiresDecisiveResult=false or choose a tie-break policy (RAPID, BLITZ, ARMAGEDDON, BEST_OF_3, BEST_OF_5).'
  );
}

// Validation 2 : drawRuleMode=NO_DRAW nécessite un tie-break pour résoudre les DRAW automatiques
if (nextDrawRuleMode === DrawRuleMode.NO_DRAW && nextTieBreakPolicy === TieBreakPolicy.NONE) {
  throw new BadRequestException(
    'drawRuleMode=NO_DRAW is incompatible with tieBreakPolicy=NONE. ' +
    'If no draws are allowed, a tie-break policy must be specified to resolve automatic draws (stalemate, 50 moves, threefold repetition). ' +
    'Either set drawRuleMode=ALLOW_ALL or drawRuleMode=NO_DRAW_OFFER, or choose a tie-break policy (RAPID, BLITZ, ARMAGEDDON, BEST_OF_3, BEST_OF_5).'
  );
}

// Dans TournamentsService.update()
// Pour update(), valider après merge DTO + DB
const existingTournament = await this.prisma.tournament.findUnique({ 
  where: { id } 
});

const nextDrawRuleMode = dto.drawRuleMode ?? existingTournament.drawRuleMode;
const nextTieBreakPolicy = dto.tieBreakPolicy ?? existingTournament.tieBreakPolicy;
const nextRequiresDecisiveResult = dto.requiresDecisiveResult ?? existingTournament.requiresDecisiveResult;

// Validation 1 : requiresDecisiveResult=true nécessite un tie-break
if (nextRequiresDecisiveResult === true && nextTieBreakPolicy === TieBreakPolicy.NONE) {
  throw new BadRequestException(
    'requiresDecisiveResult=true is incompatible with tieBreakPolicy=NONE. ' +
    'Either set requiresDecisiveResult=false or choose a tie-break policy (RAPID, BLITZ, ARMAGEDDON, BEST_OF_3, BEST_OF_5).'
  );
}

// Validation 2 : drawRuleMode=NO_DRAW nécessite un tie-break pour résoudre les DRAW automatiques
if (nextDrawRuleMode === DrawRuleMode.NO_DRAW && nextTieBreakPolicy === TieBreakPolicy.NONE) {
  throw new BadRequestException(
    'drawRuleMode=NO_DRAW is incompatible with tieBreakPolicy=NONE. ' +
    'If no draws are allowed, a tie-break policy must be specified to resolve automatic draws (stalemate, 50 moves, threefold repetition). ' +
    'Either set drawRuleMode=ALLOW_ALL or drawRuleMode=NO_DRAW_OFFER, or choose a tie-break policy (RAPID, BLITZ, ARMAGEDDON, BEST_OF_3, BEST_OF_5).'
  );
}
```

**Gestion au moment du DRAW (dans `playMove()`)** :

Lorsque le moteur d'échecs déclare un DRAW (stalemate, 50 moves, threefold), dans `MatchesService.playMove()` :

**⚠️ État persistant du match parent** :

Lorsqu'un DRAW automatique survient et qu'un tie-break est nécessaire, le match parent **doit être marqué comme FINISHED** au moment où la partie est terminée par les règles d'échecs. Le tie-break déterminera ensuite le vainqueur final en mettant à jour `result` et `resultReason`.

**Règle** : `status = FINISHED` dès que la partie d'échecs est terminée (même si le résultat final sera déterminé par le tie-break). Cela évite les incohérences dans `generateNextRoundIfNeeded()` et dans l'UI.

**📝 Format de `resultReason`** :

Le champ `resultReason` accepte deux familles de valeurs pour éviter les divergences de format côté UI / logs / analytics :

1. **Raisons "chess-end"** (issues du moteur d'échecs) :
   - `CHECKMATE` : Échec et mat
   - `STALEMATE` : Pat
   - `INSUFFICIENT_MATERIAL` : Matériel insuffisant
   - `FIFTY_MOVE_RULE` : Règle des 50 coups
   - `THREE_FOLD_REPETITION` : Triple répétition
   - `TIMEOUT` : Temps écoulé
   - `RESIGNATION` : Résignation
   - `NO_SHOW` : Forfait (no-show)
   - `DOUBLE_NO_SHOW` : Double forfait

2. **Raisons "system"** (issues du système de tie-break) :
   - `TIE_BREAK_RAPID` : Résolu par tie-break rapide
   - `TIE_BREAK_BLITZ` : Résolu par tie-break blitz
   - `TIE_BREAK_ARMAGEDDON` : Résolu par tie-break armageddon
   - `TIE_BREAK_BEST_OF_3` : Résolu par tie-break meilleur de 3
   - `TIE_BREAK_BEST_OF_5` : Résolu par tie-break meilleur de 5

**Convention** : Les raisons "system" utilisent le préfixe `TIE_BREAK_` suivi du nom de la politique (en majuscules).

```typescript
// Dans playMove(), après détection d'un DRAW par ChessEngineService
if (
  gameEnd &&
  (
    gameEnd.reason === GameEndReason.STALEMATE ||
    gameEnd.reason === GameEndReason.FIFTY_MOVE_RULE ||
    gameEnd.reason === GameEndReason.THREE_FOLD_REPETITION
  )
) {
  
  const tournament = await this.prisma.tournament.findUnique({
    where: { id: match.tournamentId }
  });
  
  if (tournament.requiresDecisiveResult) {
    // Match doit être décisif : vérifier la politique de tie-break
    if (tournament.tieBreakPolicy === TieBreakPolicy.NONE) {
      // Incompatible : erreur
      throw new BadRequestException(
        'DRAW not allowed: tournament requires decisive results but has no tie-break policy. ' +
        'This should have been caught at tournament creation.'
      );
    } else {
      // 1. Marquer le match parent comme FINISHED avec DRAW provisoire
      await this.prisma.match.update({
        where: { id: match.id },
        data: {
          status: MatchStatus.FINISHED,
          result: MatchResult.DRAW,
          resultReason: gameEnd.reason, // STALEMATE, FIFTY_MOVE_RULE, ou THREE_FOLD_REPETITION
          finishedAt: new Date(), // UTC
        }
      });
      
      // 2. Créer automatiquement les matchs tie-break
      await this.createTieBreakMatches(match.id);
      
      // 3. Le match parent est FINISHED avec result=DRAW provisoire
      // resolveTieBreak() mettra à jour result et resultReason une fois le tie-break résolu
      return;
    }
  } else {
    // DRAW accepté : terminer le match normalement
    await this.prisma.match.update({
      where: { id: match.id },
      data: {
        status: MatchStatus.FINISHED,
        result: MatchResult.DRAW,
        resultReason: gameEnd.reason,
        finishedAt: new Date(), // UTC
      }
    });
    // ... logique existante pour terminer avec DRAW ...
  }
}
```

### 4.5 Intégration avec `generateNextRoundIfNeeded()`

**Modification** : `MatchesService.generateNextRoundIfNeeded()`

**Changement** : Ignorer les matchs tie-break et attendre la résolution des tie-breaks

```typescript
async generateNextRoundIfNeeded(tournamentId: string): Promise<void> {
  // 1. Récupérer toutes les rounds existantes du tournoi, trouver la ronde max
  const allMatches = await this.prisma.match.findMany({
    where: { tournamentId },
    include: {
      tieBreakMatches: {
        where: { status: { not: MatchStatus.FINISHED } }
      }
    },
    orderBy: { roundNumber: 'desc' },
  });

  if (allMatches.length === 0) {
    return; // Pas de matches, rien à faire
  }

  const maxRoundNumber = allMatches[0].roundNumber;

  // 2. Vérifier si tous les matches de cette ronde sont FINISHED
  const currentRoundMatches = allMatches.filter(
    (m) => m.roundNumber === maxRoundNumber
  );

  // Filtrer les matchs tie-break (ils ne comptent pas pour la progression)
  const regularMatches = currentRoundMatches.filter(m => !m.isTieBreak);

  const allFinished = regularMatches.every(
    (m) => m.status === MatchStatus.FINISHED,
  );

  if (!allFinished) {
    return; // Pas tous terminés, on attend
  }

  // 3. Vérifier qu'aucun match DRAW n'a de tie-break en cours
  for (const match of regularMatches) {
    if (match.result === MatchResult.DRAW) {
      const unfinishedTieBreaks = match.tieBreakMatches.filter(
        tb => tb.status !== MatchStatus.FINISHED
      );
      if (unfinishedTieBreaks.length > 0) {
        return; // Attendre que les tie-breaks se terminent
      }
    }
  }

  // 4. Construire la liste des winners de la ronde
  const winners: string[] = []; // Array de entryIds

  for (const match of regularMatches) {
    if (match.result === MatchResult.WHITE_WIN) {
      winners.push(match.whiteEntryId);
    } else if (match.result === MatchResult.BLACK_WIN) {
      winners.push(match.blackEntryId);
    } else if (match.result === MatchResult.BYE) {
      winners.push(match.whiteEntryId);
    } else if (match.result === MatchResult.DRAW) {
      // Si DRAW et tie-break terminé, le match parent a été mis à jour avec le résultat
      // Vérifier à nouveau le résultat du match parent
      const updatedMatch = await this.prisma.match.findUnique({
        where: { id: match.id }
      });
      if (updatedMatch && updatedMatch.result && updatedMatch.result !== MatchResult.DRAW) {
        // Le tie-break a déterminé un vainqueur
        if (updatedMatch.result === MatchResult.WHITE_WIN) {
          winners.push(updatedMatch.whiteEntryId);
        } else if (updatedMatch.result === MatchResult.BLACK_WIN) {
          winners.push(updatedMatch.blackEntryId);
        }
      } else {
        // Pas de tie-break ou tie-break pas encore résolu : progression selon la règle Phase 5 existante
        winners.push(match.whiteEntryId);
        winners.push(match.blackEntryId);
      }
    }
  }

  // 5. Si la liste des winners a plus d'un joueur: créer une nouvelle ronde
  if (winners.length > 1) {
    // ... logique existante de génération de ronde ...
  } else if (winners.length === 1) {
    // ... logique existante de finalisation ...
  }
}
```

---

## 🔒 Contraintes et Garanties

### 5.1 Déterminisme

- ✅ Tous les calculs sont déterministes (même entrée = même sortie)
- ✅ Pas de tirage aléatoire (skill game)
- ✅ Les couleurs dans les tie-breaks alternent de façon déterministe :
  - BEST_OF_3/5 : alternance pair/impair
  - ARMAGEDDON : inversion systématique
  - RAPID/BLITZ : couleurs originales
- ✅ Comptage des victoires par entryId (pas par couleur)

### 5.2 UTC et Audit Trail

- ✅ Tous les timestamps en UTC (générés côté serveur)
- ✅ Historique complet dans `MatchMove` pour chaque match tie-break
- ✅ Traçabilité via `parentMatchId` et `tieBreakIndex`
- ✅ `timeControlOverride` persiste le time control réellement utilisé

### 5.3 Backend Arbitre Unique

- ✅ `ChessEngineService` reste l'autorité unique pour la validation des coups
- ✅ Aucune logique de validation côté client
- ✅ Les tie-breaks utilisent le même moteur d'échecs

### 5.4 Compatibilité Phase 5

- ✅ Aucun champ Phase 5 modifié ou supprimé
- ✅ Les tournois sans `tieBreakPolicy` (ou `NONE`) conservent le comportement Phase 5
- ✅ Les tournois avec `drawRuleMode = ALLOW_ALL` (défaut) conservent le comportement Phase 5
- ✅ Les brackets existants continuent de fonctionner

### 5.5 Règle ARMAGEDDON

- ✅ **Règle déterministe** : Noir gagne en cas de nul
- ✅ **Assignation des couleurs** : Inversion systématique par rapport au match parent
  - Si le match parent avait Blanc vs Noir, le tie-break ARMAGEDDON aura Noir vs Blanc
  - Celui qui avait les blancs dans le match parent joue avec les noirs dans l'ARMAGEDDON
- ✅ **Justification** : Équité (alternance des couleurs) + règle standard (noir gagne si nul)

---

## 📝 Checklist Implémentation par PR/Commit

### Commit 1 : Extension Prisma Schema (Enums)

- [ ] Ajouter les enums `DrawRuleMode` et `TieBreakPolicy` dans `schema.prisma`
- [ ] Créer la migration Prisma `20251216_phase6_0d_add_advanced_rules`
- [ ] Vérifier que les enums sont créés correctement dans PostgreSQL
- [ ] Tester la migration sur une base de données de test
- [ ] Vérifier `npx prisma generate` fonctionne

### Commit 2 : Extension Prisma Schema (Champs Tournament)

- [ ] Ajouter les champs `drawRuleMode` (non-nullable, défaut `ALLOW_ALL`), `drawConfig`, `requiresDecisiveResult`, `tieBreakPolicy` (non-nullable, défaut `NONE`), `tieBreakTimeControl` dans `Tournament`
- [ ] Ajouter le champ `timeControlOverride` dans `Match`
- [ ] Mettre à jour la migration avec les nouveaux champs (NOT NULL pour les enums)
- [ ] Ajouter les index nécessaires
- [ ] Vérifier la compatibilité avec les données existantes (valeurs par défaut)

### Commit 3 : Types TypeScript

- [ ] Vérifier que `@prisma/client` génère les types pour les nouveaux enums
- [ ] Créer des types utilitaires si nécessaire (ex: `DrawConfig`, `TieBreakConfig`)
- [ ] Exporter les types dans un fichier `index.ts` si nécessaire

### Commit 4 : Extension DTOs

- [ ] Étendre `CreateTournamentDto` avec les nouveaux champs
- [ ] Étendre `UpdateTournamentDto` avec les nouveaux champs
- [ ] Ajouter les validations `class-validator` appropriées
- [ ] Ajouter la validation pour rejeter `requiresDecisiveResult = true` avec `tieBreakPolicy = NONE`
- [ ] Ajouter la validation pour rejeter `drawRuleMode = NO_DRAW` avec `tieBreakPolicy = NONE`
- [ ] Tester la validation des DTOs

### Commit 5 : Logique Tie-Break (Partie 1 - Création)

- [ ] Implémenter `MatchesService.createTieBreakMatches()`
- [ ] Implémenter `MatchesService.createSingleTieBreakMatch()`
- [ ] Gérer l'assignation déterministe des couleurs (alternance, ARMAGEDDON)
- [ ] Persister `timeControlOverride` dans les matchs tie-break
- [ ] Implémenter la gestion de la concurrence (Option A : transaction avec verrou, ou Option B : contrainte unique + idempotence)
- [ ] Si Option B choisie : ajouter la contrainte unique `@@unique([parentMatchId, tieBreakIndex])` dans le schéma Prisma
- [ ] Ajouter les tests unitaires pour la création de tie-breaks
- [ ] Ajouter les tests de concurrence (race conditions)

### Commit 6 : Logique Tie-Break (Partie 2 - Résolution)

- [ ] Implémenter `MatchesService.resolveTieBreak()`
- [ ] Implémenter `MatchesService.findBestOfNWinner()` avec comptage par entryId
- [ ] Gérer la règle ARMAGEDDON (noir gagne si nul)
- [ ] Intégrer `resolveTieBreak()` dans `playMove()` et `reportResult()`
- [ ] Ajouter les tests unitaires pour la résolution

### Commit 7 : Intégration avec Brackets

- [ ] Modifier `generateNextRoundIfNeeded()` pour ignorer les matchs tie-break
- [ ] Modifier `generateNextRoundIfNeeded()` pour attendre la résolution des tie-breaks
- [ ] Gérer le cas où un DRAW a un tie-break en cours
- [ ] Tester la progression des brackets avec tie-breaks
- [ ] Vérifier que les payouts fonctionnent correctement

### Commit 8 : Validation Draw Rules

- [ ] Ajouter la validation dans `TournamentsService.create()` et `update()` pour interdire `requiresDecisiveResult = true` avec `tieBreakPolicy = NONE`
- [ ] Ajouter la validation dans `TournamentsService.create()` et `update()` pour interdire `drawRuleMode = NO_DRAW` avec `tieBreakPolicy = NONE`
- [ ] Intégrer la gestion des DRAW automatiques dans `playMove()` : si `requiresDecisiveResult = true`, déclencher tie-break ou erreur
- [ ] Gérer les matchs nuls automatiques (stalemate, 50 moves, threefold)
- [ ] Ajouter les tests unitaires

### Commit 9 : Tests E2E

- [ ] Créer un script E2E pour tester un tie-break RAPID
- [ ] Créer un script E2E pour tester un tie-break BEST_OF_3
- [ ] Créer un script E2E pour tester un tie-break ARMAGEDDON
- [ ] Valider que les brackets progressent correctement après tie-break
- [ ] Valider le comptage par entryId dans BEST_OF_3/5

### Commit 10 : Documentation

- [ ] Créer `docs/phase-06_gameplay-echecs/backend/phase-06.0.D_advanced-rules-tiebreaks_backend.md`
- [ ] Documenter les nouveaux champs Prisma
- [ ] Documenter les nouveaux endpoints (si ajoutés)
- [ ] Documenter l'algorithme de tie-break
- [ ] Ajouter des exemples d'utilisation
- [ ] Mettre à jour `docs/README.md`

### Commit 11 : Validation Finale

- [ ] Exécuter tous les tests unitaires (`npm test`)
- [ ] Exécuter tous les tests E2E
- [ ] Vérifier la compatibilité avec les tournois Phase 5 existants
- [ ] Vérifier qu'aucun champ Phase 5 n'a été modifié
- [ ] Vérifier que les migrations s'appliquent correctement
- [ ] Code review et validation

---

## 📚 Références

### Documentation Connexe

- [Phase 6.0.A - Extension Schéma Prisma](../cross/phase-06.0.A_schema-extension_cross.md)
- [Phase 6.0.B - Moteur d'échecs backend](./phase-06.0.B_chess-engine_backend.md)
- [Phase 6.0.C - Orchestration Gameplay](../cross/phase-06.0.C_gameplay-orchestration_cross.md)
- [Phase 5 - Matches et Brackets](../../phase-05_matches-et-brackets/backend/phase-05_matches-brackets-standings_backend.md)

---

## 📄 Diff de Fichiers Attendus

### Fichiers Modifiés

1. **`backend/prisma/schema.prisma`**
   - Ajout des enums `DrawRuleMode` et `TieBreakPolicy`
   - Extension du modèle `Tournament` (5 nouveaux champs, dont 2 non-nullables)
   - Extension du modèle `Match` (1 nouveau champ)

2. **`backend/src/modules/tournaments/dto/create-tournament.dto.ts`**
   - Ajout des champs `drawRuleMode`, `drawConfig`, `requiresDecisiveResult`, `tieBreakPolicy`, `tieBreakTimeControl`

3. **`backend/src/modules/tournaments/dto/update-tournament.dto.ts`**
   - Ajout des mêmes champs (optionnels)

4. **`backend/src/modules/matches/matches.service.ts`**
   - Ajout de `createTieBreakMatches()`
   - Ajout de `createSingleTieBreakMatch()`
   - Ajout de `resolveTieBreak()`
   - Ajout de `findBestOfNWinner()`
   - Modification de `generateNextRoundIfNeeded()`
   - Modification de `playMove()` pour déclencher les tie-breaks et gérer `requiresDecisiveResult`
   - Modification de `reportResult()` pour déclencher les tie-breaks

5. **`backend/src/modules/tournaments/tournaments.service.ts`**
   - Ajout de la validation `requiresDecisiveResult = true` + `tieBreakPolicy = NONE` dans `create()` et `update()`

6. **`backend/src/modules/matches/matches.controller.ts`** (si nécessaire)
   - Aucune modification attendue (les endpoints existants suffisent)

7. **`backend/src/modules/matches/matches.admin.controller.ts`** (si nécessaire)
   - Aucune modification attendue (les endpoints existants suffisent)

### Fichiers Créés

1. **`backend/prisma/migrations/20251216_phase6_0d_add_advanced_rules/migration.sql`**
   - Migration Prisma pour les nouveaux enums et champs

2. **`docs/phase-06_gameplay-echecs/backend/phase-06.0.D_advanced-rules-tiebreaks_backend.md`**
   - Documentation complète de la Phase 6.0.D

3. **`backend/src/modules/matches/chess-engine.service.spec.ts`** (si tests ajoutés)
   - Tests unitaires pour les nouvelles méthodes

4. **`frontend/scripts/e2e-tiebreaks.ts`** (optionnel, pour tests E2E)
   - Scripts E2E pour valider les tie-breaks

### Fichiers Non Modifiés (Garanties)

- ✅ Aucun fichier Phase 5 modifié
- ✅ Aucun fichier Phase 6.0.A/B/C modifié (sauf intégration dans `matches.service.ts`)
- ✅ Les endpoints existants continuent de fonctionner

---

**Statut** : 📋 **Design complet et corrigé, prêt pour implémentation**

