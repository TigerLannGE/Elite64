import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  ValidationPipe,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, ADMIN_ROLES } from '../auth/decorators/roles.decorator';
import { AdminPlayersService } from './admin-players.service';
import { UpdatePlayerStatusDto } from './dto/update-player-status.dto';
import { UpdatePlayerRestrictionsDto } from './dto/update-player-restrictions.dto';

@Controller('admin/players')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ADMIN_ROLES)
export class AdminPlayersController {
  constructor(private readonly adminPlayersService: AdminPlayersService) {}

  /**
   * GET /admin/players
   * Liste paginée des joueurs (admin uniquement)
   * Query params: skip, take (max 100), search
   */
  @Get()
  async findAll(
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
    @Query('take', new DefaultValuePipe(50), ParseIntPipe) take: number,
    @Query('search') search?: string,
  ) {
    // Validation des paramètres
    if (skip < 0) {
      throw new BadRequestException('skip must be >= 0');
    }
    if (take <= 0) {
      throw new BadRequestException('take must be > 0');
    }

    // Limiter take à 100 pour éviter des requêtes trop lourdes
    const limitedTake = Math.min(take, 100);
    return this.adminPlayersService.findAll(skip, limitedTake, search);
  }

  /**
   * GET /admin/players/:id
   * Détails d'un joueur (admin uniquement)
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.adminPlayersService.findOne(id);
  }

  /**
   * PATCH /admin/players/:id/status
   * Suspendre ou réactiver un joueur (admin uniquement)
   */
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body(ValidationPipe) updateStatusDto: UpdatePlayerStatusDto,
  ) {
    return this.adminPlayersService.updateStatus(id, updateStatusDto.isActive);
  }

  /**
   * PATCH /admin/players/:id/restrictions
   * Modifier les restrictions ciblées d'un joueur (admin uniquement)
   */
  @Patch(':id/restrictions')
  async updateRestrictions(
    @Param('id') id: string,
    @Body(ValidationPipe) updateRestrictionsDto: UpdatePlayerRestrictionsDto,
  ) {
    return this.adminPlayersService.updateRestrictions(id, updateRestrictionsDto);
  }
}

