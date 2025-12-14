# Matches et Résultats de Tournoi - Documentation Complète

Ce document décrit l'implémentation complète du module `Matches` pour la plateforme ChessBet, permettant la gestion des matches de tournoi, l'enregistrement des résultats, la génération automatique des rondes suivantes, et la distribution des gains.

**Date de création** : Décembre 2025  
**Statut** : ✅ Complété (Phase 5)  
**Dernière mise à jour** : Décembre 2025 (correction ParseUUIDPipe → CUID)

---

## 📋 Vue d'ensemble

Cette implémentation permet de :
- ✅ Générer automatiquement les matches du premier tour pour un tournoi READY
- ✅ Enregistrer les résultats des matches (admin-only)
- ✅ Générer automatiquement les rondes suivantes quand tous les matches d'une ronde sont terminés
- ✅ Finaliser automatiquement le tournoi et distribuer les gains quand il ne reste qu'un vainqueur
- ✅ Calculer les classements basés sur les résultats des matches
- ✅ Exposer des endpoints pour afficher les matches et classements
- ✅ Respecter le modèle skill game (aucun hasard, gains = performance)

---

## 🏗️ Architecture

### Structure des modules

```
backend/src/
├── modules/
│   ├── matches/
│   │   ├── matches.module.ts              # Module Matches
│   │   ├── matches.service.ts             # Service avec logique métier
│   │   ├── matches.controller.ts          # Controller (endpoints joueurs/publics)
│   │   ├── matches.admin.controller.ts    # Controller (endpoints admin)
│   │   └── dto/
│   │       └── report-match-result.dto.ts # DTO pour enregistrer les résultats
│   └── tournaments/
│       └── tournaments.service.ts          # Service étendu avec finalisation
└── app.module.ts                          # Modules intégrés
```

---

## 🎯 TÂCHE 0 – Modèle Prisma

### Enums ajoutés

#### Enum `MatchStatus`

```prisma
enum MatchStatus {
  PENDING    // Match créé mais pas encore démarré
  RUNNING    // Match en cours
  FINISHED   // Match terminé
  CANCELED   // Match annulé
}
```

#### Enum `MatchResult` (modifié)

```prisma
enum MatchResult {
  WHITE_WIN
  BLACK_WIN
  DRAW
  BYE        // Victoire automatique (par ex. bye en bracket)
}
```

**Note** : Les valeurs `CANCELLED` et `PENDING` ont été supprimées de l'enum `MatchResult` car :
- `CANCELLED` est géré par `MatchStatus.CANCELED`
- `PENDING` n'est plus un résultat valide (un match non terminé n'a pas de résultat)

### Modèle `Match`

```prisma
model Match {
  id             String       @id @default(cuid())

  tournamentId   String
  roundNumber    Int          // 1 = premier tour, etc.
  boardNumber    Int          // Numéro de table dans la ronde

  whiteEntryId   String
  blackEntryId   String

  status         MatchStatus  @default(PENDING)
  result         MatchResult?
  resultReason   String?      // ex: "CHECKMATE", "TIMEOUT", "RESIGNATION", "NO_SHOW"

  startedAt      DateTime?
  finishedAt      DateTime?

  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  // Relations
  tournament     Tournament   @relation(fields: [tournamentId], references: [id], onDelete: Cascade)
  whiteEntry     TournamentEntry @relation("MatchWhiteEntry", fields: [whiteEntryId], references: [id])
  blackEntry     TournamentEntry @relation("MatchBlackEntry", fields: [blackEntryId], references: [id])

  @@map("matches")
  @@index([tournamentId])
  @@index([roundNumber, tournamentId])
}
```

