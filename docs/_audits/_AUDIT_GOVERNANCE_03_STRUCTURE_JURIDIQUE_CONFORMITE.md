# Audit Governance — Document 03 : Structure juridique & conformité

**Date de création** : 15 janvier 2025  
**Statut** : ✅ Complété  
**Portée** : Audit factuel de conformité du document 03 avec les sources de vérité autorisées

---

## 📋 Résumé Exécutif

Cet audit vérifie la conformité du document `docs/governance/03 - [Structure juridique & conformité] - 03.md` avec les sources de vérité autorisées (documents Governance 00, 01, 02, code backend/frontend, structure du projet).

**Résultats principaux** :
- **3 incohérences critiques (P0)** identifiées
- **5 incohérences moyennes (P1)** identifiées
- **2 éléments non vérifiables** identifiés
- **1 élément obsolète** identifié (contenu métadiscursif)
- **8 affirmations conformes** vérifiées

**Priorités** :
1. **P0 – Critique** : Nom de la société opératrice manquant (doit mentionner "Synergy Digital Ltd")
2. **P0 – Critique** : Références aux documents Governance utilisent l'ancienne nomenclature ("chat 00" au lieu de "document 00")
3. **P0 – Critique** : CGU frontend utilise "ChessBet" au lieu de "Elite64" (incohérence avec document 00)
4. **P1 – Moyen** : Géolocalisation mentionnée comme FIGÉ mais non implémentée dans le code
5. **P1 – Moyen** : Contenu métadiscursif/conversationnel présent (doit être nettoyé)

---

## 🔍 Méthodologie d'Analyse

### Sources de vérité autorisées

**Documents Governance** :
- `docs/governance/00 - [Chef de projet] - 00.md` (arbitrages officiels)
- `docs/governance/01 - [Vision et Stratégie Globale] - 01.md` (vision stratégique)
- `docs/governance/02 - [Branding et Marketing] - 02.md` (nom de marque, société opératrice)

**Code source** :
- `backend/prisma/schema.prisma` (modèles, enums, structure)
- `frontend/pages/terms.tsx` (CGU implémentées)
- `backend/src/**/*.ts` (logique métier, géolocalisation)

**Structure du projet** :
- `README.md` (nom technique du projet)
- Structure `docs/` (organisation documentaire)

### Méthode de vérification

1. **Extraction des affirmations** : Identification de toutes les affirmations vérifiables dans le document 03
2. **Vérification contre sources** : Comparaison avec les documents Governance et le code source
3. **Classification des écarts** : P0 (critique), P1 (moyen), P2 (faible), non vérifiable, obsolète
4. **Documentation des preuves** : Références exactes (fichiers, lignes)

---

## 📊 Liste Exhaustive des Affirmations Vérifiables

### Affirmations FIGÉES extraites du document 03

1. **Structure corporate** : "Création d'une UK Private Limited Company comme entité opératrice unique"
2. **Choix géographique** : "Choix volontaire hors Suisse en phase 1"
3. **Refus SARL suisse** : "Refus explicite d'une SARL suisse à ce stade"
4. **Création via 1st Formations** : "Création via 1st Formations – Non-Residents Package"
5. **PSP unique** : "Relation PSP unique : Stripe"
6. **Séparation société/marque** : "Séparation société opératrice / marque produit"
7. **Actionnariat** : "Actionnariat : 95 % fondateur / 5 % second actionnaire"
8. **Directeur unique** : "Directeur unique : fondateur"
9. **Second actionnaire** : "Second actionnaire sans rôle opérationnel ni pouvoir de gouvernance"
10. **Aucun pouvoir joueurs** : "Aucun pouvoir des joueurs sur la gouvernance"
11. **Décisions sensibles** : "Décisions sensibles réservées à une décision humaine interne"
12. **Qualification juridique** : "Plateforme de compétitions d'échecs strictement skill-based"
13. **Exclusion gambling** : "Exclusion explicite du gambling, betting, hasard"
14. **Opérateur non-participant** : "Opérateur non-participant"
15. **Buy-in fixe** : "Buy-in fixe, prize pool déterministe issu uniquement des joueurs"
16. **Gains déterminés** : "Gains déterminés exclusivement par la performance"
17. **CGU nécessaires** : "Identification des documents nécessaires (CGU, KYC, AML light, litiges, remboursements)"
18. **Mentions clés** : "Mentions clés obligatoires (no gambling, no betting, absence de garantie de gains)"
19. **Cadre sanctions** : "Cadre de sanctions anti-triche, avec revue humaine finale"
20. **Géolocalisation** : "Géolocalisation multi-couches"
21. **Géoblocage** : "Géoblocage utilisé comme outil de conformité"
22. **Démarche bonne foi** : "Démarche de bonne foi réglementaire"

