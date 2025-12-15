# Restrictions Ciblées et Modération Avancée - Phase 4.7

Ce document décrit l'implémentation du système de restrictions ciblées permettant aux administrateurs de modérer finement les joueurs sans suspendre complètement leur compte.

**Date de création** : Phase 4.7  
**Statut** : ✅ Complété et testé

---

## 📋 Vue d'ensemble

Cette implémentation permet de :
- ✅ Bloquer uniquement l'accès aux tournois sans suspendre le compte
- ✅ Bloquer uniquement les dépôts wallet sans suspendre le compte
- ✅ Bloquer uniquement les retraits wallet sans suspendre le compte
- ✅ Ajouter des notes de modération pour tracer les actions admin
- ✅ Gérer ces restrictions via l'API admin
- ✅ Retourner des codes d'erreur explicites pour chaque type de restriction

**⚠️ Important** : Les restrictions ciblées sont des outils de modération "douce" qui n'empêchent pas le login (sauf si `isActive = false`). Elles s'ajoutent au système existant de suspension globale (`isActive`).

---

## 🎯 Nouveaux Champs Player

### Définition

Le modèle `Player` a été étendu avec les champs suivants pour permettre une modération fine :

| Champ | Type | Défaut | Description |
|-------|------|-------|-------------|
| `blockTournaments` | `Boolean` | `false` | Bloque l'accès aux tournois |
| `blockWalletDeposits` | `Boolean` | `false` | Bloque les dépôts wallet |
| `blockWalletWithdrawals` | `Boolean` | `false` | Bloque les retraits wallet |
| `moderationNote` | `String?` | `null` | Note optionnelle laissée par les admins |

### Schéma Prisma

```prisma
model Player {
  // ... autres champs ...
  isActive    Boolean   @default(true)
  
  // Restrictions ciblées (modération fine)
  blockTournaments       Boolean @default(false)
  blockWalletDeposits    Boolean @default(false)
  blockWalletWithdrawals Boolean @default(false)
  moderationNote         String?  // note laissée par les admins (optionnel)
  
  // ... autres champs ...
}
```

### Migration

La migration `20251208225309_add_player_restrictions_flags` a été créée et appliquée. Tous les joueurs existants ont ces champs à `false` par défaut.

---

## 🔒 Codes d'Erreur

### Nouveaux Codes d'Erreur

Le système utilise des codes d'erreur explicites pour chaque type de restriction :

| Code | Description | Endpoint(s) concerné(s) |
|------|-------------|-------------------------|
| `TOURNAMENTS_BLOCKED` | L'accès aux tournois est bloqué | `POST /tournaments/:id/join` |
| `DEPOSITS_BLOCKED` | Les dépôts sont bloqués | `POST /wallets/test-credit` (et futurs endpoints de dépôt) |
| `WITHDRAWALS_BLOCKED` | Les retraits sont bloqués | Endpoints de retrait (à venir) |

### Code Existant (Non Modifié)

| Code | Description | Endpoint(s) concerné(s) |
|------|-------------|-------------------------|
| `ACCOUNT_SUSPENDED` | Le compte est complètement suspendu (`isActive = false`) | Tous les endpoints protégés |

**⚠️ Hiérarchie des Restrictions** :
- `ACCOUNT_SUSPENDED` (via `isActive = false`) est la restriction la plus forte et bloque TOUT
- Les restrictions ciblées (`TOURNAMENTS_BLOCKED`, `DEPOSITS_BLOCKED`, `WITHDRAWALS_BLOCKED`) s'appliquent uniquement si `isActive = true`

---

## 🛠️ Service PlayerRestrictionsService

### Localisation

`src/moderation/player-restrictions.service.ts`

### Méthodes Disponibles

#### `assertCanJoinTournament(player: PlayerRestrictions): void`

Vérifie que le joueur peut rejoindre un tournoi.

**Vérifications** :
1. `isActive` doit être `true` → sinon lance `ACCOUNT_SUSPENDED`
2. `blockTournaments` doit être `false` → sinon lance `TOURNAMENTS_BLOCKED`

**Utilisation** :
```typescript
// Dans TournamentsService.joinTournament()
const player = await this.prisma.player.findUnique({
  where: { id: playerId },
  select: {
    id: true,
    isActive: true,
    blockTournaments: true,
    // ...
  },
});

this.playerRestrictionsService.assertCanJoinTournament(player);
```

#### `assertCanDeposit(player: PlayerRestrictions): void`

Vérifie que le joueur peut effectuer un dépôt.

**Vérifications** :
1. `isActive` doit être `true` → sinon lance `ACCOUNT_SUSPENDED`
2. `blockWalletDeposits` doit être `false` → sinon lance `DEPOSITS_BLOCKED`

