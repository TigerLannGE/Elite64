# 📊 Amendement au Référentiel Normatif — Prélèvement Opérateur 9,75%

**Type** : ✅ AMENDEMENT AU REFERENTIEL NORMATIF  
**Date** : 01 janvier 2026  
**Document concerné** : 04 — Finance & paiements  
**Statut** : ✅ Approuvé et implémenté

---

## 🎯 Objet de l'Amendement

Cet amendement modifie le modèle économique documenté dans le référentiel normatif (Document 04) pour établir explicitement un **prélèvement opérateur total de 9,75%** avec décomposition claire et traçable.

**Impact** : Modification du modèle économique, structure de données, calculs backend, et documentation.

---

## 📋 Structure Retenue

### Qualification Officielle

```
Commission plateforme : 5,00 %
  → Rémunération du service

Frais d'organisation de tournoi : 4,75 %
  → Coûts opérationnels (infra, arbitrage, anti-fraude, support)

Total prélevé opérateur : 9,75 %
```

**Note** : Ces deux éléments font partie d'un même prélèvement opérateur, décomposé pour transparence interne et admin, pas forcément joueur.

### Formulation Canonique

> "Le buy-in inclut des frais opérateur totaux de 9,75 %, comprenant une commission plateforme (5 %) et des frais d'organisation de tournoi (4,75 %). Le solde est redistribué aux joueurs selon les règles du tournoi."

---

## 🔧 Modifications Techniques

### 1. Migration Prisma

**Fichier** : `backend/prisma/migrations/20260101185838_add_tournament_fees_explicit/migration.sql`

**Ajouts** :
- `tournamentFeesCents` : Frais d'organisation de tournoi (4,75% du total)
- `operatorTotalCents` : Total prélèvement opérateur (9,75% du total)

**Rétrocompatibilité** : Calcul automatique des valeurs pour les PrizePool existants.

**⚠️ IMPORTANT - Migration rétroactive** :
- Les anciens PrizePool (avant migration) ont `tournamentFeesCents` calculé comme **résidu historique** : `totalEntriesCents - commissionCents - distributableCents`
- Cette valeur est un "legacy derived", pas un calcul à taux fixe 4,75%
- Les nouveaux PrizePool (après migration) utilisent le calcul canonique avec `TOURNAMENT_FEES_RATE` (0.0475)

### 2. Schéma Prisma Mis à Jour

**Fichier** : `backend/prisma/schema.prisma`

```prisma
model PrizePool {
  id                 String   @id @default(cuid())
  tournamentId       String   @unique
  totalEntriesCents  Int      // Somme des buy-ins
  commissionCents    Int      @default(0) // Commission plateforme (5% du total)
  tournamentFeesCents Int     @default(0) // Frais d'organisation de tournoi (4,75% du total)
  operatorTotalCents Int      @default(0) // Total prélèvement opérateur (9,75% du total)
  distributableCents Int      // Montant redistribuable aux joueurs
  // ...
}
```

### 3. Service PrizePool — Calcul Canonique

**Fichier** : `backend/src/modules/prize-pool/prize-pool.service.ts`

**Constantes canoniques** :
```typescript
const COMMISSION_RATE = 0.05;        // 5% commission plateforme
const TOURNAMENT_FEES_RATE = 0.0475;  // 4,75% frais d'organisation de tournoi
// ⚠️ OPERATOR_TOTAL_RATE (0.0975) : UNIQUEMENT pour documentation/assertion
const OPERATOR_TOTAL_RATE = 0.0975;   // 9,75% total (documentation uniquement)
```

**Calcul canonique** :
```typescript
computePrizePool(input) {
  const totalEntriesCents = input.playersCount * input.buyInCents;
  const commissionCents = Math.floor(totalEntriesCents * COMMISSION_RATE);
  const tournamentFeesCents = Math.floor(totalEntriesCents * TOURNAMENT_FEES_RATE);
  // ⚠️ CRITIQUE : operatorTotalCents = commissionCents + tournamentFeesCents
  // Ne JAMAIS calculer via OPERATOR_TOTAL_RATE pour éviter les écarts d'arrondi
  const operatorTotalCents = commissionCents + tournamentFeesCents;
  // Preuve audit-proof : distributableCents = totalEntriesCents - operatorTotalCents
  const distributableCents = totalEntriesCents - operatorTotalCents;
  return { totalEntriesCents, commissionCents, tournamentFeesCents, operatorTotalCents, distributableCents };
}
```

**Points critiques résolus** :
1. **Arrondi** : `operatorTotalCents` est toujours calculé comme somme (`commissionCents + tournamentFeesCents`), jamais via `OPERATOR_TOTAL_RATE`
2. **Preuve audit-proof** : `distributableCents = totalEntriesCents - operatorTotalCents` garantit que le buy-in inclut un prélèvement opérateur total de 9,75% (commission + frais), le reste étant redistribué
3. **Migration rétroactive** : Les anciens PrizePool ont `tournamentFeesCents` comme résidu historique (legacy derived), les nouveaux utilisent le taux 0.0475

