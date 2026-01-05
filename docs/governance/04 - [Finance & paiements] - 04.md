# Finance & paiements – 04

**Rôle** : Référence financière et paiement unique du projet  
**Portée** : Modèle économique, flux financiers, gestion des fonds joueurs, PSP, banques/EMI  
**Statut** : Actif  
**Dernière mise à jour** : 15 janvier 2025

---

## 📋 Vue d'ensemble

Le document 04 – Finance & paiements constitue la référence financière et paiement unique du projet. Il définit le cadre de fonctionnement économique, la nature des flux financiers, la gestion des fonds joueurs, ainsi que les principes d'interaction avec les prestataires de paiement et les établissements financiers.

Son rôle est de :
- Sécuriser la cohérence économique du modèle
- Fournir un cadre clair aux domaines juridique, produit et technique
- Servir de base saine pour l'exécution sans implémentation ni projection

---

## 💰 Modèle économique

### Éléments FIGÉS

- Plateforme de tournois d'échecs skill-based
- Accès aux compétitions via droits d'entrée fixes (buy-in)
- Dépôt préalable des fonds sur un wallet interne
- Aucun revenu lié aux dépôts ou à l'inscription au compte
- Les prize pools sont intégralement constitués à partir des buy-ins et sont des fonds de tiers

---

## 💵 Entrées d'argent

### Structure documentée (statut mixte)

**Commission opérateur – 5 %** (FIGÉ et implémenté)
- Représente le chiffre d'affaires minimum de la plateforme
- Constitue le revenu opérateur principal
- **Statut code** : ✅ Implémenté dans `backend/src/modules/prize-pool/prize-pool.service.ts`

**Frais d'inscription / de tournoi – 4,25 %** (FIGÉ documentaire, ⚠️ NON implémenté)
- Destinés à couvrir les coûts opérationnels (PSP, exploitation, application)
- Peuvent générer un excédent si les coûts sont couverts (objectif assumé)
- **Statut code** : ❌ **NON implémenté** — Aucune référence à 4.25% ou frais d'inscription dans le code backend
- **Statut décisionnel** : ⚠️ **À DÉCIDER** (voir document 00 – Chef de projet, Écart P0-04)
  - **Option A** : Implémenter les frais de 4.25% dans le code (alignement code → documentation)
  - **Option B** : Retirer les frais de 4.25% du document 04 et conserver uniquement la commission de 5% (alignement documentation → code)

**Take rate total documenté** : 9,25 % (5% + 4.25%), avec deux natures économiques distinctes  
**Take rate réel implémenté** : 5% uniquement

---

## 💳 Wallets et séparation comptable

### Éléments FIGÉS

- Wallet interne par joueur
- Séparation stricte entre :
  - Fonds des joueurs (wallets, prize pools)
  - Fonds propres de la plateforme (commission + frais)
- Reconnaissance comptable des revenus uniquement lors de la participation à un tournoi
- Traçabilité complète via ledger transactionnel

---

## 💳 PSP (Stripe) et flux financiers

### Éléments FIGÉS

- Stripe utilisé comme PSP principal
- Dépôts : Stripe → compte plateforme → crédit wallet
- Tournois : débit wallet interne, sans appel Stripe
- Retraits : payouts via Stripe
- Stripe n'intervient pas dans la logique de prize pool ou de commission

---

## 🏦 Banque / EMI

### Éléments PROVISOIRES

- Aucune banque ou EMI définitivement sélectionnée
- Stripe jugé suffisant pour le démarrage
- Besoin identifié à terme d'une banque / EMI compatible plateformes internationales
- Séparation attendue entre compte de transit fonds joueurs et compte opérationnel

---

## 📊 Statut FIGÉ vs PROVISOIRE

### FIGÉ

- Existence de deux flux d'entrée documentés (5 % commission / 4,25 % frais) — **Note** : Seule la commission de 5% est implémentée
- Nature non revenue des prize pools
- Wallet interne et séparation des fonds
- Usage de Stripe comme PSP principal
- Reconnaissance du CA à l'engagement en tournoi

### PROVISOIRE

- Choix final de la banque / EMI
- Politique précise sur les frais de retrait
- Paramétrage exact des seuils financiers et KYC

---

## 📊 Analyse stratégique

### Forces