**Points importants** :
- Les matches utilisent `TournamentEntry` (et non `Player` directement) pour lier les joueurs
- `result` est optionnel (null tant que le match n'est pas terminé)
- `resultReason` permet de documenter la raison du résultat (ex: "CHECKMATE", "TIMEOUT")
- Les index optimisent les requêtes par tournoi et par ronde

### Modèle `TournamentEntry` (modifié)

Ajout des relations pour les matches :

```prisma
model TournamentEntry {
  // ... champs existants ...
  
  // Relations
  matchesAsWhite Match[] @relation("MatchWhiteEntry")
  matchesAsBlack Match[] @relation("MatchBlackEntry")
}
```

### Migration

La migration `20251209225539_add_matches_and_results` a été créée et appliquée.

---

## 🔄 Flows Principaux

### Flow 1 : Démarrage d'un Tournoi

```
1. Tournoi en statut READY (prize pool figé)
   ↓
2. Admin appelle POST /admin/tournaments/:id/start
   ↓
3. TournamentsService.startTournament()
   - Vérifie que le tournoi est READY
   ↓
4. MatchesService.generateInitialMatchesForTournament()
   - Charge les TournamentEntry CONFIRMED et actifs
   - Filtre les joueurs suspendus/restreints
   - Trie par ELO décroissant (meilleurs joueurs en premier)
   - Génère des paires 1v1 : (0 vs 1), (2 vs 3), ...
   - Si nombre impair : crée un match BYE pour le dernier joueur
   - Crée les enregistrements Match (roundNumber = 1)
   - Met à jour le statut du tournoi en RUNNING
   ↓
5. Retourne la liste des matches créés
```

**Exemple de bracket généré pour 5 joueurs** :
- Match 1 : Joueur 1 (ELO 2000) vs Joueur 2 (ELO 1800)
- Match 2 : Joueur 3 (ELO 1600) vs Joueur 4 (ELO 1400)
- Match 3 : Joueur 5 (ELO 1200) - BYE (victoire automatique)

### Flow 2 : Enregistrement des Résultats et Génération des Rondes

```
1. Admin appelle POST /admin/matches/:id/result
   Body: { result: "WHITE_WIN", winnerEntryId: "...", resultReason: "CHECKMATE" }
   ↓
2. MatchesService.reportResult()
   - Vérifie que le match existe et n'est pas déjà FINISHED/CANCELED
   - Vérifie la cohérence entre result et winnerEntryId
   - Met à jour le match : status = FINISHED, result, resultReason, finishedAt
   ↓
3. MatchesService.generateNextRoundIfNeeded()
   - Récupère toutes les rondes du tournoi
   - Trouve la ronde maximale
   - Vérifie si tous les matches de cette ronde sont FINISHED
   ↓
4a. Si tous terminés ET plus d'un winner :
    - Identifie les winners (basé sur Match.result)
    - Génère la ronde suivante (roundNumber + 1)
    - Crée les nouveaux matches (paires 1v1)
    - Si nombre impair : crée un match BYE
    ↓
4b. Si tous terminés ET un seul winner :
    - Appelle TournamentsService.finalizeTournamentAndPayouts()
    ↓
5. Retourne le match mis à jour
```

**Exemple de progression** :
- **Ronde 1** : 4 joueurs → 2 matches → 2 winners
- **Ronde 2** : 2 winners → 1 match → 1 winner
- **Finalisation** : Distribution des gains

### Flow 3 : Finalisation et Distribution des Gains

```
1. TournamentsService.finalizeTournamentAndPayouts()
   - Vérifie que le tournoi est RUNNING et a un PrizePool
   ↓
2. Identifie le vainqueur (position 1) et le finaliste (position 2)
   - Trouve la dernière ronde (roundNumber max)
   - Identifie le winner du match final
   - Identifie le perdant du match final (finaliste)
   ↓
3. Charge le PrizePool (distributableCents + distributionJson)
   - Parse le distributionJson : {"1": 0.7, "2": 0.3}
   ↓
4. Calcule les payouts pour chaque position
   - Position 1 : floor(distributableCents * 0.7)
   - Position 2 : floor(distributableCents * 0.3)
   ↓
5. Dans une transaction Prisma atomique :
   - Pour chaque position payée :
     * Charge le Wallet du joueur
     * Crée une transaction TOURNAMENT_PAYOUT via TransactionsService
     * amountCents = payoutCents calculé
     * description = "Gain du tournoi '...' - Position #X"
   - Met à jour le tournoi : status = FINISHED, endsAt = maintenant
   ↓
6. Retourne void (opération complétée)
```

**Exemple de distribution** :
- Prize pool : 10000 centimes (100,00 €)
- Distribution : {"1": 0.7, "2": 0.3}
- Vainqueur : 7000 centimes (70,00 €)
- Finaliste : 3000 centimes (30,00 €)

---

## 🔌 Endpoints API

### Endpoints Admin

#### POST /admin/tournaments/:id/start

Démarre un tournoi en générant les matches du premier tour.

**Authentification** : JWT + RolesGuard (ADMIN, SUPER_ADMIN)

**Paramètres** :
- `id` (path) : ID du tournoi

**Réponse** (200 OK) :
```json
[
  {
    "id": "match-id-1",
    "tournamentId": "tournament-id",
    "roundNumber": 1,
    "boardNumber": 1,
    "whiteEntryId": "entry-id-1",
    "blackEntryId": "entry-id-2",
    "status": "PENDING",
    "result": null,
    "resultReason": null,
    "startedAt": null,
    "finishedAt": null,
    "createdAt": "2025-12-09T10:00:00.000Z",
    "updatedAt": "2025-12-09T10:00:00.000Z"
  },
  {
    "id": "match-id-2",
    "roundNumber": 1,
    "boardNumber": 2,
    "status": "PENDING",
    ...
  }
]
```

**Erreurs possibles** :
- `404` : Tournoi introuvable
- `400` : Tournoi n'est pas en statut READY
- `400` : Des matches ont déjà été générés

#### POST /admin/matches/:id/result

Enregistre le résultat d'un match.

**Authentification** : JWT + RolesGuard (ADMIN, SUPER_ADMIN)

**Paramètres** :
- `id` (path) : ID du match

**Body** :
```json
{
  "result": "WHITE_WIN",
  "winnerEntryId": "entry-id-white",
  "resultReason": "CHECKMATE"
}
```

**Valeurs possibles pour `result`** :
- `WHITE_WIN` : Le joueur blanc a gagné
- `BLACK_WIN` : Le joueur noir a gagné
- `DRAW` : Match nul (les deux joueurs avancent)
- `BYE` : Victoire automatique (bye en bracket)

**Réponse** (200 OK) :
```json
{
  "id": "match-id",
  "tournamentId": "tournament-id",
  "roundNumber": 1,
  "boardNumber": 1,
  "whiteEntryId": "entry-id-1",
  "blackEntryId": "entry-id-2",
  "status": "FINISHED",
  "result": "WHITE_WIN",
  "resultReason": "CHECKMATE",
  "startedAt": "2025-12-09T10:00:00.000Z",
  "finishedAt": "2025-12-09T11:30:00.000Z",
  "whiteEntry": {
    "id": "entry-id-1",
    "player": {
      "id": "player-id-1",
      "username": "player1",
      "elo": 2000
    }
  },
  "blackEntry": {
    "id": "entry-id-2",
    "player": {
      "id": "player-id-2",
      "username": "player2",
      "elo": 1800
    }
  }
}
```

**Erreurs possibles** :
- `404` : Match introuvable
- `400` : Match déjà terminé ou annulé
- `400` : Incohérence entre `result` et `winnerEntryId`

**Comportement automatique** :
- Si tous les matches de la ronde sont terminés :
  - Génération automatique de la ronde suivante (si plus d'un winner)
  - Finalisation automatique du tournoi (si un seul winner)

### Endpoints Publics / Joueurs

#### GET /tournaments/:id/matches

Liste les matches d'un tournoi groupés par ronde.

**Authentification** : Aucune (public)

**Paramètres** :
- `id` (path) : ID du tournoi

**Réponse** (200 OK) :
```json
{
  "tournament": {
    "id": "tournament-id",
    "name": "Tournoi Rapide 10+0",
    "status": "RUNNING"
  },
  "matchesByRound": {
    "1": [
      {
        "id": "match-id-1",
        "roundNumber": 1,
        "boardNumber": 1,
        "whiteEntry": {
          "id": "entry-id-1",
          "player": {
            "id": "player-id-1",
            "username": "player1",
            "elo": 2000
          }
        },
        "blackEntry": {
          "id": "entry-id-2",
          "player": {
            "id": "player-id-2",
            "username": "player2",
            "elo": 1800
          }
        },
        "status": "FINISHED",
        "result": "WHITE_WIN",
        "resultReason": "CHECKMATE"
      }
    ],
    "2": [
      {
        "id": "match-id-3",
        "roundNumber": 2,
        "boardNumber": 1,
        "status": "PENDING",
        "result": null
      }
    ]
  }
}
```

#### GET /tournaments/:id/standings

Retourne le classement du tournoi avec les statistiques de chaque joueur.

**Authentification** : Aucune (public)

**Paramètres** :
- `id` (path) : ID du tournoi

**Réponse** (200 OK) :
```json
[
  {
    "playerId": "player-id-1",
    "username": "player1",
    "position": 1,
    "wins": 2,
    "losses": 0,
    "draws": 0,
    "payoutCents": 7000
  },
  {
    "playerId": "player-id-2",
    "username": "player2",
    "position": 2,
    "wins": 1,
    "losses": 1,
    "draws": 0,
    "payoutCents": 3000
  },
  {
    "playerId": "player-id-3",
    "username": "player3",
    "position": 3,
    "wins": 0,
    "losses": 1,
    "draws": 0,
    "payoutCents": null
  }
]
```

**Notes** :
- `payoutCents` est `null` si le tournoi n'est pas terminé ou si la position n'est pas payée
- Le classement est trié par : wins décroissant, puis losses croissant, puis draws décroissant
- Les payouts sont calculés uniquement si le tournoi est `FINISHED` et a un `PrizePool` avec `distributionJson`

#### GET /matches/:id

Récupère le détail d'un match.

**Authentification** : Aucune (public)

**Paramètres** :
- `id` (path) : ID du match

**Réponse** (200 OK) :
```json
{
  "id": "match-id",
  "tournamentId": "tournament-id",
  "roundNumber": 1,
  "boardNumber": 1,
  "whiteEntry": {
    "id": "entry-id-1",
    "player": {
      "id": "player-id-1",
      "username": "player1",
      "elo": 2000
    }
  },
  "blackEntry": {
    "id": "entry-id-2",
    "player": {
      "id": "player-id-2",
      "username": "player2",
      "elo": 1800
    }
  },
  "status": "FINISHED",
  "result": "WHITE_WIN",
  "resultReason": "CHECKMATE",
  "startedAt": "2025-12-09T10:00:00.000Z",
  "finishedAt": "2025-12-09T11:30:00.000Z",
  "tournament": {
    "id": "tournament-id",
    "name": "Tournoi Rapide 10+0",
    "status": "RUNNING",
    "timeControl": "10+0"
  }
}
```

#### GET /matches/tournament/:tournamentId

Liste les matches d'un tournoi (alternative à `/tournaments/:id/matches`).

**Authentification** : Aucune (public)

**Paramètres** :
- `tournamentId` (path) : ID du tournoi
- `playerId` (query, optionnel) : Filtrer par joueur

**Réponse** : Même format que `GET /tournaments/:id/matches` mais sans groupement par ronde

---

## ⚖️ Modèle Skill Game - Rappel Important

### Principe Fondamental

⚠️ **Cette plateforme est un SKILL GAME, pas un site de paris.**

**Caractéristiques** :
- ✅ **Aucun tirage aléatoire** : Les résultats sont déterminés uniquement par la performance des joueurs
- ✅ **Aucun pari entre joueurs** : Pas de modèle de stake mutuel ou de pari direct
- ✅ **Gains = Performance** : Les gains sont **intégralement déterministes**, basés uniquement sur le classement obtenu via les matches
- ✅ **Prize pool figé** : Le prize pool est calculé et figé au moment de la clôture des inscriptions (statut READY)
- ✅ **Distribution prédéfinie** : La distribution des gains est définie dans `PrizePool.distributionJson` avant le début du tournoi

### Flux Financier

```
1. Inscription (buy-in)
   - Chaque joueur paie un droit d'entrée fixe (buyInCents)
   - Transaction : TOURNAMENT_BUY_IN (débit)
   ↓
2. Clôture des inscriptions
   - Si < minPlayers : remboursement intégral (TOURNAMENT_PAYOUT)
   - Si >= minPlayers : calcul et figement du prize pool
   ↓
3. Déroulement du tournoi
   - Les matches déterminent le classement (skill-based uniquement)
   - Aucun impact financier pendant le tournoi
   ↓
4. Finalisation
   - Calcul des positions basé sur les résultats des matches
   - Distribution des gains selon distributionJson
   - Transaction : TOURNAMENT_PAYOUT (crédit) pour chaque position payée
```

### Exemple Concret

**Tournoi** :
- 4 joueurs inscrits
- Buy-in : 1000 centimes (10,00 €)
- Prize pool : 3800 centimes (38,00 €) après commission

**Distribution** :
- Position 1 : 70% = 2660 centimes (26,60 €)
- Position 2 : 30% = 1140 centimes (11,40 €)

**Résultats** :
- Joueur A gagne tous ses matches → Position 1 → Reçoit 2660 centimes
- Joueur B perd en finale → Position 2 → Reçoit 1140 centimes
- Joueurs C et D éliminés en demi-finale → Aucun gain

**Point clé** : Les montants sont **déterministes** et **prédéfinis**. Aucun hasard, aucun pari.

---

## 🧪 Scénarios de Test

### Test 1 : Démarrage d'un Tournoi

1. **Créer un tournoi** (admin) :
   ```bash
   POST /admin/tournaments
   {
     "name": "Tournoi Test",
     "timeControl": "10+0",
     "buyInCents": 1000,
     "minPlayers": 4,
     "maxPlayers": 8,
     "status": "SCHEDULED"
   }
   ```

2. **Inscrire 4 joueurs** :
   ```bash
   POST /tournaments/{tournament-id}/join
   Authorization: Bearer <player-token>
   ```

3. **Clôturer les inscriptions** :
   ```bash
   POST /admin/tournaments/{tournament-id}/close-registration
   Authorization: Bearer <admin-token>
   ```
   → Tournoi passe en statut READY

4. **Démarrer le tournoi** :
   ```bash
   POST /admin/tournaments/{tournament-id}/start
   Authorization: Bearer <admin-token>
   ```
   → Génère 2 matches (roundNumber = 1)
   → Tournoi passe en statut RUNNING

### Test 2 : Enregistrement des Résultats

1. **Enregistrer le résultat du match 1** :
   ```bash
   POST /admin/matches/{match-id-1}/result
   Authorization: Bearer <admin-token>
   {
     "result": "WHITE_WIN",
     "winnerEntryId": "entry-id-white",
     "resultReason": "CHECKMATE"
   }
   ```

2. **Enregistrer le résultat du match 2** :
   ```bash
   POST /admin/matches/{match-id-2}/result
   {
     "result": "BLACK_WIN",
     "winnerEntryId": "entry-id-black",
     "resultReason": "TIMEOUT"
   }
   ```

3. **Vérifier la génération automatique de la ronde 2** :
   ```bash
   GET /tournaments/{tournament-id}/matches
   ```
   → Devrait montrer la ronde 2 avec 1 match (les 2 winners)

### Test 3 : Finalisation Automatique

1. **Enregistrer le résultat du match final** :
   ```bash
   POST /admin/matches/{match-final-id}/result
   {
     "result": "WHITE_WIN",
     "winnerEntryId": "entry-id-winner",
     "resultReason": "CHECKMATE"
   }
   ```

2. **Vérifier la finalisation** :
   ```bash
   GET /tournaments/{tournament-id}
   ```
   → Statut devrait être FINISHED
   → endsAt devrait être défini

3. **Vérifier les payouts** :
   ```bash
   GET /tournaments/{tournament-id}/standings
   ```
   → Devrait montrer les payouts pour les positions 1 et 2

4. **Vérifier les transactions** :
   ```bash
   GET /wallets/me
   Authorization: Bearer <winner-token>
   ```
   → Devrait montrer une transaction TOURNAMENT_PAYOUT

---

## 📝 Notes Importantes

### Gestion des BYE

- Un BYE est créé automatiquement si le nombre de joueurs est impair
- Le joueur avec BYE gagne automatiquement (result = BYE)
- Le match BYE est créé avec `whiteEntryId = blackEntryId` (même joueur)

### Gestion des Matchs Nuls (DRAW)

- En cas de match nul, les deux joueurs avancent à la ronde suivante
- Cela peut créer un nombre impair de joueurs à la ronde suivante (gestion automatique avec BYE)

### Calcul des Classements

- Basé uniquement sur les matches terminés (status = FINISHED)
- Tri par : wins décroissant → losses croissant → draws décroissant
- Les payouts sont calculés uniquement si le tournoi est FINISHED

### Transactions Atomiques

- La finalisation du tournoi utilise `prisma.$transaction()` pour garantir la cohérence
- Si une opération échoue, tout est annulé (rollback)

### Limitations Actuelles

- Les positions 3+ ne sont pas encore gérées dans la finalisation (TODO)
- Le système de pairing est simple (pas de système suisse ou round-robin)
- Pas de gestion des forfaits (NO_SHOW) pour l'instant
- **⚠️ Pas de plateau d'échecs intégré** : À ce stade (Phase 5), il n'y a pas encore d'interface de jeu. Les résultats sont enregistrés manuellement par l'admin via l'API. L'intégration d'un moteur d'échecs (chess.js) et d'une interface de plateau est prévue pour une phase ultérieure (Phase 6+).

---

## 🔗 Fichiers Modifiés/Créés

### Fichiers créés

- `src/modules/matches/matches.module.ts` : Module Matches
- `src/modules/matches/matches.service.ts` : Service avec logique métier
- `src/modules/matches/matches.controller.ts` : Controller endpoints publics
- `src/modules/matches/matches.admin.controller.ts` : Controller endpoints admin
- `src/modules/matches/dto/report-match-result.dto.ts` : DTO pour les résultats

### Fichiers modifiés

- `prisma/schema.prisma` : Ajout des enums MatchStatus, modification MatchResult, refonte modèle Match
- `src/modules/tournaments/tournaments.service.ts` : Ajout de `startTournament()`, `getTournamentMatches()`, `getTournamentStandings()`, `finalizeTournamentAndPayouts()`
- `src/modules/tournaments/tournaments.controller.ts` : Ajout des endpoints `/matches` et `/standings`
- `src/modules/tournaments/tournaments.admin.controller.ts` : Ajout de l'endpoint `/start`
- `src/modules/tournaments/tournaments.module.ts` : Import de MatchesModule (forwardRef)
- `src/modules/matches/matches.module.ts` : Import de TournamentsModule (forwardRef)
- `src/app.module.ts` : Import de MatchesModule

### Migrations

- `20251209225539_add_matches_and_results` : Migration Prisma pour les matches

---

## ✅ Checklist de Validation

- [x] Schéma Prisma mis à jour (MatchStatus, MatchResult, modèle Match)
- [x] Migration créée et appliquée
- [x] MatchesService implémenté avec toutes les méthodes
- [x] Génération automatique des brackets
- [x] Génération automatique des rondes suivantes
- [x] Finalisation automatique avec distribution des gains
- [x] Endpoints admin créés et protégés
- [x] Endpoints publics créés
- [x] Calcul des classements implémenté
- [x] Transactions atomiques pour la finalisation
- [x] Gestion des BYE pour nombres impairs
- [x] Gestion des matchs nuls (DRAW)
- [x] Documentation complète

---

## 🔄 Prochaines Étapes (Phase 6+)

- [ ] **Intégrer un moteur d'échecs** (chess.js ou équivalent) pour permettre de jouer réellement
- [ ] **Créer une interface de plateau d'échecs** interactive
- [ ] **Gérer les coups et la validation** des mouvements
- [ ] **Intégrer la gestion du temps** (clock) pour les matches
- [ ] **Ajouter une interface admin** pour enregistrer les résultats directement depuis la page du tournoi (actuellement via API uniquement)
- [ ] Implémenter la gestion des positions 3+ dans la finalisation
- [ ] Ajouter un système de pairing plus sophistiqué (système suisse, round-robin)
- [ ] Gérer les forfaits (NO_SHOW) avec pénalités
- [ ] Ajouter un système de notation PGN pour stocker les parties
- [ ] Implémenter un système de classement Elo basé sur les résultats
- [ ] Ajouter des notifications pour les joueurs (nouveau match, résultat, etc.)
- [ ] Créer un dashboard admin pour visualiser les brackets

---

## ⚠️ Notes Techniques Importantes

### Validation des IDs (CUID vs UUID)

**Important** : Prisma utilise `cuid()` par défaut pour générer les IDs, qui produisent des identifiants comme `cmivyvets0004vo0xuwswywq9`. Ces IDs ne sont **pas** des UUIDs v4 standard.

Par conséquent, les controllers utilisent `@Param('id')` au lieu de `@Param('id', ParseUUIDPipe)` pour accepter les CUIDs.

**Fichiers concernés** :
- `backend/src/modules/tournaments/tournaments.controller.ts`
- `backend/src/modules/matches/matches.controller.ts`
- `backend/src/modules/matches/matches.admin.controller.ts`

Si vous souhaitez utiliser des UUIDs v4 à la place, vous devrez :
1. Modifier le schéma Prisma pour utiliser `@default(uuid())`
2. Créer une migration
3. Réintroduire `ParseUUIDPipe` dans les controllers

---

**Dernière mise à jour** : Décembre 2025  
**Version** : 1.0.1

