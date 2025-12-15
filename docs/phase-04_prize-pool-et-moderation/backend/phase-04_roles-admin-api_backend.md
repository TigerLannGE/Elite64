# Implémenter les rôles joueur et l'API admin - Backend

## 📋 Vue d'ensemble

Ce document décrit l'implémentation du système de rôles pour les joueurs et l'API admin v1 permettant de gérer les joueurs et les tournois.

**Date de création** : Phase 4.5  
**Statut** : ✅ Complété et testé

## 🎭 Système de rôles

### Enum PlayerRole

Le système utilise un enum Prisma `PlayerRole` avec trois valeurs :

- **PLAYER** : Rôle par défaut pour tous les nouveaux joueurs
- **ADMIN** : Administrateur avec accès aux fonctionnalités d'administration
- **SUPER_ADMIN** : Super administrateur avec tous les droits (peut faire tout ce qu'un ADMIN peut faire)

### Schéma Prisma

```prisma
enum PlayerRole {
  PLAYER
  ADMIN
  SUPER_ADMIN
}

model Player {
  // ...
  role        PlayerRole @default(PLAYER)
  isActive    Boolean   @default(true)
  // ...
}
```

### Règles de promotion

1. **Inscription** : Tous les nouveaux joueurs sont automatiquement créés avec `role = PLAYER`
   - Aucun DTO public n'accepte le champ `role`
   - Le rôle est défini uniquement par la valeur par défaut Prisma

2. **Promotion en SUPER_ADMIN** : Automatique via bootstrap au démarrage
   - Variable d'environnement : `SUPER_ADMIN_EMAIL=florian.lantigner@ik.me`
   - Le service `AdminBootstrapService` s'exécute au démarrage (`OnModuleInit`)
   - Si un joueur avec cet email existe, il est automatiquement promu en `SUPER_ADMIN`

3. **Promotion en ADMIN** : Uniquement via modification directe en base de données
   - Aucun endpoint HTTP public ne permet de changer le rôle
   - Modification manuelle via script SQL ou outil d'administration

### Inclusion dans le JWT

Le rôle est inclus dans le payload JWT :

```typescript
interface JwtPayload {
  sub: string;      // player.id
  email: string;
  username: string;
  role: PlayerRole;
}
```

Le rôle est également renvoyé dans la réponse `/auth/me`.

## 🚫 Phase 4.6 – Modération & isActive

### Vue d'ensemble

En plus du système de rôles, la plateforme dispose d'un système de modération via le champ `isActive` qui permet de suspendre des comptes joueurs.

### Champ `isActive`

Le champ `isActive` dans le modèle `Player` contrôle l'accès à la plateforme :

- **`isActive = true`** : Compte actif, le joueur peut se connecter et effectuer toutes les actions
- **`isActive = false`** : Compte suspendu, le joueur ne peut plus se connecter ni effectuer d'actions sensibles

**Important** : La suspension est indépendante du système de rôles. Un `ADMIN` suspendu ne peut pas se connecter, même s'il a les permissions admin.

### Effets de la Suspension

#### 1. Login refusé

Un joueur suspendu ne peut plus se connecter via `POST /auth/login`.

**Comportement** :
- Après validation des credentials (email + mot de passe)
- Si `player.isActive === false` → **403 Forbidden** avec code `ACCOUNT_SUSPENDED`

**Format d'erreur** :
```json
{
  "statusCode": 403,
  "code": "ACCOUNT_SUSPENDED",
  "message": "Votre compte a été suspendu. Contactez le support si vous pensez qu'il s'agit d'une erreur."
}
```

#### 2. Actions joueurs critiques refusées

Même si un joueur suspendu possède encore un token JWT valide, toutes les actions sensibles sont bloquées via le `ActivePlayerGuard`.

**Endpoints protégés** :
- `GET /auth/me` - Récupération du profil
- `GET /wallets/me` - Consultation du portefeuille
- `POST /wallets/test-credit` - Crédit de test
- `POST /tournaments/:id/join` - Inscription à un tournoi

**Protection triple** :
1. **Au login** : `AuthService.login()` vérifie `isActive`
2. **Au niveau JWT** : `JwtStrategy.validate()` vérifie `isActive`
3. **Sur les endpoints** : `ActivePlayerGuard` vérifie `isActive` en temps réel

### Comment Suspendre un Joueur

#### Via l'API Admin

**Endpoint** : `PATCH /admin/players/:id/status`

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

**Exemple** :
```bash
curl -X PATCH http://localhost:4000/admin/players/clxxx/status \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"isActive": false}'
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

#### Réactiver un Compte

Pour réactiver un compte suspendu, utiliser le même endpoint avec `isActive: true` :

```bash
curl -X PATCH http://localhost:4000/admin/players/clxxx/status \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"isActive": true}'
```

### Scénarios de Test

#### Test 1 : Compte Actif - Comportement Normal

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

2. **Se connecter, créditer wallet, rejoindre tournoi** → ✅ Toutes les actions doivent fonctionner

#### Test 2 : Suspension d'un Compte

1. **Créer un joueur B (actif)** et se connecter → ✅ Token obtenu

2. **En tant qu'admin, suspendre B** :
   ```bash
   PATCH /admin/players/<playerB-id>/status
   { "isActive": false }
   ```

3. **Tenter de se relogger avec B** :
   ```bash
   POST /auth/login
   {
     "email": "playerb@example.com",
     "password": "password123"
   }
   ```
   ❌ **Résultat attendu** : 403 Forbidden avec code `ACCOUNT_SUSPENDED`

4. **Tenter d'utiliser un ancien token de B** :
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

**Résultat attendu** : L'admin a un vrai pouvoir de modération qui a un impact immédiat sur le comportement métier.

### Documentation Complète

Pour plus de détails, voir : [Bloquer la connexion des comptes suspendus](./phase-04_account-suspension_backend.md)

## 🔒 Protection des endpoints admin

### Guards utilisés

Tous les endpoints `/admin/*` sont protégés par :

1. **JwtAuthGuard** : Vérifie que l'utilisateur est authentifié (JWT valide)
2. **RolesGuard** : Vérifie que l'utilisateur a le rôle requis

### Décorateur @Roles

```typescript
import { ADMIN_ROLES } from '../auth/decorators/roles.decorator';

@Controller('admin/players')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ADMIN_ROLES)  // [ADMIN, SUPER_ADMIN]
export class AdminPlayersController {
  // ...
}
```

**Important** : `SUPER_ADMIN` peut faire **tout** ce qu'un `ADMIN` peut faire. La constante `ADMIN_ROLES` garantit cette cohérence.

### Accès refusé

- Un joueur avec `role = PLAYER` recevra une erreur `403 Forbidden` avec le message "Insufficient permissions"
- Un utilisateur non authentifié recevra une erreur `401 Unauthorized`

## 🛠️ API Admin v1

### Endpoints pour les joueurs

#### GET /admin/players

Liste paginée des joueurs avec recherche optionnelle.

**Query parameters :**
- `skip` (optionnel, défaut: 0) : Nombre de résultats à ignorer
- `take` (optionnel, défaut: 50, max: 100) : Nombre de résultats à retourner
- `search` (optionnel) : Recherche insensible à la casse sur email ou username

**Réponse :**
```json
{
  "data": [
    {
      "id": "string",
      "username": "string",
      "email": "string",
      "countryCode": "string",
      "role": "PLAYER" | "ADMIN" | "SUPER_ADMIN",
      "isActive": true,
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "total": 100,
  "skip": 0,
  "take": 50
}
```

**Exemple :**
```bash
GET /admin/players?skip=0&take=50&search=florian
Authorization: Bearer <admin-token>
```

#### GET /admin/players/:id

Détails d'un joueur spécifique.

**Réponse :**
```json
{
  "id": "string",
  "username": "string",
  "email": "string",
  "countryCode": "string",
  "role": "SUPER_ADMIN",
  "isActive": true,
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

**Exemple :**
```bash
GET /admin/players/clxxx123456789
Authorization: Bearer <admin-token>
```

#### PATCH /admin/players/:id/status

Suspendre ou réactiver un joueur.

**Body :**
```json
{
  "isActive": false
}
```

**Réponse :**
```json
{
  "id": "string",
  "username": "string",
  "email": "string",
  "countryCode": "string",
  "role": "PLAYER",
  "isActive": false,
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

**Exemple :**
```bash
PATCH /admin/players/clxxx123456789/status
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "isActive": false
}
```

**Note** : Un joueur avec `isActive = false` est considéré comme suspendu. À l'avenir, cela pourra empêcher le login et l'inscription aux tournois.

### Endpoints pour les tournois

#### GET /admin/tournaments

Liste complète des tournois pour l'admin (tous les statuts, sans filtres de dates).

**Réponse :**
```json
[
  {
    "id": "string",
    "name": "Tournoi Rapide 10+0",
    "status": "DRAFT" | "SCHEDULED" | "READY" | "RUNNING" | "FINISHED" | "CANCELED",
    "timeControl": "10+0",
    "buyInCents": 1000,
    "currency": "EUR",
    "minPlayers": 4,
    "maxPlayers": 16,
    "currentPlayers": 8,
    "eloMin": 1200,
    "eloMax": 2000,
    "startsAt": "2025-01-15T18:00:00.000Z",
    "endsAt": "2025-01-15T20:00:00.000Z",
    "registrationClosesAt": "2025-01-15T17:30:00.000Z",
    "legalZoneCode": "FR",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
]
```

**Exemple :**
```bash
GET /admin/tournaments
Authorization: Bearer <admin-token>
```

**Différences avec le lobby public :**
- Le lobby public (`GET /tournaments`) filtre par statut (SCHEDULED, READY, RUNNING) et dates
- L'admin voit tous les tournois, y compris DRAFT, FINISHED, CANCELED
- L'admin voit les tournois passés
- L'admin a accès à `createdAt` et `updatedAt`

## 🚀 Installation et configuration

### 1. Migration de la base de données

```bash
cd backend
npx prisma migrate dev --name add_player_role
```

Cette commande :
- Crée l'enum `PlayerRole` dans la base de données
- Ajoute le champ `role` au modèle `Player` avec la valeur par défaut `PLAYER`
- Met à jour tous les joueurs existants avec `role = PLAYER`

### 2. Configuration de l'environnement

Ajoutez dans `backend/.env` :

```env
# Admin Bootstrap
# Email du super administrateur qui sera automatiquement promu au démarrage
SUPER_ADMIN_EMAIL=florian.lantigner@ik.me
```

### 3. Démarrage du backend

```bash
cd backend
npm run start:dev
```

Au démarrage, vous devriez voir dans les logs :

```
✅ Player "florian.lantigner@ik.me" has been promoted to SUPER_ADMIN
```

ou

```
Player "florian.lantigner@ik.me" is already SUPER_ADMIN
```

## 🧪 Scénarios de test

### Test 1 : Création d'un compte et promotion automatique

1. **Créer un compte** avec l'email configuré dans `SUPER_ADMIN_EMAIL` :
   ```bash
   POST /players
   {
     "username": "admin",
     "email": "florian.lantigner@ik.me",
     "password": "password123",
     "countryCode": "FR",
     "dateOfBirth": "1990-01-01"
   }
   ```

2. **Vérifier le rôle initial** :
   ```bash
   POST /auth/login
   {
     "email": "florian.lantigner@ik.me",
     "password": "password123"
   }
   ```
   Le rôle dans la réponse devrait être `PLAYER`.

3. **Redémarrer le backend** :
   ```bash
   # Arrêter le backend (Ctrl+C)
   npm run start:dev
   ```

4. **Vérifier la promotion** :
   - Vérifier les logs : vous devriez voir `✅ Player "florian.lantigner@ik.me" has been promoted to SUPER_ADMIN`
   - Se reconnecter pour obtenir un nouveau JWT :
     ```bash
     POST /auth/login
     {
       "email": "florian.lantigner@ik.me",
       "password": "password123"
     }
     ```
   - Le rôle dans la réponse devrait maintenant être `SUPER_ADMIN`

5. **Vérifier via /auth/me** :
   ```bash
   GET /auth/me
   Authorization: Bearer <new-token>
   ```
   La réponse doit inclure `"role": "SUPER_ADMIN"`.

### Test 2 : Accès aux endpoints admin (SUPER_ADMIN)

1. **Lister les joueurs** :
   ```bash
   GET /admin/players
   Authorization: Bearer <super-admin-token>
   ```
   Devrait retourner la liste des joueurs avec un statut `200 OK`.

2. **Voir les détails d'un joueur** :
   ```bash
   GET /admin/players/<player-id>
   Authorization: Bearer <super-admin-token>
   ```
   Devrait retourner les détails du joueur.

3. **Suspendre un joueur** :
   ```bash
   PATCH /admin/players/<player-id>/status
   Authorization: Bearer <super-admin-token>
   Content-Type: application/json
   
   {
     "isActive": false
   }
   ```
   Devrait retourner le joueur avec `"isActive": false`.

4. **Réactiver un joueur** :
   ```bash
   PATCH /admin/players/<player-id>/status
   Authorization: Bearer <super-admin-token>
   Content-Type: application/json
   
   {
     "isActive": true
   }
   ```

5. **Lister les tournois** :
   ```bash
   GET /admin/tournaments
   Authorization: Bearer <super-admin-token>
   ```
   Devrait retourner tous les tournois (tous statuts confondus).

### Test 3 : Accès refusé pour un joueur PLAYER

1. **Créer un compte joueur normal** :
   ```bash
   POST /players
   {
     "username": "player1",
     "email": "player1@example.com",
     "password": "password123",
     "countryCode": "FR",
     "dateOfBirth": "1990-01-01"
   }
   ```

2. **Se connecter** :
   ```bash
   POST /auth/login
   {
     "email": "player1@example.com",
     "password": "password123"
   }
   ```

3. **Tenter d'accéder aux endpoints admin** :
   ```bash
   GET /admin/players
   Authorization: Bearer <player-token>
   ```
   Devrait retourner `403 Forbidden` avec le message "Insufficient permissions".

   ```bash
   GET /admin/tournaments
   Authorization: Bearer <player-token>
   ```
   Devrait également retourner `403 Forbidden`.

### Test 4 : Vérification du JWT

Le rôle est inclus dans le payload JWT. Pour vérifier :

1. **Décoder le token** (dans la console du navigateur ou via un outil en ligne) :
   ```javascript
   const token = localStorage.getItem('authToken');
   const payload = JSON.parse(atob(token.split('.')[1]));
   console.log('Role in JWT:', payload.role);
   ```

2. **Vérifier que le rôle correspond** à celui renvoyé par `/auth/me`.

## 📝 Notes importantes

### Sécurité

- **Aucun endpoint public ne permet de changer un rôle**
- La promotion en ADMIN/SUPER_ADMIN se fait uniquement :
  - Automatiquement via le bootstrap pour l'email configuré
  - Manuellement via modification directe en base de données
- Les DTOs publics (register, login) n'acceptent **jamais** le champ `role`
- Tous les endpoints `/admin/*` sont protégés par `JwtAuthGuard` + `RolesGuard`
- Un joueur avec `role = PLAYER` ne peut **jamais** accéder aux endpoints admin (403 Forbidden)

### Bootstrap automatique

- Le `AdminBootstrapService` s'exécute **uniquement au démarrage** du backend (via `OnModuleInit`)
- Si vous modifiez `SUPER_ADMIN_EMAIL` dans le `.env`, vous devez **redémarrer le backend**
- Si le joueur n'existe pas encore, un warning sera loggé (non bloquant)
- Si le joueur existe déjà et est déjà SUPER_ADMIN, un log confirme qu'il l'est déjà
- Si `SUPER_ADMIN_EMAIL` n'est pas défini, un warning est loggé mais l'application démarre normalement

### Architecture des guards

1. **JwtAuthGuard** : Vérifie que le JWT est valide et injecte `request.user` (JwtPayload)
2. **RolesGuard** : Vérifie que `request.user.role` est dans la liste des rôles requis
3. **Ordre d'exécution** : `JwtAuthGuard` doit être exécuté **avant** `RolesGuard` (défini dans `@UseGuards`)

### Constante ADMIN_ROLES

La constante `ADMIN_ROLES = [PlayerRole.ADMIN, PlayerRole.SUPER_ADMIN]` garantit que :
- `SUPER_ADMIN` peut faire **tout** ce qu'un `ADMIN` peut faire
- Tous les endpoints admin acceptent les deux rôles
- La cohérence est maintenue dans tout le code

### Évolutions futures

- ✅ Interface frontend pour gérer les joueurs et tournois (Phase 4.5 frontend)
- Possibilité de refuser le login pour les joueurs suspendus (`isActive = false`)
- Possibilité de refuser l'inscription aux tournois pour les joueurs suspendus
- Endpoints supplémentaires pour gérer les rôles (uniquement pour SUPER_ADMIN)
- Audit log des actions admin
- Permissions granulaires (au-delà des rôles simples)

## 🔗 Fichiers modifiés/créés

### Fichiers créés

- `src/auth/types/jwt-payload.interface.ts` : Interface JwtPayload avec le rôle
- `src/auth/decorators/roles.decorator.ts` : Décorateur `@Roles()` et constante `ADMIN_ROLES`
- `src/auth/guards/roles.guard.ts` : Guard pour vérifier les rôles
- `src/admin/admin.module.ts` : Module admin regroupant les services et contrôleurs admin
- `src/admin/admin-bootstrap.service.ts` : Service de bootstrap pour SUPER_ADMIN (OnModuleInit)
- `src/admin/admin-players.service.ts` : Service pour gérer les joueurs (admin)
- `src/admin/admin-players.controller.ts` : Contrôleur pour les endpoints admin des joueurs
- `src/admin/dto/update-player-status.dto.ts` : DTO pour la mise à jour du statut d'un joueur

### Fichiers modifiés

- `prisma/schema.prisma` : Ajout de l'enum `PlayerRole` et du champ `role` + `isActive` sur Player
- `src/auth/auth.service.ts` : Inclusion du rôle dans le JWT et `/auth/me`
- `src/auth/strategies/jwt.strategy.ts` : Inclusion du rôle dans la validation du JWT
- `src/auth/auth.module.ts` : Ajout de `RolesGuard` dans les providers et exports
- `src/modules/tournaments/tournaments.service.ts` : Méthode `listAdminTournaments()` pour lister tous les tournois
- `src/modules/tournaments/tournaments.controller.ts` : Protection des endpoints admin avec `RolesGuard` + endpoint `GET /admin/tournaments`
- `src/modules/tournaments/tournaments.module.ts` : Import de `AuthModule` pour utiliser `RolesGuard`
- `src/app.module.ts` : Import de `AdminModule` pour activer le bootstrap

### Configuration

- `backend/.env` : Variable d'environnement `SUPER_ADMIN_EMAIL=florian.lantigner@ik.me`
- `env.example` : Exemple de configuration avec `SUPER_ADMIN_EMAIL`

## ✅ Checklist de vérification

- [ ] Migration Prisma exécutée avec succès
- [ ] Variable `SUPER_ADMIN_EMAIL` configurée dans `.env`
- [ ] Backend redémarré après configuration
- [ ] Logs de bootstrap affichent la promotion réussie
- [ ] `/auth/me` renvoie le rôle correct
- [ ] JWT contient le rôle dans le payload
- [ ] Endpoints `/admin/players` accessibles avec un token ADMIN/SUPER_ADMIN
- [ ] Endpoints `/admin/tournaments` accessibles avec un token ADMIN/SUPER_ADMIN
- [ ] Endpoints `/admin/*` retournent `403` pour un joueur PLAYER
- [ ] Endpoints `/admin/*` retournent `401` pour un utilisateur non authentifié

