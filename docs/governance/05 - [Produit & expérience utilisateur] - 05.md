# Produit & expérience utilisateur – 05

**Rôle** : Référence fonctionnelle visible du produit, cadre de l'expérience joueur du MVP  
**Portée** : Parcours joueur, règles de jeu, UX paiements, anti-cheat visible, gestion litiges  
**Statut** : Actif  
**Dernière mise à jour** : 15 janvier 2025

---

## 📋 Vue d'ensemble

Le domaine Produit & expérience utilisateur définit ce que voit, comprend et vit le joueur sur la plateforme. Il constitue :
- La référence fonctionnelle visible du produit
- Le cadre de l'expérience joueur du MVP
- Le point de convergence entre règles de jeu, parcours, paiements, anti-cheat et litiges
- La base de travail pour la spécification ultérieure (sans implémentation)

Ce domaine ne traite ni la vision stratégique globale (document 00 – Chef de projet), ni la technique, ni le juridique, ni la finance interne, ni le marketing.

---

## 🎮 Parcours joueur (macro)

### Éléments FIGÉS

- Accès à une arène de compétitions d'échecs skill-based
- Positionnement explicite : compétition, pas pari
- Parcours simple et lisible :
  1. Sélection d'un tournoi
  2. Engagement du buy-in
  3. Déroulement des parties
  4. Attribution des gains
- Accès aux matchs exclusivement via un tournoi identifié
- Visibilité du match parent et de son statut tout au long du parcours

---

## 🏆 Tournois et règles visibles

### Éléments FIGÉS (cadre général)

- Tournois structurés, règles prédéfinies et accessibles
- Buy-in engagé uniquement à l'entrée du tournoi
- Prize pool constitué des buy-ins joueurs
- Formats volontairement simples au lancement
- Absence de tournois privés en phase initiale
- Annulation de tournoi avec remboursement automatique

---

## ♟️ Gestion des fins de partie et égalités

### Éléments FIGÉS

- Fin de partie possible par victoire, défaite, résignation ou règles automatiques (pat, 50 coups, répétitions)
- Politique de DRAW définie par le tournoi
- DRAW possible comme état provisoire
- Résolution finale possible via tie-breaks prédéfinis
- Tie-breaks intégrés au déroulement normal du tournoi
- Combinaisons de règles non résolutives interdites

---

## 💳 UX paiements & retraits (côté joueur)

### Éléments FIGÉS

- Dépôt sans commission
- Frais et commissions appliqués au moment du tournoi
- Parcours paiement transparent et compréhensible
- **Retraits** : **REPORTÉ** — Non implémentés dans le code actuel (voir Écarts connus)
- Aucune exposition de logique financière interne

**Note** : Les retraits sont mentionnés dans le MVP initial mais sont reportés hors MVP selon l'arbitrage du document 00 – Chef de projet (Écart P1-02). Le code backend lance une exception "Les retraits ne sont pas encore implémentés".

---

## 🛡️ UX anti-cheat et gestion des litiges

### Éléments FIGÉS (cadre) / PROVISOIRES (niveau de visibilité)

- Existence explicite de règles d'intégrité et de fair-play
- Sanctions possibles : suspension, bannissement, confiscation des gains
- Fins de partie automatiques non contestables
- Tie-breaks limitant les litiges liés aux égalités
- Traçabilité complète des matchs
- Gestion des litiges fondée sur règles annoncées, données objectives et modération humaine ciblée

### Éléments PROVISOIRES

- Niveau de visibilité et pédagogie autour de l'anti-cheat

---

## 🚀 Périmètre de lancement (MVP)

### Inclus (FIGÉ)

- Web desktop
- Tournois publics simples
- Buy-in, prize pool clairs
- DRAW + tie-breaks
- Paiements basiques
- **Retraits** : **REPORTÉ** — Reportés hors MVP initial (voir Écarts connus)
- Cadre anti-cheat visible

### Exclus (FIGÉ)

- Tournois privés
- Formats avancés
- Applications mobiles natives

---

## 💡 Hypothèses structurantes

### Éléments PROVISOIRES

- Simplicité = moins de frictions et de litiges
- Transparence = confiance joueurs
- Clarté des règles aussi dissuasive que la technologie
- Équité prioritaire sur sophistication
- DRAW provisoire compréhensible s'il est clairement signalé
- Automatisation des transitions = réduction des contestations

---

## 📊 Analyse stratégique

### Forces

- Périmètre produit clair, maîtrisé et réaliste pour un MVP
- Forte cohérence entre parcours, règles et anti-cheat
- Gestion des DRAW et tie-breaks très structurante et différenciante
- Excellente lisibilité joueur (enjeu, résultat, règles)
- Réduction proactive des litiges par le design produit

### Faiblesses / limites

