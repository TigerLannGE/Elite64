-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('PENDING', 'RUNNING', 'FINISHED', 'CANCELED');

-- AlterEnum
BEGIN;
CREATE TYPE "MatchResult_new" AS ENUM ('WHITE_WIN', 'BLACK_WIN', 'DRAW', 'BYE');
ALTER TABLE "matches" ALTER COLUMN "result" DROP DEFAULT;
ALTER TABLE "matches" ALTER COLUMN "result" TYPE "MatchResult_new" USING ("result"::text::"MatchResult_new");
ALTER TYPE "MatchResult" RENAME TO "MatchResult_old";
ALTER TYPE "MatchResult_new" RENAME TO "MatchResult";
DROP TYPE "MatchResult_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "matches" DROP CONSTRAINT "matches_blackPlayerId_fkey";

-- DropForeignKey
ALTER TABLE "matches" DROP CONSTRAINT "matches_whitePlayerId_fkey";

-- DropIndex
DROP INDEX "matches_blackPlayerId_idx";

-- DropIndex
DROP INDEX "matches_result_idx";

-- DropIndex
DROP INDEX "matches_whitePlayerId_idx";

-- AlterTable
ALTER TABLE "matches" DROP COLUMN "blackPlayerId",
DROP COLUMN "pgn",
DROP COLUMN "whitePlayerId",
ADD COLUMN     "blackEntryId" TEXT NOT NULL,
ADD COLUMN     "boardNumber" INTEGER NOT NULL,
ADD COLUMN     "resultReason" TEXT,
ADD COLUMN     "roundNumber" INTEGER NOT NULL,
ADD COLUMN     "status" "MatchStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "whiteEntryId" TEXT NOT NULL,
ALTER COLUMN "result" DROP NOT NULL,
ALTER COLUMN "result" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "matches_roundNumber_tournamentId_idx" ON "matches"("roundNumber", "tournamentId");

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_whiteEntryId_fkey" FOREIGN KEY ("whiteEntryId") REFERENCES "tournament_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_blackEntryId_fkey" FOREIGN KEY ("blackEntryId") REFERENCES "tournament_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
