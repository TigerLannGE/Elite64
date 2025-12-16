# Implémenter Module Tournois et Prize Pool - Documentation Complète

Ce document décrit l'implémentation complète du module `Tournaments` et `PrizePool` pour la plateforme ChessBet, permettant la création, l'inscription et la gestion des tournois d'échecs skill-based.

**Date de création** : Décembre 2025  
**Dernière mise à jour** : 15 décembre 2025  
**Statut** : ✅ Complété (Phase 4)

---

## 📋 Vue d'ensemble

Cette implémentation permet de :
- ✅ Créer et configurer des tournois (endpoints admin)
- ✅ Permettre aux joueurs de s'inscrire via buy-in
- ✅ Gérer la clôture des inscriptions à heure fixe
- ✅ Annuler et rembourser si < minPlayers
- ✅ Calculer et figer un prize pool si >= minPlayers
- ✅ Exposer aux joueurs min / current / max prize pools pour l'affichage
- ✅ Respecter le modèle skill game (pas de pari entre joueurs)
- ✅ **Afficher l'historique des tournois terminés** (mise à jour 15/12/2025)

---

## 🔄 Changements Récents

### 15 décembre 2025 - Ajout de l'historique des tournois

**Modification** : `listPublicTournaments()` retourne maintenant aussi les tournois FINISHED

**Contexte** : Le frontend dispose d'onglets "À venir / En cours" et "Terminés", mais l'API ne retournait que les tournois actifs, rendant l'onglet "Terminés" toujours vide.

**Solution** :
- Les tournois **actifs** (`SCHEDULED`, `READY`, `RUNNING`) sont filtrés par dates futures (comportement existant)
- Les tournois **terminés** (`FINISHED`) sont tous retournés (sans filtre de date)
- Le frontend effectue le filtrage par onglets côté client

**Bénéfice** : Les joueurs peuvent consulter l'historique des tournois passés, voir les classements finaux et les gains distribués.

**Fichier modifié** : `backend/src/modules/tournaments/tournaments.service.ts` (ligne 143+)

---

## 🏗️ Architecture

### Structure des modules

```
backend/src/
├── modules/
│   ├── prize-pool/
│   │   ├── prize-pool.module.ts          # Module PrizePool
│   │   └── prize-pool.service.ts         # Service de calcul des prize pools
│   └── tournaments/
│       ├── tournaments.module.ts          # Module Tournaments
│       ├── tournaments.service.ts         # Service avec logique métier
│       ├── tournaments.controller.ts      # Controller (endpoints publics + admin)
│       └── dto/
│           ├── create-tournament.dto.ts   # DTO création
│           └── update-tournament.dto.ts   # DTO mise à jour
└── app.module.ts                          # Modules intégrés
```

---

## 🎯 TÂCHE 0 – Adaptation du schéma Prisma

### Modifications apportées au schéma

#### 1. Enum `TournamentStatus`

Ajout de la valeur `READY` pour marquer les tournois dont le prize pool est figé et prêts à démarrer :

```prisma
enum TournamentStatus {
  DRAFT
  SCHEDULED
  READY      // ← Nouveau statut
  RUNNING
  FINISHED
  CANCELED
}
```

#### 2. Modèle `Tournament`

Ajout du champ `registrationClosesAt` pour gérer la clôture des inscriptions :

```prisma
model Tournament {
  // ... champs existants
  registrationClosesAt DateTime?    // Date/heure de clôture des inscriptions
  // ... autres champs
  @@index([registrationClosesAt])   // Index pour optimiser les requêtes
}
```

#### 3. Modèle `PrizePool`

Complétion du modèle avec les champs nécessaires :

