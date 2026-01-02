# Transactions et Gestion Portefeuilles - Documentation Backend

**Date de création** : 01 décembre 2025  
**Dernière mise à jour** : 01 décembre 2025  
**Statut** : ✅ Complété

---

## 📋 Vue d'ensemble

Ce document décrit la création du module `Transactions` centralisé et l'extension du module `Wallets` pour gérer tous les mouvements financiers de la plateforme Elite64.

---

## 📋 Vue d'ensemble

Cette implémentation permet de :
- ✅ Centraliser tous les mouvements financiers dans un module `Transactions`
- ✅ Garantir l'intégrité des données avec des transactions Prisma atomiques
- ✅ Exposer les wallets avec leurs transactions pour les joueurs connectés
- ✅ Fournir un endpoint de test pour créditer les wallets (DEV uniquement)
- ✅ Préparer le terrain pour les futures opérations de tournois

---

## 🏗️ Architecture

### Structure des modules

```
backend/src/
├── transactions/
│   ├── transactions.module.ts          # Module Transactions
│   ├── transactions.service.ts         # Service avec logique métier
│   └── transactions.controller.ts      # Controller (routes futures)
├── wallets/
│   ├── wallets.module.ts               # Module Wallets (étendu)
│   ├── wallets.service.ts              # Service étendu
│   └── wallets.controller.ts           # Controller avec nouvelles routes
└── app.module.ts                       # Modules intégrés
```

---

## 💰 Module Transactions

### 1. TransactionsService (`src/transactions/transactions.service.ts`)

Service centralisé pour gérer tous les mouvements financiers. **Tous les mouvements d'argent doivent passer par ce service.**

#### Interface `CreateTransactionParams`

```typescript
interface CreateTransactionParams {
  walletId: string;
  type: TransactionType;
  amountCents: number;      // POSITIF ou NEGATIF selon la logique métier
  description?: string;
  externalRef?: string | null;
}
```

#### Méthode principale : `createTransactionAndUpdateWallet()`

**Fonctionnalité** : Crée une transaction et met à jour le wallet dans une **seule transaction Prisma atomique**.

**Logique** :
1. Vérifie que `amountCents != 0`
2. Récupère le wallet
3. Calcule le nouveau solde : `balanceCents + amountCents`
4. Vérifie que le solde ne devient pas négatif (lance `BadRequestException` si fonds insuffisants)
5. Utilise `prisma.$transaction([...])` pour :
   - Créer la `Transaction`
   - Mettre à jour le `Wallet.balanceCents`
6. Retourne la transaction créée + le nouveau solde

**Points critiques** :
- ⚠️ **JAMAIS** mettre à jour `balanceCents` directement ailleurs dans le code
- ⚠️ Tous les mouvements doivent passer par cette méthode
- ⚠️ La transaction Prisma garantit l'atomicité (si une opération échoue, tout est annulé)

**Exemple d'utilisation** :
```typescript
const result = await transactionsService.createTransactionAndUpdateWallet({
  walletId: 'wallet-id',
  type: TransactionType.DEPOSIT,
  amountCents: 10000, // 100,00 € en centimes
  description: 'Dépôt initial',
  externalRef: 'stripe-payment-id-123',
});
```

#### Méthode : `creditWallet()`

**Fonctionnalité** : Crédite un wallet (montant positif).

**Logique** :
1. Vérifie que `amountCents > 0`
2. Appelle `createTransactionAndUpdateWallet()` avec `amountCents` positif

**Exemple d'utilisation** :
```typescript
await transactionsService.creditWallet({
  walletId: 'wallet-id',
  type: TransactionType.BONUS,
  amountCents: 5000, // 50,00 €
  description: 'Bonus de bienvenue',
});
```

#### Méthode : `debitWallet()`

**Fonctionnalité** : Débite un wallet (montant négatif).

**Logique** :
1. Vérifie que `amountCents > 0` (le paramètre est positif)
2. Appelle `createTransactionAndUpdateWallet()` avec `amountCents` **NEGATIF**

