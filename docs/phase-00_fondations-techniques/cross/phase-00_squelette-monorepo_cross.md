# Elite64 - Plateforme de Tournois d'Échecs (Skill-Based)

Plateforme de tournois d'échecs avec prize pools fixes, conçue comme un **concours de compétence** (skill competition), légal dans les pays où les skill games sont autorisés.

## 🏗️ Architecture

Monorepo contenant :
- **Backend** : NestJS + Prisma + PostgreSQL
- **Frontend** : Next.js + React + TailwindCSS
- **Infra** : Docker + docker-compose

## 📁 Structure du Projet

```
Elite64/
├── backend/                    # API NestJS
│   ├── src/
│   │   ├── modules/
│   │   │   ├── players/        # Module joueurs (à développer)
│   │   │   ├── wallets/       # Module portefeuilles (à développer)
│   │   │   ├── tournaments/   # Module tournois (à développer)
│   │   │   ├── matches/       # Module matchs (à développer)
│   │   │   ├── country-rules/ # Module règles légales (à développer)
│   │   │   └── prize-pool/    # Module prize pools (à développer)
│   │   ├── app.module.ts
│   │   ├── app.controller.ts
│   │   ├── app.service.ts
│   │   └── main.ts
│   ├── prisma/
│   │   └── schema.prisma      # Schéma Prisma (modèle Player de base)
│   ├── package.json
│   ├── tsconfig.json
│   ├── nest-cli.json
│   ├── Dockerfile
│   └── .eslintrc.js
├── frontend/                   # Application Next.js
│   ├── pages/
│   │   ├── index.tsx          # Page d'accueil
│   │   ├── login.tsx          # Page de connexion
│   │   ├── register.tsx       # Page d'inscription
│   │   ├── lobby.tsx          # Lobby des tournois
│   │   ├── profile.tsx        # Profil utilisateur
│   │   └── _app.tsx
│   ├── styles/
│   │   └── globals.css        # Styles globaux + TailwindCSS
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── Dockerfile
├── infra/                      # Configuration Docker
│   ├── docker-compose.yml     # Orchestration des services
│   └── .dockerignore
├── .gitignore
├── env.example                 # Exemple de variables d'environnement
└── README.md
```

## 🚀 Démarrage Rapide

### Prérequis
- Docker et Docker Compose installés
- Node.js 18+ (pour le développement local sans Docker)

### Avec Docker (Recommandé)

```bash
# 1. Copier le fichier d'environnement
cp env.example .env

# 2. Lancer tous les services depuis le dossier infra
cd infra
docker-compose up -d

# Ou depuis la racine :
docker-compose -f infra/docker-compose.yml up -d

# 3. Les services seront disponibles sur :
#    - Frontend: http://localhost:3000
#    - Backend: http://localhost:4000
#    - PostgreSQL: localhost:5432

# 4. Vérifier que le backend fonctionne
curl http://localhost:4000/health
# Devrait retourner: {"status":"ok","timestamp":"..."}

# 5. Arrêter les services
docker-compose -f infra/docker-compose.yml down

# 6. Arrêter et supprimer les volumes (⚠️ supprime les données)
docker-compose -f infra/docker-compose.yml down -v
```

### Développement Local (sans Docker)

#### Backend
```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run start:dev
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 📝 Variables d'Environnement

Voir `env.example` pour la liste complète des variables nécessaires. Copiez ce fichier en `.env` et ajustez les valeurs selon vos besoins.

## 🎯 Modules Backend (à développer)

- `players` : Gestion des joueurs
- `wallets` : Gestion des portefeuilles (futur)
- `tournaments` : Gestion des tournois
- `matches` : Gestion des matchs
- `country-rules` : Règles légales par pays
- `prize-pool` : Calcul et distribution des prize pools

## ⚖️ Conformité Légale

Cette plateforme est conçue comme un **concours de compétence** (skill competition), pas un jeu de hasard. Les joueurs paient un droit d'entrée et le prize pool est redistribué selon les résultats des matchs.

## 🔧 Points d'Extension Futurs

### Logique des Tournois
- **Module `tournaments`** : Création, gestion du cycle de vie, inscriptions
- **Module `matches`** : Enregistrement des résultats, validation des matchs
- Intégration avec un moteur d'échecs pour la validation des parties

### Calcul des Prize Pools
- **Module `prize-pool`** : Logique centralisée pour :
  - Calcul des prize pools fixes selon le nombre de participants
  - Distribution selon les résultats (1er, 2ème, 3ème, etc.)
  - Gestion des égalités et cas particuliers
- **Module `wallets`** : Gestion centralisée de toutes les transactions financières
  - Dépôts (droits d'entrée)
  - Retraits (gains)
  - Historique des transactions

### Gestion Multi-Pays / Zones Légales
- **Module `country-rules`** : Vérification de conformité par pays
  - Liste des pays autorisés
  - Règles spécifiques par juridiction
  - Validation avant inscription à un tournoi
  - Blocage géographique si nécessaire

### Architecture de Sécurité
- Authentification JWT
- Validation des entrées utilisateur
- Rate limiting
- Logging et monitoring

## 📄 Licence

[À définir]

