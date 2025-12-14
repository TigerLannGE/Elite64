import {
  IsString,
  IsInt,
  IsOptional,
  IsDateString,
  Min,
  IsEnum,
} from 'class-validator';
import { TournamentStatus } from '@prisma/client';

export class UpdateTournamentDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  timeControl?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  buyInCents?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsInt()
  @Min(2)
  @IsOptional()
  minPlayers?: number;

  @IsInt()
  @Min(2)
  @IsOptional()
  maxPlayers?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  eloMin?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  eloMax?: number;

  @IsDateString()
  @IsOptional()
  startsAt?: string;

  @IsDateString()
  @IsOptional()
  endsAt?: string;

  @IsDateString()
  @IsOptional()
  registrationClosesAt?: string;

  @IsString()
  @IsOptional()
  legalZoneCode?: string;

  @IsEnum(TournamentStatus)
  @IsOptional()
  status?: TournamentStatus;
}

