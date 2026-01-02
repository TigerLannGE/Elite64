# Schéma Prisma - Documentation Backend

**Date de création** : 01 décembre 2025  
**Dernière mise à jour** : 01 décembre 2025  
**Statut** : ✅ Complété

---

## 📋 Vue d'ensemble

Ce document décrit le schéma de base de données Prisma pour la plateforme de tournois d'échecs Elite64, ainsi que tout le processus de configuration et les difficultés rencontrées.

Le schéma Prisma définit la structure complète de la base de données PostgreSQL pour une plateforme de **concours de compétence** (skill competition) en échecs. La plateforme est conçue pour être légale dans les juridictions où les skill games sont autorisés.

**⚠️ Important** : Cette plateforme n'est **PAS** un site de paris. Il n'existe aucun modèle de pari entre joueurs ou de stake direct. Tous les modèles sont orientés vers des tournois de compétence avec prize pools fixes.

## 🗂️ Structure du Schéma

### Enums

Le schéma définit 5 enums pour gérer les états et types :

- **`KycStatus`** : Statut de vérification KYC (PENDING, VERIFIED, REJECTED)
- **`TransactionType`** : Types de transactions financières (DEPOSIT, WITHDRAWAL, TOURNAMENT_BUY_IN, TOURNAMENT_PAYOUT, BONUS, FEE)
- **`TournamentStatus`** : Statut d'un tournoi (DRAFT, SCHEDULED, RUNNING, FINISHED, CANCELED)
- **`TournamentEntryStatus`** : Statut d'une inscription (PENDING, CONFIRMED, ELIMINATED, COMPLETED)
- **`MatchResult`** : Résultat d'un match (WHITE_WIN, BLACK_WIN, DRAW, CANCELLED, PENDING)

### Modèles

#### 1. Player (Joueur)

Représente un joueur humain sur la plateforme.

**Champs principaux** :
- `id` : Identifiant unique (cuid)
- `username` : Nom d'utilisateur unique
- `email` : Email unique
- `passwordHash` : Hash du mot de passe
- `countryCode` : Code pays ISO (ex: "GB", "CA", "IN")
- `elo` : Classement Elo interne
- `kycStatus` : Statut de vérification KYC
- `isActive` : Indique si le compte est actif

**Relations** :
- `wallet` : Portefeuille associé (1-1)
- `tournamentEntries` : Inscriptions aux tournois
- `matchesAsWhite` : Matchs joués avec les blancs
- `matchesAsBlack` : Matchs joués avec les noirs

**Index** : `countryCode`, `elo`, `kycStatus`

---

#### 2. Wallet (Portefeuille)

Gère le solde financier d'un joueur. Un seul wallet par joueur.

**Champs principaux** :
- `id` : Identifiant unique (cuid)
- `playerId` : Référence au joueur (unique)
- `balanceCents` : Solde en centimes (évite les problèmes de précision avec les floats)
- `currency` : Devise (par défaut "EUR")

**Relations** :
- `player` : Joueur propriétaire (1-1)
- `transactions` : Historique des transactions

**Index** : `playerId`

---

#### 3. Transaction

Historique centralisé de toutes les opérations financières. **Toutes les transactions doivent passer par ce modèle**, pas par d'autres modèles.

**Champs principaux** :
- `id` : Identifiant unique (cuid)
- `walletId` : Référence au portefeuille
- `type` : Type de transaction (enum)
- `amountCents` : Montant en centimes (positif pour dépôt/payout, négatif pour withdrawal/buy-in)
- `description` : Description optionnelle
- `externalRef` : Référence externe (ex: ID Stripe pour les paiements)

**Relations** :
- `wallet` : Portefeuille concerné

**Index** : `walletId`, `type`, `createdAt`, `externalRef`

---

#### 4. Tournament (Tournoi)

Représente un tournoi de compétence. **Ce n'est jamais un pari**, mais un concours avec prize pool fixe.

