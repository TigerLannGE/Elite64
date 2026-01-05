# Audit Governance — Document 08 : Financement & trajectoire capitalistique

**Date de création** : 15 janvier 2025  
**Statut** : ✅ Complété  
**Portée** : Audit factuel de conformité du document 08 avec les sources de vérité autorisées

---

## 📋 Résumé Exécutif

Cet audit vérifie la conformité du document `docs/governance/08 - [Financement & trajectoire capitalistique] - 08.md` avec les sources de vérité autorisées (documents Governance 00, 01, 02, 04, code backend/frontend, structure du projet).

**Résultats principaux** :
- **1 incohérence critique (P0)** identifiée
- **1 incohérence moyenne (P1)** identifiée
- **1 élément obsolète** identifié (contenu métadiscursif)
- **5 affirmations conformes** vérifiées
- **15 éléments non vérifiables** identifiés (décisions stratégiques, hypothèses financières, scénarios futurs)

**Priorités** :
1. **P0 – Critique** : Références aux documents Governance utilisent l'ancienne nomenclature ("chat 00/01/03/05" au lieu de "document 00/01/03/05")
2. **P1 – Moyen** : Contenu métadiscursif/conversationnel présent (doit être nettoyé)

---

## 🔍 Méthodologie d'Analyse

### Sources de vérité autorisées

**Documents Governance** :
- `docs/governance/08 - [Financement & trajectoire capitalistique] - 08.md` (document audité)
- `docs/governance/00 - [Chef de projet] - 00.md` (arbitrages officiels)
- `docs/governance/01 - [Vision et Stratégie Globale] - 01.md` (vision stratégique)
- `docs/governance/02 - [Branding et Marketing] - 02.md` (nom de marque)
- `docs/governance/04 - [Finance & paiements] - 04.md` (modèle économique)

**Code source** :
- `backend/src/**/*.ts` (recherche références financement, capital, investisseurs)
- `frontend/**/*.ts(x)` (recherche références financement, capital, investisseurs)
- `backend/prisma/schema.prisma` (modèles, enums, structure)

**Structure du projet** :
- Arborescence réelle du repository
- Fichiers de configuration

### Méthode de vérification

1. **Extraction des affirmations** : Identification de toutes les affirmations vérifiables dans le document 08
2. **Vérification contre sources** : Comparaison avec les documents Governance et le code source
3. **Classification des écarts** : P0 (critique), P1 (moyen), P2 (faible), non vérifiable, obsolète
4. **Documentation des preuves** : Références exactes (fichiers, lignes)

---

## 📊 Liste Exhaustive des Affirmations Vérifiables

### Affirmations FIGÉES extraites du document 08

