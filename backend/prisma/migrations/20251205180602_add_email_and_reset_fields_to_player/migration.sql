-- AlterTable
ALTER TABLE "players" ADD COLUMN "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "emailVerificationToken" TEXT,
ADD COLUMN "emailVerificationExpiresAt" TIMESTAMP(3),
ADD COLUMN "passwordResetToken" TEXT,
ADD COLUMN "passwordResetExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "players_emailVerificationToken_key" ON "players"("emailVerificationToken");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "players_passwordResetToken_key" ON "players"("passwordResetToken");

