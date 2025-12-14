-- AlterTable
ALTER TABLE "players" ADD COLUMN "blockTournaments" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "blockWalletDeposits" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "blockWalletWithdrawals" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "moderationNote" TEXT;

