# ChessBet

Plateforme de tournois d'échecs en ligne basée sur le skill (compétition de compétence).

## Documentation

- **[Baseline Phase 5](./docs/BASELINE-PHASE5.md)** : Documentation complète de l'état figé du projet à la fin de la Phase 5
- **[Documentation complète](./docs/README.md)** : Index de toute la documentation technique du projet
- **[Démarrage rapide](./docs/DEMARRAGE-RAPIDE.md)** : Guide condensé pour lancer le projet en local

## Structure du projet

```
ChessBet/
├── backend/          # API NestJS + Prisma + PostgreSQL
├── frontend/         # Application Next.js (Pages Router)
├── infra/            # Configuration Docker, docker-compose
└── docs/             # Documentation technique complète
    ├── BASELINE-PHASE5.md  # État figé de la Phase 5
    └── DEMARRAGE-RAPIDE.md # Guide de démarrage rapide
```

## Technologies

- **Backend** : NestJS, Prisma, PostgreSQL, JWT
- **Frontend** : Next.js, Tailwind CSS, React
- **Base de données** : PostgreSQL

## Démarrage rapide

Voir [DEMARRAGE-RAPIDE.md](./docs/DEMARRAGE-RAPIDE.md) pour les instructions complètes.

### Commandes essentielles

**PostgreSQL (Docker)** :
```powershell
docker compose -f infra/docker-compose.yml up -d postgres
```

**Backend** :
```powershell
cd backend
npm run start:dev
```

**Frontend** :
```powershell
cd frontend
npm run dev
```

## État actuel

Le projet est actuellement à la **Phase 6.0.A** (Prisma uniquement).

### Phase 6.0.A terminée ✅

**Date de complétion** : 14 Décembre 2025

**Modifications apportées** :
- Extension du modèle `Match` avec champs gameplay (FEN, temps, no-show, tie-break, rating)
- Création du modèle `MatchMove` pour stocker l'historique des coups
- Création de l'enum `MatchColor` (WHITE, BLACK)
- Migration Prisma appliquée : `20251214165847_phase6_0a_add_match_gameplay_fields`

**Garanties** :
- Phase 5 inchangée : aucun champ Phase 5 modifié ou supprimé
- Base de données : source de vérité synchronisée
- UTC : toutes les dates en UTC

**Note** : Cette phase concerne uniquement le schéma Prisma. Aucun service NestJS ni controller n'a été modifié.

### Phase 5 (figée)

La **Phase 5** est figée et taggée `baseline-phase5-202512`.

Pour plus de détails sur l'état exact de la Phase 5, consultez [BASELINE-PHASE5.md](./docs/BASELINE-PHASE5.md).
