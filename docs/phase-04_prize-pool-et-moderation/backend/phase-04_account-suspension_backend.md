# Suspension de Comptes - Documentation Backend

**Date de création** : 01 décembre 2025  
**Dernière mise à jour** : 01 décembre 2025  
**Statut** : ✅ Complété

---

## 📋 Vue d'ensemble

Ce document décrit l'implémentation du système de modération permettant de suspendre des comptes joueurs et de bloquer leur accès à la plateforme.

---

## 📋 Vue d'ensemble

Cette implémentation permet de :
- ✅ Suspendre un compte joueur via l'API admin
- ✅ Bloquer la connexion d'un compte suspendu
- ✅ Bloquer toutes les actions sensibles d'un joueur suspendu, même avec un token valide
- ✅ Retourner des erreurs claires et structurées pour le frontend

**⚠️ Important** : La suspension ne touche pas au système de rôles (PLAYER / ADMIN / SUPER_ADMIN). Elle s'applique uniquement via le champ `isActive`.

---

## 🎯 Champ `isActive`

### Définition

Le champ `isActive` dans le modèle `Player` indique si un compte est actif ou suspendu :

- **`isActive = true`** : Compte actif, le joueur peut se connecter et effectuer toutes les actions
- **`isActive = false`** : Compte suspendu, le joueur ne peut plus se connecter ni effectuer d'actions sensibles

### Schéma Prisma

```prisma
model Player {
  // ... autres champs ...
  isActive    Boolean   @default(true)
  // ... relations ...
}
```

Par défaut, tous les nouveaux comptes sont créés avec `isActive = true`.

---

## 🔒 Effets de la Suspension

### 1. Blocage du Login

Un joueur suspendu ne peut plus se connecter via `POST /auth/login`.

**Comportement** :
- Après validation des credentials (email + mot de passe)
- Si `player.isActive === false` → **403 Forbidden** avec code `ACCOUNT_SUSPENDED`

**Implémentation** : `AuthService.login()`

```typescript
// Vérifier que le compte n'est pas suspendu
if (!player.isActive) {
  throw new ForbiddenException({
    code: 'ACCOUNT_SUSPENDED',
    message: "Votre compte a été suspendu. Contactez le support si vous pensez qu'il s'agit d'une erreur.",
  });
}
```

### 2. Blocage des Actions Sensibles

Même si un joueur suspendu possède encore un token JWT valide, toutes les actions sensibles sont bloquées.

**Protection triple** :

1. **Au niveau JWT** (`JwtStrategy.validate()`) :
   - Lors de la validation du token, vérifie `isActive`
   - Si suspendu → **403 Forbidden** avec code `ACCOUNT_SUSPENDED`

2. **Au niveau Guard** (`ActivePlayerGuard`) :
   - Guard dédié qui vérifie `isActive` en temps réel
   - Appliqué sur tous les endpoints critiques

3. **Endpoints protégés** :
   - `GET /auth/me` - Récupération du profil
   - `GET /wallets/me` - Consultation du portefeuille
   - `POST /wallets/test-credit` - Crédit de test
   - `POST /tournaments/:id/join` - Inscription à un tournoi

**Format d'erreur** :
```json
{
  "statusCode": 403,
  "code": "ACCOUNT_SUSPENDED",
  "message": "Votre compte a été suspendu. Contactez le support si vous pensez qu'il s'agit d'une erreur."
}
```

---

## 🛠️ API Admin - Suspendre un Joueur

### Endpoint

**PATCH `/admin/players/:id/status`**

Suspendre ou réactiver un joueur (admin uniquement).

**Headers** :
```
Authorization: Bearer <admin-token>
```

**Body** :
```json
{
  "isActive": false
}
```

