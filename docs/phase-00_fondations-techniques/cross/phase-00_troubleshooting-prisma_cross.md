# Troubleshooting Prisma - Guide de Dépannage

**Date de création** : 15 décembre 2025  
**Dernière mise à jour** : 15 décembre 2025  
**Statut** : ✅ Complété

---

## 📋 Vue d'ensemble

Ce document recense les problèmes courants liés à Prisma et leurs solutions, avec un focus particulier sur les migrations et la synchronisation base de données / schéma.

**⚠️ Important** : Prisma nécessite que le schéma (`schema.prisma`) soit toujours synchronisé avec la base de données PostgreSQL. Un désalignement cause des erreurs au runtime.

---

## 🎯 Problèmes Courants

### ❌ Erreur : "The column `table.column` does not exist in the current database"

#### Symptômes

```
PrismaClientKnownRequestError:
Invalid `this.prisma.match.findFirst()` invocation

The column `matches.initialFen` does not exist in the current database.
```

**Backend crash** avec erreur 500 lors de l'appel à une opération Prisma.

#### Cause

Les **migrations Prisma ne sont pas appliquées** à la base de données. Le schéma Prisma a été mis à jour (nouveau champ ajouté), mais la base de données PostgreSQL ne contient pas encore cette colonne.

#### Solution 1 : Appliquer les migrations manquantes

**Étape 1** : Vérifier le statut des migrations

```bash
cd backend
npx prisma migrate status
```

**Résultat attendu** :
```
Database schema is up to date!
```

**Si des migrations sont en attente** :
```
Following migration(s) have not yet been applied:
20251214165847_phase6_0a_add_match_gameplay_fields
```

**Étape 2** : Appliquer les migrations

```bash
npx prisma migrate deploy
```

Cela applique toutes les migrations en attente.

**Étape 3** : Vérifier la synchronisation

```bash
npx prisma db push --skip-generate
```

**Résultat attendu** :
```
Your database is now in sync with your Prisma schema. Done in 86ms
```

**Étape 4** : Redémarrer le backend

```bash
npm run start:dev
```

---

#### Solution 2 : Reset complet (développement uniquement)

⚠️ **DANGER** : Cette commande **supprime toutes les données** de la base de données.

**À utiliser uniquement si** :
- Vous êtes en environnement de développement
- Les données de test peuvent être recréées
- Les migrations sont dans un état incohérent

```bash
cd backend
npx prisma migrate reset --force
```

**Ce que fait cette commande** :
1. Supprime la base de données
2. Recrée la base de données
3. Applique **toutes** les migrations dans l'ordre
4. Exécute le seed (si configuré)
5. Régénère le client Prisma

**Après le reset** :
- ✅ Base de données propre et à jour
- ❌ Toutes les données supprimées (joueurs, tournois, matches, etc.)
- 🔄 Vous devez recréer vos données de test

---

### ❌ Erreur : "type 'EnumName' already exists"

#### Symptômes

```
Migration failed to apply

Database error:
ERROR: type "MatchStatus" already exists
```

#### Cause

**État incohérent des migrations** : Prisma pense que la migration n'a pas été appliquée, mais certains objets (types enum, tables) existent déjà dans la base de données.

Cela arrive quand :
- Une migration a été partiellement appliquée
- Des modifications manuelles ont été faites sur la DB
- La table `_prisma_migrations` est désynchronisée

#### Solution : Reset forcé

La seule solution fiable en développement :

```bash
cd backend
npx prisma migrate reset --force
```

