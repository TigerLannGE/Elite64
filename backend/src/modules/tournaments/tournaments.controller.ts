import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { TournamentsService } from './tournaments.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ActivePlayerGuard } from '../../auth/guards/active-player.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles, ADMIN_ROLES } from '../../auth/decorators/roles.decorator';

@Controller('tournaments')
export class TournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  /**
   * GET /tournaments
   * Liste des tournois visibles dans le lobby (public)
   */
  @Get()
  async listPublicTournaments() {
    return this.tournamentsService.listPublicTournaments();
  }

  /**
   * GET /tournaments/:id/matches
   * Liste les matches d'un tournoi (public)
   * IMPORTANT: Cette route doit être définie AVANT @Get(':id') pour éviter les conflits
   */
  @Get(':id/matches')
  async getTournamentMatches(
    @Param('id') tournamentId: string,
  ) {
    return this.tournamentsService.getTournamentMatches(tournamentId);
  }

  /**
   * GET /tournaments/:id/standings
   * Retourne le classement du tournoi (public)
   * IMPORTANT: Cette route doit être définie AVANT @Get(':id') pour éviter les conflits
   */
  @Get(':id/standings')
  async getTournamentStandings(
    @Param('id') tournamentId: string,
  ) {
    return this.tournamentsService.getTournamentStandings(tournamentId);
  }

  /**
   * POST /tournaments/:id/join
   * Inscription du joueur courant (JWT requis + compte actif)
   */
  @UseGuards(JwtAuthGuard, ActivePlayerGuard)
  @Post(':id/join')
  async joinTournament(
    @Param('id') tournamentId: string,
    @Request() req: any,
  ) {
    return this.tournamentsService.joinTournament(tournamentId, req.user.sub);
  }

  /**
   * GET /tournaments/:id
   * Détail d'un tournoi pour la page de détail (public)
   * IMPORTANT: Cette route générique doit être définie EN DERNIER pour éviter les conflits
   */
  @Get(':id')
  async getTournamentPublicView(@Param('id') id: string) {
    return this.tournamentsService.getTournamentPublicView(id);
  }
}

/**
 * Controller pour les endpoints admin
 * Protégé par JwtAuthGuard et RolesGuard
 */
@Controller('admin/tournaments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ADMIN_ROLES)
export class TournamentsAdminController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  /**
   * GET /admin/tournaments
   * Liste des tournois pour l'admin (tous les statuts, avec plus de détails)
   */
  @Get()
  async getAdminTournaments() {
    return this.tournamentsService.listAdminTournaments();
  }

  /**
   * POST /admin/tournaments
   * Création d'un tournoi (admin uniquement)
   */
  @Post()
  async createTournamentAsAdmin(
    @Body() createTournamentDto: CreateTournamentDto,
    @Request() req: any,
  ) {
    // Récupérer l'adminId depuis req.user (injecté par JwtAuthGuard)
    const adminId = req.user.sub;
    return this.tournamentsService.createTournamentAsAdmin(
      createTournamentDto,
      adminId,
    );
  }

  /**
   * PATCH /admin/tournaments/:id
   * Mise à jour d'un tournoi (admin uniquement)
   * Seulement si statut DRAFT / SCHEDULED et pas d'inscrits pour certains champs
   */
  @Patch(':id')
  async updateTournamentAsAdmin(
    @Param('id') tournamentId: string,
    @Body() updateTournamentDto: UpdateTournamentDto,
  ) {
    return this.tournamentsService.updateTournamentAsAdmin(
      tournamentId,
      updateTournamentDto,
    );
  }

  /**
   * POST /admin/tournaments/:id/close-registration
   * Ferme les inscriptions et traite le tournoi (annulation ou figement du prize pool)
   */
  @Post(':id/close-registration')
  async closeRegistrationAndProcess(
    @Param('id') tournamentId: string,
  ) {
    return this.tournamentsService.closeRegistrationAndProcess(tournamentId);
  }

  /**
   * POST /admin/tournaments/:id/start
   * Démarre un tournoi en générant les matches du premier tour
   */
  @Post(':id/start')
  async startTournament(@Param('id') tournamentId: string) {
    return this.tournamentsService.startTournament(tournamentId);
  }

  /**
   * DELETE /admin/tournaments/:id
   * Supprime un tournoi (admin uniquement)
   * Permet de nettoyer les tournois de test
   */
  @Delete(':id')
  async deleteTournament(@Param('id') tournamentId: string) {
    return this.tournamentsService.deleteTournament(tournamentId);
  }

  // @Post(':id/finish')
  // async finishTournament(@Param('id', ParseUUIDPipe) tournamentId: string) {
  //   // Terminer le tournoi (changer statut à FINISHED, distribuer les gains, etc.)
  // }
}
