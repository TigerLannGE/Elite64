import { Module, forwardRef } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { MatchesController } from './matches.controller';
import { MatchesAdminController } from './matches.admin.controller';
import { ChessEngineService } from './chess-engine.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../../auth/auth.module';
import { TournamentsModule } from '../tournaments/tournaments.module';

// Module pour la gestion des matchs d'échecs
// Enregistrement des résultats, validation, etc.

@Module({
  imports: [PrismaModule, AuthModule, forwardRef(() => TournamentsModule)],
  controllers: [MatchesController, MatchesAdminController],
  providers: [MatchesService, ChessEngineService],
  exports: [MatchesService, ChessEngineService],
})
export class MatchesModule {}
