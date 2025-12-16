# Baseline Phase 5 — État du projet (figé)

**Date de création** : Décembre 2025  
**Tag Git** : `baseline-phase5-202512`  
**Branche** : `main`

> **Ce document constitue la vérité de référence de la Phase 5.**  
> En cas de divergence entre le code, les discussions ou les implémentations futures, ce document prévaut pour définir ce qui faisait partie ou non de la Phase 5.

---

## 1. Contexte général

### Présentation du projet

ChessBet est une plateforme de tournois d'échecs en ligne organisant des compétitions 1v1 (un contre un) basées sur le skill (compétence). La plateforme permet aux joueurs de s'inscrire à des tournois, de payer un buy-in, et de participer à des brackets éliminatoires jusqu'à la désignation d'un vainqueur.

### Positionnement légal

La plateforme fonctionne en modèle **skill game** (compétition de compétence). Les caractéristiques légales sont les suivantes :

- **Pas de hasard** : Les résultats dépendent uniquement de la compétence des joueurs aux échecs
- **Pas de pari** : Les buy-ins constituent des frais d'inscription à une compétition, non des mises
- **Prize pool** : Les gains distribués proviennent des buy-ins des participants (après déduction éventuelle de commission)
- **Conformité** : Vérification d'âge minimum (18 ans) obligatoire à l'inscription
- **Zones légales** : Gestion des zones géographiques autorisées via le modèle `CountryRule`

---

## 2. Portée exacte de la Phase 5

### 2.1 Authentification

Le système d'authentification est complet et opérationnel :

- **Inscription** : Création de compte avec email, username, mot de passe, date de naissance (vérification 18+), pays
- **Vérification d'email** : Token unique généré à l'inscription, expiration 24h, envoi automatique d'email
- **Connexion** : Email/password avec génération de token JWT
- **Vérification obligatoire** : Impossible de se connecter sans avoir vérifié son email (`isEmailVerified = true`)
- **Réinitialisation de mot de passe** : Token unique, expiration 1h, envoi d'email avec lien de reset
- **JWT** : Token d'accès incluant `sub` (player.id), `email`, `username`, `role`
- **Protection des routes** : Guards JWT (`JwtAuthGuard`) et vérification du statut actif (`ActivePlayerGuard`)

### 2.2 Rôles et permissions

Système de rôles à trois niveaux :

- **PLAYER** : Rôle par défaut pour tous les nouveaux joueurs
- **ADMIN** : Accès aux endpoints `/admin/*` pour gérer joueurs et tournois
- **SUPER_ADMIN** : Tous les droits d'ADMIN, promotion automatique via variable d'environnement `SUPER_ADMIN_EMAIL` au démarrage

**Gestion des rôles** :
- Promotion en SUPER_ADMIN : automatique au démarrage du backend si l'email correspond à `SUPER_ADMIN_EMAIL`
- Promotion en ADMIN : uniquement via modification manuelle en base de données
- Aucun endpoint HTTP public ne permet de modifier les rôles

**Protection des endpoints admin** :
- Tous les endpoints `/admin/*` sont protégés par `JwtAuthGuard` + `RolesGuard`
- Seuls les rôles `ADMIN` et `SUPER_ADMIN` peuvent accéder (constante `ADMIN_ROLES`)

### 2.3 Players, Wallets et Transactions

**Players** :
- Modèle Prisma avec champs : `id`, `username`, `email`, `passwordHash`, `countryCode`, `dateOfBirth`, `elo`, `kycStatus`, `role`, `isActive`
- Restrictions ciblées : `blockTournaments`, `blockWalletDeposits`, `blockWalletWithdrawals`, `moderationNote`
- Suspension de compte : `isActive = false` bloque la connexion et l'accès aux fonctionnalités

**Wallets** :
- Création automatique à l'inscription d'un joueur
- Solde en centimes (`balanceCents`), devise par défaut EUR
- Relation 1:1 avec Player