**Alternative en production** : Marquer la migration comme résolue manuellement (voir [documentation Prisma](https://pris.ly/d/migrate-resolve)).

---

### ❌ Erreur : "Cannot find module '@prisma/client'"

#### Symptômes

```
Error: Cannot find module '@prisma/client'
```

Le backend ne démarre pas, erreur lors de l'import de `PrismaClient`.

#### Cause

Le **client Prisma n'a pas été généré** après l'installation ou après une modification du schéma.

#### Solution

```bash
cd backend
npx prisma generate
```

Cela régénère le client TypeScript basé sur `schema.prisma`.

**Note** : Le client est automatiquement généré lors de `npm install` (hook postinstall), mais peut nécessiter une régénération manuelle après :
- Modification du `schema.prisma`
- Changement de branche Git
- Récupération du code depuis un autre PC

---

### ❌ Erreur : "Can't reach database server at `localhost:5433`"

#### Symptômes

```
Error: P1001
Can't reach database server at `localhost:5433`
Please make sure your database server is running at `localhost:5433`.
```

#### Cause

La **base de données PostgreSQL n'est pas démarrée** ou n'écoute pas sur le bon port.

#### Solution

**Vérifier que PostgreSQL est démarré** :

**Si Docker (port 5433)** :
```bash
cd C:\xampp\htdocs\Elite64
docker compose -f infra/docker-compose.yml up -d postgres
```

Vérifier le statut :
```bash
docker compose -f infra/docker-compose.yml ps
```

Devrait afficher : `postgres` avec statut `healthy`.

**Si PostgreSQL local (port 5432)** :
```bash
# Windows - Vérifier le service
net start postgresql-x64-17
```

**Vérifier la connexion manuellement** :
```bash
# Port 5433 (Docker)
psql -h localhost -p 5433 -U elite64_user -d elite64_db

# Port 5432 (Local)
psql -h localhost -p 5432 -U elite64_user -d elite64_db
```

**Vérifier le `.env`** :
```env
# Docker (port 5433)
DATABASE_URL=postgresql://elite64_user:Dark-Revan-GE-9418657@localhost:5433/elite64_db?schema=public

# Local (port 5432)
DATABASE_URL=postgresql://elite64_user:Dark-Revan-GE-9418657@localhost:5432/elite64_db?schema=public
```

---

### ❌ Erreur : "Authentication failed for user `elite64_user`"

#### Symptômes

```
Error: P1001
Authentication failed against database server at `localhost:5433`
The provided database credentials for `elite64_user` are not valid.
```

#### Cause

Le **mot de passe dans `.env` ne correspond pas** au mot de passe configuré dans PostgreSQL.

#### Solution

**Vérifier le `.env`** :
```env
DATABASE_URL=postgresql://elite64_user:Dark-Revan-GE-9418657@localhost:5433/elite64_db?schema=public
                                      ^^^^^^^^^^^^^^^^^^^^
                                      Vérifier ce mot de passe
```

**Si Docker** : Le mot de passe est défini dans `infra/docker-compose.yml` :
```yaml
environment:
  POSTGRES_USER: elite64_user
  POSTGRES_PASSWORD: Dark-Revan-GE-9418657
  POSTGRES_DB: elite64_db
```

**Si PostgreSQL local** : Recréer l'utilisateur avec le bon mot de passe :
```sql
-- Se connecter en tant que superutilisateur
psql -U postgres

-- Supprimer l'ancien utilisateur (si existe)
DROP USER IF EXISTS elite64_user;

-- Recréer avec le bon mot de passe
CREATE USER elite64_user WITH PASSWORD 'Dark-Revan-GE-9418657';

-- Donner les droits sur la DB
GRANT ALL PRIVILEGES ON DATABASE elite64_db TO elite64_user;
```

---

## 🔧 Commandes Utiles Prisma

### Diagnostic

```bash
# Vérifier le statut des migrations
npx prisma migrate status

# Afficher le schéma actuel de la DB
npx prisma db pull

# Vérifier la connexion à la DB
npx prisma db execute --stdin < /dev/null
```

### Migrations

```bash
# Créer une nouvelle migration (après modification du schema.prisma)
npx prisma migrate dev --name nom_de_la_migration

# Appliquer les migrations en attente
npx prisma migrate deploy

# Réinitialiser la DB (⚠️ DANGER : supprime toutes les données)
npx prisma migrate reset --force

# Résoudre une migration échouée (production)
npx prisma migrate resolve --rolled-back 20251214165847_nom_migration
```

### Client Prisma

```bash
# Régénérer le client Prisma
npx prisma generate

# Ouvrir Prisma Studio (interface graphique)
npx prisma studio
```

### Synchronisation

```bash
# Pousser le schéma vers la DB (sans migration)
npx prisma db push

# Pousser sans régénérer le client
npx prisma db push --skip-generate

# Tirer le schéma depuis la DB (créer schema.prisma depuis DB existante)
npx prisma db pull
```

---

## 📊 Workflow de Résolution

### Problème : Backend ne démarre pas à cause de Prisma

```mermaid
graph TD
    A[Backend crash avec erreur Prisma] --> B{Type d'erreur ?}
    B -->|Column does not exist| C[npx prisma migrate status]
    B -->|Type already exists| D[npx prisma migrate reset --force]
    B -->|Cannot find module| E[npx prisma generate]
    B -->|Can't reach database| F[Démarrer PostgreSQL]
    B -->|Authentication failed| G[Vérifier .env et credentials]
    
    C --> H{Migrations en attente ?}
    H -->|Oui| I[npx prisma migrate deploy]
    H -->|Non| J[npx prisma db push]
    
    I --> K[Redémarrer backend]
    J --> K
    D --> K
    E --> K
    F --> C
    G --> C
    
    K --> L{Backend démarre ?}
    L -->|Non| M[Reset complet requis]
    L -->|Oui| N[✅ Problème résolu]
    
    M --> D
```

---

## 🛡️ Bonnes Pratiques

### ✅ À FAIRE

1. **Toujours appliquer les migrations après un `git pull`**
   ```bash
   git pull
   cd backend
   npx prisma migrate deploy
   npm run start:dev
   ```

2. **Vérifier le statut avant de démarrer** (premier démarrage de la journée)
   ```bash
   npx prisma migrate status
   ```

3. **Créer une migration après modification du schéma**
   ```bash
   # Après modification de prisma/schema.prisma
   npx prisma migrate dev --name description_du_changement
   ```

4. **Utiliser `migrate deploy` en production**
   ```bash
   # Ne JAMAIS utiliser migrate dev en prod
   npx prisma migrate deploy
   ```

5. **Sauvegarder avant un reset**
   ```bash
   # Exporter les données avant reset
   pg_dump -h localhost -p 5433 -U elite64_user elite64_db > backup.sql
   
   # Reset
   npx prisma migrate reset --force
   
   # Restaurer si besoin
   psql -h localhost -p 5433 -U elite64_user elite64_db < backup.sql
   ```

### ❌ À ÉVITER

1. ❌ **Modifier manuellement la base de données**
   - Toujours passer par des migrations Prisma
   - Sinon : désynchronisation schéma / DB

2. ❌ **Supprimer des migrations existantes**
   - Ne jamais supprimer un fichier dans `prisma/migrations/`
   - Créer une nouvelle migration pour reverter

3. ❌ **Utiliser `db push` en production**
   - `db push` est pour le prototypage rapide
   - En prod : toujours utiliser `migrate deploy`

4. ❌ **Ignorer les erreurs de migration**
   - Ne pas continuer si une migration échoue
   - Résoudre immédiatement ou faire un reset

5. ❌ **Commiter sans tester les migrations**
   - Toujours appliquer et tester localement
   - Vérifier que le backend démarre après la migration

---

## 🔗 Ressources

### Documentation officielle
- [Prisma Migrations](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Migration Troubleshooting](https://www.prisma.io/docs/guides/migrate/production-troubleshooting)
- [Prisma Client](https://www.prisma.io/docs/concepts/components/prisma-client)

### Autres documentations Elite64
- [Schéma Prisma - Vue d'ensemble](../backend/phase-00_prisma-schema_overview-backend.md)
- [Démarrage rapide](./phase-00_quickstart-detaille_cross.md)
- [Restauration base de données](./phase-00_postgresql-restore_cross.md)

---

## 📝 Cas d'Usage Réel : Phase 6.0.A

### Contexte

Lors de l'implémentation de la **Phase 6.0.A** (Extension schéma pour gameplay), de nouveaux champs ont été ajoutés au modèle `Match` :
- `initialFen`
- `currentFen`
- `moveNumber`
- `turn`
- `whiteTimeMsRemaining`
- `blackTimeMsRemaining`
- etc.

Une migration a été créée : `20251214165847_phase6_0a_add_match_gameplay_fields`

### Problème rencontré

**Symptôme** : Impossible de démarrer un tournoi via l'admin
```
Error: The column `matches.initialFen` does not exist in the current database.
```

**Cause** : La migration Phase 6.0.A n'avait pas été appliquée à la base de données.

**Solution appliquée** :
```bash
cd backend
npx prisma migrate reset --force
```

**Résultat** :
- ✅ Toutes les 5 migrations appliquées (incluant Phase 6.0.A)
- ✅ Base de données synchronisée
- ✅ Backend redémarre sans erreur
- ✅ Création de tournoi fonctionnelle

**Lesson learned** : Toujours vérifier `npx prisma migrate status` après un `git pull` qui modifie le schéma Prisma.

---

## 🚨 Checklist de Dépannage

Quand le backend ne démarre pas à cause de Prisma :

- [ ] PostgreSQL est-il démarré ?
  ```bash
  docker compose -f infra/docker-compose.yml ps
  # OU
  net start postgresql-x64-17
  ```

- [ ] Le `.env` pointe-t-il vers le bon port ?
  ```env
  DATABASE_URL=postgresql://...@localhost:5433/... # Docker
  # OU
  DATABASE_URL=postgresql://...@localhost:5432/... # Local
  ```

- [ ] Les migrations sont-elles à jour ?
  ```bash
  npx prisma migrate status
  ```

- [ ] Le client Prisma est-il généré ?
  ```bash
  npx prisma generate
  ```

- [ ] La base de données est-elle accessible ?
  ```bash
  psql -h localhost -p 5433 -U elite64_user -d elite64_db
  ```

- [ ] Y a-t-il des erreurs dans les logs du backend ?
  ```bash
  npm run start:dev
  # Lire les logs attentivement
  ```

Si toutes les étapes échouent :
```bash
npx prisma migrate reset --force
npm run start:dev
```

---

**Statut final** : ✅ **100% complété**

