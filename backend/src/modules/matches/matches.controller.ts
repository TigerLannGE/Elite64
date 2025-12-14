import {
  Controller,
  Get,
  Param,
  UseGuards,
  Request,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { MatchesService } from './matches.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ActivePlayerGuard } from '../../auth/guards/active-player.guard';

@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  /**
   * GET /matches/tournament/:tournamentId
   * Liste les matches d'un tournoi (public ou filtré par joueur connecté)
   */
  @Get('tournament/:tournamentId')
  async listMatchesForTournament(
    @Param('tournamentId') tournamentId: string,
    @Query('playerId') playerId?: string,
  ) {
    return this.matchesService.listMatchesForTournament(
      tournamentId,
      playerId,
    );
  }

  /**
   * GET /matches/me?tournamentId=xxx
   * Liste les matches du joueur connecté pour un tournoi spécifique
   * Requiert un query param tournamentId
   */
  @UseGuards(JwtAuthGuard, ActivePlayerGuard)
  @Get('me')
  async listMyMatches(
    @Request() req: any,
    @Query('tournamentId') tournamentId?: string,
  ) {
    if (!tournamentId) {
      throw new BadRequestException(
        'Le paramètre tournamentId est requis',
      );
    }
    const playerId = req.user.sub;
    return this.matchesService.listMatchesForTournament(
      tournamentId,
      playerId,
    );
  }

  /**
   * GET /matches/:id
   * Récupère un match par id (public)
   */
  @Get(':id')
  async getMatchById(@Param('id') matchId: string) {
    return this.matchesService.getMatchById(matchId);
  }
}