**Transactions** :
- Types : `DEPOSIT`, `WITHDRAWAL`, `TOURNAMENT_BUY_IN`, `TOURNAMENT_PAYOUT`, `BONUS`, `FEE`
- Montants positifs = crédit, montants négatifs = débit
- Toutes les transactions passent par `TransactionsService.createTransactionAndUpdateWallet()` qui garantit l'atomicité via `prisma.$transaction()`
- Vérification des fonds insuffisants avant débit
- Le champ `balanceCents` du wallet ne doit jamais être modifié directement ailleurs dans le code

### 2.4 Tournois

**Création de tournois** :
- Champs : `name`, `timeControl` (ex: "10+0"), `buyInCents`, `currency`, `minPlayers`, `maxPlayers`, `eloMin`, `eloMax`, `startsAt`, `endsAt`, `registrationClosesAt`, `legalZoneCode`
- Statuts : `DRAFT`, `SCHEDULED`, `READY`, `RUNNING`, `FINISHED`, `CANCELED`

**Inscriptions** :
- Endpoint public `POST /tournaments/:id/register` pour les joueurs authentifiés
- Vérifications : compte actif, pas de restriction `blockTournaments`, fonds suffisants, respect des limites min/max, respect des critères ELO, respect de la zone légale
- Création automatique d'une `TournamentEntry` avec statut `PENDING`
- Débit automatique du buy-in via `TOURNAMENT_BUY_IN` (transaction négative)
- Confirmation automatique de l'entrée (`status = CONFIRMED`)

**Clôture des inscriptions** :
- Endpoint admin `POST /admin/tournaments/:id/close-registration`
- Vérifie que le tournoi est en statut `SCHEDULED` ou `READY`
- Met à jour `registrationClosesAt` et calcule le prize pool
- Passage automatique en statut `READY` si conditions remplies (minPlayers atteint)

**Annulation de tournois** :
- Endpoint admin `POST /admin/tournaments/:id/cancel`
- Remboursement automatique de tous les buy-ins via transactions `TOURNAMENT_PAYOUT` (montants positifs)
- Passage en statut `CANCELED`

**Prize pools** :
- Calcul automatique : `totalEntriesCents` (somme des buy-ins), `commissionCents` (optionnel), `distributableCents` (totalEntriesCents - commissionCents)
- Distribution JSON : `{"1": 0.7, "2": 0.3}` (exemple : 70% pour le 1er, 30% pour le 2ème)
- Figement du prize pool lors de la clôture des inscriptions (`lockedAt`)

### 2.5 Matches Phase 5

**Génération des brackets** :
- Endpoint admin `POST /admin/tournaments/:id/start` pour démarrer un tournoi
- Vérification que le tournoi est en statut `READY`
- `MatchesService.generateInitialMatchesForTournament()` :
  - Charge les `TournamentEntry` avec statut `CONFIRMED`
  - Filtre les joueurs suspendus (`isActive = false`) et restreints (`blockTournaments = true`)
  - Trie par ELO décroissant (meilleurs joueurs en premier)
  - Génère des paires 1v1 : (0 vs 1), (2 vs 3), (4 vs 5), ...
  - Si nombre impair de joueurs : crée un match `BYE` pour le dernier joueur (victoire automatique)
  - Crée les enregistrements `Match` avec `roundNumber = 1`, `status = PENDING`
  - Met à jour le statut du tournoi en `RUNNING`

**Rounds successifs** :
- Les matches sont organisés en rondes (`roundNumber`)
- Chaque match a un `boardNumber` (numéro de table dans la ronde)
- Les matches utilisent `TournamentEntry` (et non `Player` directement) pour lier les joueurs
- Chaque match a un `whiteEntryId` et un `blackEntryId`

**Résultats enregistrés via API admin** :
- Endpoint admin `POST /admin/matches/:id/result`
- Body : `{ result: "WHITE_WIN" | "BLACK_WIN" | "DRAW" | "BYE", winnerEntryId: "...", resultReason: "CHECKMATE" | "TIMEOUT" | "RESIGNATION" | "NO_SHOW" | ... }`
- `MatchesService.reportResult()` :
  - Vérifie que le match existe et n'est pas déjà `FINISHED` ou `CANCELED`
  - Vérifie la cohérence entre `result` et `winnerEntryId`
  - Met à jour le match : `status = FINISHED`, `result`, `resultReason`, `finishedAt`, `startedAt` (si pas encore défini)

