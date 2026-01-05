# BLOC 6.1 — Diagnostic technique (lecture seule)

**Date** : 2025-01-15  
**Statut** : ✅ Complété  
**Portée** : Diagnostic pour préparation BLOC 6.2

---

## 1) Résumé exécutif

### Constats P0 (critiques)

1. **Modèle économique 9.75%** : Le système prélève déjà **9.75%** indirectement via un mécanisme en deux étapes (5% commission + 5% retenu sur redistribution), mais ce n'est **pas explicite** dans le code. Le modèle documenté (5% + 4.75%) n'est pas implémenté comme tel.

2. **Occurrences "ChessBet"** : **321 occurrences** trouvées dans le codebase, dont **~50 occurrences publiques** (frontend pages, titres, emails) qui violent l'Arbitrage 01 du document 00. Correction obligatoire avant lancement.

### Constats P1 (non bloquants)

3. **Support email contact@elite64.app** : **Absent** du frontend et du backend. Le backend utilise `ChessBet <no-reply@chessbet.com>` comme fallback. Aucune configuration pour l'email de support officiel.

### Blocages / inconnues

- Aucun blocage identifié. Tous les diagnostics sont traçables et documentés.

---

## 2) Diagnostic A — Modèle économique 9.75%

### 2.1 État réel constaté

**Conclusion** : Le système prélève déjà **9.75%** indirectement, mais via un mécanisme différent de celui documenté.

**Mécanisme actuel** :
- **5%** de commission directe sur le total des buy-ins
- **5%** retenu sur la redistribution (95% redistribué, 5% retenu)
- **Prélèvement total effectif** : 5% + (5% de 95%) = **5% + 4.75% = 9.75%**

**Mécanisme documenté** (document 00, Arbitrage A) :
- **5.00%** commission plateforme
- **4.75%** frais de tournoi
- **Prélèvement total** : **9.75%**

**Écart** : Le prélèvement total est identique (9.75%), mais la décomposition n'est pas explicite dans le code. Le code utilise un mécanisme de "redistribution" plutôt qu'un prélèvement direct de 4.75%.

### 2.2 Chemins d'exécution (avec fichiers + lignes)

#### Chemin 1 : Inscription au tournoi → Débit wallet

```
1. frontend/pages/tournaments/[id].tsx
   → Appel API POST /tournaments/:id/join

2. backend/src/modules/tournaments/tournaments.controller.ts
   → Route POST /tournaments/:id/join
   → Appel tournamentsService.joinTournament()

3. backend/src/modules/tournaments/tournaments.service.ts:300-405
   → joinTournament(tournamentId, playerId)
   → Ligne 383-388 : Débit du wallet via transactionsService.debitWallet()
   → Montant débité : tournament.buyInCents (montant complet du buy-in)
   → Aucun prélèvement à ce stade

4. backend/src/transactions/transactions.service.ts:98-113
   → debitWallet() → createTransactionAndUpdateWallet() avec amountCents négatif
   → Transaction créée : type TOURNAMENT_BUY_IN, montant = -buyInCents
```

**Observation** : Le buy-in complet est débité du wallet. Aucun prélèvement n'est effectué à l'inscription.

#### Chemin 2 : Clôture des inscriptions → Calcul du prize pool

```
1. backend/src/modules/tournaments/tournaments.service.ts:407-500
   → closeRegistrations(tournamentId)
   → Appel prizePoolService.lockPrizePoolForTournament()

2. backend/src/modules/prize-pool/prize-pool.service.ts:83-160
   → lockPrizePoolForTournament(tournamentId)
   → Ligne 109-112 : Calcul via computePrizePool()
   → Ligne 115-156 : Création/mise à jour du PrizePool en DB

3. backend/src/modules/prize-pool/prize-pool.service.ts:28-47
   → computePrizePool(input)
   → Ligne 30 : totalEntriesCents = playersCount * buyInCents
   → Ligne 33 : commissionCents = floor(totalEntriesCents * 0.05) [5%]
   → Ligne 36 : base = totalEntriesCents - commissionCents
   → Ligne 39 : distributableCents = floor(base * 0.95) [95% de redistribution]
```

