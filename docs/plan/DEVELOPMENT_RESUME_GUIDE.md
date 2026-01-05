# Guide de Reprise du Développement — Elite64

**Date de création** : 27 janvier 2025  
**Dernière mise à jour** : 27 janvier 2025  
**Statut** : ✅ Document de référence actif

---

## 📋 Vue d'ensemble

Ce document est la **source unique de vérité** pour reprendre le développement du projet Elite64 – Competitive Chess Arena après la phase d'assainissement et de sécurisation (BLOC 3 → BLOC 6.5).

**Objectif** : Permettre à n'importe quel développeur senior de comprendre immédiatement :
- L'état réel du projet (post BLOC 6.5)
- Ce qui est FIGÉ et ne doit jamais être cassé
- Les garde-fous techniques et documentaires
- La dette technique connue et assumée
- Le backlog immédiat recommandé
- Les règles avant toute nouvelle feature

**Document d'autorité** : Ce guide est complémentaire au [Document 00 – Chef de projet](../governance/00%20-%20[Chef%20de%20projet]%20-%2000.md) qui contient les arbitrages FIGÉS.

---

## 🎯 État Actuel du Projet

### Statut Global

**✅ Release Candidate VALIDÉ** (BLOC 6.5)

- ✅ Lint + Build frontend : Succès sans erreur
- ✅ Tests backend : Tous les tests passent
- ✅ Take rate 9.75% : Validé par test unitaire (5% commission + 4.75% frais tournoi)
- ✅ Branding public : 0 occurrence publique de "ChessBet" détectée
- ✅ Emails user-facing : From = `Elite64 <no-reply@elite64.app>`, Reply-to = `contact@elite64.app`

**Statut** : Le projet est prêt pour un développement continu, structuré et sécurisé.

### Historique des Blocs

- **BLOC 3** : Audit complet Governance (documents 03-08)
- **BLOC 5** : Correctifs documentaires (alignement avec Document 00)
- **BLOC 6.1** : Diagnostic technique (lecture seule)
- **BLOC 6.2** : Correctifs P0 (modèle économique, branding)
- **BLOC 6.3** : Verrouillage branding public
- **BLOC 6.5** : Validation Release Candidate ✅

**Références** :
- [BLOC 6.5 – Validation Release Candidate](../_audits/_BLOC_6_5_RELEASE_CANDIDATE_VALIDATION.md)
- [BLOC 6.1 – Diagnostic technique](../_audits/_BLOC_6_1_DIAGNOSTIC_TECHNIQUE.md)
- [BLOC 6.3 – Changelog verrouillage branding](../_audits/_BLOC_6_3_CHANGELOG.md)

---

## 🔒 Éléments FIGÉS (NON NÉGOCIABLES)

### Arbitrages Stratégiques

Ces décisions sont **irrévocables** et ne peuvent être modifiées sans validation explicite du Chef de projet (Document 00).

#### 1. Branding Public Exclusif

**Décision FIGÉE** : **"Elite64 – Competitive Chess Arena"** est le SEUL nom autorisé :
- en frontend
- en branding
- en documentation publique
- en CGU

**Règle absolue** : Aucune référence à "ChessBet" n'est tolérée dans les surfaces publiques.

**Vérification** : `npm run branding:scan` dans `frontend/` doit retourner 0 occurrence publique.

