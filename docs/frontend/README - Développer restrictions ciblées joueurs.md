# Développer les Restrictions Ciblées Joueurs - Frontend Phase 4.7

Ce document décrit l'implémentation frontend du système de restrictions ciblées permettant aux administrateurs de modérer finement les joueurs sans suspendre complètement leur compte.

**Date de création** : Phase 4.7  
**Statut** : ✅ Complété et testé

---

## 📋 Vue d'ensemble

Cette implémentation ajoute au frontend :
- ✅ Extension du type `AdminPlayer` avec les champs de restrictions
- ✅ Nouvelle fonction API `updateAdminPlayerRestrictions`
- ✅ UI admin pour visualiser et modifier les restrictions ciblées
- ✅ Gestion des nouveaux codes d'erreur (`TOURNAMENTS_BLOCKED`, `DEPOSITS_BLOCKED`, `WITHDRAWALS_BLOCKED`)
- ✅ Affichage cohérent des messages d'erreur (orange pour restrictions, rouge pour erreurs critiques)
- ✅ Indicateurs visuels pour les joueurs avec restrictions

---

## 🔧 Modifications apportées

### 1. Types et interfaces (`lib/api.ts`)

#### Constantes pour les codes d'erreur

```typescript
export const ACCOUNT_SUSPENDED_CODE = 'ACCOUNT_SUSPENDED'
export const TOURNAMENTS_BLOCKED_CODE = 'TOURNAMENTS_BLOCKED'
export const DEPOSITS_BLOCKED_CODE = 'DEPOSITS_BLOCKED'
export const WITHDRAWALS_BLOCKED_CODE = 'WITHDRAWALS_BLOCKED'
```

#### Extension de l'interface `AdminPlayer`

```typescript
export interface AdminPlayer {
  id: string
  username: string
  email: string
  countryCode: string
  role: PlayerRole
  isActive: boolean
  createdAt: string
  // ✅ Nouveaux champs de restrictions ciblées
  blockTournaments: boolean
  blockWalletDeposits: boolean
  blockWalletWithdrawals: boolean
  moderationNote?: string | null
}
```

#### Nouvelle interface pour la mise à jour

```typescript
export interface UpdatePlayerRestrictionsPayload {
  blockTournaments?: boolean
  blockWalletDeposits?: boolean
  blockWalletWithdrawals?: boolean
  moderationNote?: string
}
```

#### Nouvelle fonction API

```typescript
updateAdminPlayerRestrictions: (id: string, payload: UpdatePlayerRestrictionsPayload) =>
  apiRequest<AdminPlayer>(`/admin/players/${id}/restrictions`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
```

---

### 2. Page Admin - Gestion des Joueurs (`pages/admin/players.tsx`)

#### Nouveaux états

```typescript
const [editingRestrictionsId, setEditingRestrictionsId] = useState<string | null>(null)
const [updatingRestrictionsId, setUpdatingRestrictionsId] = useState<string | null>(null)
```

#### Nouvelle colonne "Restrictions"

Affichage de badges colorés pour chaque restriction active :
- **"Tournois bloqués"** (badge orange)
- **"Dépôts bloqués"** (badge jaune)
- **"Retraits bloqués"** (badge violet)
- **"Aucune restriction ciblée"** si aucune restriction

#### Indicateur visuel

Un badge d'alerte (⚠️) apparaît à côté du nom d'utilisateur pour les joueurs ayant des restrictions :
- Badge circulaire orange avec bordure
- Icône "!" en gras
- Tooltip : "Ce joueur a des restrictions ciblées"

#### Composant `RestrictionsEditor`

Panneau inline qui s'affiche sous la ligne du joueur avec :

**Fonctionnalités :**
- 3 checkboxes pour les restrictions :
  - "Interdire les tournois"
  - "Bloquer les dépôts"
  - "Bloquer les retraits"
- Textarea pour la note de modération :
  - Limite de 1000 caractères
  - Compteur de caractères
  - Placeholder informatif
- Affichage de la note actuelle (si elle existe) dans un encadré bleu
- Boutons :
  - "Enregistrer" avec état de chargement
  - "Annuler" pour fermer le panneau

**Gestion UX :**
- Désactivation des champs pendant la mise à jour
- Fermeture automatique après sauvegarde réussie
- Mise à jour optimiste de la liste
- Gestion des erreurs via le message d'erreur existant

#### Fonction `handleUpdateRestrictions`