**Calcul détaillé** (exemple avec 100€ de buy-ins) :
```
totalEntriesCents = 10000 (100€)
commissionCents = floor(10000 * 0.05) = 500 (5€) [5%]
base = 10000 - 500 = 9500 (95€)
distributableCents = floor(9500 * 0.95) = 9025 (90.25€) [95%]
```

**Prélèvement total** :
- Commission directe : 5€ (5%)
- Retenu sur redistribution : 95€ - 90.25€ = 4.75€ (4.75%)
- **Total prélevé** : 5€ + 4.75€ = **9.75€ (9.75%)**

### 2.3 Détail des prélèvements (table)

| Composant | Taux | Calcul | Montant (ex: 100€) | Statut |
|-----------|------|--------|-------------------|--------|
| **Commission plateforme** | 5.00% | `floor(totalEntries * 0.05)` | 5.00€ | ✅ Implémenté (explicite) |
| **Frais de tournoi** | 4.75% | `totalEntries - commission - distributable` | 4.75€ | ⚠️ Implémenté (implicite via REDISTRIBUTION_RATE) |
| **Total prélevé** | 9.75% | Commission + Frais | 9.75€ | ✅ Implémenté (indirectement) |
| **Distributable** | 90.25% | `floor((totalEntries - commission) * 0.95)` | 90.25€ | ✅ Implémenté |

**Constantes utilisées** :
- `COMMISSION_RATE = 0.05` (ligne 6 de `prize-pool.service.ts`)
- `REDISTRIBUTION_RATE = 0.95` (ligne 7 de `prize-pool.service.ts`)

**Note** : Aucune constante `TOURNAMENT_FEE_RATE = 0.0475` n'existe dans le code. Le 4.75% est obtenu indirectement via `(1 - REDISTRIBUTION_RATE) * (1 - COMMISSION_RATE)`.

### 2.4 Hypothèses & vérification

#### Hypothèse 1 : Le 9.75% est-il vraiment prélevé ?

**Vérification** :
- ✅ **Confirmé** : Le calcul mathématique montre que 9.75% est prélevé
- ✅ **Preuve** : `100€ → 5€ commission → 95€ base → 90.25€ distributable → 9.75€ prélevé`

#### Hypothèse 2 : Y a-t-il des frais Stripe supplémentaires ?

**Vérification** :
- ✅ **Aucun frais Stripe dans le calcul du prize pool** : Le code ne mentionne pas Stripe dans `prize-pool.service.ts`
- ✅ **Stripe utilisé uniquement pour dépôts** : Selon le document 04, Stripe n'intervient pas dans la logique de prize pool
- ⚠️ **Frais Stripe sur dépôts** : Non inclus dans le take rate 9.75% (frais PSP séparés, à la charge du joueur lors du dépôt)

#### Hypothèse 3 : Le mécanisme actuel est-il conforme au modèle documenté ?

**Vérification** :
- ⚠️ **Conforme en résultat** : Le prélèvement total est identique (9.75%)
- ❌ **Non conforme en structure** : Le code n'implémente pas explicitement "5% commission + 4.75% frais", mais plutôt "5% commission + 5% retenu sur redistribution"
- ⚠️ **Risque de confusion** : La constante `REDISTRIBUTION_RATE = 0.95` masque le fait que 4.75% sont prélevés comme "frais de tournoi"

### 2.5 Conclusion + risques

**État réel** : ✅ **Implémenté indirectement**

Le système prélève bien **9.75%**, mais via un mécanisme différent :
- **Mécanisme actuel** : 5% commission + 5% retenu sur redistribution = 9.75%
- **Mécanisme documenté** : 5% commission + 4.75% frais = 9.75%

**Risques identifiés** :

1. **Risque de confusion technique** : Le code ne reflète pas explicitement la structure documentée (5% + 4.75%). Un développeur pourrait modifier `REDISTRIBUTION_RATE` sans comprendre qu'il modifie les "frais de tournoi".

2. **Risque de non-conformité documentaire** : Le document 04 mentionne "5% commission + 4.75% frais" comme deux flux distincts, mais le code les traite comme un seul mécanisme (commission + redistribution).

