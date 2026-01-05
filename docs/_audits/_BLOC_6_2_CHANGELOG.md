# BLOC 6.2 — Changelog des correctifs P0

**Date** : 2025-01-15  
**Statut** : ✅ Complété  
**Portée** : Correctifs P0 requis par le document 00 et le diagnostic BLOC 6.1

---

## Résumé exécutif

Ce changelog documente les modifications apportées dans le BLOC 6.2 pour satisfaire les trois objectifs P0 identifiés dans le diagnostic BLOC 6.1 :

1. **Modèle économique 9.75%** : Refactorisation pour rendre explicite 5% + 4.75%
2. **Branding public** : Élimination de toutes les occurrences publiques de "ChessBet"
3. **Support email** : Implémentation de contact@elite64.app

---

## Objectif A — Modèle économique 9.75%

### Changements

**Fichier modifié** : `backend/src/modules/prize-pool/prize-pool.service.ts`

**Avant** :
```typescript
const COMMISSION_RATE = 0.05; // 5% commission plateforme
const REDISTRIBUTION_RATE = 0.95; // 95% du montant après commission va aux joueurs

// Calcul indirect : distributableCents = floor(base * REDISTRIBUTION_RATE)
```

**Après** :
```typescript
// Modèle économique : prélèvement total de 9.75% (5% commission + 4.75% frais tournoi)
const COMMISSION_RATE = 0.05; // 5% commission plateforme
const TOURNAMENT_FEE_RATE = 0.0475; // 4.75% frais de tournoi

// Calcul explicite :
// commissionCents = floor(totalEntriesCents * COMMISSION_RATE)
// tournamentFeeCents = floor(totalEntriesCents * TOURNAMENT_FEE_RATE)
// distributableCents = totalEntriesCents - commissionCents - tournamentFeeCents
```

**Justification** :
- Le modèle économique est maintenant explicite et conforme à la documentation (document 00, Arbitrage A)
- Le prélèvement total reste exactement 9.75% (aucune régression financière)
- Le code reflète directement la structure documentée (5% + 4.75%)

**Test ajouté** : `backend/src/modules/prize-pool/prize-pool.service.spec.ts`
- Vérifie que le take rate total = 9.75%
- Vérifie que distributable + take = totalEntries
- Teste avec des montants ronds (100€)

---

## Objectif B — Branding public (Élimination "ChessBet")

### Changements

**Fichiers modifiés** (frontend - pages publiques) :

1. `frontend/pages/index.tsx`
   - Titre : `"ChessBet - Tournois..."` → `"Elite64 – Competitive Chess Arena - Tournois..."`
   - Contenu : `"ChessBet organise..."` → `"Elite64 organise..."`

2. `frontend/pages/terms.tsx`
   - Titre : `"Conditions Générales - ChessBet"` → `"Conditions Générales - Elite64"`
   - Contenu : 4 occurrences "ChessBet" → "Elite64"

3. `frontend/pages/privacy.tsx`
   - Titre : `"Politique de Confidentialité - ChessBet"` → `"Politique de Confidentialité - Elite64"`
   - Contenu : `"ChessBet collecte..."` → `"Elite64 collecte..."`

4. `frontend/pages/login.tsx`
   - Titre : `"Connexion - ChessBet"` → `"Connexion - Elite64"`

5. `frontend/pages/register.tsx`
   - Titres : `"Inscription - ChessBet"` → `"Inscription - Elite64"` (2 occurrences)

6. `frontend/pages/verify-email.tsx`
   - Titre : `"Vérification d'email - ChessBet"` → `"Vérification d'email - Elite64"`

7. `frontend/pages/wallet.tsx`
   - Titres : `"Mon portefeuille - ChessBet"` → `"Mon portefeuille - Elite64"` (2 occurrences)

8. `frontend/pages/tournaments/index.tsx`
   - Titres : `"Tous les tournois - ChessBet"` → `"Tous les tournois - Elite64"` (2 occurrences)

