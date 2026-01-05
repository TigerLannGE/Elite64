# Phase 6.2.B - Tests UI E2E - Documentation Frontend

**Date de création** : 06 janvier 2026  
**Dernière mise à jour** : 06 janvier 2026  
**Statut** : ✅ Complété (suite rapide + @slow NO_SHOW)

---

## 📋 Vue d'ensemble

La **Phase 6.2.B "Tests UI E2E"** vise à créer une suite complète de tests End-to-End pour l'interface utilisateur du gameplay. Contrairement aux tests API-only de la Phase 6.2 (cross), ces tests valident l'expérience utilisateur réelle dans un navigateur, incluant les interactions avec l'échiquier, les états UI, le timer, et les flux de navigation.

**⚠️ Important** : Cette phase complète les tests API-only existants (Phase 6.2 cross) en ajoutant une couche de tests UI pour garantir la qualité de l'expérience utilisateur.

---

## 🎯 Objectifs

### Objectifs Phase 6.2.B

- [ ] Implémenter une suite de tests UI E2E avec un outil de test navigateur (Playwright/Cypress)
- [ ] Tester l'échiquier interactif (drag/drop, validation visuelle, promotion)
- [ ] Valider les états UI (DRAW, TIEBREAK_PENDING, timer, erreurs)
- [ ] Tester les flux de navigation complets (lobby → tournoi → match → fin)
- [ ] Valider le polling et la mise à jour en temps réel
- [ ] Tester la gestion des erreurs et leur affichage contextuel
- [ ] Valider le timer client-side (décrémentation, synchronisation, pas de reset)
- [ ] Tester la navigation contextuelle après match terminé

### Contraintes

- ✅ Utiliser un outil de test navigateur moderne (Playwright recommandé)
- ✅ Tests isolés et reproductibles
- ✅ Pas de dépendance à des données de test spécifiques
- ✅ Tests rapides (< 5 minutes pour la suite complète)
- ✅ Logs et captures d'écran en cas d'échec

---

## 🏗️ Scope

### Fonctionnalités à tester

#### 1. Échiquier interactif
- [ ] Drag/drop des pièces fonctionne correctement
- [ ] Validation visuelle des coups légaux/illégaux
- [ ] Promotion des pions (modal ou prompt)
- [ ] Highlight du dernier coup joué (cases from/to)
- [ ] Orientation de l'échiquier (blanc/noir selon le joueur)
- [ ] Désactivation du drag/drop quand ce n'est pas le tour du joueur

#### 2. Timer client-side
- [ ] Timer décrémente correctement pour le joueur actif
- [ ] Timer reste fixe pour le joueur passif
- [ ] Pas de reset visuel (10:00 → 09:59 → 09:57 → 10:00)
- [ ] Synchronisation après un coup joué
- [ ] États visuels "temps faible" (< 60s warning, < 30s danger)
- [ ] Timer s'arrête quand le match est terminé

#### 3. États UI
- [ ] Badge de statut affiché correctement (RUNNING, FINISHED, DRAW, TIEBREAK_PENDING)
- [ ] Bloc TIEBREAK_PENDING avec CTA "Retour au tournoi"
- [ ] Affichage DRAW avec `resultReason`
- [ ] Indicateur de connexion (vert/jaune/rouge)

#### 4. Gestion des erreurs
- [ ] Erreur bloquante (joinMatch) : Écran d'erreur avec bouton "Retour au lobby"
- [ ] Erreur non bloquante (playMove) : Banner avec bouton ×
- [ ] Erreur polling : Banner discret jaune
- [ ] Mapping correct des codes d'erreur vers messages UX français
- [ ] Severity affichée correctement (danger/warning/info)

#### 5. Historique des coups
- [ ] Liste des coups affichée correctement (format SAN)
- [ ] Formatage par tour (ex: "1. e4 e5")
- [ ] Déduplication (pas de doublons)
- [ ] Reset automatique quand `matchId` change
- [ ] Affichage "Aucun coup joué" au début

