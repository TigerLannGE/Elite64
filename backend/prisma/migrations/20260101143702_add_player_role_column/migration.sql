-- CreateEnum
CREATE TYPE "PlayerRole" AS ENUM ('PLAYER', 'ADMIN', 'SUPER_ADMIN');

-- AlterTable
ALTER TABLE "players" ADD COLUMN     "role" "PlayerRole" NOT NULL DEFAULT 'PLAYER';
