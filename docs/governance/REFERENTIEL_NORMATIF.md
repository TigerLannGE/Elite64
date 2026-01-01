# Référentiel normatif du projet — Documents 01 à 08

**Date de création** : 01 janvier 2026  
**Dernière mise à jour** : 01 janvier 2026  
**Statut** : ✅ Actif

---

Les documents PDF listés ci-dessous constituent la **SOURCE DE VÉRITÉ** stratégique, juridique, produit, financière, technique et opérationnelle du projet.

Ils sont considérés comme **normatifs et opposables** à l'ensemble du code, de la documentation et des configurations du repository.

**Aucune décision figurant dans ces documents ne peut être modifiée, interprétée ou contournée sans arbitrage explicite hors de ce repository.**

---

## 📋 Liste officielle des documents normatifs

### 01 — Vision et Stratégie Globale

**Rôle :**
- Définit la vision macro du projet.
- Fixe le positionnement stratégique (skill-based, non-gambling).
- Cadre le périmètre du lancement et la logique de déploiement par phases.

**Autorité :**
- Toute décision stratégique, de périmètre ou d'orientation produit doit être conforme à ce document.

**Fichier :** `reference_01_08/01 - [Vision et Stratégie Globale] - 01.pdf`

---

### 02 — Branding et Marketing

**Rôle :**
- Définit l'identité de marque officielle.
- Fixe le nom du produit (Elite64), le domaine principal (elite64.app), le positionnement marketing et le lexique autorisé.
- Exclut explicitement tout imaginaire ou wording gambling.

**Autorité :**
- Toute occurrence de nom, wording, terminologie, message public, UI textuelle, documentation, emails ou logs visibles doit être conforme à ce document.

**Fichier :** `reference_01_08/02 - [Branding et Marketing] - 02.pdf`

---

### 03 — Structure juridique & conformité

**Rôle :**
- Définit la structure corporate.
- Qualifie juridiquement le produit (strictement skill-based).
- Pose le cadre de conformité réglementaire (KYC, AML light, sanctions, géoblocage).

**Autorité :**
- Toute implémentation ayant un impact légal, réglementaire ou PSP doit être conforme à ce document.

**Fichier :** `reference_01_08/03 - [Structure juridique & conformité] - 03.pdf`

---

### 04 — Finance & paiements

**Rôle :**
- Définit le modèle économique.
- Fixe les flux financiers, la structure des frais, la séparation fonds joueurs / fonds plateforme, la logique de wallets et de reconnaissance du chiffre d'affaires.

**Autorité :**
- Toute implémentation financière, comptable ou liée aux paiements doit être strictement conforme à ce document.

**Fichier :** `reference_01_08/04 - [Finance & paiements] - 04.pdf`

---

### 05 — Produit & expérience utilisateur

**Rôle :**
- Définit le parcours joueur visible.
- Fixe les règles de tournois, de DRAW, de tie-breaks, la gestion des annulations, remboursements et litiges côté joueur.
- Cadre strictement le périmètre MVP.

**Autorité :**
- Toute logique produit visible par l'utilisateur doit être conforme à ce document.

**Fichier :** `reference_01_08/05 - [Produit & expérience utilisateur] - 05.pdf`

---

### 06 — Technique

**Rôle :**
- Définit l'architecture technique de référence.
- Fixe les choix structurants backend / frontend, le phasage d'implémentation et les éléments explicitement hors périmètre.

**Autorité :**
- Toute implémentation technique doit respecter l'architecture, les contraintes et les gels définis ici.

**Fichier :** `reference_01_08/06 - [Technique] - 06.pdf`

---

### 07 — Exploitation & opérations

**Rôle :**
- Définit l'organisation opérationnelle en phase 1.
- Cadre le support joueur, la gestion des litiges, le monitoring fraude et le reporting opérationnel.

**Autorité :**
- Toute procédure opérationnelle ou logique de support doit être conforme à ce document.

**Fichier :** `reference_01_08/07 - [Exploitation & opérations] - 07.pdf`

---

### 08 — Financement & trajectoire capitalistique

