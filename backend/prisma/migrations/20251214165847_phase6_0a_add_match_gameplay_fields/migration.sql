-- CreateEnum (only if not exists)
DO $$ BEGIN
    CREATE TYPE "MatchColor" AS ENUM ('WHITE', 'BLACK');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable
ALTER TABLE "matches" ADD COLUMN     "initialFen" TEXT,
ADD COLUMN     "currentFen" TEXT,
ADD COLUMN     "whiteTimeMsRemaining" INTEGER,
ADD COLUMN     "blackTimeMsRemaining" INTEGER,
ADD COLUMN     "lastMoveAt" TIMESTAMP(3),
ADD COLUMN     "readyAt" TIMESTAMP(3),
ADD COLUMN     "whiteJoinedAt" TIMESTAMP(3),
ADD COLUMN     "blackJoinedAt" TIMESTAMP(3),
ADD COLUMN     "noShowResolvedAt" TIMESTAMP(3),
ADD COLUMN     "parentMatchId" TEXT,
ADD COLUMN     "isTieBreak" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tieBreakIndex" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tieBreakType" TEXT,
ADD COLUMN     "isRated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ratingDelta" INTEGER;

-- CreateTable
CREATE TABLE "match_moves" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "moveNumber" INTEGER NOT NULL,
    "playerId" TEXT NOT NULL,
    "color" "MatchColor" NOT NULL,
    "san" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "promotion" TEXT,
    "fenBefore" TEXT NOT NULL,
    "fenAfter" TEXT NOT NULL,
    "whiteTimeMsRemaining" INTEGER,
    "blackTimeMsRemaining" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_moves_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "match_moves_matchId_moveNumber_key" ON "match_moves"("matchId", "moveNumber");

-- CreateIndex
CREATE INDEX "match_moves_matchId_idx" ON "match_moves"("matchId");

-- CreateIndex
CREATE INDEX "matches_parentMatchId_idx" ON "matches"("parentMatchId");

-- AddForeignKey
ALTER TABLE "match_moves" ADD CONSTRAINT "match_moves_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_parentMatchId_fkey" FOREIGN KEY ("parentMatchId") REFERENCES "matches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
