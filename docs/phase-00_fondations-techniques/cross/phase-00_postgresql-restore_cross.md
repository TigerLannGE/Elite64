# Restauration Base de Données PostgreSQL - Documentation Transversale

**Date de création** : 01 décembre 2025  
**Dernière mise à jour** : 01 décembre 2025  
**Statut** : ✅ Complété

---

## 📋 Vue d'ensemble

**Guide pour importer une base de données précédente après un rollback**

## 📋 Prérequis

- Un fichier de dump PostgreSQL (`.sql` ou `.dump`)
- PostgreSQL démarré (Docker ou local)
- Accès psql ou pg_restore

---

## 🎯 Méthode 1 : Import via psql (fichier .sql)

### Option A : PostgreSQL Docker (port 5433)

**1. Vérifier que PostgreSQL est démarré :**
```powershell
docker compose -f infra/docker-compose.yml ps
```

**2. Importer le dump SQL :**
```powershell
# Depuis la racine du projet
psql -h localhost -p 5433 -U elite64_user -d elite64_db -f chemin/vers/votre/dump.sql
```

**Exemple avec mot de passe en ligne de commande :**
```powershell
$env:PGPASSWORD="Dark-Revan-GE-9418657"
psql -h localhost -p 5433 -U elite64_user -d elite64_db -f C:\chemin\vers\dump.sql
```

**Ou via variable d'environnement PowerShell :**
```powershell
$env:PGPASSWORD="Dark-Revan-GE-9418657"; psql -h localhost -p 5433 -U elite64_user -d elite64_db -f C:\chemin\vers\dump.sql
```

### Option B : PostgreSQL Local (port 5432)

```powershell
$env:PGPASSWORD="Dark-Revan-GE-9418657"
psql -h localhost -p 5432 -U elite64_user -d elite64_db -f C:\chemin\vers\dump.sql
```

---

## 🎯 Méthode 2 : Import via pg_restore (fichier .dump)

### Option A : PostgreSQL Docker (port 5433)

**1. Importer le dump :**
```powershell
$env:PGPASSWORD="Dark-Revan-GE-9418657"
pg_restore -h localhost -p 5433 -U elite64_user -d elite64_db -v C:\chemin\vers\dump.dump
```

**2. Si vous voulez recréer la base (supprime tout avant) :**
```powershell
# D'abord, supprimer et recréer la base
psql -h localhost -p 5433 -U elite64_user -d postgres -c "DROP DATABASE IF EXISTS elite64_db;"
psql -h localhost -p 5433 -U elite64_user -d postgres -c "CREATE DATABASE elite64_db;"

# Puis importer
$env:PGPASSWORD="Dark-Revan-GE-9418657"
pg_restore -h localhost -p 5433 -U elite64_user -d elite64_db -v C:\chemin\vers\dump.dump
```

### Option B : PostgreSQL Local (port 5432)

```powershell
$env:PGPASSWORD="Dark-Revan-GE-9418657"
pg_restore -h localhost -p 5432 -U elite64_user -d elite64_db -v C:\chemin\vers\dump.dump
```

---

## 🎯 Méthode 3 : Import depuis une autre base de données

Si vous avez accès à une autre base de données PostgreSQL (ex: serveur de production, backup), vous pouvez copier directement :

### Étape 1 : Créer un dump depuis la source

```powershell
# Depuis la base source (ex: production)
pg_dump -h source_host -p source_port -U source_user -d source_db -F c -f backup.dump

# Ou en format SQL
pg_dump -h source_host -p source_port -U source_user -d source_db -f backup.sql
```

### Étape 2 : Importer dans la base locale

Suivre les méthodes 1 ou 2 ci-dessus.

---

## 🎯 Méthode 4 : Import via Docker (si le dump est dans le conteneur)

Si votre fichier de dump est déjà dans le conteneur Docker :

```powershell
# Copier le dump dans le conteneur
docker cp C:\chemin\vers\dump.sql elite64-postgres:/tmp/dump.sql

# Importer depuis le conteneur
docker exec -i elite64-postgres psql -U elite64_user -d elite64_db < C:\chemin\vers\dump.sql

# Ou via exec interactif
docker exec -it elite64-postgres psql -U elite64_user -d elite64_db
# Puis dans psql :
\i /tmp/dump.sql
```

---

## ⚠️ Étapes de Sécurité (Recommandé)

### 1. Sauvegarder la base actuelle AVANT import

```powershell
# Créer un backup de la base actuelle
$env:PGPASSWORD="Dark-Revan-GE-9418657"
pg_dump -h localhost -p 5433 -U elite64_user -d elite64_db -F c -f backup_avant_import_$(Get-Date -Format 'yyyyMMdd_HHmmss').dump
```

### 2. Vider la base avant import (optionnel)

