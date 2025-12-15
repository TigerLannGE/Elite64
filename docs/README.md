# Documentation ChessBet

Ce dossier contient toute la documentation du projet ChessBet.

## 📚 Structure

### Documentation Générale
- **[Squelette monorepo tournois échecs légaux](./phase-00_fondations-techniques/cross/phase-00_squelette-monorepo_cross.md)**  
  Vue d'ensemble du projet, architecture et structure du monorepo.

- **[Démarrage rapide du projet](./phase-00_fondations-techniques/cross/phase-00_quickstart-detaille_cross.md)**  
  Guide rapide pour démarrer le projet après avoir éteint votre PC (PostgreSQL, Backend, Frontend).

### Documentation Audits

- **[Rapport d'audit technique du codebase 14.12.2025 (OBSOLÈTE)](./_archives/OBSOLETE_audit-codebase_2024-12-14.md)**  
  Rapport d'audit exhaustif de l'état du codebase par rapport aux phases 5, 6.0, 6.1, 6.2 et 6.3. ⚠️ **OBSOLÈTE** : Ce rapport précède l'implémentation des phases 6.0.B et 6.0.C.

- **[Restauration base de données PostgreSQL](./phase-00_fondations-techniques/cross/phase-00_postgresql-restore_cross.md)**  
  Guide complet pour restaurer une base de données PostgreSQL depuis un dump, avec script automatisé.

### Documentation Backend

**Phase 00 - Fondations Techniques**
- **[Schéma Prisma - Vue d'ensemble](./phase-00_fondations-techniques/backend/phase-00_prisma-schema_overview-backend.md)**  
  Documentation complète du schéma Prisma, des modèles et des migrations.
- **[Configuration SMTP - Guide général](./phase-00_fondations-techniques/backend/phase-00_smtp-configuration_generique-backend.md)**  
  Guide général de configuration SMTP avec plusieurs options (Gmail, Mailtrap, Infomaniak, SendGrid).
- **[Configuration SMTP Infomaniak](./phase-00_fondations-techniques/backend/phase-00_smtp-configuration_infomaniak-backend.md)**  
  Guide détaillé spécifique à Infomaniak avec dépannage approfondi.

**Phase 01 - Auth et Comptes Joueurs**
- **[Intégration Prisma et modules Players/Wallets](./phase-01_auth-et-comptes-joueurs/backend/phase-01_prisma-players-wallets_backend.md)**  
  Documentation complète de l'intégration Prisma et des modules Players/Wallets.
- **[Authentification JWT et conformité légale](./phase-01_auth-et-comptes-joueurs/backend/phase-01_auth-jwt-email-age-verification_backend.md)**  
  Documentation du système d'authentification renforcé et des mesures de conformité légale.

**Phase 02 - Wallets et Transactions**
- **[Module Transactions et gestion des portefeuilles](./phase-02_wallets-et-transactions/backend/phase-02_transactions-wallets_backend.md)**  
  Documentation du module Transactions centralisé et de l'extension du module Wallets.

**Phase 03 - Tournois Structure**
- **[Modules Tournaments et PrizePool](./phase-03_tournois-structure/backend/phase-03_tournaments-prize-pool_backend.md)**  
  Documentation complète de l'implémentation des modules Tournaments et PrizePool.

**Phase 04 - Prize Pool et Modération**
- **[Rôles joueur et API admin v1](./phase-04_prize-pool-et-moderation/backend/phase-04_roles-admin-api_backend.md)**  
  Documentation du système de rôles (PLAYER, ADMIN, SUPER_ADMIN) et API admin v1.
- **[Suspension de comptes](./phase-04_prize-pool-et-moderation/backend/phase-04_account-suspension_backend.md)**  
  Documentation du système de suspension des comptes utilisateurs.
- **[Restrictions ciblées et modération avancée](./phase-04_prize-pool-et-moderation/backend/phase-04_targeted-restrictions_backend.md)**  
  Documentation du système de restrictions ciblées (blocage tournois, dépôts, retraits).

**Phase 05 - Matches et Brackets**
- **[Module Matches et résultats de tournoi](./phase-05_matches-et-brackets/backend/phase-05_matches-brackets-standings_backend.md)**  
  Documentation complète du module Matches : génération des brackets, gestion des matches, résultats, finalisation et distribution des gains.
- **[BASELINE Phase 5 - Référence](./phase-05_matches-et-brackets/cross/phase-05_baseline-reference_cross.md)**  
  Spécification de référence complète de la Phase 5.

**Phase 06 - Gameplay Échecs**
- **[Phase 6.0.A - Extension Schéma Prisma](./phase-06_gameplay-echecs/cross/phase-06.0.A_schema-extension_cross.md)**  
  Extension du schéma Prisma pour le gameplay : nouveaux champs Match, modèle MatchMove, enum MatchColor.
- **[Phase 6.0.B - Moteur d'échecs backend](./phase-06_gameplay-echecs/backend/phase-06.0.B_chess-engine_backend.md)**  
  Documentation du moteur d'échecs backend : ChessEngineService, validation de coups, détection de fin de partie.
- **[Phase 6.0.C - Orchestration Gameplay](./phase-06_gameplay-echecs/cross/phase-06.0.C_gameplay-orchestration_cross.md)**  
  Spécification détaillée de l'orchestration gameplay côté backend : endpoints REST, DTO canonique, gestion du temps, résignation, no-show.
- **[Phase 6.0.C - Audit Report](./phase-06_gameplay-echecs/cross/phase-06.0.C_audit-report_cross.md)**  
  Rapport d'audit strict de la Phase 6.0.C : vérification des invariants, transactions Prisma, détection de fin de partie.

### Documentation Frontend

**Phase 00 - Fondations Techniques**
- **[Configuration favicon et icônes](./phase-00_fondations-techniques/frontend/phase-00_favicon-et-icones_frontend.md)**  
  Configuration du favicon et des icônes PWA pour la plateforme.

**Phase 04 - Prize Pool et Modération**
- **[Rôles et espace admin v1](./phase-04_prize-pool-et-moderation/frontend/phase-04_roles-admin-interface_frontend.md)**  
  Documentation de l'implémentation frontend du système de rôles et de l'espace admin v1.
- **[Gestion des comptes suspendus](./phase-04_prize-pool-et-moderation/frontend/phase-04_suspended-accounts-ux_frontend.md)**  
  Documentation de la gestion frontend des comptes suspendus (messages d'erreur, déconnexion automatique).
- **[Restrictions ciblées joueurs](./phase-04_prize-pool-et-moderation/frontend/phase-04_targeted-restrictions-ui_frontend.md)**  
  Documentation de l'implémentation frontend des restrictions ciblées (UI admin, codes d'erreur).

**Phase 05 - Matches et Brackets**
- **[Développement frontend - Vue d'ensemble](./phase-05_matches-et-brackets/frontend/phase-05_frontend-overview_frontend.md)**  
  Documentation complète du développement frontend : pages, authentification, composants, et conformité légale.

---

## 🗂️ Organisation

La documentation est organisée par **phases de développement** :

- **Phase 00 - Fondations Techniques** : Infrastructure, Prisma, PostgreSQL, SMTP, configuration
- **Phase 01 - Auth et Comptes Joueurs** : Authentification JWT, Players, Wallets initiaux
- **Phase 02 - Wallets et Transactions** : Module Transactions centralisé, gestion financière
- **Phase 03 - Tournois Structure** : Modules Tournaments et PrizePool
- **Phase 04 - Prize Pool et Modération** : Rôles, admin, suspension, restrictions ciblées
- **Phase 05 - Matches et Brackets** : Génération brackets, gestion matches, standings, frontend complet
- **Phase 06 - Gameplay Échecs** : Moteur d'échecs, orchestration gameplay temps réel
- **_archives/** : Documents obsolètes ou historiques

Chaque phase est subdivisée en :
- **`backend/`** : Documentation spécifique au backend NestJS
- **`frontend/`** : Documentation spécifique au frontend Next.js
- **`cross/`** : Documentation transversale (backend + frontend)

---

## 📝 Notes

- Tous les README sont en français
- Chaque README contient une date de création et un statut
- Les README sont mis à jour au fur et à mesure de l'évolution du projet

---

**Dernière mise à jour** : Décembre 2025

**Changements récents** :
- ✅ **Phase 6.0.C terminée** : Backend Gameplay Orchestration (endpoints `/matches/:id/join`, `/state`, `/move`, `/resign`, DTO `MatchStateViewDto`, résignation, no-show lazy à 90s, intégration avec Phase 5).
- ✅ **Phase 6.0.B terminée** : Moteur d'échecs backend (ChessEngineService), validation de coups, détection de fin de partie, 32 tests unitaires, service pur et déterministe.
- ✅ **Phase 6.0.A terminée** (14 Décembre 2025) : Extension du modèle Match avec champs gameplay, création du modèle MatchMove, enum MatchColor, migration Prisma appliquée.
- ✅ PostgreSQL mis à jour vers version 17 (compatibilité avec dumps récents)
- ✅ Script d'import automatisé créé (`backend/import-database.ps1`)
- ✅ Documentation d'audit et de restauration ajoutée

---

## 📦 Résumé des Fonctionnalités

### Backend ✅
- API NestJS complète
- Authentification JWT
- Envoi d'emails (SMTP Infomaniak)
- Base de données Prisma + PostgreSQL
- Validation d'âge (18+)
- Vérification d'email
- Module Transactions centralisé
- Module Wallets avec gestion des portefeuilles
- Module Tournaments (création, inscription, clôture)
- Module PrizePool (calcul min/current/max, figement)
- Système de rôles (PLAYER, ADMIN, SUPER_ADMIN)
- Protection des endpoints admin (RolesGuard)
- API admin v1 (gestion joueurs et tournois)
- Système de restrictions ciblées (blocage tournois, dépôts, retraits)
- Suspension de comptes (isActive)
- Module Matches (génération brackets, gestion matches, résultats)
- Génération automatique des rondes suivantes
- Finalisation automatique des tournois avec distribution des gains
- Calcul des classements basés sur les résultats
- Moteur d'échecs backend (ChessEngineService) - validation de coups, détection de fin de partie (Phase 6.0.B)
- ⚠️ **Note** : Pas encore d'intégration complète avec le gameplay en direct (Phase 6.1+)

### Frontend ✅
- Landing page avec textes légaux
- Inscription avec validation 18+
- Connexion avec JWT
- Vérification d'email
- Mot de passe oublié / réinitialisation
- Lobby protégé avec liste des tournois
- Affichage des prize pools (min/current/max) avec badges colorés
- Inscription aux tournois depuis le lobby
- Gestion du wallet avec historique des transactions
- Pages légales (CGU, Privacy)
- Système d'authentification complet
- Affichage visuel des rôles (couleurs + icônes)
- Espace admin v1 (dashboard, gestion joueurs, gestion tournois)
- Protection des pages admin (redirection si non admin)
- UI admin pour restrictions ciblées (gestion tournois, dépôts, retraits)
- Gestion des codes d'erreur spécifiques (TOURNAMENTS_BLOCKED, DEPOSITS_BLOCKED, WITHDRAWALS_BLOCKED)
- Pages tournois (`/tournaments` et `/tournaments/[id]`) avec affichage des matches et classements (Phase 5)
- ⚠️ **Note** : Pas encore de plateau d'échecs intégré pour jouer réellement (Phase 6+)