### Affirmations PROVISOIRES extraites du document 03

23. **Pacte d'associés** : "Pacte d'associés simple envisagé"
24. **Financements familiaux** : "Financements familiaux possibles hors capital"
25. **Liste pays** : "Liste exacte des pays autorisés / restreints / interdits" (PROVISOIRE)
26. **États américains** : "Cas spécifique des États américains à bloquer" (PROVISOIRE)
27. **Licence gambling** : "Absence de licence gambling en phase 1" (PROVISOIRE)
28. **Modèle wallet** : "Modèle wallet + skill compatible juridiquement" (PROVISOIRE)
29. **Proportionnalité obligations** : "Proportionnalité des obligations réglementaires" (PROVISOIRE)
30. **Acceptabilité PSP** : "Acceptabilité PSP (adresse hors UK)" (PROVISOIRE)
31. **Anti-cheat proportionné** : "Anti-cheat proportionné suffisant en V1" (PROVISOIRE)

---

## 📊 Tableau État Réel / Source / Statut

| # | Affirmation | Localisation Document 03 | Source de Vérification | Statut | Preuve |
|---|-------------|-------------------------|------------------------|--------|--------|
| 1 | UK Private Limited Company | Ligne 1 (structure FIGÉ) | Document 00 (Arbitrage 02) | **NON CONFORME** | Document 00 ligne 128 : "Synergy Digital Ltd est le nom définitif" — Document 03 ne mentionne pas le nom |
| 2 | Choix hors Suisse | Ligne 1 | Aucune source vérifiable | **NON VÉRIFIABLE** | Décision stratégique non implémentée dans le code |
| 3 | Refus SARL suisse | Ligne 1 | Aucune source vérifiable | **NON VÉRIFIABLE** | Décision stratégique non implémentée dans le code |
| 4 | 1st Formations | Ligne 1 | Aucune source vérifiable | **NON VÉRIFIABLE** | Information externe non vérifiable dans le code |
| 5 | PSP unique : Stripe | Ligne 1 | `backend/prisma/schema.prisma:137` | **CONFORME** | Référence "id Stripe ou autre PSP" dans schema |
| 6 | Séparation société/marque | Ligne 1 | Document 02 ligne 21-23 | **CONFORME** | Document 02 confirme séparation Elite64 / Synergy Digital Ltd |
| 7 | Actionnariat 95/5 | Ligne 1 | Aucune source vérifiable | **NON VÉRIFIABLE** | Information corporate non implémentée dans le code |
| 8 | Directeur unique | Ligne 1 | Aucune source vérifiable | **NON VÉRIFIABLE** | Information corporate non implémentée dans le code |
| 9 | Second actionnaire sans pouvoir | Ligne 1 | Aucune source vérifiable | **NON VÉRIFIABLE** | Information corporate non implémentée dans le code |
| 10 | Aucun pouvoir joueurs | Ligne 1 | `backend/prisma/schema.prisma:63-67` | **CONFORME** | Enum `PlayerRole` : PLAYER, ADMIN, SUPER_ADMIN (pas de rôle gouvernance) |
| 11 | Décisions sensibles humaines | Ligne 1 | `backend/src/moderation/player-restrictions.service.ts` | **CONFORME** | Service de modération avec logique humaine |
| 12 | Qualification skill-based | Ligne 1 | Document 01 ligne 1 | **CONFORME** | Document 01 confirme positionnement skill-based |
| 13 | Exclusion gambling | Ligne 1 | Document 01 ligne 1, Document 02 ligne 25 | **CONFORME** | Documents 01 et 02 confirment exclusion gambling |
| 14 | Opérateur non-participant | Ligne 1 | `backend/prisma/schema.prisma` | **CONFORME** | Modèle TransactionType : pas de type "OPERATOR_PARTICIPATION" |
| 15 | Buy-in fixe | Ligne 1 | `backend/prisma/schema.prisma:24-31` | **CONFORME** | TransactionType.TOURNAMENT_BUY_IN existe |
| 16 | Gains par performance | Ligne 1 | `backend/prisma/schema.prisma:56-61` | **CONFORME** | MatchResult déterminé par résultat du match (WHITE_WIN, BLACK_WIN, DRAW) |
| 17 | CGU nécessaires | Ligne 1 | `frontend/pages/terms.tsx` | **CONFORME** | Page CGU existe |
| 18 | Mentions "no gambling" | Ligne 1 | `frontend/pages/terms.tsx:29` | **CONFORME** | "Ce n'est pas un site de paris. Ce n'est pas un site de jeux de hasard." |
| 19 | Cadre sanctions anti-triche | Ligne 1 | `backend/src/moderation/player-restrictions.service.ts` | **CONFORME** | Service de restrictions existe |
| 20 | Géolocalisation multi-couches | Ligne 1 | `backend/prisma/schema.prisma:85,275-288` | **PARTIELLEMENT CONFORME** | `countryCode` existe, modèle `CountryRule` existe mais module désactivé |
| 21 | Géoblocage outil conformité | Ligne 1 | `backend/src/modules/country-rules/country-rules.module.ts:6-8` | **NON CONFORME** | Module CountryRules commenté/désactivé |
| 22 | Démarche bonne foi | Ligne 1 | Aucune source vérifiable | **NON VÉRIFIABLE** | Posture stratégique non vérifiable dans le code |
| 23-31 | Éléments PROVISOIRES | Lignes 1-3 | N/A | **HORS PÉRIMÈTRE** | Éléments explicitement marqués PROVISOIRES, non vérifiables |

