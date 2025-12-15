# ChessBet

Plateforme de tournois d'échecs en ligne basée sur le skill (compétition de compétence).

## Documentation

- **[Baseline Phase 5](./docs/phase-05_matches-et-brackets/cross/phase-05_baseline-reference_cross.md)** : Documentation complète de l'état figé du projet à la fin de la Phase 5
- **[Documentation complète](./docs/README.md)** : Index de toute la documentation technique du projet
- **[Démarrage rapide](./docs/phase-00_fondations-techniques/cross/phase-00_quickstart-condense_cross.md)** : Guide condensé pour lancer le projet en local

## Structure du projet

```
ChessBet/
├── backend/          # API NestJS + Prisma + PostgreSQL
├── frontend/         # Application Next.js (Pages Router)
├── infra/            # Configuration Docker, docker-compose
└── docs/             # Documentation technique organisée par phases
    ├── phase-00_fondations-techniques/     # Infra, Prisma, SMTP
    ├── phase-01_auth-et-comptes-joueurs/   # Auth JWT, Players, Wallets
    ├── phase-02_wallets-et-transactions/   # Transactions centralisées
    ├── phase-03_tournois-structure/        # Tournaments, PrizePool
    ├── phase-04_prize-pool-et-moderation/  # Rôles, admin, modération
    ├── phase-05_matches-et-brackets/       # Brackets, matches, frontend
    ├── phase-06_gameplay-echecs/           # Moteur échecs, gameplay
    └── _archives/                          # Documents obsolètes
```

## Technologies

- **Backend** : NestJS, Prisma, PostgreSQL, JWT
- **Frontend** : Next.js, Tailwind CSS, React
- **Base de données** : PostgreSQL

## Démarrage rapide

Voir [Guide de démarrage rapide](./docs/phase-00_fondations-techniques/cross/phase-00_quickstart-condense_cross.md) pour les instructions complètes.

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

Le projet est actuellement à la **Phase 6.0.C** côté backend (orchestration gameplay HTTP), avec :

- **Phase 6.0.A terminée** ✅ (Prisma uniquement)  
  - Extension du modèle `Match` avec champs gameplay (FEN, temps, no-show, tie-break, rating)
  - Création du modèle `MatchMove` pour stocker l'historique des coups
  - Création de l'enum `MatchColor` (WHITE, BLACK)
  - Migration Prisma appliquée : `20251214165847_phase6_0a_add_match_gameplay_fields`

- **Phase 6.0.B terminée** ✅ (Moteur d'échecs backend)  
  - Service `ChessEngineService` pur et déterministe basé sur `chess.js`
  - Validation de coups, calcul de SAN, détection des fins de partie (checkmate, stalemate, 50 coups, insuffisance de matériel, répétition)
  - Couverture de tests dédiée

- **Phase 6.0.C terminée** ✅ (Backend Gameplay Orchestration)  
  - Endpoints HTTP protégés :  
    - `POST /matches/:id/join`  
    - `GET /matches/:id/state`  
    - `POST /matches/:id/move`  
    - `POST /matches/:id/resign`  
  - DTO canonique `MatchStateViewDto` comme source de vérité pour l'état d'un match
  - Persistance des coups dans `MatchMove` (1 ligne par coup) avec FEN avant/après, SAN et temps restants
  - Gestion des fins de partie : checkmate, stalemate, insufficient material, fifty-move rule, threefold, timeout, résignation
  - Logique de no-show **lazy** avant premier coup (`JOIN_WINDOW_SECONDS = 30`, `NO_SHOW_GRACE_SECONDS = 60`, résolution automatique après `readyAt + 90s`)
  - Intégration avec la Phase 5 via `generateNextRoundIfNeeded()` sans modifier `finalizeTournamentAndPayouts()`

**Garanties globales** :
- Phase 5 inchangée : aucun champ Phase 5 modifié ou supprimé, logique de brackets/payouts préservée.
- Base de données : source de vérité synchronisée.
- UTC : toutes les dates en UTC (timestamps générés côté serveur).

### Phase 5 (figée)

La **Phase 5** est figée et taggée `baseline-phase5-202512`.

Pour plus de détails sur l'état exact de la Phase 5, consultez [Baseline Phase 5](./docs/phase-05_matches-et-brackets/cross/phase-05_baseline-reference_cross.md).
