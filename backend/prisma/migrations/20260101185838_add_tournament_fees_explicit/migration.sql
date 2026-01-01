-- AlterTable
ALTER TABLE "prize_pools" ADD COLUMN     "operatorTotalCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tournamentFeesCents" INTEGER NOT NULL DEFAULT 0;

-- ⚠️ MIGRATION RÉTROACTIVE : Calcul des valeurs pour les PrizePool existants
-- 
-- IMPORTANT : Cette migration ne "crée" pas des frais à 4,75% du total.
-- Elle recompose un résidu historique à partir des données existantes :
--   tournamentFeesCents = totalEntriesCents - commissionCents - distributableCents
--
-- Cette valeur est un "legacy derived" (résidu historique), pas un calcul à taux fixe.
--
-- Pour les NOUVEAUX tournois (après cette migration) :
--   tournamentFeesCents sera calculé via TOURNAMENT_FEES_RATE (0.0475) dans computePrizePool()
--
-- Pour les ANCIENS tournois (avant cette migration) :
--   tournamentFeesCents est un résidu historique, acceptable pour l'audit mais à documenter
--
UPDATE "prize_pools"
SET 
  -- Résidu historique : différence entre total, commission et distributable
  "tournamentFeesCents" = "totalEntriesCents" - "commissionCents" - "distributableCents",
  -- Total opérateur : somme des deux composantes (cohérent avec la nouvelle logique)
  "operatorTotalCents" = "commissionCents" + ("totalEntriesCents" - "commissionCents" - "distributableCents")
WHERE "tournamentFeesCents" = 0 AND "operatorTotalCents" = 0;
