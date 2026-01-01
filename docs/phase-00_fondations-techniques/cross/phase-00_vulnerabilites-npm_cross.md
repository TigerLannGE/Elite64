# Gestion des Vulnérabilités NPM - Documentation Transversale

**Date de création** : 15 décembre 2025  
**Dernière mise à jour** : 15 décembre 2025  
**Statut** : ✅ Complété

---

## 📋 Vue d'ensemble

Ce document fournit un guide complet pour la gestion des vulnérabilités NPM dans le projet Elite64, incluant les procédures d'analyse, de correction et de documentation des failles de sécurité détectées.

**⚠️ Important** : La sécurité des dépendances est critique pour un projet manipulant des transactions financières. Ce guide doit être consulté régulièrement lors de l'ajout ou de la mise à jour de dépendances.

---

## 🎯 Objectifs

- ✅ Fournir une procédure standardisée d'analyse des vulnérabilités
- ✅ Documenter les vulnérabilités détectées et leurs corrections
- ✅ Établir des critères de décision (corriger maintenant vs plus tard)
- ✅ Maintenir un historique des correctifs de sécurité

---

## 🔍 Analyse des Vulnérabilités

### Commandes de base

```bash
# Analyse complète des vulnérabilités
npm audit

# Analyse en format JSON (pour traitement programmatique)
npm audit --json

# Analyse uniquement vulnérabilités critiques/hautes
npm audit --audit-level=high

# Tester un fix sans l'appliquer
npm audit fix --dry-run
```

### Lecture du rapport

Un rapport `npm audit` contient :
- **Nom du package** concerné
- **Sévérité** : low, moderate, high, critical
- **Type de vulnérabilité** : SSRF, XSS, DoS, Authorization Bypass, etc.
- **CWE** (Common Weakness Enumeration)
- **CVSS Score** (0-10, score de criticité standardisé)
- **URL GitHub Advisory** : lien vers les détails
- **Range affecté** : versions vulnérables
- **Fix disponible** : version corrigée proposée

---

## 🚨 Historique des Vulnérabilités

### 15 Décembre 2025 - Next.js 14.0.0 → 14.2.35

**Package concerné** : `next@14.0.0`  
**Sévérité** : **CRITIQUE** (13 vulnérabilités cumulées)

#### Vulnérabilités majeures détectées

| ID GitHub | Titre | Sévérité | CVSS | CWE |
|-----------|-------|----------|------|-----|
| GHSA-f82v-jwr5-mffw | Authorization Bypass in Middleware | **CRITICAL** | 9.1 | CWE-285, CWE-863 |
| GHSA-mwv6-3258-q52c | DoS with Server Components | HIGH | 7.5 | CWE-400, CWE-502 |
| GHSA-5j59-xgg2-r9c4 | DoS with Server Components (Follow-up) | HIGH | 7.5 | CWE-400, CWE-1395 |
| GHSA-7gfc-8cq8-jh5f | Authorization bypass vulnerability | HIGH | 7.5 | CWE-285, CWE-863 |
| GHSA-fr5h-rqp8-mj6g | SSRF in Server Actions | HIGH | 7.5 | CWE-918 |
| GHSA-gp8f-8m3g-qvj9 | Cache Poisoning | HIGH | 7.5 | CWE-349, CWE-639 |
| GHSA-4342-x723-ch2f | SSRF via Middleware Redirect | MODERATE | 6.5 | CWE-918 |
| GHSA-g5qg-72qw-gw5v | Cache Key Confusion (Image Optimization) | MODERATE | 6.2 | CWE-524 |
| GHSA-g77x-44xx-532m | DoS in Image Optimization | MODERATE | 5.9 | CWE-674 |
| GHSA-7m27-7ghc-44w9 | DoS with Server Actions | MODERATE | 5.3 | CWE-770 |
| GHSA-xv57-4mr9-wg8v | Content Injection (Image Optimization) | MODERATE | 4.3 | CWE-20 |
| GHSA-qpjv-v59x-3qc4 | Race Condition to Cache Poisoning | LOW | 3.7 | CWE-362 |
| GHSA-3h52-269p-cp9r | Info Exposure in Dev Server | LOW | 0 | CWE-1385 |

