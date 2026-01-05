# Structure juridique & conformité – 03

**Rôle** : Référentiel juridique interne du projet  
**Portée** : Structure corporate, qualification juridique, conformité réglementaire  
**Statut** : Actif  
**Dernière mise à jour** : 15 janvier 2025

---

## 📋 Vue d'ensemble

Le document 03 – Structure juridique & conformité constitue le référentiel juridique interne du projet. Il a pour rôle de :
- Cadrer la structure corporate retenue pour le lancement
- Définir la qualification juridique du produit
- Poser le cadre de conformité réglementaire (sans implémentation)
- Distinguer clairement les décisions figées des hypothèses encore provisoires
- Servir de base de travail pour toute validation juridique ultérieure ou évolution structurelle

Il ne traite ni d'exécution, ni de technique, ni de finance, ni de marketing.

---

## 🏢 Structure corporate

### Éléments FIGÉS

- **Création d'une UK Private Limited Company** : **Synergy Digital Ltd** est le nom définitif de la société opératrice en arrière-plan (voir document 00 – Chef de projet, Arbitrage 02).
- Choix volontaire hors Suisse en phase 1
- Refus explicite d'une SARL suisse à ce stade
- Création via 1st Formations – Non-Residents Package
- Relation PSP unique : Stripe
- Séparation société opératrice / marque produit

### Éléments PROVISOIRES

- Pacte d'associés simple envisagé
- Financements familiaux possibles hors capital

---

## 👥 Gouvernance & actionnariat

### Éléments FIGÉS

- Actionnariat : 95 % fondateur / 5 % second actionnaire
- Directeur unique : fondateur
- Second actionnaire sans rôle opérationnel ni pouvoir de gouvernance
- Aucun pouvoir des joueurs sur la gouvernance
- Décisions sensibles réservées à une décision humaine interne

---

## ⚖️ Qualification juridique du produit

### Éléments FIGÉS

- Plateforme de compétitions d'échecs strictement skill-based
- Exclusion explicite du gambling, betting, hasard
- Opérateur non-participant
- Buy-in fixe, prize pool déterministe issu uniquement des joueurs
- Gains déterminés exclusivement par la performance

---

## 📄 CGU & politiques

### Éléments FIGÉS (cadre uniquement)

- Identification des documents nécessaires (CGU, KYC, AML light, litiges, remboursements)
- Mentions clés obligatoires (no gambling, no betting, absence de garantie de gains)
- Cadre de sanctions anti-triche, avec revue humaine finale

**⚠️ Note d'écart identifié (BLOC 3, Écart P0-03)** : Les CGU actuellement implémentées dans le code frontend (`frontend/pages/terms.tsx`) utilisent "ChessBet" au lieu de "Elite64". Selon l'Arbitrage 01 du document 00 – Chef de projet, Elite64 est la marque publique officielle et doit être utilisée dans toutes les pages publiques. **Action requise** : Correction du code frontend (hors périmètre BLOC 5.1, à traiter en phase de développement suivante).

---

## 🌍 Géolocalisation & conformité pays

### Éléments REPORTÉS (module désactivé)

**Statut** : Reporté à une phase ultérieure (voir document 00 – Chef de projet, Écart P1-03)

- Géolocalisation multi-couches : **REPORTÉ** — Module CountryRules désactivé dans le code
- Géoblocage utilisé comme outil de conformité : **REPORTÉ** — Module désactivé
- Démarche de bonne foi réglementaire : **FIGÉ** (principe)

**Condition de réouverture** : Contraintes légales spécifiques ou expansion géographique nécessitant géoblocage.

### Éléments PROVISOIRES

- Liste exacte des pays autorisés / restreints / interdits
- Cas spécifique des États américains à bloquer

---

## 🔍 Hypothèses juridiques

### Éléments PROVISOIRES

- Absence de licence gambling en phase 1
- Modèle wallet + skill compatible juridiquement
- Proportionnalité des obligations réglementaires
- Acceptabilité PSP (adresse hors UK)
- Anti-cheat proportionné suffisant en V1

---

## 📊 Analyse stratégique

### Forces

