import { Module } from '@nestjs/common';
import { AdminBootstrapService } from './admin-bootstrap.service';
import { AdminPlayersService } from './admin-players.service';
import { AdminPlayersController } from './admin-players.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AdminPlayersController],
  providers: [AdminBootstrapService, AdminPlayersService],
  exports: [AdminBootstrapService, AdminPlayersService],
})
export class AdminModule {}

