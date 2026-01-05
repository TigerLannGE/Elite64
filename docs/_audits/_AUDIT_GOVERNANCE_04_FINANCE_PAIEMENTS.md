# Audit Governance — Document 04 : Finance & paiements

**Date de création** : 15 janvier 2025  
**Statut** : ✅ Complété  
**Portée** : Audit factuel de conformité du document 04 avec les sources de vérité autorisées

---

## 📋 Résumé Exécutif

Cet audit vérifie la conformité du document `docs/governance/04 - [Finance & paiements] - 04.md` avec les sources de vérité autorisées (documents Governance 00, 01, 02, 03, code backend/frontend, structure du projet).

**Résultats principaux** :
- **2 incohérences critiques (P0)** identifiées
- **3 incohérences moyennes (P1)** identifiées
- **1 élément obsolète** identifié (contenu métadiscursif)
- **12 affirmations conformes** vérifiées
- **8 éléments non vérifiables** identifiés (décisions stratégiques non implémentées)

**Priorités** :
1. **P0 – Critique** : Incohérence entre modèle économique documenté (5% + 4.25% = 9.25%) et implémentation code (5% commission uniquement)
2. **P0 – Critique** : Références aux documents Governance utilisent l'ancienne nomenclature ("chat 00/03" au lieu de "document 00/03")
3. **P1 – Moyen** : Contenu métadiscursif/conversationnel présent (doit être nettoyé)
4. **P1 – Moyen** : Frais d'inscription de 4.25% mentionnés comme FIGÉ mais non implémentés dans le code
5. **P1 – Moyen** : Reconnaissance du CA à l'engagement en tournoi mentionnée comme FIGÉ mais non vérifiable dans le code

---

## 🔍 Méthodologie d'Analyse

### Sources de vérité autorisées

**Documents Governance** :
- `docs/governance/00 - [Chef de projet] - 00.md` (arbitrages officiels)
- `docs/governance/01 - [Vision et Stratégie Globale] - 01.md` (vision stratégique)
- `docs/governance/02 - [Branding et Marketing] - 02.md` (nom de marque)
- `docs/governance/03 - [Structure juridique & conformité] - 03.md` (cadre juridique)

**Code source** :
- `backend/src/modules/prize-pool/prize-pool.service.ts` (calcul prize pool, commission)
- `backend/src/transactions/transactions.service.ts` (gestion transactions)
- `backend/src/wallets/wallets.service.ts` (gestion wallets)
- `backend/prisma/schema.prisma` (modèles, enums, structure)
- `frontend/lib/api.ts` (appels API)
- `frontend/pages/wallet.tsx` (interface wallet)

**Structure du projet** :
- `README.md` (nom technique du projet)

### Méthode de vérification

1. **Extraction des affirmations** : Identification de toutes les affirmations vérifiables dans le document 04
2. **Vérification contre sources** : Comparaison avec les documents Governance et le code source
3. **Classification des écarts** : P0 (critique), P1 (moyen), P2 (faible), non vérifiable, obsolète
4. **Documentation des preuves** : Références exactes (fichiers, lignes)

---

## 📊 Liste Exhaustive des Affirmations Vérifiables

### Affirmations FIGÉES extraites du document 04

1. **Modèle économique** : "Plateforme de tournois d'échecs skill-based"
2. **Accès compétitions** : "Accès aux compétitions via droits d'entrée fixes (buy-in)"
3. **Dépôt préalable** : "Dépôt préalable des fonds sur un wallet interne"
4. **Aucun revenu dépôts** : "Aucun revenu lié aux dépôts ou à l'inscription au compte"
5. **Prize pools fonds tiers** : "Les prize pools sont intégralement constitués à partir des buy-ins et sont des fonds de tiers"
6. **Commission opérateur** : "Commission opérateur – 5 %" (FIGÉ)
7. **Frais d'inscription** : "Frais d'inscription / de tournoi – 4,25 %" (FIGÉ)
8. **Take rate total** : "Take rate total : 9,25 %, avec deux natures économiques distinctes"
9. **Wallet interne** : "Wallet interne par joueur"
10. **Séparation comptable** : "Séparation stricte entre : fonds des joueurs (wallets, prize pools), fonds propres de la plateforme (commission + frais)"
11. **Reconnaissance CA** : "Reconnaissance comptable des revenus uniquement lors de la participation à un tournoi"
12. **Traçabilité** : "Traçabilité complète via ledger transactionnel"
13. **PSP Stripe** : "Stripe utilisé comme PSP principal"
14. **Dépôts** : "Dépôts : Stripe → compte plateforme → crédit wallet"
15. **Tournois** : "Tournois : débit wallet interne, sans appel Stripe"
16. **Retraits** : "Retraits : payouts via Stripe"
17. **Stripe non-intervention** : "Stripe n'intervient pas dans la logique de prize pool ou de commission"

