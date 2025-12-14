import { Module, forwardRef } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { MatchesController } from './matches.controller';
import { MatchesAdminController } from './matches.admin.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../../auth/auth.module';
import { TournamentsModule } from '../tournaments/tournaments.module';

// Module pour la gestion des matchs d'échecs
// Enregistrement des résultats, validation, etc.

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    forwardRef(() => TournamentsModule),
  ],
  controllers: [MatchesController, MatchesAdminController],
  providers: [MatchesService],
  exports: [MatchesService],
})
export class MatchesModule {}





