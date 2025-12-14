import { Module } from '@nestjs/common';
import { PlayerRestrictionsService } from './player-restrictions.service';

@Module({
  providers: [PlayerRestrictionsService],
  exports: [PlayerRestrictionsService],
})
export class ModerationModule {}

