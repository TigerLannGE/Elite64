# Plan d'Action de Reprise — Elite64

**Date de création** : 27 janvier 2025  
**Dernière mise à jour** : 27 janvier 2025  
**Statut** : ✅ Plan actif

---

## 📋 Vue d'ensemble

Ce plan d'action structure la reprise du développement du projet Elite64 – Competitive Chess Arena après la phase d'assainissement et de sécurisation (BLOC 3 → BLOC 6.5).

**Contexte** : Le projet a atteint un état sain et validé (Release Candidate PASS). Ce plan définit les prochaines étapes pour :
- Valider le déploiement en staging (BLOC 6.6)
- Nettoyer la dette technique non bloquante (BLOC 6.7)
- Reprendre le développement produit (BLOC 7)

**Référence** : [Guide de Reprise du Développement](./DEVELOPMENT_RESUME_GUIDE.md)

---

## 🎯 BLOC 6.6 — Validation Staging

### Objectif

Valider le déploiement en environnement de staging et s'assurer que tous les parcours critiques fonctionnent correctement avant la mise en production.

### Liste de Tâches

#### Tâche 6.6.1 : Déploiement Staging

**Type** : Infrastructure / Ops  
**Priorité** : P1 (recommandé)

**Actions** :
1. Configurer l'environnement de staging (serveurs, base de données)
2. Déployer le backend (NestJS)
3. Déployer le frontend (Next.js)
4. Configurer les variables d'environnement (SMTP, base de données, etc.)
5. Vérifier la connectivité backend ↔ frontend
6. Vérifier la connectivité base de données

**Résultat attendu** : Environnement staging accessible et fonctionnel.

**Dépendances** : Aucune

