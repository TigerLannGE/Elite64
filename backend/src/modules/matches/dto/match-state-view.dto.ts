import { MatchStatus, MatchResult, MatchColor } from '@prisma/client';

/**
 * DTO canonique pour l'état d'un match
 * Phase 6.0.C - Backend Gameplay Orchestration
 */
export class MatchStateViewDto {
  matchId: string;
  tournamentId: string;
  status: MatchStatus;
  result?: MatchResult | null;
  resultReason?: string | null;
  whitePlayerId: string;
  blackPlayerId: string;
  fen: string;
  moveNumber: number; // Nombre de coups joués
  turn: MatchColor; // WHITE ou BLACK
  whiteTimeMsRemaining: number;
  blackTimeMsRemaining: number;
  lastMove?: {
    san: string;
    from: string;
    to: string;
    promotion?: string | null;
  } | null;
  serverTimeUtc: string; // ISO string
}