**Réponse** (200 OK) :
```json
{
  "id": "clxxx...",
  "username": "player1",
  "email": "player1@example.com",
  "countryCode": "FR",
  "role": "PLAYER",
  "isActive": false,
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

**Exemple avec curl** :
```bash
curl -X PATCH http://localhost:4000/admin/players/clxxx/status \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"isActive": false}'
```

### Réactiver un Compte

Pour réactiver un compte suspendu, utiliser le même endpoint avec `isActive: true` :

```bash
curl -X PATCH http://localhost:4000/admin/players/clxxx/status \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"isActive": true}'
```

---

## 🏗️ Architecture

### Guards

#### ActivePlayerGuard

Guard dédié qui vérifie que le joueur est actif avant d'autoriser l'accès à un endpoint.

**Fichier** : `backend/src/auth/guards/active-player.guard.ts`

```typescript
@Injectable()
export class ActivePlayerGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: JwtPayload = request.user;

    // Récupérer le joueur depuis la base de données pour vérifier isActive
    const player = await this.prisma.player.findUnique({
      where: { id: user.sub },
      select: { id: true, isActive: true },
    });

    if (!player || !player.isActive) {
      throw new ForbiddenException({
        code: 'ACCOUNT_SUSPENDED',
        message: "Votre compte a été suspendu. Contactez le support si vous pensez qu'il s'agit d'une erreur.",
      });
    }

    return true;
  }
}
```

**Utilisation** :
```typescript
@UseGuards(JwtAuthGuard, ActivePlayerGuard)
@Get('me')
async getProfile(@Request() req) {
  // ...
}
```

### Services

#### AuthService

Le service d'authentification vérifie `isActive` lors du login.

**Fichier** : `backend/src/auth/auth.service.ts`

```typescript
async login(loginDto: LoginDto) {
  // ... validation credentials ...
  
  // Vérifier que le compte n'est pas suspendu
  if (!player.isActive) {
    throw new ForbiddenException({
      code: 'ACCOUNT_SUSPENDED',
      message: "Votre compte a été suspendu. Contactez le support si vous pensez qu'il s'agit d'une erreur.",
    });
  }
  
  // ... génération token ...
}
```

#### JwtStrategy

La stratégie JWT vérifie `isActive` lors de la validation de chaque token.

**Fichier** : `backend/src/auth/strategies/jwt.strategy.ts`

```typescript
async validate(payload: JwtPayload): Promise<JwtPayload> {
  const player = await this.prisma.player.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, username: true, role: true, isActive: true },
  });

  if (!player) {
    throw new UnauthorizedException('Player not found');
  }

  if (!player.isActive) {
    throw new ForbiddenException({
      code: 'ACCOUNT_SUSPENDED',
      message: "Votre compte a été suspendu. Contactez le support si vous pensez qu'il s'agit d'une erreur.",
    });
  }

  return { sub: player.id, email: player.email, username: player.username, role: player.role };
}
```

---

## 🧪 Scénarios de Test

### Test 1 : Compte Actif - Comportement Normal

**Objectif** : Vérifier qu'un joueur actif peut effectuer toutes les actions.

**Étapes** :

1. **Créer un joueur A (actif)** :
   ```bash
   POST /players
   {
     "username": "playerA",
     "email": "playera@example.com",
     "password": "password123",
     "countryCode": "FR",
     "dateOfBirth": "1990-01-01"
   }
   ```

2. **Vérifier l'email** (si nécessaire) :
   ```bash
   POST /auth/verify-email
   { "token": "<verification-token>" }
   ```

3. **Se connecter** :
   ```bash
   POST /auth/login
   {
     "email": "playera@example.com",
     "password": "password123"
   }
   ```
   ✅ **Résultat attendu** : 200 OK avec token JWT

4. **Créditer le wallet** :
   ```bash
   POST /wallets/test-credit
   Authorization: Bearer <token>
   { "amountCents": 10000 }
   ```
   ✅ **Résultat attendu** : 200 OK avec nouveau solde

5. **Rejoindre un tournoi** :
   ```bash
   POST /tournaments/<tournament-id>/join
   Authorization: Bearer <token>
   ```
   ✅ **Résultat attendu** : 200 OK avec confirmation d'inscription

6. **Consulter le profil** :
   ```bash
   GET /auth/me
   Authorization: Bearer <token>
   ```
   ✅ **Résultat attendu** : 200 OK avec données du joueur

### Test 2 : Suspension d'un Compte

**Objectif** : Vérifier qu'un compte suspendu ne peut plus effectuer d'actions.

**Étapes** :

1. **Créer un joueur B (actif)** :
   ```bash
   POST /players
   {
     "username": "playerB",
     "email": "playerb@example.com",
     "password": "password123",
     "countryCode": "FR",
     "dateOfBirth": "1990-01-01"
   }
   ```

2. **Vérifier l'email et se connecter** :
   ```bash
   POST /auth/verify-email
   POST /auth/login
   ```
   ✅ **Résultat attendu** : Token JWT obtenu

3. **En tant qu'admin, suspendre le joueur B** :
   ```bash
   PATCH /admin/players/<playerB-id>/status
   Authorization: Bearer <admin-token>
   { "isActive": false }
   ```
   ✅ **Résultat attendu** : 200 OK avec `isActive: false`

4. **Tenter de se reconnecter avec le joueur B** :
   ```bash
   POST /auth/login
   {
     "email": "playerb@example.com",
     "password": "password123"
   }
   ```
   ❌ **Résultat attendu** : 403 Forbidden
   ```json
   {
     "statusCode": 403,
     "code": "ACCOUNT_SUSPENDED",
     "message": "Votre compte a été suspendu. Contactez le support si vous pensez qu'il s'agit d'une erreur."
   }
   ```

5. **Tenter d'utiliser un ancien token du joueur B** :
   ```bash
   GET /auth/me
   Authorization: Bearer <ancien-token-playerB>
   ```
   ❌ **Résultat attendu** : 403 Forbidden avec code `ACCOUNT_SUSPENDED`

   ```bash
   GET /wallets/me
   Authorization: Bearer <ancien-token-playerB>
   ```
   ❌ **Résultat attendu** : 403 Forbidden avec code `ACCOUNT_SUSPENDED`

   ```bash
   POST /tournaments/<id>/join
   Authorization: Bearer <ancien-token-playerB>
   ```
   ❌ **Résultat attendu** : 403 Forbidden avec code `ACCOUNT_SUSPENDED`

### Test 3 : Réactivation d'un Compte

**Objectif** : Vérifier qu'un compte réactivé peut à nouveau se connecter.

**Étapes** :

1. **Réactiver le joueur B** :
   ```bash
   PATCH /admin/players/<playerB-id>/status
   Authorization: Bearer <admin-token>
   { "isActive": true }
   ```
   ✅ **Résultat attendu** : 200 OK avec `isActive: true`

2. **Se reconnecter avec le joueur B** :
   ```bash
   POST /auth/login
   {
     "email": "playerb@example.com",
     "password": "password123"
   }
   ```
   ✅ **Résultat attendu** : 200 OK avec nouveau token JWT

3. **Effectuer des actions** :
   ```bash
   GET /auth/me
   GET /wallets/me
   ```
   ✅ **Résultat attendu** : 200 OK pour toutes les actions

---

## 📝 Notes Importantes

### Sécurité

- **Triple protection** : Login, JWT validation, et ActivePlayerGuard garantissent qu'un compte suspendu ne peut pas contourner la suspension
- **Vérification en temps réel** : `ActivePlayerGuard` fait une requête DB à chaque appel pour garantir que l'état est à jour
- **Pas de cache** : L'état `isActive` est toujours vérifié depuis la base de données, pas depuis le JWT

### Impact Métier

- **Suspension immédiate** : Dès qu'un admin suspend un compte, toutes les actions sont bloquées
- **Pas de déconnexion automatique** : Le frontend doit gérer l'affichage des erreurs `ACCOUNT_SUSPENDED` et déconnecter l'utilisateur si nécessaire
- **Réactivation simple** : Un compte peut être réactivé instantanément via l'API admin

### Différence avec les Rôles

- **Rôles** (`PLAYER`, `ADMIN`, `SUPER_ADMIN`) : Définissent les permissions d'accès aux fonctionnalités
- **isActive** : Définit si un compte peut être utilisé, indépendamment du rôle
- Un `ADMIN` suspendu ne peut pas se connecter, même s'il a les permissions admin

---

## 🔗 Voir Aussi

### Documentation Backend

- [Implémenter les rôles joueur et l'API admin](./phase-04_roles-admin-api_backend.md)
- [Renforcer l'authentification et la conformité légale](../../phase-01_auth-et-comptes-joueurs/backend/phase-01_auth-jwt-email-age-verification_backend.md)

### Documentation Frontend

- [Gérer les comptes suspendus côté frontend](../frontend/phase-04_suspended-accounts-ux_frontend.md) - Phase 4.6 Frontend