```prisma
model PrizePool {
  id                  String   @id @default(cuid())
  tournamentId        String   @unique
  totalEntriesCents    Int      // Somme des buy-ins
  commissionCents     Int      @default(0) // Commission totale prélevée
  distributableCents  Int      // Montant total redistribuable aux joueurs
  currency            String   // Doit correspondre à Tournament.currency
  distributionJson    Json?    // Ex: {"1": 0.7, "2": 0.3}
  lockedAt            DateTime // Quand le prize pool a été figé
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  tournament Tournament @relation(fields: [tournamentId], references: [id], onDelete: Cascade)
}
```

### Migration

Pour appliquer ces modifications :

```bash
cd backend
npx prisma migrate dev --name add_registration_closes_at_and_ready_status
```

---

## 💰 TÂCHE 1 – PrizePoolService

### Module `src/modules/prize-pool/`

#### 1. PrizePoolService (`prize-pool.service.ts`)

Service centralisé pour le calcul et la gestion des prize pools.

##### Constantes

```typescript
const COMMISSION_RATE = 0.05;      // 5% commission plateforme
const REDISTRIBUTION_RATE = 0.95;  // 95% du montant après commission va aux joueurs
```

##### Interface `PrizePoolComputationInput`

```typescript
interface PrizePoolComputationInput {
  playersCount: number;
  buyInCents: number;
}
```

##### Interface `PrizePoolComputationResult`

```typescript
interface PrizePoolComputationResult {
  totalEntriesCents: number;
  commissionCents: number;
  distributableCents: number;
}
```

##### Méthode `computePrizePool()`

Calcule le prize pool basé sur le nombre de joueurs et le buy-in (ne persiste rien) :

```typescript
computePrizePool(input: PrizePoolComputationInput): PrizePoolComputationResult {
  // 1. totalEntriesCents = playersCount * buyInCents
  const totalEntriesCents = input.playersCount * input.buyInCents;
  
  // 2. commissionCents = floor(totalEntriesCents * COMMISSION_RATE)
  const commissionCents = Math.floor(totalEntriesCents * COMMISSION_RATE);
  
  // 3. base = totalEntriesCents - commissionCents
  const base = totalEntriesCents - commissionCents;
  
  // 4. distributableCents = floor(base * REDISTRIBUTION_RATE)
  const distributableCents = Math.floor(base * REDISTRIBUTION_RATE);
  
  // 5. Retourner le résultat
  return { totalEntriesCents, commissionCents, distributableCents };
}
```

##### Méthode `computePrizePoolForMinCurrentMax()`

Prépare les calculs min/current/max pour l'affichage dans le lobby (ne persiste rien) :

```typescript
computePrizePoolForMinCurrentMax(params: {
  minPlayers: number;
  maxPlayers: number;
  currentPlayers: number;
  buyInCents: number;
}): {
  min: PrizePoolComputationResult;
  max: PrizePoolComputationResult;
  current: PrizePoolComputationResult;
}
```

##### Méthode `lockPrizePoolForTournament()`

Fige le prize pool d'un tournoi au moment de la clôture des inscriptions :

```typescript
async lockPrizePoolForTournament(tournamentId: string): Promise<PrizePool> {
  // 1. Récupérer le tournoi + compter les TournamentEntry CONFIRMED
  // 2. Si count < tournament.minPlayers -> throw (annulation gérée côté service d'appel)
  // 3. Utiliser computePrizePool()
  // 4. Créer ou mettre à jour le PrizePool associé
  // 5. Mettre à jour le statut du tournoi : READY
  // 6. Retourner le PrizePool
}
```

#### 2. PrizePoolModule (`prize-pool.module.ts`)

```typescript
@Module({
  providers: [PrizePoolService],
  exports: [PrizePoolService],
})
export class PrizePoolModule {}
```

---

## 🏆 TÂCHE 2 – TournamentsModule

### Module `src/modules/tournaments/`

#### 1. DTOs

##### CreateTournamentDto (`dto/create-tournament.dto.ts`)