**Vérification** :
- ✅ Backend accessible (health check)
- ✅ Frontend accessible (page d'accueil)
- ✅ Base de données connectée
- ✅ Variables d'environnement configurées

---

#### Tâche 6.6.2 : Tests E2E Complets

**Type** : Tests / Validation  
**Priorité** : P1 (recommandé)

**Actions** :
1. Configurer l'environnement de test E2E (Playwright)
2. Exécuter les tests E2E existants :
   - `frontend/tests/e2e/smoke.spec.ts`
   - `frontend/tests/e2e/match-seed-example.spec.ts`
3. Valider les parcours critiques :
   - Inscription utilisateur
   - Connexion
   - Création de tournoi (admin)
   - Inscription à un tournoi
   - Déroulement d'un match
   - Fin de match et redistribution

**Résultat attendu** : Tous les tests E2E passent en staging.

**Dépendances** : Tâche 6.6.1 (déploiement staging)

**Vérification** :
- ✅ Tous les tests E2E passent
- ✅ Aucune régression détectée
- ✅ Parcours critiques validés

**Commandes** :
```bash
cd frontend && npm run test:e2e
```

---

#### Tâche 6.6.3 : Validation Manuelle Emails

**Type** : Validation / Ops  
**Priorité** : P1 (recommandé)

**Actions** :
1. Tester l'envoi d'email de vérification :
   - Créer un compte utilisateur
   - Vérifier la réception de l'email
   - Vérifier le From : `Elite64 <no-reply@elite64.app>`
   - Vérifier le Reply-to : `contact@elite64.app`
   - Vérifier le contenu (pas de "ChessBet")
2. Tester l'envoi d'email de réinitialisation de mot de passe :
   - Demander une réinitialisation
   - Vérifier la réception de l'email
   - Vérifier le From/Reply-to
   - Vérifier le contenu

**Résultat attendu** : Emails envoyés correctement avec le bon branding.

**Dépendances** : Tâche 6.6.1 (déploiement staging)

**Vérification** :
- ✅ Emails reçus dans la boîte de réception
- ✅ From/Reply-to conformes (Elite64, contact@elite64.app)
- ✅ Contenu sans "ChessBet"
- ✅ Liens fonctionnels

---

#### Tâche 6.6.4 : Validation Manuelle Parcours Utilisateur

**Type** : Validation / UX  
**Priorité** : P1 (recommandé)

**Actions** :
1. Parcours complet utilisateur :
   - Inscription → Vérification email → Connexion
   - Dépôt de fonds (simulation)
   - Inscription à un tournoi
   - Participation à un match
   - Fin de match et résultats
2. Parcours admin :
   - Connexion admin
   - Création de tournoi
   - Gestion des joueurs
   - Modération
3. Vérifications UX :
   - Branding "Elite64" visible partout
   - Aucune occurrence de "ChessBet"
   - Modals fonctionnels (promotion, résignation)
   - Messages d'erreur clairs

**Résultat attendu** : Parcours utilisateur et admin validés manuellement.

**Dépendances** : Tâche 6.6.1 (déploiement staging)

**Vérification** :
- ✅ Parcours utilisateur complet sans blocage
- ✅ Parcours admin fonctionnel
- ✅ UX cohérente et sans régression
- ✅ Branding conforme

---

### Résultat Attendu Global

**Environnement staging fonctionnel et validé** :
- ✅ Déploiement réussi
- ✅ Tests E2E passants
- ✅ Emails fonctionnels
- ✅ Parcours utilisateur validés

**Priorité** : P1 (recommandé, non bloquant pour développement)

**Durée estimée** : 2-3 jours

---

## 🧹 BLOC 6.7 — Dette Technique & Nettoyage P1

### Objectif

Nettoyer la dette technique non bloquante et améliorer la cohérence interne du codebase.

### Liste de Tâches

#### Tâche 6.7.1 : Documentation Dette Technique

**Type** : Documentation  
**Priorité** : P2 (optionnel)

**Actions** :
1. Documenter explicitement la dette technique connue :
   - Double modal de promotion (déjà documenté dans Phase 6.2.C)
   - Tests E2E non exécutés en CI
   - Variations de take rate sur très petits montants
2. Créer ou mettre à jour un fichier `TECHNICAL_DEBT.md` si nécessaire
3. Lister les options de résolution future (changement de lib, refactoring, etc.)

**Résultat attendu** : Dette technique clairement documentée et traçable.

**Dépendances** : Aucune

**Vérification** :
- ✅ Dette technique listée et expliquée
- ✅ Options de résolution documentées
- ✅ Impact évalué

---

#### Tâche 6.7.2 : Nettoyage Interne Non Bloquant

**Type** : Code / Cohérence  
**Priorité** : P2 (optionnel)

**Actions** :
1. Renommer les packages internes (si souhaité) :
   - `frontend/package.json` : `"name": "chessbet-frontend"` → `"elite64-frontend"`
   - `frontend/package-lock.json` : Mise à jour automatique
2. Nettoyer les variables d'environnement de test :
   - `frontend/scripts/run-e2e.ps1` : `$env:ADMIN_PASSWORD = "Chessbet24!"` → Optionnel
3. Vérifier la cohérence des commentaires de code (pas de "ChessBet" dans les commentaires publics)

**Résultat attendu** : Codebase plus cohérent en interne.

**Dépendances** : Aucune

**Vérification** :
- ✅ Packages renommés (si décidé)
- ✅ Variables de test cohérentes
- ✅ Commentaires propres

**Note** : Ces actions sont optionnelles et n'ont aucun impact public. Priorité basse.

---

#### Tâche 6.7.3 : Garde-fous Complémentaires

**Type** : Infrastructure / Qualité  
**Priorité** : P2 (optionnel)

**Actions** :
1. Ajouter des hooks Git (pre-commit, pre-push) si utile :
   - Lint automatique
   - Tests unitaires
   - Scan branding
2. Configurer CI/CD basique si non présent :
   - Lint + Build sur chaque PR
   - Tests unitaires sur chaque PR
3. Ajouter des scripts de vérification :
   - Script de vérification du take rate
   - Script de vérification du branding

**Résultat attendu** : Garde-fous automatiques pour éviter les régressions.

**Dépendances** : Aucune

**Vérification** :
- ✅ Hooks Git fonctionnels (si ajoutés)
- ✅ CI/CD configuré (si ajouté)
- ✅ Scripts de vérification disponibles

**Note** : Ces actions sont optionnelles et dépendent de l'infrastructure disponible.

---

### Résultat Attendu Global

**Codebase plus propre et dette documentée** :
- ✅ Dette technique clairement documentée
- ✅ Nettoyage interne effectué (si décidé)
- ✅ Garde-fous complémentaires en place (si décidé)

**Priorité** : P2 (optionnel)

**Durée estimée** : 1-2 jours

---

## 🚀 BLOC 7 — Développement Produit Post-RC

### Objectif

Reprendre le développement de nouvelles fonctionnalités de manière structurée et sécurisée, en respectant les garde-fous établis.

### Court Terme (Features Sûres)

#### Tâche 7.1 : Améliorations UX Mineures

**Type** : Frontend / UX  
**Priorité** : P0 (développement continu)

**Exemples de tâches** :
- Améliorer les messages d'erreur
- Optimiser les temps de chargement
- Améliorer l'accessibilité (ARIA, clavier)
- Polir les animations et transitions

**Règles** :
- Respecter les garde-fous techniques
- Maintenir la cohérence du branding
- Tester avant commit

**Résultat attendu** : UX améliorée sans régression.

---

#### Tâche 7.2 : Corrections de Bugs Non Critiques

**Type** : Bugfix  
**Priorité** : P0 (développement continu)

**Processus** :
1. Identifier le bug
2. Vérifier qu'il ne viole pas les arbitrages FIGÉS
3. Corriger avec tests
4. Valider (lint, build, tests)
5. Documenter si nécessaire

**Résultat attendu** : Bugs corrigés sans introduire de régression.

---

#### Tâche 7.3 : Optimisations de Performance

**Type** : Performance  
**Priorité** : P0 (développement continu)

**Exemples** :
- Optimiser les requêtes base de données
- Réduire la taille des bundles frontend
- Mettre en cache les données statiques
- Optimiser les images

**Règles** :
- Mesurer avant/après
- Ne pas sacrifier la qualité pour la performance
- Tester les optimisations

**Résultat attendu** : Performance améliorée.

---

### Moyen Terme (Évolutions Structurantes)

#### Tâche 7.4 : Nouvelles Fonctionnalités Produit

**Type** : Feature  
**Priorité** : P0 (développement continu)

**Processus** :
1. **Avant développement** :
   - Vérifier les arbitrages FIGÉS (Document 00)
   - Valider que la feature ne casse pas le modèle économique
   - Vérifier le branding
   - Planifier les tests

2. **Développement** :
   - Respecter les garde-fous techniques
   - Maintenir la cohérence du code
   - Documenter si nécessaire

3. **Après développement** :
   - Lint + Build + Tests
   - Scan branding
   - Validation manuelle
   - Documentation mise à jour

**Résultat attendu** : Nouvelles fonctionnalités ajoutées de manière sécurisée.

---

#### Tâche 7.5 : Évolutions Backend

**Type** : Backend  
**Priorité** : P0 (développement continu)

**Zones sensibles** :
- `prize-pool.service.ts` : Modèle économique 9.75% (FIGÉ)
- `mail.service.ts` : Emails user-facing (FIGÉS)
- `tournaments.service.ts` : Logique de tournois

**Règles** :
- Toucher avec précaution les zones sensibles
- Maintenir les tests unitaires
- Vérifier la cohérence avec le modèle économique

**Résultat attendu** : Évolutions backend sans régression.

---

#### Tâche 7.6 : Améliorations Frontend

**Type** : Frontend  
**Priorité** : P0 (développement continu)

**Zones sensibles** :
- `lib/branding.ts` : Constantes centralisées (FIGÉES)
- `pages/matches/[id].tsx` : Logique de promotion (dette connue)
- Modals React (Phase 6.2.C)

**Règles** :
- Respecter le branding "Elite64"
- Ne pas réintroduire "ChessBet"
- Maintenir la cohérence UX

**Résultat attendu** : Améliorations frontend cohérentes.

---

### Zones Sensibles à Toucher avec Précaution

**Liste complète** : Voir [Guide de Reprise du Développement](./DEVELOPMENT_RESUME_GUIDE.md#zones-sensibles-à-toucher-avec-précaution)

**Règle générale** : Avant toute modification dans ces zones, vérifier :
- Les arbitrages FIGÉS
- Les tests existants
- La documentation

---

### Résultat Attendu Global

**Développement itératif et sécurisé** :
- ✅ Nouvelles fonctionnalités ajoutées
- ✅ Bugs corrigés
- ✅ Performance optimisée
- ✅ Aucune régression introduite
- ✅ Arbitrages FIGÉS respectés

**Priorité** : P0 (développement continu)

**Durée estimée** : Continu

---

## 📊 Récapitulatif des Priorités

| Bloc | Priorité | Durée Estimée | Statut |
|------|----------|---------------|--------|
| **BLOC 6.6** — Validation Staging | P1 (recommandé) | 2-3 jours | ⏳ À faire |
| **BLOC 6.7** — Dette Technique & Nettoyage | P2 (optionnel) | 1-2 jours | ⏳ Optionnel |
| **BLOC 7** — Développement Produit | P0 (continu) | Continu | 🚀 En cours |

---

## ✅ Checklist de Démarrage

Avant de commencer le développement :

- [ ] Lire le [Guide de Reprise du Développement](./DEVELOPMENT_RESUME_GUIDE.md)
- [ ] Consulter le [Document 00 – Chef de projet](../governance/00%20-%20[Chef%20de%20projet]%20-%2000.md)
- [ ] Vérifier l'état actuel (BLOC 6.5 validé)
- [ ] Comprendre les arbitrages FIGÉS
- [ ] Connaître la dette technique assumée
- [ ] Configurer l'environnement de développement
- [ ] Exécuter les tests (lint, build, unitaires)

---

## 📚 Références

- **[Guide de Reprise du Développement](./DEVELOPMENT_RESUME_GUIDE.md)** : Document de référence unique
- **[Document 00 – Chef de projet](../governance/00%20-%20[Chef%20de%20projet]%20-%2000.md)** : Arbitrages FIGÉS
- **[BLOC 6.5 – Validation Release Candidate](../_audits/_BLOC_6_5_RELEASE_CANDIDATE_VALIDATION.md)** : État de validation actuel
- **[BLOC 6.1 – Diagnostic technique](../_audits/_BLOC_6_1_DIAGNOSTIC_TECHNIQUE.md)** : Diagnostic complet

---

**Dernière mise à jour** : 27 janvier 2025  
**Maintenu par** : Lead Tech & Product Owner

