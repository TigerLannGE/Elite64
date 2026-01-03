import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { PlayersModule } from './players/players.module';
import { WalletsModule } from './wallets/wallets.module';
import { TransactionsModule } from './transactions/transactions.module';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { PrizePoolModule } from './modules/prize-pool/prize-pool.module';
import { TournamentsModule } from './modules/tournaments/tournaments.module';
import { AdminModule } from './admin/admin.module';
import { ModerationModule } from './moderation/moderation.module';
import { MatchesModule } from './modules/matches/matches.module';
// Modules futurs à importer ici :
// import { CountryRulesModule } from './modules/country-rules/country-rules.module';

@Module({
  imports: [
    PrismaModule,
    MailModule,
    AuthModule,
    PlayersModule,
    WalletsModule,
    TransactionsModule,
    PrizePoolModule,
    TournamentsModule,
    AdminModule,
    ModerationModule,
    MatchesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
