# Démarrage Rapide du Projet ChessBet

**Guide détaillé pour reprendre le travail après avoir éteint votre PC**

> 📖 **Version condensée disponible** : Si vous connaissez déjà le projet et voulez juste un rappel rapide des commandes, consultez le [Guide de démarrage rapide condensé](./phase-00_quickstart-condense_cross.md).

---

## 🚀 Démarrage en 4 étapes

### 1. Démarrer la base de données PostgreSQL

**Option A : Avec Docker (port 5433)**

```powershell
# Depuis la racine du projet
cd C:\xampp\htdocs\ChessBet
docker compose -f infra/docker-compose.yml up -d postgres
```

**⚠️ Important :** Utilisez des commandes séparées (sans `;`) pour éviter les problèmes.

**Vérification :**
```powershell
# Vérifier que le conteneur Docker est "healthy"
docker compose -f infra/docker-compose.yml ps
```

**Configuration dans `backend/.env` :**
```env
DATABASE_URL=postgresql://chessbet_user:Dark-Revan-GE-9418657@localhost:5433/chessbet_db?schema=public
```

**Option B : PostgreSQL local (port 5432)**

Si PostgreSQL est installé localement et configuré comme service Windows, il démarre automatiquement. Sinon :

```powershell
# Démarrer le service PostgreSQL
net start postgresql-x64-17  # (nom du service peut varier, peut être postgresql-x64-16 ou autre selon votre installation)
```

**Configuration dans `backend/.env` :**
```env
DATABASE_URL=postgresql://chessbet_user:Dark-Revan-GE-9418657@localhost:5432/chessbet_db?schema=public
```

**⚠️ Important :** 
- Si vous utilisez PostgreSQL local, assurez-vous que l'utilisateur `chessbet_user` et la base `chessbet_db` existent
- Voir la section "Accès à la base de données" ci-dessous pour créer l'utilisateur si nécessaire

---

### 2. Appliquer les migrations Prisma (première fois uniquement)

**⚠️ Important :** Si c'est la première fois que vous démarrez le projet, vous devez appliquer les migrations Prisma :

```powershell
cd C:\xampp\htdocs\ChessBet\backend
npx prisma migrate deploy
```

Cette commande crée toutes les tables nécessaires dans la base de données.

**Vérification :**
```powershell
# Vérifier le statut des migrations
npx prisma migrate status
```

Vous devriez voir : `Database schema is up to date!`

---

### 3. Démarrer le Backend (NestJS)

**Terminal 1 - Backend :**

```powershell
cd C:\xampp\htdocs\ChessBet\backend
npm run start:dev
```

**Vérification :**
- Vous devriez voir : `🚀 Backend running on http://localhost:4000`
- Si SMTP est configuré : `✓ Connexion SMTP vérifiée avec succès`

**⚠️ Important :** Laissez ce terminal ouvert pendant que vous travaillez.

---

### 4. Démarrer le Frontend (Next.js)

**Terminal 2 - Frontend :**

```powershell
cd C:\xampp\htdocs\ChessBet\frontend
npm run dev
```

**Vérification :**
- Vous devriez voir : `- Local: http://localhost:3000`
- Ouvrez votre navigateur sur `http://localhost:3000`

**⚠️ Important :** Laissez ce terminal ouvert pendant que vous travaillez.

---

## ✅ Vérification rapide

1. **Backend accessible ?**
   - Ouvrez : `http://localhost:4000/health`
   - Devrait retourner une réponse JSON

2. **Frontend accessible ?**
   - Ouvrez : `http://localhost:3000`
   - Devrait afficher la landing page