**⚠️ ATTENTION : Cela supprime TOUTES les données !**

```powershell
# Se connecter à PostgreSQL
psql -h localhost -p 5433 -U elite64_user -d postgres

# Dans psql, exécuter :
DROP DATABASE IF EXISTS elite64_db;
CREATE DATABASE elite64_db;

# Quitter
\q
```

### 3. Importer le dump

Suivre une des méthodes ci-dessus.

### 4. Vérifier les migrations Prisma

Après l'import, vérifier que le schéma est cohérent :

```powershell
cd backend
npx prisma migrate status
```

Si nécessaire, réappliquer les migrations :

```powershell
npx prisma migrate deploy
```

---

## 🔍 Vérification Post-Import

### 1. Vérifier les tables

```powershell
psql -h localhost -p 5433 -U elite64_user -d elite64_db -c "\dt"
```

### 2. Vérifier les données

```powershell
psql -h localhost -p 5433 -U elite64_user -d elite64_db -c "SELECT COUNT(*) FROM players;"
psql -h localhost -p 5433 -U elite64_user -d elite64_db -c "SELECT COUNT(*) FROM tournaments;"
psql -h localhost -p 5433 -U elite64_user -d elite64_db -c "SELECT COUNT(*) FROM matches;"
```

### 3. Vérifier via Prisma Studio

```powershell
cd backend
npx prisma studio
```

Accès : `http://localhost:5555`

---

## 📝 Exemple Complet (Workflow Recommandé)

```powershell
# 1. Aller dans le dossier du projet
cd C:\xampp\htdocs\Elite64

# 2. Vérifier que PostgreSQL est démarré
docker compose -f infra/docker-compose.yml ps

# 3. Sauvegarder la base actuelle (sécurité)
$env:PGPASSWORD="Dark-Revan-GE-9418657"
pg_dump -h localhost -p 5433 -U elite64_user -d elite64_db -F c -f backup_avant_import_$(Get-Date -Format 'yyyyMMdd_HHmmss').dump

# 4. Vider la base (OPTIONNEL - seulement si vous voulez tout remplacer)
psql -h localhost -p 5433 -U elite64_user -d postgres -c "DROP DATABASE IF EXISTS elite64_db;"
psql -h localhost -p 5433 -U elite64_user -d postgres -c "CREATE DATABASE elite64_db;"

# 5. Importer le dump
psql -h localhost -p 5433 -U elite64_user -d elite64_db -f C:\chemin\vers\votre_dump.sql

# 6. Vérifier les migrations Prisma
cd backend
npx prisma migrate status

# 7. Si nécessaire, régénérer le client Prisma
npx prisma generate

# 8. Vérifier via Prisma Studio
npx prisma studio
```

---

## 🆘 Dépannage

### Erreur : "password authentication failed"

**Solution** : Vérifier le mot de passe dans `infra/docker-compose.yml` ou votre `.env`

### Erreur : "database does not exist"

**Solution** : Créer la base d'abord :
```powershell
psql -h localhost -p 5433 -U elite64_user -d postgres -c "CREATE DATABASE elite64_db;"
```

### Erreur : "relation already exists"

**Solution** : Vider la base avant import (voir section "Étapes de Sécurité")

### Erreur : "permission denied"

**Solution** : Vérifier que l'utilisateur `elite64_user` a les droits nécessaires :
```powershell
psql -h localhost -p 5433 -U elite64_user -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE elite64_db TO elite64_user;"
```

### Erreur : "connection refused"

**Solution** : Vérifier que PostgreSQL est démarré :
```powershell
docker compose -f infra/docker-compose.yml ps
```

---

## 📚 Commandes Utiles

### Lister les bases de données

```powershell
psql -h localhost -p 5433 -U elite64_user -d postgres -c "\l"
```

### Lister les tables

```powershell
psql -h localhost -p 5433 -U elite64_user -d elite64_db -c "\dt"
```

### Voir la taille de la base

```powershell
psql -h localhost -p 5433 -U elite64_user -d elite64_db -c "SELECT pg_size_pretty(pg_database_size('elite64_db'));"
```

### Se connecter interactivement

```powershell
psql -h localhost -p 5433 -U elite64_user -d elite64_db
```

---

**Note** : Remplacez `C:\chemin\vers\dump.sql` par le chemin réel de votre fichier de dump.

---

## 📝 Notes importantes

- **Version PostgreSQL** : Le projet utilise maintenant PostgreSQL 17 (image `postgres:17-alpine` dans `docker-compose.yml`)
- **Compatibilité des dumps** : Les dumps créés avec PostgreSQL 16+ nécessitent PostgreSQL 17+ pour être restaurés
- **Script d'import** : Utilisez `backend/import-database.ps1` pour un import automatisé avec détection Docker

