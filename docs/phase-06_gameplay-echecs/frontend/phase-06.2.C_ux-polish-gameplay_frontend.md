# Phase 6.2.C - UX Polish Gameplay - Documentation Frontend

**Date de création** : 06 janvier 2026  
**Dernière mise à jour** : 07 janvier 2026  
**Statut** : ✅ Complété (⚠️ Technical Debt documenté)

---

## 📋 Vue d'ensemble

La **Phase 6.2.C "UX Polish Gameplay"** vise à améliorer l'expérience utilisateur du gameplay via des modals React accessibles, en remplaçant les dialogs natifs (`window.confirm`, `window.prompt`, `window.alert`) par des composants React cohérents et accessibles.

**⚠️ Important** : Cette phase se concentre uniquement sur l'**amélioration UX** et la **clarification des CTA**. Aucune modification de la logique métier backend n'est prévue.

---

## 🎯 Objectifs

### Objectifs Phase 6.2.C

- ✅ Remplacer `window.confirm()` par un modal React pour la résignation
- ✅ Remplacer `window.prompt()` par un modal React pour la promotion de pion
- 🔄 Améliorer les modals/banners d'erreurs UX (si nécessaire)
- 🔄 Clarifier les CTA et feedback utilisateur après fin de match
- ✅ Garantir une accessibilité clavier minimale (ESC, focus trap)
- ✅ Assurer la cohérence visuelle avec le reste de l'application

### Contraintes

- ✅ **Aucun changement backend** : Les modals sont purement UI
- ✅ **Pas de nouvelles fonctionnalités métier** : Seulement amélioration UX
- ✅ **TypeScript strict** : Pas de `any`, typage complet
- ✅ **Pas de nouvelles dépendances** : Utiliser uniquement React et Tailwind existants
- ✅ **Accessibilité minimale** : ESC, focus trap, ARIA de base

---

## 🏗️ Scope

### Modals Concernés

#### 1. Modal de Résignation (Confirmation)

**État actuel** : `window.confirm()` double confirmation

**Objectif** :
- Modal React avec titre "Confirmer l'abandon"
- Message clair : "Êtes-vous sûr de vouloir abandonner ce match ?"
- Boutons : "Annuler" (gris) et "Confirmer" (rouge/danger)
- État de chargement pendant l'appel API ("Envoi...")
- Gestion d'erreur : Modal reste ouvert si erreur, affichage error-banner

**Statut** : ✅ Implémenté (Phase 6.2.C)

#### 2. Modal de Promotion (Choix de Pièce)

**État actuel** : `window.prompt()` remplacé par modal React

**Implémentation** :
- Modal React avec titre "Choisir une pièce"
- Texte : "Sélectionnez la pièce pour la promotion."
- 4 boutons clairs : Dame (Q), Tour (R), Fou (B), Cavalier (N)
- Affichage : Lettre (Q/R/B/N) + Label (Dame/Tour/Fou/Cavalier)
- Bouton "Annuler" pour fermer sans jouer
- Choix déclenche `playMove()` avec promotion correcte
- État de chargement : boutons désactivés pendant l'appel API, message "Traitement..."
- Gestion d'erreur : modal reste ouvert si erreur, error-banner affiché
- Sécurité : empêche double-submit, vérifie matchId et match terminé
- Data-testid : `promotion-modal`, `promotion-choice-q|r|b|n`, `promotion-cancel`

**Statut** : ✅ Implémenté (Phase 6.2.C)

**Note** : La promotion n'est pas testée en Playwright (non déterministe sans seed FEN). Test manuel uniquement.

#### 3. Modals / Banners d'Erreurs UX

**État actuel** : Banners inline avec différents niveaux de sévérité

**Objectif** :
- Améliorer la cohérence visuelle des banners d'erreur
- Clarifier les CTA selon le type d'erreur (bloquant vs non bloquant)
- Assurer que tous les messages d'erreur ont un CTA clair

**Statut** : 🔄 À améliorer si nécessaire

#### 4. Modal de Fin de Match (Futur)

**État actuel** : Affichage inline avec boutons de navigation

**Objectif** (si nécessaire) :
- Modal informatif pour les résultats de match
- CTA clairs selon le résultat (vainqueur, perdant, match nul, spectateur)
- Navigation contextuelle vers tournoi ou lobby

**Statut** : 🔄 À évaluer (peut rester inline si UX suffisante)

---

## 🎨 Règles UX

### Principes Généraux

