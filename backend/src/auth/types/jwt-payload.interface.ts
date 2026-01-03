import { PlayerRole } from '@prisma/client';

export interface JwtPayload {
  sub: string; // player.id
  email: string;
  username: string;
  role: PlayerRole;
}
