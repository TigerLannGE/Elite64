# Audit Governance — Document 05 : Produit & expérience utilisateur

**Date de création** : 15 janvier 2025  
**Statut** : ✅ Complété  
**Portée** : Audit factuel de conformité du document 05 avec les sources de vérité autorisées

---

## 📋 Résumé Exécutif

Cet audit vérifie la conformité du document `docs/governance/05 - [Produit & expérience utilisateur] - 05.md` avec les sources de vérité autorisées (documents Governance 00, 01, 02, code backend/frontend, structure du projet).

**Résultats principaux** :
- **2 incohérences critiques (P0)** identifiées
- **3 incohérences moyennes (P1)** identifiées
- **1 élément obsolète** identifié (contenu métadiscursif)
- **18 affirmations conformes** vérifiées
- **5 éléments non vérifiables** identifiés (décisions stratégiques non implémentées)

**Priorités** :
1. **P0 – Critique** : Références aux documents Governance utilisent l'ancienne nomenclature ("chat 00/01/03/04" au lieu de "document 00/01/03/04")
2. **P0 – Critique** : Frontend utilise "ChessBet" au lieu de "Elite64" dans les pages publiques (incohérence avec document 00)
3. **P1 – Moyen** : Contenu métadiscursif/conversationnel présent (doit être nettoyé)
4. **P1 – Moyen** : Retraits mentionnés comme accessibles mais non implémentés dans le code
5. **P1 – Moyen** : Délais et limites de retraits mentionnés mais non implémentés

---

## 🔍 Méthodologie d'Analyse

### Sources de vérité autorisées

**Documents Governance** :
- `docs/governance/00 - [Chef de projet] - 00.md` (arbitrages officiels)
- `docs/governance/01 - [Vision et Stratégie Globale] - 01.md` (vision stratégique)
- `docs/governance/02 - [Branding et Marketing] - 02.md` (nom de marque)
- `docs/governance/03 - [Structure juridique & conformité] - 03.md` (cadre juridique)
- `docs/governance/04 - [Finance & paiements] - 04.md` (cadre financier)