#### 6. Navigation
- [ ] Navigation depuis tournoi vers match jouable
- [ ] Navigation contextuelle après match terminé :
  - Vainqueur : Bouton vert "🏆 Retour au tournoi" (prioritaire) + bouton gris "Retour au lobby"
  - Perdant : Bouton bleu "Retour au tournoi" (prioritaire) + bouton gris "Retour au lobby"
  - Match nul : Les deux boutons côte à côte (vert et bleu)
  - Spectateur : Les deux boutons côte à côte (vert et bleu)

#### 7. Polling et temps réel
- [ ] Polling automatique toutes les 2 secondes
- [ ] Mise à jour automatique de l'état après un coup adverse
- [ ] Retry/backoff en cas d'erreur réseau
- [ ] Indicateur de connexion mis à jour correctement

---

## 🛠️ Outils

### Outil recommandé : Playwright

**Pourquoi Playwright ?**
- ✅ Support multi-navigateurs (Chromium, Firefox, WebKit)
- ✅ API moderne et intuitive
- ✅ Screenshots et vidéos automatiques en cas d'échec
- ✅ Tests rapides et fiables
- ✅ Support TypeScript natif
- ✅ Intégration facile avec CI/CD

**Alternative** : Cypress (si préférence équipe)

### Dépendances à ajouter

```json
{
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "@types/node": "^20.0.0"
  }
}
```

### Structure proposée

```
frontend/
├── e2e/
│   ├── playwright.config.ts          # Configuration Playwright
│   ├── fixtures/
│   │   └── auth.setup.ts             # Setup authentification
│   ├── specs/
│   │   ├── match-gameplay.spec.ts    # Tests échiquier et gameplay
│   │   ├── match-timer.spec.ts       # Tests timer
│   │   ├── match-ui-states.spec.ts   # Tests états UI
│   │   ├── match-errors.spec.ts      # Tests gestion erreurs
│   │   ├── match-navigation.spec.ts  # Tests navigation
│   │   └── match-polling.spec.ts     # Tests polling
│   └── utils/
│       ├── test-helpers.ts            # Helpers pour tests
│       └── match-helpers.ts           # Helpers spécifiques match
```

---

## ✅ Definition of Done (DoD)

### Critères de complétion

1. **Infrastructure** :
   - [ ] Playwright installé et configuré
   - [ ] Configuration `playwright.config.ts` avec baseURL, timeout, etc.
   - [ ] Setup authentification réutilisable (fixtures)
   - [ ] Helpers pour création de tournois/matches de test

2. **Couverture de tests** :
   - [ ] **Échiquier interactif** : Au moins 5 tests (drag/drop, validation, promotion, highlight, orientation)
   - [ ] **Timer** : Au moins 4 tests (décrémentation, pas de reset, synchronisation, états visuels)
   - [ ] **États UI** : Au moins 3 tests (RUNNING, DRAW, TIEBREAK_PENDING)
   - [ ] **Gestion erreurs** : Au moins 4 tests (bloquant, non bloquant, polling, mapping)
   - [ ] **Historique coups** : Au moins 3 tests (affichage, formatage, déduplication)
   - [ ] **Navigation** : Au moins 4 tests (tournoi → match, vainqueur, perdant, match nul)
   - [ ] **Polling** : Au moins 2 tests (mise à jour automatique, retry/backoff)

3. **Qualité** :
   - [ ] Tous les tests passent de manière reproductible
   - [ ] Tests isolés (pas de dépendance entre tests)
   - [ ] Nettoyage automatique des données de test
   - [ ] Logs clairs en cas d'échec
   - [ ] Screenshots automatiques en cas d'échec

4. **Documentation** :
   - [ ] README dans `frontend/e2e/` avec instructions d'usage
   - [ ] Commentaires dans les tests pour expliquer les scénarios
   - [ ] Documentation mise à jour (ce fichier)

5. **CI/CD** (optionnel) :
   - [ ] Intégration dans le pipeline CI/CD
   - [ ] Exécution automatique sur chaque PR
   - [ ] Rapport de couverture généré

---

