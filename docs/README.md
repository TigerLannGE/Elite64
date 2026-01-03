# Documentation Elite64

Ce dossier contient toute la documentation du projet Elite64.

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

- **[Gestion des vulnérabilités NPM](./phase-00_fondations-techniques/cross/phase-00_vulnerabilites-npm_cross.md)**  
  Guide complet pour l'analyse, la correction et la documentation des vulnérabilités de sécurité NPM.

- **[Troubleshooting Prisma - Guide de dépannage](./phase-00_fondations-techniques/cross/phase-00_troubleshooting-prisma_cross.md)**  
  Guide complet pour diagnostiquer et résoudre les problèmes courants avec Prisma (migrations, synchronisation, connexion DB).

### Documentation Governance

- **[Référentiel normatif](./governance/REFERENTIEL_NORMATIF.md)**  
  Référentiel des documents normatifs 01 à 08 (Vision, Branding, Juridique, Finance, Produit, Technique, Opérations, Financement). Source de vérité pour toutes les décisions stratégiques, juridiques et produit.

- **[Audit de convergence 2026-01-01](./governance/audits/audit-convergence-2026-01-01.md)**  
  Audit complet de conformité du projet avec les documents normatifs. Vérification du renommage ChessBet → Elite64, conformité lexicale anti-gambling, et alignement avec les décisions FIGÉES.

- **[Rapport de consolidation 2026-01-01](./governance/RAPPORT_CONSOLIDATION_2026-01-01.md)**  
  Rapport détaillé de la consolidation et harmonisation de l'intégralité de la documentation suite à l'audit de convergence.

- **[Vérification ciblée P1 2026-01-01](./governance/audits/verification-p1-2026-01-01.md)**  
  Vérification non bloquante des points P1 restants : Finance (Document 04) et renommage interne DB/Docker. Tous les axes sont conformes au périmètre MVP ou documentés comme hors périmètre.

- **[Documents normatifs PDF](./governance/reference_01_08/)**  
  Les 8 documents PDF de référence (01 à 08) constituant la source de vérité normative du projet.

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
- **[Phase 6.0.D - Règles Avancées et Tie-Breaks](./phase-06_gameplay-echecs/backend/phase-06.0.D_advanced-rules-tiebreaks_backend.md)**  
  Design de la Phase 6.0.D : configuration des règles de match nul (draw rules), politique de tie-break, création automatique de matchs de départage, intégration avec les brackets.