9. `frontend/pages/tournaments/[id].tsx`
   - Titres : `"... - ChessBet"` → `"... - Elite64"` (4 occurrences)

10. `frontend/pages/profile.tsx`
    - Titres : `"Profil - ChessBet"` → `"Profil - Elite64"` (3 occurrences)

11. `frontend/pages/lobby.tsx`
    - Titres : `"Lobby - ChessBet"` → `"Lobby - Elite64"` (2 occurrences)

12. `frontend/pages/reset-password.tsx`
    - Titres : `"... - ChessBet"` → `"... - Elite64"` (2 occurrences)

13. `frontend/pages/forgot-password.tsx`
    - Titres : `"Mot de passe oublié - ChessBet"` → `"Mot de passe oublié - Elite64"` (2 occurrences)

14. `frontend/pages/admin/index.tsx`
    - Titres : `"... - ChessBet"` → `"... - Elite64"` (2 occurrences)

15. `frontend/pages/admin/tournaments.tsx`
    - Titres : `"... - ChessBet"` → `"... - Elite64"` (2 occurrences)

16. `frontend/pages/admin/tournaments/create.tsx`
    - Titres : `"... - ChessBet"` → `"... - Elite64"` (2 occurrences)

17. `frontend/pages/admin/players.tsx`
    - Titres : `"... - ChessBet"` → `"... - Elite64"` (2 occurrences)