**Finalisation automatique du tournoi et payouts** :
- Après chaque `reportResult()`, appel automatique de `generateNextRoundIfNeeded()`
- Si tous les matches de la ronde sont `FINISHED` et qu'il reste plus d'un winner : génération de la ronde suivante
- Si tous les matches de la ronde sont `FINISHED` et qu'il ne reste qu'un seul winner : appel automatique de `finalizeTournamentAndPayouts()`
- `finalizeTournamentAndPayouts()` :
  - Identifie le vainqueur (position 1) et le finaliste (position 2) depuis le match final
  - Charge le `PrizePool` et parse le `distributionJson`
  - Calcule les payouts pour chaque position (ex: position 1 = `floor(distributableCents * 0.7)`)
  - Dans une transaction Prisma atomique :
    - Crée une transaction `TOURNAMENT_PAYOUT` pour chaque position payée
    - Met à jour le statut du tournoi en `FINISHED` et définit `endsAt`

**Important** :
- Aucun gameplay en direct n'existe encore dans la Phase 5
- Les résultats sont administrés manuellement via l'API admin
- Les matches ne sont pas joués sur un plateau d'échecs intégré
- Les résultats sont enregistrés après coup par un administrateur

---

## 3. Invariants techniques Phase 5 (à ne jamais casser)

### 3.1 Rôle central de `reportResult()`

La fonction `MatchesService.reportResult()` est le point d'entrée unique pour enregistrer un résultat de match. Cette fonction :

1. Met à jour le match avec le résultat
2. Déclenche automatiquement la génération de la ronde suivante si nécessaire
3. Déclenche automatiquement la finalisation du tournoi si le tournoi est terminé

**Cette chaîne ne doit jamais être modifiée ou court-circuitée.**

### 3.2 Chaîne d'exécution

```
reportResult() 
  → generateNextRoundIfNeeded() 
    → (si tous les matches terminés ET plus d'un winner) generateInitialMatchesForTournament() pour la ronde suivante
    → (si tous les matches terminés ET un seul winner) finalizeTournamentAndPayouts()
```

Cette chaîne garantit que :
- Les rondes suivantes sont générées automatiquement dès que tous les matches d'une ronde sont terminés
- Le tournoi est finalisé automatiquement dès qu'un vainqueur est déterminé
- Les payouts sont distribués immédiatement après la finalisation

### 3.3 Comportement des résultats

Les résultats possibles sont définis dans l'enum `MatchResult` :

- **WHITE_WIN** : Le joueur blanc gagne, seul `whiteEntryId` avance
- **BLACK_WIN** : Le joueur noir gagne, seul `blackEntryId` avance
- **DRAW** : Match nul, **les deux joueurs avancent** dans le bracket (Phase 5)
- **BYE** : Victoire automatique (nombre impair de joueurs), le joueur avec le BYE avance

**Comportement DRAW en Phase 5** :
- Un match nul (`DRAW`) fait avancer les deux joueurs dans le bracket
- Cela peut créer un nombre impair de joueurs pour la ronde suivante
- Si le nombre est impair, un match BYE est automatiquement créé pour le dernier joueur

**Ce comportement est un invariant de la Phase 5 et ne doit pas être modifié sans documentation explicite.**

### 3.4 Atomicité des transactions

Toutes les opérations financières (buy-in, payouts) passent par `TransactionsService.createTransactionAndUpdateWallet()` qui utilise `prisma.$transaction()` pour garantir l'atomicité. Cette garantie ne doit jamais être contournée.

### 3.5 Modèle de données – périmètre Phase 5

En Phase 5, le modèle `Match` ne représente pas une partie jouée mais un résultat administratif. Il ne contient aucun état de jeu (plateau, coups, temps, règles). Toute logique de gameplay est explicitement absente du schéma de données Phase 5.

**Modèle Match Phase 5** :
- Ne contient **PAS** : FEN initial, FEN courant, coups (PGN, movesJson), temps restant (whiteTimeMsRemaining, blackTimeMsRemaining)
- Contient uniquement : `id`, `tournamentId`, `roundNumber`, `boardNumber`, `whiteEntryId`, `blackEntryId`, `status`, `result`, `resultReason`, `startedAt`, `finishedAt`
- Le modèle `Match` est un conteneur de résultat, pas un état de partie

