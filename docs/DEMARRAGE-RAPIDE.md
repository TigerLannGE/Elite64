# 🚀 Démarrage Rapide - ChessBet

**Guide condensé pour lancer le projet en local**

**Dernière mise à jour** : 14 Décembre 2025

---

## 📋 Prérequis

- PostgreSQL démarré (Docker ou service local)
  - **Docker** : PostgreSQL 17 via `postgres:17-alpine`
  - **Local** : PostgreSQL 16+ recommandé
- Node.js 18+ installé
- Les migrations Prisma appliquées (première fois uniquement)

---

## ⚡ Commandes de démarrage

### Option 1 : PostgreSQL avec Docker (port 5433)

**Terminal 1 - PostgreSQL :**
```powershell
cd C:\xampp\htdocs\ChessBet
docker compose -f infra/docker-compose.yml up -d postgres
```

**Terminal 2 - Backend :**
```powershell
cd C:\xampp\htdocs\ChessBet\backend
npm run start:dev
```

**Terminal 3 - Frontend :**
```powershell
cd C:\xampp\htdocs\ChessBet\frontend
npm run dev
```

**Configuration `backend/.env` :**
```env
DATABASE_URL=postgresql://chessbet_user:Dark-Revan-GE-9418657@localhost:5433/chessbet_db?schema=public
```

---

### Option 2 : PostgreSQL local (port 5432)

**Terminal 1 - Backend :**
```powershell
cd C:\xampp\htdocs\ChessBet\backend
npm run start:dev
```

**Terminal 2 - Frontend :**
```powershell
cd C:\xampp\htdocs\ChessBet\frontend
npm run dev
```

**Configuration `backend/.env` :**
```env
DATABASE_URL=postgresql://chessbet_user:Dark-Revan-GE-9418657@localhost:5432/chessbet_db?schema=public
```

**⚠️ Important :** Assurez-vous que l'utilisateur `chessbet_user` et la base `chessbet_db` existent (voir section "Accès à la base de données").

---

## 🔧 Première configuration (une seule fois)

### 1. Appliquer les migrations Prisma

```powershell
cd C:\xampp\htdocs\ChessBet\backend
npx prisma migrate deploy
```

### 2. Vérifier les migrations

```powershell
npx prisma migrate status
```

Vous devriez voir : `Database schema is up to date!`

---

## 🗄️ Accès à la base de données

### Restauration d'un backup

Si vous devez restaurer une base de données depuis un dump :

```powershell
cd C:\xampp\htdocs\ChessBet\backend
.\import-database.ps1 -DumpPath "C:\chemin\vers\votre_dump.dump" -DropDatabase
```

**Voir** : `docs/audits/README - Restauration base de données PostgreSQL.md` pour plus de détails.

### Prisma Studio (Interface graphique - Recommandé)

```powershell
cd C:\xampp\htdocs\ChessBet\backend
npx prisma studio
```

**Accès :** `http://localhost:5555`

**Utilisation :**
- Visualiser toutes les tables
- Modifier les données directement
- Vérifier les utilisateurs
- Modifier `isEmailVerified` si nécessaire

### SQL Shell (psql) - Ligne de commande

**Ouvrir SQL Shell :**
- Cherchez "SQL Shell (psql)" dans le menu Démarrer
- Ou tapez `psql` dans PowerShell

**Se connecter :**

**Docker (port 5433) :**
```powershell
psql -h localhost -p 5433 -U chessbet_user -d chessbet_db
```

**PostgreSQL local (port 5432) :**
```powershell
psql -h localhost -p 5432 -U chessbet_user -d chessbet_db
```

**Mot de passe :** `Dark-Revan-GE-9418657`

**Commandes SQL utiles :**
```sql
-- Lister les tables
\dt

-- Voir les joueurs
SELECT id, username, email, "isEmailVerified" FROM players;

-- Vérifier un email manuellement
UPDATE players SET "isEmailVerified" = true WHERE email = 'votre-email@example.com';

-- Quitter
\q
```

---

## 🔧 Prisma Migrations — Bonnes pratiques

### ⚠️ Important : Ne jamais taper de commande au prompt de nom de migration

Lors de l'exécution de `npx prisma migrate dev`, Prisma vous demande un nom pour la migration.

**❌ NE FAITES PAS** :
```powershell
# Ne tapez PAS de commande dans le prompt interactif
npx prisma migrate dev
# > Entrez le nom de la migration: type_env_findstr_database_url  ❌ MAUVAIS
```

**✅ FAITES** :
```powershell
# Utilisez l'option --name directement
npx prisma migrate dev --name nom_de_la_migration_descriptif
```

### Shadow Database

Prisma Migrate utilise une **shadow database** pour valider les migrations avant de les appliquer.

**Configuration requise** :
1. Créer la shadow database manuellement :
   ```sql
   CREATE DATABASE chessbet_shadow;
   ```

2. Ajouter `SHADOW_DATABASE_URL` dans `backend/.env` :
   ```env
   # Docker (port 5433)
   SHADOW_DATABASE_URL=postgresql://chessbet_user:Dark-Revan-GE-9418657@localhost:5433/chessbet_shadow?schema=public
   
   # PostgreSQL local (port 5432)
   SHADOW_DATABASE_URL=postgresql://chessbet_user:Dark-Revan-GE-9418657@localhost:5432/chessbet_shadow?schema=public
   ```

3. Vérifier que `schema.prisma` contient :
   ```prisma
   datasource db {
     provider          = "postgresql"
     url               = env("DATABASE_URL")
     shadowDatabaseUrl = env("SHADOW_DATABASE_URL")
   }
   ```

**Important** : Le port de `SHADOW_DATABASE_URL` doit correspondre au port de `DATABASE_URL` :
- Docker : port **5433** (mappé depuis 5432)
- PostgreSQL local : port **5432**

### Commandes Prisma Migrate

**Créer une nouvelle migration** :
```powershell
cd backend
npx prisma migrate dev --name nom_descriptif
```

**Appliquer les migrations existantes** (production ou première fois) :
```powershell
cd backend
npx prisma migrate deploy
```

**Vérifier le statut des migrations** :
```powershell
cd backend
npx prisma migrate status
```

**Générer le client Prisma** (après modification du schéma) :
```powershell
cd backend
npm run prisma:generate
```

### Vérification de la base de données cible

Avant d'exécuter une migration, vérifiez toujours que vous êtes connecté à la bonne base de données :

```powershell
# Vérifier la DATABASE_URL dans .env
Get-Content backend/.env | Select-String "DATABASE_URL"

# Vérifier le port utilisé
# Docker : doit afficher localhost:5433
# Local : doit afficher localhost:5432
```

---

## ✅ Vérification

1. **Backend :** `http://localhost:4000` (doit répondre)
2. **Frontend :** `http://localhost:3000` (landing page)
3. **Prisma Studio :** `http://localhost:5555` (après `npx prisma studio`)

---

## 🛑 Arrêter les services

- **Backend/Frontend :** `Ctrl + C` dans les terminaux
- **PostgreSQL (Docker) :** `docker compose -f infra/docker-compose.yml stop postgres`

---

**Pour plus de détails :** Consultez `docs/README - Démarrage rapide du projet.md`