**Champs principaux** :
- `id` : Identifiant unique (cuid)
- `name` : Nom du tournoi
- `status` : Statut actuel (enum)
- `timeControl` : Contrôle de temps (ex: "10+0", "3+0", "1+0")
- `buyInCents` : Droit d'entrée en centimes
- `currency` : Devise (par défaut "EUR")
- `minPlayers` / `maxPlayers` : Limites de participants
- `eloMin` / `eloMax` : Limites Elo optionnelles
- `startsAt` / `endsAt` : Dates de début/fin
- `legalZoneCode` : Zone légale autorisée (ex: "UK", "US-CA", "EU")

**Relations** :
- `entries` : Inscriptions au tournoi
- `matches` : Matchs du tournoi
- `prizePool` : Prize pool associé (1-1)

**Index** : `status`, `legalZoneCode`, `startsAt`, `endsAt`

---

#### 5. TournamentEntry (Inscription)

L'inscription d'un joueur à un tournoi. Un joueur ne peut s'inscrire qu'une seule fois par tournoi.

**Champs principaux** :
- `id` : Identifiant unique (cuid)
- `playerId` : Référence au joueur
- `tournamentId` : Référence au tournoi
- `status` : Statut de l'inscription (enum)
- `buyInPaidCents` : Montant du buy-in payé

**Relations** :
- `player` : Joueur inscrit
- `tournament` : Tournoi concerné

**Contrainte unique** : `(playerId, tournamentId)` - Un joueur ne peut s'inscrire qu'une fois par tournoi

**Index** : `playerId`, `tournamentId`, `status`

---

#### 6. Match (Partie)

Un match 1v1 dans le cadre d'un tournoi.

**Champs principaux** :
- `id` : Identifiant unique (cuid)
- `tournamentId` : Tournoi auquel appartient le match
- `whitePlayerId` : Joueur avec les blancs
- `blackPlayerId` : Joueur avec les noirs
- `result` : Résultat du match (enum)
- `pgn` : Notation PGN optionnelle (pour stocker les coups plus tard)
- `startedAt` / `finishedAt` : Dates de début/fin

**Relations** :
- `tournament` : Tournoi parent
- `whitePlayer` : Joueur blanc
- `blackPlayer` : Joueur noir

**Index** : `tournamentId`, `whitePlayerId`, `blackPlayerId`, `result`

---

#### 7. PrizePool (Cagnotte)

Représente le calcul et la structure du prize pool d'un tournoi. **Pas de lien "pari" entre joueurs** - c'est un agrégat du tournoi.

**Champs principaux** :
- `id` : Identifiant unique (cuid)
- `tournamentId` : Référence au tournoi (unique)
- `totalEntriesCents` : Somme totale des buy-ins
- `commissionCents` : Montant retenu par la plateforme
- `distributableCents` : Montant à redistribuer aux joueurs
- `distributionRulesJson` : Règles de distribution en JSON (ex: `{"1":0.6,"2":0.3,"3":0.1}`)

**Relations** :
- `tournament` : Tournoi associé (1-1)

**Index** : `tournamentId`

---

#### 8. CountryRule (Règle Légale)

Règles légales par pays/état pour la conformité.

**Champs principaux** :
- `id` : Identifiant unique (cuid)
- `code` : Code unique (ex: "UK", "CA", "US-NY", "IN-KA")
- `name` : Nom du pays/état
- `skillGamesAllowed` : Les skill games sont-ils autorisés ?
- `maxBuyInCents` : Plafond de buy-in optionnel
- `isBlocked` : Ce pays/état est-il bloqué ?
- `notes` : Notes additionnelles

**Index** : `code`, `isBlocked`

---

## 🔗 Relations Principales

```
Player (1) ──< (1) Wallet
Player (1) ──< (*) TournamentEntry
Player (1) ──< (*) Match (whitePlayer)
Player (1) ──< (*) Match (blackPlayer)

Wallet (1) ──< (*) Transaction

Tournament (1) ──< (*) TournamentEntry
Tournament (1) ──< (*) Match
Tournament (1) ──< (1) PrizePool
```

## 🔒 Contraintes et Intégrité