## 📋 Liste des Specs Testées

### Spec 1 : Échiquier interactif (`match-gameplay.spec.ts`)

#### Test 1.1 : Drag/drop fonctionne
- **Description** : Vérifier que le drag/drop des pièces fonctionne correctement
- **Steps** :
  1. Ouvrir un match en cours
  2. Sélectionner une pièce légale
  3. La déplacer vers une case légale
  4. Vérifier que le coup est joué et l'échiquier mis à jour
- **Assertions** :
  - La pièce est déplacée visuellement
  - Le coup est envoyé au backend
  - L'état du match est mis à jour

#### Test 1.2 : Validation visuelle coups illégaux
- **Description** : Vérifier que les coups illégaux sont rejetés visuellement
- **Steps** :
  1. Ouvrir un match en cours
  2. Essayer de déplacer une pièce vers une case illégale
  3. Vérifier que le coup est rejeté
- **Assertions** :
  - La pièce revient à sa position initiale
  - Un message d'erreur est affiché (banner orange)
  - L'échiquier reste dans l'état précédent

#### Test 1.3 : Promotion des pions
- **Description** : Vérifier que la promotion des pions fonctionne
- **Steps** :
  1. Créer un match et jouer jusqu'à une position de promotion
  2. Déplacer le pion vers la dernière rangée
  3. Sélectionner la pièce de promotion (Dame)
  4. Vérifier que la promotion est effectuée
- **Assertions** :
  - Un modal/prompt de promotion apparaît
  - La pièce choisie remplace le pion
  - Le coup est envoyé au backend avec le bon `promotion`

#### Test 1.4 : Highlight dernier coup
- **Description** : Vérifier que les cases from/to du dernier coup sont highlightées
- **Steps** :
  1. Ouvrir un match en cours
  2. Jouer un coup (ex: e2 → e4)
  3. Vérifier que les cases e2 et e4 sont highlightées
- **Assertions** :
  - Les cases from/to sont visuellement highlightées (couleur bleue)
  - Le highlight persiste jusqu'au prochain coup
  - Le highlight disparaît quand `lastMove` est null

#### Test 1.5 : Orientation échiquier
- **Description** : Vérifier que l'échiquier est orienté correctement selon le joueur
- **Steps** :
  1. Ouvrir un match en tant que joueur blanc
  2. Vérifier l'orientation de l'échiquier
  3. Ouvrir le même match en tant que joueur noir
  4. Vérifier que l'orientation est inversée
- **Assertions** :
  - Joueur blanc : a1 en bas à gauche
  - Joueur noir : a1 en haut à droite

#### Test 1.6 : Désactivation drag/drop quand pas le tour
- **Description** : Vérifier que le drag/drop est désactivé quand ce n'est pas le tour du joueur
- **Steps** :
  1. Ouvrir un match en tant que joueur blanc
  2. Attendre que ce soit le tour du joueur noir
  3. Essayer de déplacer une pièce
- **Assertions** :
  - Les pièces ne sont pas draggables
  - Un message informatif est affiché (si possible)

---

### Spec 2 : Timer client-side (`match-timer.spec.ts`)

#### Test 2.1 : Décrémentation joueur actif
- **Description** : Vérifier que le timer décrémente pour le joueur au trait
- **Steps** :
  1. Ouvrir un match en cours avec timer (ex: 10:00)
  2. Observer le timer pendant 10 secondes sans jouer
  3. Vérifier que le timer décrémente
- **Assertions** :
  - Le timer du joueur actif décrémente régulièrement (10:00 → 09:50)
  - Le timer de l'autre joueur reste fixe
  - Pas de saut ou de reset inattendu

#### Test 2.2 : Pas de reset visuel
- **Description** : Vérifier qu'il n'y a pas de reset visuel (10:00 → 09:59 → 09:57 → 10:00)
- **Steps** :
  1. Ouvrir un match en cours
  2. Observer le timer pendant 30 secondes sans jouer
  3. Vérifier qu'il n'y a pas de reset à 10:00
