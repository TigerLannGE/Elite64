import { Module } from '@nestjs/common';
import { PrizePoolService } from './prize-pool.service';
// Module pour le calcul et la distribution des prize pools
// Logique centralisée pour éviter toute dispersion dans l'UI

@Module({
  providers: [PrizePoolService],
  exports: [PrizePoolService],
})
export class PrizePoolModule {}