### Affirmations PROVISOIRES extraites du document 04

18. **Banque / EMI** : "Aucune banque ou EMI définitivement sélectionnée" (PROVISOIRE)
19. **Stripe suffisant** : "Stripe jugé suffisant pour le démarrage" (PROVISOIRE)
20. **Besoin banque** : "Besoin identifié à terme d'une banque / EMI compatible plateformes internationales" (PROVISOIRE)
21. **Séparation comptes** : "Séparation attendue entre compte de transit fonds joueurs et compte opérationnel" (PROVISOIRE)
22. **Politique retraits** : "Politique précise sur les frais de retrait" (PROVISOIRE)
23. **Seuils financiers** : "Paramétrage exact des seuils financiers et KYC" (PROVISOIRE)

---

## 📊 Tableau État Réel / Source / Statut

| # | Affirmation | Localisation Document 04 | Source de Vérification | Statut | Preuve |
|---|-------------|-------------------------|------------------------|--------|--------|
| 1 | Modèle skill-based | Ligne 1 | Document 01 ligne 1, Document 03 ligne 1 | **CONFORME** | Documents 01 et 03 confirment positionnement skill-based |
| 2 | Accès via buy-in | Ligne 1 | `backend/prisma/schema.prisma:156` | **CONFORME** | Champ `buyInCents` existe dans modèle Tournament |
| 3 | Dépôt préalable wallet | Ligne 1 | `backend/prisma/schema.prisma:114-128` | **CONFORME** | Modèle Wallet existe avec `balanceCents` |
| 4 | Aucun revenu dépôts | Ligne 1 | `backend/src/transactions/transactions.service.ts` | **CONFORME** | TransactionType.DEPOSIT existe mais pas de commission sur dépôt |
| 5 | Prize pools fonds tiers | Ligne 1 | `backend/src/modules/prize-pool/prize-pool.service.ts:6-7` | **CONFORME** | Calcul prize pool sépare commission et distributable |
| 6 | Commission 5% | Ligne 1 (FIGÉ) | `backend/src/modules/prize-pool/prize-pool.service.ts:6` | **CONFORME** | `COMMISSION_RATE = 0.05` (5%) |
| 7 | Frais 4.25% | Ligne 1 (FIGÉ) | Recherche code backend | **NON CONFORME** | Aucune référence à 4.25% ou frais d'inscription dans le code |
| 8 | Take rate 9.25% | Ligne 1 | Calcul : 5% + 4.25% = 9.25% | **NON CONFORME** | Code implémente seulement 5% commission, pas 4.25% frais |
| 9 | Wallet interne | Ligne 1 | `backend/prisma/schema.prisma:114-128` | **CONFORME** | Modèle Wallet avec relation 1-1 Player |
| 10 | Séparation comptable | Ligne 1 | `backend/src/modules/prize-pool/prize-pool.service.ts:32-39` | **PARTIELLEMENT CONFORME** | Commission séparée mais frais 4.25% non implémentés |
| 11 | Reconnaissance CA tournoi | Ligne 1 (FIGÉ) | Recherche code backend | **NON VÉRIFIABLE** | Logique comptable non implémentée dans le code |
| 12 | Traçabilité ledger | Ligne 1 | `backend/prisma/schema.prisma:130-147` | **CONFORME** | Modèle Transaction avec tous les champs nécessaires |
| 13 | PSP Stripe | Ligne 1 | `backend/prisma/schema.prisma:137` | **CONFORME** | Champ `externalRef` mentionne "id Stripe ou autre PSP" |
| 14 | Dépôts Stripe | Ligne 1 | Recherche code backend | **NON VÉRIFIABLE** | Intégration Stripe non implémentée dans le code analysé |
| 15 | Tournois débit wallet | Ligne 1 | `backend/src/transactions/transactions.service.ts:98-113` | **CONFORME** | `debitWallet` existe pour débit wallet |
| 16 | Retraits Stripe | Ligne 1 | Recherche code backend | **NON VÉRIFIABLE** | Intégration Stripe non implémentée dans le code analysé |
| 17 | Stripe non-intervention | Ligne 1 | `backend/src/modules/prize-pool/prize-pool.service.ts` | **CONFORME** | Calcul prize pool indépendant, pas de référence Stripe |
| 18-23 | Éléments PROVISOIRES | Lignes 1-2 | N/A | **HORS PÉRIMÈTRE** | Éléments explicitement marqués PROVISOIRES, non vérifiables |

