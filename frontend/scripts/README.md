# Scripts E2E - Elite64 Frontend

## 📋 Vue d'ensemble

Ce dossier contient les scripts de tests End-to-End (E2E) pour la plateforme Elite64.

### 📄 Logs Automatiques

Tous les scripts E2E sauvegardent automatiquement leurs sorties dans le dossier `test-results/` :

- **Format** : `e2e-[type]-[timestamp].txt`
- **Exemples** :
  - `test-results/e2e-gameplay-2025-12-16T20-30-45.txt`
  - `test-results/e2e-comprehensive-2025-12-16T20-35-12.txt`

**Avantages** :
- ✅ Historique complet de tous les tests
- ✅ Débogage facilité avec logs persistants
- ✅ Partage facile des résultats de tests
- ✅ Les logs ne sont pas versionnés (`.gitignore`)

Le chemin du fichier de log est affiché à la fin de chaque exécution.

---

## 🎯 e2e-gameplay-comprehensive.ts (RECOMMANDÉ)

**Script de test exhaustif pour TOUS les types de mouvements aux échecs.**

### Description

Teste **tous les types de mouvements possibles** aux échecs via l'API :

**✅ Promotions** :
- SC1 : Promotion en Dame (Q)
- SC2 : Promotion en Tour (R)
- SC3 : Promotion en Fou (B)
- SC4 : Promotion en Cavalier (N)

**✅ Roques** :
- SC5 : Petit roque Blanc (O-O)
- SC6 : Grand roque Blanc (O-O-O)
- SC7 : Petit roque Noir (O-O)
- SC8 : Grand roque Noir (O-O-O)

**✅ Prises en passant** :
- SC9 : Prise en passant Blanc
- SC10 : Prise en passant Noir

**✅ Autres** :
- SC13 : Résignation

### Prérequis

- Backend démarré sur `http://localhost:4000`
- Un compte admin existant (super admin)
- PostgreSQL accessible et synchronisé

### Usage

**Exécution simple** :

```bash
cd frontend
npm run e2e:comprehensive
```

**Via le script PowerShell helper** :

```bash
cd frontend/scripts
.\run-e2e-comprehensive.ps1
```

**Mode verbose** :

```bash
npm run e2e:comprehensive:verbose
```

### ⏱️ Durée

Ce test prend environ **5-10 minutes** car il :
- Crée un match pour chaque scénario (11 matches au total)
- Joue des séquences de coups complètes pour atteindre les positions nécessaires
- Valide chaque type de mouvement spécifique

### 🎯 Résultats Obtenus

**Taux de réussite** : **11/11 PASS (100%)** ✅

Tous les types de mouvements aux échecs sont validés exhaustivement via l'API backend.

### Variables d'environnement

| Variable | Description | Défaut |
|----------|-------------|--------|
| `API_BASE_URL` | URL de base de l'API backend | `http://localhost:4000` |
| `ADMIN_EMAIL` | Email du compte admin | `florian.lantigner@ik.me` |
| `ADMIN_PASSWORD` | Mot de passe admin | `Dark-123` |

---

## 🧪 e2e-gameplay.ts

Script de test E2E pour la **Phase 6.0.C - Gameplay API**.

### Description

Teste les endpoints gameplay via HTTP uniquement (aucune modification backend, API-only).

**Scénarios testés** :
- ✅ **SC0** : Sanity check (join + state initial)
- ✅ **SC1** : Coup légal simple (e2-e4)
- ✅ **SC2** : Rejection de coups illégaux (NOT_YOUR_TURN, ILLEGAL_MOVE)
- ✅ **SC3** : Roque (petit roque blanc O-O)
- ⏭️ **SC4** : En passant (SKIPPED - nécessite setup spécifique)
- ✅ **SC5** : Résignation
- ⏭️ **SC6** : No-show lazy (SKIPPED - flag --slow, non implémenté)
- ⏭️ **SC7** : Timeout (SKIPPED - flag --slow, non implémenté)

### Prérequis

- Backend démarré sur `http://localhost:4000` (ou autre via `API_BASE_URL`)
- Un compte admin existant (super admin)
- PostgreSQL accessible et synchronisé

### Installation

La dépendance `tsx` est déjà installée lors de `npm install`.

Si besoin :

```bash
cd frontend
npm install
```

---

## 🚀 Usage

### MODE A : Autonome (Recommandé)

Le script crée automatiquement un tournoi, inscrit deux joueurs, démarre le tournoi, et teste le gameplay.

**Exécution simple** :

```bash
cd frontend
npm run e2e:gameplay
```

**Avec variables d'environnement personnalisées** :

```bash
API_BASE_URL=http://localhost:4000 \
ADMIN_EMAIL=admin@example.com \
ADMIN_PASSWORD=password \
P1_EMAIL=player1test@example.com \
P1_PASSWORD=TestPass1! \
P2_EMAIL=player2test@example.com \
P2_PASSWORD=TestPass2! \
npm run e2e:gameplay
```

**Variables d'environnement** :

| Variable | Description | Défaut |
|----------|-------------|--------|
| `API_BASE_URL` | URL de base de l'API backend | `http://localhost:4000` |
| `ADMIN_EMAIL` | Email du compte admin | `florian.lantigner@ik.me` |
| `ADMIN_PASSWORD` | Mot de passe admin | `TestPassword123!` |
| `P1_EMAIL` | Email joueur 1 | `player1test@example.com` |
| `P1_PASSWORD` | Mot de passe joueur 1 | `TestPass1!` |
| `P2_EMAIL` | Email joueur 2 | `player2test@example.com` |
| `P2_PASSWORD` | Mot de passe joueur 2 | `TestPass2!` |

---

### MODE B : Manuel (avec IDs fournis)

