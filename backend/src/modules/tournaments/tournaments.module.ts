import { Module, forwardRef } from '@nestjs/common';
import { TournamentsService } from './tournaments.service';
import { TournamentsController, TournamentsAdminController } from './tournaments.controller';
import { TransactionsModule } from '../../transactions/transactions.module';
import { PrizePoolModule } from '../prize-pool/prize-pool.module';
import { AuthModule } from '../../auth/auth.module';
import { ModerationModule } from '../../moderation/moderation.module';
import { MatchesModule } from '../matches/matches.module';
// Module pour la gestion des tournois
// Gestion des droits d'entrée, création, inscription, etc.

@Module({
  imports: [
    TransactionsModule,
    PrizePoolModule,
    AuthModule,
    ModerationModule,
    forwardRef(() => MatchesModule),
  ],
  controllers: [TournamentsController, TournamentsAdminController],
  providers: [TournamentsService],
  exports: [TournamentsService],
})
export class TournamentsModule {}