3. **Risque de maintenance** : Si le modèle économique change (ex: 5% + 5% = 10%), il faudra modifier `REDISTRIBUTION_RATE` plutôt qu'une constante `TOURNAMENT_FEE_RATE` explicite.

**Recommandation pour BLOC 6.2** :
- Option A : Refactoriser pour rendre explicite le modèle 5% + 4.75% (créer `TOURNAMENT_FEE_RATE = 0.0475`)
- Option B : Conserver le mécanisme actuel mais documenter clairement que `REDISTRIBUTION_RATE = 0.95` implique 4.75% de frais

---

## 3) Diagnostic B — Occurrences "ChessBet"

### 3.1 Inventaire exhaustif (table fichier/ligne/type)

**Total** : **321 occurrences** trouvées via `grep -i "ChessBet"`

#### Occurrences PUBLIQUES (Frontend - Pages visibles par utilisateurs)

| Fichier | Ligne(s) | Type | Contenu | Priorité |
|---------|----------|------|---------|----------|
| `frontend/pages/index.tsx` | 7 | Titre page | `"ChessBet - Tournois d'échecs..."` | **P0** |
| `frontend/pages/index.tsx` | 88 | Contenu | `"ChessBet organise des **concours de compétence**"` | **P0** |
| `frontend/pages/terms.tsx` | 5 | Titre page | `"Conditions Générales - ChessBet"` | **P0** |
| `frontend/pages/terms.tsx` | 16 | Contenu CGU | `"plateforme ChessBet"` | **P0** |
| `frontend/pages/terms.tsx` | 24 | Contenu CGU | `"ChessBet organise des **concours de compétence**"` | **P0** |
| `frontend/pages/terms.tsx` | 56 | Contenu CGU | `"ChessBet ne peut être tenu responsable"` | **P0** |
| `frontend/pages/terms.tsx` | 64 | Contenu CGU | `"ChessBet se réserve le droit"` | **P0** |
| `frontend/pages/privacy.tsx` | 5 | Titre page | `"Politique de Confidentialité - ChessBet"` | **P0** |
| `frontend/pages/privacy.tsx` | 16 | Contenu | `"ChessBet collecte les données suivantes"` | **P0** |
| `frontend/pages/login.tsx` | 55 | Titre page | `"Connexion - ChessBet"` | **P0** |
| `frontend/pages/register.tsx` | 64, 87 | Titre page | `"Inscription - ChessBet"` | **P0** |
| `frontend/pages/verify-email.tsx` | 36 | Titre page | `"Vérification d'email - ChessBet"` | **P0** |
| `frontend/pages/wallet.tsx` | 137, 146 | Titre page | `"Mon portefeuille - ChessBet"` | **P0** |
| `frontend/pages/tournaments/index.tsx` | 92, 108 | Titre page | `"Tous les tournois - ChessBet"` | **P0** |
| `frontend/pages/tournaments/[id].tsx` | 156, 173, 204, 233 | Titre page | `"... - ChessBet"` | **P0** |

#### Occurrences SEMI-PUBLIQUES (Emails, messages utilisateurs)

| Fichier | Ligne(s) | Type | Contenu | Priorité |
|---------|----------|------|---------|----------|
| `backend/src/mail/mail.service.ts` | 59 | From email | `'ChessBet <no-reply@chessbet.com>'` | **P0** |
| `backend/src/mail/mail.service.ts` | 64 | Subject email | `'Vérifiez votre adresse e-mail - ChessBet'` | **P0** |
| `backend/src/mail/mail.service.ts` | 66 | Contenu email | `'<h1>Bienvenue sur ChessBet !</h1>'` | **P0** |
| `backend/src/mail/mail.service.ts` | 75 | Contenu email | `'Bienvenue sur ChessBet !'` | **P0** |
| `backend/src/mail/mail.service.ts` | 106 | From email | `'ChessBet <no-reply@chessbet.com>'` | **P0** |
| `backend/src/mail/mail.service.ts` | 111 | Subject email | `'Réinitialisation de votre mot de passe - ChessBet'` | **P0** |