1. **Aucun blocage silencieux** :
   - Tous les modals doivent avoir un CTA clair (Confirmer, Annuler, Fermer)
   - Pas de modal qui se ferme automatiquement sans action utilisateur (sauf cas exceptionnels documentés)

2. **Toujours un CTA clair** :
   - Boutons avec labels explicites (pas de "OK" générique)
   - Variantes visuelles selon l'action (danger pour actions destructives, primary pour actions principales)
   - Bouton secondaire toujours présent pour annuler/fermer

3. **Accessibilité clavier minimale** :
   - Fermeture via `ESC`
   - Focus trap : focus sur le premier élément focusable à l'ouverture
   - Navigation clavier entre les boutons (Tab/Shift+Tab)
   - Activation via `Enter` sur le bouton focusé

4. **Cohérence visuelle** :
   - Utilisation de Tailwind CSS existant
   - Respect du design system de l'application
   - Animations minimales (transitions douces, pas d'animations complexes)

5. **Gestion d'état** :
   - État de chargement pendant les appels API (boutons désactivés, message "Envoi...")
   - Gestion d'erreur : Modal reste ouvert si erreur, affichage error-banner
   - Fermeture automatique uniquement après succès

---

## 🧪 Stratégie de Test

### Vérification Manuelle Locale

**Approche principale** : Les modals sont testés **manuellement** lors de leur implémentation.

**Checklist manuelle** :
- [ ] Modal s'ouvre correctement
- [ ] Fermeture via ESC fonctionne
- [ ] Focus trap fonctionne (focus sur premier bouton à l'ouverture)
- [ ] Navigation clavier (Tab/Shift+Tab) fonctionne
- [ ] Activation via Enter fonctionne
- [ ] Boutons ont les bonnes variantes visuelles (danger/primary/secondary)
- [ ] État de chargement s'affiche pendant l'appel API
- [ ] Gestion d'erreur : Modal reste ouvert, error-banner affiché
- [ ] Fermeture automatique après succès

### Tests E2E Possibles (Optionnel)

**Critères pour ajouter des tests E2E** :
- Le comportement est **stable** et **non temporel**
- La complexité est **justifiée** (ex: modal de promotion si stable)
- Le test apporte de la **valeur** (détecte des régressions)

**Exemples de tests E2E possibles** :
- Affichage du modal de résignation (vérifier que `resign-modal` est visible)
- Fermeture du modal via bouton Annuler (vérifier que le modal se ferme)
- Confirmation de résignation (vérifier que le statut passe à FINISHED)

**Note** : Les tests E2E de promotion UI ne sont pas prioritaires (non déterministe sans seed FEN). Voir Phase 6.2.B - Limitations connues.

---

## ✅ Definition of Done (DoD)

### Critères de Complétion

1. **Composants Modals** :
   - [ ] Composant `Modal` de base réutilisable créé
   - [ ] Composant `ResignModal` créé et intégré
   - [ ] Composant `PromotionModal` créé et intégré
   - [ ] Tous les modals utilisent le composant de base `Modal`

2. **Intégration** :
   - [ ] `window.confirm()` remplacé par `ResignModal` dans `/matches/[id].tsx`
   - [ ] `window.prompt()` remplacé par `PromotionModal` dans `/matches/[id].tsx`
   - [ ] Aucune utilisation de `window.confirm`, `window.prompt`, `window.alert` restante

3. **Accessibilité** :
   - [ ] Fermeture via ESC fonctionne sur tous les modals
   - [ ] Focus trap fonctionne (focus sur premier élément focusable)
   - [ ] Navigation clavier fonctionne (Tab/Shift+Tab)
   - [ ] Activation via Enter fonctionne
   - [ ] Attributs ARIA de base présents (`role="dialog"`, `aria-modal="true"`)

4. **UX** :
   - [ ] Tous les modals ont un CTA clair
   - [ ] Variantes visuelles correctes (danger/primary/secondary)
   - [ ] État de chargement affiché pendant les appels API
   - [ ] Gestion d'erreur : Modal reste ouvert, error-banner affiché
   - [ ] Fermeture automatique après succès

5. **Tests** :
   - [ ] Vérification manuelle complète (checklist ci-dessus)
   - [ ] Tests E2E ajoutés si justifiés (optionnel)

6. **Documentation** :
   - [ ] Commentaires "Manual test plan" ajoutés dans le code
   - [ ] Documentation mise à jour (ce fichier)
   - [ ] README E2E mis à jour si tests E2E ajoutés

---

## 📁 Structure des Fichiers

### Fichiers Créés/Modifiés

```
frontend/
├── components/
│   └── ui/
│       ├── Modal.tsx              # Composant de base réutilisable
│       ├── ResignModal.tsx        # Modal de résignation
│       └── PromotionModal.tsx     # Modal de promotion
└── pages/
    └── matches/
        └── [id].tsx               # Intégration des modals
```

### Composants

#### `Modal.tsx` (Base)

**Props** :
- `isOpen: boolean`
- `title: string`
- `children: ReactNode`
- `onClose: () => void`
- `closeOnOverlayClick?: boolean` (défaut: `true`)

**Fonctionnalités** :
- Overlay semi-transparent
- Fermeture via ESC
- Fermeture via overlay click (optionnel)
- Focus trap (focus sur premier élément focusable)
- Empêche le scroll du body quand ouvert
- Attributs ARIA de base

#### `ResignModal.tsx`

**Props** :
- `isOpen: boolean`
- `onConfirm: () => void`
- `onCancel: () => void`
- `isSubmitting?: boolean` (état de chargement)

**Fonctionnalités** :
- Utilise `Modal` de base
- Bouton "Confirmer" (rouge/danger)
- Bouton "Annuler" (gris)
- État de chargement : boutons désactivés, message "Envoi..."
- `closeOnOverlayClick={false}` pendant l'envoi

#### `PromotionModal.tsx`

**Props** :
- `isOpen: boolean`
- `onChoose: (promotion: 'q' | 'r' | 'b' | 'n') => void`
- `onCancel: () => void`
- `isSubmitting?: boolean` (état de chargement pendant l'appel API)

**Fonctionnalités** :
- Utilise `Modal` de base
- Titre : "Choisir une pièce"
- Texte : "Sélectionnez la pièce pour la promotion."
- 4 boutons pour les choix : Dame (Q), Tour (R), Fou (B), Cavalier (N)
- Bouton "Annuler" pour fermer sans jouer
- État de chargement : boutons désactivés, message "Traitement..."
- `closeOnOverlayClick={false}` pendant l'envoi (choix obligatoire sinon)
- Data-testid : `promotion-modal`, `promotion-choice-q|r|b|n`, `promotion-cancel`

---

## 🧪 Tests

### Tests Manuels

**Plan de test manuel** (à suivre pour chaque modal) :

1. **Résignation** :
   - [ ] Cliquer sur "Abandonner" → Modal s'ouvre
   - [ ] Cliquer sur "Annuler" → Modal se ferme, match continue
   - [ ] Cliquer sur "Confirmer" → État "Envoi..." affiché, boutons désactivés
   - [ ] Après succès → Modal se ferme, statut FINISHED
   - [ ] En cas d'erreur → Modal reste ouvert, error-banner affiché

2. **Promotion** :
   - [ ] Faire avancer un pion jusqu'à la dernière rangée → Modal s'ouvre automatiquement
   - [ ] Choisir une pièce (ex: Dame/Q) → État "Traitement..." affiché, boutons désactivés
   - [ ] Après succès → Modal se ferme, coup joué avec promotion, historique SAN mis à jour
   - [ ] Cliquer sur "Annuler" → Modal se ferme, coup non joué
   - [ ] Tester les 4 choix : Q, R, B, N
   - [ ] En cas d'erreur → Modal reste ouvert, error-banner affiché, boutons réactivés

3. **Accessibilité** :
   - [ ] Fermeture via ESC fonctionne
   - [ ] Focus trap fonctionne (focus sur premier bouton)
   - [ ] Navigation clavier (Tab/Shift+Tab) fonctionne
   - [ ] Activation via Enter fonctionne

### Tests E2E (Optionnel)

**Si tests E2E ajoutés** :
- Utiliser `data-testid` pour sélecteurs stables
- Vérifier l'affichage des modals (`expect(modal).toBeVisible()`)
- Vérifier la fermeture des modals (`expect(modal).not.toBeVisible()`)
- Vérifier les interactions (clic sur boutons)

**Note** : Les tests E2E de promotion UI ne sont pas prioritaires (voir Phase 6.2.B - Limitations connues).

---

## ⚠️ Points d'Attention

1. **Pas de logique métier** :
   - Les modals sont purement UI
   - La logique métier reste dans `/matches/[id].tsx`
   - Les modals appellent simplement les callbacks fournis

2. **Gestion d'état** :
   - État de chargement géré dans le composant parent
   - Gestion d'erreur via error-banner existant
   - Pas de state local complexe dans les modals

3. **Accessibilité** :
   - Focus trap simple (focus sur premier élément focusable)
   - Pas de librairie externe pour l'accessibilité (garder minimal)
   - Attributs ARIA de base suffisants

4. **Performance** :
   - Pas de re-render inutile
   - Utiliser `useCallback` pour les handlers si nécessaire
   - Modals légers (pas d'animations complexes)

---

## 📚 Références

### Documentation Connexe

- [Phase 6.2.B - Tests UI E2E](./phase-06.2.B_ui-e2e-tests_frontend.md)  
  Tests E2E existants et limitations connues
- [Phase 6.1.B - Gameplay UX Completion](./phase-06.1.B_gameplay-ux-completion_frontend.md)  
  Améliorations UX précédentes : timer, états UI, erreurs
- [Phase 6.2.A - UX Clarity Gameplay](./phase-06.2.A_ux-clarity-gameplay_frontend.md)  
  Historique des coups et highlight dernier coup

### Documentation Externe

- [React Modal Patterns](https://react.dev/learn/escape-hatches)
- [ARIA Dialog Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

## 📊 Récapitulatif

| Fonctionnalité | Composant | Statut |
|----------------|-----------|--------|
| Modal de base réutilisable | `Modal.tsx` | ✅ Implémenté |
| Modal de résignation | `ResignModal.tsx` | ✅ Implémenté |
| Modal de promotion | `PromotionModal.tsx` | ✅ Implémenté |
| Remplacement `window.confirm()` | `/matches/[id].tsx` | ✅ Implémenté |
| Remplacement `window.prompt()` | `/matches/[id].tsx` | ✅ Implémenté |
| Modals/banners d'erreurs UX | À améliorer si nécessaire | 🔄 À évaluer |
| Modal de fin de match | À évaluer | 🔄 À évaluer |

---

**Statut final** : ✅ **Complété**

### Implémentations Réalisées

- ✅ Composant `Modal` de base réutilisable
- ✅ Composant `ResignModal` pour remplacer `window.confirm()`
- ✅ Composant `PromotionModal` pour remplacer `window.prompt()`
- ✅ Intégration dans `/matches/[id].tsx`
- ✅ Accessibilité clavier minimale (ESC, focus trap)
- ✅ Gestion d'état (chargement, erreur)
- ✅ Sécurité (empêche double-submit, vérifie matchId/match terminé)
- ✅ Data-testid pour debug manuel
- ✅ Tests manuels complets
- ✅ `window.prompt()` supprimé pour promotion

### Améliorations Futures (Optionnel)

- 🔄 Modals/banners d'erreurs UX améliorés (si nécessaire)
- 🔄 Modal de fin de match (si UX inline insuffisante)
- 🔄 Tests E2E pour modals (si justifiés)

---

## ⚠️ Known Issues / Technical Debt

### Overlay Legacy react-chessboard - Masquage CSS Provisoire

**Symptôme** :  
L'overlay de promotion interne de `react-chessboard` (v4.7.2) peut apparaître ou clignoter brièvement avant l'affichage du `PromotionModal` React, malgré `promotionToSquare={null}` et `return false` dans `handlePieceDrop`.

**Contournement actuel** :  
Un override CSS global dans `frontend/styles/globals.css` masque l'overlay legacy via des sélecteurs génériques :

```css
/* Phase 6.2.C — Disable react-chessboard legacy promotion overlay (CSS override) */
.promotion,
[class*="promotion"],
[data-promotion],
[data-promotion-square],
.promotion-dialog,
.promotion-menu,
.promotion-overlay {
  display: none !important;
  pointer-events: none !important;
  visibility: hidden !important;
}
```

**Risques identifiés** :
- **Sélecteurs trop larges** : Les sélecteurs génériques (`[class*="promotion"]`) peuvent masquer accidentellement d'autres éléments contenant "promotion" dans leur classe CSS
- **Pas de scope** : L'override est global, pas scoppé au conteneur du chessboard
- **Sélecteur exact manquant** : Un TODO existe pour remplacer les sélecteurs génériques par un sélecteur précis une fois le DOM de l'overlay identifié

**État actuel** :
- ✅ Override CSS conservé et documenté
- ✅ TODO présent dans le code pour capture du sélecteur exact
- ⚠️ MutationObserver de diagnostic présent dans `/matches/[id].tsx` (développement uniquement)
- ⚠️ Sélecteur exact non encore identifié

**Plan de reprise** (voir section "Next Steps" ci-dessous) :
1. Capturer le DOM exact de l'overlay legacy via MutationObserver
2. Identifier le sélecteur CSS précis (classe, ID, attributs)
3. Remplacer les sélecteurs génériques par un sélecteur scopé au conteneur `[data-testid="chessboard"]`
4. Tester que seul l'overlay legacy est masqué (pas d'effets de bord)
5. Optionnel : Évaluer un upgrade/patch de `react-chessboard` si disponible

**Références** :
- Fichier CSS : `frontend/styles/globals.css` (section "Phase 6.2.C")
- MutationObserver : `frontend/pages/matches/[id].tsx` (lignes 215-312, développement uniquement)
- Logique promotion : `frontend/pages/matches/[id].tsx` (`handlePieceDrop`, `PromotionModal`)

---

## 🔄 Next Steps - Plan de Reprise

### 1. Capture du Sélecteur Exact (Priorité Haute)

**Objectif** : Identifier le sélecteur CSS précis de l'overlay legacy pour remplacer les sélecteurs génériques.

**Actions** :
- [ ] Déclencher une promotion en développement
- [ ] Vérifier les logs "LEGACY PROMOTION OVERLAY DETECTED" dans la console F12
- [ ] Copier le "Suggested CSS selector" ou créer un sélecteur plus précis
- [ ] Inspecter l'élément dans DevTools pour confirmer les classes/attributs exacts
- [ ] Documenter le sélecteur exact dans un commentaire

**Livrable** : Sélecteur CSS précis documenté dans `globals.css`

### 2. Remplacement des Sélecteurs Génériques (Priorité Moyenne)

**Objectif** : Remplacer les sélecteurs génériques par un sélecteur scopé et précis.

**Actions** :
- [ ] Ouvrir `frontend/styles/globals.css`
- [ ] Décommenter la section "Sélecteur exact" (lignes 36-50)
- [ ] Remplacer `SELECTEUR_EXACT_OVERLAY` par le sélecteur identifié
- [ ] Scoper le sélecteur au conteneur : `[data-testid="chessboard"] SELECTEUR_EXACT`
- [ ] Tester que seul l'overlay legacy est masqué (pas d'effets de bord)
- [ ] Retirer les sélecteurs génériques si le sélecteur exact suffit

**Livrable** : CSS override précis et scopé, sélecteurs génériques retirés si possible

### 3. Validation et Tests (Priorité Moyenne)

**Objectif** : Valider que le masquage CSS fonctionne correctement sans effets de bord.

**Actions** :
- [ ] Tester une promotion : seul le `PromotionModal` React doit apparaître
- [ ] Vérifier qu'aucun autre élément contenant "promotion" n'est masqué accidentellement
- [ ] Tester les coups non-promotion : aucun impact visuel
- [ ] Vérifier en production (si applicable) : pas de régression

**Livrable** : Validation manuelle complète, aucun effet de bord détecté

### 4. Nettoyage (Priorité Basse)

**Objectif** : Retirer le MutationObserver de diagnostic après validation.

**Actions** :
- [ ] Confirmer que le sélecteur exact fonctionne
- [ ] Retirer le `useEffect` MutationObserver de `/matches/[id].tsx` (lignes 215-312)
- [ ] Mettre à jour les commentaires si nécessaire

**Livrable** : Code nettoyé, MutationObserver retiré

### 5. Évaluation Upgrade react-chessboard (Optionnel, Priorité Basse)

**Objectif** : Évaluer si un upgrade ou patch de `react-chessboard` résout le problème à la source.

**Actions** :
- [ ] Vérifier les versions récentes de `react-chessboard` (actuellement v4.7.2)
- [ ] Rechercher des issues GitHub/forums concernant l'overlay de promotion
- [ ] Évaluer la compatibilité d'un upgrade avec le code existant
- [ ] Tester une version plus récente si disponible et compatible
- [ ] Documenter la décision (upgrade ou maintien de l'override CSS)

**Livrable** : Décision documentée (upgrade ou maintien de l'override)

---

**Note** : Ce plan de reprise est **non bloquant** pour la Phase 6.2.C. L'override CSS actuel est fonctionnel et documenté. La reprise peut être effectuée lors d'une phase de maintenance ou d'amélioration continue.