---

## 📊 Écarts & Incohérences avec Preuves

### P0 – Critique

#### Écart 01 : Incohérence entre modèle économique documenté et implémentation code

**Affirmation dans document 04** :
- "Deux flux distincts, cumulatifs et obligatoires : Commission opérateur – 5 %" et "Frais d'inscription / de tournoi – 4,25 %" (ligne 1, FIGÉ)
- "Take rate total : 9,25 %" (ligne 1)

**Source de vérité** :
- `backend/src/modules/prize-pool/prize-pool.service.ts:6` : `const COMMISSION_RATE = 0.05; // 5% commission plateforme`
- `backend/src/modules/prize-pool/prize-pool.service.ts:7` : `const REDISTRIBUTION_RATE = 0.95; // 95% du montant après commission va aux joueurs`
- `backend/src/modules/prize-pool/prize-pool.service.ts:32-39` : Calcul implémenté :
  ```typescript
  commissionCents = Math.floor(totalEntriesCents * COMMISSION_RATE); // 5%
  base = totalEntriesCents - commissionCents;
  distributableCents = Math.floor(base * REDISTRIBUTION_RATE); // 95% de la base
  ```
- Recherche exhaustive : Aucune référence à 4.25%, "frais d'inscription", "fees", "FEE" dans le code backend

**Statut** : **NON CONFORME**

**Impact** : Critique — Le document 04 définit deux flux distincts (5% commission + 4.25% frais = 9.25% take rate) comme FIGÉ, mais le code n'implémente que la commission de 5%. Les frais de 4.25% ne sont pas implémentés, ce qui crée une incohérence majeure entre la documentation Governance et l'implémentation technique.

**Preuve** :
- `docs/governance/04 - [Finance & paiements] - 04.md:1` (deux flux FIGÉS)
- `backend/src/modules/prize-pool/prize-pool.service.ts:6-7,32-39` (implémentation 5% uniquement)
- Recherche `grep -r "0\.0425\|4\.25\|frais\|fee\|FEE" backend/src` : Aucun résultat

---

#### Écart 02 : Références aux documents Governance utilisent l'ancienne nomenclature

**Affirmation dans document 04** :
- "Chat 00 – Chef de projet" (ligne 2)
- "Chat 03 – Structure juridique & conformité" (ligne 2)
- "venant du chat 00 (chef de projet)" (ligne 14)
- "destination du chat 00" (ligne 41)
- "soumettre au chat 03" (ligne 54)

**Source de vérité** :
- Document 00 (ligne 11) : "projet Elite64/ChessBet"
- Document 01 (ligne 1) : Utilise "document 00 – Chef de projet"
- Document 02 (ligne 106) : Utilise "document 00 – Chef de projet"
- Document 02 (ligne 107) : Utilise "document 01 – Vision & Stratégie Globale"
- Document 03 : Utilise "chat 00/01/02" (incohérence déjà identifiée dans audit document 03)

**Statut** : **NON CONFORME**

**Impact** : Critique — Incohérence de nomenclature avec les autres documents Governance. Le document 04 doit utiliser "document 00 – Chef de projet", "document 03 – Structure juridique & conformité" au lieu de "chat 00", "chat 03".

