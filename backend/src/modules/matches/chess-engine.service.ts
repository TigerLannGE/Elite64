import { Injectable } from '@nestjs/common';
import { Chess } from 'chess.js';
import {
  ChessMoveInput,
  ChessMoveResult,
  GameEnd,
  GameEndReason,
} from './types/chess-engine.types';

/**
 * Service moteur d'échecs backend
 * Phase 6.0.B - Autorité serveur unique, sans exposition HTTP/WebSocket
 *
 * Ce service est déterministe et pur (testable).
 * Il gère :
 * - Initialisation d'une partie depuis FEN (par défaut startpos)
 * - Validation de coups (from, to, promotion?)
 * - Application de coups légaux
 * - Détection de fin de partie (échec et mat, pat, matériel insuffisant, règle des 50 coups, triple répétition)
 */
@Injectable()
export class ChessEngineService {
  /**
   * Valide et applique un coup sur une position FEN donnée
   *
   * @param fen - Position FEN initiale (par défaut position de départ)
   * @param moveInput - Coup à valider et appliquer
   * @returns Résultat avec FEN avant/après, SAN, et état de fin éventuelle
   */
  validateAndApplyMove(
    fen: string | null,
    moveInput: ChessMoveInput,
  ): ChessMoveResult {
    // Initialiser la partie depuis FEN (ou position de départ par défaut)
    const chess = new Chess(fen || undefined);

    // Récupérer le FEN avant le coup
    const fenBefore = chess.fen();

    // Construire le coup au format chess.js
    const move = {
      from: moveInput.from,
      to: moveInput.to,
      promotion: moveInput.promotion || undefined,
    };

    try {
      // Valider et appliquer le coup
      const result = chess.move(move);

      if (!result) {
        return {
          success: false,
          error: 'Coup illégal',
          fenBefore,
          fenAfter: fenBefore,
          san: '',
          gameEnd: null,
        };
      }

      // Récupérer le FEN après le coup
      const fenAfter = chess.fen();

      // Détecter si la partie est terminée
      const gameEnd = this.detectGameEnd(chess);

      return {
        success: true,
        fenBefore,
        fenAfter,
        san: result.san,
        gameEnd,
      };
    } catch (error) {
      // Erreur lors de la validation du coup
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Coup invalide',
        fenBefore,
        fenAfter: fenBefore,
        san: '',
        gameEnd: null,
      };
    }
  }

  /**
   * Détecte si la partie est terminée et pour quelle raison
   *
   * @param chess - Instance Chess.js de la partie
   * @returns État de fin de partie ou null si la partie continue
   */
  detectGameEnd(chess: Chess): GameEnd | null {
    // Vérifier échec et mat
    if (chess.isCheckmate()) {
      return {
        reason: GameEndReason.CHECKMATE,
        winner: chess.turn() === 'w' ? 'black' : 'white', // Le gagnant est celui qui n'est pas au trait
      };
    }

    // Vérifier pat
    if (chess.isStalemate()) {
      return {
        reason: GameEndReason.STALEMATE,
      };
    }

    // Vérifier triple répétition (avant isDraw() car isDraw() peut être vrai pour plusieurs raisons)
    if (chess.isThreefoldRepetition()) {
      return {
        reason: GameEndReason.THREE_FOLD_REPETITION,
      };
    }

    // Vérifier matériel insuffisant
    if (chess.isInsufficientMaterial()) {
      return {
        reason: GameEndReason.INSUFFICIENT_MATERIAL,
      };
    }

    // Vérifier règle des 50 coups
    // Le FEN contient un compteur de "half-moves" (coups sans capture ni mouvement de pion)
    // Format FEN: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
    // Le 5ème champ (avant-dernier) est le compteur de half-moves
    const fenParts = chess.fen().split(' ');
    if (fenParts.length >= 5) {
      const halfMoveClock = parseInt(fenParts[4], 10);
      if (halfMoveClock >= 50) {
        return {
          reason: GameEndReason.FIFTY_MOVE_RULE,
        };
      }
    }

    // Vérifier isDraw() pour d'autres cas de nulle
    // Note: isDraw() peut retourner true pour plusieurs raisons déjà vérifiées ci-dessus
    // On l'utilise comme filet de sécurité
    if (chess.isDraw() && !chess.isStalemate() && !chess.isInsufficientMaterial() && !chess.isThreefoldRepetition()) {
      // Si on arrive ici, c'est un autre type de nulle non spécifique
      // On retourne null car tous les cas spécifiques ont été vérifiés
      // (isDraw() peut être vrai pour des raisons que nous ne gérons pas explicitement)
    }

    // Pas de fin de partie
    return null;
  }

  /**
   * Initialise une nouvelle partie depuis une position FEN
   *
   * @param fen - Position FEN (optionnel, par défaut position de départ)
   * @returns Instance Chess.js initialisée
   */
  initializeGame(fen?: string): Chess {
    return new Chess(fen);
  }

  /**
   * Récupère tous les coups légaux pour la position actuelle
   *
   * @param fen - Position FEN (optionnel, par défaut position de départ)
   * @returns Liste des coups légaux au format { from, to, promotion? }
   */
  getLegalMoves(fen?: string): Array<{ from: string; to: string; promotion?: string }> {
    const chess = new Chess(fen);
    return chess.moves({ verbose: true }).map((move) => ({
      from: move.from,
      to: move.to,
      promotion: move.promotion,
    }));
  }

  /**
   * Vérifie si un coup est légal sans l'appliquer
   *
   * @param fen - Position FEN (optionnel, par défaut position de départ)
   * @param moveInput - Coup à vérifier
   * @returns true si le coup est légal, false sinon
   */
  isLegalMove(fen: string | null, moveInput: ChessMoveInput): boolean {
    try {
      const chess = new Chess(fen || undefined);
      const move = {
        from: moveInput.from,
        to: moveInput.to,
        promotion: moveInput.promotion || undefined,
      };
      return chess.move(move) !== null;
    } catch {
      return false;
    }
  }
}