**Utilisation** :
```typescript
// Dans WalletsService.testCredit()
const player = await this.prisma.player.findUnique({
  where: { id: playerId },
  select: {
    id: true,
    isActive: true,
    blockWalletDeposits: true,
    // ...
  },
});

this.playerRestrictionsService.assertCanDeposit(player);
```

#### `assertCanWithdraw(player: PlayerRestrictions): void`

Vérifie que le joueur peut effectuer un retrait.

**Vérifications** :
1. `isActive` doit être `true` → sinon lance `ACCOUNT_SUSPENDED`
2. `blockWalletWithdrawals` doit être `false` → sinon lance `WITHDRAWALS_BLOCKED`

**Utilisation** :
```typescript
// Dans WalletsService.withdraw() (à venir)
const player = await this.prisma.player.findUnique({
  where: { id: playerId },
  select: {
    id: true,
    isActive: true,
    blockWalletWithdrawals: true,
    // ...
  },
});

this.playerRestrictionsService.assertCanWithdraw(player);
```

### Type PlayerRestrictions

Le service accepte un type partiel pour plus de flexibilité :

```typescript
export type PlayerRestrictions = Pick<
  Player,
  'isActive' | 'blockTournaments' | 'blockWalletDeposits' | 'blockWalletWithdrawals'
>;
```

Cela permet de passer soit un `Player` complet, soit juste les champs nécessaires.

---

## 🔌 API Admin

### Endpoint : PATCH /admin/players/:id/restrictions

Permet aux ADMIN / SUPER_ADMIN de modifier les restrictions ciblées d'un joueur.

#### Authentification

- **Guards** : `JwtAuthGuard`, `RolesGuard`
- **Rôles autorisés** : `ADMIN`, `SUPER_ADMIN`

#### DTO : UpdatePlayerRestrictionsDto

```typescript
{
  blockTournaments?: boolean;        // Optionnel
  blockWalletDeposits?: boolean;     // Optionnel
  blockWalletWithdrawals?: boolean;  // Optionnel
  moderationNote?: string;           // Optionnel, max 1000 caractères
}
```

#### Exemple de Requête

```bash
PATCH /admin/players/clx1234567890/restrictions
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "blockTournaments": true,
  "moderationNote": "Comportement suspect dans les tournois - à surveiller"
}
```

#### Réponse

```json
{
  "id": "clx1234567890",
  "username": "player123",
  "email": "player@example.com",
  "countryCode": "FR",
  "role": "PLAYER",
  "isActive": true,
  "blockTournaments": true,
  "blockWalletDeposits": false,
  "blockWalletWithdrawals": false,
  "moderationNote": "Comportement suspect dans les tournois - à surveiller",
  "createdAt": "2024-01-15T10:00:00.000Z"
}
```

#### Comportement

- **Mise à jour partielle** : Seuls les champs fournis sont mis à jour
- **`moderationNote`** : Peut être défini à `null` ou une chaîne vide pour effacer la note
- **Validation** : Tous les champs sont validés via `class-validator`

### Endpoints Mis à Jour

Les endpoints suivants retournent maintenant les nouveaux champs :

#### GET /admin/players

Retourne la liste des joueurs avec les champs de restrictions :

```json
{
  "data": [
    {
      "id": "clx1234567890",
      "username": "player123",
      "email": "player@example.com",
      "countryCode": "FR",
      "role": "PLAYER",
      "isActive": true,
      "blockTournaments": false,
      "blockWalletDeposits": false,
      "blockWalletWithdrawals": false,
      "moderationNote": null,
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ],
  "total": 1,
  "skip": 0,
  "take": 50
}
```

#### GET /admin/players/:id

Retourne les détails d'un joueur avec les champs de restrictions (même format que ci-dessus).

---

## 🧪 Scénarios de Test

### Cas 1 : Joueur Actif Sans Restrictions

**Configuration** :
- `isActive = true`
- `blockTournaments = false`
- `blockWalletDeposits = false`
- `blockWalletWithdrawals = false`

**Résultats attendus** :
- ✅ `POST /auth/login` → 200 OK
- ✅ `GET /auth/me` → 200 OK
- ✅ `GET /wallets/me` → 200 OK
- ✅ `POST /tournaments/:id/join` → 200 OK (si conditions du tournoi remplies)
- ✅ `POST /wallets/test-credit` → 200 OK

**Test** :
```bash
# 1. Login
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "player@example.com", "password": "password123"}'

# 2. Join tournament
curl -X POST http://localhost:4000/tournaments/tournament-id/join \
  -H "Authorization: Bearer <token>"

# 3. Test credit
curl -X POST http://localhost:4000/wallets/test-credit \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"amountCents": 1000}'
```

---

### Cas 2 : Joueur avec blockTournaments = true