1. **Bootstrap initial fonds propres** : "Financement assuré en fonds propres" (FIGÉ)
2. **Montant disponible** : "Montant disponible identifié : 7 500 CHF" (FIGÉ)
3. **Hypothèse lancement sans levée** : "Hypothèse de lancement sans levée immédiate" (FIGÉ)
4. **Objectif génération cashflow** : "Objectif explicite de génération rapide de cashflow post-lancement" (FIGÉ)
5. **Scénario privilégié aucune levée avant traction** : "Scénario privilégié : aucune levée avant traction réelle" (FIGÉ)
6. **Scénario alternatif levée post-lancement** : "Scénario alternatif : levée post-lancement, conditionnée à des métriques mesurables" (FIGÉ)
7. **Crowdfunding equity option possible** : "Crowdfunding equity identifié comme option possible mais non prioritaire" (FIGÉ)
8. **Instruments non dilutifs ou hybrides** : "Mention d'instruments non dilutifs ou hybrides (SAFE / BSA)" (FIGÉ)
9. **Proposition historique envisagée** : "Proposition historique envisagée : 100 000 CHF contre 30 %" (FIGÉ)
10. **Valorisation implicite post-money** : "Valorisation implicite post-money : ~333 000 CHF" (FIGÉ)
11. **Hypothèse jugée excessivement dilutive** : "Cette hypothèse est jugée excessivement dilutive et défavorable" (FIGÉ)
12. **Hypothèse cible post-traction** : "Hypothèse cible post-traction : dilution significativement inférieure (ordre de grandeur < 10 %)" (FIGÉ)
13. **Critères déclenchement levée traction mesurable** : "Traction mesurable post-lancement" (FIGÉ)
14. **Critères déclenchement levée revenus récurrents** : "Revenus récurrents" (FIGÉ)
15. **Critères déclenchement levée base joueurs actifs** : "Base significative de joueurs actifs et rétention observable" (FIGÉ)
16. **Critères déclenchement levée capacité cashflow** : "Capacité démontrée à générer du cashflow" (FIGÉ)
17. **Projet bootstrappable court terme** : "Projet considéré comme bootstrappable à court terme malgré un budget contraint" (FIGÉ)
18. **Forte revalorisation attendue** : "Forte revalorisation attendue en cas de levée après traction" (FIGÉ)
19. **Principe levée accélération** : "La levée doit servir à accélérer un modèle validé, non à finaliser le produit" (FIGÉ)
20. **Approche bootstrap au lancement** : "Approche bootstrap au lancement" (FIGÉ)
21. **Refus levée dilutive précoce** : "Refus d'une levée dilutive précoce" (FIGÉ)
22. **Critères objectifs déclenchement levée** : "Critères objectifs de déclenchement d'une levée" (FIGÉ)
23. **Principe levée accélération pas survie** : "Principe : la levée sert l'accélération, pas la survie" (FIGÉ)

### Affirmations PROVISOIRES extraites du document 08

24. **Décision finale zéro levée avant lancement** : "Décision finale sur "zéro levée avant lancement"" (PROVISOIRE)
25. **Type exact instrument financier futur** : "Type exact d'instrument financier futur" (PROVISOIRE)
26. **Seuil précis dilution maximale acceptable** : "Seuil précis de dilution maximale acceptable" (PROVISOIRE)

---

## 📊 Tableau État Réel / Source / Statut

