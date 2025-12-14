# Gérer les Comptes Suspendus côté Frontend - Phase 4.6

Ce document décrit l'implémentation frontend de la gestion des comptes suspendus, permettant d'afficher des messages clairs et de gérer automatiquement la déconnexion des utilisateurs suspendus.

**Date de création** : Phase 4.6  
**Statut** : ✅ Complété et testé

---

## 📋 Vue d'ensemble

Cette implémentation permet de :
- ✅ Détecter les erreurs `ACCOUNT_SUSPENDED` du backend
- ✅ Afficher des messages explicites pour les comptes suspendus
- ✅ Déconnecter automatiquement les utilisateurs suspendus
- ✅ Rediriger vers la page de login avec un message approprié
- ✅ Éviter de spammer le backend une fois qu'on sait que le compte est suspendu

**⚠️ Important** : Cette implémentation complète la Phase 4.6 backend qui bloque les comptes suspendus. Le frontend doit gérer ces erreurs de manière élégante pour l'utilisateur.

---

## 🎯 Format d'Erreur Backend

Le backend renvoie une erreur structurée quand un compte est suspendu :

**Sur le login** (`POST /auth/login`) :
- Status HTTP : `403 Forbidden`
- Body JSON : 
  ```json
  {
    "statusCode": 403,
    "code": "ACCOUNT_SUSPENDED",
    "message": "Votre compte a été suspendu. Contactez le support si vous pensez qu'il s'agit d'une erreur."
  }
  ```

**Sur les actions protégées** (ex: `/wallets/me`, `/tournaments/:id/join`) :
- Status HTTP : `403 Forbidden`
- Body JSON : Même format que ci-dessus

---

## 🏗️ Architecture Frontend

### 1. Extension du Type ApiError

**Fichier** : `frontend/lib/api.ts`

Le type `ApiError` a été étendu pour inclure le code d'erreur :

```typescript
export interface ApiError {
  message: string
  statusCode?: number
  code?: string
}

// Constante pour le code d'erreur de compte suspendu
export const ACCOUNT_SUSPENDED_CODE = 'ACCOUNT_SUSPENDED'

// Fonction utilitaire pour vérifier si une erreur est ACCOUNT_SUSPENDED
export function isAccountSuspended(error: unknown): boolean {
  const apiError = error as ApiError
  return apiError?.code === ACCOUNT_SUSPENDED_CODE || 
         (apiError?.statusCode === 403 && apiError?.code === ACCOUNT_SUSPENDED_CODE)
}
```

### 2. Extraction du Code d'Erreur

**Fichier** : `frontend/lib/api.ts`

La fonction `handleResponse` extrait automatiquement le code d'erreur depuis la réponse JSON :

```typescript
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Une erreur est survenue' }))
    
    // Extraire le message et le code
    let message = 'Une erreur est survenue'
    let code: string | undefined
    
    if (typeof errorData.message === 'string') {
      message = errorData.message
    } else if (errorData.message && typeof errorData.message === 'object') {
      message = errorData.message.message || message
      code = errorData.message.code
    }
    
    if (!code && errorData.code) {
      code = errorData.code
    }
    
    const error = {
      message,
      statusCode: response.status,
      code,
    } as ApiError
    
    throw error
  }
  return response.json()
}
```

---

## 📄 Pages Modifiées

### 1. Page de Login (`pages/login.tsx`)

**Gestion de `ACCOUNT_SUSPENDED` lors de la connexion** :

```typescript
try {
  await login(email, password)
  router.push('/lobby')
} catch (err) {
  const apiError = err as ApiError
  // Gestion spéciale pour les comptes suspendus
  if (apiError.code === 'ACCOUNT_SUSPENDED') {
    setError(
      "Votre compte a été suspendu. Si vous pensez qu'il s'agit d'une erreur, contactez le support."
    )
  } else {
    setError(apiError.message || 'Impossible de vous connecter.')
  }
}
```

**Affichage visuel distinct** :
- Style orange pour les comptes suspendus (`bg-orange-500/20 border-orange-500`)
- Style rouge pour les autres erreurs
- Titre "⚠️ Compte suspendu" pour une meilleure visibilité

