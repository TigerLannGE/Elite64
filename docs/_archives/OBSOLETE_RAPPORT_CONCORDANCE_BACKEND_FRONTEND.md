# Rapport d'Audit de Concordance Backend / Frontend

**Date de création** : 15 janvier 2025  
**Statut** : ✅ Complété  
**Portée** : Audit exhaustif de concordance entre backend NestJS et frontend Next.js

---

## 📋 Résumé Exécutif

Cet audit identifie les écarts et incohérences entre le backend (NestJS + Prisma) et le frontend (Next.js + React) du projet Elite64/ChessBet.

**Résultats principaux** :
- **15 endpoints backend non utilisés** par le frontend
- **2 fonctionnalités frontend** sans support backend complet
- **3 incohérences de contrats** (DTO, enums, statuts)
- **8 logiques backend orphelines** (services non exposés)
- **5 risques fonctionnels** identifiés

**Priorités** :
1. **Critique** : Exposer `PATCH /admin/tournaments/:id` (mise à jour tournoi)
2. **Critique** : Exposer `POST /admin/tournaments/:id/finalize` (finalisation tournoi)
3. **Moyen** : Exposer `GET /players/:id` (profil public joueur)
4. **Moyen** : Exposer `GET /matches/tournament/:tournamentId` avec filtrage
5. **Faible** : Documenter les logiques orphelines (TransactionsService, PrizePoolService)

---

## 🔍 Méthodologie d'Analyse

### Sources analysées

**Backend** :
- 9 controllers (routes API)
- 14 services (logique métier)
- 1 schéma Prisma (modèles, enums, relations)
- 8 DTOs (contrats de données)

**Frontend** :
- 30 pages/composants React
- 1 fichier API centralisé (`lib/api.ts`)
- Types TypeScript (interfaces, enums)

### Méthode de détection

1. **Routes backend** : Extraction manuelle depuis les controllers NestJS
2. **Appels frontend** : Analyse de `frontend/lib/api.ts` et grep sur les fichiers `.tsx`
3. **Logiques orphelines** : Identification des services sans routes correspondantes
4. **Incohérences** : Comparaison DTO backend vs types frontend

---

## 📊 Tableau A — Backend Existant / Frontend Manquant

| Élément | Localisation Backend | Localisation Frontend | Statut | Impact | Action Recommandée |
|---------|---------------------|----------------------|--------|--------|-------------------|
| `GET /players` | `players.controller.ts:23` | ❌ Absent | Manquant | Faible | Créer page admin ou profil public |
| `GET /players/:id` | `players.controller.ts:39` | ❌ Absent | Manquant | Moyen | Exposer profil public joueur |
| `GET /players/test` | `players.controller.ts:31` | ❌ Absent | Manquant | Faible | Supprimer (route de test) |
| `GET /wallets/:playerId` | `wallets.controller.ts:24` | ❌ Absent | Manquant | Faible | Exposer wallet public (optionnel) |
| `GET /matches/tournament/:tournamentId` | `matches.controller.ts:25` | ❌ Absent (utilise `/tournaments/:id/matches`) | Partiel | Faible | Documenter ou unifier |
| `GET /matches/me?tournamentId=xxx` | `matches.controller.ts:38` | ❌ Absent | Manquant | Faible | Créer page "Mes matches" |
| `GET /matches/:id` | `matches.controller.ts:100` | ❌ Absent (utilise `/matches/:id/state`) | Partiel | Faible | Documenter ou supprimer |
| `PATCH /admin/tournaments/:id` | `tournaments.controller.ts:112` | ❌ Absent | Manquant | **Critique** | Créer UI admin pour modifier tournoi |
| `POST /admin/tournaments/:id/finalize` | `tournaments.controller.ts:148` | ❌ Absent | Manquant | **Critique** | Créer bouton "Finaliser tournoi" admin |
| `GET /admin/players/:id` | `admin-players.controller.ts:55` | ❌ Absent | Manquant | Moyen | Créer page détail joueur admin |
| `POST /admin/matches/tournament/:tournamentId/generate` | `matches.admin.controller.ts:18` | ❌ Absent | Manquant | Faible | Documenter (déjà géré par `/admin/tournaments/:id/start`) |
| `GET /health` | `app.controller.ts:8` | ❌ Absent | Manquant | Faible | Exposer endpoint health check (monitoring) |
| `GET /tournaments/:id/matches` | `tournaments.controller.ts:38` | ✅ Utilisé | OK | - | - |
| `GET /tournaments/:id/standings` | `tournaments.controller.ts:48` | ✅ Utilisé | OK | - | - |
| `POST /matches/:id/join` | `matches.controller.ts:53` | ✅ Utilisé | OK | - | - |
| `GET /matches/:id/state` | `matches.controller.ts:64` | ✅ Utilisé | OK | - | - |
| `POST /matches/:id/move` | `matches.controller.ts:75` | ✅ Utilisé | OK | - | - |
| `POST /matches/:id/resign` | `matches.controller.ts:86` | ✅ Utilisé | OK | - | - |