```typescript
export class CreateTournamentDto {
  name: string;
  timeControl: string;              // ex: "10+0", "3+0"
  buyInCents: number;
  currency?: string;                 // Par défaut "EUR"
  minPlayers: number;
  maxPlayers: number;
  eloMin?: number;
  eloMax?: number;
  startsAt?: string;                 // ISO date string
  endsAt?: string;
  registrationClosesAt?: string;
  legalZoneCode: string;            // ex: "UK", "US-CA", "EU"
  status?: TournamentStatus;         // Par défaut DRAFT
}
```

##### UpdateTournamentDto (`dto/update-tournament.dto.ts`)

Tous les champs de `CreateTournamentDto` sont optionnels.

#### 2. TournamentsService (`tournaments.service.ts`)

##### Méthode `createTournamentAsAdmin()`

Crée un tournoi en statut DRAFT ou SCHEDULED (admin uniquement) :

```typescript
async createTournamentAsAdmin(
  dto: CreateTournamentDto,
  adminId: string,
): Promise<Tournament>
```

**Validations :**
- `minPlayers <= maxPlayers`
- `registrationClosesAt < startsAt` (si les deux sont définis)

##### Méthode `listPublicTournaments()`

Retourne les tournois visibles dans le lobby et l'historique :

```typescript
async listPublicTournaments(): Promise<TournamentPublicView[]>
```

**Filtres :**
- **Tournois actifs** : Statut `SCHEDULED`, `READY`, ou `RUNNING` + filtres de dates (`registrationClosesAt >= now` ou `startsAt >= now`)
- **Tournois terminés** : Statut `FINISHED` (tous retournés, sans filtre de date)

**Logique de filtrage :**
```typescript
{
  OR: [
    // Tournois actifs avec filtres de date
    {
      status: { in: [SCHEDULED, READY, RUNNING] },
      OR: [
        { registrationClosesAt: { gte: now } },
        { startsAt: { gte: now } }
      ]
    },
    // Tournois terminés (sans filtre de date)
    { status: FINISHED }
  ]
}
```

**Retour :** Liste avec `prizePools.min`, `prizePools.current`, `prizePools.max` calculés

**Usage Frontend :**
- L'onglet "À venir / En cours" du frontend filtre par statut `SCHEDULED | READY | RUNNING`
- L'onglet "Terminés" filtre par statut `FINISHED`

##### Méthode `getTournamentPublicView()`

Retourne le détail d'un tournoi avec les prize pools calculés :

```typescript
async getTournamentPublicView(id: string): Promise<TournamentPublicView>
```

##### Méthode `joinTournament()`

Inscription d'un joueur à un tournoi :

```typescript
async joinTournament(
  tournamentId: string,
  playerId: string,
): Promise<{ message: string; entryId: string }>
```

**Processus :**
1. Récupérer le tournoi (vérifier statut `SCHEDULED`)
2. Vérifier les dates (`now < registrationClosesAt` ou `startsAt`)
3. Vérifier que le joueur n'est pas déjà inscrit
4. Vérifier que le tournoi n'a pas atteint `maxPlayers`
5. Récupérer le wallet du joueur
6. Utiliser `transactionsService.debitWallet()` avec type `TOURNAMENT_BUY_IN`
7. Créer un `TournamentEntry` avec statut `CONFIRMED`

##### Méthode `closeRegistrationAndProcess()`

Ferme les inscriptions et traite le tournoi :

```typescript
async closeRegistrationAndProcess(
  tournamentId: string,
): Promise<
  | { action: 'canceled'; message: string; refundedCount: number }
  | { action: 'locked'; prizePool: PrizePool }
>
```

**Si `confirmedCount < minPlayers` :**
- Pour chaque entry : rembourser via `transactionsService.creditWallet()` (type `TOURNAMENT_PAYOUT`)
- Mettre le tournoi en statut `CANCELED`
- Retourner un résumé