Si vous avez déjà un match créé, vous pouvez fournir directement les IDs :

```bash
MATCH_ID=xxx \
TOKEN_WHITE=yyy \
TOKEN_BLACK=zzz \
npm run e2e:gameplay
```

**Variables d'environnement** :

| Variable | Description |
|----------|-------------|
| `MATCH_ID` | ID du match à tester |
| `TOKEN_WHITE` | Token JWT du joueur blanc |
| `TOKEN_BLACK` | Token JWT du joueur noir |

---

## 🎛️ Flags

### --slow

Active les tests lents (no-show, timeout).

**Non implémenté actuellement** (SC6 et SC7 seront SKIPPED).

```bash
npm run e2e:gameplay:slow
```

### --verbose

Affiche plus de détails sur les requêtes HTTP (endpoints, bodies, réponses).

```bash
npm run e2e:gameplay:verbose
```

### Combinaison

```bash
npm run e2e:gameplay -- --slow --verbose
```

---

## 📊 Rapport de Sortie

Le script génère un rapport en console avec :

### Tableau de résultats

```
╔════════════════════════════════════════════════════════════╗
║                      RAPPORT FINAL                         ║
╚════════════════════════════════════════════════════════════╝

┌──────────────────────────────┬────────────┬──────────────────────────────────────────────────┐
│ SCENARIO                     │ STATUS     │ MESSAGE                                          │
├──────────────────────────────┼────────────┼──────────────────────────────────────────────────┤
│ ✅ SC0                        │ PASS       │ Sanity check passed                              │
│ ✅ SC1                        │ PASS       │ Legal move accepted                              │
│ ✅ SC2                        │ PASS       │ Illegal moves rejected correctly                 │
│ ✅ SC3                        │ PASS       │ Castling accepted                                │
│ ⏭️ SC4                        │ SKIPPED    │ En passant test skipped (requires specific setup)│
│ ✅ SC5                        │ PASS       │ Resignation handled correctly                    │
└──────────────────────────────┴────────────┴──────────────────────────────────────────────────┘

📊 Statistiques: 5/6 PASS, 0/6 FAIL, 1/6 SKIPPED

✅ Tests PASSED
```

### Statuts possibles

- ✅ **PASS** : Test réussi
- ❌ **FAIL** : Test échoué (détails affichés)
- ⏭️ **SKIPPED** : Test sauté (raison expliquée)

### Exit codes

- `0` : Tous les tests PASS (skips autorisés)
- `1` : Au moins un test FAIL ou aucun test PASS

---

## 🛠️ Débogage

### Activer le mode verbose

Pour voir toutes les requêtes HTTP et leurs réponses :

```bash
npm run e2e:gameplay:verbose
```

### Logs détaillés

Le script affiche :
- 🔧 Setup (création tournoi, inscription joueurs)
- 🧪 Exécution de chaque scénario avec résultats intermédiaires
- 📊 Rapport final avec statistiques

### Erreurs courantes

#### Erreur : "Cannot find module 'tsx'"

**Solution** : Installer les dépendances

```bash
cd frontend
npm install
```

#### Erreur : "API Error: 401"

**Cause** : Identifiants admin incorrects

**Solution** : Vérifier `ADMIN_EMAIL` et `ADMIN_PASSWORD`

```bash
ADMIN_EMAIL=votre-admin@example.com \
ADMIN_PASSWORD=votre-password \
npm run e2e:gameplay
```

#### Erreur : "Aucun match créé"

**Cause** : Le tournoi n'a pas démarré correctement

**Solution** : Vérifier que le backend est accessible et fonctionnel

```bash
curl http://localhost:4000/health
```

#### Erreur : "Expected status RUNNING, got PENDING"

**Cause** : Le 2ème joueur n'a pas joint correctement

**Solution** : Vérifier les logs backend et la logique de join

---

## 🔒 Sécurité

### Dépendances

- ✅ **tsx** : MIT license
- ✅ Aucune dépendance GPL
- ✅ Utilise `fetch` natif Node.js (pas de librairie externe pour HTTP)

### Données de test

Le script crée des données de test :
- Comptes joueurs temporaires (`player1test@example.com`, `player2test@example.com`)
- Tournois de test (buy-in à 0€)
- Matches de test

⚠️ **Ne pas exécuter en production** - Uniquement en environnement de développement/test.

---

## 📚 Références

### Documentation associée

- [Phase 6.0.C - Orchestration Gameplay](../../docs/phase-06_gameplay-echecs/cross/phase-06.0.C_gameplay-orchestration_cross.md)
- [Phase 6.1 - Frontend Gameplay MVP](../../docs/phase-06_gameplay-echecs/frontend/phase-06.1_frontend-gameplay_frontend.md)
- [Phase 6.2 - Tests E2E Gameplay Complets](../../docs/phase-06_gameplay-echecs/cross/phase-06.2_e2e-gameplay-tests_cross.md) - Documentation complète des tests E2E avec résultats détaillés

### Endpoints testés

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/matches/:id/join` | POST | Rejoindre un match |
| `/matches/:id/state` | GET | Récupérer l'état du match |
| `/matches/:id/move` | POST | Jouer un coup |
| `/matches/:id/resign` | POST | Abandonner le match |

---

## 🚀 Améliorations futures

- [ ] Implémenter SC6 (No-show lazy test)
- [ ] Implémenter SC7 (Timeout test)
- [ ] Ajouter SC8 (Promotion test avec tous les cas)
- [ ] Ajouter SC9 (En passant avec setup automatique)
- [ ] Support de fichiers de configuration (JSON/YAML)
- [ ] Génération de rapports HTML
- [ ] Intégration CI/CD (GitHub Actions, GitLab CI)

---

**Maintenu par** : Équipe Elite64  
**Dernière mise à jour** : 15 décembre 2025