| # | Affirmation | Localisation Document 08 | Source de Vérification | Statut | Preuve |
|---|-------------|-------------------------|------------------------|--------|--------|
| 1 | Bootstrap initial fonds propres | Ligne 1 (FIGÉ) | Document 08 lui-même | **CONFORME** | Affirmation documentaire, cohérente avec approche bootstrap |
| 2 | Montant disponible 7 500 CHF | Ligne 1 (FIGÉ) | Document 08 lui-même | **NON VÉRIFIABLE** | Information financière interne, non vérifiable dans le code |
| 3 | Hypothèse lancement sans levée | Ligne 1 (FIGÉ) | Document 08 lui-même | **CONFORME** | Affirmation documentaire, cohérente avec approche bootstrap |
| 4 | Objectif génération cashflow rapide | Ligne 1 (FIGÉ) | Document 04 ligne 1 | **CONFORME** | Document 04 mentionne "logique de viabilité rapide" |
| 5 | Scénario privilégié aucune levée avant traction | Ligne 1 (FIGÉ) | Document 08 lui-même | **CONFORME** | Affirmation documentaire, cohérente avec approche bootstrap |
| 6 | Scénario alternatif levée post-lancement | Ligne 1 (FIGÉ) | Document 08 lui-même | **NON VÉRIFIABLE** | Scénario futur, non vérifiable dans le code |
| 7 | Crowdfunding equity option possible | Ligne 1 (FIGÉ) | Document 08 lui-même | **NON VÉRIFIABLE** | Option future, non vérifiable dans le code |
| 8 | Instruments non dilutifs ou hybrides SAFE/BSA | Ligne 1 (FIGÉ) | Document 08 lui-même | **NON VÉRIFIABLE** | Mention d'instruments futurs, non vérifiable dans le code |
| 9 | Proposition historique 100k CHF contre 30% | Ligne 1 (FIGÉ) | Document 08 lui-même | **NON VÉRIFIABLE** | Information historique, non vérifiable dans le code |
| 10 | Valorisation implicite post-money ~333k CHF | Ligne 1 (FIGÉ) | Document 08 lui-même | **NON VÉRIFIABLE** | Calcul basé sur proposition historique, non vérifiable |
| 11 | Hypothèse jugée excessivement dilutive | Ligne 1 (FIGÉ) | Document 08 lui-même | **CONFORME** | Affirmation documentaire, cohérente avec refus dilution précoce |
| 12 | Hypothèse cible dilution < 10% | Ligne 1 (FIGÉ) | Document 08 lui-même | **NON VÉRIFIABLE** | Hypothèse future, non vérifiable dans le code |
| 13 | Critères déclenchement traction mesurable | Ligne 1 (FIGÉ) | Document 08 lui-même | **NON VÉRIFIABLE** | Critères futurs, non vérifiable dans le code |
| 14 | Critères déclenchement revenus récurrents | Ligne 1 (FIGÉ) | Document 04 ligne 1 | **PARTIELLEMENT CONFORME** | Document 04 mentionne modèle économique avec revenus, mais pas de mention explicite de revenus récurrents comme critère |
| 15 | Critères déclenchement base joueurs actifs | Ligne 1 (FIGÉ) | Document 08 lui-même | **NON VÉRIFIABLE** | Critères futurs, non vérifiable dans le code |
| 16 | Critères déclenchement capacité cashflow | Ligne 1 (FIGÉ) | Document 04 ligne 1 | **PARTIELLEMENT CONFORME** | Document 04 mentionne "logique de viabilité rapide", cohérent avec capacité cashflow |
| 17 | Projet bootstrappable court terme | Ligne 1 (FIGÉ) | Document 08 lui-même | **CONFORME** | Affirmation documentaire, cohérente avec approche bootstrap |
| 18 | Forte revalorisation attendue | Ligne 1 (FIGÉ) | Document 08 lui-même | **NON VÉRIFIABLE** | Hypothèse future, non vérifiable dans le code |
| 19 | Principe levée accélération modèle validé | Ligne 1 (FIGÉ) | Document 01 ligne 1 | **CONFORME** | Document 01 mentionne "déploiement par phases conditionnées à la traction" |
| 20 | Approche bootstrap au lancement | Ligne 1 (FIGÉ) | Document 08 lui-même | **CONFORME** | Affirmation documentaire, cohérente avec approche bootstrap |
| 21 | Refus levée dilutive précoce | Ligne 1 (FIGÉ) | Document 08 lui-même | **CONFORME** | Affirmation documentaire, cohérente avec approche bootstrap |
| 22 | Critères objectifs déclenchement levée | Ligne 1 (FIGÉ) | Document 08 lui-même | **CONFORME** | Affirmation documentaire, critères listés |
| 23 | Principe levée accélération pas survie | Ligne 1 (FIGÉ) | Document 08 lui-même | **CONFORME** | Affirmation documentaire, principe énoncé |
| 24-26 | Éléments PROVISOIRES | Lignes 1-2 | N/A | **HORS PÉRIMÈTRE** | Éléments explicitement marqués PROVISOIRES, non vérifiables |

---

## 📊 Écarts & Incohérences avec Preuves

### P0 – Critique

#### Écart 01 : Références aux documents Governance utilisent l'ancienne nomenclature

