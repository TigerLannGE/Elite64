# 🎯 Commandes Cursor - Documentation ChessBet

**Version** : 1.0  
**Dernière mise à jour** : 15 décembre 2025

---

## 📚 Vue d'ensemble

Ce document liste toutes les commandes disponibles pour maintenir la documentation de manière automatisée via Cursor AI.

**Prérequis** : Le fichier `.cursorrules` doit être présent à la racine du projet.

---

## 📝 Commandes de Création

### Créer un nouveau document technique

**Format** :
```
@AI Crée une nouvelle documentation pour [description] dans la Phase [XX] scope [backend/frontend/cross]
```

**Exemples** :

```
@AI Crée une nouvelle documentation pour l'intégration WebSocket 
dans la Phase 06 scope backend
```

```
@AI Crée une nouvelle documentation pour le composant Dashboard 
dans la Phase 05 scope frontend
```

```
@AI Crée une nouvelle documentation pour le système de notifications 
dans la Phase 07 scope cross
```

**Ce que l'AI va faire** :
1. ✅ Créer le fichier avec la convention de nommage correcte
2. ✅ Placer dans le bon dossier de phase et scope
3. ✅ Utiliser le template approprié (backend/frontend/cross)
4. ✅ Ajouter le lien dans `docs/README.md`
5. ✅ Définir les dates de création
6. ✅ Inclure les sections standard

---

### Générer un template vide

**Format** :
```
@AI Génère un template [backend/frontend/cross] pour la Phase [XX]
```

**Exemples** :

```
@AI Génère un template backend pour la Phase 08
```

```
@AI Génère un template frontend pour la Phase 07
```

**Ce que l'AI va faire** :
1. ✅ Créer le template approprié sans le contenu spécifique
2. ✅ Inclure toutes les sections recommandées
3. ✅ Utiliser la bonne convention de nommage

---

## 🗄️ Commandes d'Archivage

### Archiver un document obsolète

**Format** :
```
@AI Archive le document [nom-fichier.md] car [raison]
```

**Exemples** :

```
@AI Archive le document phase-04_old-api_backend.md car remplacé par la nouvelle API v2
```

```
@AI Archive le document phase-03_legacy-tournaments_backend.md car logique complètement refaite
```

**Ce que l'AI va faire** :
1. ✅ Déplacer le fichier vers `docs/_archives/`
2. ✅ Renommer avec préfixe `OBSOLETE_`
3. ✅ Ajouter une note d'obsolescence en haut du fichier
4. ✅ Rechercher tous les liens vers ce document
5. ✅ Corriger ou marquer tous les liens
6. ✅ Mettre à jour `docs/README.md`
7. ✅ Mettre à jour `docs/_CORRESPONDANCE_CHEMINS.md`

---

### Marquer un document comme obsolète (sans archiver)

**Format** :
```
@AI Marque comme obsolète le document [nom-fichier.md] et référence le nouveau document [nouveau-fichier.md]
```

**Exemple** :

```
@AI Marque comme obsolète le document phase-02_old-transactions_backend.md 
et référence le nouveau document phase-02_transactions-wallets_backend.md
```

**Ce que l'AI va faire** :
1. ✅ Ajouter un avertissement d'obsolescence en haut du fichier
2. ✅ Ajouter un lien vers le document de remplacement
3. ✅ Changer le statut en ⚠️ Obsolète
4. ✅ Mettre à jour `docs/README.md`

---

## 🔄 Commandes de Mise à Jour

### Mettre à jour un document existant

**Format** :
```
@AI Mets à jour la documentation [nom-fichier.md] avec [modifications]
```

**Exemples** :

```
@AI Mets à jour la documentation phase-01_auth-jwt-email-age-verification_backend.md 
en ajoutant la section sur l'intégration OAuth2
```

```
@AI Mets à jour la documentation phase-05_frontend-overview_frontend.md 
en ajoutant les nouvelles pages créées
```

**Ce que l'AI va faire** :
1. ✅ Modifier le contenu selon les instructions
2. ✅ Mettre à jour la date "Dernière mise à jour"
3. ✅ Vérifier que tous les liens fonctionnent toujours
4. ✅ Respecter la structure et le format existants

---

### Corriger les liens d'un document

**Format** :
```
@AI Corrige tous les liens du document [nom-fichier.md]
```

**Exemple** :

```
@AI Corrige tous les liens du document docs/README.md
```