---

## 📊 Tableau B — Frontend Existant / Backend Manquant

| Élément | Localisation Frontend | Localisation Backend | Statut | Impact | Action Recommandée |
|---------|----------------------|---------------------|--------|--------|-------------------|
| `api.getAdminPlayers(search)` | `lib/api.ts:403` | ✅ `GET /admin/players?search=xxx` | OK | - | - |
| `api.updateAdminPlayerStatus()` | `lib/api.ts:412` | ✅ `PATCH /admin/players/:id/status` | OK | - | - |
| `api.updateAdminPlayerRestrictions()` | `lib/api.ts:418` | ✅ `PATCH /admin/players/:id/restrictions` | OK | - | - |
| `api.getAdminTournaments()` | `lib/api.ts:425` | ✅ `GET /admin/tournaments` | OK | - | - |
| `api.createTournament()` | `lib/api.ts:428` | ✅ `POST /admin/tournaments` | OK | - | - |
| `api.closeRegistration()` | `lib/api.ts:448` | ✅ `POST /admin/tournaments/:id/close-registration` | OK | - | - |
| `api.adminStartTournament()` | `lib/api.ts:453` | ✅ `POST /admin/tournaments/:id/start` | OK | - | - |
| `api.deleteTournament()` | `lib/api.ts:468` | ✅ `DELETE /admin/tournaments/:id` | OK | - | - |
| `api.adminReportMatchResult()` | `lib/api.ts:458` | ✅ `POST /admin/matches/:id/result` | OK | - | - |
| **Pagination transactions wallet** | `wallet.tsx` (implicite) | ❌ Absent (limite 50 hardcodée) | Partiel | Moyen | Ajouter pagination backend |
| **Historique complet des coups** | `matches/[id].tsx:53` (commentaire) | ❌ Absent | Manquant | Faible | Créer `GET /matches/:id/moves` |

---

## 📊 Tableau C — Incohérences de Contrats