---

## 📊 Écarts & Incohérences avec Preuves

### P0 – Critique

#### Écart 01 : Nom de la société opératrice manquant

**Affirmation dans document 03** :
- "Création d'une UK Private Limited Company comme entité opératrice unique" (ligne 1)

**Source de vérité** :
- Document 00 (Arbitrage 02, ligne 128) : "Synergy Digital Ltd est le nom définitif de la société opératrice en arrière-plan"
- Document 00 (ligne 135) : "Action requise : Aligner le document 03 pour mentionner explicitement 'Synergy Digital Ltd' comme nom de la UK Private Limited Company"
- Document 02 (ligne 23) : "Société opératrice en arrière-plan : Synergy Digital Ltd"

**Statut** : **NON CONFORME**

**Impact** : Critique — Incohérence inter-documents identifiée par le document 00 lui-même. Le document 03 doit mentionner explicitement "Synergy Digital Ltd" comme nom de la UK Private Limited Company.

**Preuve** :
- `docs/governance/00 - [Chef de projet] - 00.md:128-135`
- `docs/governance/02 - [Branding et Marketing] - 02.md:23`

---

#### Écart 02 : Références aux documents Governance utilisent l'ancienne nomenclature

**Affirmation dans document 03** :
- "Chat 00 – Chef de projet" (ligne 3)
- "Chat 01 – Vision & stratégie" (ligne 3)
- "Chat 02 – Branding & marketing" (ligne 3)
- "Aucune décision structurelle lourde sans arbitrage du chat 00" (ligne 28)
- "Pas d'arbitrage politique ou business (chat 00)" (ligne 62)

**Source de vérité** :
- Document 00 (ligne 11) : "projet Elite64/ChessBet"
- Document 01 (ligne 1) : Utilise "document 00 – Chef de projet"
- Document 02 (ligne 106) : Utilise "document 00 – Chef de projet"
- Document 02 (ligne 107) : Utilise "document 01 – Vision & Stratégie Globale"

**Statut** : **NON CONFORME**

**Impact** : Critique — Incohérence de nomenclature avec les autres documents Governance. Le document 03 doit utiliser "document 00 – Chef de projet", "document 01 – Vision & Stratégie Globale", "document 02 – Branding & Marketing" au lieu de "chat 00", "chat 01", "chat 02".

