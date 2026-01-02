# Configuration SMTP - Documentation Backend

**Date de création** : 01 décembre 2025  
**Dernière mise à jour** : 01 décembre 2025  
**Statut** : ✅ Complété

---

## 📋 Vue d'ensemble

## 📧 Configuration SMTP

Le backend utilise **nodemailer** pour envoyer des emails de vérification et de réinitialisation de mot de passe. Vous devez configurer les variables d'environnement SMTP dans votre fichier `.env` du backend.

## 🔧 Variables d'environnement requises

Dans votre fichier `.env` du backend (ou à la racine du projet), vous devez définir :

```env
SMTP_HOST=<adresse du serveur SMTP>
SMTP_PORT=<port SMTP (587 ou 465)>
SMTP_USER=<votre email ou nom d'utilisateur SMTP>
SMTP_PASS=<votre mot de passe SMTP>
SMTP_FROM="Elite64 <no-reply@votre-domaine.com>"
FRONTEND_URL=http://localhost:3000
```

## 📮 Options de configuration SMTP

### Option 1 : Gmail (Recommandé pour le développement)

**Avantages :** Gratuit, facile à configurer, fiable

**Configuration :**

1. **Créer un mot de passe d'application Gmail :**
   - Allez sur https://myaccount.google.com/
   - Activez la validation en 2 étapes si ce n'est pas déjà fait
   - Allez dans "Sécurité" → "Mots de passe des applications"
   - Créez un nouveau mot de passe d'application (notez-le, vous ne le verrez qu'une fois)

2. **Variables d'environnement :**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=votre-email@gmail.com
   SMTP_PASS=votre-mot-de-passe-application
   SMTP_FROM="Elite64 <votre-email@gmail.com>"
   FRONTEND_URL=http://localhost:3000
   ```

**Note :** Utilisez le **mot de passe d'application** (pas votre mot de passe Gmail normal).

---

### Option 2 : Mailtrap (Recommandé pour les tests)

**Avantages :** Gratuit jusqu'à 500 emails/mois, capture tous les emails sans les envoyer, parfait pour le développement

**Configuration :**

1. **Créer un compte :**
   - Allez sur https://mailtrap.io/
   - Créez un compte gratuit
   - Dans "Inboxes" → "SMTP Settings", choisissez "Nodemailer"

2. **Variables d'environnement :**
   ```env
   SMTP_HOST=smtp.mailtrap.io
   SMTP_PORT=2525
   SMTP_USER=<votre-username-mailtrap>
   SMTP_PASS=<votre-password-mailtrap>
   SMTP_FROM="Elite64 <no-reply@elite64.app>"
   FRONTEND_URL=http://localhost:3000
   ```

**Note :** Les emails n'iront pas aux destinataires réels, ils seront capturés dans votre boîte Mailtrap pour les tests.

---

### Option 3 : Infomaniak (Recommandé pour la production)

**Avantages :** Service professionnel, adapté à la production

**📖 Guide détaillé :** Consultez le **[Configuration SMTP Infomaniak](./phase-00_smtp-configuration_infomaniak-backend.md)** pour un guide complet et détaillé spécifique à Infomaniak, incluant :
- Étapes détaillées de configuration
- Dépannage approfondi
- Solutions aux problèmes courants
- Configuration alternative (port 465)

**Configuration rapide :**

```env
SMTP_HOST=mail.infomaniak.com
SMTP_PORT=587
SMTP_USER=<votre-email@votre-domaine.com>
SMTP_PASS=<votre-mot-de-passe-email>
SMTP_FROM="Elite64 <no-reply@votre-domaine.com>"
FRONTEND_URL=http://localhost:3000
```

---

### Option 4 : SendGrid (Alternative pour la production)

**Avantages :** Service professionnel, 100 emails/jour gratuits

**Configuration :**

1. **Créer un compte et une API Key :**
   - Allez sur https://sendgrid.com/
   - Créez un compte
   - Allez dans "Settings" → "API Keys"
   - Créez une nouvelle API Key

2. **Variables d'environnement :**
   ```env
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASS=<votre-api-key-sendgrid>
   SMTP_FROM="Elite64 <no-reply@votre-domaine.com>"
   FRONTEND_URL=http://localhost:3000
   ```

---

## 🚀 Mise en place

### Étape 1 : Créer/modifier le fichier .env

Dans le dossier `backend/` (ou à la racine du projet), créez un fichier `.env` :

```bash
cd backend
# Copiez env.example vers .env
copy ..\env.example .env
```

Ou créez-le manuellement avec les variables SMTP ci-dessus.

### Étape 2 : Remplir les variables SMTP

Éditez le fichier `.env` et remplissez les valeurs SMTP selon l'option choisie.

### Étape 3 : Redémarrer le backend

Après avoir modifié le `.env`, redémarrez votre serveur backend :

```bash
npm run start:dev
```

### Étape 4 : Tester l'envoi d'email

1. Créez un nouveau compte via le frontend (`/register`)
2. Vérifiez les logs du backend pour voir si l'email est envoyé
3. Vérifiez votre boîte de réception (ou Mailtrap si vous l'utilisez)

## 🔍 Dépannage

### Erreur "Invalid login"

- Vérifiez que `SMTP_USER` et `SMTP_PASS` sont corrects
- Pour Gmail, utilisez un **mot de passe d'application**, pas votre mot de passe normal
- Vérifiez que vous n'avez pas d'espaces avant/après les valeurs dans le `.env`

### Erreur "Connection timeout"

- Vérifiez que `SMTP_HOST` et `SMTP_PORT` sont corrects
- Vérifiez votre connexion internet
- Vérifiez que votre pare-feu n'bloque pas le port SMTP

### Erreur "Authentication failed"

- Pour Gmail : assurez-vous d'avoir activé la validation en 2 étapes et créé un mot de passe d'application
- Vérifiez que les identifiants sont corrects
- Pour certains fournisseurs, l'email doit être vérifié avant de pouvoir envoyer

### Les emails ne sont pas reçus

- Vérifiez les spams
- Vérifiez les logs du backend pour voir les erreurs
- Pour Mailtrap, vérifiez votre boîte Mailtrap (les emails n'iront pas aux destinataires réels)
- Vérifiez que `FRONTEND_URL` est correct

## 📝 Exemple de fichier .env complet

```env
# Database
DATABASE_URL=postgresql://elite64_user:password@localhost:5433/elite64_db?schema=public

# Backend
PORT_BACKEND=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# JWT
JWT_SECRET=your-secret-key-change-in-production

# SMTP (exemple avec Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASS=votre-mot-de-passe-application-gmail
SMTP_FROM="Elite64 <votre-email@gmail.com>"
```

## ⚠️ Sécurité

- **Ne commitez JAMAIS** votre fichier `.env` dans Git
- Utilisez des mots de passe d'application pour Gmail (pas votre mot de passe principal)
- En production, utilisez des variables d'environnement sécurisées (ex: variables d'environnement du serveur, secrets manager)

---

**Dernière mise à jour :** 5 décembre 2025

