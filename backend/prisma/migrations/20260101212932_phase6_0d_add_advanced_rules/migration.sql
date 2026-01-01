-- CreateEnum
CREATE TYPE "DrawRuleMode" AS ENUM ('ALLOW_ALL', 'NO_DRAW_OFFER', 'NO_DRAW');

-- CreateEnum
CREATE TYPE "TieBreakPolicy" AS ENUM ('NONE', 'RAPID', 'BLITZ', 'ARMAGEDDON', 'BEST_OF_3', 'BEST_OF_5');

-- AlterTable
ALTER TABLE "tournaments" ADD COLUMN     "drawRuleMode" "DrawRuleMode" NOT NULL DEFAULT 'ALLOW_ALL',
ADD COLUMN     "drawConfig" JSONB,
ADD COLUMN     "requiresDecisiveResult" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tieBreakPolicy" "TieBreakPolicy" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "tieBreakTimeControl" TEXT;

-- AlterTable
ALTER TABLE "matches" ADD COLUMN     "timeControlOverride" TEXT;

-- CreateIndex
CREATE INDEX "tournaments_drawRuleMode_idx" ON "tournaments"("drawRuleMode");

-- CreateIndex
CREATE INDEX "tournaments_tieBreakPolicy_idx" ON "tournaments"("tieBreakPolicy");

-- CreateIndex
CREATE INDEX "tournaments_requiresDecisiveResult_idx" ON "tournaments"("requiresDecisiveResult");

-- CreateIndex
CREATE INDEX "matches_isTieBreak_idx" ON "matches"("isTieBreak");

-- CreateUniqueConstraint
CREATE UNIQUE INDEX "unique_tiebreak_per_parent" ON "matches"("parentMatchId", "tieBreakIndex");