- **Cascade Delete** : La suppression d'un joueur supprime automatiquement son wallet et ses transactions
- **Cascade Delete** : La suppression d'un tournoi supprime ses inscriptions, matchs et prize pool
- **Unique Constraints** : 
  - Un joueur ne peut avoir qu'un seul wallet
  - Un joueur ne peut s'inscrire qu'une seule fois par tournoi
  - Un tournoi ne peut avoir qu'un seul prize pool
- **Index** : Index stratégiques sur les champs fréquemment interrogés pour optimiser les performances

## 💰 Gestion Financière

### Principe

Tous les montants sont stockés en **centimes** (Int) pour éviter les problèmes de précision avec les nombres à virgule flottante.

### Flux de Transaction

1. **Inscription à un tournoi** :
   - Création d'une `Transaction` de type `TOURNAMENT_BUY_IN` (montant négatif)
   - Mise à jour du `balanceCents` du `Wallet`
   - Création d'une `TournamentEntry` avec `buyInPaidCents`

2. **Distribution des gains** :
   - Calcul du `PrizePool` basé sur les inscriptions
   - Création de `Transaction` de type `TOURNAMENT_PAYOUT` (montant positif)
   - Mise à jour des `Wallet` des gagnants

3. **Dépôts/Retraits** :
   - `DEPOSIT` : Ajout de fonds (montant positif)
   - `WITHDRAWAL` : Retrait de fonds (montant négatif)

## 🚀 Configuration et Installation

### Prérequis

- Docker Desktop installé et fonctionnel
- Node.js 18+ installé
- PostgreSQL (optionnel, pour développement local)

### Fichiers de Configuration

#### 1. `infra/docker-compose.yml`

Définit les services Docker :
- **PostgreSQL** : Base de données (port 5433 mappé pour éviter les conflits)
- **Backend** : Service NestJS (port 4000)
- **Frontend** : Service Next.js (port 3000)

#### 2. Fichiers `.env`

**Important** : Il y a **deux** fichiers `.env` nécessaires :

1. **`.env` à la racine du projet** :
   - Utilisé par Docker Compose
   - Contient les variables `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`

2. **`backend/.env`** :
   - Utilisé par Prisma CLI depuis l'hôte Windows
   - Contient `DATABASE_URL` avec `localhost:5433` (port mappé)

3. **`infra/.env`** (optionnel mais recommandé) :
   - Utilisé par Docker Compose si présent dans le même répertoire que `docker-compose.yml`
   - Contient les mêmes variables que le `.env` à la racine

**Exemple de contenu pour `backend/.env`** :
```env
DATABASE_URL=postgresql://elite64_user:Dark-Revan-GE-9418657@localhost:5433/elite64_db?schema=public
```

**⚠️ CRITIQUE** : La ligne `DATABASE_URL` doit être sur **une seule ligne** sans saut de ligne, sinon Prisma ne peut pas la parser correctement.

### Démarrage de PostgreSQL

```powershell
# Depuis la racine du projet
docker compose -f infra/docker-compose.yml up -d postgres

# Vérifier que le conteneur est "healthy"
docker compose -f infra/docker-compose.yml ps
```

### Génération du Client Prisma

```powershell
cd backend
npm run prisma:generate
```

### Création et Application des Migrations

```powershell
cd backend
npx prisma migrate dev --name nom_de_la_migration
```

### Visualiser le schéma

```powershell
npx prisma studio
```

## 🌐 Accès aux Services

### URLs Locales pour Tester le Site

Une fois les services démarrés, vous pouvez accéder à :

- **Frontend (Next.js)** : `http://localhost:3000`
- **Backend API (NestJS)** : `http://localhost:4000`
- **Prisma Studio** : `http://localhost:5555` (lorsque Prisma Studio est lancé)

### Démarrer les Services

```powershell
# Démarrer uniquement PostgreSQL
docker compose -f infra/docker-compose.yml up -d postgres

# Démarrer tous les services (PostgreSQL + Backend + Frontend)
docker compose -f infra/docker-compose.yml up -d

# Vérifier le statut des services
docker compose -f infra/docker-compose.yml ps
```

## 📊 Consulter la Base de Données

### Option 1 : Prisma Studio (Recommandé)

Interface graphique intuitive pour visualiser et modifier les données :

