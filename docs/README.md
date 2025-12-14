# Documentation ChessBet

Ce dossier contient toute la documentation du projet ChessBet.

## 📚 Structure

### Documentation Générale
- **[README - Squelette monorepo tournois échecs légaux.md](./README%20-%20Squelette%20monorepo%20tournois%20échecs%20légaux.md)**  
  Vue d'ensemble du projet, architecture et structure du monorepo.

- **[README - Démarrage rapide du projet.md](./README%20-%20Démarrage%20rapide%20du%20projet.md)**  
  Guide rapide pour démarrer le projet après avoir éteint votre PC (PostgreSQL, Backend, Frontend).

### Documentation Audits

- **[README - Rapport d'audit technique du codebase 14.12.2025.md](./audits/README%20-%20Rapport%20d'audit%20technique%20du%20codebase%2014.12.2025.md)**  
  Rapport d'audit exhaustif de l'état du codebase par rapport aux phases 5, 6.0, 6.1, 6.2 et 6.3.

- **[README - Restauration base de données PostgreSQL.md](./audits/README%20-%20Restauration%20base%20de%20données%20PostgreSQL.md)**  
  Guide complet pour restaurer une base de données PostgreSQL depuis un dump, avec script automatisé.

### Documentation Backend

- **[README - Intégrer prisma et modules joueurs-wallets.md](./backend/README%20-%20Intégrer%20prisma%20et%20modules%20joueurs-wallets.md)**  
  Documentation complète de l'intégration Prisma et des modules Players/Wallets.

- **[README - Renforcer l'authentification et la conformité légale.md](./backend/README%20-%20Renforcer%20l'authentification%20et%20la%20conformité%20légale.md)**  
  Documentation du système d'authentification renforcé et des mesures de conformité légale.

- **[README - Définir modèles prisma tournoi échecs.md](./backend/README%20-%20Définir%20modèles%20prisma%20tournoi%20échecs.md)**  
  Documentation complète du schéma Prisma, des modèles et des migrations.

- **[README - Configuration SMTP.md](./backend/README%20-%20Configuration%20SMTP.md)**  
  Guide général de configuration SMTP avec plusieurs options (Gmail, Mailtrap, Infomaniak, SendGrid).

- **[README - Configuration SMTP Infomaniak.md](./backend/README%20-%20Configuration%20SMTP%20Infomaniak.md)**  
  Guide détaillé spécifique à Infomaniak avec dépannage approfondi.

- **[README - Mise en place transactions et gestion portefeuilles.md](./backend/README%20-%20Mise%20en%20place%20transactions%20et%20gestion%20portefeuilles.md)**  
  Documentation du module Transactions centralisé et de l'extension du module Wallets.

- **[README - Implémenter module tournois et prize pool.md](./backend/README%20-%20Implémenter%20module%20tournois%20et%20prize%20pool.md)**  
  Documentation complète de l'implémentation des modules Tournaments et PrizePool (Phase 4).

- **[README - Implémenter les rôles joueur et l'API admin.md](./backend/README%20-%20Implémenter%20les%20rôles%20joueur%20et%20l'API%20admin.md)**  
  Documentation du système de rôles (PLAYER, ADMIN, SUPER_ADMIN), protection des endpoints admin, et API admin v1 (Phase 4.5).

- **[README - Restrictions ciblées et modération avancée.md](./backend/README%20-%20Restrictions%20ciblées%20et%20modération%20avancée.md)**  
  Documentation du système de restrictions ciblées permettant de bloquer finement l'accès aux tournois, dépôts et retraits sans suspendre complètement le compte (Phase 4.7).

- **[README - Matches et résultats de tournoi.md](./backend/README%20-%20Matches%20et%20résultats%20de%20tournoi.md)**  
  Documentation complète du module Matches : génération des brackets, gestion des matches, enregistrement des résultats, génération automatique des rondes, finalisation et distribution des gains (Phase 5).

### Documentation Frontend

- **[README - Développement frontend plateforme d'échecs.md](./frontend/README%20-%20Développement%20frontend%20plateforme%20d'échecs.md)**  
  Documentation complète du développement frontend : pages, authentification, composants, et conformité légale.