**Exemple d'utilisation** :
```typescript
await transactionsService.debitWallet({
  walletId: 'wallet-id',
  type: TransactionType.WITHDRAWAL,
  amountCents: 2000, // Sera transformé en -2000 (débit de 20,00 €)
  description: 'Retrait vers compte bancaire',
});
```

#### Méthode : `findTransactionsByWallet()`

**Fonctionnalité** : Récupère les transactions d'un wallet, triées par date décroissante.

**Paramètres** :
- `walletId: string` : ID du wallet
- `options?: { skip?: number; take?: number }` : Pagination optionnelle

**Exemple d'utilisation** :
```typescript
const transactions = await transactionsService.findTransactionsByWallet(
  'wallet-id',
  { skip: 0, take: 50 }
);
```

### 2. TransactionsController (`src/transactions/transactions.controller.ts`)

Controller minimal pour l'instant. Les routes seront ajoutées au fur et à mesure des besoins.

**Note** : Le service est principalement utilisé par d'autres modules (Wallets, Tournaments, etc.) plutôt que d'être exposé directement via des routes publiques.

### 3. TransactionsModule (`src/transactions/transactions.module.ts`)

Module NestJS qui assemble le service et le controller.

```typescript
import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService], // Exporté pour être utilisé par d'autres modules
})
export class TransactionsModule {}
```

---

## 💳 Module Wallets (Extension)

### 1. WalletsService (`src/wallets/wallets.service.ts`) - Étendu

Le service a été étendu avec deux nouvelles méthodes :

#### Méthode : `findMyWalletWithTransactions()`

**Fonctionnalité** : Récupère le wallet du joueur connecté avec ses transactions.

**Logique** :
1. Récupère le wallet par `playerId`
2. Inclut les 50 dernières transactions (triées par `createdAt DESC`)
3. Lance `NotFoundException` si le wallet n'existe pas

**Exemple de réponse** :
```json
{
  "id": "wallet-id",
  "playerId": "player-id",
  "balanceCents": 15000,
  "currency": "EUR",
  "createdAt": "2025-12-05T10:30:00.000Z",
  "updatedAt": "2025-12-05T10:30:00.000Z",
  "transactions": [
    {
      "id": "transaction-id-1",
      "type": "DEPOSIT",
      "amountCents": 10000,
      "description": "Dépôt initial",
      "createdAt": "2025-12-05T10:30:00.000Z"
    },
    {
      "id": "transaction-id-2",
      "type": "BONUS",
      "amountCents": 5000,
      "description": "Bonus de bienvenue",
      "createdAt": "2025-12-05T10:25:00.000Z"
    }
  ]
}
```

#### Méthode : `testCredit()`

**Fonctionnalité** : Endpoint DEV uniquement pour créditer un wallet de test.

**Sécurité** :
- ⚠️ **BLOQUÉ en production** : Lance `ForbiddenException` si `NODE_ENV === 'production'`
- ⚠️ Nécessite une authentification JWT (via le controller)

**Logique** :
1. Vérifie que nous sommes en mode développement
2. Récupère le wallet du joueur
3. Crédite le wallet via `TransactionsService.creditWallet()` avec le type `BONUS`

**Exemple d'utilisation** :
```typescript
await walletsService.testCredit('player-id', 10000); // Crédite 100,00 €
```

### 2. WalletsController (`src/wallets/wallets.controller.ts`) - Étendu

Le controller a été étendu avec deux nouvelles routes :

#### Route : `GET /wallets/me`

**Fonctionnalité** : Récupère le wallet du joueur connecté avec ses transactions.

**Sécurité** :
- ✅ Protégé par `JwtAuthGuard`
- ✅ Utilise `req.user.sub` pour identifier le joueur

**Exemple de requête** :
```powershell
# Avec token JWT dans le header Authorization
Invoke-RestMethod -Uri http://localhost:4000/wallets/me -Headers @{Authorization="Bearer YOUR_JWT_TOKEN"}
```