**Configuration** :
- `isActive = true`
- `blockTournaments = true`
- `blockWalletDeposits = false`
- `blockWalletWithdrawals = false`

**Résultats attendus** :
- ✅ `POST /auth/login` → 200 OK
- ✅ `GET /auth/me` → 200 OK
- ✅ `GET /wallets/me` → 200 OK
- ❌ `POST /tournaments/:id/join` → 403 Forbidden avec code `TOURNAMENTS_BLOCKED`
- ✅ `POST /wallets/test-credit` → 200 OK

**Test** :
```bash
# 1. Admin : Bloquer les tournois
curl -X PATCH http://localhost:4000/admin/players/player-id/restrictions \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"blockTournaments": true}'

# 2. Joueur : Tenter de rejoindre un tournoi
curl -X POST http://localhost:4000/tournaments/tournament-id/join \
  -H "Authorization: Bearer <player_token>"

# Réponse attendue :
# {
#   "statusCode": 403,
#   "message": {
#     "code": "TOURNAMENTS_BLOCKED",
#     "message": "Votre compte ne peut actuellement pas participer aux tournois. Contactez le support pour plus d'informations."
#   }
# }
```

---

### Cas 3 : Joueur avec blockWalletDeposits = true

**Configuration** :
- `isActive = true`
- `blockTournaments = false`
- `blockWalletDeposits = true`
- `blockWalletWithdrawals = false`

**Résultats attendus** :
- ✅ `POST /auth/login` → 200 OK
- ✅ `GET /auth/me` → 200 OK
- ✅ `GET /wallets/me` → 200 OK
- ✅ `POST /tournaments/:id/join` → 200 OK (si conditions du tournoi remplies)
- ❌ `POST /wallets/test-credit` → 403 Forbidden avec code `DEPOSITS_BLOCKED`

**Test** :
```bash
# 1. Admin : Bloquer les dépôts
curl -X PATCH http://localhost:4000/admin/players/player-id/restrictions \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"blockWalletDeposits": true}'

# 2. Joueur : Tenter un dépôt
curl -X POST http://localhost:4000/wallets/test-credit \
  -H "Authorization: Bearer <player_token>" \
  -H "Content-Type: application/json" \
  -d '{"amountCents": 1000}'

# Réponse attendue :
# {
#   "statusCode": 403,
#   "message": {
#     "code": "DEPOSITS_BLOCKED",
#     "message": "Les dépôts sont temporairement indisponibles sur votre compte. Contactez le support pour plus d'informations."
#   }
# }
```

---

### Cas 4 : Joueur avec isActive = false (Suspension Globale)

**Configuration** :
- `isActive = false`
- `blockTournaments = false` (ou `true`, peu importe)
- `blockWalletDeposits = false` (ou `true`, peu importe)
- `blockWalletWithdrawals = false` (ou `true`, peu importe)

**Résultats attendus** :
- ❌ `POST /auth/login` → 403 Forbidden avec code `ACCOUNT_SUSPENDED` (via `JwtStrategy`)
- ❌ `GET /auth/me` → 403 Forbidden avec code `ACCOUNT_SUSPENDED` (via `ActivePlayerGuard`)
- ❌ `GET /wallets/me` → 403 Forbidden avec code `ACCOUNT_SUSPENDED` (via `ActivePlayerGuard`)
- ❌ `POST /tournaments/:id/join` → 403 Forbidden avec code `ACCOUNT_SUSPENDED` (via `ActivePlayerGuard`)
- ❌ `POST /wallets/test-credit` → 403 Forbidden avec code `ACCOUNT_SUSPENDED` (via `ActivePlayerGuard`)

**⚠️ Important** : `ACCOUNT_SUSPENDED` prime sur toutes les autres restrictions. Si `isActive = false`, toutes les actions sont bloquées, même si les restrictions ciblées sont à `false`.

**Test** :
```bash
# 1. Admin : Suspendre le compte
curl -X PATCH http://localhost:4000/admin/players/player-id/status \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"isActive": false}'

# 2. Joueur : Tenter de se connecter
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "player@example.com", "password": "password123"}'

# Réponse attendue :
# {
#   "statusCode": 403,
#   "message": {
#     "code": "ACCOUNT_SUSPENDED",
#     "message": "Votre compte a été suspendu. Contactez le support si vous pensez qu'il s'agit d'une erreur."
#   }
# }
```

---

### Cas 5 : Combinaison de Restrictions

**Configuration** :
- `isActive = true`
- `blockTournaments = true`
- `blockWalletDeposits = true`
- `blockWalletWithdrawals = false`

