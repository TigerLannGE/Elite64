# Phase 6.1.B - Gameplay UX Completion - Documentation Frontend

**Date de création** : 03 janvier 2026  
**Dernière mise à jour** : 06 janvier 2026 (Fix timer - logique snapshot + countdown)  
**Statut** : ✅ Complété

---

## 📋 Vue d'ensemble

La **Phase 6.1.B "Gameplay UX Completion"** complète la Phase 6.1 MVP en ajoutant les améliorations UX essentielles pour une expérience de jeu fluide et informative. Cette phase ajoute :

- ✅ États UI pour DRAW et TIEBREAK_PENDING avec affichage conditionnel
- ✅ Mapping des codes d'erreur backend vers messages UX en français avec severity et isExpected
- ✅ Affichage contextuel des erreurs (bloquant, non bloquant, discret)
- ✅ Timer client-side animé synchronisé sur `serverTimeUtc`
- ✅ Polling robuste avec retry/backoff exponentiel et indicateur de connexion
- ✅ Navigation contextuelle après match terminé (vainqueur/perdant/match nul/spectateur)
- ✅ Structure de fichiers modulaire avec petits helpers réutilisables

**⚠️ Important** : Cette phase est un **refactor minimal** - pas de changement backend, pas de WebSocket, pas de nouvelles dépendances. Focus sur l'amélioration de l'UX existante.

---

## 🎯 Objectifs

### Objectifs Phase 6.1.B

- ✅ Implémenter les états UI DRAW et TIEBREAK_PENDING avec affichage conditionnel
- ✅ Mapper tous les codes d'erreur backend vers messages UX clairs en français avec severity et isExpected
- ✅ Implémenter l'affichage contextuel des erreurs (bloquant, non bloquant, discret)
- ✅ Créer un timer client-side animé synchronisé sur `serverTimeUtc`
- ✅ Améliorer la robustesse du polling avec retry/backoff exponentiel
- ✅ Ajouter un indicateur de connexion visible pour l'utilisateur
- ✅ Implémenter la navigation contextuelle après match terminé
- ✅ Organiser le code en petits helpers réutilisables (pas de nouvelles libs)

### Contraintes

- ❌ Pas de modifications backend
- ❌ Pas de WebSocket
- ❌ TypeScript strict (pas de `any`)
- ❌ Pas de nouvelles dépendances

---

## 🏗️ Structure des Fichiers

### Fichiers créés

```
frontend/
├── lib/
│   └── match-error-mapper.ts          # Mapping codes erreur → messages UX
├── utils/
│   ├── match-status.ts                # Helpers état UI (DRAW, TIEBREAK_PENDING)
│   └── match-timer.ts                 # Hook timer client-side synchronisé
├── hooks/
│   └── useMatchPolling.ts             # Hook polling robuste avec retry/backoff
└── components/
    └── MatchConnectionIndicator.tsx   # Indicateur de connexion
```

### Fichiers modifiés

```
frontend/
└── pages/
    └── matches/
        └── [id].tsx                   # Intégration des nouveaux helpers
```

---

## 💻 Implémentation

### 1. Mapping des erreurs (`match-error-mapper.ts`)

**Fichier** : `frontend/lib/match-error-mapper.ts`

Centralise le mapping des codes d'erreur backend vers des messages UX structurés en français.

**Fonction principale** : `mapMatchApiError(err: unknown): MatchErrorInfo`

**Type de retour** :
```typescript
interface MatchErrorInfo {
  title: string
  message: string
  severity: 'info' | 'warning' | 'danger'
  isExpected: boolean
}
```

**Codes mappés avec severity et isExpected** :
- `ILLEGAL_MOVE` → warning, isExpected: true → "Coup invalide"
- `NOT_YOUR_TURN` → info, isExpected: true → "Ce n'est pas votre tour"
- `DRAW_NOT_ALLOWED` → warning, isExpected: true → "Match nul non autorisé"
- `MATCH_NOT_RUNNING` → warning, isExpected: false → "Match non disponible"
- `PLAYER_NOT_IN_MATCH` → danger, isExpected: false → "Accès refusé" (bloquant)
- `MATCH_NOT_JOINABLE` → danger, isExpected: false → "Match non joignable" (bloquant)