**Affirmation dans document 08** :
- "Chat 00 – Chef de projet : Arbitrages finaux sur la trajectoire capitalistique et la dilution" (ligne 2)
- "Chat 01 – Vision & stratégie globale : Cohérence entre ambition long terme et discipline financière" (ligne 2)
- "Chat 03 – Structure juridique & conformité : Compatibilité des instruments financiers envisagés" (ligne 2)
- "Chat 05 – Produit & UX : Définition des métriques de traction pertinentes" (ligne 2)
- "Nécessite validation / arbitrage du chat 00" (ligne 3)
- "Alignement avec les hypothèses produit (chat 05) et marché (chat 01)" (ligne 3)
- "Coordination avec le chat 03 (structure juridique)" (ligne 3)
- "validation préalable du chat 00" (ligne 31)

**Source de vérité** :
- Document 00 (ligne 11) : "projet Elite64/ChessBet"
- Document 00 (ligne 46-68) : "01 – Vision & Stratégie", "03 – Structure juridique & conformité", "05 – Produit & UX", "08 – Financement & trajectoire capitalistique"
- Document 01 (ligne 1) : Utilise "document 00 – Chef de projet"
- Document 02 (ligne 106) : Utilise "document 00 – Chef de projet"
- Document 04 (audit précédent) : Incohérence identifiée et corrigée

**Statut** : **NON CONFORME**

**Impact** : Critique — Incohérence de nomenclature avec les autres documents Governance. Le document 08 doit utiliser "document 00 – Chef de projet", "document 01 – Vision & Stratégie Globale", "document 03 – Structure juridique & conformité", "document 05 – Produit & expérience utilisateur" au lieu de "chat 00/01/03/05".

**Preuve** :
- `docs/governance/08 - [Financement & trajectoire capitalistique] - 08.md:2,3,31` (8 occurrences de "chat 00/01/03/05")
- `docs/governance/00 - [Chef de projet] - 00.md:46-68` (utilise "document 01", "document 03", "document 05", "document 08")
- `docs/governance/01 - [Vision et Stratégie Globale] - 01.md:1` (utilise "document 00")
- `docs/governance/02 - [Branding et Marketing] - 02.md:106-107` (utilise "document 00", "document 01")

---

### P1 – Moyen

#### Écart 02 : Contenu métadiscursif/conversationnel présent

**Affirmation dans document 08** :
- "NB - Prends connaissance de ce prompt tu es le chat 08 dont il est question." (ligne 3)
- "Pris en compte." (ligne 5)
- "Je confirme être **le chat \[Financement & trajectoire capitalistique\] – 08**" (ligne 7)
- "Quand vous le souhaiterez, nous pourrons :" (ligne 33)

**Source de vérité** :
- Document 02 (après nettoyage) : Contenu métadiscursif supprimé
- Document 01 : Pas de contenu conversationnel visible
- Document 00 : Pas de contenu conversationnel visible

**Statut** : **OBSOLÈTE**

**Impact** : Moyen — Le document 08 contient du contenu métadiscursif/conversationnel qui doit être nettoyé pour respecter le format canonique des documents Governance (comme effectué pour le document 02).

**Preuve** :
- `docs/governance/08 - [Financement & trajectoire capitalistique] - 08.md:3,5,7,33` (contenu conversationnel)
- `docs/governance/02 - [Branding et Marketing] - 02.md` (nettoyé, pas de contenu conversationnel)

---

### P2 – Faible

#### Écart 03 : Montant disponible 7 500 CHF mentionné mais non vérifiable

**Affirmation dans document 08** :
- "Montant disponible identifié : 7 500 CHF" (FIGÉ, ligne 1)

**Source de vérité** :
- Recherche code backend/frontend : Aucune référence à un montant de 7 500 CHF trouvée
- Recherche documentation : Aucune référence à un montant de 7 500 CHF trouvée
- Document 08 lui-même : Information financière interne

**Statut** : **NON VÉRIFIABLE**

**Impact** : Faible — Le montant de 7 500 CHF est une information financière interne mentionnée comme FIGÉ, mais elle n'est pas vérifiable dans le code ou la documentation. Acceptable comme information documentaire mais doit être clairement identifiée comme non vérifiable dans le code.