**Modèle TournamentEntry** :
- Entité pivot entre `Player` et `Tournament`
- Représente l'inscription d'un joueur à un tournoi
- Contient le buy-in payé (`buyInPaidCents`) et le statut de l'inscription

**Modèle Wallet** :
- Source de vérité financière pour tous les mouvements d'argent
- Le champ `balanceCents` est calculé via les transactions, jamais modifié directement
- Toutes les opérations financières doivent passer par `TransactionsService`

**En cas de rollback ou de migration ratée en Phase 6** :
- La base de données Phase 5 ne contient aucun champ lié au gameplay
- Aucune migration Phase 6 ne doit modifier les champs existants Phase 5
- Les nouveaux champs Phase 6 doivent être optionnels ou dans de nouveaux modèles

---

## 4. Structure technique validée

### 4.1 Backend

- **Framework** : NestJS
- **ORM** : Prisma
- **Base de données** : PostgreSQL
- **Authentification** : JWT (Passport)
- **Validation** : class-validator, class-transformer
- **Envoi d'emails** : Module SMTP (Infomaniak)

**Structure des modules** :
- `auth/` : Authentification, JWT, guards, stratégies
- `players/` : Gestion des joueurs
- `wallets/` : Gestion des portefeuilles
- `transactions/` : Service centralisé de transactions
- `modules/tournaments/` : Gestion des tournois
- `modules/prize-pool/` : Calcul et gestion des prize pools
- `modules/matches/` : Génération des brackets, gestion des matches, résultats
- `admin/` : API admin (joueurs, tournois)
- `mail/` : Service d'envoi d'emails
- `moderation/` : Restrictions ciblées
- `prisma/` : Service Prisma

### 4.2 Frontend

- **Framework** : Next.js (Pages Router)
- **Styling** : Tailwind CSS
- **Authentification** : Hook `useAuth` avec contexte React
- **API** : Client API centralisé dans `lib/api.ts`

**Structure des pages** :
- `/` : Landing page
- `/login` : Connexion
- `/register` : Inscription
- `/verify-email` : Vérification d'email
- `/forgot-password` : Mot de passe oublié
- `/reset-password` : Réinitialisation de mot de passe
- `/lobby` : Liste des tournois (protégée)
- `/tournaments` : Liste des tournois
- `/tournaments/[id]` : Détail d'un tournoi (matches, classements)
- `/profile` : Profil utilisateur
- `/wallet` : Gestion du wallet et historique des transactions
- `/admin` : Dashboard admin (protégée)
- `/admin/players` : Gestion des joueurs (protégée)
- `/admin/tournaments` : Gestion des tournois (protégée)
- `/terms` : Conditions générales d'utilisation
- `/privacy` : Politique de confidentialité

### 4.3 Architecture modulaire

Le projet suit une architecture modulaire claire :

- **Séparation backend/frontend** : Deux applications distinctes
- **Monorepo** : Structure organisée en dossiers `backend/`, `frontend/`, `infra/`, `docs/`
- **API REST** : Communication backend-frontend via endpoints HTTP
- **Base de données centralisée** : PostgreSQL partagée entre tous les services

### 4.4 Infrastructure

- **Docker** : Configuration Docker Compose pour PostgreSQL (optionnel)
- **Migrations Prisma** : Gestion des schémas de base de données via migrations
- **Variables d'environnement** : Configuration via fichiers `.env`

---

## 5. État Git et gouvernance du code

### 5.1 Branche principale

La branche `main` contient le code figé de la Phase 5. Cette branche :

- Ne doit pas être modifiée directement pour des évolutions futures
- Sert de référence stable pour la baseline Phase 5
- Peut recevoir des corrections de bugs critiques uniquement (avec documentation)

**Note** : Les Phases 6.0.C, 6.1 et 6.2 ont été complétées sur la branche `feature/phase6` avec les tags suivants :
- `phase6-0c-20251215` : Backend gameplay HTTP complet
- `phase6-1-20251216` : Frontend gameplay MVP (échiquier interactif)
- `phase6-2-20251216` : Tests E2E gameplay exhaustifs (11/11 tests PASS)