| Élément | Backend | Frontend | Statut | Impact | Action Recommandée |
|---------|---------|----------|--------|--------|-------------------|
| **TransactionType enum** | `DEPOSIT, WITHDRAWAL, TOURNAMENT_BUY_IN, TOURNAMENT_PAYOUT, BONUS, FEE` | ✅ Identique | OK | - | - |
| **TournamentStatus enum** | `DRAFT, SCHEDULED, READY, RUNNING, FINISHED, CANCELED` | ✅ Identique | OK | - | - |
| **MatchStatus enum** | `PENDING, RUNNING, FINISHED, CANCELED` | ✅ Identique | OK | - | - |
| **MatchResult enum** | `WHITE_WIN, BLACK_WIN, DRAW, BYE` | ✅ Identique | OK | - | - |
| **PlayerRole enum** | `PLAYER, ADMIN, SUPER_ADMIN` | ✅ Identique | OK | - | - |
| **PlayMoveDto.promotion** | `'q' \| 'r' \| 'b' \| 'n'` | ✅ Identique | OK | - | - |
| **CreateTournamentDto.status** | Optionnel, défaut `DRAFT` | ✅ Optionnel | OK | - | - |
| **UpdateTournamentDto** | Tous champs optionnels | ✅ Tous optionnels | OK | - | - |
| **AdminPlayer interface** | Inclut `moderationNote` | ✅ Inclut `moderationNote` | OK | - | - |
| **MatchStateViewDto.lastMove** | `{ san, from, to, promotion? }` | ✅ Identique | OK | - | - |
| **Wallet.transactions** | Limite 50 hardcodée backend | Frontend attend liste complète | **Incohérent** | Moyen | Ajouter pagination ou augmenter limite |
| **TournamentEntryStatus** | `PENDING, CONFIRMED, ELIMINATED, COMPLETED` | ❌ Non exposé frontend | Manquant | Faible | Exposer dans `TournamentMatch` si nécessaire |
| **KycStatus** | `PENDING, VERIFIED, REJECTED` | ❌ Non exposé frontend | Manquant | Faible | Exposer si KYC requis |

---

## 📊 Tableau D — Logiques Backend Orphelines (Non Utilisées)

| Élément | Localisation Backend | Utilisation | Statut | Impact | Action Recommandée |
|---------|---------------------|-------------|--------|--------|-------------------|
| `TransactionsService.createTransactionAndUpdateWallet()` | `transactions.service.ts:21` | Utilisé par autres services | ✅ Utilisé | - | - |
| `TransactionsService.creditWallet()` | `transactions.service.ts:77` | Utilisé par `WalletsService.testCredit()` | ✅ Utilisé | - | - |
| `TransactionsService.debitWallet()` | `transactions.service.ts:98` | Utilisé par `TournamentsService.joinTournament()` | ✅ Utilisé | - | - |
| `TransactionsService.findTransactionsByWallet()` | `transactions.service.ts:118` | ❌ Non utilisé | Orphelin | Faible | Exposer via `GET /wallets/:id/transactions` |
| `TransactionsController` | `transactions.controller.ts:4` | Vide (aucune route) | Orphelin | Faible | Supprimer ou documenter intention |
| `PrizePoolService.computePrizePool()` | `prize-pool.service.ts:28` | Utilisé par `TournamentsService` | ✅ Utilisé | - | - |
| `PrizePoolService.computePrizePoolForMinCurrentMax()` | `prize-pool.service.ts:53` | Utilisé par `TournamentsService.listPublicTournaments()` | ✅ Utilisé | - | - |
| `PrizePoolService.lockPrizePoolForTournament()` | `prize-pool.service.ts:83` | Utilisé par `TournamentsService.closeRegistrationAndProcess()` | ✅ Utilisé | - | - |
| `PlayerRestrictionsService.assertCanJoinTournament()` | `player-restrictions.service.ts:19` | Utilisé par `TournamentsService.joinTournament()` | ✅ Utilisé | - | - |
| `PlayerRestrictionsService.assertCanDeposit()` | `player-restrictions.service.ts:41` | Utilisé par `WalletsService.testCredit()` | ✅ Utilisé | - | - |
| `PlayerRestrictionsService.assertCanWithdraw()` | `player-restrictions.service.ts:63` | Utilisé par `WalletsService.withdraw()` (non implémenté) | Partiel | Faible | Documenter intention future |
| `WalletsService.withdraw()` | `wallets.service.ts:106` | ❌ Non implémenté (throw ForbiddenException) | Orphelin | Moyen | Implémenter ou documenter roadmap |
| `TournamentsService.finalizeTournamentAndPayouts()` | `tournaments.service.ts:566` | Exposé via `POST /admin/tournaments/:id/finalize` mais non utilisé frontend | Partiel | **Critique** | Créer UI admin |
| `TournamentsService.updateTournamentAsAdmin()` | `tournaments.service.ts:485` | Exposé via `PATCH /admin/tournaments/:id` mais non utilisé frontend | Partiel | **Critique** | Créer UI admin |
| `MatchesService.generateInitialMatchesForTournament()` | `matches.service.ts:44` | Exposé via `POST /admin/matches/tournament/:id/generate` mais non utilisé (doublon avec `/admin/tournaments/:id/start`) | Partiel | Faible | Documenter ou supprimer doublon |