- Plusieurs arbitrages UX encore ouverts sur des points sensibles
- Niveau de pédagogie autour des règles non encore fixé
- Dépendance forte à la compréhension utilisateur des DRAW provisoires
- Anti-cheat volontairement peu détaillé → équilibre délicat crédibilité / opacité
- Absence de métriques UX formalisées à ce stade

### Opportunités d'amélioration (dans le périmètre existant)

- Renforcer la lisibilité des règles sans les complexifier
- Hiérarchiser clairement les arbitrages UX restants
- Transformer les hypothèses UX en critères de validation MVP
- Aligner plus explicitement parcours joueur et règles de tournoi

### Risques principaux

- Mauvaise compréhension du DRAW provisoire par les joueurs
- Frictions UX sur l'enchaînement des tie-breaks
- Perception insuffisante de l'anti-cheat en phase initiale
- Arbitrages tardifs bloquant les phases de spécification
- Dépendance forte aux décisions du document 00 – Chef de projet sur certains points

---

## 💡 Recommandations stratégiques

- Geler définitivement le cadre produit du MVP → Recommandation prioritaire, nécessite validation finale document 00 – Chef de projet
- Arbitrer rapidement les points UX sensibles : DRAW provisoire, tie-breaks, visibilité anti-cheat
- Transformer les hypothèses UX en critères de succès MVP sans ajouter de fonctionnalités
- Produire une checklist "prêt pour spécification" pour permettre le passage vers design / tech
- Maintenir un périmètre strictement fermé jusqu'à validation MVP

---

## ✅ Todo list structurée

### Priorité immédiate (bloquant / critique)

- Arbitrer les formats de tournois du lancement
- Arbitrer les niveaux de buy-in initiaux
- Décider du niveau de visibilité de l'anti-cheat
- Valider la présentation UX d'un DRAW provisoire
- Geler officiellement le périmètre MVP

### Priorité court terme

- Définir l'enchaînement UX des tie-breaks BEST_OF_N
- Clarifier la visibilité des règles de tie-break avant engagement
- Formaliser les critères de compréhension joueur

### Priorité moyen terme

- Préparer la transition vers spécifications fonctionnelles
- Définir les indicateurs UX de validation MVP
- Aligner le périmètre produit avec la roadmap globale

### Optionnel / évolutif

- Réflexion post-MVP sur mobile / PWA
- Ajustement des formats selon retours utilisateurs

---

## 🔗 Dépendances et interactions

### Interactions fortes

- **Document 00 – Chef de projet** : Arbitrages, gel du périmètre, priorités
- **Document 04 – Finance & paiements** : Cohérence frais visibles / non visibles
- **Document 03 – Structure juridique & conformité** : Compatibilité règles visibles
- **Document 01 – Vision & Stratégie Globale** : Alignement positionnement compétition

### Dépendances critiques

- Arbitrages finaux validés par le document 00 – Chef de projet
- Cohérence des règles visibles avec le cadre juridique
- Validation du périmètre MVP avant toute spécification

---

## 📈 Indicateurs de complétion

### "Prêt pour lancement MVP"

- Tous les points produit à arbitrer sont tranchés
- Parcours joueur compréhensible sans explication externe
- Règles de tournoi et de tie-break perçues comme claires
- UX paiements sans surprise
- Cadre anti-cheat crédible pour les joueurs

### "Prêt pour phase suivante"

- Hypothèses UX validées par usage
- Arbitrages transformés en décisions stables
- Périmètre produit prêt à évoluer sans remise en cause du socle

---

## 📝 Écarts connus

### Écart P0-03 : Pages publiques utilisent "ChessBet" au lieu de "Elite64"

**Statut** : ⚠️ **IDENTIFIÉ** — Les pages publiques (accueil, CGU) utilisent "ChessBet" au lieu de "Elite64" selon l'Arbitrage 01 du document 00 – Chef de projet.

**Source** : Document 00 – Chef de projet, Écart P0-03

**Action** : Correction du code frontend à effectuer en phase de développement suivante (hors périmètre BLOC 5.1).

---

### Écart P1-02 : Retraits mentionnés comme FIGÉ mais non implémentés

**Statut** : ✅ **CORRIGÉ** — Les retraits sont désormais marqués comme REPORTÉ dans la section UX paiements & retraits.

**Source** : Document 00 – Chef de projet, Écart P1-02

**Détails** :
- Le document mentionnait "Retraits accessibles avec délais et limites annoncés" comme FIGÉ et inclus MVP
- Le code backend lance une exception "Les retraits ne sont pas encore implémentés"
- **Décision** : Reportés hors MVP initial selon l'arbitrage du document 00 – Chef de projet

**Condition de réouverture** : Validation du modèle économique (traction mesurable, revenus récurrents selon document 08).

---

**Dernière mise à jour** : 15 janvier 2025