3. **Base de données connectée ?**
   - Vérifiez les logs du backend (pas d'erreur de connexion DB)

---

## 📋 Checklist de démarrage

- [ ] PostgreSQL démarré (Docker ou service local)
- [ ] Migrations Prisma appliquées (première fois uniquement)
- [ ] Backend démarré sur `http://localhost:4000`
- [ ] Frontend démarré sur `http://localhost:3000`
- [ ] Les deux terminaux restent ouverts
- [ ] Aucune erreur dans les logs

---

## 🔧 Configuration requise

### Fichiers `.env` à vérifier

**1. `backend/.env`** :

**Si vous utilisez Docker (port 5433) :**
```env
DATABASE_URL=postgresql://chessbet_user:Dark-Revan-GE-9418657@localhost:5433/chessbet_db?schema=public
```

**Si vous utilisez PostgreSQL local (port 5432) :**
```env
DATABASE_URL=postgresql://chessbet_user:Dark-Revan-GE-9418657@localhost:5432/chessbet_db?schema=public
```

**Autres variables :**
```env
PORT_BACKEND=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your-secret-key-change-in-production
SMTP_HOST=mail.infomaniak.com
SMTP_PORT=587
SMTP_USER=contact@chessbet.ch
SMTP_PASS=votre-mot-de-passe
SMTP_FROM="ChessBet <no-reply@chessbet.ch>"
```

**2. `frontend/.env.local`** :
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

**⚠️ Note :** Le fichier peut aussi s'appeler `NEXT_PUBLIC_API_URL` selon votre configuration.

---

## 🐛 Problèmes courants

### Les commandes avec `;` ne fonctionnent pas

**Symptôme :** Les commandes chaînées avec `;` ne s'exécutent pas correctement.

**Solution :**
- Utilisez des commandes séparées (recommandé)
- Vérifiez que vous êtes dans PowerShell (pas dans SQL Shell ou autre)

**Exemple :**
```powershell
# ❌ Peut ne pas fonctionner
cd C:\xampp\htdocs\ChessBet; docker compose -f infra/docker-compose.yml up -d postgres

# ✅ Fonctionne toujours
cd C:\xampp\htdocs\ChessBet
docker compose -f infra/docker-compose.yml up -d postgres
```

### Erreur "Cannot connect to database" ou "Authentication failed"

**Causes possibles :**
1. PostgreSQL n'est pas démarré
2. Le port est incorrect dans `backend/.env` (5432 pour local, 5433 pour Docker)
3. L'utilisateur ou la base de données n'existe pas

**Solutions :**

**Si vous utilisez Docker :**
```powershell
# Vérifier que PostgreSQL est démarré
docker compose -f infra/docker-compose.yml ps

# Si le conteneur n'est pas démarré
docker compose -f infra/docker-compose.yml up -d postgres
```

**Si vous utilisez PostgreSQL local :**
1. Vérifiez que le service PostgreSQL est démarré
2. Créez l'utilisateur et la base de données (voir section "Accès à la base de données")
3. Vérifiez que le port dans `backend/.env` est **5432** (pas 5433)

### Erreur "Port 4000 already in use"

**Solution :**
- Fermez l'application qui utilise le port 4000
- Ou changez `PORT_BACKEND` dans le `.env`

### Erreur "Port 3000 already in use"

**Solution :**
- Fermez l'application qui utilise le port 3000
- Ou démarrez Next.js sur un autre port : `npm run dev -- -p 3001`

### Erreur "SMTP connection failed"

**Solution :**
- Vérifiez les variables SMTP dans `backend/.env`
- Vérifiez que les identifiants Infomaniak sont corrects
- Consultez : [Configuration SMTP Infomaniak](../../phase-00_fondations-techniques/backend/phase-00_smtp-configuration_infomaniak-backend.md)

### Erreur 500 lors de la connexion

**Causes possibles :**
1. Les migrations Prisma ne sont pas appliquées
2. L'utilisateur n'existe pas dans la base de données
3. L'email n'est pas vérifié (`isEmailVerified = false`)

**Solutions :**
1. Appliquez les migrations : `npx prisma migrate deploy`
2. Créez un compte via `http://localhost:3000/register`
3. Vérifiez l'email ou modifiez `isEmailVerified` dans Prisma Studio

---

## 📝 Commandes utiles

### Arrêter les services

**Arrêter le backend :** `Ctrl + C` dans le terminal backend

**Arrêter le frontend :** `Ctrl + C` dans le terminal frontend

**Arrêter PostgreSQL (Docker) :**
```powershell
docker compose -f infra/docker-compose.yml stop postgres
```

**Arrêter et supprimer PostgreSQL (Docker) :**
```powershell
docker compose -f infra/docker-compose.yml down
```

### Voir les logs

**Logs PostgreSQL (Docker) :**
```powershell
docker compose -f infra/docker-compose.yml logs postgres
```

**Logs backend :** Affichés directement dans le terminal

**Logs frontend :** Affichés directement dans le terminal

---

## 🗄️ Accès à la base de données

### Méthode 1 : Prisma Studio (Recommandé - Interface graphique)

**Démarrer Prisma Studio :**

```powershell
cd C:\xampp\htdocs\ChessBet\backend
npx prisma studio
```

**Accès :**
- Ouvrez votre navigateur sur `http://localhost:5555`
- Interface graphique pour visualiser et modifier les données
- Parfait pour vérifier les utilisateurs, modifier `isEmailVerified`, etc.

**Avantages :**
- Interface intuitive
- Pas besoin de connaître SQL
- Visualisation de toutes les tables
- Modification directe des données

---

### Méthode 2 : SQL Shell (psql) - Ligne de commande

**Ouvrir SQL Shell :**
1. Cherchez "SQL Shell (psql)" dans le menu Démarrer de Windows
2. Ou tapez `psql` dans PowerShell

**Se connecter :**

**Si vous utilisez Docker (port 5433) :**
```powershell
psql -h localhost -p 5433 -U chessbet_user -d chessbet_db
```

**Si vous utilisez PostgreSQL local (port 5432) :**
```powershell
psql -h localhost -p 5432 -U chessbet_user -d chessbet_db
```

**Mot de passe :** `Dark-Revan-GE-9418657`

**Commandes SQL utiles :**
```sql
-- Lister toutes les tables
\dt

-- Voir les utilisateurs
\du

-- Voir les bases de données
\l

-- Voir les joueurs
SELECT id, username, email, "isEmailVerified" FROM players;

-- Vérifier un utilisateur spécifique
SELECT * FROM players WHERE email = 'florian.lantigner@ik.me';

-- Vérifier manuellement un email
UPDATE players SET "isEmailVerified" = true WHERE email = 'florian.lantigner@ik.me';

-- Quitter
\q
```

---

### Méthode 3 : Créer l'utilisateur et la base de données (PostgreSQL local)

**Si vous utilisez PostgreSQL local et que l'utilisateur n'existe pas :**

1. Ouvrez SQL Shell (psql)
2. Connectez-vous en tant que `postgres` (superutilisateur)
3. Exécutez :

```sql
-- Créer l'utilisateur
CREATE USER chessbet_user WITH PASSWORD 'Dark-Revan-GE-9418657';

-- Créer la base de données
CREATE DATABASE chessbet_db OWNER chessbet_user;

-- Donner les permissions
GRANT ALL PRIVILEGES ON DATABASE chessbet_db TO chessbet_user;

-- Se connecter à la nouvelle base
\c chessbet_db

-- Donner les permissions sur le schéma public
GRANT ALL ON SCHEMA public TO chessbet_user;
```

---

## 🎯 Workflow typique

1. **Au démarrage du PC :**
   ```powershell
   # 1. Démarrer PostgreSQL (Docker ou service local)
   cd C:\xampp\htdocs\ChessBet
   docker compose -f infra/docker-compose.yml up -d postgres
   # OU : Le service PostgreSQL local démarre automatiquement
   
   # 2. Démarrer le backend (Terminal 1)
   cd C:\xampp\htdocs\ChessBet\backend
   npm run start:dev
   
   # 3. Démarrer le frontend (Terminal 2)
   cd C:\xampp\htdocs\ChessBet\frontend
   npm run dev
   ```

2. **Pendant le travail :**
   - Les deux terminaux restent ouverts
   - Les modifications sont rechargées automatiquement (hot reload)
   - Vérifiez les logs en cas d'erreur

3. **À la fin de la session :**
   - `Ctrl + C` dans les deux terminaux
   - Optionnel : `docker compose -f infra/docker-compose.yml stop postgres`

---

## 📚 Documentation complète

- **Index complet :** [README principal](../../README.md)
- **Backend :** Documentation organisée par phases
- **Frontend :** Documentation organisée par phases
- **Configuration SMTP :** [Configuration SMTP Infomaniak](../backend/phase-00_smtp-configuration_infomaniak-backend.md)

---

---

## 📊 Récapitulatif des commandes essentielles

### Démarrage complet (première fois)

```powershell
# Terminal 1 - PostgreSQL (si Docker)
cd C:\xampp\htdocs\ChessBet
docker compose -f infra/docker-compose.yml up -d postgres

# Terminal 2 - Backend
cd C:\xampp\htdocs\ChessBet\backend
npx prisma migrate deploy  # Première fois uniquement
npm run start:dev

# Terminal 3 - Frontend
cd C:\xampp\htdocs\ChessBet\frontend
npm run dev
```

### Démarrage rapide (après première configuration)

```powershell
# Terminal 1 - Backend
cd C:\xampp\htdocs\ChessBet\backend
npm run start:dev

# Terminal 2 - Frontend
cd C:\xampp\htdocs\ChessBet\frontend
npm run dev
```

### Accès à la base de données

```powershell
# Prisma Studio (interface graphique)
cd C:\xampp\htdocs\ChessBet\backend
npx prisma studio
# Puis ouvrez http://localhost:5555
```

---

**Dernière mise à jour :** Décembre 2025