**Preuve** :
- `docs/governance/04 - [Finance & paiements] - 04.md:2,14,41,54` (8 occurrences de "chat 00/03")
- `docs/governance/01 - [Vision et Stratégie Globale] - 01.md:1` (utilise "document 00")
- `docs/governance/02 - [Branding et Marketing] - 02.md:106-107` (utilise "document 00", "document 01")

---

### P1 – Moyen

#### Écart 03 : Contenu métadiscursif/conversationnel présent

**Affirmation dans document 04** :
- "NB - Prends connaissance de ce prompt tu es le chat 04 dont il est question." (ligne 3)
- "Pris en compte." (ligne 5)
- "J'opère désormais **strictement comme le chat [Finance & paiements] – 04**" (ligne 7)
- "Dis-moi comment tu souhaites enchaîner." (ligne 50)

**Source de vérité** :
- Document 02 (après nettoyage) : Contenu métadiscursif supprimé
- Document 01 : Pas de contenu conversationnel visible
- Document 00 : Pas de contenu conversationnel visible

**Statut** : **OBSOLÈTE**

**Impact** : Moyen — Le document 04 contient du contenu métadiscursif/conversationnel qui doit être nettoyé pour respecter le format canonique des documents Governance (comme effectué pour le document 02).

**Preuve** :
- `docs/governance/04 - [Finance & paiements] - 04.md:3,5,7,50` (contenu conversationnel)
- `docs/governance/02 - [Branding et Marketing] - 02.md` (nettoyé, pas de contenu conversationnel)

---

#### Écart 04 : Frais d'inscription de 4.25% mentionnés comme FIGÉ mais non implémentés

**Affirmation dans document 04** :
- "Frais d'inscription / de tournoi – 4,25 %" (FIGÉ, ligne 1)
- "Deux flux distincts et cumulatifs : Commission opérateur : **5 %**" et "Frais d'inscription / tournoi : **4,25 %**" (FIGÉ, ligne 24-25)

**Source de vérité** :
- `backend/src/modules/prize-pool/prize-pool.service.ts` : Aucune référence à 4.25% ou frais d'inscription
- Recherche exhaustive : Aucune implémentation des frais de 4.25%

**Statut** : **NON CONFORME**

**Impact** : Moyen — Les frais de 4.25% sont mentionnés comme FIGÉ dans le document 04 mais ne sont pas implémentés dans le code. Cela crée une incohérence entre la documentation et l'implémentation.

**Preuve** :
- `docs/governance/04 - [Finance & paiements] - 04.md:1,24-25` (frais 4.25% FIGÉ)
- `backend/src/modules/prize-pool/prize-pool.service.ts` (pas de frais 4.25%)
- Recherche `grep -r "0\.0425\|4\.25" backend/src` : Aucun résultat

---

#### Écart 05 : Reconnaissance du CA à l'engagement en tournoi mentionnée comme FIGÉ mais non vérifiable

**Affirmation dans document 04** :
- "Reconnaissance comptable des revenus uniquement lors de la participation à un tournoi" (FIGÉ, ligne 1)
- "Reconnaissance du CA **à l'engagement en tournoi**" (FIGÉ, ligne 29)

**Source de vérité** :
- Recherche code backend : Aucune logique comptable de reconnaissance de CA implémentée
- `backend/src/modules/tournaments/tournaments.service.ts` : Gestion des inscriptions mais pas de logique comptable

**Statut** : **NON VÉRIFIABLE**

**Impact** : Moyen — La reconnaissance comptable du CA est mentionnée comme FIGÉ mais n'est pas implémentée dans le code. Cette affirmation est non vérifiable car elle relève de la logique comptable externe (non implémentée dans le code source).

**Preuve** :
- `docs/governance/04 - [Finance & paiements] - 04.md:1,29` (reconnaissance CA FIGÉ)
- Recherche code backend : Aucune logique comptable trouvée

---

### P2 – Faible

#### Écart 06 : Intégration Stripe non vérifiable dans le code

**Affirmation dans document 04** :
- "Dépôts : Stripe → compte plateforme → crédit wallet" (ligne 1)
- "Retraits : payouts via Stripe" (ligne 1)

**Source de vérité** :
- `backend/prisma/schema.prisma:137` : Champ `externalRef String? // id Stripe ou autre PSP plus tard`
- Recherche code backend : Aucune intégration Stripe implémentée (pas de SDK Stripe, pas de webhooks, pas de endpoints Stripe)