- Cadre juridique clair, cohérent et volontairement conservateur
- Qualification skill-based solidement affirmée et cohérente avec le produit
- Séparation nette entre ce qui est figé et ce qui est hypothétique
- Gouvernance simple, lisible et sans ambiguïté réglementaire
- Approche de conformité fondée sur la bonne foi et la proportionnalité

### Faiblesses / limites

- Forte dépendance à la qualification skill-based (point central)
- Plusieurs hypothèses clés encore provisoires (pays, KYC, PSP)
- Absence de validation juridique externe à ce stade
- Sensibilité particulière au droit comparé (US / UE / UK)

### Opportunités d'amélioration

- Verrouiller progressivement les points provisoires sans changer d'architecture
- Transformer le cadre existant en checklist juridique exécutable
- Anticiper les scénarios de traction forte sans refonte brutale

### Risques principaux

- Requalification réglementaire dans certaines juridictions
- Blocage PSP lié à un point non anticipé (KYC, pays, sanctions)
- Retard projet si arbitrages juridiques tardifs
- Surconformité inutile ralentissant le MVP

---

## 💡 Recommandations stratégiques

- Prioriser la fermeture des hypothèses provisoires critiques (pays, KYC, sanctions anti-cheat)
- Maintenir la simplicité juridique tant que la traction reste limitée, sans anticiper inutilement une structure lourde
- Préparer un scénario d'évolution juridique sans l'exécuter (scaling)
- Isoler clairement ce qui relève d'un arbitrage du document 00 – Chef de projet : évolution de structure, ouverture géographique large, assurance spécifique

---

## ✅ Todo list structurée

### Priorité immédiate (critique)

- Finaliser la liste pays autorisés / restreints / interdits
- Définir les seuils KYC (dépôt / retrait)
- Valider le cadre de sanctions anti-cheat définitives

### Priorité court terme

- Formaliser le pacte d'associés simple
- Structurer la politique de retraits (frais ou non)
- Consolider la documentation CGU (sans rédaction finale)

### Priorité moyen terme

- Préparer un scénario juridique de montée en charge
- Anticiper la validation juridique externe (quand nécessaire)

### Optionnel / évolutif

- Étudier des assurances spécifiques
- Étudier une structure juridique alternative post-traction

---

## 🔗 Dépendances et interactions

### Interactions fortes

- **Document 00 – Chef de projet** : Arbitrages structurels majeurs, décisions d'évolution juridique
- **Document 01 – Vision & Stratégie Globale** : Cohérence skill-based / positionnement produit
- **Document 02 – Branding & Marketing** : Cohérence des messages "no gambling"
- **Document 08 – Financement & trajectoire capitalistique** : Impact de la structure sur investisseurs futurs

### Dépendances critiques

- Arbitrages du document 00 – Chef de projet avant toute évolution structurelle ou géographique majeure

---

## 📈 Indicateurs de complétion

### Prêt pour lancement MVP si :

- Structure corporate opérationnelle
- Qualification skill-based non contestée
- CGU & politiques cadrées
- Pays cibles clairement définis
- PSP conforme et actif

### Prêt pour phase suivante si :

- Arbitrages juridiques ouverts clos
- Validation juridique externe réalisée
- Scénario de scaling juridiquement cadré

---

## 📝 Écarts connus

### Écart P0-02 : Nom société opératrice

**Statut** : ✅ **CORRIGÉ** — Le document mentionne désormais explicitement "Synergy Digital Ltd" comme nom de la UK Private Limited Company (voir section Structure corporate).

**Source** : Document 00 – Chef de projet, Arbitrage 02

---

### Écart P0-03 : CGU utilisent "ChessBet" au lieu de "Elite64"

**Statut** : ⚠️ **IDENTIFIÉ** — Les CGU dans le code frontend utilisent "ChessBet" au lieu de "Elite64". Correction requise dans le code (hors périmètre BLOC 5.1).

**Source** : Document 00 – Chef de projet, Écart P0-03

**Action** : Correction du code frontend à effectuer en phase de développement suivante.

---

### Écart P1-03 : Géolocalisation mentionnée mais module désactivé

**Statut** : ✅ **CORRIGÉ** — La géolocalisation/géoblocage est désormais marquée comme REPORTÉ dans la section Géolocalisation & conformité pays.

**Source** : Document 00 – Chef de projet, Écart P1-03

---

**Dernière mise à jour** : 15 janvier 2025