- **[README - Implémenter les rôles et l'espace admin v1.md](./frontend/README%20-%20Implémenter%20les%20rôles%20et%20l'espace%20admin%20v1.md)**  
  Documentation de l'implémentation frontend du système de rôles, affichage visuel (couleurs + icônes), et espace admin v1 (Phase 4.5).

- **[README - Gérer les comptes suspendus côté frontend.md](./frontend/README%20-%20Gérer%20les%20comptes%20suspendus%20côté%20frontend.md)**  
  Documentation de la gestion frontend des comptes suspendus avec messages d'erreur et déconnexion automatique (Phase 4.6).

- **[README - Développer restrictions ciblées joueurs.md](./frontend/README%20-%20Développer%20restrictions%20ciblées%20joueurs.md)**  
  Documentation de l'implémentation frontend du système de restrictions ciblées : UI admin, gestion des codes d'erreur, et affichage cohérent des messages (Phase 4.7).

---

## 🗂️ Organisation

Les README sont organisés par domaine :

- **Racine** : Documentation générale du projet
- **backend/** : Toute la documentation spécifique au backend NestJS (Prisma, modules, authentification, SMTP, etc.)
- **frontend/** : Documentation du développement frontend (pages, authentification, composants, etc.)

---

## 📝 Notes

- Tous les README sont en français
- Chaque README contient une date de création et un statut
- Les README sont mis à jour au fur et à mesure de l'évolution du projet

---

**Dernière mise à jour** : 14 Décembre 2025

**Changements récents** :
- ✅ **Phase 6.0.A terminée** (14 Décembre 2025) : Extension du modèle Match avec champs gameplay, création du modèle MatchMove, enum MatchColor, migration Prisma appliquée
- ✅ PostgreSQL mis à jour vers version 17 (compatibilité avec dumps récents)
- ✅ Script d'import automatisé créé (`backend/import-database.ps1`)
- ✅ Documentation d'audit et de restauration ajoutée

---

## 📦 Résumé des Fonctionnalités

### Backend ✅
- API NestJS complète
- Authentification JWT
- Envoi d'emails (SMTP Infomaniak)
- Base de données Prisma + PostgreSQL
- Validation d'âge (18+)
- Vérification d'email
- Module Transactions centralisé
- Module Wallets avec gestion des portefeuilles
- Module Tournaments (création, inscription, clôture)
- Module PrizePool (calcul min/current/max, figement)
- Système de rôles (PLAYER, ADMIN, SUPER_ADMIN)
- Protection des endpoints admin (RolesGuard)
- API admin v1 (gestion joueurs et tournois)
- Système de restrictions ciblées (blocage tournois, dépôts, retraits)
- Suspension de comptes (isActive)
- Module Matches (génération brackets, gestion matches, résultats)
- Génération automatique des rondes suivantes
- Finalisation automatique des tournois avec distribution des gains
- Calcul des classements basés sur les résultats
- ⚠️ **Note** : Pas encore de plateau d'échecs intégré (Phase 6+)

### Frontend ✅
- Landing page avec textes légaux
- Inscription avec validation 18+
- Connexion avec JWT
- Vérification d'email
- Mot de passe oublié / réinitialisation
- Lobby protégé avec liste des tournois
- Affichage des prize pools (min/current/max) avec badges colorés
- Inscription aux tournois depuis le lobby
- Gestion du wallet avec historique des transactions
- Pages légales (CGU, Privacy)
- Système d'authentification complet
- Affichage visuel des rôles (couleurs + icônes)
- Espace admin v1 (dashboard, gestion joueurs, gestion tournois)
- Protection des pages admin (redirection si non admin)
- UI admin pour restrictions ciblées (gestion tournois, dépôts, retraits)
- Gestion des codes d'erreur spécifiques (TOURNAMENTS_BLOCKED, DEPOSITS_BLOCKED, WITHDRAWALS_BLOCKED)
- Pages tournois (`/tournaments` et `/tournaments/[id]`) avec affichage des matches et classements (Phase 5)
- ⚠️ **Note** : Pas encore de plateau d'échecs intégré pour jouer réellement (Phase 6+)

