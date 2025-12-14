import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { MatchesService } from './matches.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ActivePlayerGuard } from '../../auth/guards/active-player.guard';
import { PlayMoveDto } from './dto/play-move.dto';

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

  /**
   * POST /matches/:id/join
   * Phase 6.0.C - Rejoindre un match
   */
  @UseGuards(JwtAuthGuard, ActivePlayerGuard)
  @Post(':id/join')
  async joinMatch(@Param('id') matchId: string, @Request() req: any) {
    const playerId = req.user.sub;
    return this.matchesService.joinMatch(matchId, playerId);
  }

  /**
   * GET /matches/:id/state
   * Phase 6.0.C - Récupérer l'état d'un match
   */
  @UseGuards(JwtAuthGuard, ActivePlayerGuard)
  @Get(':id/state')
  async getMatchState(@Param('id') matchId: string, @Request() req: any) {
    const playerId = req.user.sub;
    return this.matchesService.getMatchState(matchId, playerId);
  }

  /**
   * POST /matches/:id/move
   * Phase 6.0.C - Jouer un coup
   */
  @UseGuards(JwtAuthGuard, ActivePlayerGuard)
  @Post(':id/move')
  async playMove(
    @Param('id') matchId: string,
    @Body() dto: PlayMoveDto,
    @Request() req: any,
  ) {
    const playerId = req.user.sub;
    return this.matchesService.playMove(matchId, playerId, dto);
  }
}