**Gestion des erreurs** :
- Erreurs réseau → warning, "Connexion instable, tentative de reconnexion…"
- Erreurs 5xx → danger, "Erreur serveur"
- Erreurs 4xx avec code → Message spécifique selon le code
- Fallback → warning, "Une erreur est survenue"

**Fonction legacy** : `getMatchErrorMessage()` (dépréciée mais conservée pour compatibilité)

---

### 2. Helpers état UI (`match-status.ts`)

**Fichier** : `frontend/utils/match-status.ts`

Fournit des helpers pour déterminer l'état UI d'un match avec `severity` au lieu de `color` (abstraction UI).

**Fonctions** :
- `isDraw(matchState)` : Vérifie si `result === 'DRAW'`
- `isTieBreakPending(matchState)` : Vérifie si `result === 'DRAW' && resultReason === 'TIEBREAK_PENDING'`
- `isMatchFinished(matchState)` : Vérifie si `status === 'FINISHED' || status === 'CANCELED'`
- `getMatchUiStatus(matchState)` : Retourne `{ key, label, severity: 'info' | 'warning' | 'danger' }`

**Priorité** :
1. `TIEBREAK_PENDING` (priorité sur DRAW)
2. `DRAW` normal
3. Statuts standards (`RUNNING`, `FINISHED`, `CANCELED`, `PENDING`)

---

### 3. Timer client-side synchronisé (`match-timer.ts`)

**Fichier** : `frontend/utils/match-timer.ts`

Hook `useMatchTimer` qui implémente un timer client-side synchronisé sur `serverTimeUtc` avec la logique **"snapshot + countdown"**.

**⚠️ ROOT CAUSE (bug fix 06/01/2026)** :
Le backend ne décrémente pas les temps entre les polls; il renvoie souvent 10:00. L'ancienne logique écrasait les valeurs locales à chaque poll, causant des resets visuels (10:00 → 09:59 → 09:57 → 10:00).

**Solution** : Logique "snapshot + countdown" :
- Stocker un snapshot serveur uniquement quand les valeurs changent vraiment
- Décrémenter localement à partir du snapshot: `displayed = snapshotMs - elapsed`
- Ne jamais écraser le temps local si les valeurs serveur n'ont pas changé
- Recaler uniquement si l'écart > 1500ms pour éviter le jitter

**Invariant** : aucun reset visuel tant que personne ne joue

**Fonctionnalités** :
- **Effet 1 (Synchronisation)** : Gestion du snapshot serveur
  - Dépend UNIQUEMENT des valeurs serveur : `[isRunning, whiteTimeMsRemaining, blackTimeMsRemaining, turn, moveNumber]`
  - Ne dépend PAS des valeurs dérivées locales (`whiteTimeMs`, `blackTimeMs`)
  - Met à jour le snapshot uniquement si :
    - Premier snapshot (initialisation)
    - `whiteTimeMsRemaining` ou `blackTimeMsRemaining` change (diff > 50ms)
    - `turn` change
    - `moveNumber` change (si disponible)
    - Recalage nécessaire (écart > 1500ms entre displayed et serveur)
- **Effet 2 (Countdown)** : Interval de décrémentation
  - Dépend UNIQUEMENT de `[isRunning]`
  - Créé UNE SEULE FOIS tant que `isRunning === true`
  - Lit `snapshotRef.current` à chaque tick (pas de dépendance)
  - Décrémente uniquement le joueur au trait : `displayed = snapshotMs - elapsed`
  - L'autre joueur reste fixe à `snapshotMs`

**Paramètres** :
- `whiteTimeMsRemaining` : Temps restant blanc (millisecondes)
- `blackTimeMsRemaining` : Temps restant noir (millisecondes)
- `serverTimeUtc` : Heure serveur UTC (ISO string)
- `turn` : Tour actuel (WHITE ou BLACK)
- `isRunning` : Si le match est en cours
- `moveNumber` : Numéro de coup (optionnel, pour détecter les changements)

**Retour** :
```typescript
{
  whiteTimeMs: number,  // Temps blanc en ms (affiché)
  blackTimeMs: number   // Temps noir en ms (affiché)
}
```