**Exemple de réponse** :
```json
{
  "id": "wallet-id",
  "playerId": "player-id",
  "balanceCents": 15000,
  "currency": "EUR",
  "createdAt": "2025-12-05T10:30:00.000Z",
  "updatedAt": "2025-12-05T10:30:00.000Z",
  "transactions": [...]
}
```

#### Route : `POST /wallets/test-credit`

**Fonctionnalité** : Crédite le wallet du joueur connecté (DEV uniquement).

**Sécurité** :
- ✅ Protégé par `JwtAuthGuard`
- ✅ Bloqué en production (vérifié dans le service)

**Body de la requête** :
```json
{
  "amountCents": 10000
}
```

**Exemple de requête** :
```powershell
$body = @{ amountCents = 10000 } | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:4000/wallets/test-credit -Method POST -Body $body -ContentType "application/json" -Headers @{Authorization="Bearer YOUR_JWT_TOKEN"}
```

**Exemple de réponse** :
```json
{
  "transaction": {
    "id": "transaction-id",
    "walletId": "wallet-id",
    "type": "BONUS",
    "amountCents": 10000,
    "description": "Crédit de test (DEV uniquement)",
    "externalRef": null,
    "createdAt": "2025-12-05T10:30:00.000Z"
  },
  "newBalanceCents": 25000
}
```

### 3. WalletsModule (`src/wallets/wallets.module.ts`) - Mis à jour

Le module importe maintenant `TransactionsModule` pour utiliser `TransactionsService` :

```typescript
import { Module } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { WalletsController } from './wallets.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
  imports: [PrismaModule, TransactionsModule], // TransactionsModule ajouté
  controllers: [WalletsController],
  providers: [WalletsService],
  exports: [WalletsService],
})
export class WalletsModule {}
```

#### ⚠️ Important : Ordre des routes dans le Controller

**Problème rencontré** : Si la route paramétrée `@Get(':playerId')` est définie avant la route spécifique `@Get('me')`, NestJS va capturer "me" comme un `playerId`, ce qui provoque une erreur.

**Solution** : Toujours placer les routes spécifiques **AVANT** les routes paramétrées dans le controller.

**Ordre correct dans `WalletsController`** :

```typescript
@Controller('wallets')
export class WalletsController {
  // 1. Routes spécifiques en premier
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyWallet(@Request() req) { ... }

  @UseGuards(JwtAuthGuard)
  @Post('test-credit')
  async testCredit(@Request() req, @Body() body) { ... }

  // 2. Routes paramétrées en dernier
  @Get(':playerId')
  findByPlayerId(@Param('playerId') playerId: string) { ... }
}
```

**Règle générale** : Dans NestJS, les routes sont évaluées dans l'ordre où elles sont définies. Les routes spécifiques doivent toujours précéder les routes paramétrées pour éviter les conflits.

---

## 🔗 Intégration dans AppModule

Le `TransactionsModule` a été ajouté aux imports de `AppModule` :