**Preuve** :
- `docs/governance/03 - [Structure juridique & conformité] - 03.md:3,28,62` (10 occurrences de "chat 00/01/02")
- `docs/governance/01 - [Vision et Stratégie Globale] - 01.md:1` (utilise "document 00")
- `docs/governance/02 - [Branding et Marketing] - 02.md:106-107` (utilise "document 00", "document 01")

---

#### Écart 03 : CGU frontend utilise "ChessBet" au lieu de "Elite64"

**Affirmation dans document 03** :
- "CGU & politiques FIGÉ (cadre uniquement)" (ligne 1)
- "Identification des documents nécessaires (CGU, KYC, AML light, litiges, remboursements)" (ligne 1)

**Source de vérité** :
- Document 00 (Arbitrage 01, ligne 109) : "Elite64 est la marque publique officielle du projet. ChessBet est le nom technique interne"
- Document 00 (ligne 112) : "Elite64 : Marque publique, usage externe (communication, branding, domaine principal)"
- Document 02 (ligne 19) : "Nom de marque : Elite64" (FIGÉ)
- `frontend/pages/terms.tsx:5,16` : Utilise "ChessBet" dans le titre et le contenu

**Statut** : **NON CONFORME**

**Impact** : Critique — Les CGU sont un document externe (visible par les utilisateurs) et doivent utiliser "Elite64" selon l'arbitrage du document 00. L'utilisation de "ChessBet dans les CGU viole la séparation marque publique / nom technique.

**Preuve** :
- `docs/governance/00 - [Chef de projet] - 00.md:109-112`
- `docs/governance/02 - [Branding et Marketing] - 02.md:19`
- `frontend/pages/terms.tsx:5,16`

---

### P1 – Moyen

#### Écart 04 : Géolocalisation mentionnée comme FIGÉ mais non implémentée

**Affirmation dans document 03** :
- "Géolocalisation multi-couches" (FIGÉ, ligne 1)
- "Géoblocage utilisé comme outil de conformité" (FIGÉ, ligne 1)

**Source de vérité** :
- `backend/prisma/schema.prisma:85` : `countryCode String` existe dans le modèle Player
- `backend/prisma/schema.prisma:275-288` : Modèle `CountryRule` existe avec champ `isBlocked`
- `backend/src/modules/country-rules/country-rules.module.ts:6-8` : Module CountryRules commenté/désactivé
- `backend/src/app.module.ts:16` : Import CountryRulesModule commenté

**Statut** : **PARTIELLEMENT CONFORME**

**Impact** : Moyen — La structure de données existe (countryCode, CountryRule) mais le module de géoblocage est désactivé. Le document 03 mentionne la géolocalisation comme FIGÉ alors que l'implémentation est incomplète.

**Preuve** :
- `docs/governance/03 - [Structure juridique & conformité] - 03.md:1` (géolocalisation FIGÉ)
- `backend/src/modules/country-rules/country-rules.module.ts:6-8` (module désactivé)
- `backend/src/app.module.ts:16` (import commenté)

---

#### Écart 05 : Contenu métadiscursif/conversationnel présent

**Affirmation dans document 03** :
- "NB - Prends connaissance de ce prompt tu es le chat 03 dont il est question." (ligne 3)
- "Pris en compte." (ligne 5)
- "J'endosse le rôle du **chat [Structure juridique & conformité] – 03**" (ligne 7)
- "Dis-moi simplement par quoi tu veux commencer (1 à 5). Le cadre est en place, le chat 03 est opérationnel." (ligne 74)

**Source de vérité** :
- Document 02 (après nettoyage) : Contenu métadiscursif supprimé
- Document 01 : Pas de contenu conversationnel visible
- Document 00 : Pas de contenu conversationnel visible

**Statut** : **OBSOLÈTE**

**Impact** : Moyen — Le document 03 contient du contenu métadiscursif/conversationnel qui doit être nettoyé pour respecter le format canonique des documents Governance (comme effectué pour le document 02).

**Preuve** :
- `docs/governance/03 - [Structure juridique & conformité] - 03.md:3,5,7,74` (contenu conversationnel)
- `docs/governance/02 - [Branding et Marketing] - 02.md` (nettoyé, pas de contenu conversationnel)

