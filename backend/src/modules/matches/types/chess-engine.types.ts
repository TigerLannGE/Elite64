/**
 * Types pour le moteur d'échecs backend
 * Phase 6.0.B - Moteur d'échecs sans exposition HTTP/WebSocket
 */

/**
 * Raison de fin de partie
 */
export enum GameEndReason {
  CHECKMATE = 'CHECKMATE',
  STALEMATE = 'STALEMATE',
  INSUFFICIENT_MATERIAL = 'INSUFFICIENT_MATERIAL',
  FIFTY_MOVE_RULE = 'FIFTY_MOVE_RULE',
  THREE_FOLD_REPETITION = 'THREE_FOLD_REPETITION',
  DRAW_BY_AGREEMENT = 'DRAW_BY_AGREEMENT',
}

/**
 * État de fin de partie
 */
export interface GameEnd {
  reason: GameEndReason;
  winner?: 'white' | 'black';
}

/**
 * Entrée pour valider et appliquer un coup
 */
export interface ChessMoveInput {
  from: string; // Notation algébrique (ex: "e2")
  to: string; // Notation algébrique (ex: "e4")
  promotion?: 'q' | 'r' | 'b' | 'n'; // Promotion optionnelle (dame, tour, fou, cavalier)
}

/**
 * Résultat de la validation et application d'un coup
 */
export interface ChessMoveResult {
  success: boolean;
  error?: string; // Message d'erreur si le coup est illégal
  fenBefore: string; // FEN avant le coup
  fenAfter: string; // FEN après le coup (si succès)
  san: string; // Notation algébrique standard (ex: "e4", "Nf3", "O-O")
  gameEnd: GameEnd | null; // État de fin de partie si applicable
}
