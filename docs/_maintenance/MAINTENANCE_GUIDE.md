# 🔧 Guide de Maintenance - Documentation ChessBet

**Version** : 1.0  
**Dernière mise à jour** : 15 décembre 2025

---

## 🎯 Commandes Rapides Cursor

### Créer un nouveau document

**Commande** : `@AI Crée une nouvelle documentation pour [description] dans la Phase [XX] scope [backend/frontend/cross]`

**Exemple** :
```
@AI Crée une nouvelle documentation pour l'intégration WebSocket 
dans la Phase 06 scope backend
```

**L'AI va** :
1. Créer le fichier avec la bonne convention de nommage
2. Placer dans le bon dossier (`phase-06_gameplay-echecs/backend/`)
3. Utiliser le template standard
4. Ajouter le lien dans `docs/README.md`

---

### Archiver un document obsolète

**Commande** : `@AI Archive le document [nom-fichier.md] car [raison]`

**Exemple** :
```
@AI Archive le document phase-04_old-api_backend.md car remplacé par la nouvelle API v2
```

**L'AI va** :
1. Déplacer vers `docs/_archives/`
2. Renommer avec préfixe `OBSOLETE_`
3. Ajouter une note d'obsolescence
4. Corriger tous les liens vers ce document
5. Mettre à jour README.md

---

### Mettre à jour un document

**Commande** : `@AI Mets à jour la documentation [nom-fichier.md] avec [modifications]`

**Exemple** :
```
@AI Mets à jour la documentation phase-01_auth-jwt-email-age-verification_backend.md 
en ajoutant la section sur OAuth2
```

**L'AI va** :
1. Modifier le contenu
2. Mettre à jour la date de dernière mise à jour
3. Vérifier que les liens fonctionnent toujours

---

### Vérifier la cohérence

**Commande** : `@AI Vérifie la cohérence de toute la documentation selon les règles établies`

**L'AI va** :
1. Vérifier tous les liens internes
2. Vérifier la convention de nommage
3. Vérifier que README.md est à jour
4. Identifier les documents manquants
5. Créer un rapport d'audit

---

### Corriger les liens cassés

**Commande** : `@AI Trouve et corrige tous les liens cassés dans la documentation`

**L'AI va** :
1. Scanner tous les fichiers .md
2. Tester tous les liens internes
3. Corriger les liens cassés
4. Créer un rapport des corrections

---

## 📝 Templates

### Template : Document Technique Backend

```markdown
# [Titre] - Documentation Backend

**Date de création** : [Date]  
**Dernière mise à jour** : [Date]  
**Statut** : ✅ Complété / 🔄 En cours

---

## 📋 Vue d'ensemble

[Description de ce que fait/gère ce composant]

**⚠️ Important** : [Points critiques à connaître]

---

## 🎯 Objectifs

- ✅ Objectif 1
- ✅ Objectif 2
- ✅ Objectif 3

---

## 🏗️ Architecture

[Structure des fichiers, modules, services]

### Structure

```
src/
├── modules/
│   └── [module-name]/
│       ├── dto/
│       ├── [module].controller.ts
│       ├── [module].service.ts
│       └── [module].module.ts
```

---

## 🔧 Implémentation

### 1. [Composant/Service Principal]

**Fichier** : `src/modules/[module]/[module].service.ts`

[Détails d'implémentation]

**Méthodes principales** :
- `method1()` : Description
- `method2()` : Description

---

## 🧪 Tests

### Commandes de test

```powershell
# Démarrer le backend
cd backend
npm run start:dev

# Tester l'endpoint
Invoke-RestMethod -Uri http://localhost:4000/[endpoint] -Method GET
```

### Exemples de requêtes

```powershell
# GET
Invoke-RestMethod -Uri http://localhost:4000/[endpoint]

# POST avec body
$body = @{ field1 = "value1" } | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:4000/[endpoint] -Method POST -Body $body -ContentType "application/json"
```

---

## ⚠️ Points d'Attention

1. **Point critique 1** : Description
2. **Point critique 2** : Description

---

## 📚 Références

- [Documentation connexe 1](../autre-phase/fichier.md)
- [Documentation connexe 2](./autre-fichier.md)
- [Documentation officielle externe](https://example.com)

---

**Statut final** : ✅ **100% complété**
```

---

### Template : Document Technique Frontend