**Ce que l'AI va faire** :
1. ✅ Scanner tous les liens internes du document
2. ✅ Vérifier l'existence des fichiers cibles
3. ✅ Corriger les chemins relatifs si nécessaires
4. ✅ Créer un rapport des corrections effectuées

---

## 🔍 Commandes de Vérification

### Vérifier la cohérence globale

**Format** :
```
@AI Vérifie la cohérence de toute la documentation selon les règles établies
```

**Ce que l'AI va faire** :
1. ✅ Vérifier tous les liens internes
2. ✅ Vérifier la convention de nommage de tous les fichiers
3. ✅ Vérifier que `docs/README.md` est à jour
4. ✅ Identifier les documents manquants
5. ✅ Identifier les doublons potentiels
6. ✅ Créer un rapport d'audit complet

---

### Vérifier uniquement les liens

**Format** :
```
@AI Trouve et corrige tous les liens cassés dans la documentation
```

**Ce que l'AI va faire** :
1. ✅ Scanner tous les fichiers .md
2. ✅ Tester tous les liens internes
3. ✅ Lister les liens cassés
4. ✅ Proposer des corrections
5. ✅ Appliquer les corrections (si confirmé)
6. ✅ Créer un rapport des corrections

---

### Vérifier la convention de nommage

**Format** :
```
@AI Vérifie que tous les fichiers de documentation respectent la convention de nommage
```

**Ce que l'AI va faire** :
1. ✅ Scanner tous les fichiers dans `docs/phase-*`
2. ✅ Vérifier le format `phase-XX_description_scope.md`
3. ✅ Lister les fichiers non conformes
4. ✅ Proposer les renommages nécessaires

---

### Identifier les documents manquants

**Format** :
```
@AI Identifie les documents manquants pour la Phase [XX]
```

**Exemple** :

```
@AI Identifie les documents manquants pour la Phase 06
```

**Ce que l'AI va faire** :
1. ✅ Analyser la phase spécifiée
2. ✅ Comparer avec les phases implémentées dans le code
3. ✅ Lister les documents attendus vs existants
4. ✅ Proposer la création des documents manquants

---

## 📊 Commandes de Rapport

### Générer un rapport d'état complet

**Format** :
```
@AI Génère un rapport d'état complet de la documentation
```

**Ce que l'AI va faire** :
1. ✅ Analyser toute la structure de documentation
2. ✅ Compter les documents par phase et scope
3. ✅ Vérifier la cohérence globale
4. ✅ Identifier les incohérences
5. ✅ Créer un rapport détaillé (type `_RAPPORT_*.md`)

---

### Générer un rapport d'audit

**Format** :
```
@AI Génère un rapport d'audit de la documentation comme fait pour l'Étape 3
```

**Ce que l'AI va faire** :
1. ✅ Vérifier la convention de nommage
2. ✅ Vérifier les liens cassés
3. ✅ Identifier les documents manquants
4. ✅ Analyser les doublons potentiels
5. ✅ Proposer un plan d'action par priorité
6. ✅ Créer un fichier `_RAPPORT_AUDIT_[date].md`

---

### Lister les documents par phase

**Format** :
```
@AI Liste tous les documents de la Phase [XX]
```

**Exemple** :

```
@AI Liste tous les documents de la Phase 06
```

**Ce que l'AI va faire** :
1. ✅ Lister tous les fichiers de la phase
2. ✅ Afficher le scope de chaque document
3. ✅ Afficher le statut (✅ Complété, 🔄 En cours, ⚠️ Obsolète)

---

## 🔧 Commandes de Migration

### Migrer un ancien document

**Format** :
```
@AI Migre le document [chemin-ancien] vers la structure par phases
```

**Exemple** :

```
@AI Migre le document backend/old-smtp-config.md vers la structure par phases
```

**Ce que l'AI va faire** :
1. ✅ Analyser le contenu du document
2. ✅ Identifier la phase appropriée
3. ✅ Identifier le scope approprié
4. ✅ Créer le nouveau fichier avec la convention de nommage
5. ✅ Copier/adapter le contenu
6. ✅ Archiver l'ancien document
7. ✅ Mettre à jour tous les liens

---

### Réorganiser une phase complète

**Format** :
```
@AI Réorganise tous les documents de la Phase [XX] selon la structure actuelle
```

**Exemple** :

```
@AI Réorganise tous les documents de la Phase 04 selon la structure actuelle
```

