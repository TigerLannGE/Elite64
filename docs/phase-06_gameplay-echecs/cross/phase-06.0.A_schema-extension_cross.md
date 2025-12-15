# Phase 6.0.A — Extension du Schéma Prisma pour le Gameplay

**Date de création** : 14 décembre 2025  
**Date de documentation** : 15 décembre 2025  
**Statut** : ✅ Complété et appliqué  
**Migration** : `20251214165847_phase6_0a_add_match_gameplay_fields`

---

## 📋 Vue d'ensemble

La Phase 6.0.A constitue la **fondation Prisma** pour le système de gameplay d'échecs en temps réel. Cette phase ajoute tous les champs nécessaires à la table `Match` et crée le modèle `MatchMove` pour l'historique des coups.

**⚠️ Important** : Cette phase est **uniquement Prisma** (schéma + migration). Aucun code backend ou frontend n'est modifié.

---

## 🎯 Objectifs

1. ✅ Étendre le modèle `Match` avec les champs de gameplay
2. ✅ Créer le modèle `MatchMove` pour stocker l'historique des coups
3. ✅ Créer l'enum `MatchColor` (WHITE, BLACK)
4. ✅ Ajouter les index nécessaires pour les performances
5. ✅ Préserver la compatibilité avec la Phase 5 (aucun champ Phase 5 modifié)

---

## 🗂️ Modèle Match — Nouveaux Champs

### Champs de Position et État

| Champ | Type | Description | Valeur par défaut |
|-------|------|-------------|-------------------|
| `initialFen` | `String?` | Position initiale (FEN standard : `rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1`) | `null` |
| `currentFen` | `String?` | Position actuelle après chaque coup (format FEN) | `null` |

**Usage** :
- `initialFen` : Défini au début de la partie (après `readyAt`)
- `currentFen` : Mis à jour après chaque coup via `POST /matches/:id/move`

---

### Champs de Temps

| Champ | Type | Description | Valeur par défaut |
|-------|------|-------------|-------------------|
| `whiteTimeMsRemaining` | `Int?` | Temps restant pour les blancs (en millisecondes) | `null` |
| `blackTimeMsRemaining` | `Int?` | Temps restant pour les noirs (en millisecondes) | `null` |
| `lastMoveAt` | `DateTime?` | Timestamp du dernier coup joué | `null` |

**Usage** :
- Initialisés à `tournament.timeControl` converti en ms (ex: "10+0" → 600000 ms)
- Décrément calculé à chaque coup basé sur `lastMoveAt`
- Détection de timeout si `≤ 0`

---

### Champs de Session et No-Show

| Champ | Type | Description | Valeur par défaut |
|-------|------|-------------|-------------------|
| `readyAt` | `DateTime?` | Timestamp quand les deux joueurs ont rejoint la partie | `null` |
| `whiteJoinedAt` | `DateTime?` | Timestamp de connexion du joueur blanc | `null` |
| `blackJoinedAt` | `DateTime?` | Timestamp de connexion du joueur noir | `null` |
| `noShowResolvedAt` | `DateTime?` | Timestamp de résolution automatique d'un no-show | `null` |

**Usage** :
- `readyAt` : Défini quand `whiteJoinedAt` ET `blackJoinedAt` sont non-null
- No-show vérifié si pas de coup joué après `readyAt + JOIN_WINDOW_SECONDS + NO_SHOW_GRACE_SECONDS`
- `noShowResolvedAt` : Défini quand le no-show est résolu automatiquement

---

### Champs de Tie-Break