### 5.2 Tag Git

Le tag `baseline-phase5-202512` marque précisément l'état du code à la fin de la Phase 5. Ce tag :

- Permet de revenir à cet état à tout moment
- Sert de point de référence pour les comparaisons
- Doit être préservé et ne jamais être déplacé ou supprimé

### 5.3 Évolutions complétées et futures

**Évolutions complétées** (branche `feature/phase6`) :
- ✅ **Phase 6.0.C** : Backend gameplay HTTP (tag: `phase6-0c-20251215`)
- ✅ **Phase 6.1** : Frontend gameplay MVP (tag: `phase6-1-20251216`)
- ✅ **Phase 6.2** : Tests E2E gameplay (tag: `phase6-2-20251216`)

**Évolutions futures** :
- Toute évolution future doit se faire sur des branches dédiées (ex: `feature/phase7-*`)
- **Branches de développement** : `dev/phase6-*`
- **Branches de correction** : `hotfix/phase5-*` (uniquement pour bugs critiques)

**Règle absolue** : Aucune modification de la Phase 6 ne doit être mergée dans `main` sans validation explicite et documentation.

### 5.4 Documentation

La documentation technique est centralisée dans le dossier `docs/` :

- `docs/README.md` : Index de toute la documentation
- `docs/backend/` : Documentation spécifique au backend
- `docs/frontend/` : Documentation spécifique au frontend
- `docs/audits/` : Rapports d'audit et guides de restauration

---

## 6. Ce que la Phase 5 NE contient PAS (très important)

La Phase 5 est une baseline fonctionnelle mais limitée. Les éléments suivants **ne sont pas présents** :

### 6.1 Gameplay

- **Pas de plateau d'échecs** : Aucun composant visuel de plateau d'échecs intégré
- **Pas de validation de coups** : Aucune logique de validation des règles du jeu d'échecs
- **Pas de moteur d'échecs** : Aucun moteur d'échecs (ex: Stockfish) intégré
- **Pas de notation algébrique** : Aucun enregistrement des coups joués
- **Pas d'historique de partie** : Aucun stockage de l'historique des coups

### 6.2 Gestion du temps

- **Pas de gestion du temps** : Aucun système de chronomètre intégré
- **Pas de time control en direct** : Le champ `timeControl` est strictement informatif en Phase 5. Il n'est ni interprété, ni validé, ni appliqué par le backend. Aucune logique ne dépend de sa valeur dans la Phase 5.
- **Pas de timeout automatique** : Aucune détection automatique de dépassement de temps

### 6.3 Communication en temps réel

- **Pas de WebSockets** : Aucune communication bidirectionnelle en temps réel
- **Pas de notifications push** : Aucun système de notifications en temps réel
- **Pas de chat** : Aucun système de chat entre joueurs

### 6.4 Automatisation des matches

- **Pas de no-show automatique** : Aucune détection automatique d'absence d'un joueur
- **Pas de démarrage automatique** : Les matches ne démarrent pas automatiquement
- **Pas de fin automatique** : Les matches ne se terminent pas automatiquement (sauf BYE)

### 6.5 Sécurité et anti-triche

- **Pas d'anti-cheat** : Aucun système de détection de triche
- **Pas de validation de compétence** : Aucune vérification que le joueur joue réellement
- **Pas de détection de bots** : Aucune détection de joueurs automatisés

### 6.6 Fonctionnalités avancées

- **Pas de classement ELO dynamique** : Le champ `elo` existe mais n'est pas mis à jour automatiquement
- **Pas de statistiques avancées** : Statistiques basiques uniquement (wins, losses, draws)
- **Pas de replay de parties** : Impossible de rejouer une partie terminée
- **Pas de spectateurs** : Aucun système permettant de suivre un match en cours

---

## 7. Objectif de ce document

Ce README sert de **référence contractuelle** pour l'état du projet à la fin de la Phase 5. Il a pour objectifs :

### 7.1 Sécuriser le travail accompli