---

## ⚠️ Points Critiques Résolus

### 1. Constantes et Arrondi

**Problème** : Risque d'écarts de 1-2 cents si `operatorTotalCents` est calculé via `OPERATOR_TOTAL_RATE`.

**Solution** :
- `OPERATOR_TOTAL_RATE` est **UNIQUEMENT** pour documentation/assertion
- `operatorTotalCents` est **TOUJOURS** calculé comme : `commissionCents + tournamentFeesCents`
- Assertion de cohérence en développement pour détecter les écarts

### 2. Preuve que le Buy-in Inclut un Prélèvement Opérateur de 9,75%

**Preuve audit-proof** :
- Le joueur paie le buy-in complet (ex. 10 CHF)
- Le buy-in inclut un prélèvement opérateur total de 9,75% (commission + frais), le reste étant redistribué
- Le prélèvement opérateur est : `commissionCents + tournamentFeesCents`
- Le prize pool redistribuable est : `totalEntriesCents - operatorTotalCents`
- Vérification : `totalEntriesCents = operatorTotalCents + distributableCents`

### 3. Migration Rétroactive

**Distinction legacy vs nouveau** :
- **Anciens tournois** (avant migration) : `tournamentFeesCents` est un résidu historique (legacy derived)
- **Nouveaux tournois** (après migration) : `tournamentFeesCents` est calculé via `TOURNAMENT_FEES_RATE` (0.0475)
- Documentation explicite dans la migration SQL et le code

---

## 📊 Exemple Concret

**Tournoi** : 2 joueurs × 10 CHF = 20 CHF

| Élément | Calcul | Montant | Pourcentage |
|---------|--------|---------|-------------|
| Total inscriptions | 2 × 10 CHF | 20,00 CHF | 100% |
| Commission plateforme | 5% du total | 1,00 CHF | 5,00% |
| Frais d'organisation | 4,75% du total | 0,95 CHF | 4,75% |
| **Total prélèvement opérateur** | 1,00 + 0,95 | **1,95 CHF** | **9,75%** |
| Prize pool redistribuable | 20,00 - 1,95 | 18,05 CHF | 90,25% |

**Stockage en base** :
- `totalEntriesCents` : 2000
- `commissionCents` : 100
- `tournamentFeesCents` : 95
- `operatorTotalCents` : 195
- `distributableCents` : 1805

---

## ✅ Validation et Checks Techniques

### Invariants de Calcul (Obligatoires)

Sur 5 cas de test (petits montants + montants impairs), validation que :

- `operatorTotalCents = commissionCents + tournamentFeesCents`
- `totalEntriesCents = operatorTotalCents + distributableCents`
- `distributableCents >= 0`
- `commissionCents >= 0, tournamentFeesCents >= 0`

**Script de validation** : `backend/scripts/validate-prize-pool-invariants.ts`

### Non-régression Métier

- La redistribution utilise bien `distributableCents` (et pas une ancienne base)
- Les transactions `TOURNAMENT_PAYOUT` totalisent exactement la part distribuable (à ± arrondi si split par position)

### Migration "Legacy Derived"

- Après migration, les PrizePool historiques ont `tournamentFeesCents` calculé comme résidu
- `operatorTotalCents` est cohérent
- Aucun PrizePool ne se retrouve avec des valeurs négatives

### Contrôle API/Frontend

- La sérialisation API inclut bien `tournamentFeesCents` et `operatorTotalCents`
- Types TypeScript mis à jour (backend + frontend)

---

## 🎯 Résultat Final

✅ **Prélèvement opérateur explicite** : Tous les éléments sont calculés et stockés explicitement  
✅ **Traçabilité complète** : Chaque prélèvement est traçable via les champs de base de données  
✅ **Conformité juridique** : Formulation canonique adoptée partout  
✅ **Reporting facilité** : Les champs explicites facilitent le reporting comptable  
✅ **Plus de zone grise** : Plus de logique implicite, tout est explicite  
✅ **Arrondi maîtrisé** : Calcul par somme garantit la traçabilité exacte  
✅ **Preuve audit-proof** : Le calcul garantit que le buy-in inclut un prélèvement opérateur total de 9,75% (commission + frais), le reste étant redistribué

---

## 📝 Documents de Référence

- **Document original** : `docs/governance/audits/ALIGNEMENT_9_75_PERCENT_2026-01-01.md`
- **Migration Prisma** : `backend/prisma/migrations/20260101185838_add_tournament_fees_explicit/`
- **Script de validation** : `backend/scripts/validate-prize-pool-invariants.ts`

---

**Date d'approbation** : 01 janvier 2026  
**Statut** : ✅ Fait foi — Cet amendement modifie le référentiel normatif (Document 04)

