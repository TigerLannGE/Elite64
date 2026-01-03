import { IsString, IsInt, IsOptional, IsDateString, Min, IsEnum } from 'class-validator';
import { TournamentStatus } from '@prisma/client';

export class CreateTournamentDto {
  @IsString()
  name: string;

  @IsString()
  timeControl: string; // ex: "10+0", "3+0"

  @IsInt()
  @Min(1)
  buyInCents: number;

  @IsString()
  @IsOptional()
  currency?: string; // Par défaut "EUR"

  @IsInt()
  @Min(2)
  minPlayers: number;

  @IsInt()
  @Min(2)
  maxPlayers: number;

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
  legalZoneCode: string; // ex: "UK", "US-CA", "EU"

  @IsEnum(TournamentStatus)
  @IsOptional()
  status?: TournamentStatus; // Par défaut DRAFT
}