```typescript
const handleUpdateRestrictions = async (
  playerId: string,
  restrictions: {
    blockTournaments: boolean
    blockWalletDeposits: boolean
    blockWalletWithdrawals: boolean
    moderationNote?: string
  }
) => {
  try {
    setUpdatingRestrictionsId(playerId)
    setError(null)
    const updatedPlayer = await api.updateAdminPlayerRestrictions(playerId, restrictions)
    setPlayers(players.map(p => p.id === playerId ? updatedPlayer : p))
    setEditingRestrictionsId(null)
  } catch (err) {
    const apiError = err as ApiError
    setError(apiError.message || 'Erreur lors de la mise à jour des restrictions')
  } finally {
    setUpdatingRestrictionsId(null)
  }
}
```

---

### 3. Gestion des codes d'erreur

#### Page Lobby (`pages/lobby.tsx`)

**Gestion de `TOURNAMENTS_BLOCKED` :**

```typescript
const handleJoinTournament = async (tournamentId: string) => {
  try {
    // ... code d'inscription ...
  } catch (err) {
    const apiError = err as ApiError
    // Gestion spéciale pour les comptes suspendus
    if (apiError.code === 'ACCOUNT_SUSPENDED') {
      setError("Votre compte a été suspendu. Vous ne pouvez plus rejoindre de tournois.")
      setTimeout(() => {
        logout()
        router.push('/login?error=suspended')
      }, 3000)
      return
    }
    // Gestion pour les tournois bloqués (restriction ciblée)
    if (apiError.code === TOURNAMENTS_BLOCKED_CODE) {
      setError("Votre compte ne peut actuellement pas participer aux tournois. Contactez le support pour plus d'informations.")
      return
    }
    // Autres erreurs
    setError(apiError.message || 'Erreur lors de l\'inscription au tournoi.')
  }
}
```

**Comportement :**
- ✅ Affiche un message d'erreur spécifique
- ✅ Ne déconnecte PAS l'utilisateur (restriction ciblée, pas suspension globale)
- ✅ L'utilisateur reste connecté et peut accéder aux autres fonctionnalités

#### Page Wallet (`pages/wallet.tsx`)

**Gestion de `DEPOSITS_BLOCKED` et `WITHDRAWALS_BLOCKED` :**

```typescript
const handleTestCredit = async () => {
  try {
    // ... code de crédit ...
  } catch (error) {
    const apiError = error as ApiError
    if (apiError.code === 'ACCOUNT_SUSPENDED') {
      // Déconnexion automatique
      setTimeout(() => {
        logout()
        router.push('/login?error=suspended')
      }, 3000)
    } else if (apiError.code === DEPOSITS_BLOCKED_CODE) {
      // Dépôts bloqués - ne pas déconnecter
      setTestCreditError(apiError.message || "Les dépôts sont temporairement indisponibles...")
    } else if (apiError.code === WITHDRAWALS_BLOCKED_CODE) {
      // Retraits bloqués - ne pas déconnecter
      setTestCreditError(apiError.message || "Les retraits sont temporairement suspendus...")
    }
  }
}
```