- Documenter précisément ce qui fonctionne et ce qui ne fonctionne pas
- Éviter toute confusion sur les fonctionnalités disponibles
- Servir de preuve de l'état du projet à un moment donné

### 7.2 Servir de référence en cas de rollback

- Permettre de revenir à la baseline Phase 5 en cas de problème
- Faciliter la comparaison entre Phase 5 et Phase 6.0-6.2 (branches distinctes)
- Identifier rapidement les régressions

### 7.3 Éviter toute confusion entre Phase 5 et Phase 6

- Clarifier explicitement ce qui est inclus et ce qui ne l'est pas
- Éviter les attentes erronées sur les fonctionnalités disponibles
- Guider les développeurs sur ce qui a été implémenté (Phases 6.0.C, 6.1, 6.2) vs ce qui reste à faire

### 7.4 Documentation technique

- Référence pour les nouveaux développeurs
- Guide pour comprendre l'architecture actuelle
- Base pour planifier les évolutions futures

**Ce document constitue la vérité de référence de la Phase 5.**  
En cas de divergence entre le code, les discussions ou les implémentations futures, ce document prévaut pour définir ce qui faisait partie ou non de la Phase 5.

---

## 8. Hypothèses et compromis Phase 5

La Phase 5 a été conçue avec des compromis volontaires et temporaires pour établir une baseline fonctionnelle. Ces hypothèses sont documentées ici pour éviter toute confusion future.

### 8.1 Résultats administrés manuellement

- **Hypothèse** : Les résultats des matches sont saisis manuellement par un administrateur via l'API
- **Raison** : Permet de valider le système de brackets et de payouts sans implémenter le gameplay
- **Conséquence** : Aucune validation automatique des résultats, pas de litige possible entre joueurs

### 8.2 Comportement DRAW

- **Hypothèse** : Un match nul (`DRAW`) fait avancer les deux joueurs dans le bracket
- **Raison** : Simplification du système de brackets pour la Phase 5
- **Conséquence** : Peut créer un nombre impair de joueurs pour la ronde suivante (géré par BYE automatique)
- **Note** : Ce comportement est conservé dans les Phases 6.0-6.2 et peut être modifié dans une phase ultérieure selon les règles de tournoi souhaitées

### 8.3 Pas de gestion des litiges

- **Hypothèse** : Aucun système de contestation ou de litige entre joueurs
- **Raison** : Les résultats sont administrés, donc pas de litige possible
- **Conséquence** : Pas de mécanisme de réclamation ou d'arbitrage

### 8.4 Pas de gestion des déconnexions

- **Hypothèse** : Aucune gestion des déconnexions ou des absences de joueurs
- **Raison** : Les matches ne sont pas joués en direct, donc pas de notion de "joueur connecté"
- **Conséquence** : Pas de détection automatique de no-show, pas de pause/reprise de match

### 8.5 Pas de notion de partie "en cours"

- **Hypothèse** : Un match est soit `PENDING`, soit `FINISHED`, jamais "en cours de jeu"
- **Raison** : Pas de gameplay en direct, donc pas d'état intermédiaire
- **Conséquence** : Le statut `RUNNING` existe dans l'enum mais n'est pas utilisé en Phase 5

### 8.6 ELO statique

- **Hypothèse** : Le champ `elo` existe mais n'est pas mis à jour automatiquement
- **Raison** : Pas de calcul de classement dynamique nécessaire en Phase 5
- **Conséquence** : L'ELO est utilisé uniquement pour le tri initial des brackets, pas pour les statistiques

---

## 9. Conclusion

La Phase 5 représente une **baseline fonctionnelle** de la plateforme ChessBet. Elle permet :

- L'inscription et l'authentification des joueurs
- La création et la gestion de tournois
- L'inscription aux tournois avec gestion des buy-ins
- La génération de brackets éliminatoires
- L'enregistrement manuel des résultats par les administrateurs
- La finalisation automatique des tournois avec distribution des gains

Cette baseline est **figée, versionnée et taggée**. Toute évolution future doit se faire sur des branches dédiées sans modifier ce périmètre.

**Tag de référence** : `baseline-phase5-202512`  
**Date de gel** : Décembre 2025