- **Assertions** :
  - Le timer descend régulièrement sans jamais remonter
  - Les logs console montrent "Skipping update (no change)" à chaque poll
  - Pas de log "Updating snapshot" tant que personne ne joue

#### Test 2.3 : Synchronisation après coup
- **Description** : Vérifier que le timer se synchronise après un coup joué
- **Steps** :
  1. Ouvrir un match en cours
  2. Jouer un coup
  3. Vérifier que le timer se synchronise correctement
- **Assertions** :
  - Le timer bascule sur l'autre joueur
  - Les valeurs sont synchronisées avec le serveur
  - Pas de saut ou de valeur incorrecte

#### Test 2.4 : États visuels "temps faible"
- **Description** : Vérifier les états visuels quand le temps est faible
- **Steps** :
  1. Créer un match avec un temps court (ex: 1 minute)
  2. Attendre que le temps descende sous 60 secondes
  3. Vérifier le changement de couleur (warning)
  4. Attendre que le temps descende sous 30 secondes
  5. Vérifier le changement de couleur (danger) avec animation pulse
- **Assertions** :
  - < 60s : Texte orange (`text-orange-600`)
  - < 30s : Texte rouge avec animation pulse (`text-red-600 animate-pulse`)
  - Le timer ne devient jamais négatif (reste à 00:00)

---

### Spec 3 : États UI (`match-ui-states.spec.ts`)

#### Test 3.1 : Badge statut RUNNING
- **Description** : Vérifier l'affichage du badge "En cours"
- **Steps** :
  1. Ouvrir un match en cours
  2. Vérifier le badge de statut
- **Assertions** :
  - Badge affiché avec texte "En cours"
  - Couleur bleue (`bg-blue-100 text-blue-800`)

#### Test 3.2 : Badge et bloc TIEBREAK_PENDING
- **Description** : Vérifier l'affichage du statut TIEBREAK_PENDING
- **Steps** :
  1. Créer un match qui se termine en DRAW avec tie-break
  2. Vérifier l'affichage
- **Assertions** :
  - Badge jaune "Match nul - Tie-break en attente"
  - Bloc jaune avec message explicatif
  - CTA "Retour au tournoi" présent

#### Test 3.3 : Badge DRAW normal
- **Description** : Vérifier l'affichage du statut DRAW
- **Steps** :
  1. Créer un match qui se termine en DRAW sans tie-break
  2. Vérifier l'affichage
- **Assertions** :
  - Badge jaune "Match nul"
  - Affichage de `resultReason` (ex: "INSUFFICIENT_MATERIAL")
  - Pas de bloc spécial (juste le badge)

---

### Spec 4 : Gestion des erreurs (`match-errors.spec.ts`)

#### Test 4.1 : Erreur bloquante (joinMatch)
- **Description** : Vérifier l'affichage d'une erreur bloquante
- **Steps** :
  1. Essayer d'accéder à un match où l'utilisateur n'est pas participant
  2. Vérifier l'affichage de l'erreur
- **Assertions** :
  - Écran d'erreur rouge avec titre "Accès refusé"
  - Message clair en français
  - Bouton "Retour au lobby" présent
  - Pas de bouton × (erreur bloquante)

#### Test 4.2 : Erreur non bloquante (playMove)
- **Description** : Vérifier l'affichage d'une erreur non bloquante
- **Steps** :
  1. Jouer un coup invalide (ex: déplacer un pion en arrière)
  2. Vérifier l'affichage de l'erreur
- **Assertions** :
  - Banner orange avec titre "Coup invalide"
  - Message clair en français
  - Bouton × pour fermer présent
  - L'échiquier reste utilisable

#### Test 4.3 : Erreur polling (discret)
- **Description** : Vérifier l'affichage d'une erreur de polling
- **Steps** :
  1. Couper temporairement la connexion réseau
  2. Vérifier l'affichage de l'erreur
  3. Rétablir la connexion
  4. Vérifier que l'erreur disparaît
- **Assertions** :
  - Banner jaune discret avec message "Connexion instable, tentative de reconnexion…"
  - Pas de spam, pas d'alert()
  - Le banner disparaît quand la connexion est rétablie