```powershell
cd backend
npx prisma studio
```

Cela ouvre automatiquement `http://localhost:5555` dans votre navigateur.

**Avantages** :
- Interface graphique moderne
- Visualisation de toutes les tables
- Édition des données directement
- Filtres et recherches intégrés

### Option 2 : pgAdmin (Si installé avec PostgreSQL)

1. Ouvrez pgAdmin
2. Créez une nouvelle connexion avec ces paramètres :
   - **Host** : `localhost`
   - **Port** : `5433`
   - **Database** : `elite64_db`
   - **Username** : `elite64_user`
   - **Password** : `Dark-Revan-GE-9418657`

**Avantages** :
- Interface complète pour PostgreSQL
- Exécution de requêtes SQL complexes
- Gestion des schémas et index

### Option 3 : Ligne de Commande (psql)

```powershell
# Se connecter à la base de données via Docker
docker compose -f infra/docker-compose.yml exec postgres psql -U elite64_user -d elite64_db

# Commandes utiles dans psql :
\dt                    # Liste toutes les tables
\d players             # Détails de la table players
\d+ players            # Détails complets avec index et contraintes
SELECT * FROM players; # Voir toutes les données de la table players
\q                     # Quitter psql
```

**Avantages** :
- Accès direct à PostgreSQL
- Exécution rapide de requêtes
- Pas besoin d'interface graphique

### Option 4 : DBeaver ou Autre Client SQL

Utilisez les mêmes paramètres que pgAdmin :
- **Host** : `localhost`
- **Port** : `5433`
- **Database** : `elite64_db`
- **Username** : `elite64_user`
- **Password** : `Dark-Revan-GE-9418657`

**Avantages** :
- Support de multiples bases de données
- Interface professionnelle
- Fonctionnalités avancées (diagrammes ER, exports, etc.)

### Vérifier que la Base de Données est Créée

```powershell
# Lister toutes les tables
docker compose -f infra/docker-compose.yml exec postgres psql -U elite64_user -d elite64_db -c "\dt"

# Voir le nombre de tables
docker compose -f infra/docker-compose.yml exec postgres psql -U elite64_user -d elite64_db -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
```

## ⚠️ Difficultés Rencontrées et Solutions

### 1. Conflit de Port avec PostgreSQL Local

**Problème** : PostgreSQL installé localement sur Windows écoutait aussi sur le port 5432, créant un conflit avec le conteneur Docker.

**Symptômes** :
- Erreur d'authentification lors des tentatives de connexion Prisma
- Prisma se connectait à PostgreSQL local au lieu du conteneur Docker

**Solution** :
- Modification du port mappé dans `docker-compose.yml` : `"5433:5432"` au lieu de `"5432:5432"`
- Mise à jour de `DATABASE_URL` dans `backend/.env` pour utiliser le port 5433
- Alternative : Arrêter le service PostgreSQL local (nécessite des droits administrateur)

### 2. Fichier `.env` Non Lu par Docker Compose

**Problème** : Docker Compose ne trouvait pas les variables d'environnement pour créer PostgreSQL avec le bon mot de passe.

**Symptômes** :
- Le conteneur PostgreSQL utilisait toujours le mot de passe par défaut (`elite64_password`)
- Erreurs d'authentification même avec le bon mot de passe dans `backend/.env`

**Solution** :
- Création d'un fichier `infra/.env` dans le même répertoire que `docker-compose.yml`
- Docker Compose lit automatiquement le fichier `.env` dans son répertoire de travail
- Contenu du fichier `infra/.env` :
  ```env
  POSTGRES_USER=elite64_user
  POSTGRES_PASSWORD=Dark-Revan-GE-9418657
  POSTGRES_DB=elite64_db
  ```

### 3. Ligne DATABASE_URL Coupée dans le Fichier `.env`

**Problème** : La ligne `DATABASE_URL` dans `backend/.env` était coupée sur deux lignes, empêchant Prisma de la parser correctement.

**Symptômes** :
- Prisma essayait de se connecter au port 5432 au lieu de 5433
- Message d'erreur : "Authentication failed" même avec les bons identifiants
- Prisma affichait "localhost:5432" dans les logs au lieu de "localhost:5433"

