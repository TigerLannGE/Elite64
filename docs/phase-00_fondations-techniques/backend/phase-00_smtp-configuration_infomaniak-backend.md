# Configuration SMTP Infomaniak - Documentation Backend

**Date de création** : 15 janvier 2025  
**Dernière mise à jour** : 15 janvier 2025  
**Statut** : ✅ Complété

---

## 📋 Vue d'ensemble

## 📧 Configuration Infomaniak

Infomaniak est un hébergeur suisse qui fournit des services email professionnels. Voici comment configurer SMTP avec Infomaniak.

## 🔧 Paramètres SMTP Infomaniak

### Paramètres standards

```env
SMTP_HOST=mail.infomaniak.com
SMTP_PORT=587
SMTP_USER=contact@elite64.app
SMTP_PASS=votre-mot-de-passe-d-application
SMTP_FROM="Elite64 <no-reply@elite64.app>"
```

**⚠️ IMPORTANT :** Infomaniak utilise maintenant des **mots de passe d'application** pour chaque appareil/service. Vous ne pouvez plus utiliser le mot de passe principal de votre compte email. Voir la section "Créer un mot de passe d'application" ci-dessous.

### Ports disponibles

- **Port 587** (STARTTLS) - Recommandé pour la plupart des cas
- **Port 465** (SSL/TLS) - Alternative si le port 587 ne fonctionne pas
- **Port 25** - Généralement bloqué par les FAI, non recommandé

## 📝 Étapes de configuration

### 1. Créer un mot de passe d'application Infomaniak

**⚠️ IMPORTANT :** Infomaniak a changé sa politique de sécurité. Chaque appareil/service doit maintenant utiliser un **mot de passe d'application dédié** au lieu du mot de passe principal du compte email.

1. **Connectez-vous à votre compte Infomaniak :**
   - Allez sur https://manager.infomaniak.com/
   - Connectez-vous avec vos identifiants

2. **Accédez à la gestion de votre boîte email :**
   - Dans le menu, allez dans "Email" ou "Messagerie"
   - Sélectionnez votre domaine (ex: `elite64.app`)
   - Sélectionnez votre boîte email (ex: `contact@elite64.app`)

