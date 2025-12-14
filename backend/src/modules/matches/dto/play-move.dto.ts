import { IsString, IsOptional, IsIn } from 'class-validator';

/**
 * DTO pour jouer un coup
 * Phase 6.0.C - Backend Gameplay Orchestration
 */
export class PlayMoveDto {
  @IsString()
  from: string; // Notation algébrique (ex: "e2")

  @IsString()
  to: string; // Notation algébrique (ex: "e4")

  @IsOptional()
  @IsIn(['q', 'r', 'b', 'n'])
  promotion?: 'q' | 'r' | 'b' | 'n'; // Promotion optionnelle
}