**Comportement :**
- ✅ Affiche un message d'erreur spécifique
- ✅ Ne déconnecte PAS l'utilisateur
- ✅ Message affiché en haut de la page (plus d'`alert()`)

---

### 4. Affichage cohérent des messages d'erreur

#### Style uniforme

Toutes les pages utilisent maintenant un style cohérent :

```typescript
{error && (
  <div className={`border rounded-lg p-4 mb-6 ${
    error.includes('suspendu') || error.includes('bloqué') || error.includes('bloqués')
      ? 'bg-orange-500/20 border-orange-500/50'
      : 'bg-red-500/20 border-red-500/50'
  }`}>
    {error.includes('suspendu') || error.includes('bloqué') || error.includes('bloqués') ? (
      <>
        <p className="font-semibold mb-1 text-orange-200">
          ⚠️ Restriction sur votre compte
        </p>
        <p className="text-orange-200">{error}</p>
      </>
    ) : (
      <p className="text-red-200">{error}</p>
    )}
  </div>
)}
```

**Couleurs :**
- 🟠 **Orange** : Restrictions (suspendu, bloqués, indisponibles)
- 🔴 **Rouge** : Erreurs critiques

**Titre uniforme :**
- "⚠️ Restriction sur votre compte" pour toutes les restrictions

---

## 🎨 Interface Utilisateur

### Page Admin - Liste des Joueurs

**Colonne "Restrictions" :**
- Badges colorés pour chaque restriction active
- Texte "Aucune restriction ciblée" si aucune restriction

**Bouton "Restrictions" :**
- Par ligne dans la colonne "Actions"
- Toggle pour ouvrir/fermer le panneau d'édition
- Texte dynamique : "Restrictions" / "Annuler"

**Panneau d'édition :**
- S'affiche sous la ligne du joueur
- Formulaire avec checkboxes et textarea
- Boutons "Enregistrer" et "Annuler"
- État de chargement visible

### Pages Publiques

**Messages d'erreur :**
- Style orange pour les restrictions
- Style rouge pour les erreurs critiques
- Titre uniforme "⚠️ Restriction sur votre compte"
- Messages clairs et explicites

---

## 🔄 Flux de données

### Mise à jour des restrictions

1. **Admin clique sur "Restrictions"** → Ouvre le panneau d'édition
2. **Admin modifie les checkboxes/textarea** → État local mis à jour
3. **Admin clique sur "Enregistrer"** → Appel API `updateAdminPlayerRestrictions`
4. **Backend valide et met à jour** → Retourne le joueur mis à jour
5. **Frontend met à jour la liste** → Ferme le panneau automatiquement

### Gestion des erreurs

1. **Joueur tente une action bloquée** → Backend retourne code d'erreur spécifique
2. **Frontend détecte le code** → Affiche message approprié
3. **Comportement selon le type** :
   - `ACCOUNT_SUSPENDED` → Déconnexion automatique
   - `TOURNAMENTS_BLOCKED` → Message, utilisateur reste connecté
   - `DEPOSITS_BLOCKED` → Message, utilisateur reste connecté
   - `WITHDRAWALS_BLOCKED` → Message, utilisateur reste connecté

---

## 🧪 Scénarios de test

### Scénario 1 : Admin modifie les restrictions

1. Se connecter en tant qu'admin
2. Aller sur `/admin/players`
3. Cliquer sur "Restrictions" pour un joueur
4. Cocher "Interdire les tournois"
5. Ajouter une note de modération
6. Cliquer sur "Enregistrer"
7. ✅ Vérifier que le badge "Tournois bloqués" apparaît
8. ✅ Vérifier que l'indicateur ⚠️ apparaît à côté du nom

### Scénario 2 : Joueur avec tournois bloqués

1. Se connecter avec un compte ayant `blockTournaments = true`
2. Aller sur `/lobby`
3. Tenter de rejoindre un tournoi
4. ✅ Vérifier le message orange "⚠️ Restriction sur votre compte"
5. ✅ Vérifier que l'utilisateur reste connecté
6. ✅ Vérifier que les autres fonctionnalités fonctionnent

### Scénario 3 : Joueur avec dépôts bloqués

1. Se connecter avec un compte ayant `blockWalletDeposits = true`
2. Aller sur `/wallet`
3. Tenter d'ajouter un crédit de test
4. ✅ Vérifier le message orange en haut de la page
5. ✅ Vérifier que l'utilisateur reste connecté
6. ✅ Vérifier que la consultation du wallet fonctionne

### Scénario 4 : Joueur suspendu (comportement existant)

1. Se connecter avec un compte ayant `isActive = false`
2. Tenter n'importe quelle action
3. ✅ Vérifier le message orange "⚠️ Restriction sur votre compte"
4. ✅ Vérifier la déconnexion automatique après 3 secondes
5. ✅ Vérifier la redirection vers `/login?error=suspended`

---

## 📝 Notes importantes

1. **Distinction claire** : Les restrictions ciblées ne bloquent PAS le login, contrairement à `isActive = false`
2. **Cohérence visuelle** : Tous les messages de restrictions utilisent le style orange
3. **UX optimisée** : Les utilisateurs restent connectés pour les restrictions ciblées
4. **Indicateurs visuels** : Les admins peuvent rapidement identifier les joueurs avec restrictions
5. **Gestion d'erreurs** : Messages clairs et explicites pour chaque type de restriction

---

## 🔗 Références

- [README Backend - Restrictions ciblées et modération avancée](../backend/README%20-%20Restrictions%20ciblées%20et%20modération%20avancée.md) - Phase 4.7
- [README Frontend - Gérer les comptes suspendus](./README%20-%20Gérer%20les%20comptes%20suspendus%20côté%20frontend.md) - Phase 4.6
- [README Frontend - Implémenter les rôles et l'espace admin v1](./README%20-%20Implémenter%20les%20rôles%20et%20l'espace%20admin%20v1.md) - Phase 4.5

---

## ✅ Checklist de déploiement

- [x] Types et interfaces mis à jour dans `lib/api.ts`
- [x] Constantes pour les codes d'erreur ajoutées
- [x] Fonction `updateAdminPlayerRestrictions` créée
- [x] Colonne "Restrictions" ajoutée dans `/admin/players`
- [x] Composant `RestrictionsEditor` créé
- [x] Indicateur visuel ajouté pour les joueurs avec restrictions
- [x] Gestion de `TOURNAMENTS_BLOCKED` dans `/lobby`
- [x] Gestion de `DEPOSITS_BLOCKED` et `WITHDRAWALS_BLOCKED` dans `/wallet`
- [x] Styles uniformisés pour les messages d'erreur
- [x] Tests manuels effectués
- [ ] Tests automatisés (à venir)

---

**Dernière mise à jour** : Phase 4.7

