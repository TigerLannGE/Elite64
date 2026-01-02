import {
  IsString,
  IsInt,
  IsOptional,
  IsDateString,
  Min,
  IsEnum,
  IsBoolean,
  IsObject,
} from 'class-validator';
import { TournamentStatus, DrawRuleMode, TieBreakPolicy } from '@prisma/client';

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

  // Phase 6.0.D - Règles avancées
  @IsOptional()
  @IsEnum(DrawRuleMode)
  drawRuleMode?: DrawRuleMode;

  @IsOptional()
  @IsObject()
  drawConfig?: Record<string, unknown>; // JSON optionnel (non implémenté en 6.0.D, validation permissive)

  @IsOptional()
  @IsBoolean()
  requiresDecisiveResult?: boolean;

  @IsOptional()
  @IsEnum(TieBreakPolicy)
  tieBreakPolicy?: TieBreakPolicy;

  @IsOptional()
  @IsString()
  tieBreakTimeControl?: string; // ex: "3+2", "10+5"
}

