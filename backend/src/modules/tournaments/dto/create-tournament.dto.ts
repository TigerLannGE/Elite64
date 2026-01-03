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