**Solution** :
- Recréation du fichier `.env` en s'assurant que `DATABASE_URL` est sur une seule ligne
- Utilisation de `Set-Content` avec `-Encoding UTF8` pour éviter les problèmes de formatage
- Vérification avec : `Get-Content .env -Raw | Select-String -Pattern "DATABASE_URL.*5433"`

### 4. Version de Prisma

**Problème** : Incohérence entre la version de Prisma dans `package.json` (5.7.0) et la version CLI installée globalement (7.1.0).

**Symptômes** :
- Erreur : "The datasource property `url` is no longer supported in schema files"

**Solution** :
- Utilisation de la version locale via `npm run prisma:generate` au lieu de `npx prisma generate`
- Installation des dépendances avec `npm install` pour avoir la bonne version locale

### 5. Caractères Spéciaux dans le Mot de Passe

**Problème** : Le mot de passe contenait des tirets (`Dark-Revan-GE-9418657`) qui pouvaient causer des problèmes dans les URLs.

**Solution** :
- Les tirets dans les mots de passe PostgreSQL ne nécessitent pas d'encodage URL
- Le problème venait en fait du formatage du fichier `.env`, pas des caractères spéciaux
- Vérification que la `DATABASE_URL` est correctement formatée sur une seule ligne

## 📝 Commandes Utiles

### Docker

```powershell
# Démarrer PostgreSQL
docker compose -f infra/docker-compose.yml up -d postgres

# Voir les logs
docker compose -f infra/docker-compose.yml logs postgres -f

# Arrêter et supprimer (avec les données)
docker compose -f infra/docker-compose.yml down -v

# Vérifier le statut
docker compose -f infra/docker-compose.yml ps
```

### Prisma

```powershell
# Générer le client
npm run prisma:generate

# Créer une migration
npx prisma migrate dev --name nom_migration

# Appliquer les migrations en production
npx prisma migrate deploy

# Vérifier le statut des migrations
npx prisma migrate status

# Ouvrir Prisma Studio
npx prisma studio

# Synchroniser le schéma sans migration (développement uniquement)
npx prisma db push
```

### Vérification de la Connexion

```powershell
# Tester la connexion au port
Test-NetConnection -ComputerName localhost -Port 5433

# Tester la connexion depuis le conteneur
docker compose -f infra/docker-compose.yml exec postgres psql -U elite64_user -d elite64_db -c "SELECT version();"
```

## 🔄 Évolutions Futures Possibles

- Ajout d'un modèle `Round` pour gérer les phases d'un tournoi (pools, élimination directe, etc.)
- Extension du modèle `Match` pour stocker plus de détails (temps utilisé, coups, etc.)
- Ajout d'un modèle `EloHistory` pour tracker l'évolution du classement
- Extension de `CountryRule` pour gérer des règles plus complexes (plafonds par période, etc.)
- Ajout d'un modèle `Notification` pour les notifications utilisateurs
- Ajout d'un modèle `AuditLog` pour tracer toutes les actions importantes

## 📚 Ressources

- [Documentation Prisma](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

## ✅ État Actuel

- ✅ Schéma Prisma complet avec tous les modèles
- ✅ Migration initiale créée et appliquée : `20251205145829_init_schema`
- ✅ Toutes les tables créées dans la base de données
- ✅ Docker Compose configuré et fonctionnel
- ✅ PostgreSQL accessible sur le port 5433
- ✅ Fichiers `.env` configurés correctement
- ✅ Prisma Client généré et fonctionnel

## 🎯 Prochaines Étapes

1. Intégrer Prisma Client dans les modules NestJS
2. Créer les services pour chaque modèle (Player, Tournament, etc.)
3. Implémenter les endpoints API
4. Ajouter la validation des données
5. Implémenter l'authentification et l'autorisation
6. Créer les tests unitaires et d'intégration

---

**Date de création** : 5 décembre 2025  
**Dernière mise à jour** : 5 décembre 2025  
**Version du schéma** : 1.0.0