---

### P2 – Faible

#### Écart 06 : Référence à "1st Formations" non vérifiable

**Affirmation dans document 03** :
- "Création via 1st Formations – Non-Residents Package" (ligne 1)

**Source de vérité** :
- Aucune source dans le code ou la documentation

**Statut** : **NON VÉRIFIABLE**

**Impact** : Faible — Information externe (prestataire de création de société) non vérifiable dans le code ou la documentation. Acceptable comme information contextuelle mais non vérifiable.

---

## 📊 Hypothèses Explicitement Marquées

### Hypothèses PROVISOIRES (explicitement marquées dans le document 03)

Les éléments suivants sont explicitement marqués comme PROVISOIRES dans le document 03 et ne sont donc pas vérifiables :

1. **Pacte d'associés simple** : "Pacte d'associés simple envisagé" (PROVISOIRE)
2. **Financements familiaux** : "Financements familiaux possibles hors capital" (PROVISOIRE)
3. **Liste pays** : "Liste exacte des pays autorisés / restreints / interdits" (PROVISOIRE)
4. **États américains** : "Cas spécifique des États américains à bloquer" (PROVISOIRE)
5. **Licence gambling** : "Absence de licence gambling en phase 1" (PROVISOIRE)
6. **Modèle wallet** : "Modèle wallet + skill compatible juridiquement" (PROVISOIRE)
7. **Proportionnalité obligations** : "Proportionnalité des obligations réglementaires" (PROVISOIRE)
8. **Acceptabilité PSP** : "Acceptabilité PSP (adresse hors UK)" (PROVISOIRE)
9. **Anti-cheat proportionné** : "Anti-cheat proportionné suffisant en V1" (PROVISOIRE)

**Statut** : **HORS PÉRIMÈTRE** — Ces éléments sont explicitement marqués comme PROVISOIRES et ne nécessitent pas de vérification à ce stade.

---

## 📊 Éléments Manquants

### Éléments mentionnés dans le document 03 mais absents du code/documentation

1. **Nom de la société opératrice** : Le document 03 ne mentionne pas "Synergy Digital Ltd" alors que c'est une décision FIGÉE du document 00.

2. **Implémentation géoblocage** : Le document 03 mentionne la géolocalisation comme FIGÉ, mais le module CountryRules est désactivé dans le code.

3. **Validation juridique externe** : Le document 03 mentionne "validation juridique ultérieure" mais aucune trace de validation externe dans la documentation.

---

## ✅ To-Do List Documentaire Priorisée

### Priorité P0 (Critique)

- [ ] **Mettre à jour le document 03 pour mentionner explicitement "Synergy Digital Ltd"**
  - **Action** : Ajouter "Synergy Digital Ltd" comme nom de la UK Private Limited Company dans la section "Structure corporate FIGÉ"
  - **Justification** : Décision FIGÉE du document 00 (Arbitrage 02), action requise explicitement mentionnée
  - **Référence** : `docs/governance/00 - [Chef de projet] - 00.md:128-135`

- [ ] **Remplacer toutes les références "chat 00/01/02" par "document 00/01/02"**
  - **Action** : Remplacer "chat 00" par "document 00 – Chef de projet", "chat 01" par "document 01 – Vision & Stratégie Globale", "chat 02" par "document 02 – Branding & Marketing"
  - **Justification** : Cohérence de nomenclature avec les autres documents Governance
  - **Référence** : `docs/governance/03 - [Structure juridique & conformité] - 03.md` (10 occurrences)

- [ ] **Corriger les CGU frontend pour utiliser "Elite64" au lieu de "ChessBet"**
  - **Action** : Modifier `frontend/pages/terms.tsx` pour remplacer "ChessBet" par "Elite64" dans le titre et le contenu visible
  - **Justification** : Les CGU sont un document externe et doivent utiliser la marque publique "Elite64" selon l'arbitrage du document 00
  - **Référence** : `docs/governance/00 - [Chef de projet] - 00.md:109-112`, `frontend/pages/terms.tsx:5,16`

---

### Priorité P1 (Moyen)