**Architecture** :
- `snapshotRef` : Snapshot serveur avec `{ whiteMs, blackMs, turn, receivedAtClientMs, moveNumber? }`
- `intervalIdRef` : ID de l'interval actif (évite les duplications)
- `displayedWhiteRef` / `displayedBlackRef` : Valeurs affichées actuelles (pour calcul recalage)
- Pas de dépendances circulaires entre les effets
- Pas de recréation d'interval inutile

---

### 4. Polling robuste (`useMatchPolling.ts`)

**Fichier** : `frontend/hooks/useMatchPolling.ts`

Hook `useMatchPolling` qui implémente un polling robuste avec retry/backoff exponentiel.

**Fonctionnalités** :
- Utilise `setTimeout` récursif (pas `setInterval`) pour un seul timer contrôlé
- Backoff exponentiel : 1s, 2s, 4s, max 8s
- Tracking de `isConnected` et `retryCount`
- Gestion propre du cleanup avec `isMountedRef`

**Logique** :
1. Premier poll après 2 secondes
2. En cas de succès : reset retry count, poll suivant après 2s
3. En cas d'erreur : incrémenter retry count, backoff exponentiel
4. Après 3 échecs consécutifs : marquer comme déconnecté

**Paramètres** :
- `matchId` : ID du match (peut être null)
- `isMatchActive` : Si le match est actif (pas terminé)
- `onUpdate` : Callback appelé avec le nouvel état
- `onError` : Callback optionnel appelé en cas d'erreur

**Retour** :
```typescript
{
  isConnected: boolean,      // État de connexion
  retryCount: number,        // Nombre de tentatives de reconnexion
  lastError: ApiError | null // Dernière erreur
}
```

---

### 5. Indicateur de connexion (`MatchConnectionIndicator.tsx`)

**Fichier** : `frontend/components/MatchConnectionIndicator.tsx`

Composant React qui affiche l'état de connexion du match.

**États** :
- **Connecté** (vert) : `isConnected === true && retryCount === 0`
- **Reconnexion** (jaune) : `isConnected === true && retryCount > 0`
- **Déconnecté** (rouge) : `isConnected === false`

**Affichage** :
- Toujours visible (même si connecté)
- Message dynamique selon l'état
- Affiche le nombre de tentatives si reconnexion

---

### 6. Intégration dans la page match

**Fichier** : `frontend/pages/matches/[id].tsx`

**Modifications** :
- Remplacement du polling manuel par `useMatchPolling`
- Intégration de `useMatchTimer` pour l'affichage du temps
- Utilisation de `mapMatchApiError` pour les erreurs structurées
- Utilisation de `getMatchUiStatus` pour le badge de statut
- Affichage conditionnel pour DRAW et TIEBREAK_PENDING
- Intégration de `MatchConnectionIndicator`
- Affichage contextuel des erreurs (bloquant, non bloquant, discret)
- Navigation contextuelle après match terminé

**Gestion des erreurs** :
- **Erreur bloquante (joinMatch, resignMatch)** : Écran d'erreur avec titre, message et bouton "Retour au lobby" si severity === 'danger'
- **Erreur non bloquante (playMove)** : Banner avec titre, message et bouton × pour fermer
- **Erreur polling (discret)** : Banner jaune discret, affiché uniquement si `!isConnected`

**Navigation après match terminé** :
- **Vainqueur** : "🏆 Retour au tournoi" (vert, prioritaire) + "Retour au lobby" (gris, secondaire)
- **Perdant** : "Retour au tournoi" (bleu, prioritaire) + "Retour au lobby" (gris, secondaire)
- **Match nul** : Les deux boutons côte à côte (vert et bleu, même taille)
- **Spectateur** : Les deux boutons côte à côte (vert et bleu, même taille)

**Lignes clés** :
- Lignes 65-66 : States pour erreurs (`error`, `moveError`, `pollingError`)
- Lignes 107-120 : `useMatchPolling` avec gestion d'erreurs
- Lignes 211-218 : `useMatchTimer` avec synchronisation
- Lignes 454-489 : Affichage erreur bloquante
- Lignes 482-536 : Affichage erreur non bloquante et polling
- Lignes 727-800 : Navigation contextuelle après match terminé

---

## 🎨 Interface Utilisateur

### Badge de statut

Affiché dans le header de la page match avec couleur selon `severity` :
- `info` → Badge bleu (`bg-blue-100 text-blue-800`)
- `warning` → Badge jaune (`bg-yellow-100 text-yellow-800`)
- `danger` → Badge rouge (`bg-red-100 text-red-800`)