| Champ | Type | Description | Valeur par défaut |
|-------|------|-------------|-------------------|
| `parentMatchId` | `String?` | ID du match parent (si c'est un tie-break) | `null` |
| `isTieBreak` | `Boolean` | Indique si c'est un match de départage | `false` |
| `tieBreakIndex` | `Int` | Index du tie-break (1, 2, 3...) | `0` |
| `tieBreakType` | `String?` | Type de tie-break (ex: "rapid", "blitz", "bullet") | `null` |

**Usage** :
- Si deux joueurs sont ex-æquo, des tie-breaks peuvent être créés
- `parentMatchId` : Référence vers le match original
- Relation : `matches.parentMatchId → matches.id` (self-reference)

---

### Champs de Rating (ELO)

| Champ | Type | Description | Valeur par défaut |
|-------|------|-------------|-------------------|
| `isRated` | `Boolean` | Indique si le match affecte le rating ELO | `false` |
| `ratingDelta` | `Int?` | Variation de rating pour le vainqueur (ex: +25, -10) | `null` |

**Usage** :
- `isRated` : Défini selon la configuration du tournoi
- `ratingDelta` : Calculé après la fin du match si `isRated = true`
- Note : Les ratings individuels `whiteRatingBefore`, `blackRatingBefore`, etc. ne sont **pas** dans cette migration mais peuvent être ajoutés ultérieurement

---

## 🆕 Modèle MatchMove

Nouveau modèle créé pour stocker l'historique complet des coups d'un match.

### Schéma MatchMove

```prisma
model MatchMove {
  id                   String      @id @default(cuid())
  matchId              String
  moveNumber           Int         // 1, 2, 3... (incrémente à chaque coup)
  playerId             String      // ID du joueur qui a joué ce coup
  color                MatchColor  // WHITE ou BLACK
  san                  String      // Notation algébrique standard (ex: "Nf3", "e4", "O-O")
  from                 String      // Case de départ (ex: "e2")
  to                   String      // Case d'arrivée (ex: "e4")
  promotion            String?     // Pièce de promotion (ex: "q", "r", "b", "n")
  fenBefore            String      // FEN avant le coup
  fenAfter             String      // FEN après le coup
  whiteTimeMsRemaining Int?        // Temps restant des blancs après ce coup
  blackTimeMsRemaining Int?        // Temps restant des noirs après ce coup
  createdAt            DateTime    @default(now())
  
  // Relations
  match Match @relation(fields: [matchId], references: [id], onDelete: Cascade)
  
  @@unique([matchId, moveNumber])
  @@index([matchId])
  @@map("match_moves")
}
```

### Points clés

- **1 ligne par coup** : Chaque coup joué crée une ligne dans `match_moves`
- **Contrainte unique** : `(matchId, moveNumber)` garantit l'unicité
- **Cascade delete** : Si le match est supprimé, tous ses coups sont supprimés
- **Index** : `matchId` pour des requêtes rapides

**Utilité** :
- Historique complet de la partie
- Reconstruction de la partie coup par coup
- Analyse post-partie
- Détection de répétitions (threefold repetition)

---

## 🎨 Enum MatchColor

Nouvel enum créé pour représenter la couleur d'un joueur ou d'un coup.

```prisma
enum MatchColor {
  WHITE
  BLACK
}
```

**Usage** :
- Dans `MatchMove.color` : Indique qui a joué le coup
- Peut être utilisé dans d'autres contextes (ex: joueur actif, tour de jeu)

---

## 🔗 Relations et Index

### Relations ajoutées

1. **MatchMove → Match** : 
   - `MatchMove.matchId` → `Match.id`
   - Cascade delete (si match supprimé, tous les coups sont supprimés)

2. **Match → Match** (self-reference pour tie-breaks) :
   - `Match.parentMatchId` → `Match.id`
   - Set NULL on delete (si match parent supprimé, tie-break devient orphelin)

### Index créés

```sql
-- Index pour les coups (requêtes fréquentes)
CREATE INDEX "match_moves_matchId_idx" ON "match_moves"("matchId");

-- Index pour les tie-breaks
CREATE INDEX "matches_parentMatchId_idx" ON "matches"("parentMatchId");

-- Contrainte unique pour l'ordre des coups
CREATE UNIQUE INDEX "match_moves_matchId_moveNumber_key" ON "match_moves"("matchId", "moveNumber");
```

**Justification** :
- `match_moves.matchId` : Récupération rapide de tous les coups d'un match
- `matches.parentMatchId` : Récupération rapide des tie-breaks d'un match
- Contrainte unique : Garantit l'intégrité de l'ordre des coups

---

## 📝 Migration Prisma

### Fichier de migration

**Nom** : `20251214165847_phase6_0a_add_match_gameplay_fields`  
**Date** : 14 décembre 2025 16:58:47 UTC

### Commande d'application

```powershell
cd backend
npx prisma migrate deploy
```

### Vérification

```powershell
npx prisma migrate status
```

**Résultat attendu** : `Database schema is up to date!`

---

## ⚠️ Compatibilité avec Phase 5

### Garanties de compatibilité

✅ **Aucun champ Phase 5 modifié ou supprimé**  
✅ **Tous les nouveaux champs sont optionnels (`null`) ou ont des valeurs par défaut**  
✅ **Les matches Phase 5 existants continuent de fonctionner**  
✅ **Aucun changement dans la logique de brackets/standings/payouts**

### Champs Phase 5 préservés

Les champs suivants du modèle `Match` restent **inchangés** :

- `id`, `tournamentId`, `roundNumber`
- `whitePlayerId`, `blackPlayerId`
- `result`, `status`
- `startedAt`, `finishedAt`
- `createdAt`, `updatedAt`

---

## 🚀 Utilisation par les Phases Suivantes

### Phase 6.0.B (Moteur d'échecs backend)

Le moteur d'échecs (`ChessEngineService`) utilisera :
- `initialFen` pour initialiser la partie
- `currentFen` pour valider les coups
- Validation des coups via `chess.js`

### Phase 6.0.C (Backend Gameplay Orchestration)

Les endpoints HTTP utiliseront :
- `currentFen`, `whiteTimeMsRemaining`, `blackTimeMsRemaining` pour `MatchStateViewDto`
- `readyAt`, `whiteJoinedAt`, `blackJoinedAt` pour la logique de no-show
- `MatchMove` pour persister l'historique des coups

### Phases futures (Frontend Gameplay)

Le frontend gameplay utilisera :
- `currentFen` pour afficher l'échiquier
- `whiteTimeMsRemaining`, `blackTimeMsRemaining` pour les horloges
- `MatchMove` pour rejouer la partie

---

## 📊 Statistiques de la Migration

| Élément | Ajouté | Modifié | Supprimé |
|---------|--------|---------|----------|
| **Champs dans Match** | 13 | 0 | 0 |
| **Nouveaux modèles** | 1 (MatchMove) | 0 | 0 |
| **Nouveaux enums** | 1 (MatchColor) | 0 | 0 |
| **Index créés** | 3 | 0 | 0 |
| **Relations ajoutées** | 2 | 0 | 0 |

**Taille de la migration** : 59 lignes SQL

---

## ✅ Checklist de validation

- [x] Migration créée : `20251214165847_phase6_0a_add_match_gameplay_fields`
- [x] Migration appliquée avec succès sur la base de données
- [x] Enum `MatchColor` créé (WHITE, BLACK)
- [x] Modèle `MatchMove` créé avec tous les champs nécessaires
- [x] 13 nouveaux champs ajoutés à `Match`
- [x] Index créés pour les performances
- [x] Relations configurées correctement
- [x] Compatibilité Phase 5 préservée
- [x] Aucun champ obligatoire sans valeur par défaut
- [x] Documentation complète créée

---

## 🔄 Prochaines étapes

### Phase 6.0.B (Implémentée)

✅ **Moteur d'échecs backend** : Service `ChessEngineService` pour valider les coups et détecter les fins de partie.

**Voir** : [Phase 6.0.B - Moteur d'échecs backend](../backend/phase-06.0.B_chess-engine_backend.md)

### Phase 6.0.C (Implémentée)

✅ **Backend Gameplay Orchestration** : Endpoints HTTP pour jouer en temps réel (`/join`, `/state`, `/move`, `/resign`).

**Voir** : [Phase 6.0.C - Orchestration Gameplay](./phase-06.0.C_gameplay-orchestration_cross.md)

### Phases futures

🔜 **Frontend Gameplay** : Interface utilisateur pour jouer aux échecs (échiquier, horloges, liste des coups).

---

## 📚 Ressources

- [Documentation Prisma - Migrations](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Spécification FEN (Forsyth-Edwards Notation)](https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation)
- [Notation Algébrique Standard (SAN)](https://en.wikipedia.org/wiki/Algebraic_notation_(chess))

---

**Statut final** : ✅ **Phase 6.0.A complétée et documentée**

La fondation Prisma pour le gameplay d'échecs est en place et prête à être utilisée par les phases 6.0.B, 6.0.C et futures.