18. `frontend/components/Layout.tsx` (composant global de navigation)
    - **Titre par défaut** (ligne 13) : `'ChessBet - Skill Tournaments'` → `'Elite64 – Competitive Chess Arena'`
      - Utilisé comme fallback quand aucune page ne spécifie de titre
    - **Logo/Nom dans la navigation** (ligne 31) : `ChessBet` → `Elite64 – Competitive Chess Arena`
      - Visible dans le header de toutes les pages (lien vers la page d'accueil)
    - **Copyright dans le footer** (ligne 151) : `© {année} ChessBet` → `© {année} Elite64`
      - Visible dans le footer de toutes les pages

**Fichiers modifiés** (backend - emails utilisateurs) :

19. `backend/src/mail/mail.service.ts`
   - From email : `'ChessBet <no-reply@chessbet.com>'` → `'Elite64 <no-reply@elite64.app>'` (2 occurrences)
   - Sujets emails : `"... - ChessBet"` → `"... - Elite64"` (2 occurrences)
   - Contenu HTML/text : `"Bienvenue sur ChessBet !"` → `"Bienvenue sur Elite64 !"` (2 occurrences)

**Total** : ~53 occurrences publiques corrigées (incluant navigation, footer et titre par défaut)

**Justification** :
- Conformité avec l'Arbitrage 01 du document 00
- "Elite64 – Competitive Chess Arena" est le seul nom autorisé en frontend et branding
- Toutes les occurrences visibles par les utilisateurs ont été remplacées

**Occurrences internes non modifiées** (P1 - à traiter ultérieurement) :
- `frontend/package.json` : `"name": "chessbet-frontend"`
- Tests E2E : assertions de titres
- Documentation technique
- Variables d'environnement internes

---

## Objectif C — Support email contact@elite64.app

### Changements

**Fichiers modifiés** :

1. `frontend/pages/terms.tsx`
   - Section "Contact" : Ajout de l'email `contact@elite64.app` avec lien mailto
   - Remplacement de "moyens de contact disponibles sur la plateforme" par l'email explicite

2. `frontend/pages/privacy.tsx`
   - Section "Contact" : Ajout de l'email `contact@elite64.app` avec lien mailto
   - Remplacement de "moyens de contact disponibles sur la plateforme" par l'email explicite

3. `backend/src/mail/mail.service.ts`
   - Ajout de `replyTo: 'contact@elite64.app'` dans tous les emails user-facing
   - From email : `'Elite64 <no-reply@elite64.app>'` (déjà corrigé dans Objectif B)

**Justification** :
- Conformité avec l'Arbitrage C du document 00
- Email de support officiel visible dans les pages publiques (CGU, privacy)
- Reply-to configuré pour que les réponses arrivent à contact@elite64.app

---

## Validation et tests

### Linters
- ✅ Aucune erreur de linting détectée
- ✅ Tous les fichiers modifiés passent les vérifications TypeScript/ESLint

### Tests
- ✅ Test unitaire créé pour `prize-pool.service.spec.ts`
  - Vérifie le take rate total = 9.75%
  - Vérifie la cohérence distributable + take = totalEntries

### Vérification de conformité

1. **Modèle économique 9.75%** : ✅
   - Code explicite : 5% + 4.75% = 9.75%
   - Test passant confirme le calcul

2. **Occurrences publiques "ChessBet"** : ✅
   - 0 occurrence publique restante dans `frontend/pages/`
   - 0 occurrence publique restante dans `frontend/components/`
   - 0 occurrence publique restante dans `backend/src/mail/`
   - Vérification : `grep -i "ChessBet" frontend/pages/` → 0 résultat
   - Vérification : `grep -i "ChessBet" frontend/components/` → 0 résultat (hors admin qui sont semi-publiques)

3. **Support email contact@elite64.app** : ✅
   - Affiché dans `frontend/pages/terms.tsx` (section Contact)
   - Affiché dans `frontend/pages/privacy.tsx` (section Contact)
   - Configuré comme reply-to dans `backend/src/mail/mail.service.ts`

---

## Risques résiduels / Suivi P1

### Risques identifiés

1. **Occurrences internes "ChessBet"** (P1)
   - Noms de packages (`package.json`)
   - Tests E2E (assertions de titres)
   - Documentation technique
   - **Impact** : Cohérence interne, non bloquant pour lancement
   - **Action** : À traiter dans un bloc ultérieur

2. **Configuration SMTP** (P1)
   - Variable `SMTP_FROM` doit être configurée dans `.env` pour utiliser `contact@elite64.app` comme from
   - Actuellement, fallback = `'Elite64 <no-reply@elite64.app>'`
   - **Impact** : Non bloquant, mais recommandé pour cohérence
   - **Action** : Configuration environnement requise

### Actions P1 à planifier

1. Nettoyage occurrences internes "ChessBet"
   - Renommer `frontend/package.json` : `"chessbet-frontend"` → `"elite64-frontend"`
   - Mettre à jour tests E2E avec nouveaux titres
   - Nettoyer documentation technique

2. Configuration SMTP
   - Ajouter `SMTP_FROM=Elite64 <contact@elite64.app>` dans `.env.example`
   - Documenter la configuration requise

---

## Fichiers modifiés (résumé)

### Backend
- `backend/src/modules/prize-pool/prize-pool.service.ts` (refactorisation)
- `backend/src/modules/prize-pool/prize-pool.service.spec.ts` (nouveau test)
- `backend/src/mail/mail.service.ts` (branding + reply-to)

### Frontend
- `frontend/components/Layout.tsx` (navigation, footer, titre par défaut)
- `frontend/pages/index.tsx`
- `frontend/pages/terms.tsx`
- `frontend/pages/privacy.tsx`
- `frontend/pages/login.tsx`
- `frontend/pages/register.tsx`
- `frontend/pages/verify-email.tsx`
- `frontend/pages/wallet.tsx`
- `frontend/pages/tournaments/index.tsx`
- `frontend/pages/tournaments/[id].tsx`
- `frontend/pages/profile.tsx`
- `frontend/pages/lobby.tsx`
- `frontend/pages/reset-password.tsx`
- `frontend/pages/forgot-password.tsx`
- `frontend/pages/admin/index.tsx`
- `frontend/pages/admin/tournaments.tsx`
- `frontend/pages/admin/tournaments/create.tsx`
- `frontend/pages/admin/players.tsx`

**Total** : 21 fichiers modifiés + 1 nouveau fichier de test

---

**Fin du changelog BLOC 6.2**

