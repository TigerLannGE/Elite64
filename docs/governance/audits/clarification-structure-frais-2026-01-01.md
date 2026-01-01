# 📊 Clarification Structure des Frais — Elite64

**Date** : 01 janvier 2026  
**Objectif** : Clarifier, documenter et justifier la structure des prélèvements financiers  
**Statut** : ✅ Analyse complétée

---

## 🎯 Contexte

### Comportement Observé

**Exemple concret** :
- Tournoi avec 2 joueurs
- Buy-in : 10 CHF par joueur
- Total des inscriptions : 20 CHF (2000 centimes)
- Prize pool généré : 18.05 CHF (1805 centimes)
- **Prélèvement total : 1.95 CHF (195 centimes) = 9.75%**

### Distinction Métier

Le prélèvement total de 9,75% se décompose en deux composantes distinctes :
1. **Commission plateforme** : 5,00% du total des inscriptions (rémunération du service)
2. **Frais d'organisation de tournoi** : 4,75% du total des inscriptions (coûts opérationnels : infra, arbitrage, anti-fraude, support)

**Total prélevé opérateur : 9,75%**

**Formulation canonique** : "Le buy-in inclut des frais opérateur totaux de 9,75 %, comprenant une commission plateforme (5 %) et des frais d'organisation de tournoi (4,75 %). Le solde est redistribué aux joueurs selon les règles du tournoi."

---

## 🔍 Analyse Fonctionnelle

### Calcul Actuel

**Fichier** : `backend/src/modules/prize-pool/prize-pool.service.ts`

```typescript
const COMMISSION_RATE = 0.05;      // 5% commission plateforme
const REDISTRIBUTION_RATE = 0.95;  // 95% du montant après commission

computePrizePool(input: PrizePoolComputationInput): PrizePoolComputationResult {
  const totalEntriesCents = input.playersCount * input.buyInCents;
  const commissionCents = Math.floor(totalEntriesCents * COMMISSION_RATE);
  const base = totalEntriesCents - commissionCents;
  const distributableCents = Math.floor(base * REDISTRIBUTION_RATE);
  return { totalEntriesCents, commissionCents, distributableCents };
}
```

### Exemple Détaillé (2 joueurs × 10 CHF)

| Étape | Calcul | Montant | Pourcentage |
|-------|--------|---------|-------------|
| Total inscriptions | 2 × 1000 | 2000 centimes (20 CHF) | 100% |
| Commission plateforme | floor(2000 × 0.05) | 100 centimes (1 CHF) | 5% |
| Base après commission | 2000 - 100 | 1900 centimes (19 CHF) | 95% |
| Frais de tournoi | floor(1900 × 0.05) | 95 centimes (0.95 CHF) | 4.75% |
| Prize pool distributable | floor(1900 × 0.95) | 1805 centimes (18.05 CHF) | 90.25% |
| **Prélèvement total** | 100 + 95 | **195 centimes (1.95 CHF)** | **9.75%** |

---

## 💼 Clarification Métier

### 1. Commission Plateforme (5%)

- **Nature** : Rémunération de la plateforme
- **Base** : Total des inscriptions
- **Stockage** : `PrizePool.commissionCents` (explicite)
- **Justification** : Infrastructure, gestion, services associés

### 2. Frais de Tournoi (4.75%)

- **Nature** : Frais opérationnels spécifiques au tournoi
- **Base** : Montant après commission (équivalent à 4.75% du total)
- **Stockage** : Implicite dans le calcul `distributableCents`
- **Justification** : Coûts d'organisation, support, infrastructure technique du tournoi

### Calcul des Frais de Tournoi

Les frais de tournoi peuvent être calculés de deux manières équivalentes :

1. **Depuis le montant après commission** :
   ```
   fraisTournoiCents = floor((totalEntriesCents - commissionCents) × 0.05)
   ```

2. **Depuis le total des inscriptions** :
   ```
   fraisTournoiCents = floor(totalEntriesCents × 0.0475)
   ```

**Note** : Les deux formules donnent le même résultat mathématique.

---

## ⚖️ Conformité et Justification

### Justification Légale

✅ **Transparence** : Distinction conceptuellement claire et documentable  
✅ **Justification** : Deux postes justifiés par des services distincts  
✅ **Conformité** : Structure conforme aux pratiques de plateformes skill-based

### Distinction Sémantique

**Commission plateforme** : Rémunération de la plateforme pour ses services généraux  
**Frais de tournoi** : Coûts opérationnels spécifiques à l'organisation de chaque tournoi

---

## 📋 Synthèse

**Prélèvement total** : 9.75% du total des inscriptions
- Commission plateforme : 5%
- Frais de tournoi : 4.75%

**Statut** : ✅ Calcul vérifié et cohérent

---

## 📝 Affichage dans l'Espace Admin

### Exigence pour les Super-Admins

Dans l'espace d'administration des super-admins, le frontend doit afficher clairement, pour le suivi financier :

1. **Commission plateforme** : Montant et pourcentage (5%)
2. **Frais de tournoi** : Montant et pourcentage (4.75%)
3. **Total des prélèvements** : Somme des deux éléments (9.75%)

**Justification** : Transparence financière, suivi comptable, conformité réglementaire.

**Voir** : Documentation Phase 04 Frontend Admin pour l'implémentation détaillée.

---

**Date de clôture** : 01 janvier 2026