#### Test 4.4 : Mapping codes erreur → messages UX
- **Description** : Vérifier que les codes d'erreur backend sont mappés correctement
- **Steps** :
  1. Provoquer différentes erreurs (ILLEGAL_MOVE, NOT_YOUR_TURN, etc.)
  2. Vérifier les messages affichés
- **Assertions** :
  - Messages en français
  - Severity correcte (danger/warning/info)
  - Titre et message cohérents

---

### Spec 5 : Historique des coups (`match-history.spec.ts`)

#### Test 5.1 : Affichage liste coups
- **Description** : Vérifier l'affichage de l'historique des coups
- **Steps** :
  1. Ouvrir un match en cours
  2. Jouer 2 coups (ex: e4, e5)
  3. Vérifier l'affichage de l'historique
- **Assertions** :
  - Liste affichée avec format "1. e4 e5" (ou équivalent)
  - Formatage par tour correct
  - Pas de doublons

#### Test 5.2 : Déduplication
- **Description** : Vérifier qu'il n'y a pas de doublons dans l'historique
- **Steps** :
  1. Ouvrir un match en cours
  2. Jouer plusieurs coups
  3. Vérifier qu'il n'y a pas de doublons
- **Assertions** :
  - Chaque coup n'apparaît qu'une seule fois
  - La clé de déduplication fonctionne correctement

#### Test 5.3 : Reset automatique
- **Description** : Vérifier que l'historique se reset quand `matchId` change
- **Steps** :
  1. Ouvrir un match et jouer quelques coups
  2. Naviguer vers un autre match
  3. Vérifier que l'historique est reset
- **Assertions** :
  - L'historique est vide au début du nouveau match
  - Pas de coups du match précédent

---

### Spec 6 : Navigation (`match-navigation.spec.ts`)

#### Test 6.1 : Navigation tournoi → match
- **Description** : Vérifier la navigation depuis un tournoi vers un match jouable
- **Steps** :
  1. Ouvrir un tournoi avec un match jouable
  2. Cliquer sur le bouton "Jouer"
  3. Vérifier la redirection
- **Assertions** :
  - Redirection vers `/matches/[id]`
  - Le match est chargé correctement
  - L'échiquier est affiché

#### Test 6.2 : Navigation vainqueur
- **Description** : Vérifier la navigation après une victoire
- **Steps** :
  1. Terminer un match en gagnant
  2. Vérifier les boutons affichés
  3. Cliquer sur "🏆 Retour au tournoi"
  4. Vérifier la redirection
- **Assertions** :
  - Bouton vert "🏆 Retour au tournoi" (prioritaire)
  - Bouton gris "Retour au lobby" (secondaire)
  - Redirection vers le tournoi correcte

#### Test 6.3 : Navigation perdant
- **Description** : Vérifier la navigation après une défaite
- **Steps** :
  1. Terminer un match en perdant
  2. Vérifier les boutons affichés
  3. Cliquer sur "Retour au tournoi"
  4. Vérifier la redirection
- **Assertions** :
  - Bouton bleu "Retour au tournoi" (prioritaire)
  - Bouton gris "Retour au lobby" (secondaire)
  - Redirection vers le tournoi correcte

#### Test 6.4 : Navigation match nul
- **Description** : Vérifier la navigation après un match nul
- **Steps** :
  1. Terminer un match en match nul
  2. Vérifier les boutons affichés
  3. Cliquer sur "Retour au tournoi"
  4. Vérifier la redirection
- **Assertions** :
  - Les deux boutons côte à côte (vert et bleu, même taille)
  - Redirection vers le tournoi correcte

---

### Spec 7 : Polling et temps réel (`match-polling.spec.ts`)

#### Test 7.1 : Mise à jour automatique après coup adverse
- **Description** : Vérifier que l'état se met à jour automatiquement après un coup adverse
- **Steps** :
  1. Ouvrir un match en cours
  2. Attendre qu'un coup adverse soit joué (via autre session)
  3. Vérifier que l'état est mis à jour automatiquement
