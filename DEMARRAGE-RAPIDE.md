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