**Gestion de la redirection** :
- Si l'utilisateur arrive depuis une redirection suite à une suspension (`?error=suspended`), le message s'affiche automatiquement

### 2. Page Lobby (`pages/lobby.tsx`)

**Gestion de `ACCOUNT_SUSPENDED` lors de "Rejoindre un tournoi"** :

```typescript
const handleJoinTournament = async (tournamentId: string) => {
  try {
    await api.joinTournament(tournamentId)
    await loadTournaments()
  } catch (err) {
    const apiError = err as ApiError
    // Gestion spéciale pour les comptes suspendus
    if (apiError.code === 'ACCOUNT_SUSPENDED' || (apiError.statusCode === 403 && apiError.code === 'ACCOUNT_SUSPENDED')) {
      setError("Votre compte a été suspendu. Vous ne pouvez plus rejoindre de tournois.")
      // Déconnecter automatiquement après 3 secondes et rediriger vers login
      setTimeout(() => {
        logout()
        router.push('/login?error=suspended')
      }, 3000)
    } else {
      setError(apiError.message || 'Erreur lors de l\'inscription au tournoi.')
    }
  }
}
```

**Comportement** :
- Message d'erreur orange affiché au-dessus de la liste des tournois
- Déconnexion automatique après 3 secondes
- Redirection vers `/login?error=suspended`

### 3. Page Wallet (`pages/wallet.tsx`)

**Gestion de `ACCOUNT_SUSPENDED` lors du chargement du wallet** :

```typescript
try {
  const wallet = await api.getMyWallet()
  setState({ loading: false, error: null, wallet })
} catch (error) {
  const apiError = error as ApiError
  if (apiError.statusCode === 401) {
    router.push('/login')
  } else if (apiError.code === 'ACCOUNT_SUSPENDED') {
    // Compte suspendu - afficher un message clair et rediriger
    setState({
      loading: false,
      error: apiError.message || 'Votre compte a été suspendu. Contactez le support si vous pensez qu\'il s\'agit d\'une erreur.',
      wallet: null,
    })
    // Déconnecter et rediriger vers login après 3 secondes
    setTimeout(() => {
      logout()
      router.push('/login?error=suspended')
    }, 3000)
  } else {
    setState({
      loading: false,
      error: apiError.message || 'Erreur lors du chargement du portefeuille',
      wallet: null,
    })
  }
}
```

**Gestion lors du crédit de test** :

```typescript
try {
  await api.testCredit(1000)
  const wallet = await api.getMyWallet()
  setState((prev) => ({ ...prev, wallet }))
} catch (error) {
  const apiError = error as ApiError
  // Gestion spéciale pour les comptes suspendus
  if (apiError.code === 'ACCOUNT_SUSPENDED') {
    alert(apiError.message || 'Votre compte a été suspendu. Vous ne pouvez pas effectuer cette action. Contactez le support si vous pensez qu\'il s\'agit d\'une erreur.')
    // Déconnecter et rediriger vers login après 3 secondes
    setTimeout(() => {
      logout()
      router.push('/login?error=suspended')
    }, 3000)
  } else {
    alert(apiError.message || 'Erreur lors du crédit de test')
  }
}
```

**Affichage visuel** :
- Style orange pour les erreurs de suspension
- Titre "⚠️ Compte suspendu" pour une meilleure visibilité

### 4. Hook useAuth (`hooks/useAuth.tsx`)

**Gestion de `ACCOUNT_SUSPENDED` lors de la vérification du token** :

```typescript
const checkAuth = async () => {
  try {
    const playerData = await api.getMe()
    setPlayer(playerData)
    setIsAuthenticated(true)
  } catch (error) {
    // Si c'est une suspension, nettoyer le token et rediriger
    if (isAccountSuspended(error)) {
      localStorage.removeItem('authToken')
      setIsAuthenticated(false)
      setPlayer(null)
      // Rediriger vers login avec un message si on est sur une page protégée
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        router.push('/login?error=suspended')
      }
    } else {
      // Token invalide ou expiré - nettoyer silencieusement
      localStorage.removeItem('authToken')
      setIsAuthenticated(false)
      setPlayer(null)
    }
  }
}
```

**Gestion lors du login** :