- Modèle économique clair, lisible et non ambigu juridiquement
- Séparation nette entre revenus opérateur et fonds joueurs
- Take rate structuré permettant une rentabilité progressive
- Architecture financière compatible avec une montée en charge internationale
- CA minimum sécurisé indépendamment de l'optimisation des coûts

### Faiblesses / limites

- Dépendance forte initiale à Stripe
- Banque / EMI non encore sécurisée
- Traitement comptable précis des frais encore à formaliser
- Arbitrages restants pouvant bloquer certaines implémentations
- **Incohérence** : Frais de 4.25% documentés mais non implémentés (voir Écarts connus)

### Opportunités d'amélioration

- Optimisation des frais PSP avec le volume
- Clarification comptable des frais pour maximiser la lisibilité financière
- Mise en place d'indicateurs de marge sur les frais d'inscription
- Renforcement de la robustesse bancaire à moyen terme

### Risques principaux

- Blocage ou retard lié à l'ouverture bancaire / EMI
- Incohérence si les frais ne sont pas correctement distingués comptablement
- Risque opérationnel si les seuils financiers ne sont pas bien calibrés
- Dépendance à un PSP unique en phase initiale

---

## 💡 Recommandations stratégiques

- Geler définitivement la structure à deux flux (5 % / 4,25 %) → **Note** : Nécessite décision sur implémentation (voir Écarts connus)
- Formaliser le traitement comptable des frais d'inscription → Recommandation nécessitant validation finale avec le document 03 – Structure juridique & conformité
- Sécuriser une option bancaire / EMI de repli → Prioritaire pour éviter toute dépendance bloquante à Stripe
- Définir une politique claire de frais de retrait → Arbitrage à remonter au document 00 – Chef de projet si impact stratégique

---

## ✅ Todo list structurée

### Priorité immédiate (bloquant / critique)

- **Décision requise** : Implémenter les frais de 4.25% (Option A) ou retirer du document (Option B) — voir document 00 – Chef de projet, Écart P0-04
- Geler officiellement la version Finance & paiements v1
- Valider le traitement comptable distinct commission / frais
- Clarifier la politique de frais de retrait

### Priorité court terme

- Identifier et qualifier 1–2 banques / EMI compatibles
- Définir les seuils de dépôt, retrait et KYC
- Aligner Finance 04 avec Juridique 03 sur les fonds de tiers

### Priorité moyen terme

- Préparer des scénarios d'optimisation des frais PSP
- Structurer le reporting interne des flux financiers

### Optionnel / évolutif

- Étudier un PSP alternatif ou secondaire
- Ajuster la structure des frais selon les volumes

---

## 🔗 Dépendances et interactions

### Interactions fortes

- **Document 00 – Chef de projet** : Arbitrages finaux (frais, politique retraits)
- **Document 03 – Structure juridique & conformité** : Qualification fonds de tiers, KYC/AML
- **Document 06 – Technique** : Implémentation conforme des wallets et flux
- **Document 07 – Exploitation & opérations** : Support, litiges, gestion des retraits

### Dépendances critiques

- Validation juridique des flux
- Faisabilité bancaire / EMI
- **Décision sur frais 4.25%** (voir Écarts connus)

---

## 📈 Indicateurs de complétion

### Prêt pour lancement

- Deux flux financiers distincts figés et documentés
- PSP opérationnel
- Politique de retraits et seuils définis
- Séparation comptable validée
- **Décision sur frais 4.25%** (Option A ou B)

### Prêt pour phase suivante

- Banque / EMI sécurisée
- Reporting financier opérationnel
- Optimisation des coûts PSP enclenchée

---

## 📝 Écarts connus

### Écart P0-04 : Frais 4.25% documentés mais non implémentés

**Statut** : ⚠️ **À DÉCIDER** — Le document 04 définit deux flux distincts (5% commission + 4.25% frais = 9.25% take rate) comme FIGÉ, mais le code n'implémente que la commission de 5%.

**Source** : Document 00 – Chef de projet, Écart P0-04

**Options** :
- **Option A** : Implémenter les frais de 4.25% dans le code (alignement code → documentation)
- **Option B** : Retirer les frais de 4.25% du document 04 et conserver uniquement la commission de 5% (alignement documentation → code)

**Impact** : Modèle économique et viabilité financière

**Action** : Décision requise avant implémentation ou mise à jour documentaire.

---

**Dernière mise à jour** : 15 janvier 2025