---

## 📊 Tableau E — Risques Fonctionnels et Techniques

| Risque | Description | Impact | Probabilité | Priorité | Action Recommandée |
|--------|-------------|--------|-------------|----------|-------------------|
| **Finalisation tournoi non accessible** | `POST /admin/tournaments/:id/finalize` existe mais aucune UI frontend | **Critique** | Élevée | **P0** | Créer bouton "Finaliser tournoi" dans admin |
| **Modification tournoi non accessible** | `PATCH /admin/tournaments/:id` existe mais aucune UI frontend | **Critique** | Élevée | **P0** | Créer formulaire d'édition tournoi admin |
| **Pagination transactions manquante** | Limite 50 hardcodée, pas de pagination | Moyen | Moyenne | **P1** | Ajouter `?skip=0&take=50` à `GET /wallets/me` |
| **Historique coups incomplet** | Frontend reconstruit l'historique depuis `lastMove`, pas d'endpoint complet | Faible | Faible | **P2** | Créer `GET /matches/:id/moves` (optionnel) |
| **Retraits non implémentés** | `WalletsService.withdraw()` existe mais throw ForbiddenException | Moyen | Faible | **P1** | Documenter roadmap ou implémenter |
| **Route test non supprimée** | `GET /players/test` existe en production | Faible | Faible | **P2** | Supprimer ou protéger par guard admin |
| **Doublon génération matches** | `POST /admin/matches/tournament/:id/generate` vs `/admin/tournaments/:id/start` | Faible | Faible | **P2** | Documenter ou supprimer doublon |
| **Wallet public non protégé** | `GET /wallets/:playerId` accessible sans auth | Faible | Faible | **P2** | Ajouter guard ou supprimer si non nécessaire |

---

## 🎯 Conclusion et Priorités

### Priorités Critiques (P0)

1. **Créer UI admin pour finaliser tournoi**
   - Endpoint : `POST /admin/tournaments/:id/finalize`
   - Localisation : `frontend/pages/admin/tournaments.tsx`
   - Action : Ajouter bouton "Finaliser tournoi" avec confirmation

2. **Créer UI admin pour modifier tournoi**
   - Endpoint : `PATCH /admin/tournaments/:id`
   - Localisation : `frontend/pages/admin/tournaments/[id]/edit.tsx` (nouveau)
   - Action : Créer formulaire d'édition avec validation

### Priorités Moyennes (P1)

3. **Ajouter pagination transactions wallet**
   - Endpoint : `GET /wallets/me?skip=0&take=50`
   - Localisation : `backend/src/wallets/wallets.service.ts:40`
   - Action : Ajouter query params et exposer dans frontend

4. **Documenter roadmap retraits**
   - Service : `WalletsService.withdraw()`
   - Action : Documenter intention ou implémenter

### Priorités Faibles (P2)

5. **Supprimer route test** : `GET /players/test`
6. **Documenter doublon** : Génération matches
7. **Créer endpoint historique coups** : `GET /matches/:id/moves` (optionnel)

---

## 📖 Références

- **Schéma Prisma** : `backend/prisma/schema.prisma`
- **API Frontend** : `frontend/lib/api.ts`
- **Controllers Backend** : `backend/src/**/*.controller.ts`
- **Services Backend** : `backend/src/**/*.service.ts`

---

**Dernière mise à jour** : 15 janvier 2025