```typescript
const login = async (email: string, password: string) => {
  const response = await api.login(email, password)
  localStorage.setItem('authToken', response.accessToken)
  // Récupérer les données complètes du joueur (incluant le rôle) via /auth/me
  // Si le compte est suspendu, getMe() lèvera une erreur ACCOUNT_SUSPENDED
  try {
    const playerData = await api.getMe()
    setPlayer(playerData)
    setIsAuthenticated(true)
  } catch (error) {
    // Si getMe() échoue (compte suspendu entre login et getMe), nettoyer
    localStorage.removeItem('authToken')
    throw error // Re-lancer l'erreur pour que le composant login puisse l'afficher
  }
}
```

---

## 🎨 Affichage Visuel

### Styles pour les Comptes Suspendus

Toutes les pages utilisent un style distinct pour les erreurs de suspension :

**Couleurs** :
- Fond : `bg-orange-500/20` ou `bg-orange-900/20`
- Bordure : `border-orange-500` ou `border-orange-500/50`
- Texte : `text-orange-200` ou `text-orange-300`

**Structure** :
```tsx
{error && (
  <div className={`border rounded-lg p-4 mb-6 ${
    error.includes('suspendu') 
      ? 'bg-orange-500/20 border-orange-500/50' 
      : 'bg-red-500/20 border-red-500/50'
  }`}>
    {error.includes('suspendu') ? (
      <>
        <p className="font-semibold mb-1 text-orange-200">
          ⚠️ Compte suspendu
        </p>
        <p className="text-orange-200">{error}</p>
      </>
    ) : (
      <p className="text-red-200">{error}</p>
    )}
  </div>
)}
```

---

## 🔄 Flux de Déconnexion Automatique

### Scénario 1 : Suspension détectée lors d'une action

1. L'utilisateur tente une action (rejoindre un tournoi, consulter le wallet, etc.)
2. Le backend renvoie `403 ACCOUNT_SUSPENDED`
3. Le frontend affiche un message d'erreur orange
4. Après 3 secondes :
   - Appel de `logout()` (suppression du token)
   - Redirection vers `/login?error=suspended`

### Scénario 2 : Suspension détectée lors de la vérification du token

1. L'utilisateur a un token valide mais le compte a été suspendu entre-temps
2. Lors de `checkAuth()`, `api.getMe()` renvoie `403 ACCOUNT_SUSPENDED`
3. Le frontend :
   - Supprime le token
   - Déconnecte l'utilisateur
   - Redirige vers `/login?error=suspended` si sur une page protégée

### Scénario 3 : Suspension détectée lors du login

1. L'utilisateur tente de se connecter avec un compte suspendu
2. Le backend renvoie `403 ACCOUNT_SUSPENDED` lors de `POST /auth/login`
3. Le frontend affiche un message d'erreur orange
4. L'utilisateur reste sur la page de login

---

## ✅ Fonctionnalités Implémentées

### Détection des Erreurs

- ✅ Vérification explicite de `apiError.code === 'ACCOUNT_SUSPENDED'`
- ✅ Fonction utilitaire `isAccountSuspended()` pour faciliter la détection
- ✅ Extraction automatique du code depuis les réponses JSON

### Affichage des Messages

- ✅ Messages explicites pour les comptes suspendus
- ✅ Style visuel distinct (orange) pour les erreurs de suspension
- ✅ Titre "⚠️ Compte suspendu" pour une meilleure visibilité
- ✅ Messages cohérents sur toutes les pages

### Déconnexion Automatique

- ✅ Déconnexion automatique après 3 secondes si suspension détectée
- ✅ Suppression du token pour éviter les requêtes inutiles
- ✅ Redirection vers `/login?error=suspended` avec message approprié

### Gestion des Cas Limites

- ✅ Suspension détectée entre login et getMe()
- ✅ Suspension détectée lors de la vérification du token
- ✅ Suspension détectée lors d'actions sensibles
- ✅ Gestion du paramètre d'URL `?error=suspended`

---

## 🧪 Scénarios de Test

### Test 1 : Tentative de connexion avec un compte suspendu

1. **Suspendre un compte** via l'API admin :
   ```bash
   PATCH /admin/players/:id/status
   { "isActive": false }
   ```

