import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActivePlayerGuard } from '../auth/guards/active-player.guard';

@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @UseGuards(JwtAuthGuard, ActivePlayerGuard)
  @Get('me')
  async getMyWallet(@Request() req) {
    const playerId = req.user.sub;
    return this.walletsService.findMyWalletWithTransactions(playerId);
  }

  @UseGuards(JwtAuthGuard, ActivePlayerGuard)
  @Post('test-credit')
  async testCredit(@Request() req, @Body() body: { amountCents: number }) {
    const playerId = req.user.sub;
    return this.walletsService.testCredit(playerId, body.amountCents);
  }

  @Get(':playerId')
  findByPlayerId(@Param('playerId') playerId: string) {
    return this.walletsService.findByPlayerId(playerId);
  }
}