**Statut** : **NON VÉRIFIABLE**

**Impact** : Faible — Les flux Stripe sont mentionnés comme FIGÉ mais ne sont pas implémentés dans le code. Acceptable comme architecture prévue mais non vérifiable à ce stade.

---

## 📊 Hypothèses Explicitement Marquées

### Hypothèses PROVISOIRES (explicitement marquées dans le document 04)

Les éléments suivants sont explicitement marqués comme PROVISOIRES dans le document 04 et ne sont donc pas vérifiables :

1. **Banque / EMI** : "Aucune banque ou EMI définitivement sélectionnée" (PROVISOIRE)
2. **Stripe suffisant** : "Stripe jugé suffisant pour le démarrage" (PROVISOIRE)
3. **Besoin banque** : "Besoin identifié à terme d'une banque / EMI compatible plateformes internationales" (PROVISOIRE)
4. **Séparation comptes** : "Séparation attendue entre compte de transit fonds joueurs et compte opérationnel" (PROVISOIRE)
5. **Politique retraits** : "Politique précise sur les frais de retrait" (PROVISOIRE)
6. **Seuils financiers** : "Paramétrage exact des seuils financiers et KYC" (PROVISOIRE)

**Statut** : **HORS PÉRIMÈTRE** — Ces éléments sont explicitement marqués comme PROVISOIRES et ne nécessitent pas de vérification à ce stade.

---

## 📊 Éléments Manquants

### Éléments mentionnés dans le document 04 mais absents du code/documentation

1. **Frais d'inscription de 4.25%** : Le document 04 mentionne les frais de 4.25% comme FIGÉ, mais ils ne sont pas implémentés dans le code.

2. **Reconnaissance comptable du CA** : Le document 04 mentionne la reconnaissance du CA à l'engagement en tournoi comme FIGÉ, mais aucune logique comptable n'est implémentée dans le code.