```typescript
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { PlayersModule } from './players/players.module';
import { WalletsModule } from './wallets/wallets.module';
import { TransactionsModule } from './transactions/transactions.module'; // Nouveau
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    PrismaModule,
    MailModule,
    AuthModule,
    PlayersModule,
    WalletsModule,
    TransactionsModule, // Ajouté
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

---

## 📊 Types de Transactions

Le schéma Prisma définit les types suivants dans l'enum `TransactionType` :

| Type | Montant | Description |
|------|---------|-------------|
| `DEPOSIT` | Positif | Dépôt d'argent (ex: virement bancaire, carte) |
| `WITHDRAWAL` | Négatif | Retrait d'argent vers compte bancaire |
| `TOURNAMENT_BUY_IN` | Négatif | Achat d'entrée à un tournoi |
| `TOURNAMENT_PAYOUT` | Positif | Gain d'un tournoi (prize pool) |
| `BONUS` | Positif | Bonus offert par la plateforme |
| `FEE` | Négatif | Frais de la plateforme |

**Règle importante** :
- Les montants sont stockés en **centimes** (int)
- Les montants **positifs** = crédit (dépôt, gain, bonus)
- Les montants **négatifs** = débit (retrait, buy-in, frais)

---

## 🔒 Règles de sécurité et intégrité

### 1. Transaction atomique obligatoire

**Règle** : Tous les mouvements d'argent doivent passer par `TransactionsService.createTransactionAndUpdateWallet()` qui utilise `prisma.$transaction()`.

**Pourquoi** :
- Garantit que la transaction ET la mise à jour du wallet se font ensemble
- Si une opération échoue, tout est annulé (rollback)
- Évite les incohérences (ex: transaction créée mais wallet non mis à jour)

**Exemple de code interdit** :
```typescript
// ❌ JAMAIS faire ça
await prisma.transaction.create({ ... });
await prisma.wallet.update({ data: { balanceCents: newBalance } });
```

**Exemple de code correct** :
```typescript
// ✅ Toujours utiliser le service
await transactionsService.createTransactionAndUpdateWallet({ ... });
```

### 2. Ne jamais modifier balanceCents directement

**Règle** : Le champ `balanceCents` du wallet ne doit **JAMAIS** être modifié directement ailleurs dans le code.

**Pourquoi** :
- Tous les mouvements doivent être tracés dans la table `Transaction`
- Le solde est calculé automatiquement lors de la création de transactions
- Garantit l'auditabilité et la traçabilité

**Exemple de code interdit** :
```typescript
// ❌ JAMAIS faire ça
await prisma.wallet.update({
  where: { id: walletId },
  data: { balanceCents: 10000 } // Modification directe interdite
});
```

### 3. Vérification des fonds insuffisants

**Règle** : Avant de débiter un wallet, le service vérifie que le solde ne devient pas négatif.

**Comportement** :
- Si `newBalanceCents < 0`, lance `BadRequestException` avec le message "Fonds insuffisants"
- La transaction n'est pas créée et le wallet n'est pas modifié

**Exemple** :
```typescript
// Wallet avec balanceCents = 5000 (50,00 €)
// Tentative de débit de 10000 (100,00 €)
await transactionsService.debitWallet({
  walletId: 'wallet-id',
  type: TransactionType.WITHDRAWAL,
  amountCents: 10000, // Sera transformé en -10000
});
// ❌ Lance BadRequestException : "Fonds insuffisants"
```

### 4. Endpoint de test bloqué en production

**Règle** : L'endpoint `POST /wallets/test-credit` est bloqué en production.

**Implémentation** :
- Vérifie `process.env.NODE_ENV === 'production'`
- Lance `ForbiddenException` si en production
- Uniquement disponible en développement

---

## 🧪 Tests et exemples d'utilisation

### 1. Créditer un wallet (via le service)

```typescript
// Dans un autre service ou controller
const result = await transactionsService.creditWallet({
  walletId: 'wallet-id',
  type: TransactionType.DEPOSIT,
  amountCents: 10000, // 100,00 €
  description: 'Dépôt initial',
  externalRef: 'stripe-payment-id-123',
});

console.log(result.newBalanceCents); // Nouveau solde en centimes
```

### 2. Débiter un wallet (via le service)

```typescript
const result = await transactionsService.debitWallet({
  walletId: 'wallet-id',
  type: TransactionType.WITHDRAWAL,
  amountCents: 5000, // Sera transformé en -5000 (débit de 50,00 €)
  description: 'Retrait vers compte bancaire',
});

console.log(result.newBalanceCents); // Nouveau solde en centimes
```

### 3. Récupérer les transactions d'un wallet

```typescript
const transactions = await transactionsService.findTransactionsByWallet(
  'wallet-id',
  { skip: 0, take: 50 } // Pagination optionnelle
);

