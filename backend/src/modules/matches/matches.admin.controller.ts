import { Controller, Post, Param, Body, UseGuards } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { ReportMatchResultDto } from './dto/report-match-result.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles, ADMIN_ROLES } from '../../auth/decorators/roles.decorator';

@Controller('admin/matches')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ADMIN_ROLES)
export class MatchesAdminController {
  constructor(private readonly matchesService: MatchesService) {}

  /**
   * POST /admin/matches/tournament/:tournamentId/generate
   * Génère les matches du premier tour pour un tournoi (admin-only)
   */
  @Post('tournament/:tournamentId/generate')
  async generateInitialMatches(@Param('tournamentId') tournamentId: string) {
    return this.matchesService.generateInitialMatchesForTournament(tournamentId);
  }

  /**
   * POST /admin/matches/:id/result
   * Enregistre le résultat d'un match (admin-only)
   */
  @Post(':id/result')
  async reportResult(@Param('id') matchId: string, @Body() dto: ReportMatchResultDto) {
    return this.matchesService.reportResult(matchId, dto);
  }
}
