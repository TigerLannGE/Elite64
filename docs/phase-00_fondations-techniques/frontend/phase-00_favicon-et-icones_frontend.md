# Configuration Favicon et Icônes

**Date de création :** 14 décembre 2025  
**Dernière mise à jour :** 14 décembre 2025  
**Statut :** ✅ Complété et fonctionnel

## 📋 Vue d'ensemble

Ce document décrit la configuration du favicon et des icônes pour la plateforme Elite64. Le favicon est l'icône qui s'affiche dans l'onglet du navigateur et dans les favoris.

---

## 🎯 Problème résolu

**Erreur initiale :**
```
favicon.ico:1  GET http://localhost:3000/favicon.ico 404 (Not Found)
```

Le navigateur cherchait le fichier `favicon.ico` à la racine de l'application, mais celui-ci n'existait pas.

---

## 📁 Structure des fichiers

### Emplacement des fichiers

Tous les fichiers du favicon sont placés dans le dossier `public/` à la racine du projet frontend :

```
frontend/
└── public/
    ├── favicon.ico                    # Icône principale (format ICO)
    ├── favicon-16x16.png              # Icône 16x16 pixels
    ├── favicon-32x32.png              # Icône 32x32 pixels
    ├── apple-touch-icon.png           # Icône pour iOS (180x180)
    ├── android-chrome-192x192.png     # Icône Android 192x192
    ├── android-chrome-512x512.png     # Icône Android 512x512
    └── site.webmanifest               # Manifeste pour PWA
```

### Fichier `_document.tsx`

Le fichier `pages/_document.tsx` a été créé pour référencer toutes les icônes dans le `<head>` de l'application :

```tsx
import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="fr">
      <Head>
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
```

---

## 🔧 Configuration

### 1. Dossier `public/`

Dans Next.js, le dossier `public/` est utilisé pour servir les fichiers statiques. Tous les fichiers placés dans ce dossier sont accessibles directement depuis la racine de l'URL (ex: `/favicon.ico`).

### 2. Références dans le head

Les différentes références permettent de :
- **`favicon.ico`** : Icône principale pour les navigateurs classiques
- **`favicon-16x16.png` et `favicon-32x32.png`** : Versions PNG pour une meilleure qualité
- **`apple-touch-icon.png`** : Icône utilisée par iOS lorsque l'utilisateur ajoute le site à l'écran d'accueil
- **`site.webmanifest`** : Manifeste pour les Progressive Web Apps (PWA)

### 3. Format du manifeste

Le fichier `site.webmanifest` contient les métadonnées de l'application :

```json
{
  "name": "",
  "short_name": "",
  "icons": [
    {
      "src": "/android-chrome-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/android-chrome-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "theme_color": "#ffffff",
  "background_color": "#ffffff",
  "display": "standalone"
}
```

---

## ✅ Vérification

### Test de fonctionnement

1. **Redémarrer le serveur de développement** :
   ```bash
   npm run dev
   ```

2. **Vérifier dans le navigateur** :
   - Ouvrir `http://localhost:3000`
   - Vérifier que l'icône s'affiche dans l'onglet du navigateur
   - Vérifier qu'il n'y a plus d'erreur 404 dans la console

3. **Vérifier les fichiers** :
   - Tous les fichiers doivent être accessibles :
     - `http://localhost:3000/favicon.ico`
     - `http://localhost:3000/favicon-16x16.png`
     - `http://localhost:3000/favicon-32x32.png`
     - `http://localhost:3000/apple-touch-icon.png`
     - `http://localhost:3000/site.webmanifest`

---

## 📝 Notes importantes

### Next.js et les fichiers statiques

- Les fichiers dans `public/` sont servis depuis la racine (`/`)
- Ne pas créer de sous-dossiers dans `public/` pour les icônes (sauf si nécessaire)
- Le fichier `_document.tsx` est rendu uniquement côté serveur

### Personnalisation future

Si vous souhaitez personnaliser le favicon :

1. Générer de nouveaux fichiers avec un outil comme [favicon.io](https://favicon.io/)
2. Remplacer les fichiers dans `public/`
3. Mettre à jour `site.webmanifest` si nécessaire
4. Redémarrer le serveur de développement

### Compatibilité

- ✅ Chrome/Edge (Windows, macOS, Linux)
- ✅ Firefox (Windows, macOS, Linux)
- ✅ Safari (macOS, iOS)
- ✅ Mobile browsers (Android, iOS)

---

## 🔗 Ressources

- [Next.js - Static File Serving](https://nextjs.org/docs/basic-features/static-file-serving)
- [Next.js - Custom Document](https://nextjs.org/docs/advanced-features/custom-document)
- [Favicon Generator - favicon.io](https://favicon.io/)

---

## 📌 Checklist de déploiement

Avant de déployer en production, vérifier :

- [x] Tous les fichiers sont présents dans `public/`
- [x] Le fichier `_document.tsx` référence toutes les icônes
- [x] Aucune erreur 404 dans la console
- [x] Le favicon s'affiche correctement dans tous les navigateurs testés
- [x] Le manifeste est accessible et valide

---

**Auteur :** Configuration automatique  
**Version :** 1.0