**Rôle :**
- Définit la stratégie de financement.
- Fixe la discipline capitalistique (bootstrap, refus de levée dilutive précoce).
- Cadre les critères de déclenchement d'une levée future.

**Autorité :**
- Toute documentation ou décision impactant la trajectoire financière doit être conforme à ce document.

**Fichier :** `reference_01_08/08 - [Financement & trajectoire capitalistique] - 08.pdf`

---

## ⚖️ Règles impératives d'interprétation

1. **Les décisions marquées FIGÉES** dans les documents 01 à 08 sont **NON NÉGOCIABLES**.
2. **Les éléments PROVISOIRES** peuvent être signalés, jamais tranchés.
3. **Toute divergence** entre le code / la documentation et ces documents doit être listée comme :
   - **ADAPTATION OBLIGATOIRE (P0)**, ou
   - **ADAPTATION RECOMMANDÉE (P1)**.
4. **Aucune refonte stratégique, produit ou business** n'est autorisée.
5. **Les documents 01 à 08 priment systématiquement** sur l'existant du repository.
6. **Les amendements** au référentiel normatif sont documentés dans `AMENDEMENTS/` et **font foi** une fois approuvés.

---

## 📜 Amendements au Référentiel Normatif

Les amendements modifient explicitement le référentiel normatif (documents 01-08) et sont opposables au même titre que les documents originaux.

### Amendement Finance : Prélèvement Opérateur 9,75% (01/01/2026)

**Document concerné** : 04 — Finance & paiements  
**Statut** : ✅ **FAIT FOI** — Approuvé et implémenté

**Résumé** : Établit explicitement un prélèvement opérateur total de 9,75% avec décomposition claire (commission plateforme 5% + frais d'organisation 4,75%).

**Document complet** : [`AMENDEMENTS/AMENDEMENT_FINANCE_PRELEVEMENT_9_75_2026-01-01.md`](./AMENDEMENTS/AMENDEMENT_FINANCE_PRELEVEMENT_9_75_2026-01-01.md)

---

## 🎯 Objectif des audits de convergence

Les audits réalisés dans ce repository doivent :

- Identifier précisément les écarts entre implémentation et décisions 01–08.
- Lister exhaustivement les adaptations obligatoires.
- Compléter la documentation stratégique par des informations d'implémentation utiles, sans modifier les décisions existantes.

---

## 📁 Structure des dossiers

```
docs/governance/
├── REFERENTIEL_NORMATIF.md          ← Ce document
├── reference_01_08/                 ← PDFs bruts (01 à 08)
│   ├── 01 - [Vision et Stratégie Globale] - 01.pdf
│   ├── 02 - [Branding et Marketing] - 02.pdf
│   ├── 03 - [Structure juridique & conformité] - 03.pdf
│   ├── 04 - [Finance & paiements] - 04.pdf
│   ├── 05 - [Produit & expérience utilisateur] - 05.pdf
│   ├── 06 - [Technique] - 06.pdf
│   ├── 07 - [Exploitation & opérations] - 07.pdf
│   └── 08 - [Financement & trajectoire capitalistique] - 08.pdf
├── AMENDEMENTS/                     ← Amendements au référentiel normatif
│   └── AMENDEMENT_FINANCE_PRELEVEMENT_9_75_2026-01-01.md
├── audits/                          ← Rapports d'audits de convergence
└── contracts/                       ← Contrats et accords
```

---

## 🔍 Utilisation

### Pour les développeurs
Avant toute implémentation majeure, consulter les documents pertinents dans `reference_01_08/` pour s'assurer de la conformité.

### Pour les audits
1. Identifier le périmètre d'audit (document(s) concerné(s))
2. Analyser le code/documentation existant
3. Comparer avec les décisions normatives
4. Produire un rapport dans `audits/` listant les écarts et adaptations nécessaires

### Pour les décisions stratégiques
Toute décision qui pourrait entrer en conflit avec les documents 01–08 doit être soumise à arbitrage explicite hors repository.

---

**Note importante :** Les PDFs dans `reference_01_08/` sont la source de vérité. Cursor peut les lire et les citer directement pour les audits et vérifications de conformité.