#### Occurrences INTERNES (Code, commentaires, variables)

| Fichier | Ligne(s) | Type | Contenu | Priorité |
|---------|----------|------|---------|----------|
| `frontend/package.json` | 2 | Nom package | `"name": "chessbet-frontend"` | **P1** |
| `frontend/package-lock.json` | 2, 8 | Nom package | `"name": "chessbet-frontend"` | **P1** |
| `docs/README.md` | 1 | Titre doc | `"# Documentation ChessBet"` | **P1** |
| `README.md` | 1 | Titre repo | `"# ChessBet"` | **P1** |
| `docs/_maintenance/MAINTENANCE_GUIDE.md` | 1 | Titre doc | `"# Guide de Maintenance - Documentation ChessBet"` | **P1** |
| `docs/_maintenance/COMMANDES_CURSOR.md` | 1 | Titre doc | `"# Commandes Cursor - Documentation ChessBet"` | **P1** |
| `frontend/tests/e2e/smoke.spec.ts` | 15, 27, 39 | Tests | `await expect(page).toHaveTitle(/ChessBet/i)` | **P1** |
| `frontend/tests/e2e/match-seed-example.spec.ts` | 27 | Tests | `await expect(page).toHaveTitle(/ChessBet/i)` | **P1** |
| `frontend/scripts/run-e2e.ps1` | 7 | Variable env | `$env:ADMIN_PASSWORD = "Chessbet24!"` | **P1** |
| `docs/governance/00 - [Chef de projet] - 00.md` | 11 | Référence | `"projet Elite64/ChessBet"` | **P1** (documentaire, contexte) |
| `docs/governance/00 - [Chef de projet] - 00.md` | 112-548 | Mentions | Multiples références dans arbitrages | **P1** (documentaire) |
| `docs/_archives/*.md` | Divers | Archives | Références dans docs obsolètes | **P1** (archives) |
| `docs/_audits/*.md` | Divers | Audits | Références dans rapports d'audit | **P1** (historique) |