**Si `confirmedCount >= minPlayers` :**
- Appeler `prizePoolService.lockPrizePoolForTournament(tournamentId)`
- Le statut du tournoi devient `READY`
- Retourner le `PrizePool`

##### Méthode `updateTournamentAsAdmin()`

Met à jour un tournoi (admin uniquement) :

```typescript
async updateTournamentAsAdmin(
  tournamentId: string,
  dto: UpdateTournamentDto,
): Promise<Tournament>
```

**Restrictions :**
- Seulement si statut `DRAFT` ou `SCHEDULED`
- Si le tournoi a des inscrits, certains champs ne peuvent pas être modifiés :
  - `buyInCents`
  - `minPlayers`
  - `maxPlayers`
  - `currency`

#### 3. TournamentsController (`tournaments.controller.ts`)

##### Endpoints publics (joueurs)

**GET `/tournaments`**
- Liste des tournois visibles dans le lobby et l'historique des tournois terminés
- Public (pas de JWT requis)
- Retourne : `TournamentPublicView[]` (tous les statuts actifs + terminés)
- **Note** : Le frontend filtre par onglets (Actifs / Terminés)

**GET `/tournaments/:id`**
- Détail d'un tournoi pour la page de détail
- Public (pas de JWT requis)
- Retourne : `TournamentPublicView`

**POST `/tournaments/:id/join`**
- Inscription du joueur courant
- JWT requis (`@UseGuards(JwtAuthGuard)`)
- Retourne : `{ message: string; entryId: string }`

##### Endpoints admin

**POST `/admin/tournaments`**
- Création d'un tournoi
- TODO: Protéger avec `RolesGuard` + `@Roles('ADMIN', 'SUPER_ADMIN')`
- Body : `CreateTournamentDto`
- Retourne : `Tournament`

**PATCH `/admin/tournaments/:id`**
- Mise à jour d'un tournoi
- TODO: Protéger avec `RolesGuard` + `@Roles('ADMIN', 'SUPER_ADMIN')`
- Body : `UpdateTournamentDto`
- Retourne : `Tournament`

**POST `/admin/tournaments/:id/close-registration`**
- Ferme les inscriptions et traite le tournoi
- TODO: Protéger avec `RolesGuard` + `@Roles('ADMIN', 'SUPER_ADMIN')`
- Retourne : Résultat de `closeRegistrationAndProcess()`

#### 4. TournamentsModule (`tournaments.module.ts`)

```typescript
@Module({
  imports: [TransactionsModule, PrizePoolModule],
  controllers: [TournamentsController, TournamentsAdminController],
  providers: [TournamentsService],
  exports: [TournamentsService],
})
export class TournamentsModule {}
```

---

## 🔒 Logique Légale et Conformité

### Principe Skill Game

⚠️ **Important** : Cette plateforme n'est **PAS** un site de paris. Il n'existe aucun modèle de pari entre joueurs ou de stake direct.