### Timer

Affichage formaté `mm:ss` avec :
- Couleur rouge pour le joueur actif
- Animation pulse si temps écoulé
- Couleur grise pour le joueur passif

### Indicateur de connexion

Affiché au-dessus de l'échiquier avec :
- Fond coloré selon l'état (vert/jaune/rouge)
- Message explicite de l'état
- Nombre de tentatives si reconnexion

### États DRAW et TIEBREAK_PENDING

**TIEBREAK_PENDING** :
- Badge jaune "Match nul - Tie-break en attente"
- Bloc jaune avec message explicatif
- CTA "Retour au tournoi" pour voir le tie-break

**DRAW normal** :
- Badge jaune "Match nul"
- Affichage de `resultReason` (ex: "INSUFFICIENT_MATERIAL")
- Pas de bloc spécial (juste le badge)

### Affichage des erreurs

**Erreur bloquante (joinMatch, resignMatch)** :
- Écran d'erreur avec titre et message
- Couleurs selon severity :
  - `danger` → Rouge (`bg-red-50`, `text-red-800`)
  - `warning` → Orange (`bg-orange-50`, `text-orange-800`)
  - `info` → Bleu (`bg-blue-50`, `text-blue-800`)
- Bouton "Retour au lobby" si `severity === 'danger'`
- Pas de bouton × (erreur bloquante)

**Erreur non bloquante (playMove)** :
- Banner avec titre et message
- Bouton × pour fermer
- Couleurs selon severity (rouge/orange/bleu)
- L'échiquier reste utilisable

**Erreur polling (discret)** :
- Banner jaune discret (`bg-yellow-50`, `text-yellow-800`)
- Affiché uniquement si `!isConnected`
- Message : "Connexion instable, tentative de reconnexion…"
- Disparaît automatiquement quand la connexion est rétablie
- Pas de spam, pas d'alert()

### Navigation après match terminé

**Vainqueur** :
- Bouton principal : "🏆 Retour au tournoi" (vert, `bg-green-600`)
- Bouton secondaire : "Retour au lobby" (gris, `bg-gray-400`, plus petit)

**Perdant** :
- Bouton principal : "Retour au tournoi" (bleu, `bg-blue-600`)
- Bouton secondaire : "Retour au lobby" (gris, `bg-gray-400`, plus petit)

**Match nul / Spectateur** :
- Les deux boutons côte à côte (même taille)
- "Retour au tournoi" (vert) + "Retour au lobby" (bleu)

---

## 🧪 Tests

### Vérification manuelle

1. **Timer (fix 06/01/2026)** :
   - **Observer 30s sans jouer** : Le timer doit descendre régulièrement (10:00 → 09:30) sans jamais remonter à 10:00
   - **Jouer un coup** : Le snapshot change, le décrément bascule sur l'autre camp sans saut
   - **Laisser l'adversaire** : Son timer descend sans reset malgré les polls (logs "Skipping update" dans la console)
   - **Vérifier les logs** :
     - `[TIMER SNAPSHOT] Skipping update (no change)` à chaque poll si les valeurs n'ont pas changé
     - `[TIMER] Interval started` une seule fois quand `isRunning === true`
     - Pas de `[TIMER SNAPSHOT] Updating snapshot` tant que personne ne joue

2. **Polling** :
   - Ouvrir un match en cours
   - Couper temporairement la connexion réseau
   - Vérifier que l'indicateur passe en "Déconnecté"
   - Rétablir la connexion et vérifier la reconnexion automatique

3. **États DRAW/TIEBREAK_PENDING** :
   - Créer un match qui se termine en DRAW
   - Vérifier l'affichage du badge "Match nul"
   - Si tie-break : vérifier le bloc avec CTA "Retour au tournoi"

4. **Erreurs** :
   - **Erreur bloquante** : Essayer d'accéder à un match où vous n'êtes pas participant
     - Résultat attendu : Écran d'erreur rouge avec titre "Accès refusé" et bouton "Retour au lobby"
   - **Erreur non bloquante** : Jouer un coup invalide
     - Résultat attendu : Banner orange avec titre "Coup invalide" et bouton ×
     - Vérifier que l'échiquier reste utilisable
   - **Erreur attendue (info)** : Essayer de jouer quand ce n'est pas votre tour
     - Résultat attendu : Banner bleu informatif (si possible à déclencher)
   - **Erreur polling** : Couper temporairement la connexion réseau
     - Résultat attendu : Banner jaune discret, pas de spam, pas d'alert()
     - Vérifier que le banner disparaît quand la connexion est rétablie