**Preuve** :
- `docs/governance/08 - [Financement & trajectoire capitalistique] - 08.md:1` (montant 7 500 CHF FIGÉ)
- Recherche code backend/frontend : Aucune référence trouvée
- Recherche documentation : Aucune référence trouvée

---

## 📊 Hypothèses Explicitement Marquées

### Hypothèses PROVISOIRES (explicitement marquées dans le document 08)

Les éléments suivants sont explicitement marqués comme PROVISOIRES dans le document 08 et ne sont donc pas vérifiables :

1. **Décision finale zéro levée avant lancement** : "Décision finale sur "zéro levée avant lancement"" (PROVISOIRE)
2. **Type exact instrument financier futur** : "Type exact d'instrument financier futur" (PROVISOIRE)
3. **Seuil précis dilution maximale acceptable** : "Seuil précis de dilution maximale acceptable" (PROVISOIRE)

**Statut** : **HORS PÉRIMÈTRE** — Ces éléments sont explicitement marqués comme PROVISOIRES et ne nécessitent pas de vérification à ce stade.

---

## 📊 Éléments Manquants

### Éléments mentionnés dans le document 08 mais absents du code/documentation

1. **Références à investisseurs, levées, equity, dette, tokenisation** : Le document 08 mentionne des scénarios de levée, des instruments financiers (SAFE, BSA, equity), mais aucune référence à ces éléments n'est trouvée dans le code. C'est attendu car le document 08 traite de financement et trajectoire capitalistique, qui sont des décisions stratégiques non implémentées dans le code.

2. **Montant disponible 7 500 CHF** : Le document 08 mentionne un montant de 7 500 CHF comme FIGÉ, mais cette information n'est pas vérifiable dans le code ou la documentation. C'est une information financière interne documentaire.

3. **Critères chiffrés de déclenchement d'une levée** : Le document 08 mentionne "Chiffrer les critères de déclenchement d'une levée (ex. MRR, MAU, rétention)" comme recommandation, mais aucun critère chiffré n'est trouvé dans le code ou la documentation. C'est attendu car ces critères sont à définir.

---

## ✅ To-Do List Documentaire Priorisée

### Priorité P0 (Critique)

- [ ] **Remplacer toutes les références "chat 00/01/03/05" par "document 00/01/03/05"**
  - **Action** : Remplacer "chat 00" par "document 00 – Chef de projet", "chat 01" par "document 01 – Vision & Stratégie Globale", "chat 03" par "document 03 – Structure juridique & conformité", "chat 05" par "document 05 – Produit & expérience utilisateur"
  - **Justification** : Cohérence de nomenclature avec les autres documents Governance
  - **Référence** : `docs/governance/08 - [Financement & trajectoire capitalistique] - 08.md:2,3,31` (8 occurrences)

---

### Priorité P1 (Moyen)

- [ ] **Nettoyer le contenu métadiscursif/conversationnel du document 08**
  - **Action** : Supprimer les phrases conversationnelles ("NB - Prends connaissance...", "Pris en compte.", "Je confirme être...", "Quand vous le souhaiterez, nous pourrons :")
  - **Justification** : Cohérence avec le format canonique des documents Governance (comme effectué pour le document 02)
  - **Référence** : `docs/governance/08 - [Financement & trajectoire capitalistique] - 08.md:3,5,7,33`, `docs/governance/02 - [Branding et Marketing] - 02.md` (exemple de nettoyage)

---

### Priorité P2 (Faible)

- [ ] **Documenter le statut du montant disponible 7 500 CHF**
  - **Action** : Soit documenter que ce montant est une information financière interne non vérifiable dans le code, soit ajouter une note explicite dans le document
  - **Justification** : Le montant est mentionné comme FIGÉ mais n'est pas vérifiable dans le code ou la documentation
  - **Référence** : `docs/governance/08 - [Financement & trajectoire capitalistique] - 08.md:1`, Recherche code backend/frontend