**Modèle respecté :**
- ✅ **Buy-in = droit d'entrée** : Chaque joueur paie un droit d'entrée fixe
- ✅ **Prize pool dérivé des entrées** : Le prize pool est un agrégat des droits d'entrée moins la commission
- ✅ **Commission fixe** : 5% de commission plateforme (frais d'organisation)
- ✅ **Redistribution** : 95% du montant après commission va aux joueurs
- ✅ **Annulation + remboursement** : Si < minPlayers, tous les joueurs sont remboursés

**Pas de pari entre joueurs :**
- ❌ Aucun modèle de pari direct entre joueurs
- ❌ Aucun stake mutuel
- ❌ Le prize pool est fixe une fois figé (pas de variation selon les résultats)

---

## 🚀 Démarrage et Tests

### Commandes à lancer

```bash
# Démarrer le serveur backend
cd backend
npm run start:dev
```

Le serveur sera accessible sur `http://localhost:4000` (ou le port configuré dans `PORT_BACKEND`).

### Tests manuels

#### 1. Créer un tournoi (Admin)

⚠️ **Note** : Les endpoints admin ne sont pas encore protégés. Aucun token n'est requis pour l'instant.

```bash
POST http://localhost:4000/admin/tournaments
Content-Type: application/json

{
  "name": "Tournoi Rapide 10+0",
  "timeControl": "10+0",
  "buyInCents": 1000,
  "currency": "EUR",
  "minPlayers": 4,
  "maxPlayers": 8,
  "startsAt": "2025-12-20T18:00:00Z",
  "registrationClosesAt": "2025-12-20T17:30:00Z",
  "legalZoneCode": "EU",
  "status": "SCHEDULED"
}
```

#### 2. Créditer les wallets des joueurs (pour les tests)

```bash
POST http://localhost:4000/wallets/test-credit
Content-Type: application/json
Authorization: Bearer <player-token>

{
  "amountCents": 5000
}
```

#### 3. S'inscrire avec plusieurs joueurs

```bash
POST http://localhost:4000/tournaments/<tournament-id>/join
Authorization: Bearer <player1-token>
```

Répéter avec `player2-token`, `player3-token`, etc.

#### 4. Clôturer les inscriptions

**Cas 1 : < minPlayers (annulation + remboursement)**

⚠️ **Note** : Aucun token requis pour l'instant (endpoint non protégé).

```bash
POST http://localhost:4000/admin/tournaments/<tournament-id>/close-registration
```

**Résultat attendu :**
```json
{
  "action": "canceled",
  "message": "Tournoi annulé (2/4 joueurs minimum requis). 2 joueur(s) remboursé(s).",
  "refundedCount": 2
}
```

- Le tournoi passe en statut `CANCELED`
- Tous les joueurs sont remboursés
- Les wallets sont crédités

**Cas 2 : >= minPlayers (prize pool figé)**

⚠️ **Note** : Aucun token requis pour l'instant (endpoint non protégé).

```bash
POST http://localhost:4000/admin/tournaments/<tournament-id>/close-registration
```

**Résultat attendu :**
```json
{
  "action": "locked",
  "prizePool": {
    "id": "...",
    "tournamentId": "...",
    "totalEntriesCents": 4000,
    "commissionCents": 200,
    "distributableCents": 3610,
    "currency": "EUR",
    "lockedAt": "2025-12-20T17:30:00.000Z"
  }
}
```

- Le tournoi passe en statut `READY`
- Le `PrizePool` est créé et figé
- Les montants sont calculés et persistés

#### 5. Vérifier la liste des tournois

```bash
GET http://localhost:4000/tournaments
```

**Résultat attendu :**
```json
[
  {
    "id": "...",
    "name": "Tournoi Rapide 10+0",
    "timeControl": "10+0",
    "status": "READY",
    "buyInCents": 1000,
    "currency": "EUR",
    "minPlayers": 4,
    "maxPlayers": 8,
    "currentPlayers": 5,
    "startsAt": "2025-12-20T18:00:00.000Z",
    "registrationClosesAt": "2025-12-20T17:30:00.000Z",
    "legalZoneCode": "EU",
    "prizePools": {
      "min": {
        "totalEntriesCents": 4000,
        "commissionCents": 200,
        "distributableCents": 3610
      },
      "current": {
        "totalEntriesCents": 5000,
        "commissionCents": 250,
        "distributableCents": 4512
      },
      "max": {
        "totalEntriesCents": 8000,
        "commissionCents": 400,
        "distributableCents": 7220
      }
    }
  }
]
```

---

## 📊 Structure des données

### TournamentPublicView

```typescript
interface TournamentPublicView {
  id: string;
  name: string;
  timeControl: string;
  status: TournamentStatus;
  buyInCents: number;
  currency: string;
  minPlayers: number;
  maxPlayers: number;
  currentPlayers: number;
  eloMin?: number | null;
  eloMax?: number | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
  registrationClosesAt?: Date | null;
  legalZoneCode: string;
  prizePools: {
    min: {
      totalEntriesCents: number;
      commissionCents: number;
      distributableCents: number;
    };
    current: {
      totalEntriesCents: number;
      commissionCents: number;
      distributableCents: number;
    };
    max: {
      totalEntriesCents: number;
      commissionCents: number;
      distributableCents: number;
    };
  };
}
```

---

## 🔄 Flux de données

### Inscription à un tournoi

```
1. Joueur appelle POST /tournaments/:id/join
   ↓
2. TournamentsService.joinTournament()
   ↓
3. Vérifications (statut, dates, capacité, non-inscription)
   ↓
4. TransactionsService.debitWallet()
   - Crée une Transaction (type: TOURNAMENT_BUY_IN)
   - Débite le Wallet
   ↓
5. Création de TournamentEntry (status: CONFIRMED)
   ↓
6. Retour confirmation
```

### Clôture des inscriptions

```
1. Admin appelle POST /admin/tournaments/:id/close-registration
   ↓
2. TournamentsService.closeRegistrationAndProcess()
   ↓
3. Compte des entries CONFIRMED
   ↓
4a. Si < minPlayers:
    - Pour chaque entry:
      - TransactionsService.creditWallet() (type: TOURNAMENT_PAYOUT)
      - Remboursement du buy-in
    - Statut tournoi → CANCELED
    ↓
4b. Si >= minPlayers:
    - PrizePoolService.lockPrizePoolForTournament()
      - Calcule le prize pool
      - Crée/mise à jour PrizePool
      - Statut tournoi → READY
    ↓
5. Retour résultat
```

---

## ⚠️ Notes importantes

### Protection des endpoints admin

Les endpoints admin sont actuellement **non protégés**. Il faut implémenter :

1. **RolesGuard** : Guard pour vérifier les rôles
2. **@Roles decorator** : Décorateur pour spécifier les rôles requis
3. **Système de rôles** : Ajouter un champ `role` au modèle `Player`

**Exemple d'utilisation future :**

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Post()
async createTournamentAsAdmin(...) { ... }
```

### Gestion des erreurs

Tous les services utilisent les exceptions NestJS appropriées :
- `NotFoundException` : Ressource introuvable
- `BadRequestException` : Données invalides ou action impossible
- `ForbiddenException` : Accès refusé (pour les rôles)

### Transactions Prisma

Les opérations critiques utilisent `prisma.$transaction()` pour garantir l'intégrité :
- Création de `PrizePool` + mise à jour du statut du tournoi
- Débit du wallet + création de `TournamentEntry`

---

## 📚 Prochaines étapes et État

### Complété

- [x] **Afficher l'historique des tournois terminés** (15/12/2025)
- [x] **Implémenter le système de rôles et protection des endpoints admin** (Phase 4)
- [x] **Créer les matches lors du démarrage du tournoi** (Phase 5)
- [x] **Gérer la distribution des gains à la fin du tournoi** (Phase 6)

### À venir

- [ ] Implémenter les notifications pour les joueurs
- [ ] Ajouter un système de classement Elo dynamique
- [ ] Créer un dashboard admin avancé pour l'analyse des tournois

---

## ✅ État actuel

- ✅ Schéma Prisma mis à jour (READY status, registrationClosesAt, PrizePool complet)
- ✅ PrizePoolService implémenté avec calcul min/current/max
- ✅ TournamentsService implémenté avec toutes les méthodes
- ✅ TournamentsController avec endpoints publics et admin
- ✅ DTOs avec validation
- ✅ Intégration dans AppModule
- ✅ Code compilé sans erreur
- ✅ Protection des endpoints admin implémentée (Phase 4)
- ✅ **Historique des tournois terminés accessible via API** (15/12/2025)

---

**Date de création** : Décembre 2025  
**Dernière mise à jour** : Décembre 2025  
**Version** : 1.0.0