**Code source** :
- `backend/src/players/players.service.ts` (onboarding, création compte)
- `backend/src/modules/tournaments/tournaments.service.ts` (tournois, inscriptions, annulations)
- `backend/src/modules/matches/matches.service.ts` (matches, DRAW, tie-breaks, résignation)
- `backend/src/wallets/wallets.service.ts` (wallets, retraits)
- `backend/src/moderation/player-restrictions.service.ts` (sanctions, restrictions)
- `backend/prisma/schema.prisma` (modèles, enums, structure)
- `frontend/pages/register.tsx` (inscription)
- `frontend/pages/lobby.tsx` (lobby, sélection tournoi)
- `frontend/pages/matches/[id].tsx` (gameplay, match)
- `frontend/pages/wallet.tsx` (wallet, transactions)
- `frontend/pages/index.tsx` (page d'accueil)
- `frontend/lib/api.ts` (appels API)

**Structure du projet** :
- `README.md` (nom technique du projet)

### Méthode de vérification

1. **Extraction des affirmations** : Identification de toutes les affirmations vérifiables dans le document 05
2. **Vérification contre sources** : Comparaison avec les documents Governance et le code source
3. **Classification des écarts** : P0 (critique), P1 (moyen), P2 (faible), non vérifiable, obsolète
4. **Documentation des preuves** : Références exactes (fichiers, lignes)

---

## 📊 Liste Exhaustive des Affirmations Vérifiables

### Affirmations FIGÉES extraites du document 05

1. **Parcours joueur** : "Accès à une arène de compétitions d'échecs skill-based" (FIGÉ)
2. **Positionnement** : "Positionnement explicite : compétition, pas pari" (FIGÉ)
3. **Parcours simple** : "Sélection d'un tournoi → Engagement du buy-in → Déroulement des parties → Attribution des gains" (FIGÉ)
4. **Accès matchs** : "Accès aux matchs exclusivement via un tournoi identifié" (FIGÉ)
5. **Visibilité match parent** : "Visibilité du match parent et de son statut tout au long du parcours" (FIGÉ)
6. **Tournois structurés** : "Tournois structurés, règles prédéfinies et accessibles" (FIGÉ)
7. **Buy-in engagement** : "Buy-in engagé uniquement à l'entrée du tournoi" (FIGÉ)
8. **Prize pool buy-ins** : "Prize pool constitué des buy-ins joueurs" (FIGÉ)
9. **Formats simples** : "Formats volontairement simples au lancement" (FIGÉ)
10. **Absence tournois privés** : "Absence de tournois privés en phase initiale" (FIGÉ)
11. **Annulation remboursement** : "Annulation de tournoi avec remboursement automatique" (FIGÉ)
12. **Fin de partie** : "Fin de partie possible par victoire, défaite, résignation ou règles automatiques (pat, 50 coups, répétitions)" (FIGÉ)
13. **Politique DRAW** : "Politique de DRAW définie par le tournoi" (FIGÉ)
14. **DRAW provisoire** : "DRAW possible comme état provisoire" (FIGÉ)
15. **Résolution tie-breaks** : "Résolution finale possible via tie-breaks prédéfinis" (FIGÉ)
16. **Tie-breaks intégrés** : "Tie-breaks intégrés au déroulement normal du tournoi" (FIGÉ)
17. **Combinaisons non résolutives** : "Combinaisons de règles non résolutives interdites" (FIGÉ)
18. **Dépôt sans commission** : "Dépôt sans commission" (FIGÉ)
19. **Frais au tournoi** : "Frais et commissions appliqués au moment du tournoi" (FIGÉ)
20. **Parcours paiement transparent** : "Parcours paiement transparent et compréhensible" (FIGÉ)
21. **Retraits accessibles** : "Retraits accessibles avec délais et limites annoncés" (FIGÉ)
22. **Aucune exposition logique financière** : "Aucune exposition de logique financière interne" (FIGÉ)
23. **Règles intégrité** : "Existence explicite de règles d'intégrité et de fair-play" (FIGÉ)
24. **Sanctions possibles** : "Sanctions possibles : suspension, bannissement, confiscation des gains" (FIGÉ)
25. **Fins automatiques non contestables** : "Fins de partie automatiques non contestables" (FIGÉ)
26. **Tie-breaks limitent litiges** : "Tie-breaks limitant les litiges liés aux égalités" (FIGÉ)
27. **Traçabilité matchs** : "Traçabilité complète des matchs" (FIGÉ)
28. **Gestion litiges** : "Gestion des litiges fondée sur règles annoncées, données objectives et modération humaine ciblée" (FIGÉ)
29. **MVP inclus web desktop** : "Web desktop" (FIGÉ, inclus MVP)
30. **MVP inclus tournois publics** : "Tournois publics simples" (FIGÉ, inclus MVP)
31. **MVP inclus buy-in prize pool** : "Buy-in, prize pool clairs" (FIGÉ, inclus MVP)
32. **MVP inclus DRAW tie-breaks** : "DRAW + tie-breaks" (FIGÉ, inclus MVP)
33. **MVP inclus paiements retraits basiques** : "Paiements et retraits basiques" (FIGÉ, inclus MVP)
34. **MVP inclus cadre anti-cheat** : "Cadre anti-cheat visible" (FIGÉ, inclus MVP)
35. **MVP exclus tournois privés** : "Tournois privés" (FIGÉ, exclus MVP)
36. **MVP exclus formats avancés** : "Formats avancés" (FIGÉ, exclus MVP)
37. **MVP exclus applications mobiles natives** : "Applications mobiles natives" (FIGÉ, exclus MVP)

### Affirmations PROVISOIRES extraites du document 05

38. **Niveau visibilité anti-cheat** : "Niveau de visibilité et pédagogie" (PROVISOIRE)
39. **Formats tournois lancement** : "Arbitrer les formats de tournois du lancement" (PROVISOIRE)
40. **Niveaux buy-in initiaux** : "Arbitrer les niveaux de buy-in initiaux" (PROVISOIRE)
41. **Présentation UX DRAW provisoire** : "Valider la présentation UX d'un DRAW provisoire" (PROVISOIRE)
42. **Enchaînement UX tie-breaks** : "Définir l'enchaînement UX des tie-breaks BEST_OF_N" (PROVISOIRE)
43. **Visibilité règles tie-break** : "Clarifier la visibilité des règles de tie-break avant engagement" (PROVISOIRE)

---

## 📊 Tableau État Réel / Source / Statut

| # | Affirmation | Localisation Document 05 | Source de Vérification | Statut | Preuve |
|---|-------------|-------------------------|------------------------|--------|--------|
| 1 | Accès arène skill-based | Ligne 1 (FIGÉ) | Document 01 ligne 1, Document 02 ligne 26 | **CONFORME** | Documents 01 et 02 confirment positionnement skill-based |
| 2 | Positionnement compétition pas pari | Ligne 1 (FIGÉ) | Document 01 ligne 1, Document 02 ligne 25 | **CONFORME** | Documents 01 et 02 excluent explicitement gambling |
| 3 | Parcours sélection → buy-in → parties → gains | Ligne 1 (FIGÉ) | `frontend/pages/lobby.tsx`, `backend/src/modules/tournaments/tournaments.service.ts:300-405` | **CONFORME** | Parcours implémenté : lobby → inscription → match → payout |
| 4 | Accès matchs via tournoi | Ligne 1 (FIGÉ) | `backend/prisma/schema.prisma:201-254` | **CONFORME** | Modèle Match avec relation obligatoire Tournament |
| 5 | Visibilité match parent | Ligne 1 (FIGÉ) | `frontend/pages/matches/[id].tsx`, `backend/src/modules/matches/matches.service.ts:1418-1430` | **CONFORME** | MatchStateViewDto inclut parentMatchId et isTieBreak |
| 6 | Tournois structurés | Ligne 1 (FIGÉ) | `backend/prisma/schema.prisma:149-178` | **CONFORME** | Modèle Tournament avec règles prédéfinies (timeControl, buyInCents, etc.) |
| 7 | Buy-in à l'entrée | Ligne 1 (FIGÉ) | `backend/src/modules/tournaments/tournaments.service.ts:383-384` | **CONFORME** | `debitWallet` appelé lors de l'inscription |
| 8 | Prize pool buy-ins | Ligne 1 (FIGÉ) | `backend/src/modules/prize-pool/prize-pool.service.ts:28-46` | **CONFORME** | Calcul prize pool basé sur `playersCount * buyInCents` |
| 9 | Formats simples | Ligne 1 (FIGÉ) | `backend/prisma/schema.prisma:149-178` | **CONFORME** | Modèle Tournament simple, pas de formats avancés |
| 10 | Absence tournois privés | Ligne 1 (FIGÉ) | Recherche code backend | **CONFORME** | Aucun champ `isPrivate` ou logique tournois privés dans le code |
| 11 | Annulation remboursement | Ligne 1 (FIGÉ) | `backend/src/modules/tournaments/tournaments.service.ts:442-469` | **CONFORME** | Remboursement automatique via `TOURNAMENT_PAYOUT` |
| 12 | Fin partie victoire/défaite/résignation/règles | Ligne 1 (FIGÉ) | `backend/src/modules/matches/matches.service.ts:1299-1413`, `backend/prisma/schema.prisma:56-61` | **CONFORME** | MatchResult : WHITE_WIN, BLACK_WIN, DRAW, BYE ; résignation implémentée |
| 13 | Politique DRAW par tournoi | Ligne 1 (FIGÉ) | `backend/prisma/schema.prisma:232-236` | **CONFORME** | Modèle Tournament avec `tieBreakPolicy` et `drawRuleMode` |
| 14 | DRAW provisoire | Ligne 1 (FIGÉ) | `backend/src/modules/matches/matches.service.ts:1174-1183` | **CONFORME** | `RESULT_REASON_TIEBREAK_PENDING` pour DRAW avec tie-break |
| 15 | Résolution tie-breaks | Ligne 1 (FIGÉ) | `backend/src/modules/matches/matches.service.ts:1794-1951` | **CONFORME** | Méthode `resolveTieBreak` implémentée |
| 16 | Tie-breaks intégrés | Ligne 1 (FIGÉ) | `backend/src/modules/matches/matches.service.ts:1476-1670` | **CONFORME** | Méthode `createTieBreakMatches` implémentée |
| 17 | Combinaisons non résolutives interdites | Ligne 1 (FIGÉ) | `backend/src/modules/matches/matches.service.ts:1144-1173` | **CONFORME** | Garde-fous : `requiresDecisiveResult=true` nécessite tie-break |
| 18 | Dépôt sans commission | Ligne 1 (FIGÉ) | `backend/src/transactions/transactions.service.ts:77-92` | **CONFORME** | TransactionType.DEPOSIT existe, pas de commission sur dépôt |
| 19 | Frais au tournoi | Ligne 1 (FIGÉ) | `backend/src/modules/prize-pool/prize-pool.service.ts:32-33` | **CONFORME** | Commission calculée lors du calcul prize pool |
| 20 | Parcours paiement transparent | Ligne 1 (FIGÉ) | `frontend/pages/wallet.tsx`, `frontend/pages/lobby.tsx` | **CONFORME** | Interface wallet et affichage prize pools clairs |
| 21 | Retraits accessibles délais limites | Ligne 1 (FIGÉ) | `backend/src/wallets/wallets.service.ts:106-129` | **NON CONFORME** | Méthode `withdraw` existe mais lance `ForbiddenException` : "Les retraits ne sont pas encore implémentés" |
| 22 | Aucune exposition logique financière | Ligne 1 (FIGÉ) | `frontend/pages/wallet.tsx`, `frontend/pages/lobby.tsx` | **CONFORME** | Interface affiche transactions et prize pools, pas de logique interne |
| 23 | Règles intégrité fair-play | Ligne 1 (FIGÉ) | `backend/src/moderation/player-restrictions.service.ts` | **CONFORME** | Service de restrictions et modération existe |
| 24 | Sanctions suspension/bannissement/confiscation | Ligne 1 (FIGÉ) | `backend/src/moderation/player-restrictions.service.ts:19-76` | **PARTIELLEMENT CONFORME** | Suspension (isActive) et restrictions (blockTournaments, blockWalletDeposits, blockWalletWithdrawals) implémentées, confiscation non vérifiable |
| 25 | Fins automatiques non contestables | Ligne 1 (FIGÉ) | `backend/src/modules/matches/matches.service.ts:1094-1128` | **CONFORME** | Fins automatiques (STALEMATE, FIFTY_MOVE_RULE, etc.) gérées par ChessEngineService |
| 26 | Tie-breaks limitent litiges | Ligne 1 (FIGÉ) | `backend/src/modules/matches/matches.service.ts:1794-1951` | **CONFORME** | Résolution automatique des tie-breaks |
| 27 | Traçabilité matchs | Ligne 1 (FIGÉ) | `backend/prisma/schema.prisma:291-313` | **CONFORME** | Modèle MatchMove avec historique complet |
| 28 | Gestion litiges règles/modération | Ligne 1 (FIGÉ) | `backend/src/moderation/player-restrictions.service.ts` | **CONFORME** | Service de modération avec restrictions ciblées |
| 29 | MVP web desktop | Ligne 1 (FIGÉ) | `frontend/` (Next.js) | **CONFORME** | Frontend Next.js (web) implémenté |
| 30 | MVP tournois publics | Ligne 1 (FIGÉ) | Recherche code backend | **CONFORME** | Aucun tournoi privé, tous publics |
| 31 | MVP buy-in prize pool | Ligne 1 (FIGÉ) | `backend/src/modules/prize-pool/prize-pool.service.ts` | **CONFORME** | Buy-in et prize pool implémentés |
| 32 | MVP DRAW tie-breaks | Ligne 1 (FIGÉ) | `backend/src/modules/matches/matches.service.ts` | **CONFORME** | DRAW et tie-breaks implémentés |
| 33 | MVP paiements retraits basiques | Ligne 1 (FIGÉ) | `backend/src/wallets/wallets.service.ts` | **PARTIELLEMENT CONFORME** | Paiements implémentés, retraits non implémentés |
| 34 | MVP cadre anti-cheat | Ligne 1 (FIGÉ) | `backend/src/moderation/player-restrictions.service.ts` | **CONFORME** | Restrictions et modération implémentées |
| 35 | MVP exclus tournois privés | Ligne 1 (FIGÉ) | Recherche code backend | **CONFORME** | Aucun tournoi privé dans le code |
| 36 | MVP exclus formats avancés | Ligne 1 (FIGÉ) | `backend/prisma/schema.prisma:149-178` | **CONFORME** | Modèle Tournament simple, pas de formats avancés |
| 37 | MVP exclus apps mobiles natives | Ligne 1 (FIGÉ) | Structure projet | **CONFORME** | Pas d'app mobile native, uniquement Next.js |
| 38-43 | Éléments PROVISOIRES | Lignes 1-2 | N/A | **HORS PÉRIMÈTRE** | Éléments explicitement marqués PROVISOIRES, non vérifiables |

---

## 📊 Écarts & Incohérences avec Preuves

### P0 – Critique

#### Écart 01 : Références aux documents Governance utilisent l'ancienne nomenclature

**Affirmation dans document 05** :
- "Ce domaine ne traite ni la vision stratégique globale (chat 00)" (ligne 1)
- "Chat 00 – Chef de projet" (ligne 2)
- "Chat 04 – Finance & paiements" (ligne 2)
- "Chat 03 – Structure juridique & conformité" (ligne 2)
- "Chat 01 – Vision & stratégie" (ligne 2)
- "alimenter les arbitrages du chat 00" (ligne 19)
- "signalera explicitement toute dépendance au chat 00 ou aux autres domaines (01, 03, 04)" (ligne 30)
- "accompagner le **gel définitif du périmètre MVP**, dès sollicitation explicite du chat 00" (ligne 36)

**Source de vérité** :
- Document 00 (ligne 11) : "projet Elite64/ChessBet"
- Document 01 (ligne 1) : Utilise "document 00 – Chef de projet"
- Document 02 (ligne 106) : Utilise "document 00 – Chef de projet"
- Document 02 (ligne 107) : Utilise "document 01 – Vision & Stratégie Globale"

**Statut** : **NON CONFORME**

**Impact** : Critique — Incohérence de nomenclature avec les autres documents Governance. Le document 05 doit utiliser "document 00 – Chef de projet", "document 01 – Vision & Stratégie Globale", "document 03 – Structure juridique & conformité", "document 04 – Finance & paiements" au lieu de "chat 00/01/03/04".

**Preuve** :
- `docs/governance/05 - [Produit & expérience utilisateur] - 05.md:1,2,19,30,36` (8 occurrences de "chat 00/01/03/04")
- `docs/governance/01 - [Vision et Stratégie Globale] - 01.md:1` (utilise "document 00")
- `docs/governance/02 - [Branding et Marketing] - 02.md:106-107` (utilise "document 00", "document 01")

---

#### Écart 02 : Frontend utilise "ChessBet" au lieu de "Elite64" dans les pages publiques

**Affirmation dans document 05** :
- "Parcours joueur (macro) FIGÉ" (ligne 1)
- "Accès à une arène de compétitions d'échecs skill-based" (ligne 1)

**Source de vérité** :
- Document 00 (Arbitrage 01, ligne 109) : "Elite64 est la marque publique officielle du projet. ChessBet est le nom technique interne"
- Document 00 (ligne 112) : "Elite64 : Marque publique, usage externe (communication, branding, domaine principal)"
- Document 02 (ligne 19) : "Nom de marque : Elite64" (FIGÉ)
- `frontend/pages/index.tsx:7` : Titre "ChessBet - Tournois d'échecs..."
- `frontend/pages/index.tsx:88` : "ChessBet organise des **concours de compétence**"
- `frontend/pages/terms.tsx:5,16` : "Conditions Générales - ChessBet", "ChessBet organise des compétitions"

**Statut** : **NON CONFORME**

**Impact** : Critique — Les pages publiques (accueil, CGU) utilisent "ChessBet" au lieu de "Elite64" selon l'arbitrage du document 00. Les pages publiques doivent utiliser la marque publique "Elite64".

**Preuve** :
- `docs/governance/00 - [Chef de projet] - 00.md:109-112`
- `docs/governance/02 - [Branding et Marketing] - 02.md:19`
- `frontend/pages/index.tsx:7,88`
- `frontend/pages/terms.tsx:5,16`

---

### P1 – Moyen

#### Écart 03 : Contenu métadiscursif/conversationnel présent

**Affirmation dans document 05** :
- "NB - Prends connaissance de ce prompt tu es le chat 05 dont il est question." (ligne 3)
- "Pris en compte." (ligne 5)
- "Je confirme avoir **pris connaissance intégralement** du livrable **\[Produit & expérience utilisateur\] – 05**" (ligne 7)
- "Tu peux poursuivre." (ligne 38)

**Source de vérité** :
- Document 02 (après nettoyage) : Contenu métadiscursif supprimé
- Document 01 : Pas de contenu conversationnel visible
- Document 00 : Pas de contenu conversationnel visible

**Statut** : **OBSOLÈTE**

**Impact** : Moyen — Le document 05 contient du contenu métadiscursif/conversationnel qui doit être nettoyé pour respecter le format canonique des documents Governance (comme effectué pour le document 02).

**Preuve** :
- `docs/governance/05 - [Produit & expérience utilisateur] - 05.md:3,5,7,38` (contenu conversationnel)
- `docs/governance/02 - [Branding et Marketing] - 02.md` (nettoyé, pas de contenu conversationnel)

---

#### Écart 04 : Retraits mentionnés comme accessibles mais non implémentés

**Affirmation dans document 05** :
- "Retraits accessibles avec délais et limites annoncés" (FIGÉ, ligne 1)
- "Paiements et retraits basiques" (FIGÉ, inclus MVP, ligne 1)

**Source de vérité** :
- `backend/src/wallets/wallets.service.ts:106-129` : Méthode `withdraw` existe mais lance `ForbiddenException` : "Les retraits ne sont pas encore implémentés"
- `frontend/pages/wallet.tsx` : Pas d'interface de retrait visible

**Statut** : **NON CONFORME**

**Impact** : Moyen — Les retraits sont mentionnés comme FIGÉ et inclus dans le MVP, mais ne sont pas implémentés dans le code. Le document 05 doit soit marquer les retraits comme PROVISOIRE, soit documenter l'implémentation prévue.

**Preuve** :
- `docs/governance/05 - [Produit & expérience utilisateur] - 05.md:1` (retraits FIGÉ, inclus MVP)
- `backend/src/wallets/wallets.service.ts:106-129` (retraits non implémentés)
- `frontend/pages/wallet.tsx` (pas d'interface retrait)

---

#### Écart 05 : Délais et limites de retraits mentionnés mais non implémentés

**Affirmation dans document 05** :
- "Retraits accessibles avec délais et limites annoncés" (FIGÉ, ligne 1)

**Source de vérité** :
- `backend/src/wallets/wallets.service.ts:106-129` : Méthode `withdraw` non implémentée
- Recherche code backend : Aucune logique de délais ou limites de retrait

**Statut** : **NON VÉRIFIABLE**

**Impact** : Moyen — Les délais et limites de retraits sont mentionnés comme FIGÉ mais ne sont pas implémentés dans le code. Cette affirmation est non vérifiable car les retraits ne sont pas implémentés.

**Preuve** :
- `docs/governance/05 - [Produit & expérience utilisateur] - 05.md:1` (délais et limites FIGÉ)
- `backend/src/wallets/wallets.service.ts:106-129` (retraits non implémentés)

---

### P2 – Faible

#### Écart 06 : Confiscation des gains mentionnée mais non vérifiable

**Affirmation dans document 05** :
- "Sanctions possibles : suspension, bannissement, confiscation des gains" (FIGÉ, ligne 1)

**Source de vérité** :
- `backend/src/moderation/player-restrictions.service.ts` : Suspension (isActive) et restrictions implémentées
- Recherche code backend : Aucune logique de confiscation des gains trouvée

**Statut** : **NON VÉRIFIABLE**

**Impact** : Faible — La confiscation des gains est mentionnée comme sanction possible mais n'est pas implémentée dans le code. Acceptable comme sanction prévue mais doit être clairement identifiée comme non implémentée.

**Preuve** :
- `docs/governance/05 - [Produit & expérience utilisateur] - 05.md:1` (confiscation mentionnée)
- Recherche code backend : Aucune logique de confiscation trouvée

---

## 📊 Hypothèses Explicitement Marquées

### Hypothèses PROVISOIRES (explicitement marquées dans le document 05)

Les éléments suivants sont explicitement marqués comme PROVISOIRES dans le document 05 et ne sont donc pas vérifiables :

1. **Niveau visibilité anti-cheat** : "Niveau de visibilité et pédagogie" (PROVISOIRE)
2. **Formats tournois lancement** : "Arbitrer les formats de tournois du lancement" (PROVISOIRE)
3. **Niveaux buy-in initiaux** : "Arbitrer les niveaux de buy-in initiaux" (PROVISOIRE)
4. **Présentation UX DRAW provisoire** : "Valider la présentation UX d'un DRAW provisoire" (PROVISOIRE)
5. **Enchaînement UX tie-breaks** : "Définir l'enchaînement UX des tie-breaks BEST_OF_N" (PROVISOIRE)
6. **Visibilité règles tie-break** : "Clarifier la visibilité des règles de tie-break avant engagement" (PROVISOIRE)

**Statut** : **HORS PÉRIMÈTRE** — Ces éléments sont explicitement marqués comme PROVISOIRES et ne nécessitent pas de vérification à ce stade.

---

## 📊 Éléments Manquants

### Éléments mentionnés dans le document 05 mais absents du code/documentation

1. **Retraits** : Le document 05 mentionne les retraits comme FIGÉ et inclus dans le MVP, mais ils ne sont pas implémentés dans le code.

2. **Délais et limites de retraits** : Le document 05 mentionne les délais et limites de retraits comme FIGÉ, mais ils ne sont pas implémentés dans le code.

3. **Confiscation des gains** : Le document 05 mentionne la confiscation des gains comme sanction possible, mais aucune logique de confiscation n'est implémentée dans le code.

---

## ✅ To-Do List Documentaire Priorisée

### Priorité P0 (Critique)

- [ ] **Remplacer toutes les références "chat 00/01/03/04" par "document 00/01/03/04"**
  - **Action** : Remplacer "chat 00" par "document 00 – Chef de projet", "chat 01" par "document 01 – Vision & Stratégie Globale", "chat 03" par "document 03 – Structure juridique & conformité", "chat 04" par "document 04 – Finance & paiements"
  - **Justification** : Cohérence de nomenclature avec les autres documents Governance
  - **Référence** : `docs/governance/05 - [Produit & expérience utilisateur] - 05.md:1,2,19,30,36` (8 occurrences)

- [ ] **Corriger les pages frontend publiques pour utiliser "Elite64" au lieu de "ChessBet"**
  - **Action** : Modifier `frontend/pages/index.tsx` et `frontend/pages/terms.tsx` pour remplacer "ChessBet" par "Elite64" dans les titres et contenus visibles
  - **Justification** : Les pages publiques doivent utiliser la marque publique "Elite64" selon l'arbitrage du document 00
  - **Référence** : `docs/governance/00 - [Chef de projet] - 00.md:109-112`, `frontend/pages/index.tsx:7,88`, `frontend/pages/terms.tsx:5,16`

---

### Priorité P1 (Moyen)

- [ ] **Nettoyer le contenu métadiscursif/conversationnel du document 05**
  - **Action** : Supprimer les phrases conversationnelles ("NB - Prends connaissance...", "Pris en compte.", "Je confirme...", "Tu peux poursuivre.")
  - **Justification** : Cohérence avec le format canonique des documents Governance (comme effectué pour le document 02)
  - **Référence** : `docs/governance/05 - [Produit & expérience utilisateur] - 05.md:3,5,7,38`, `docs/governance/02 - [Branding et Marketing] - 02.md` (exemple de nettoyage)

- [ ] **Clarifier le statut des retraits dans le document 05**
  - **Action** : Soit marquer les retraits comme PROVISOIRE (si non prioritaire), soit documenter l'implémentation prévue
  - **Justification** : Les retraits sont mentionnés comme FIGÉ et inclus dans le MVP mais ne sont pas implémentés dans le code
  - **Référence** : `docs/governance/05 - [Produit & expérience utilisateur] - 05.md:1`, `backend/src/wallets/wallets.service.ts:106-129`

- [ ] **Clarifier le statut des délais et limites de retraits**
  - **Action** : Soit marquer comme PROVISOIRE (si non implémentés), soit documenter l'implémentation prévue
  - **Justification** : Les délais et limites sont mentionnés comme FIGÉ mais ne sont pas vérifiables dans le code
  - **Référence** : `docs/governance/05 - [Produit & expérience utilisateur] - 05.md:1`, `backend/src/wallets/wallets.service.ts:106-129`

---

### Priorité P2 (Faible)

- [ ] **Documenter le statut de la confiscation des gains**
  - **Action** : Soit marquer comme PROVISOIRE (si non implémentée), soit documenter l'implémentation prévue
  - **Justification** : La confiscation est mentionnée comme sanction possible mais n'est pas implémentée dans le code
  - **Référence** : `docs/governance/05 - [Produit & expérience utilisateur] - 05.md:1`, Recherche code backend

---

## 📖 Références Vérifiables

### Fichiers analysés

**Documents Governance** :
- `docs/governance/00 - [Chef de projet] - 00.md` (lignes 11, 58-59, 105-120)
- `docs/governance/01 - [Vision et Stratégie Globale] - 01.md` (ligne 1)
- `docs/governance/02 - [Branding et Marketing] - 02.md` (lignes 19, 25-26, 106-107)
- `docs/governance/03 - [Structure juridique & conformité] - 03.md` (ligne 1)
- `docs/governance/04 - [Finance & paiements] - 04.md` (ligne 1)
- `docs/governance/05 - [Produit & expérience utilisateur] - 05.md` (lignes 1-38)

**Code source** :
- `backend/src/players/players.service.ts` (lignes 20-106)
- `backend/src/modules/tournaments/tournaments.service.ts` (lignes 300-405, 410-479, 566-744)
- `backend/src/modules/matches/matches.service.ts` (lignes 867-1289, 1299-1413, 1476-1951)
- `backend/src/wallets/wallets.service.ts` (lignes 106-129)
- `backend/src/moderation/player-restrictions.service.ts` (lignes 19-76)
- `backend/prisma/schema.prisma` (lignes 56-61, 149-178, 201-254, 291-313)
- `frontend/pages/register.tsx` (lignes 1-238)
- `frontend/pages/lobby.tsx` (lignes 1-303)
- `frontend/pages/matches/[id].tsx` (lignes 1-1065)
- `frontend/pages/wallet.tsx`
- `frontend/pages/index.tsx` (lignes 1-118)
- `frontend/lib/api.ts`

**Structure du projet** :
- `README.md` (ligne 1)

### Méthodes de vérification utilisées

- Lecture manuelle des fichiers
- Recherche textuelle (`grep`) pour identifier les occurrences
- Analyse de l'arborescence des fichiers
- Comparaison inter-documents pour vérifier la cohérence
- Recherche exhaustive de termes spécifiques (private, mobile, native, withdraw, confiscation)

---

## 🔍 Observations Complémentaires

### Points de cohérence vérifiés

✅ **Positionnement skill-based** : Le document 05 est cohérent avec les documents 01 et 02 sur le positionnement skill-based et l'exclusion du gambling.

✅ **Parcours joueur** : Le parcours documenté (sélection tournoi → buy-in → parties → gains) est correctement implémenté dans le code.

✅ **Tournois structurés** : Les tournois sont structurés avec règles prédéfinies, buy-in à l'entrée, et prize pools basés sur les buy-ins.

✅ **DRAW et tie-breaks** : La gestion des DRAW provisoires et des tie-breaks est correctement implémentée dans le code.

✅ **Annulation remboursement** : L'annulation de tournoi avec remboursement automatique est implémentée.

✅ **Périmètre MVP** : Les éléments inclus/exclus du MVP sont cohérents avec l'implémentation (pas de tournois privés, pas d'apps mobiles natives, formats simples).

✅ **Sanctions** : Les sanctions (suspension, restrictions) sont implémentées via le service de modération.

### Points nécessitant clarification

⚠️ **Retraits** : Le document 05 mentionne les retraits comme FIGÉ et inclus dans le MVP, mais ils ne sont pas implémentés. Il faut soit les implémenter, soit mettre à jour le document pour refléter l'état actuel.

⚠️ **Délais et limites de retraits** : Le document 05 mentionne les délais et limites comme FIGÉ, mais ils ne sont pas implémentés. Acceptable comme architecture prévue mais doit être clairement identifiée comme non implémentée.

⚠️ **Confiscation des gains** : Le document 05 mentionne la confiscation comme sanction possible, mais elle n'est pas implémentée. Acceptable comme sanction prévue mais doit être clairement identifiée comme non implémentée.

---

**Dernière mise à jour** : 15 janvier 2025

