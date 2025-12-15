# Configuration SMTP Infomaniak - Guide détaillé

## 📧 Configuration Infomaniak

Infomaniak est un hébergeur suisse qui fournit des services email professionnels. Voici comment configurer SMTP avec Infomaniak.

## 🔧 Paramètres SMTP Infomaniak

### Paramètres standards

```env
SMTP_HOST=mail.infomaniak.com
SMTP_PORT=587
SMTP_USER=contact@chessbet.ch
SMTP_PASS=Dark-Revan-GE-9418657
SMTP_FROM="ChessBet <no-reply@chessbet.ch>"
```

### Ports disponibles

- **Port 587** (STARTTLS) - Recommandé pour la plupart des cas
- **Port 465** (SSL/TLS) - Alternative si le port 587 ne fonctionne pas
- **Port 25** - Généralement bloqué par les FAI, non recommandé

## 📝 Étapes de configuration

### 1. Récupérer vos identifiants SMTP Infomaniak

1. **Connectez-vous à votre compte Infomaniak :**
   - Allez sur https://login.infomaniak.com/
   - Connectez-vous avec vos identifiants

2. **Accédez à la gestion des emails :**
   - Dans le menu, allez dans "Email" ou "Messagerie"
   - Sélectionnez votre domaine

3. **Trouvez les paramètres SMTP :**
   - Cherchez "Paramètres SMTP" ou "Configuration SMTP"
   - Notez :
     - Votre adresse email complète (ex: `no-reply@votre-domaine.com`)
     - Votre mot de passe email (celui que vous utilisez pour vous connecter à votre boîte email)

### 2. Configurer le fichier .env

Dans votre fichier `.env` à la racine du projet (ou dans `backend/.env`), ajoutez :

```env
# SMTP Infomaniak
SMTP_HOST=mail.infomaniak.com
SMTP_PORT=587
SMTP_USER=no-reply@votre-domaine.com
SMTP_PASS=votre-mot-de-passe-email
SMTP_FROM="ChessBet <no-reply@votre-domaine.com>"
FRONTEND_URL=http://localhost:3000
```

**Important :**
- Remplacez `no-reply@votre-domaine.com` par votre vraie adresse email Infomaniak
- Remplacez `votre-mot-de-passe-email` par votre vrai mot de passe
- Remplacez `votre-domaine.com` par votre domaine réel dans `SMTP_FROM`

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

### Erreur "Invalid login" ou "Authentication failed"

**Causes possibles :**
1. **Mauvais identifiants** : Vérifiez que `SMTP_USER` et `SMTP_PASS` sont corrects
2. **Email non vérifié** : Assurez-vous que l'email Infomaniak est actif et vérifié
3. **Espaces dans le .env** : Vérifiez qu'il n'y a pas d'espaces avant/après les valeurs

**Solution :**
- Vérifiez vos identifiants dans l'interface Infomaniak
- Testez la connexion avec un client email (Thunderbird, Outlook) pour confirmer que les identifiants fonctionnent
- Vérifiez le format du `.env` (pas d'espaces, pas de guillemets autour des valeurs sauf pour `SMTP_FROM`)

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
SMTP_USER=no-reply@votre-domaine.com
SMTP_PASS=votre-mot-de-passe-email
SMTP_FROM="ChessBet <no-reply@votre-domaine.com>"
```

Le code détectera automatiquement que le port 465 nécessite SSL.

## 📋 Exemple de fichier .env complet

```env
# Database
DATABASE_URL=postgresql://chessbet_user:password@localhost:5433/chessbet_db?schema=public

# Backend
PORT_BACKEND=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# JWT
JWT_SECRET=your-secret-key-change-in-production

# SMTP Infomaniak
SMTP_HOST=mail.infomaniak.com
SMTP_PORT=587
SMTP_USER=no-reply@votre-domaine.com
SMTP_PASS=votre-mot-de-passe-email
SMTP_FROM="ChessBet <no-reply@votre-domaine.com>"
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
- Utilisez des mots de passe forts pour votre compte email Infomaniak
- En production, utilisez des variables d'environnement sécurisées
- Limitez les permissions de l'utilisateur SMTP si possible

## 📞 Support Infomaniak

Si vous avez des problèmes spécifiques à Infomaniak :
- Documentation : https://www.infomaniak.com/fr/support
- Support : https://www.infomaniak.com/fr/support/contact

---

**Dernière mise à jour :** 5 décembre 2025