```markdown
# [Titre] - Documentation Frontend

**Date de création** : [Date]  
**Dernière mise à jour** : [Date]  
**Statut** : ✅ Complété / 🔄 En cours

---

## 📋 Vue d'ensemble

[Description de la fonctionnalité/page/composant]

---

## 🎯 Objectifs

- ✅ Objectif 1
- ✅ Objectif 2

---

## 🏗️ Structure

### Fichiers créés

```
frontend/
├── pages/
│   └── [page-name].tsx
├── components/
│   └── [Component].tsx
└── hooks/
    └── use[Hook].tsx
```

---

## 🎨 Interface Utilisateur

[Description de l'interface, captures d'écran si possible]

### Pages créées

- **`/[route]`** : Description de la page
- **`/[autre-route]`** : Description

### Composants créés

- **`[Component]`** : Description
- **`[Component2]`** : Description

---

## 💻 Implémentation

### 1. [Composant/Page Principal]

**Fichier** : `frontend/pages/[page].tsx` ou `frontend/components/[Component].tsx`

[Code et explications]

### 2. Hooks Utilisés

- **`use[Hook]`** : Description

---

## 🔗 Intégration Backend

### Endpoints utilisés

- `GET /api/[endpoint]` : Description
- `POST /api/[endpoint]` : Description

### Fichier API

**`frontend/lib/api.ts`** : [Fonctions ajoutées]

---

## 🧪 Tests

### Vérification manuelle

1. Lancer le frontend : `npm run dev`
2. Naviguer vers `http://localhost:3000/[route]`
3. Vérifier que [comportement attendu]

---

## 🔗 Voir Aussi

- [Backend associé](../../phase-XX_*/backend/fichier.md)
- [Autre doc frontend](./autre-fichier.md)

---

**Statut final** : ✅ **100% complété**
```

---

### Template : Document Cross (Transversal)

```markdown
# [Titre] - Documentation Transversale

**Date de création** : [Date]  
**Dernière mise à jour** : [Date]  
**Statut** : ✅ Complété / 🔄 En cours

---

## 📋 Vue d'ensemble

[Description globale de la phase/fonctionnalité]

Cette phase/fonctionnalité couvre à la fois le backend et le frontend.

---

## 🎯 Objectifs

### Backend
- ✅ Objectif backend 1
- ✅ Objectif backend 2

### Frontend
- ✅ Objectif frontend 1
- ✅ Objectif frontend 2

---

## 🏗️ Architecture Globale

[Vue d'ensemble de l'architecture complète]

### Flux de Données

```
Frontend → API Backend → Base de Données
   ↓           ↓              ↓
[Pages]   [Controllers]   [Prisma]
```

---

## 🔧 Implémentation Backend

### Modules créés

- **[Module 1]** : Description
- **[Module 2]** : Description

**Voir** : [Documentation backend détaillée](../backend/fichier.md)

---

## 🎨 Implémentation Frontend

### Pages créées

- **[Page 1]** : Description
- **[Page 2]** : Description

**Voir** : [Documentation frontend détaillée](../frontend/fichier.md)

---

## 🔗 Documentation Détaillée

### Backend
- [Document backend 1](../backend/fichier1.md)
- [Document backend 2](../backend/fichier2.md)

### Frontend
- [Document frontend 1](../frontend/fichier1.md)
- [Document frontend 2](../frontend/fichier2.md)

---

## 📊 Récapitulatif

| Composant | Backend | Frontend |
|-----------|---------|----------|
| [Feature 1] | ✅ | ✅ |
| [Feature 2] | ✅ | ✅ |

---