**Note** : Les occurrences dans `docs/governance/00` sont **documentaires** et **contextuelles** (elles expliquent l'arbitrage de remplacement). Elles peuvent être conservées ou remplacées selon la politique de documentation.

### 3.2 Classification (Public / Semi-public / Interne)

#### PUBLIC (P0 - Correction immédiate requise)

**~50 occurrences** dans :
- Pages frontend publiques (index, terms, privacy, login, register, etc.)
- Titres de pages (`<title>`)
- Contenu visible par utilisateurs (CGU, descriptions)

**Impact** : Violation directe de l'Arbitrage 01 du document 00. Les utilisateurs voient "ChessBet" au lieu de "Elite64 – Competitive Chess Arena".

#### SEMI-PUBLIQUE (P0 - Correction requise)

**6 occurrences** dans :
- Emails envoyés aux utilisateurs (from, subject, contenu)
- Messages système visibles par utilisateurs

**Impact** : Les utilisateurs reçoivent des emails avec "ChessBet" dans le nom d'expéditeur et le sujet.

#### INTERNE (P1 - Correction recommandée)

**~265 occurrences** dans :
- Noms de packages (`package.json`)
- Documentation technique (README, guides)
- Tests E2E
- Variables d'environnement
- Commentaires de code
- Archives et audits (historique)

**Impact** : Cohérence interne, mais non bloquant pour lancement.

### 3.3 Priorisation pour BLOC 6.2

#### Priorité P0 (Immédiat - Avant lancement)

1. **Pages frontend publiques** (~30 occurrences)
   - `frontend/pages/index.tsx` : Titre + contenu
   - `frontend/pages/terms.tsx` : Titre + contenu CGU (5 occurrences)
   - `frontend/pages/privacy.tsx` : Titre + contenu
   - `frontend/pages/login.tsx`, `register.tsx`, `verify-email.tsx`, `wallet.tsx` : Titres
   - `frontend/pages/tournaments/*.tsx` : Titres

2. **Emails backend** (6 occurrences)
   - `backend/src/mail/mail.service.ts` : From, subject, contenu HTML/text

**Action requise** : Remplacer "ChessBet" par "Elite64 – Competitive Chess Arena" (ou "Elite64" selon contexte).

#### Priorité P1 (Court terme - Après lancement)

3. **Noms de packages** (3 occurrences)
   - `frontend/package.json` : `"name": "chessbet-frontend"` → `"elite64-frontend"`
   - `frontend/package-lock.json` : Mise à jour automatique après modification package.json

4. **Tests E2E** (4 occurrences)
   - `frontend/tests/e2e/smoke.spec.ts` : Titres de pages attendus
   - `frontend/tests/e2e/match-seed-example.spec.ts` : Titre de page attendu

5. **Documentation** (~250 occurrences)
   - `docs/README.md` : Titre
   - `README.md` : Titre repo
   - `docs/_maintenance/*.md` : Titres
   - `docs/governance/00` : Références contextuelles (à évaluer)

**Action requise** : Nettoyage progressif pour cohérence interne.

---

## 4) Diagnostic C — Support email contact@elite64.app

### 4.1 Frontend (affichage)

**État** : ❌ **Absent**

**Recherche effectuée** :
- `grep -i "contact@elite64.app"` : Aucun résultat
- `grep -i "support" frontend/pages/*.tsx` : Aucun email de support affiché

**Pages vérifiées** :
- `frontend/pages/terms.tsx` : Ligne 70-74 — Section "Contact" mentionne "moyens de contact disponibles sur la plateforme" (générique, pas d'email)
- `frontend/pages/privacy.tsx` : Ligne 90-95 — Section "Contact" mentionne "moyens de contact disponibles sur la plateforme" (générique, pas d'email)
- `frontend/pages/index.tsx` : Aucune section contact
- Aucune page `/contact` dédiée

**Conclusion** : L'email `contact@elite64.app` n'est **pas affiché** dans le frontend.

### 4.2 Backend (from/reply-to/provider)

**État** : ❌ **Non configuré**

**Configuration actuelle** :

1. **Service mail** : `backend/src/mail/mail.service.ts`
   - Ligne 59 : `const fromEmail = process.env.SMTP_FROM || 'ChessBet <no-reply@chessbet.com>';`
   - Ligne 106 : `const fromEmail = process.env.SMTP_FROM || 'ChessBet <no-reply@chessbet.com>';`
   - **Fallback** : `ChessBet <no-reply@chessbet.com>` (non conforme)

2. **Variables d'environnement** :
   - `SMTP_FROM` : Non vérifié dans `.env` (fichier non accessible en lecture seule)
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` : Configurés (Infomaniak)

3. **Emails envoyés** :
   - `sendEmailVerificationMail()` : From = `SMTP_FROM` ou fallback `ChessBet <no-reply@chessbet.com>`
   - `sendPasswordResetMail()` : From = `SMTP_FROM` ou fallback `ChessBet <no-reply@chessbet.com>`
   - **Aucun email de support** : Pas de méthode `sendSupportMail()` ou équivalent

**Conclusion** : L'email `contact@elite64.app` n'est **pas configuré** dans le backend.

### 4.3 Écarts & risques

#### Écarts identifiés

| Élément | Document 00 (Arbitrage C) | État réel | Écart |
|---------|---------------------------|-----------|-------|
| **Email support** | `contact@elite64.app` | ❌ Absent | **CRITIQUE** |
| **Affichage frontend** | Pages publiques (CGU, mentions légales) | ❌ Absent | **CRITIQUE** |
| **Configuration backend** | From/reply-to pour emails | ❌ Non configuré | **CRITIQUE** |
| **Emails système** | From = contact@elite64.app | ⚠️ Fallback `ChessBet <no-reply@chessbet.com>` | **MOYEN** |

#### Risques

1. **Risque légal** : Les CGU mentionnent "moyens de contact disponibles sur la plateforme" mais aucun email n'est affiché. Risque de non-conformité avec obligations légales (RGPD, droit de contact).

2. **Risque utilisateur** : Les utilisateurs ne peuvent pas contacter le support par email. Impact sur l'expérience utilisateur et la résolution de problèmes.

3. **Risque branding** : Les emails système utilisent `ChessBet <no-reply@chessbet.com>` au lieu de `Elite64 <contact@elite64.app>`. Incohérence avec la marque publique.

4. **Risque opérationnel** : Aucun canal de support traçable. Difficulté à gérer les demandes utilisateurs.

**Priorité** : **P1** (Non bloquant pour lancement MVP selon document 00, mais recommandé).

---

## 5) Recommandations strictes pour BLOC 6.2

### Liste d'actions P0 (ordre imposé)

#### Action P0-1 : Modèle économique 9.75% — Clarification du code

**Objectif** : Rendre explicite le modèle 5% + 4.75% dans le code.

**Actions** :
1. **Option A (Recommandée)** : Refactoriser `backend/src/modules/prize-pool/prize-pool.service.ts`
   - Créer constante `TOURNAMENT_FEE_RATE = 0.0475` (ligne 7)
   - Modifier `computePrizePool()` pour calculer explicitement :
     - `commissionCents = floor(totalEntriesCents * COMMISSION_RATE)`
     - `tournamentFeeCents = floor(totalEntriesCents * TOURNAMENT_FEE_RATE)`
     - `distributableCents = totalEntriesCents - commissionCents - tournamentFeeCents`
   - Supprimer `REDISTRIBUTION_RATE` (remplacé par calcul explicite)
   - Mettre à jour les commentaires pour refléter le modèle 5% + 4.75%

2. **Option B (Alternative)** : Conserver le mécanisme actuel mais documenter
   - Ajouter commentaire explicite : `// REDISTRIBUTION_RATE = 0.95 implique 4.75% de frais de tournoi (5% de 95%)`
   - Créer constante `TOURNAMENT_FEE_RATE = 1 - REDISTRIBUTION_RATE` pour cohérence
   - Documenter dans le code que le prélèvement total est 9.75% (5% + 4.75%)

**Fichiers à modifier** :
- `backend/src/modules/prize-pool/prize-pool.service.ts` (lignes 5-47)

**Tests requis** :
- Vérifier que le prélèvement total reste 9.75%
- Vérifier que `distributableCents` reste identique après refactoring

---

#### Action P0-2 : Remplacement "ChessBet" → "Elite64" (Pages publiques)

**Objectif** : Éliminer toutes les occurrences publiques de "ChessBet".

**Actions** :
1. **Pages frontend publiques** (~30 occurrences)
   - `frontend/pages/index.tsx` :
     - Ligne 7 : `"ChessBet - Tournois d'échecs..."` → `"Elite64 – Competitive Chess Arena - Tournois d'échecs..."`
     - Ligne 88 : `"ChessBet organise..."` → `"Elite64 organise..."`
   - `frontend/pages/terms.tsx` :
     - Ligne 5 : `"Conditions Générales - ChessBet"` → `"Conditions Générales - Elite64"`
     - Lignes 16, 24, 56, 64 : Remplacer toutes les occurrences "ChessBet" par "Elite64"
   - `frontend/pages/privacy.tsx` :
     - Ligne 5 : `"Politique de Confidentialité - ChessBet"` → `"Politique de Confidentialité - Elite64"`
     - Ligne 16 : `"ChessBet collecte..."` → `"Elite64 collecte..."`
   - `frontend/pages/login.tsx`, `register.tsx`, `verify-email.tsx`, `wallet.tsx`, `tournaments/*.tsx` :
     - Remplacer tous les titres `"... - ChessBet"` par `"... - Elite64"`

2. **Emails backend** (6 occurrences)
   - `backend/src/mail/mail.service.ts` :
     - Ligne 59, 106 : `'ChessBet <no-reply@chessbet.com>'` → `'Elite64 <no-reply@elite64.app>'`
     - Ligne 64, 111 : Sujets emails → Remplacer "ChessBet" par "Elite64"
     - Lignes 66, 75 : Contenu HTML/text → Remplacer "ChessBet" par "Elite64"

**Fichiers à modifier** :
- `frontend/pages/index.tsx`
- `frontend/pages/terms.tsx`
- `frontend/pages/privacy.tsx`
- `frontend/pages/login.tsx`
- `frontend/pages/register.tsx`
- `frontend/pages/verify-email.tsx`
- `frontend/pages/wallet.tsx`
- `frontend/pages/tournaments/index.tsx`
- `frontend/pages/tournaments/[id].tsx`
- `backend/src/mail/mail.service.ts`

**Tests requis** :
- Vérifier que toutes les pages affichent "Elite64" (tests E2E)
- Vérifier que les emails utilisent "Elite64" (tests unitaires)

---

### Liste d'actions P1 (après lancement MVP)

#### Action P1-1 : Support email contact@elite64.app

**Objectif** : Implémenter l'affichage et la configuration de l'email de support.

**Actions** :
1. **Frontend** : Ajouter `contact@elite64.app` dans les pages publiques
   - `frontend/pages/terms.tsx` : Ligne 70-74 — Remplacer "moyens de contact disponibles" par `contact@elite64.app`
   - `frontend/pages/privacy.tsx` : Ligne 90-95 — Remplacer "moyens de contact disponibles" par `contact@elite64.app`
   - Optionnel : Créer page `/contact` dédiée

2. **Backend** : Configurer l'email de support
   - `backend/src/mail/mail.service.ts` :
     - Modifier fallback : `'Elite64 <contact@elite64.app>'` (au lieu de `ChessBet <no-reply@chessbet.com>`)
     - Ou créer variable `SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'contact@elite64.app'`
   - `.env.example` : Ajouter `SUPPORT_EMAIL=contact@elite64.app`

**Fichiers à modifier** :
- `frontend/pages/terms.tsx`
- `frontend/pages/privacy.tsx`
- `backend/src/mail/mail.service.ts`
- `.env.example` (si accessible)

---

#### Action P1-2 : Nettoyage occurrences "ChessBet" internes

**Objectif** : Cohérence interne (non bloquant).

**Actions** :
1. **Noms de packages** :
   - `frontend/package.json` : `"name": "chessbet-frontend"` → `"elite64-frontend"`
   - `frontend/package-lock.json` : Mise à jour automatique

2. **Tests E2E** :
   - `frontend/tests/e2e/smoke.spec.ts` : Mettre à jour les assertions de titres
   - `frontend/tests/e2e/match-seed-example.spec.ts` : Mettre à jour les assertions de titres

3. **Documentation** :
   - `docs/README.md` : Titre → `"# Documentation Elite64"`
   - `README.md` : Titre → `"# Elite64"`
   - `docs/_maintenance/*.md` : Titres → Remplacer "ChessBet" par "Elite64"

**Fichiers à modifier** :
- `frontend/package.json`
- `frontend/tests/e2e/smoke.spec.ts`
- `frontend/tests/e2e/match-seed-example.spec.ts`
- `docs/README.md`
- `README.md`
- `docs/_maintenance/MAINTENANCE_GUIDE.md`
- `docs/_maintenance/COMMANDES_CURSOR.md`

---

## 6) Annexes

### 6.1 Références aux décisions FIGÉES

- **Document 00** : `docs/governance/00 - [Chef de projet] - 00.md`
  - Arbitrage A (lignes 164-198) : Modèle économique 9.75%
  - Arbitrage B (lignes 202-237) : Nommage Elite64 uniquement
  - Arbitrage C (lignes 241-266) : Support email contact@elite64.app

- **Document 04** : `docs/governance/04 - [Finance & paiements] - 04.md`
  - Section "Entrées d'argent" (lignes 33-52) : Structure des frais

### 6.2 Méthodologie de recherche

- **Recherche "ChessBet"** : `grep -i "ChessBet"` sur tout le codebase
- **Recherche modèle économique** : Analyse du code `prize-pool.service.ts` et `tournaments.service.ts`
- **Recherche email support** : `grep -i "contact@elite64.app\|support\|SMTP_FROM"`

### 6.3 Limitations du diagnostic

- **Fichiers non accessibles** : `.env` (variables d'environnement réelles non vérifiées)
- **Tests non exécutés** : Diagnostic en lecture seule, pas d'exécution de tests
- **Base de données** : Pas d'analyse des données persistées (seulement code source)

---

**Fin du rapport BLOC 6.1**