3. **Intégration Stripe** : Le document 04 mentionne Stripe comme PSP principal avec des flux détaillés, mais l'intégration Stripe n'est pas implémentée dans le code (pas de SDK, pas de webhooks, pas d'endpoints).

---

## ✅ To-Do List Documentaire Priorisée

### Priorité P0 (Critique)

- [ ] **Corriger l'incohérence entre modèle économique documenté et implémentation**
  - **Action** : Soit implémenter les frais de 4.25% dans le code, soit mettre à jour le document 04 pour refléter l'implémentation actuelle (5% commission uniquement)
  - **Justification** : Incohérence majeure entre documentation Governance (9.25% take rate) et implémentation code (5% commission uniquement)
  - **Référence** : `docs/governance/04 - [Finance & paiements] - 04.md:1,24-25`, `backend/src/modules/prize-pool/prize-pool.service.ts:6-7,32-39`

- [ ] **Remplacer toutes les références "chat 00/03" par "document 00/03"**
  - **Action** : Remplacer "chat 00" par "document 00 – Chef de projet", "chat 03" par "document 03 – Structure juridique & conformité"
  - **Justification** : Cohérence de nomenclature avec les autres documents Governance
  - **Référence** : `docs/governance/04 - [Finance & paiements] - 04.md:2,14,41,54` (8 occurrences)

---

### Priorité P1 (Moyen)

- [ ] **Nettoyer le contenu métadiscursif/conversationnel du document 04**
  - **Action** : Supprimer les phrases conversationnelles ("NB - Prends connaissance...", "Pris en compte.", "J'opère désormais...", "Dis-moi comment...")
  - **Justification** : Cohérence avec le format canonique des documents Governance (comme effectué pour le document 02)
  - **Référence** : `docs/governance/04 - [Finance & paiements] - 04.md:3,5,7,50`, `docs/governance/02 - [Branding et Marketing] - 02.md` (exemple de nettoyage)

- [ ] **Clarifier le statut des frais de 4.25%**
  - **Action** : Soit marquer les frais de 4.25% comme PROVISOIRE (si non prioritaire), soit documenter l'implémentation prévue
  - **Justification** : Les frais de 4.25% sont mentionnés comme FIGÉ mais ne sont pas implémentés dans le code
  - **Référence** : `docs/governance/04 - [Finance & paiements] - 04.md:1,24-25`, `backend/src/modules/prize-pool/prize-pool.service.ts`

- [ ] **Clarifier le statut de la reconnaissance comptable du CA**
  - **Action** : Soit marquer comme PROVISOIRE (si logique comptable externe), soit documenter l'implémentation prévue
  - **Justification** : La reconnaissance du CA est mentionnée comme FIGÉ mais n'est pas vérifiable dans le code
  - **Référence** : `docs/governance/04 - [Finance & paiements] - 04.md:1,29`

---

### Priorité P2 (Faible)

- [ ] **Documenter l'état de l'intégration Stripe**
  - **Action** : Soit marquer les flux Stripe comme PROVISOIRE (si non implémentés), soit documenter l'implémentation prévue
  - **Justification** : Les flux Stripe sont mentionnés comme FIGÉ mais ne sont pas implémentés dans le code
  - **Référence** : `docs/governance/04 - [Finance & paiements] - 04.md:1`, `backend/prisma/schema.prisma:137`

---

## 📖 Références Vérifiables

### Fichiers analysés

**Documents Governance** :
- `docs/governance/00 - [Chef de projet] - 00.md` (lignes 11, 55-56)
- `docs/governance/01 - [Vision et Stratégie Globale] - 01.md` (ligne 1)
- `docs/governance/02 - [Branding et Marketing] - 02.md` (lignes 106-107)
- `docs/governance/03 - [Structure juridique & conformité] - 03.md` (ligne 1)
- `docs/governance/04 - [Finance & paiements] - 04.md` (lignes 1-57)

**Code source** :
- `backend/src/modules/prize-pool/prize-pool.service.ts` (lignes 6-7, 32-39)
- `backend/src/transactions/transactions.service.ts` (lignes 1-136)
- `backend/src/wallets/wallets.service.ts`
- `backend/src/modules/tournaments/tournaments.service.ts`
- `backend/prisma/schema.prisma` (lignes 114-147, 156)
- `frontend/lib/api.ts`
- `frontend/pages/wallet.tsx`

**Structure du projet** :
- `README.md` (ligne 1)

### Méthodes de vérification utilisées

- Lecture manuelle des fichiers
- Recherche textuelle (`grep`) pour identifier les occurrences
- Analyse de l'arborescence des fichiers
- Comparaison inter-documents pour vérifier la cohérence
- Recherche exhaustive de termes spécifiques (4.25%, frais, fees, Stripe)

---

## 🔍 Observations Complémentaires

### Points de cohérence vérifiés

✅ **Modèle skill-based** : Le document 04 est cohérent avec les documents 01 et 03 sur le positionnement skill-based.

✅ **Commission 5%** : La commission de 5% est correctement implémentée dans le code (`COMMISSION_RATE = 0.05`).

✅ **Wallet interne** : Le modèle Wallet existe dans le schéma Prisma avec séparation des fonds.

✅ **Traçabilité transactionnelle** : Le modèle Transaction existe avec tous les champs nécessaires pour la traçabilité.

✅ **Séparation commission/distributable** : Le code sépare correctement la commission (5%) du montant distributable (95% de la base).

### Points nécessitant clarification

⚠️ **Frais de 4.25%** : Le document 04 mentionne les frais de 4.25% comme FIGÉ, mais ils ne sont pas implémentés dans le code. Il faut soit les implémenter, soit mettre à jour le document pour refléter l'implémentation actuelle.

⚠️ **Take rate total** : Le document 04 mentionne un take rate total de 9.25% (5% + 4.25%), mais le code n'implémente que 5%. Le take rate réel implémenté est de 5% commission + (100% - 5%) * 5% = 9.75% (si on considère le REDISTRIBUTION_RATE de 0.95), ce qui diffère du 9.25% documenté.

⚠️ **Intégration Stripe** : Le document 04 mentionne Stripe comme PSP principal avec des flux détaillés, mais l'intégration n'est pas implémentée. Acceptable comme architecture prévue mais doit être clairement identifiée comme non implémentée.

---

**Dernière mise à jour** : 15 janvier 2025

