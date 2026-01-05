# Technique – 06

**Rôle** : Référence technique officielle du projet  
**Portée** : Architecture, périmètres backend et frontend, phasage d'implémentation, sécurité, anti-cheat  
**Statut** : Actif  
**Dernière mise à jour** : 15 janvier 2025

---

## 📋 Vue d'ensemble

Le document 06 – Technique est la référence technique officielle du projet. Il formalise l'architecture, les périmètres backend et frontend, le phasage d'implémentation, les principes de sécurité et d'anti-cheat, ainsi que les arbitrages techniques encore ouverts.

Il sert de base d'exécution pour les équipes techniques et de socle stable pour relancer un nouveau cycle de travail sans ambiguïté.

---

## 🏗️ Architecture macro

### Éléments FIGÉS

- Architecture backend-centric, stateless, DB comme source de vérité
- Backend gameplay : Orchestration serveur complète (validation des coups, persistance atomique, fins de partie)
- Support des tie-breaks (création, rattachement, résolution déterministe)
- Intégration avec la logique tournoi existante
- Phase 6.0.C implémentée, testée et gelée

---

## 🎨 Frontend

### État actuel (FIGÉ)

- **Actuel** : Affichage et consommation API
- **Phase 6.1** : ✅ **IMPLÉMENTÉE** — Plateau d'échecs, interactions basiques (voir Écarts connus)
- **Phase 6.2** : ✅ **IMPLÉMENTÉE** — Améliorations UX (promotion modal, resign modal, game over modal)

**Note** : Le document mentionnait initialement Phase 6.1 comme "à venir", mais l'implémentation est complète (Phase 6.1 et Phase 6.2).

---

## 🔒 Sécurité & journalisation

### Éléments FIGÉS

- Pas de logique financière directe
- Logs et traçabilité serveur, timestamps UTC
- Anti-cheat : V1 en place (validation serveur stricte)
- V2 explicitement hors périmètre

---

## 📊 Phasage

### Inclus / Figé

- Architecture backend-centric et stateless
- Orchestration gameplay serveur
- Modèle de tie-breaks et intégration tournoi
- Anti-cheat V1
- Journalisation serveur et UTC
- Phase 6.0.C backend
- **Phase 6.1 frontend** : ✅ Implémentée
- **Phase 6.2 frontend** : ✅ Implémentée

### Reporté / Provisoire

- Choix précis des mécanismes de concurrence (option A/B)
- Passage au temps réel (WebSockets)
- Anti-cheat V2
- Incréments de temps et tie-breaks avancés

---

## 🔄 Arbitrages restants

### Éléments PROVISOIRES / OUVERT

- Concurrence tie-breaks
- WebSockets
- Frontend chessboard (choix de librairie)
- Incréments de temps
- Tests de concurrence

---

## 📊 Analyse stratégique

### Forces

- Périmètre technique clair, cohérent et dédupliqué
- Backend gameplay fonctionnel, gelé et déterministe
- Séparation nette backend / frontend / finance
- Gestion des tie-breaks pensée dès l'architecture, sans hacks
- Phasage explicite réduisant le risque de dérive

### Faiblesses / limites

- Gestion de la concurrence documentée mais non arbitrée définitivement
- Absence de temps réel pouvant impacter l'expérience à terme (acceptée mais réelle)
- Anti-cheat limité à V1 (suffisant pour lancement, mais plafonnant)

### Opportunités d'amélioration

- Sécuriser rapidement les arbitrages techniques restants pour fluidifier l'exécution
- Formaliser des tests de concurrence ciblés sans étendre le scope
- Verrouiller une librairie frontend tôt pour éviter des refontes UX/techniques

### Risques principaux

- Blocage sur les arbitrages de concurrence (tie-breaks)
- Tentation d'introduire du temps réel ou de l'anti-cheat avancé prématurément
- Dépendance implicite au document 00 – Chef de projet pour valider certains choix structurants

---

## 💡 Recommandations stratégiques

- Arbitrer immédiatement la stratégie de concurrence tie-breaks → Recommandation prioritaire, nécessite validation explicite du document 00 – Chef de projet
- Lancer la Phase 6.1 frontend sans modification backend → Respect strict du périmètre figé pour éviter tout glissement
- Formaliser une checklist technique de Phase 6.1 → Limiter le risque d'interprétation côté frontend
- Geler explicitement l'absence de WebSockets et d'anti-cheat V2 → Décision de non-implémentation à court terme pour protéger le planning

---

## ✅ Todo list structurée

### Priorité immédiate (bloquant / critique)

- Arbitrer la stratégie de gestion de concurrence tie-breaks (Option A vs B)
- Valider officiellement le périmètre Phase 6.1 côté frontend

### Priorité court terme

- Choisir la librairie de plateau d'échecs frontend
- Définir le niveau minimal de tests de concurrence à automatiser
- Produire une checklist d'implémentation frontend gameplay

### Priorité moyen terme

- Préparer (sans implémenter) un cadrage WebSockets Phase 6.2
- Documenter les scénarios d'extension anti-cheat V2

### Optionnel / évolutif

- Étudier incréments de temps spécifiques
- Étudier tie-breaks avancés (Armageddon) hors lancement initial

---

## 🔗 Dépendances et interactions

### Interactions fortes

- **Document 00 – Chef de projet** : Arbitrages techniques structurants (concurrence, temps réel)
- **Document 05 – Produit & expérience utilisateur** : Alignement strict sur ce que le frontend doit afficher (sans logique métier)
- **Document 04 – Finance & paiements** : Dépendance indirecte (finalisation tournoi), périmètre figé

### Dépendances critiques

- Validation des arbitrages techniques par le document 00 – Chef de projet avant toute extension backend

---

## 📈 Indicateurs de complétion

### Prêt pour lancement

- Backend gameplay gelé et sans régression
- Frontend Phase 6.1 fonctionnel sans logique métier locale
- Arbitrages de concurrence validés et testés
- Journalisation complète et exploitable

### Prêt pour phase suivante

- Phase 6.1 stabilisée
- Décision formelle sur temps réel (go / no-go)
- Backlog clair pour Phase 6.2 sans dette technique critique

---

## 📝 Écarts connus

### Écart P1-05 : Frontend Phase 6.1 mentionnée comme "à venir" mais implémentée

**Statut** : ✅ **CORRIGÉ** — Le document mentionne désormais que Phase 6.1 et Phase 6.2 sont implémentées.

**Source** : Document 00 – Chef de projet, Écart P1-05

**Détails** :
- Le document mentionnait initialement "À venir : Phase 6.1 (plateau d'échecs, interactions basiques)"
- L'implémentation est complète : Phase 6.1 et Phase 6.2 sont implémentées dans `frontend/pages/matches/[id].tsx`
- Documentation technique existe : `docs/phase-06_gameplay-echecs/frontend/`

---

**Dernière mise à jour** : 15 janvier 2025