5. **Navigation après match terminé** :
   - **Vainqueur** : Vérifier bouton vert "🏆 Retour au tournoi" (prioritaire) + bouton gris "Retour au lobby" (secondaire)
   - **Perdant** : Vérifier bouton bleu "Retour au tournoi" (prioritaire) + bouton gris "Retour au lobby" (secondaire)
   - **Match nul** : Vérifier les deux boutons côte à côte (vert et bleu)
   - **Spectateur** : Vérifier les deux boutons côte à côte (vert et bleu)

---

## ⚠️ Points d'Attention

1. **Timer synchronisation (fix 06/01/2026)** :
   - **Logique "snapshot + countdown"** : Le snapshot n'est mis à jour que si les valeurs serveur changent vraiment
   - **Invariant garanti** : Aucun reset visuel tant que personne ne joue
   - **Deux effets isolés** :
     - Effet 1 : Gestion snapshot (dépend uniquement des valeurs serveur)
     - Effet 2 : Interval countdown (dépend uniquement de `isRunning`)
   - **Pas de dépendances circulaires** : Les effets sont complètement isolés
   - **Un seul interval actif** : Vérification avant création pour éviter les duplications
   - **Recalage intelligent** : Seulement si écart > 1500ms (évite le jitter)

2. **Polling backoff** :
   - Le backoff est exponentiel avec un maximum de 8 secondes
   - Après 3 échecs consécutifs, le statut passe en "Déconnecté"
   - La reconnexion est automatique dès qu'un poll réussit

3. **États UI** :
   - `TIEBREAK_PENDING` a la priorité sur `DRAW`
   - Le composant décide comment rendre la `severity` (couleur, badge, etc.)
   - Les messages d'erreur sont toujours en français

4. **Erreurs attendues vs non attendues** :
   - Les erreurs `isExpected: true` (ILLEGAL_MOVE, NOT_YOUR_TURN) sont affichées de manière informative
   - Les erreurs `isExpected: false` (PLAYER_NOT_IN_MATCH) sont affichées de manière plus alarmante
   - Les erreurs bloquantes n'ont pas de bouton ×, seulement "Retour au lobby" si nécessaire

5. **Navigation contextuelle** :
   - Le vainqueur et le perdant peuvent retourner directement au tournoi
   - Le lobby reste accessible discrètement pour tous
   - Les boutons sont adaptés selon le contexte (vainqueur/perdant/match nul/spectateur)

---

## 📚 Références

### Documentation Connexe

- [Phase 6.1 - Frontend Gameplay MVP](./phase-06.1_frontend-gameplay_frontend.md)  
  Phase MVP de base avec échiquier et gameplay
- [Phase 6.0.C - Orchestration Gameplay](../cross/phase-06.0.C_gameplay-orchestration_cross.md)  
  Backend gameplay avec endpoints et DTOs
- [Phase 6.2 - Tests E2E Gameplay](../cross/phase-06.2_e2e-gameplay-tests_cross.md)  
  Tests End-to-End complets

### Documentation Externe

- [React Hooks Documentation](https://react.dev/reference/react)
- [Next.js Pages Router](https://nextjs.org/docs/pages/building-your-application)

---

## 📊 Récapitulatif

| Fonctionnalité | Fichier | Statut |
|----------------|---------|--------|
| Mapping erreurs structuré | `match-error-mapper.ts` | ✅ |
| Affichage erreurs contextuel | `pages/matches/[id].tsx` | ✅ |
| Helpers état UI | `match-status.ts` | ✅ |
| Timer synchronisé | `match-timer.ts` | ✅ |
| Polling robuste | `useMatchPolling.ts` | ✅ |
| Indicateur connexion | `MatchConnectionIndicator.tsx` | ✅ |
| Navigation contextuelle | `pages/matches/[id].tsx` | ✅ |
| Intégration page match | `pages/matches/[id].tsx` | ✅ |

---

**Statut final** : ✅ **100% complété**