**Référence** : [Document 00 – Arbitrage B](../governance/00%20-%20[Chef%20de%20projet]%20-%2000.md#arbitrage-b--nommage-public--interne-critique--p0)

#### 2. Modèle Économique

**Décision FIGÉE** : Le prélèvement total par tournoi est de **9.75 %**.

**Détail du prélèvement** :
- **5.00 %** : commission plateforme
- **4.75 %** : frais de tournoi

**Caractéristiques techniques** :
- Le prélèvement peut être techniquement effectué en une seule fois
- Cette structure est **indispensable à la viabilité économique du projet**

**Implémentation** : Validée par test unitaire dans `backend/src/modules/prize-pool/prize-pool.service.spec.ts`

**Référence** : [Document 00 – Arbitrage A](../governance/00%20-%20[Chef%20de%20projet]%20-%2000.md#arbitrage-a--modèle-de-frais--prélèvements-critique--p0)

#### 3. Support Joueur

**Décision FIGÉE** : Email officiel de support joueur : **contact@elite64.app**

**Implémentation** :
- Backend : From = `Elite64 <no-reply@elite64.app>`, Reply-to = `contact@elite64.app`
- Frontend : À afficher dans les pages publiques (CGU, mentions légales)

**Référence** : [Document 00 – Arbitrage C](../governance/00%20-%20[Chef%20de%20projet]%20-%2000.md#arbitrage-c--support-joueur-p1--non-bloquant)

#### 4. Gouvernance Documentaire

**Décision FIGÉE** : `/docs` est la seule source de vérité.

**Structure** :
- Documentation organisée par phases (00-06)
- Documents Governance (00-08) dans `docs/governance/`
- Rapports d'audit dans `docs/_audits/`
- Archives dans `docs/_archives/`

**Règle** : Toute modification de la gouvernance nécessite une validation explicite du Chef de projet.

---

## ⚠️ Dette Technique Connue et Assumée

### 1. Double Modal de Promotion (Non Bloquant)

**Symptôme** : Lors d'une promotion de pion, deux modals peuvent apparaître brièvement :
- Un overlay natif de `react-chessboard` (legacy)
- Le modal React `PromotionModal` (produit)

**Cause identifiée** :
- `react-chessboard` injecte un overlay legacy avant `onPieceDrop`
- Le frontend déclenche en parallèle un modal React
- Backend hors de cause

**Tentatives techniques réalisées** :
- Override CSS ciblé → insuffisant
- MutationObserver temporaire → aucun sélecteur DOM exploitable
- Overlay généré sans attributs stables

**Décision de stabilisation** :
- Situation laissée en l'état
- Problème non bloquant
- Dette technique documentée
- Reprise éventuelle ultérieure (ou changement de lib)

**Documentation** : [Phase 6.2.C – UX Polish Gameplay](../phase-06_gameplay-echecs/frontend/phase-06.2.C_ux-polish-gameplay_frontend.md#known-issues--technical-debt)

**Conclusion technique** : Le problème est connu, circonscrit, isolé, assumé, et ne bloque pas la reprise du développement.

### 2. Tests E2E Non Exécutés en CI

**État** : Tests E2E existants mais non exécutés automatiquement.

**Raison** : Nécessitent environnement configuré (base de données, serveurs backend/frontend).

**Impact** : Validation manuelle requise pour les flux utilisateur complets.

**Recommandation** : Exécuter les tests E2E dans un environnement de staging avant déploiement.

### 3. Variations de Take Rate sur Très Petits Montants

**Comportement** : Avec `Math.floor()`, le take rate réel peut être légèrement inférieur à 9.75% pour de très petits montants (ex: 1 joueur, 1€ → 9% au lieu de 9.75%).

**Impact** : Acceptable pour les montants réels (buy-in typique ≥ 5€).

**Recommandation** : Documenter ce comportement dans la documentation produit si nécessaire.

---

## 🛡️ Garde-fous Techniques

### Avant Toute Modification

1. **Vérifier les arbitrages FIGÉS** :
   - Consulter [Document 00](../governance/00%20-%20[Chef%20de%20projet]%20-%2000.md) avant toute décision stratégique
   - Ne jamais modifier le modèle économique sans validation
   - Ne jamais introduire "ChessBet" dans les surfaces publiques

2. **Exécuter les tests** :
   ```bash
   # Frontend
   cd frontend && npm run lint
   cd frontend && npm run build
   
   # Backend
   cd backend && npm test
   cd backend && npm run build
   ```

3. **Vérifier le branding** :
   ```bash
   cd frontend && npm run branding:scan
   ```

4. **Documenter les changements** :
   - Mettre à jour la documentation si nécessaire
   - Créer un changelog si modification majeure
   - Respecter la [convention de nommage des documents](../_maintenance/MAINTENANCE_GUIDE.md)

### Règles de Code

1. **TypeScript strict** : Pas de `any`, typage complet
2. **Pas de nouvelles dépendances** : Évaluer l'impact avant ajout
3. **Accessibilité minimale** : ESC, focus trap, ARIA de base pour les modals
4. **Tests unitaires** : Maintenir la couverture existante
5. **Lint** : Aucune erreur ESLint tolérée

### Zones Sensibles à Toucher avec Précaution

1. **`backend/src/modules/prize-pool/prize-pool.service.ts`** :
   - Modèle économique 9.75% (FIGÉ)
   - Toute modification doit préserver le take rate total

2. **`backend/src/mail/mail.service.ts`** :
   - Emails user-facing (From/Reply-to FIGÉS)
   - Ne jamais utiliser "ChessBet" dans les emails

3. **`frontend/lib/branding.ts`** :
   - Constantes centralisées du branding
   - Source unique de vérité pour le nom public

4. **`frontend/pages/matches/[id].tsx`** :
   - Logique de promotion (dette technique connue)
   - Modals React (Phase 6.2.C)

---

## 📚 Structure de Documentation

### Organisation

```
docs/
├── governance/          # Documents Governance 00-08 (FIGÉS)
├── phase-00_*/          # Fondations techniques
├── phase-01_*/          # Auth et comptes joueurs
├── phase-02_*/          # Wallets et transactions
├── phase-03_*/          # Tournois structure
├── phase-04_*/          # Prize pool et modération
├── phase-05_*/          # Matches et brackets
├── phase-06_*/          # Gameplay échecs
├── _audits/             # Rapports d'audit (BLOC 3, 6.x)
├── _archives/           # Documents obsolètes
└── _maintenance/        # Guides de maintenance
```

### Convention de Nommage

Format : `phase-XX[.X.X]_description-kebab-case_scope.md`

Exemples :
- `phase-00_prisma-schema_overview-backend.md`
- `phase-06.0.C_gameplay-orchestration_cross.md`

Scopes : `backend`, `frontend`, `cross`

**Référence** : [Guide de Maintenance](../_maintenance/MAINTENANCE_GUIDE.md)

---

## 🚀 Backlog Immédiat Recommandé

### BLOC 6.6 — Validation Staging (Recommandé, Non Bloquant)

**Objectif** : Valider le déploiement en environnement de staging.

**Tâches** :
1. Déploiement staging (infrastructure)
2. Tests E2E complets (parcours critiques)
3. Validation manuelle emails (vérifier l'envoi réel)
4. Validation manuelle parcours utilisateur (inscription, tournoi, match)

**Priorité** : P1 (recommandé avant production)

**Résultat attendu** : Environnement staging fonctionnel et validé.

### BLOC 6.7 — Dette Technique & Nettoyage P1 (Optionnel)

**Objectif** : Nettoyer la dette technique non bloquante.

**Tâches** :
1. Dette assumée (ex. promotion chessboard) — documenter si non résolu
2. Nettoyage interne non bloquant (package.json, tests E2E)
3. Garde-fous complémentaires si utiles

**Priorité** : P2 (optionnel)

**Résultat attendu** : Codebase plus propre, dette documentée.

### BLOC 7 — Développement Produit Post-RC

**Objectif** : Reprendre le développement de nouvelles fonctionnalités.

**Court terme (features sûres)** :
- Améliorations UX mineures
- Corrections de bugs non critiques
- Optimisations de performance

**Moyen terme (évolutions structurantes)** :
- Nouvelles fonctionnalités produit
- Évolutions backend
- Améliorations frontend

**Zones sensibles** :
- Toucher avec précaution les zones listées dans "Garde-fous Techniques"

**Priorité** : P0 (développement continu)

**Résultat attendu** : Développement itératif et sécurisé.

---

## 📖 Références Essentielles

### Documents d'Autorité

1. **[Document 00 – Chef de projet](../governance/00%20-%20[Chef%20de%20projet]%20-%2000.md)** :
   - Arbitrages FIGÉS
   - Règles de gouvernance
   - Source de vérité pour les décisions stratégiques

2. **[README Documentation](../README.md)** :
   - Index de toute la documentation
   - Structure par phases
   - Liens vers les documents

### Rapports d'Audit

1. **[BLOC 6.5 – Validation Release Candidate](../_audits/_BLOC_6_5_RELEASE_CANDIDATE_VALIDATION.md)** :
   - État de validation actuel
   - Critères P0 validés

2. **[BLOC 6.1 – Diagnostic technique](../_audits/_BLOC_6_1_DIAGNOSTIC_TECHNIQUE.md)** :
   - Diagnostic complet du codebase
   - Recommandations techniques

3. **[BLOC 6.3 – Changelog verrouillage branding](../_audits/_BLOC_6_3_CHANGELOG.md)** :
   - Correctifs branding appliqués
   - Constantes centralisées

### Documentation Technique

1. **[Phase 6.2.C – UX Polish Gameplay](../phase-06_gameplay-echecs/frontend/phase-06.2.C_ux-polish-gameplay_frontend.md)** :
   - Dette technique promotion documentée
   - Implémentation des modals React

2. **[Guide de Maintenance](../_maintenance/MAINTENANCE_GUIDE.md)** :
   - Convention de nommage
   - Règles de documentation

---

## ✅ Checklist Avant Nouvelle Feature

Avant de développer une nouvelle feature, vérifier :

- [ ] Les arbitrages FIGÉS ne sont pas violés
- [ ] Le branding public reste "Elite64 – Competitive Chess Arena"
- [ ] Le modèle économique 9.75% n'est pas modifié
- [ ] Les tests passent (lint, build, unitaires)
- [ ] Le scan branding retourne 0 occurrence publique de "ChessBet"
- [ ] La documentation est mise à jour si nécessaire
- [ ] Les zones sensibles sont touchées avec précaution
- [ ] La dette technique connue est prise en compte

---

## 🎯 Conclusion

**Le projet Elite64 est prêt pour un développement continu, structuré et sécurisé.**

**État** : ✅ Release Candidate validé, gouvernance figée, dette technique documentée.

**Prochaines étapes** : Voir [Plan d'Action de Reprise](./_PLAN_ACTION_REPRISE.md) pour le détail des blocs 6.6, 6.7 et BLOC 7.

---

**Dernière mise à jour** : 27 janvier 2025  
**Maintenu par** : Lead Tech & Product Owner