console.log(transactions); // Tableau de transactions triées par date DESC
```

### 4. Tester l'endpoint GET /wallets/me

**Prérequis** : Avoir un token JWT valide (obtenu via `/auth/login`)

```powershell
# 1. Se connecter pour obtenir un token
$loginBody = @{
    email = "test@example.com"
    password = "password123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri http://localhost:4000/auth/login -Method POST -Body $loginBody -ContentType "application/json"
$token = $response.access_token

# 2. Récupérer le wallet avec transactions
Invoke-RestMethod -Uri http://localhost:4000/wallets/me -Headers @{Authorization="Bearer $token"}
```

**Résultat attendu** :
```json
{
  "id": "wallet-id",
  "playerId": "player-id",
  "balanceCents": 15000,
  "currency": "EUR",
  "createdAt": "2025-12-05T10:30:00.000Z",
  "updatedAt": "2025-12-05T10:30:00.000Z",
  "transactions": [
    {
      "id": "transaction-id",
      "type": "DEPOSIT",
      "amountCents": 10000,
      "description": "Dépôt initial",
      "createdAt": "2025-12-05T10:30:00.000Z"
    }
  ]
}
```

### 5. Tester l'endpoint POST /wallets/test-credit (DEV uniquement)

**Prérequis** : 
- Avoir un token JWT valide
- Être en mode développement (`NODE_ENV !== 'production'`)

```powershell
# 1. Se connecter pour obtenir un token
$loginBody = @{
    email = "test@example.com"
    password = "password123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri http://localhost:4000/auth/login -Method POST -Body $loginBody -ContentType "application/json"
$token = $response.access_token

# 2. Créditer le wallet de test
$creditBody = @{ amountCents = 10000 } | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:4000/wallets/test-credit -Method POST -Body $creditBody -ContentType "application/json" -Headers @{Authorization="Bearer $token"}
```

**Résultat attendu** :
```json
{
  "transaction": {
    "id": "transaction-id",
    "walletId": "wallet-id",
    "type": "BONUS",
    "amountCents": 10000,
    "description": "Crédit de test (DEV uniquement)",
    "externalRef": null,
    "createdAt": "2025-12-05T10:30:00.000Z"
  },
  "newBalanceCents": 25000
}
```

**En production** :
```json
{
  "statusCode": 403,
  "message": "Cette fonctionnalité n'est pas disponible en production"
}
```

---

## 🔄 Préparation pour les futures opérations de tournois

Le module `Transactions` est conçu pour supporter les futures opérations de tournois :

### Types de transactions prévus

1. **TOURNAMENT_BUY_IN** (négatif)
   - Débité lors de l'inscription à un tournoi
   - Montant = `tournament.buyInCents`

2. **TOURNAMENT_PAYOUT** (positif)
   - Crédité lors de la distribution des gains
   - Montant calculé selon la position dans le tournoi

### Exemple d'utilisation future

```typescript
// Lors de l'inscription à un tournoi
await transactionsService.debitWallet({
  walletId: playerWallet.id,
  type: TransactionType.TOURNAMENT_BUY_IN,
  amountCents: tournament.buyInCents,
  description: `Buy-in pour le tournoi "${tournament.name}"`,
  externalRef: tournamentEntry.id,
});

// Lors de la distribution des gains
await transactionsService.creditWallet({
  walletId: winnerWallet.id,
  type: TransactionType.TOURNAMENT_PAYOUT,
  amountCents: prizeAmountCents,
  description: `Gain du tournoi "${tournament.name}" - Position #${position}`,
  externalRef: tournamentEntry.id,
});
```

---

## ⚠️ Points d'attention

### 1. Concurrence et verrous

**Problème potentiel** : Si deux transactions sont créées simultanément pour le même wallet, il pourrait y avoir des conditions de course.

**Solution actuelle** : Les transactions Prisma sont isolées, mais pour une sécurité maximale en production, on pourrait ajouter des verrous de ligne :

```typescript
// Option future : utiliser SELECT FOR UPDATE
const wallet = await tx.wallet.findUnique({
  where: { id: walletId },
  // SELECT FOR UPDATE verrouille la ligne jusqu'à la fin de la transaction
});
```

### 2. Montants en centimes

**Règle** : Tous les montants sont stockés en centimes (int).

**Exemples** :
- `10000` = 100,00 €
- `500` = 5,00 €
- `-2000` = -20,00 € (débit)

**Attention** : Lors de l'affichage dans le frontend, diviser par 100 pour obtenir les euros.

### 3. Traçabilité

**Règle** : Tous les mouvements sont tracés dans la table `Transaction`.

**Champs importants** :
- `type` : Type de transaction
- `amountCents` : Montant en centimes (positif ou négatif)
- `description` : Description optionnelle
- `externalRef` : Référence externe optionnelle (ex: ID de paiement Stripe, ID d'entrée de tournoi)
- `createdAt` : Horodatage automatique

### 4. Performance

**Optimisation** : La méthode `findMyWalletWithTransactions()` limite à 50 transactions par défaut. Pour charger plus, utiliser la pagination :

```typescript
const transactions = await transactionsService.findTransactionsByWallet(
  walletId,
  { skip: 0, take: 100 } // Charger 100 transactions
);
```

---

## 📚 Structure du schéma Prisma

### Modèle Transaction

```prisma
model Transaction {
  id          String          @id @default(cuid())
  createdAt   DateTime        @default(now())
  walletId    String
  type        TransactionType
  amountCents Int             // positif pour dépôt/payout, négatif pour withdrawal/buy-in
  description String?
  externalRef String?         // id Stripe ou autre PSP plus tard

  // Relations
  wallet Wallet @relation(fields: [walletId], references: [id], onDelete: Cascade)

  @@map("transactions")
  @@index([walletId])
  @@index([type])
  @@index([createdAt])
  @@index([externalRef])
}
```

### Modèle Wallet

```prisma
model Wallet {
  id           String   @id @default(cuid())
  playerId     String   @unique
  balanceCents Int      @default(0)
  currency     String   @default("EUR")
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // Relations
  player      Player       @relation(fields: [playerId], references: [id], onDelete: Cascade)
  transactions Transaction[]

  @@map("wallets")
  @@index([playerId])
}
```

---

## ✅ Checklist de validation

- [x] TransactionsModule créé avec service et controller
- [x] TransactionsService implémenté avec toutes les méthodes demandées
- [x] Transaction atomique Prisma pour créer transaction + mettre à jour wallet
- [x] Vérification des fonds insuffisants avant débit
- [x] WalletsService étendu avec `findMyWalletWithTransactions()` et `testCredit()`
- [x] WalletsController étendu avec `GET /wallets/me` et `POST /wallets/test-credit`
- [x] Protection JWT pour les routes `/wallets/me` et `/wallets/test-credit`
- [x] Ordre des routes corrigé (routes spécifiques avant routes paramétrées)
- [x] Blocage de l'endpoint de test en production
- [x] WalletsModule importe TransactionsModule
- [x] AppModule importe TransactionsModule
- [x] Tous les mouvements passent par TransactionsService
- [x] `balanceCents` jamais modifié directement ailleurs
- [x] Montants stockés en centimes (int)
- [x] Montants positifs pour crédits, négatifs pour débits
- [x] Documentation complète

---

## 🔄 Prochaines étapes

### Modules à développer

1. **Module Tournaments** : Utilisera `TransactionsService` pour les buy-ins et payouts
2. **Module Payments** : Intégration avec Stripe/PayPal, utilisera `TransactionsService` pour les dépôts
3. **Module Withdrawals** : Gestion des retraits, utilisera `TransactionsService.debitWallet()`

### Fonctionnalités à ajouter

- Historique complet des transactions avec filtres (type, date, montant)
- Export des transactions en CSV/PDF
- Notifications par email lors de transactions importantes
- Limites de dépôt/retrait par joueur
- Vérification KYC avant retrait

---

## 📚 Ressources

- [Documentation Prisma Transactions](https://www.prisma.io/docs/concepts/components/prisma-client/transactions)
- [Documentation NestJS Modules](https://docs.nestjs.com/modules)
- [Documentation NestJS Guards](https://docs.nestjs.com/guards)

---

**Statut final** : ✅ **100% complété**

Le module Transactions est prêt à être utilisé par les autres modules de l'application pour gérer tous les mouvements financiers de manière centralisée et sécurisée.