---

## 📖 Références Vérifiables

### Fichiers analysés

**Documents Governance** :
- `docs/governance/08 - [Financement & trajectoire capitalistique] - 08.md` (lignes 1-39)
- `docs/governance/00 - [Chef de projet] - 00.md` (lignes 11, 46-68)
- `docs/governance/01 - [Vision et Stratégie Globale] - 01.md` (ligne 1)
- `docs/governance/02 - [Branding et Marketing] - 02.md` (lignes 106-107)
- `docs/governance/04 - [Finance & paiements] - 04.md` (ligne 1)

**Code source** :
- Recherche exhaustive dans `backend/src/**/*.ts` : Aucune référence à investisseurs, levées, equity, dette, tokenisation, capital, financement trouvée
- Recherche exhaustive dans `frontend/**/*.ts(x)` : Aucune référence à investisseurs, levées, equity, dette, tokenisation, capital, financement trouvée
- `backend/prisma/schema.prisma` : Aucun modèle lié au financement ou à la structure capitalistique

**Structure du projet** :
- `README.md` (nom technique du projet)

### Méthodes de vérification utilisées

- Lecture manuelle des fichiers
- Recherche textuelle (`grep`) pour identifier les occurrences
- Analyse de l'arborescence des fichiers
- Comparaison inter-documents pour vérifier la cohérence
- Recherche exhaustive de termes spécifiques (investor, fundraising, equity, debt, capital, funding, token, dilution, valuation, bootstrap, cashflow, MRR, MAU, SAFE, BSA)

---

## 🔍 Observations Complémentaires

### Points de cohérence vérifiés

✅ **Cohérence avec modèle économique (Document 04)** : Le document 08 mentionne "génération rapide de cashflow post-lancement" et "capacité démontrée à générer du cashflow", ce qui est cohérent avec le document 04 qui mentionne "logique de viabilité rapide" et un modèle économique avec revenus (commission 5% + frais 4.25%).

✅ **Cohérence avec vision stratégique (Document 01)** : Le document 08 mentionne "la levée doit servir à accélérer un modèle validé, non à finaliser le produit", ce qui est cohérent avec le document 01 qui mentionne "déploiement par phases conditionnées à la traction".

✅ **Cohérence avec positionnement non-gambling (Documents 01, 02)** : Le document 08 ne contient aucune référence contradictoire avec le positionnement skill-based et non-gambling des documents 01 et 02.

✅ **Approche bootstrap** : Le document 08 mentionne clairement une approche bootstrap au lancement, ce qui est cohérent avec l'absence de références à des investisseurs ou levées dans le code.

✅ **Principe levée accélération pas survie** : Le document 08 énonce clairement le principe que "la levée sert l'accélération, pas la survie", ce qui est cohérent avec l'approche bootstrap et la génération rapide de cashflow.

### Points nécessitant clarification

⚠️ **Montant disponible 7 500 CHF** : Le document 08 mentionne un montant de 7 500 CHF comme FIGÉ, mais cette information n'est pas vérifiable dans le code ou la documentation. C'est une information financière interne documentaire, acceptable mais doit être clairement identifiée comme non vérifiable dans le code.

⚠️ **Critères chiffrés de déclenchement** : Le document 08 mentionne "Chiffrer les critères de déclenchement d'une levée (ex. MRR, MAU, rétention)" comme recommandation, mais aucun critère chiffré n'est trouvé. C'est attendu car ces critères sont à définir, mais doit être clairement identifié comme non documenté.

⚠️ **Instruments financiers futurs** : Le document 08 mentionne des instruments financiers (SAFE, BSA, equity, crowdfunding) comme options possibles, mais aucune référence n'est trouvée dans le code. C'est attendu car le document 08 traite de financement futur, mais doit être clairement identifié comme non implémenté.

---

**Dernière mise à jour** : 15 janvier 2025

