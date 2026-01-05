# BLOC 5.1 – Changelog des correctifs documentaires

**Date** : 15 janvier 2025  
**Portée** : Correctifs documentaires uniquement (pas de modification de code)  
**Source** : Document 00 – Chef de projet, section "Consolidation des écarts & arbitrages transverses"

---

## 📋 Résumé exécutif

**Fichiers modifiés** : 6 documents Governance (03 à 08)

**Correctifs appliqués** :
- **P0 – Critique** : 4 correctifs
- **P1 – Moyen** : 5 correctifs

**Statut** : ✅ Tous les correctifs FIGÉ appliqués. Éléments "À DÉCIDER" documentés sans arbitrage.

---

## 📝 Fichiers modifiés

### Document 03 – Structure juridique & conformité

**Fichier** : `docs/governance/03 - [Structure juridique & conformité] - 03.md`

**Correctifs appliqués** :

1. **P0-01 : Nomenclature** ✅
   - **Avant** : "chat 00", "chat 01", "chat 02", "chat 03"
   - **Après** : "document 00 – Chef de projet", "document 01 – Vision & Stratégie Globale", etc.
   - **Occurrences** : 10 remplacements

2. **P0-02 : Nom société opératrice** ✅
   - **Avant** : "Création d'une UK Private Limited Company comme entité opératrice unique"
   - **Après** : "**Synergy Digital Ltd** est le nom définitif de la société opératrice en arrière-plan"
   - **Section** : Structure corporate

3. **P0-03 : CGU utilisent "ChessBet"** ⚠️
   - **Action** : Ajout d'une note d'écart identifié dans la section CGU & politiques
   - **Note** : Correction du code frontend requise (hors périmètre BLOC 5.1)
   - **Source** : Document 00 – Chef de projet, Écart P0-03

4. **P1-01 : Contenu métadiscursif** ✅
   - **Supprimé** : Tout le contenu conversationnel ("NB - Prends connaissance...", "Pris en compte.", "J'endosse le rôle...", etc.)
   - **Résultat** : Document restructuré selon format canonique

5. **P1-03 : Géolocalisation** ✅
   - **Avant** : "Géolocalisation multi-couches" et "Géoblocage" marqués FIGÉ
   - **Après** : Marqués comme "REPORTÉ" avec note explicative
   - **Section** : Géolocalisation & conformité pays

**Structure harmonisée** :
- En-tête avec Rôle / Portée / Statut / Dernière mise à jour
- Sections : Vue d'ensemble, Éléments FIGÉS/PROVISOIRES, Analyse stratégique, Recommandations, Todo list, Dépendances, Indicateurs, Écarts connus

**Origine** : Document 00 – Chef de projet, Écarts P0-01, P0-02, P0-03, P1-01, P1-03

---

### Document 04 – Finance & paiements

**Fichier** : `docs/governance/04 - [Finance & paiements] - 04.md`

**Correctifs appliqués** :

1. **P0-01 : Nomenclature** ✅
   - **Avant** : "chat 00", "chat 03", "chat 04"
   - **Après** : "document 00 – Chef de projet", "document 03 – Structure juridique & conformité", etc.
   - **Occurrences** : 8 remplacements

2. **P0-04 : Frais 4.25% non implémentés** ⚠️
   - **Action** : Ajout d'une section détaillée dans "Entrées d'argent" avec statut explicite
   - **Note** : Commission 5% implémentée ✅, Frais 4.25% NON implémentés ❌
   - **Statut décisionnel** : ⚠️ À DÉCIDER (Option A : implémenter, Option B : retirer du document)
   - **Section** : Entrées d'argent + Écarts connus

3. **P1-01 : Contenu métadiscursif** ✅
   - **Supprimé** : Tout le contenu conversationnel ("NB - Prends connaissance...", "Pris en compte.", "J'opère désormais...", etc.)
   - **Résultat** : Document restructuré selon format canonique

**Structure harmonisée** :
- En-tête avec Rôle / Portée / Statut / Dernière mise à jour
- Sections : Vue d'ensemble, Modèle économique, Entrées d'argent (avec statut détaillé), Wallets, PSP, Banque/EMI, Analyse stratégique, Recommandations, Todo list, Dépendances, Indicateurs, Écarts connus

**Origine** : Document 00 – Chef de projet, Écarts P0-01, P0-04, P1-01

---

### Document 05 – Produit & expérience utilisateur

**Fichier** : `docs/governance/05 - [Produit & expérience utilisateur] - 05.md`

**Correctifs appliqués** :

1. **P0-01 : Nomenclature** ✅
   - **Avant** : "chat 00", "chat 01", "chat 03", "chat 04", "chat 05"
   - **Après** : "document 00 – Chef de projet", "document 01 – Vision & Stratégie Globale", etc.
   - **Occurrences** : 8 remplacements