**Ce que l'AI va faire** :
1. ✅ Analyser tous les documents de la phase
2. ✅ Vérifier la convention de nommage
3. ✅ Vérifier la structure des dossiers (backend/frontend/cross)
4. ✅ Déplacer/renommer si nécessaire
5. ✅ Corriger tous les liens
6. ✅ Créer un rapport des modifications

---

## 💡 Commandes Avancées

### Créer un document de synthèse

**Format** :
```
@AI Crée un document de synthèse pour la Phase [XX]
```

**Exemple** :

```
@AI Crée un document de synthèse pour la Phase 05
```

**Ce que l'AI va faire** :
1. ✅ Analyser tous les documents de la phase
2. ✅ Créer `phase-XX_*/cross/phase-XX_overview_cross.md`
3. ✅ Synthétiser les objectifs, architecture et état
4. ✅ Ajouter des liens vers tous les documents détaillés
5. ✅ Ajouter le lien dans `docs/README.md`

---

### Créer des références croisées

**Format** :
```
@AI Ajoute des références croisées entre [fichier1.md] et [fichier2.md]
```

**Exemple** :

```
@AI Ajoute des références croisées entre 
phase-04_roles-admin-api_backend.md et 
phase-04_roles-admin-interface_frontend.md
```

**Ce que l'AI va faire** :
1. ✅ Analyser les deux documents
2. ✅ Identifier les sections pertinentes pour les références
3. ✅ Ajouter les liens dans les deux sens
4. ✅ Respecter le format et la structure existants

---

### Mettre à jour le README principal

**Format** :
```
@AI Mets à jour le README principal avec tous les documents actuels
```

**Ce que l'AI va faire** :
1. ✅ Scanner tous les dossiers `phase-*`
2. ✅ Identifier tous les documents .md
3. ✅ Organiser par phase et scope dans le README
4. ✅ Vérifier que tous les liens fonctionnent
5. ✅ Respecter la structure actuelle du README

---

## 🎓 Exemples de Scénarios Complets

### Scénario 1 : Nouvelle fonctionnalité implémentée

**Situation** : Vous venez d'implémenter un système de WebSocket pour le gameplay temps réel.

**Commandes à utiliser** :

```
1. @AI Crée une nouvelle documentation pour l'intégration WebSocket pour le gameplay temps réel 
   dans la Phase 06 scope backend

2. @AI Mets à jour la documentation phase-06.0.C_gameplay-orchestration_cross.md 
   en ajoutant une section sur la communication WebSocket

3. @AI Ajoute des références croisées entre le nouveau document WebSocket 
   et phase-06.0.C_gameplay-orchestration_cross.md

4. @AI Vérifie la cohérence de toute la documentation de la Phase 06
```

---

### Scénario 2 : Refonte d'une ancienne fonctionnalité

**Situation** : Vous avez complètement refait le système de transactions.

**Commandes à utiliser** :

```
1. @AI Archive le document phase-02_old-transactions_backend.md 
   car remplacé par la nouvelle implémentation v2

2. @AI Crée une nouvelle documentation pour le nouveau système de transactions v2 
   dans la Phase 02 scope backend

3. @AI Trouve et corrige tous les liens cassés dans la documentation

4. @AI Génère un rapport d'état de la Phase 02
```

---

### Scénario 3 : Audit périodique de la documentation

**Situation** : Maintenance mensuelle de la documentation.

**Commandes à utiliser** :

```
1. @AI Vérifie la cohérence de toute la documentation selon les règles établies

2. @AI Trouve et corrige tous les liens cassés dans la documentation

3. @AI Vérifie que tous les fichiers de documentation respectent la convention de nommage

4. @AI Génère un rapport d'audit de la documentation

5. @AI Mets à jour le README principal avec tous les documents actuels
```

---

## 🔗 Références

- **Règles AI** : Voir `.cursorrules` à la racine du projet
- **Guide de maintenance** : Voir `MAINTENANCE_GUIDE.md`
- **Templates** : Voir `MAINTENANCE_GUIDE.md` section Templates
- **Convention de nommage** : `phase-XX[.X.X]_description-kebab-case_scope.md`

---

## 🆘 Support

Si une commande ne fonctionne pas comme prévu :

1. Vérifier que `.cursorrules` existe à la racine du projet
2. Vérifier que la commande respecte le format attendu
3. Essayer de reformuler la commande de manière plus explicite
4. Utiliser `@AI` au début de chaque commande dans Cursor

---

**Dernière mise à jour** : 15 décembre 2025  
**Maintenu par** : Architecture d'information