2. **Tenter de se connecter** avec ce compte :
   - Aller sur `/login`
   - Entrer les credentials du compte suspendu
   - Cliquer sur "Se connecter"

3. **Résultat attendu** :
   - ✅ Message d'erreur orange : "Votre compte a été suspendu. Si vous pensez qu'il s'agit d'une erreur, contactez le support."
   - ✅ L'utilisateur reste sur la page de login
   - ✅ Aucun token n'est stocké

### Test 2 : Suspension détectée lors d'une action

1. **Se connecter** avec un compte actif
2. **Suspendre le compte** via l'API admin (dans un autre onglet)
3. **Tenter de rejoindre un tournoi** :
   - Aller sur `/lobby`
   - Cliquer sur "Rejoindre" pour un tournoi

4. **Résultat attendu** :
   - ✅ Message d'erreur orange : "Votre compte a été suspendu. Vous ne pouvez plus rejoindre de tournois."
   - ✅ Après 3 secondes : déconnexion automatique
   - ✅ Redirection vers `/login?error=suspended`
   - ✅ Message de suspension affiché sur la page de login

### Test 3 : Suspension détectée lors du chargement du wallet

1. **Se connecter** avec un compte actif
2. **Suspendre le compte** via l'API admin
3. **Aller sur `/wallet`**

4. **Résultat attendu** :
   - ✅ Message d'erreur orange : "Votre compte a été suspendu. Contactez le support si vous pensez qu'il s'agit d'une erreur."
   - ✅ Après 3 secondes : déconnexion automatique
   - ✅ Redirection vers `/login?error=suspended`

### Test 4 : Suspension détectée lors de la vérification du token

1. **Se connecter** avec un compte actif
2. **Suspendre le compte** via l'API admin
3. **Recharger la page** (F5)

4. **Résultat attendu** :
   - ✅ Lors de `checkAuth()`, `api.getMe()` renvoie `403 ACCOUNT_SUSPENDED`
   - ✅ Le token est supprimé
   - ✅ L'utilisateur est déconnecté
   - ✅ Redirection vers `/login?error=suspended` si sur une page protégée

---

## 📝 Notes Importantes

### Sécurité

- **Pas de sécurité réelle** : La protection frontend est une amélioration UX, pas une sécurité
- **Le backend doit toujours vérifier** : Toutes les vérifications de suspension sont faites côté backend
- **Suppression du token** : Une fois la suspension détectée, le token est supprimé pour éviter les requêtes inutiles

### Expérience Utilisateur

- **Messages clairs** : Les utilisateurs comprennent immédiatement pourquoi ils ne peuvent pas se connecter ou effectuer des actions
- **Déconnexion automatique** : Évite que l'utilisateur reste "bloqué" avec un token invalide
- **Style distinct** : Les erreurs de suspension sont visuellement distinctes des autres erreurs

### Performance

- **Éviter le spam** : Une fois la suspension détectée, le token est supprimé pour éviter de spammer le backend
- **Délai de 3 secondes** : Permet à l'utilisateur de lire le message avant la déconnexion

---

## 🔗 Voir Aussi

- [README Backend - Bloquer la connexion des comptes suspendus](../backend/README%20-%20Bloquer%20la%20connexion%20des%20comptes%20suspendus.md)
- [README Frontend - Développement frontend plateforme d'échecs](./README%20-%20Développement%20frontend%20plateforme%20d'échecs.md)
- [README Frontend - Implémenter les rôles et l'espace admin v1](./README%20-%20Implémenter%20les%20rôles%20et%20l'espace%20admin%20v1.md)

---

## 🎯 Résultat Final

À l'issue de cette implémentation :

✅ Les utilisateurs suspendus voient des messages clairs et explicites  
✅ Les utilisateurs suspendus sont automatiquement déconnectés après 3 secondes  
✅ Les utilisateurs suspendus sont redirigés vers la page de login avec un message approprié  
✅ Le frontend évite de spammer le backend une fois la suspension détectée  
✅ L'expérience utilisateur est cohérente sur toutes les pages  
✅ Les erreurs de suspension sont visuellement distinctes des autres erreurs

