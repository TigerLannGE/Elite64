# Elite64

Plateforme de tournois d'échecs en ligne basée sur le skill (compétition de compétence).

## Documentation

- **[Documentation complète](./docs/README.md)** : Index de toute la documentation technique du projet
- **[Référentiel normatif](./docs/governance/REFERENTIEL_NORMATIF.md)** : Documents normatifs 01-08 (source de vérité stratégique, juridique, produit)
- **[Amendement Finance - Prélèvement 9,75%](./docs/governance/AMENDEMENTS/AMENDEMENT_FINANCE_PRELEVEMENT_9_75_2026-01-01.md)** : Amendement normatif établissant le prélèvement opérateur explicite de 9,75% (01/01/2026)
- **[Audit de convergence 2026-01-01](./docs/governance/audits/audit-convergence-2026-01-01.md)** : Audit complet de conformité avec les documents normatifs
- **[Baseline Phase 5](./docs/phase-05_matches-et-brackets/cross/phase-05_baseline-reference_cross.md)** : Documentation complète de l'état figé du projet à la fin de la Phase 5
- **[Démarrage rapide](./docs/phase-00_fondations-techniques/cross/phase-00_quickstart-condense_cross.md)** : Guide condensé pour lancer le projet en local

## Structure du projet

```
Elite64/
├── backend/          # API NestJS + Prisma + PostgreSQL
├── frontend/         # Application Next.js (Pages Router)
├── infra/            # Configuration Docker, docker-compose
└── docs/             # Documentation complète du projet
    ├── phase-00_fondations-techniques/     # Infra, Prisma, SMTP
    ├── phase-01_auth-et-comptes-joueurs/   # Auth JWT, Players, Wallets
    ├── phase-02_wallets-et-transactions/   # Transactions centralisées
    ├── phase-03_tournois-structure/        # Tournaments, PrizePool
    ├── phase-04_prize-pool-et-moderation/  # Rôles, admin, modération
    ├── phase-05_matches-et-brackets/       # Brackets, matches, frontend
    ├── phase-06_gameplay-echecs/           # Moteur échecs, gameplay
    ├── governance/                        # Documents normatifs et audits
    │   ├── REFERENTIEL_NORMATIF.md        # Référentiel documents 01-08
    │   ├── AMENDEMENTS/                   # Amendements au référentiel normatif
    │   │   └── AMENDEMENT_FINANCE_PRELEVEMENT_9_75_2026-01-01.md
    │   ├── reference_01_08/               # PDFs normatifs (01 à 08)
    │   └── audits/                       # Rapports d'audits de convergence
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

### Phases Complétées

#### **Phase 6.0.C** ✅ - Backend Gameplay Orchestration (tag: `phase6-0c-20251215`)

- **Phase 6.0.A** ✅ - Extension Prisma
  - Extension du modèle `Match` avec champs gameplay (FEN, temps, no-show, tie-break, rating)
  - Création du modèle `MatchMove` pour stocker l'historique des coups
  - Création de l'enum `MatchColor` (WHITE, BLACK)
  - Migration Prisma appliquée : `20251214165847_phase6_0a_add_match_gameplay_fields`

- **Phase 6.0.B** ✅ - Moteur d'échecs backend
  - Service `ChessEngineService` pur et déterministe basé sur `chess.js`
  - Validation de coups, calcul de SAN, détection des fins de partie
  - Couverture de tests dédiée

- **Phase 6.0.C** ✅ - Orchestration gameplay HTTP
  - Endpoints HTTP protégés : `POST /matches/:id/join`, `GET /matches/:id/state`, `POST /matches/:id/move`, `POST /matches/:id/resign`
  - DTO canonique `MatchStateViewDto` comme source de vérité
  - Persistance des coups dans `MatchMove` (1 ligne par coup)
  - Gestion des fins de partie : checkmate, stalemate, insufficient material, fifty-move rule, threefold, timeout, résignation
  - Logique de no-show **lazy** avant premier coup (90s)
  - Intégration avec la Phase 5 via `generateNextRoundIfNeeded()`

#### **Phase 6.1** ✅ - Frontend Gameplay MVP (tag: `phase6-1-20251216`)

- Page `/matches/[id]` avec échiquier interactif (`react-chessboard` 4.7.2, licence MIT)
- Gameplay complet : jouer des coups, promotion des pions, résignation
- Polling automatique (2 secondes) pour mises à jour temps réel
- Navigation depuis page tournoi vers match jouable
- **Note** : MVP strict (pas de chronomètre visuel, pas de WebSocket, pas d'historique des coups)

#### **Phase 6.2** ✅ - Tests E2E Gameplay Complets (tag: `phase6-2-20251216`)

- Scripts E2E exhaustifs : `frontend/scripts/e2e-gameplay.ts` (5/6 tests PASS), `frontend/scripts/e2e-gameplay-comprehensive.ts` (11/11 tests PASS - 100%)
- Validation de tous les types de mouvements aux échecs (promotions, roques, en passant, résignation)
- Logging automatique dans `test-results/`
- Documentation complète des tests et résultats

**Garanties globales** :
- Phase 5 inchangée : aucun champ Phase 5 modifié ou supprimé, logique de brackets/payouts préservée
- Base de données : source de vérité synchronisée
- UTC : toutes les dates en UTC (timestamps générés côté serveur)

#### **Amendement Normatif - Prélèvement 9,75%** ✅ (01/01/2026)

- **Amendement Finance** : Prélèvement opérateur explicite de 9,75% (commission plateforme 5% + frais d'organisation 4,75%)
- Calcul canonique implémenté : `operatorTotalCents = commissionCents + tournamentFeesCents`
- Stockage explicite en base : `tournamentFeesCents` et `operatorTotalCents` ajoutés au modèle `PrizePool`
- Migration Prisma : `20260101185838_add_tournament_fees_explicit`
- Script de validation : `backend/scripts/validate-prize-pool-invariants.ts` (tous les tests passent)
- Documentation : [Amendement Finance - Prélèvement 9,75%](./docs/governance/AMENDEMENTS/AMENDEMENT_FINANCE_PRELEVEMENT_9_75_2026-01-01.md)

### Phase 5 (figée)

La **Phase 5** est figée et taggée `baseline-phase5-202512`.

Pour plus de détails sur l'état exact de la Phase 5, consultez [Baseline Phase 5](./docs/phase-05_matches-et-brackets/cross/phase-05_baseline-reference_cross.md).

### Tags Git Disponibles

- `baseline-phase5-202512` : Phase 5 complète (brackets, matches, standings, frontend)
- `phase6-0c-20251215` : Backend gameplay HTTP (orchestration complète)
- `phase6-1-20251216` : Frontend gameplay MVP (échiquier interactif)
- `phase6-2-20251216` : Tests E2E gameplay (validation complète)
- `maintenance-structure-20251216` : Nettoyage structure projet