3. **Créez un mot de passe d'application :**
   - Allez dans l'onglet "Appareils" ou "Gestion des mots de passe"
   - Cliquez sur "Configurer un appareil" ou "Créer un mot de passe d'application"
   - Donnez un nom à votre appareil (ex: "Elite64 Backend" ou "Elite64 Backend")
   - Type : SMTP
   - **Copiez le mot de passe généré** (il ne sera affiché qu'une seule fois !)
   - Notez-le dans un endroit sûr

**Note :** Le mot de passe d'application est différent du mot de passe principal de votre compte email. Il est généralement plus long et aléatoire (ex: `U8KjUBGKG6&H7H*V`).

### 2. Configurer le fichier .env

Dans votre fichier `.env` à la racine du projet (ou dans `backend/.env`), ajoutez :

```env
# SMTP Infomaniak
SMTP_HOST=mail.infomaniak.com
SMTP_PORT=587
SMTP_USER=contact@elite64.app
SMTP_PASS=votre-mot-de-passe-d-application
SMTP_FROM="Elite64 <no-reply@elite64.app>"
FRONTEND_URL=http://localhost:3000
```

**Important :**
- `SMTP_USER` : Votre adresse email complète (ex: `contact@elite64.app`)
- `SMTP_PASS` : Le **mot de passe d'application** que vous avez créé à l'étape 1 (pas le mot de passe principal !)
- `SMTP_FROM` : L'adresse d'expéditeur (peut être différente de `SMTP_USER`)
- **Pas de guillemets** autour de `SMTP_PASS` (sauf si votre shell l'exige)
- **Pas d'espaces** avant ou après le `=`

### 3. Vérifier la configuration

Après avoir modifié le `.env`, redémarrez votre serveur backend :

```bash
cd backend
npm run start:dev
```

Vous devriez voir dans les logs :
```
✓ Connexion SMTP vérifiée avec succès
```

Si vous voyez une erreur, consultez la section "Dépannage" ci-dessous.

## 🔍 Dépannage

### Erreur "Invalid login" ou "Authentication failed" (535 5.7.0)

**Causes possibles :**
1. **Utilisation du mauvais mot de passe** : Vous utilisez le mot de passe principal au lieu du mot de passe d'application
2. **Mauvais identifiants** : Vérifiez que `SMTP_USER` et `SMTP_PASS` sont corrects
3. **Email non vérifié** : Assurez-vous que l'email Infomaniak est actif et vérifié
4. **Espaces dans le .env** : Vérifiez qu'il n'y a pas d'espaces avant/après les valeurs
5. **Guillemets autour du mot de passe** : Le mot de passe ne doit pas être entre guillemets dans le `.env`

**Solutions :**
1. **Vérifiez que vous utilisez un mot de passe d'application** :
   - Allez dans votre interface Infomaniak → Email → Appareils
   - Vérifiez que vous avez bien créé un mot de passe d'application pour SMTP
   - Si nécessaire, créez-en un nouveau et mettez à jour votre `.env`

2. **Vérifiez le format du `.env`** :
   ```env
   # ✅ Correct
   SMTP_PASS=U8KjUBGKG6&H7H*V
   
   # ❌ Incorrect (avec guillemets)
   SMTP_PASS="U8KjUBGKG6&H7H*V"
   ```

3. **Testez la connexion** :
   - Vérifiez vos identifiants dans l'interface Infomaniak
   - Testez la connexion avec un client email (Thunderbird, Outlook) pour confirmer que les identifiants fonctionnent

### Erreur "Connection timeout" ou "ECONNREFUSED"

**Causes possibles :**
1. **Port bloqué** : Votre pare-feu ou FAI bloque le port 587
2. **Mauvais host** : Vérifiez que `SMTP_HOST` est correct

**Solutions :**
1. Essayez le port 465 avec SSL :
   ```env
   SMTP_PORT=465
   ```
   (Le code détectera automatiquement que c'est un port sécurisé)

2. Vérifiez votre pare-feu :
   - Autorisez les connexions sortantes sur les ports 587 ou 465
   - Vérifiez que votre antivirus n'bloque pas les connexions SMTP

3. Vérifiez le host :
   - Certains comptes Infomaniak utilisent `smtp.infomaniak.com` au lieu de `mail.infomaniak.com`
   - Essayez les deux si nécessaire

### Erreur "Self signed certificate" ou problèmes TLS

**Solution :**
Le code gère déjà cela avec `rejectUnauthorized: false`, mais si vous avez encore des problèmes :
- Vérifiez que vous utilisez le port 587 (STARTTLS) ou 465 (SSL)
- Assurez-vous que votre version de Node.js est à jour

### Les emails ne sont pas reçus

**Vérifications :**
1. **Vérifiez les logs du backend** : Vous devriez voir `✓ Email envoyé avec succès`
2. **Vérifiez les spams** : Les emails peuvent être dans le dossier spam
3. **Vérifiez l'adresse destinataire** : Assurez-vous que l'email de test est valide
4. **Vérifiez les logs Infomaniak** : Dans votre interface Infomaniak, vérifiez les logs d'envoi

### Configuration alternative : Port 465 (SSL)

Si le port 587 ne fonctionne pas, essayez le port 465 :

```env
SMTP_HOST=mail.infomaniak.com
SMTP_PORT=465
SMTP_USER=contact@elite64.app
SMTP_PASS=votre-mot-de-passe-d-application
SMTP_FROM="Elite64 <no-reply@elite64.app>"
```

Le code détectera automatiquement que le port 465 nécessite SSL.

## 📋 Exemple de fichier .env complet

```env
# Database
DATABASE_URL=postgresql://elite64_user:password@localhost:5433/elite64_db?schema=public

# Backend
PORT_BACKEND=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# JWT
JWT_SECRET=your-secret-key-change-in-production

# SMTP Infomaniak
SMTP_HOST=mail.infomaniak.com
SMTP_PORT=587
SMTP_USER=contact@elite64.app
SMTP_PASS=votre-mot-de-passe-d-application
SMTP_FROM="Elite64 <no-reply@elite64.app>"
```

## ✅ Test de la configuration

1. **Redémarrez le backend** après avoir modifié le `.env`
2. **Créez un compte de test** via le frontend (`/register`)
3. **Vérifiez les logs du backend** :
   - Vous devriez voir : `✓ Connexion SMTP vérifiée avec succès` au démarrage
   - Lors de l'inscription : `✓ Email de vérification envoyé avec succès`
4. **Vérifiez votre boîte email** (et les spams)

## 🔐 Sécurité

- **Ne commitez JAMAIS** votre fichier `.env` dans Git
- **Utilisez des mots de passe d'application** au lieu du mot de passe principal (plus sécurisé)
- En production, utilisez des variables d'environnement sécurisées
- Limitez les permissions de l'utilisateur SMTP si possible
- Si un mot de passe d'application est compromis, supprimez-le et créez-en un nouveau dans l'interface Infomaniak

## 📞 Support Infomaniak

Si vous avez des problèmes spécifiques à Infomaniak :
- Documentation : https://www.infomaniak.com/fr/support
- Support : https://www.infomaniak.com/fr/support/contact

---

**Dernière mise à jour :** 15 janvier 2025

**Changements récents :**
- Mise à jour pour refléter l'utilisation des mots de passe d'application Infomaniak (obligatoire depuis 2025)
- Domaine mis à jour vers `elite64.app`