2. **P0-03 : Pages publiques utilisent "ChessBet"** ⚠️
   - **Action** : Ajout d'une note d'écart identifié dans la section Écarts connus
   - **Note** : Correction du code frontend requise (hors périmètre BLOC 5.1)
   - **Source** : Document 00 – Chef de projet, Écart P0-03

3. **P1-01 : Contenu métadiscursif** ✅
   - **Supprimé** : Tout le contenu conversationnel ("NB - Prends connaissance...", "Pris en compte.", "Je confirme avoir...", etc.)
   - **Résultat** : Document restructuré selon format canonique

4. **P1-02 : Retraits non implémentés** ✅
   - **Avant** : "Retraits accessibles avec délais et limites annoncés" (FIGÉ, inclus MVP)
   - **Après** : Marqués comme "REPORTÉ" dans la section UX paiements & retraits
   - **Note** : Condition de réouverture documentée
   - **Section** : UX paiements & retraits + Écarts connus

**Structure harmonisée** :
- En-tête avec Rôle / Portée / Statut / Dernière mise à jour
- Sections : Vue d'ensemble, Parcours joueur, Tournois, Fins de partie, UX paiements/retraits, Anti-cheat, Périmètre MVP, Hypothèses, Analyse stratégique, Recommandations, Todo list, Dépendances, Indicateurs, Écarts connus

**Origine** : Document 00 – Chef de projet, Écarts P0-01, P0-03, P1-01, P1-02

---

### Document 06 – Technique

**Fichier** : `docs/governance/06 - [Technique] - 06.md`

**Correctifs appliqués** :

1. **P0-01 : Nomenclature** ✅
   - **Avant** : "chat 00", "chat 04", "chat 05", "chat 06"
   - **Après** : "document 00 – Chef de projet", "document 04 – Finance & paiements", etc.
   - **Occurrences** : 6 remplacements

2. **P1-01 : Contenu métadiscursif** ✅
   - **Supprimé** : Tout le contenu conversationnel ("NB - Prends connaissance...", "Pris en compte.", "Je me positionne...", etc.)
   - **Résultat** : Document restructuré selon format canonique

3. **P1-05 : Phase 6.1 mentionnée comme "à venir" mais implémentée** ✅
   - **Avant** : "À venir : Phase 6.1 (plateau d'échecs, interactions basiques)"
   - **Après** : "Phase 6.1 : ✅ **IMPLÉMENTÉE** — Plateau d'échecs, interactions basiques" + "Phase 6.2 : ✅ **IMPLÉMENTÉE**"
   - **Section** : Frontend + Écarts connus

**Structure harmonisée** :
- En-tête avec Rôle / Portée / Statut / Dernière mise à jour
- Sections : Vue d'ensemble, Architecture macro, Frontend, Sécurité, Phasage, Arbitrages, Analyse stratégique, Recommandations, Todo list, Dépendances, Indicateurs, Écarts connus

**Origine** : Document 00 – Chef de projet, Écarts P0-01, P1-01, P1-05

---

### Document 07 – Exploitation & opérations

**Fichier** : `docs/governance/07 - [Exploitation & opérations] - 07.md`

**Correctifs appliqués** :

1. **P0-01 : Nomenclature** ✅
   - **Avant** : "chat 00", "chat 04", "chat 05", "chat 06", "chat 07"
   - **Après** : "document 00 – Chef de projet", "document 04 – Finance & paiements", etc.
   - **Occurrences** : 5 remplacements

2. **P1-01 : Contenu métadiscursif** ✅
   - **Supprimé** : Tout le contenu conversationnel ("NB - Prends connaissance...", "Pris connaissance intégralement.", "Je confirme assumer...", etc.)
   - **Résultat** : Document restructuré selon format canonique

3. **P1-04 : Support email dédié non visible** ⚠️
   - **Action** : Ajout d'une note dans la section Support joueur avec statut "À DÉCIDER"
   - **Options** : Option A (implémenter email dédié) ou Option B (système générique)
   - **Section** : Support joueur + Écarts connus

**Structure harmonisée** :
- En-tête avec Rôle / Portée / Statut / Dernière mise à jour
- Sections : Vue d'ensemble, Support joueur, Gestion litiges, Monitoring fraude, Reporting, Statut FIGÉ/PROVISOIRE, Analyse stratégique, Recommandations, Todo list, Dépendances, Indicateurs, Écarts connus

**Origine** : Document 00 – Chef de projet, Écarts P0-01, P1-01, P1-04

---

### Document 08 – Financement & trajectoire capitalistique

**Fichier** : `docs/governance/08 - [Financement & trajectoire capitalistique] - 08.md`

**Correctifs appliqués** :

1. **P0-01 : Nomenclature** ✅
   - **Avant** : "chat 00", "chat 01", "chat 03", "chat 05", "chat 08"
   - **Après** : "document 00 – Chef de projet", "document 01 – Vision & Stratégie Globale", etc.
   - **Occurrences** : 8 remplacements

