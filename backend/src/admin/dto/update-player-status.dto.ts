import { IsBoolean } from 'class-validator';

export class UpdatePlayerStatusDto {
  @IsBoolean()
  isActive: boolean;
}

