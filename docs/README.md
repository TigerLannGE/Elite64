# Documentation ChessBet

## 📚 Documentation par Phase

### Phase 00 - Fondations Techniques

#### Backend
- **[Schéma Prisma – Vue d'ensemble](./phase-00_fondations-techniques/backend/phase-00_prisma-schema_overview-backend.md)**
- **[Configuration SMTP – Générique](./phase-00_fondations-techniques/backend/phase-00_smtp-configuration_generique-backend.md)**
- **[Configuration SMTP – Infomaniak](./phase-00_fondations-techniques/backend/phase-00_smtp-configuration_infomaniak-backend.md)**

#### Cross
- **[Squelette du monorepo](./phase-00_fondations-techniques/cross/phase-00_squelette-monorepo_cross.md)**
- **[Démarrage rapide – version détaillée](./phase-00_fondations-techniques/cross/phase-00_quickstart-detaille_cross.md)**
- **[Démarrage rapide – version condensée](./phase-00_fondations-techniques/cross/phase-00_quickstart-condense_cross.md)**
- **[Restauration PostgreSQL](./phase-00_fondations-techniques/cross/phase-00_postgresql-restore_cross.md)**
- **[Troubleshooting Prisma](./phase-00_fondations-techniques/cross/phase-00_troubleshooting-prisma_cross.md)**
- **[Gestion des vulnérabilités NPM](./phase-00_fondations-techniques/cross/phase-00_vulnerabilites-npm_cross.md)**

#### Frontend
- **[Favicon et icônes](./phase-00_fondations-techniques/frontend/phase-00_favicon-et-icones_frontend.md)**

---

### Phase 01 - Auth et Comptes Joueurs

#### Backend
- **[Authentification JWT, email et conformité légale](./phase-01_auth-et-comptes-joueurs/backend/phase-01_auth-jwt-email-age-verification_backend.md)**
- **[Intégration Prisma – Players & Wallets](./phase-01_auth-et-comptes-joueurs/backend/phase-01_prisma-players-wallets_backend.md)**

---

### Phase 02 - Wallets et Transactions

#### Backend
- **[Transactions et gestion des portefeuilles](./phase-02_wallets-et-transactions/backend/phase-02_transactions-wallets_backend.md)**

---

### Phase 03 - Tournois Structure

#### Backend
- **[Tournaments et Prize Pool](./phase-03_tournois-structure/backend/phase-03_tournaments-prize-pool_backend.md)**

---

### Phase 04 - Prize Pool et Modération

#### Backend
- **[API Rôles Admin](./phase-04_prize-pool-et-moderation/backend/phase-04_roles-admin-api_backend.md)**
- **[Suspension de comptes](./phase-04_prize-pool-et-moderation/backend/phase-04_account-suspension_backend.md)**
- **[Restrictions ciblées](./phase-04_prize-pool-et-moderation/backend/phase-04_targeted-restrictions_backend.md)**

#### Frontend
- **[Interface Rôles Admin](./phase-04_prize-pool-et-moderation/frontend/phase-04_roles-admin-interface_frontend.md)**
- **[UX Comptes suspendus](./phase-04_prize-pool-et-moderation/frontend/phase-04_suspended-accounts-ux_frontend.md)**
- **[Restrictions ciblées – UI](./phase-04_prize-pool-et-moderation/frontend/phase-04_targeted-restrictions-ui_frontend.md)**

---

### Phase 05 - Matches et Brackets

#### Backend
- **[Matches, Brackets et standings](./phase-05_matches-et-brackets/backend/phase-05_matches-brackets-standings_backend.md)**

#### Cross
- **[Baseline Phase 5](./phase-05_matches-et-brackets/cross/phase-05_baseline-reference_cross.md)**

#### Frontend
- **[Vue d'ensemble Frontend](./phase-05_matches-et-brackets/frontend/phase-05_frontend-overview_frontend.md)**

---

### Phase 06 - Gameplay Échecs

#### Backend
- **[Moteur d'échecs](./phase-06_gameplay-echecs/backend/phase-06.0.B_chess-engine_backend.md)**
- **[Implémentation des sessions](./phase-06_gameplay-echecs/backend/phase-06.0.B_session-implementation_backend.md)**
- **[Intégration Brackets & validations](./phase-06_gameplay-echecs/backend/phase-06.0.D.5_integration-brackets-validations_backend.md)**

#### Cross
- **[Extension du schéma Prisma](./phase-06_gameplay-echecs/cross/phase-06.0.A_schema-extension_cross.md)**
- **[Orchestration du gameplay](./phase-06_gameplay-echecs/cross/phase-06.0.C_gameplay-orchestration_cross.md)**
- **[Audit gameplay Phase 6.0.C](./phase-06_gameplay-echecs/cross/phase-06.0.C_audit-report_cross.md)**
- **[Tests E2E gameplay](./phase-06_gameplay-echecs/cross/phase-06.2_e2e-gameplay-tests_cross.md)**

#### Frontend
- **[Gameplay Frontend – MVP](./phase-06_gameplay-echecs/frontend/phase-06.1_frontend-gameplay_frontend.md)**
- **[Complétion UX Gameplay](./phase-06_gameplay-echecs/frontend/phase-06.1.B_gameplay-ux-completion_frontend.md)**
- **[Clarté UX Gameplay](./phase-06_gameplay-echecs/frontend/phase-06.2.A_ux-clarity-gameplay_frontend.md)**
- **[Tests UI E2E](./phase-06_gameplay-echecs/frontend/phase-06.2.B_ui-e2e-tests_frontend.md)**
- **[Polish UX Gameplay](./phase-06_gameplay-echecs/frontend/phase-06.2.C_ux-polish-gameplay_frontend.md)**

---

## 🔧 Outils de Maintenance
- **[Guide de Maintenance](./_maintenance/MAINTENANCE_GUIDE.md)**
- **[Commandes Cursor](./_maintenance/COMMANDES_CURSOR.md)**

---

## 📊 Rapports d'Audit

### Audits Governance (BLOC 3)
- **[BLOC 5.1 – Changelog des correctifs documentaires](./_audits/_BLOC_5_1_CHANGELOG.md)**

### Post-Audit Governance (BLOC 6)
- **[BLOC 6.1 – Diagnostic technique (lecture seule)](./_audits/_BLOC_6_1_DIAGNOSTIC_TECHNIQUE.md)**
- **[BLOC 6.2 – Changelog correctifs P0](./_audits/_BLOC_6_2_CHANGELOG.md)**
- **[BLOC 6.3 – Changelog verrouillage branding public](./_audits/_BLOC_6_3_CHANGELOG.md)**
- **[BLOC 6.5 – Validation Release Candidate](./_audits/_BLOC_6_5_RELEASE_CANDIDATE_VALIDATION.md)**
- **[BLOC 6.5 – Changelog (corrections validation)](./_audits/_BLOC_6_5_CHANGELOG.md)**
- **[Audit Governance – Document 08 (Financement & trajectoire capitalistique)](./_audits/_AUDIT_GOVERNANCE_08_FINANCEMENT_TRAJECTOIRE_CAPITALISTIQUE.md)**
- **[Audit Governance – Document 07 (Exploitation & opérations)](./_audits/_AUDIT_GOVERNANCE_07_EXPLOITATION_OPERATIONS.md)**
- **[Audit Governance – Document 06 (Technique)](./_audits/_AUDIT_GOVERNANCE_06_TECHNIQUE.md)**
- **[Audit Governance – Document 05 (Produit & expérience utilisateur)](./_audits/_AUDIT_GOVERNANCE_05_PRODUIT_EXPERIENCE_UTILISATEUR.md)**
- **[Audit Governance – Document 04 (Finance & paiements)](./_audits/_AUDIT_GOVERNANCE_04_FINANCE_PAIEMENTS.md)**
- **[Audit Governance – Document 03 (Structure juridique & conformité)](./_audits/_AUDIT_GOVERNANCE_03_STRUCTURE_JURIDIQUE_CONFORMITE.md)**

---

## 🚀 Reprise du Développement

### Documents de Référence Post-Audit

- **[Guide de Reprise du Développement](./plan/DEVELOPMENT_RESUME_GUIDE.md)** ⭐ **Document de référence unique**
- **[Plan d'Action de Reprise](./plan/_PLAN_ACTION_REPRISE.md)** — BLOC 6.6, 6.7, 7

**Ces documents permettent de reprendre le développement sereinement après la phase d'assainissement (BLOC 3 → BLOC 6.5).**

---

## 📖 Références
- **Guide de maintenance** : voir [`MAINTENANCE_GUIDE.md`](./_maintenance/MAINTENANCE_GUIDE.md)