- **[Phase 6.0.D - Cadrage d'Exécution](./phase-06_gameplay-echecs/cross/phase-06.0.D_cadrage-execution_cross.md)**  
  Cadrage d'exécution de la Phase 6.0.D : périmètre fonctionnel, découpage technique, 6 décisions critiques figées, stratégie de tests, checklist d'implémentation. **Document de référence avant toute implémentation.**
- **[Phase 6.0.D.2 - Extension DTOs et Validations](./phase-06_gameplay-echecs/backend/phase-06.0.D.2_dto-validation_backend.md)**  
  Implémentation Phase 6.0.D.2 : extension des DTOs tournois avec 5 nouveaux champs (drawRuleMode, drawConfig, requiresDecisiveResult, tieBreakPolicy, tieBreakTimeControl), validations métier pour rejeter les configurations incompatibles, tests unitaires complets.
- **[Phase 6.0.D.3 - Création Automatique de Tie-Breaks](./phase-06_gameplay-echecs/backend/phase-06.0.D.3_tiebreak-creation_backend.md)**  
  Implémentation Phase 6.0.D.3 : création automatique de matchs tie-break après un DRAW (automatique ou manuel), séquence post-transaction respectée, idempotence via contrainte unique DB, gestion de toutes les politiques (RAPID, BLITZ, ARMAGEDDON, BEST_OF_3, BEST_OF_5), assignation déterministe des couleurs, tests unitaires complets (14 tests).
- **[Phase 6.0.D.4 - Redirection Anti-Friction et Résolution Déterministe](./phase-06_gameplay-echecs/backend/phase-06.0.D.4_redirection-resolution_backend.md)**  
  Implémentation Phase 6.0.D.4 : redirection sécurisée vers tie-break actif (`getActivePlayableMatchId()`), résolution déterministe des tie-breaks (`resolveTieBreak()`), modification de `generateNextRoundIfNeeded()` selon Décision B3, intégration dans `getMatchState()`, `joinMatch()`, `playMove()`, patch d'observabilité (logs améliorés), tests unitaires complets (12 tests Phase 6.0.D.4).
- **[Phase 6.0.D.5 - Intégration avec Brackets et Validations Finales](./phase-06_gameplay-echecs/backend/phase-06.0.D.5_integration-brackets-validations_backend.md)**  
  Implémentation Phase 6.0.D.5 : validations finales pour DRAW automatiques dans `playMove()` (garde-fous `requiresDecisiveResult` et `drawRuleMode`), correction de la redirection D.4 (`activeMatchId` dans la transaction), remplacement de `console.error` par `logger.error`, vérification de la conformité de `generateNextRoundIfNeeded()` (Décision B3), tests unitaires complets (3 tests Phase 6.0.D.5).
- **[Phase 6.1 - Frontend Gameplay MVP](./phase-06_gameplay-echecs/frontend/phase-06.1_frontend-gameplay_frontend.md)**  
  Documentation complète du frontend gameplay : page de match, intégration react-chessboard, polling, gestion des coups, promotion, résignation, navigation depuis tournoi.
- **[Phase 6.2 - Tests E2E Gameplay Complets](./phase-06_gameplay-echecs/cross/phase-06.2_e2e-gameplay-tests_cross.md)**  
  Documentation complète des tests End-to-End API-only : validation de tous les types de mouvements aux échecs (promotions, roques, en passant, résignation). Résultat : 11/11 tests PASS (100%).

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

**Dernière mise à jour** : 03 Janvier 2026

**Changements récents** :
- ✅ **Phase 6.0.D.5 terminée** (03 Janvier 2026) : Validations finales pour DRAW automatiques (garde-fous `requiresDecisiveResult` et `drawRuleMode`), correction de la redirection D.4, remplacement de `console.error` par `logger.error`, tests unitaires complets (3 tests). Documentation complète créée.
- ✅ **Clarification structure des frais** (01 Janvier 2026) : Documentation complète de la distinction entre commission plateforme (5%) et frais de tournoi (4.75%), prélèvement total de 9.75%. Documentation de l'affichage financier dans l'espace admin pour les super-admins. Voir [Clarification structure des frais](./governance/audits/clarification-structure-frais-2026-01-01.md).
- ✅ **Consolidation documentation et governance** (01 Janvier 2026) : Déplacement du dossier `governance/` vers `docs/governance/` pour centraliser toute la documentation. Mise à jour de toutes les références internes. Correction des occurrences restantes de ChessBet dans la documentation technique.
- ✅ **Phase 6.1 - Frontend Gameplay MVP terminée** (15 Décembre 2025) : Implémentation complète de la page de match (`/matches/[id]`) avec intégration `react-chessboard@4.7.2`, polling 2s, gestion des coups, promotion, résignation, navigation depuis tournoi. Correction du bug de finalisation automatique des tournois (backend). Documentation complète créée.
- ✅ **Historique des tournois terminés** (15 Décembre 2025) : Modification de `listPublicTournaments()` pour inclure les tournois FINISHED. Le frontend peut maintenant afficher l'onglet "Terminés" avec l'historique complet des tournois passés. Documentation mise à jour dans [Phase 03](./phase-03_tournois-structure/backend/phase-03_tournaments-prize-pool_backend.md).
- ✅ **Guide de dépannage Prisma** (15 Décembre 2025) : Documentation complète des problèmes courants (migrations, colonnes manquantes, synchronisation DB), avec workflow de résolution et cas réel Phase 6.0.A.
- ✅ **Correctif de sécurité critique** (15 Décembre 2025) : Next.js mis à jour de 14.0.0 → 14.2.35 (correction de 13 vulnérabilités dont 1 CRITICAL CVSS 9.1). Documentation complète ajoutée.
- ✅ **Phase 6.0.C terminée** (14 Décembre 2025) : Backend Gameplay Orchestration (endpoints `/matches/:id/join`, `/state`, `/move`, `/resign`, DTO `MatchStateViewDto`, résignation, no-show lazy à 90s, intégration avec Phase 5).
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
- Module Tournaments (création, inscription, clôture, historique des tournois terminés)
- Module PrizePool (calcul min/current/max, figement)
- Système de rôles (PLAYER, ADMIN, SUPER_ADMIN)
- Protection des endpoints admin (RolesGuard)
- API admin v1 (gestion joueurs et tournois)
- Système de restrictions ciblées (blocage tournois, dépôts, retraits)
- Suspension de comptes (isActive)
- Module Matches (génération brackets, gestion matches, résultats)
- Génération automatique des rondes suivantes
- Finalisation automatique des tournois avec distribution des gains (corrigé Phase 6.1)
- Calcul des classements basés sur les résultats
- Moteur d'échecs backend (ChessEngineService) - validation de coups, détection de fin de partie (Phase 6.0.B)
- Endpoints gameplay REST complets : `/join`, `/state`, `/move`, `/resign` (Phase 6.0.C)

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
- Pages tournois (`/tournaments` et `/tournaments/[id]`) avec onglets "À venir / En cours" et "Terminés", affichage des matches et classements (Phase 5)
- Page de match (`/matches/[id]`) avec échiquier interactif (Phase 6.1 - tag: `phase6-1-20251216`)
- Échiquier React avec `react-chessboard` (MIT license, non-GPL)
- Gameplay complet : jouer des coups, promotion des pions, résignation
- Polling automatique (2s) pour mises à jour en temps réel
- Navigation depuis tournoi vers match jouable
- Validé par tests E2E exhaustifs (voir section Tests & Qualité)
- ⚠️ **Note** : MVP strict (pas de chronomètre visuel, pas de WebSocket, pas d'historique des coups visibles)

### Tests & Qualité ✅
- Tests unitaires backend (ChessEngineService - 32 tests)
- Tests E2E gameplay complets (Phase 6.2 - tag: `phase6-2-20251216`)
  - Script `e2e-gameplay.ts` : 5/6 tests PASS
  - Script `e2e-gameplay-comprehensive.ts` : **11/11 tests PASS (100%)**
  - Validation exhaustive : 4 promotions, 4 roques, 2 en passant, résignation
  - Logging automatique dans `test-results/`
  - Documentation complète : [Phase 6.2 Tests E2E](./phase-06_gameplay-echecs/cross/phase-06.2_e2e-gameplay-tests_cross.md)

