# ✅ Checks Techniques Finaux — Prélèvement 9,75%

**Date** : 01 janvier 2026  
**Objectif** : Definition of Done pour l'alignement prélèvement 9,75%  
**Statut** : ✅ Scripts et documentation créés

---

## 📋 Checklist de Validation

### A. Invariants de Calcul (Obligatoires)

**Script** : `backend/scripts/validate-prize-pool-invariants.ts`

**Validation sur 5 cas de test** :
- ✅ 2 joueurs × 10.00 CHF
- ✅ 3 joueurs × 5.00 CHF
- ✅ 2 joueurs × 10.01 CHF
- ✅ 5 joueurs × 1.00 CHF
- ✅ 7 joueurs × 3.33 CHF

**Invariants vérifiés** :
1. `operatorTotalCents = commissionCents + tournamentFeesCents`
2. `totalEntriesCents = operatorTotalCents + distributableCents`
3. `distributableCents >= 0`
4. `commissionCents >= 0, tournamentFeesCents >= 0`

**Exécution** :
```bash
cd backend
npx ts-node scripts/validate-prize-pool-invariants.ts
```

---

### B. Non-régression Métier

**À vérifier manuellement** :

- [ ] La redistribution utilise bien `distributableCents` (et pas une ancienne base)
- [ ] Les transactions `TOURNAMENT_PAYOUT` totalisent exactement la part distribuable (à ± arrondi si split par position)

**Fichiers à vérifier** :
- `backend/src/modules/tournaments/tournaments.service.ts` (méthode `finalizeTournamentAndPayouts`)
- Vérifier que les calculs de distribution utilisent `prizePool.distributableCents`

---

### C. Migration "Legacy Derived"

**À vérifier après application de la migration** :

- [ ] Prendre un PrizePool historique et vérifier que `tournamentFeesCents` est bien calculé comme résidu
- [ ] Vérifier que `operatorTotalCents` est cohérent
- [ ] Vérifier qu'aucun PrizePool ne se retrouve avec des valeurs négatives

**Requête SQL de vérification** :
```sql
-- Vérifier les PrizePool legacy (résidu historique)
SELECT 
  id,
  tournament_id,
  total_entries_cents,
  commission_cents,
  tournament_fees_cents,
  operator_total_cents,
  distributable_cents,
  -- Vérifier la cohérence
  CASE 
    WHEN operator_total_cents != commission_cents + tournament_fees_cents 
    THEN '❌ Erreur: operatorTotalCents incohérent'
    ELSE '✅ OK'
  END as check_operator_total,
  CASE 
    WHEN total_entries_cents != operator_total_cents + distributable_cents 
    THEN '❌ Erreur: totalEntriesCents incohérent'
    ELSE '✅ OK'
  END as check_total,
  CASE 
    WHEN distributable_cents < 0 OR commission_cents < 0 OR tournament_fees_cents < 0
    THEN '❌ Erreur: valeurs négatives'
    ELSE '✅ OK'
  END as check_negatives
FROM prize_pools
WHERE operator_total_cents != 0 OR tournament_fees_cents != 0;
```

---

### D. Contrôle API/Frontend

**À vérifier** :

- [x] La sérialisation API inclut bien `tournamentFeesCents` et `operatorTotalCents`
- [x] Types TypeScript mis à jour (backend + frontend)

**Fichiers vérifiés** :
- ✅ `backend/src/modules/tournaments/tournaments.service.ts` : `TournamentPublicView.prizePools` inclut les nouveaux champs
- ✅ `frontend/lib/api.ts` : `PrizePoolView` inclut les nouveaux champs

**Test API** :
```bash
# Tester l'endpoint GET /tournaments/:id
curl http://localhost:4000/tournaments/{tournamentId} \
  -H "Authorization: Bearer <token>"

# Vérifier que la réponse inclut :
# prizePools.current.tournamentFeesCents
# prizePools.current.operatorTotalCents
```

---

## 🎯 Résultat Attendu

Après validation complète :

✅ **Tous les invariants sont respectés**  
✅ **Aucune régression métier**  
✅ **Migration legacy validée**  
✅ **API cohérente**  

---

**Note** : Ces checks doivent être exécutés après chaque modification du calcul de prize pool pour garantir la cohérence.