#### Impact sur Elite64

Les vulnérabilités critiques identifiées représentaient un risque élevé :

1. **Authorization Bypass** (CVSS 9.1) : Permettait de contourner les middlewares d'autorisation
   - **Critique** pour un projet avec rôles PLAYER/ADMIN/SUPER_ADMIN
   - Risque d'accès non autorisé à l'espace admin

2. **SSRF (Server-Side Request Forgery)** (CVSS 7.5) : 
   - Exploitation possible des Server Actions
   - Risque de requêtes malveillantes depuis le serveur

3. **DoS (Denial of Service)** (CVSS 7.5) :
   - Surcharge serveur via Server Components
   - Impact sur la disponibilité du service

#### Correctif appliqué

**Commande** :
```bash
npm install next@14.2.35 --legacy-peer-deps
```

**Note** : `--legacy-peer-deps` nécessaire à cause du conflit avec `react-chessboard@5.8.6` (requiert React 19, projet utilise React 18).

**Résultat** :
```bash
npm audit
# found 0 vulnerabilities ✅
```

**Statut** : ✅ **Toutes les vulnérabilités corrigées**

---

## ⚖️ Critères de Décision

### Corriger immédiatement si :

- ✅ **Sévérité CRITICAL** (CVSS ≥ 9.0)
- ✅ **Sévérité HIGH** (CVSS 7.0-8.9) ET le projet est exposé publiquement
- ✅ Vulnérabilité touche un système critique (auth, transactions, admin)
- ✅ Exploit public disponible (poc-exploit dans GitHub Advisory)
- ✅ Package directement utilisé (non transitive dependency)

### Reporter à plus tard si :

- ⚠️ **Phase de développement local uniquement** (pas encore en production)
- ⚠️ Vulnérabilité dans une dépendance de développement (non prod)
- ⚠️ Sévérité LOW ou MODERATE sans exploit connu
- ⚠️ Correction nécessite un upgrade majeur avec breaking changes
- ⚠️ Vulnérabilité concerne un cas d'usage non utilisé dans le projet

**Important** : Documenter la décision dans une TODO/issue pour traiter avant la mise en production.

---

## 🔧 Procédures de Correction

### 1. Analyse initiale

```bash
cd frontend  # ou backend
npm audit --json > audit-report.json
```

Identifier :
- Package(s) concerné(s)
- Sévérité et CVSS
- Fix disponible ou non

### 2. Correction automatique

```bash
# Tenter un fix automatique (peut échouer si conflits)
npm audit fix

# Version agressive (peut upgrader des majeurs)
npm audit fix --force
```

⚠️ **Attention** : `npm audit fix --force` peut introduire des breaking changes. Tester après application.

### 3. Correction manuelle

Si `npm audit fix` échoue :

```bash
# Upgrader manuellement le package
npm install package-name@version-corrigée

# Avec --legacy-peer-deps si conflit de peer dependencies
npm install package-name@version-corrigée --legacy-peer-deps
```

### 4. Vérification post-correction

```bash
# Vérifier qu'il n'y a plus de vulnérabilités
npm audit

# Vérifier que le projet démarre
npm run dev  # ou start:dev

# Lancer les tests (si disponibles)
npm test
```

### 5. Documentation

- Mettre à jour ce document avec les détails
- Ajouter une entrée dans la section "Historique des Vulnérabilités"
- Mettre à jour `docs/README.md` dans "Changements récents"

---

## 🛡️ Bonnes Pratiques

### Lors de l'ajout d'une nouvelle dépendance

1. **Vérifier la popularité** : npm downloads, GitHub stars
2. **Vérifier la maintenance** : dernière release, issues ouvertes
3. **Vérifier la licence** : compatible avec le projet (éviter GPL pour libertés commerciales)
4. **Scanner les vulnérabilités** : `npm audit` après installation
5. **Préférer les packages maintenus** : éviter les packages abandonnés