- **Assertions** :
  - L'échiquier est mis à jour avec le nouveau coup
  - L'historique des coups est mis à jour
  - Le highlight du dernier coup est mis à jour
  - Le timer bascule sur le joueur actif

#### Test 7.2 : Retry/backoff en cas d'erreur réseau
- **Description** : Vérifier que le polling retry avec backoff en cas d'erreur
- **Steps** :
  1. Ouvrir un match en cours
  2. Couper temporairement la connexion réseau
  3. Observer le comportement du polling
  4. Rétablir la connexion
  5. Vérifier la reconnexion
- **Assertions** :
  - Le polling retry avec backoff exponentiel
  - L'indicateur de connexion passe en jaune puis rouge
  - La reconnexion est automatique quand la connexion est rétablie
  - L'état est synchronisé après reconnexion

---

## 🧪 Tests

### Prérequis

- Backend démarré sur `http://localhost:4000`
- Frontend démarré sur `http://localhost:3000`
- PostgreSQL accessible et synchronisé
- Comptes de test créés (joueurs, admin)

### Exécution

```bash
# Installer les dépendances
cd frontend
npm install

# Installer les navigateurs Playwright
npx playwright install

# Exécuter tous les tests
npm run test:e2e:ui

# Exécuter un fichier spécifique
npx playwright test e2e/specs/match-timer.spec.ts

# Exécuter en mode headed (voir le navigateur)
npx playwright test --headed

# Exécuter en mode debug
npx playwright test --debug
```

### Configuration