2. **P1-01 : Contenu métadiscursif** ✅
   - **Supprimé** : Tout le contenu conversationnel ("NB - Prends connaissance...", "Pris en compte.", "Je confirme être...", etc.)
   - **Résultat** : Document restructuré selon format canonique

**Structure harmonisée** :
- En-tête avec Rôle / Portée / Statut / Dernière mise à jour
- Sections : Vue d'ensemble, Bootstrap initial, Scénarios levée, Dilution, Critères déclenchement, Hypothèses, Statut FIGÉ/PROVISOIRE, Analyse stratégique, Recommandations, Todo list, Dépendances, Indicateurs

**Origine** : Document 00 – Chef de projet, Écarts P0-01, P1-01

---

## ✅ Correctifs appliqués (récapitulatif)

### P0 – Critique

| Écart | Document | Statut | Action |
|-------|----------|--------|--------|
| P0-01 : Nomenclature | 03, 04, 05, 06, 07, 08 | ✅ | Remplacement "chat XX" → "document XX" |
| P0-02 : Nom société opératrice | 03 | ✅ | Ajout "Synergy Digital Ltd" explicitement |
| P0-03 : CGU utilisent "ChessBet" | 03, 05 | ⚠️ | Note ajoutée (correction code requise) |
| P0-04 : Frais 4.25% non implémentés | 04 | ⚠️ | Statut "À DÉCIDER" documenté |

### P1 – Moyen

| Écart | Document | Statut | Action |
|-------|----------|--------|--------|
| P1-01 : Contenu métadiscursif | 03, 04, 05, 06, 07, 08 | ✅ | Suppression complète |
| P1-02 : Retraits non implémentés | 05 | ✅ | Marqués "REPORTÉ" |
| P1-03 : Géolocalisation désactivée | 03 | ✅ | Marqués "REPORTÉ" |
| P1-04 : Support email dédié | 07 | ⚠️ | Statut "À DÉCIDER" documenté |
| P1-05 : Phase 6.1 "à venir" | 06 | ✅ | Mis à jour "implémentée" |

---

## 📋 TODO restantes

### P0 – Critique (décisions requises)

1. **Frais 4.25% (Document 04)**
   - **Propriétaire suggéré** : Produit / Finance
   - **Action** : Décision Option A (implémenter) ou Option B (retirer du document)
   - **Impact** : Modèle économique et viabilité financière

2. **CGU utilisent "ChessBet" (Documents 03, 05)**
   - **Propriétaire suggéré** : Tech / Frontend
   - **Action** : Correction du code frontend (`frontend/pages/terms.tsx`, `frontend/pages/index.tsx`)
   - **Impact** : Cohérence branding (marque publique Elite64)

### P1 – Moyen (décisions requises)

1. **Support email dédié (Document 07)**
   - **Propriétaire suggéré** : Produit / Exploitation
   - **Action** : Décision Option A (implémenter email dédié) ou Option B (système générique)
   - **Impact** : Expérience utilisateur et traçabilité support

### P2 – Faible (améliorations futures)

1. **Monitoring fraude automatisé (Document 07)**
   - **Propriétaire suggéré** : Tech / Exploitation
   - **Action** : Implémentation système de monitoring (non critique pour MVP)
   - **Impact** : Détection proactive de fraude

2. **Reporting structuré (Document 07)**
   - **Propriétaire suggéré** : Tech / Exploitation
   - **Action** : Implémentation système de reporting (non critique pour MVP)
   - **Impact** : Pilotage opérationnel amélioré

---

## 📊 Statistiques

- **Fichiers modifiés** : 6
- **Lignes modifiées** : ~2000+ (restructuration complète)
- **Occurrences "chat XX" remplacées** : 45+
- **Sections "Écarts connus" ajoutées** : 6
- **Contenu métadiscursif supprimé** : 100%

---

## 🔗 Références

- **Source principale** : `docs/governance/00 - [Chef de projet] - 00.md`, section "Consolidation des écarts & arbitrages transverses"
- **Audits sources** :
  - `docs/_audits/_AUDIT_GOVERNANCE_03_STRUCTURE_JURIDIQUE_CONFORMITE.md`
  - `docs/_audits/_AUDIT_GOVERNANCE_04_FINANCE_PAIEMENTS.md`
  - `docs/_audits/_AUDIT_GOVERNANCE_05_PRODUIT_EXPERIENCE_UTILISATEUR.md`
  - `docs/_audits/_AUDIT_GOVERNANCE_06_TECHNIQUE.md`
  - `docs/_audits/_AUDIT_GOVERNANCE_07_EXPLOITATION_OPERATIONS.md`
  - `docs/_audits/_AUDIT_GOVERNANCE_08_FINANCEMENT_TRAJECTOIRE_CAPITALISTIQUE.md`

---

**Dernière mise à jour** : 15 janvier 2025

