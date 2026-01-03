import { IsOptional, IsBoolean, IsString, MaxLength } from 'class-validator';

export class UpdatePlayerRestrictionsDto {
  @IsOptional()
  @IsBoolean()
  blockTournaments?: boolean;

  @IsOptional()
  @IsBoolean()
  blockWalletDeposits?: boolean;

  @IsOptional()
  @IsBoolean()
  blockWalletWithdrawals?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  moderationNote?: string;
}