### Maintenance régulière

- 🔄 **Hebdomadaire en dev** : Lancer `npm audit` sur frontend et backend
- 🔄 **Avant chaque release** : Corriger toutes les vulnérabilités HIGH et CRITICAL
- 🔄 **Après chaque `npm install`** : Vérifier si de nouvelles vulnérabilités apparaissent
- 🔄 **Upgrader les dépendances majeures** : Au moins une fois par trimestre

### En production

- ✅ **Aucune vulnérabilité CRITICAL ou HIGH** tolérée
- ✅ Mettre en place un système d'alertes (GitHub Dependabot, Snyk, etc.)
- ✅ Tester en environnement de staging avant de déployer un correctif
- ✅ Garder un historique des audits dans des fichiers datés

---

## 🔗 Outils Complémentaires

### GitHub Dependabot

Activer dans les paramètres du repository :
- Alertes automatiques de sécurité
- Pull requests automatiques pour les correctifs

### Snyk

```bash
# Installation
npm install -g snyk

# Authentification
snyk auth

# Scan du projet
snyk test

# Monitoring continu
snyk monitor
```

### npm-check-updates

```bash
# Installation
npm install -g npm-check-updates

# Voir les mises à jour disponibles
ncu

# Mettre à jour package.json (sans installer)
ncu -u

# Puis installer
npm install
```

---

## 📊 Commandes PowerShell Utiles

### Générer un rapport d'audit daté

```powershell
$date = Get-Date -Format "yyyy-MM-dd"
npm audit --json > "audit-report-$date.json"
npm audit > "audit-report-$date.txt"
```

### Comparer deux rapports

```powershell
# Générer rapport avant
npm audit --json > audit-before.json

# Appliquer corrections...

# Générer rapport après
npm audit --json > audit-after.json

# Comparer (nécessite un outil comme jq ou Compare-Object)
```

### Vérifier les deux projets (frontend + backend)

```powershell
# Frontend
cd frontend
Write-Host "=== FRONTEND AUDIT ===" -ForegroundColor Cyan
npm audit
Write-Host ""

# Backend
cd ..\backend
Write-Host "=== BACKEND AUDIT ===" -ForegroundColor Cyan
npm audit
Write-Host ""

cd ..
```

---

## ⚠️ Points d'Attention

1. **Conflits de peer dependencies** : Utiliser `--legacy-peer-deps` si nécessaire, mais documenter pourquoi
2. **Breaking changes** : Lire les CHANGELOG des packages avant d'upgrader
3. **Dépendances transitives** : Certaines vulnérabilités viennent de dépendances indirectes (plus difficiles à corriger)
4. **Faux positifs** : Certains audits signalent des vulnérabilités non applicables au projet (ex: vulnérabilité dev-only en prod)
5. **Versions canary/beta** : Éviter en production, même pour corriger une vulnérabilité

---

## 📚 Références

### Documentation officielle
- [npm audit documentation](https://docs.npmjs.com/cli/v10/commands/npm-audit)
- [GitHub Advisory Database](https://github.com/advisories)
- [Common Weakness Enumeration (CWE)](https://cwe.mitre.org/)
- [CVSS Calculator](https://www.first.org/cvss/calculator/3.1)

### Guides de sécurité
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Next.js Security Headers](https://nextjs.org/docs/app/api-reference/next-config-js/headers)

### Autres documentations Elite64
- [Configuration SMTP](../backend/phase-00_smtp-configuration_generique-backend.md)
- [Schéma Prisma](../backend/phase-00_prisma-schema_overview-backend.md)
- [Démarrage rapide](./phase-00_quickstart-detaille_cross.md)

---

## 🔄 Changelog

### 15 décembre 2025
- ✅ Création du document
- ✅ Documentation de la correction Next.js 14.0.0 → 14.2.35
- ✅ Ajout des procédures et bonnes pratiques
- ✅ Ajout des commandes PowerShell pour Windows

---

**Statut final** : ✅ **100% complété**