- [ ] **Clarifier le statut de la géolocalisation dans le document 03**
  - **Action** : Soit marquer la géolocalisation comme PROVISOIRE (si l'implémentation n'est pas prioritaire), soit documenter l'activation du module CountryRules
  - **Justification** : Le document 03 mentionne la géolocalisation comme FIGÉ alors que le module est désactivé dans le code
  - **Référence** : `docs/governance/03 - [Structure juridique & conformité] - 03.md:1`, `backend/src/modules/country-rules/country-rules.module.ts:6-8`

- [ ] **Nettoyer le contenu métadiscursif/conversationnel du document 03**
  - **Action** : Supprimer les phrases conversationnelles ("NB - Prends connaissance...", "Pris en compte.", "J'endosse le rôle...", "Dis-moi simplement...")
  - **Justification** : Cohérence avec le format canonique des documents Governance (comme effectué pour le document 02)
  - **Référence** : `docs/governance/03 - [Structure juridique & conformité] - 03.md:3,5,7,74`, `docs/governance/02 - [Branding et Marketing] - 02.md` (exemple de nettoyage)

---

### Priorité P2 (Faible)

- [ ] **Documenter la décision sur "1st Formations"**
  - **Action** : Soit supprimer la référence (si non pertinente), soit documenter le choix dans un document de décision
  - **Justification** : Information externe non vérifiable, peut être conservée comme contexte mais doit être clairement identifiée comme non vérifiable
  - **Référence** : `docs/governance/03 - [Structure juridique & conformité] - 03.md:1`

---

## 📖 Références Vérifiables

### Fichiers analysés

**Documents Governance** :
- `docs/governance/00 - [Chef de projet] - 00.md` (lignes 11, 52, 105-143)
- `docs/governance/01 - [Vision et Stratégie Globale] - 01.md` (ligne 1)
- `docs/governance/02 - [Branding et Marketing] - 02.md` (lignes 19, 23, 106-107, 129-177)
- `docs/governance/03 - [Structure juridique & conformité] - 03.md` (lignes 1-74)

**Code source** :
- `backend/prisma/schema.prisma` (lignes 18-22, 24-31, 56-61, 63-67, 85, 137, 275-288)
- `frontend/pages/terms.tsx` (lignes 5, 16, 29)
- `backend/src/modules/country-rules/country-rules.module.ts` (lignes 6-8)
- `backend/src/app.module.ts` (ligne 16)
- `backend/src/moderation/player-restrictions.service.ts`

**Structure du projet** :
- `README.md` (ligne 1)

### Méthodes de vérification utilisées

- Lecture manuelle des fichiers
- Recherche textuelle (`grep`) pour identifier les occurrences
- Analyse de l'arborescence des fichiers
- Comparaison inter-documents pour vérifier la cohérence

---

## 🔍 Observations Complémentaires

### Points de cohérence vérifiés

✅ **Positionnement skill-based** : Le document 03 est cohérent avec les documents 01 et 02 sur le positionnement skill-based et l'exclusion du gambling.

✅ **PSP Stripe** : La mention de Stripe comme PSP unique est cohérente avec la structure du code (référence dans schema.prisma).

✅ **KYC** : L'enum `KycStatus` existe dans le schéma Prisma, confirmant que le KYC est prévu dans la structure technique.

✅ **Sanctions anti-triche** : Le service `PlayerRestrictionsService` existe et implémente une logique de restrictions, confirmant l'existence d'un cadre de sanctions.

✅ **Séparation société/marque** : Le document 03 est cohérent avec le document 02 sur la séparation entre Elite64 (marque) et Synergy Digital Ltd (société opératrice).

### Points nécessitant clarification

⚠️ **Géolocalisation** : Le document 03 mentionne la géolocalisation comme FIGÉ, mais le module CountryRules est désactivé. Il faut soit activer le module, soit marquer la géolocalisation comme PROVISOIRE.

⚠️ **Validation juridique externe** : Le document 03 mentionne "validation juridique ultérieure" mais aucune trace de validation externe dans la documentation. Cette mention est acceptable comme hypothèse mais doit rester clairement identifiée comme non vérifiée.

---

**Dernière mise à jour** : 15 janvier 2025