**Résultats attendus** :
- ✅ `POST /auth/login` → 200 OK
- ✅ `GET /auth/me` → 200 OK
- ✅ `GET /wallets/me` → 200 OK
- ❌ `POST /tournaments/:id/join` → 403 `TOURNAMENTS_BLOCKED`
- ❌ `POST /wallets/test-credit` → 403 `DEPOSITS_BLOCKED`
- ✅ `POST /wallets/withdraw` → 200 OK (quand implémenté, car `blockWalletWithdrawals = false`)

**Test** :
```bash
# 1. Admin : Appliquer plusieurs restrictions
curl -X PATCH http://localhost:4000/admin/players/player-id/restrictions \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "blockTournaments": true,
    "blockWalletDeposits": true,
    "moderationNote": "Comportement suspect - restrictions multiples appliquées"
  }'
```

---

## 🔄 Compatibilité avec le Système Existant

### Guards Existants

Les guards suivants continuent de fonctionner comme avant :

- **`JwtStrategy`** : Vérifie `isActive` lors de la validation du token JWT
- **`ActivePlayerGuard`** : Vérifie `isActive` avant d'autoriser l'accès aux endpoints protégés

**⚠️ Important** : Ces guards bloquent TOUT si `isActive = false`, indépendamment des restrictions ciblées.

### Ordre de Vérification

L'ordre de vérification est le suivant :

1. **`JwtAuthGuard`** : Vérifie la validité du token
2. **`ActivePlayerGuard`** : Vérifie `isActive` → si `false`, lance `ACCOUNT_SUSPENDED` (bloque tout)
3. **`PlayerRestrictionsService`** : Vérifie les restrictions ciblées → si bloqué, lance le code d'erreur spécifique

Cet ordre garantit que :
- Un compte suspendu (`isActive = false`) ne peut rien faire
- Un compte actif avec restrictions ciblées peut toujours se connecter et accéder aux endpoints non restreints

---

## 🚀 Évolutivité

Le système est conçu pour être facilement extensible. Pour ajouter une nouvelle restriction :

1. **Ajouter le champ dans Prisma** :
   ```prisma
   blockChat Boolean @default(false)
   ```

2. **Créer une migration** :
   ```bash
   npx prisma migrate dev --name add_block_chat
   ```

3. **Ajouter la méthode dans PlayerRestrictionsService** :
   ```typescript
   assertCanChat(player: PlayerRestrictions): void {
     if (!player.isActive) {
       throw new ForbiddenException({
         code: 'ACCOUNT_SUSPENDED',
         message: "...",
       });
     }
     if (player.blockChat) {
       throw new ForbiddenException({
         code: 'CHAT_BLOCKED',
         message: "...",
       });
     }
   }
   ```

4. **Utiliser dans les services concernés** :
   ```typescript
   this.playerRestrictionsService.assertCanChat(player);
   ```

5. **Ajouter au DTO admin** :
   ```typescript
   blockChat?: boolean;
   ```

6. **Mettre à jour l'API admin** :
   ```typescript
   if (restrictions.blockChat !== undefined) {
     updateData.blockChat = restrictions.blockChat;
   }
   ```

---

## 📝 Notes Importantes

1. **Les restrictions ciblées ne bloquent PAS le login** : Seul `isActive = false` bloque le login
2. **Les restrictions ciblées sont indépendantes** : On peut bloquer uniquement les tournois, uniquement les dépôts, ou une combinaison
3. **`ACCOUNT_SUSPENDED` prime sur tout** : Si `isActive = false`, toutes les actions sont bloquées
4. **Les rôles ne sont pas modifiables** : L'API admin ne permet pas de modifier les rôles (gérés uniquement via bootstrap/DB)
5. **La modérationNote est optionnelle** : Elle peut être utilisée pour tracer les actions admin

---

## ✅ Checklist de Déploiement

- [x] Migration Prisma créée et appliquée
- [x] Client Prisma régénéré
- [x] Service `PlayerRestrictionsService` créé
- [x] Module `ModerationModule` créé et enregistré
- [x] Intégration dans `TournamentsService.joinTournament()`
- [x] Intégration dans `WalletsService.testCredit()`
- [x] Méthode `withdraw()` préparée dans `WalletsService`
- [x] DTO `UpdatePlayerRestrictionsDto` créé
- [x] Endpoint `PATCH /admin/players/:id/restrictions` créé
- [x] Endpoints GET mis à jour pour inclure les nouveaux champs
- [x] Documentation créée
- [ ] Tests manuels effectués
- [ ] Tests automatisés (à venir)

---

## 📚 Références

- [Bloquer la connexion des comptes suspendus](./phase-04_account-suspension_backend.md) - Phase 4.6
- [Implémenter les rôles joueur et l'API admin](./phase-04_roles-admin-api_backend.md) - Phase 4.3
- [Frontend - Développer restrictions ciblées joueurs](../frontend/phase-04_targeted-restrictions-ui_frontend.md) - Phase 4.7

---

**Dernière mise à jour** : Phase 4.7