**Statut final** : ✅ **100% complété**
```

---

## 🔍 Checklist de Maintenance

### Avant de créer un nouveau document

- [ ] J'ai identifié la phase correcte (00-99)
- [ ] J'ai identifié le scope (backend/frontend/cross)
- [ ] J'ai vérifié qu'un document similaire n'existe pas déjà
- [ ] J'ai préparé le contenu avec les sections standard
- [ ] J'ai choisi le template approprié

### Après création d'un document

- [ ] Le fichier est nommé selon la convention `phase-XX_description_scope.md`
- [ ] Le fichier est dans le bon dossier de phase
- [ ] Le lien est ajouté dans `docs/README.md` sous la bonne section
- [ ] Tous les liens internes fonctionnent
- [ ] Le document suit le template approprié
- [ ] La date de création est renseignée

### Avant d'archiver un document

- [ ] J'ai vérifié que le document est vraiment obsolète
- [ ] J'ai identifié le document de remplacement (si applicable)
- [ ] J'ai préparé la note d'obsolescence
- [ ] J'ai identifié tous les liens vers ce document

### Après archivage d'un document

- [ ] Le fichier est dans `docs/_archives/`
- [ ] Le fichier a le préfixe `OBSOLETE_`
- [ ] Une note d'obsolescence est ajoutée en haut du fichier
- [ ] Tous les liens vers ce document sont corrigés ou marqués comme obsolètes
- [ ] Le README.md est mis à jour (marqué comme obsolète ou retiré)

---

## 🚨 Règles d'Or

1. **NE JAMAIS** supprimer un document → L'archiver avec préfixe `OBSOLETE_`
2. **TOUJOURS** respecter la convention de nommage `phase-XX_description_scope.md`
3. **TOUJOURS** utiliser des chemins relatifs pour les liens internes
4. **TOUJOURS** mettre à jour le `docs/README.md` après création/archivage
5. **TOUJOURS** ajouter une date de dernière mise à jour lors de modifications
6. **TOUJOURS** vérifier les liens après renommage/déplacement
7. **TOUJOURS** utiliser le bon scope : `backend`, `frontend`, ou `cross`
8. **TOUJOURS** placer le fichier dans le bon dossier de phase

---

## 📊 Commandes de Vérification PowerShell

### Lister tous les fichiers de doc

```powershell
Get-ChildItem -Path docs -Recurse -Filter *.md | Select-Object FullName
```

### Compter les documents par phase

```powershell
Get-ChildItem -Path docs\phase-* -Recurse -Filter *.md | 
  Group-Object { $_.Directory.Name } | 
  Select-Object Name, Count
```

### Trouver les fichiers qui ne suivent pas la convention

```powershell
Get-ChildItem -Path docs\phase-* -Recurse -Filter *.md | 
  Where-Object { $_.Name -notmatch "^phase-\d{2}(_|\.)" } |
  Select-Object FullName
```

### Rechercher tous les liens internes

```powershell
Select-String -Path docs\**\*.md -Pattern "\[.*\]\(\.\.?/" | 
  Select-Object Path, Line
```

### Vérifier les fichiers vides

```powershell
Get-ChildItem -Path docs -Recurse -Filter *.md | 
  Where-Object { $_.Length -eq 0 } | 
  Select-Object FullName
```

---

## 🔄 Workflow Typique

### 1. Nouvelle Fonctionnalité Implémentée

```
Phase 1: Identifier
├─ Quelle phase ? (ex: Phase 07)
├─ Quel scope ? (backend/frontend/cross)
└─ Quel nom descriptif ? (ex: websocket-integration)

Phase 2: Créer
├─ Utiliser la commande AI ou créer manuellement
├─ Suivre le template approprié
└─ Nom: phase-07_websocket-integration_backend.md

Phase 3: Documenter
├─ Vue d'ensemble
├─ Architecture
├─ Implémentation
├─ Tests
└─ Références

Phase 4: Intégrer
├─ Ajouter lien dans docs/README.md
├─ Ajouter références croisées
└─ Vérifier les liens
```

### 2. Fonctionnalité Obsolète/Remplacée

```
Phase 1: Préparer
├─ Identifier le document obsolète
├─ Identifier le document de remplacement (si applicable)
└─ Lister tous les liens vers ce document

Phase 2: Archiver
├─ Déplacer vers docs/_archives/
├─ Renommer avec préfixe OBSOLETE_
└─ Ajouter note d'obsolescence en haut du fichier

Phase 3: Corriger
├─ Mettre à jour tous les liens
├─ Mettre à jour README.md
└─ Vérifier qu'aucun lien cassé ne subsiste

Phase 4: Vérifier
└─ Lancer commande de vérification globale
```

---

## 📖 Références

- **Convention de nommage** : Voir `.cursorrules`
- **Commandes rapides** : Voir `./COMMANDES_CURSOR.md`
- **Rapports d'audit** : Voir `../_audits/_RAPPORT_*.md`
- **Table de correspondance** : Voir `../_audits/_CORRESPONDANCE_CHEMINS.md`

---

**Maintenu par** : Architecture d'information  
**Support** : Via AI Assistant dans Cursor avec `@AI`

