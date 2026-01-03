import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { MatchResult } from '@prisma/client';

export class ReportMatchResultDto {
  @IsEnum(MatchResult)
  result: MatchResult;

  @IsOptional()
  @IsUUID()
  winnerEntryId?: string; // Pour BYE, winnerEntryId = white ou black entry

  @IsOptional()
  @IsString()
  @MaxLength(255)
  resultReason?: string; // ex: "CHECKMATE", "TIMEOUT", "RESIGNATION", "NO_SHOW"
}