**Fichier** : `frontend/e2e/playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './specs',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

---

## ⚠️ Points d'Attention

1. **Isolation des tests** :
   - Chaque test doit être indépendant
   - Nettoyage automatique des données de test après chaque test
   - Utilisation de fixtures pour l'authentification

2. **Stabilité** :
   - Utiliser des sélecteurs stables (data-testid recommandé)
   - Attendre les éléments avec `waitFor` plutôt que `sleep`
   - Gérer les timeouts correctement

3. **Performance** :
   - Tests parallèles quand possible
   - Réutiliser les sessions d'authentification (fixtures)
   - Éviter les attentes inutiles

4. **Maintenance** :
   - Commenter les tests complexes
   - Utiliser des helpers réutilisables
   - Documenter les scénarios de test

---

## 📚 Références

### Documentation Connexe

- [Phase 6.2 - Tests E2E Gameplay (API-only)](../cross/phase-06.2_e2e-gameplay-tests_cross.md)  
  Tests API-only existants (11/11 PASS)
- [Phase 6.1.B - Gameplay UX Completion](./phase-06.1.B_gameplay-ux-completion_frontend.md)  
  Améliorations UX : timer, états UI, erreurs, navigation
- [Phase 6.2.A - UX Clarity Gameplay](./phase-06.2.A_ux-clarity-gameplay_frontend.md)  
  Historique des coups et highlight dernier coup

### Documentation Externe

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Testing Library](https://testing-library.com/) (si utilisé pour les sélecteurs)

---

## 📊 Récapitulatif

| Fonctionnalité | Fichier de test | Statut |
|----------------|-----------------|--------|
| Échiquier interactif | `match.spec.ts` | ✅ Implémenté (suite rapide) |
| Timer client-side | `match.spec.ts` | ✅ Implémenté (suite rapide) |
| États UI | `match.spec.ts` | ✅ Implémenté (suite rapide) |
| Gestion erreurs | `match.spec.ts` | ✅ Implémenté (suite rapide) |
| Historique coups | `match.spec.ts` | ✅ Implémenté (suite rapide) |
| Navigation | `match.spec.ts` | ✅ Implémenté (suite rapide) |
| Polling temps réel | `match.spec.ts` | ✅ Implémenté (suite rapide) |
| NO_SHOW timeout | `match.slow.spec.ts` | ✅ Implémenté (@slow) |

---

**Statut final** : ✅ **Complété**

### Suite rapide (match.spec.ts)
- ✅ Tests gameplay rapides : échiquier, timers, coups légaux/illégaux, résignation
- ✅ Tests isolés et reproductibles avec `seedMatch`
- ✅ Utilisation de `data-testid` pour sélecteurs stables
- ✅ Fixtures d'authentification réutilisables

### Tests @slow (match.slow.spec.ts)
- ✅ Test NO_SHOW : vérifie la résolution automatique après 90s (30s JOIN_WINDOW + 60s NO_SHOW_GRACE)
- ✅ Timeout test : 130s (90s backend + 40s marge)
- ✅ Utilise `expect.poll` avec intervalles de 2s pour éviter flakiness
- ⚠️ **Exclus de la CI** : Ces tests ne font pas partie de la suite rapide et ne sont pas exécutés automatiquement en CI

---

## ⚠️ Limitations Connues

Cette section documente les limitations assumées et volontaires de la Phase 6.2.B, qui sont acceptées comme telles à ce stade du projet.

### Promotion de Pion - Non Couverte par les Tests E2E

**Position officielle** : La promotion de pion n'est **PAS couverte** par les tests E2E à ce stade.

**Raisons** :
- Dépend fortement de la position exacte du match
- Absence d'endpoint de setup FEN rend la création de positions de promotion complexe
- Complexité non justifiée à ce stade pour E2E (nécessiterait une séquence de 8+ coups déterministe)

**Test actuel** : La promotion est testée **manuellement uniquement**.

**Revisité ultérieurement si** :
- Ajout d'un endpoint de seed position (ex: `/admin/matches/:id/set-fen`)
- Ou tests UI spécifiques sur le modal de promotion (Phase 6.2.C)

### Absence d'Endpoint de Setup FEN

**Limitation** : Il n'existe pas d'endpoint backend pour injecter une position FEN arbitraire dans un match.

**Impact** :
- Certaines situations complexes sont difficiles à tester automatiquement (ex: promotion, positions spécifiques)
- Les tests E2E doivent créer des positions via des séquences de coups réels
- Cela peut rendre certains tests longs ou fragiles

**Workaround actuel** : Utilisation de séquences de coups déterministes pour créer des positions de test (ex: `seedPromotionPosition` pour la promotion).

### Timeout In-Game (No-Move) - Lazy-On-Move

**Comportement** : Le timeout in-game (no-move timeout) est **lazy-on-move**.

**Détails** :
- Le backend ne vérifie le timeout que lors d'appels à `/state`, `/join` ou `/move`
- **Pas de scheduler / cron backend** : Le timeout n'est pas vérifié automatiquement en arrière-plan
- Le frontend fait du polling sur `/state` toutes les 2 secondes, ce qui permet de détecter les timeouts automatiquement

**Impact** : Si personne n'appelle ces endpoints, le timeout n'est pas détecté.

**Note** : Cette limitation est assumée et documentée. Une amélioration future pourrait ajouter un scheduler backend pour vérifier automatiquement les timeouts.

### NO_SHOW - Résolution Lazy

**Comportement** : La résolution NO_SHOW est également **lazy**.

**Détails** :
- Le backend ne vérifie le timeout que lors d'appels à `/state`, `/join` ou `/move`
- Le frontend fait déjà du polling sur `/state` toutes les 2 secondes
- Le test attend donc que le polling détecte le changement de statut

**Impact** : Si personne n'appelle ces endpoints, le NO_SHOW n'est pas résolu automatiquement.

---

## 🔄 Transition vers Phase 6.2.C

La **Phase 6.2.C — UX Polish Gameplay** va se concentrer sur l'amélioration de l'expérience utilisateur via des modals React, sans modifier la logique métier backend.

**Focus Phase 6.2.C** :
- Modals UX pour résignation, fin de match, promotion
- Clarification des CTA et feedback utilisateur
- Accessibilité clavier minimale
- Aucun impact backend prévu

**Voir** : [Phase 6.2.C - UX Polish Gameplay](./phase-06.2.C_ux-polish-gameplay_frontend.md)

