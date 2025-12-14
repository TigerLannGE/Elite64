import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  Match,
  MatchStatus,
  MatchResult,
  MatchColor,
  TournamentStatus,
  TournamentEntryStatus,
} from '@prisma/client';
import { Chess } from 'chess.js';
import { ReportMatchResultDto } from './dto/report-match-result.dto';
import { PlayMoveDto } from './dto/play-move.dto';
import { MatchStateViewDto } from './dto/match-state-view.dto';
import { TournamentsService } from '../tournaments/tournaments.service';
import { ChessEngineService } from './chess-engine.service';
import { GameEndReason } from './types/chess-engine.types';

@Injectable()
export class MatchesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => TournamentsService))
    private readonly tournamentsService: TournamentsService,
    private readonly chessEngineService: ChessEngineService,
  ) {}

  /**
   * Génère les matches du premier tour pour un tournoi donné
   */
  async generateInitialMatchesForTournament(
    tournamentId: string,
  ): Promise<Match[]> {
    // 1. Charger le tournoi + vérifier que status = READY
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        entries: {
          where: {
            status: TournamentEntryStatus.CONFIRMED,
          },
          include: {
            player: {
              select: {
                id: true,
                isActive: true,
                blockTournaments: true,
                elo: true,
              },
            },
          },
        },
      },
    });

    if (!tournament) {
      throw new NotFoundException(
        `Tournoi avec l'ID "${tournamentId}" introuvable`,
      );
    }

    if (tournament.status !== TournamentStatus.READY) {
      throw new BadRequestException(
        `Le tournoi doit être en statut READY pour générer les matches (statut actuel: ${tournament.status})`,
      );
    }

    // Vérifier qu'il n'y a pas déjà des matches pour ce tournoi
    const existingMatches = await this.prisma.match.findFirst({
      where: { tournamentId },
    });

    if (existingMatches) {
      throw new BadRequestException(
        'Des matches ont déjà été générés pour ce tournoi',
      );
    }

    // 2. Filtrer les entrées actives (pas suspendus / pas restreints tournois)
    const activeEntries = tournament.entries.filter(
      (entry) =>
        entry.player.isActive && !entry.player.blockTournaments,
    );

    if (activeEntries.length < 2) {
      throw new BadRequestException(
        'Il faut au moins 2 joueurs actifs pour générer des matches',
      );
    }

    // 3. Ordonner les entrées (par ELO si disponible, sinon par createdAt)
    const sortedEntries = activeEntries.sort((a, b) => {
      // Les données du joueur sont déjà incluses dans entry.player
      const eloA = a.player.elo || 0;
      const eloB = b.player.elo || 0;

      // Trier par ELO décroissant (meilleurs joueurs en premier)
      // Si ELO égal, trier par createdAt
      if (eloA !== eloB) {
        return eloB - eloA;
      }
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    // 4. Générer des paires 1v1 : (0 vs 1), (2 vs 3), ...
    const matches: Match[] = [];
    const isOdd = sortedEntries.length % 2 === 1;

    // Si nombre impair, la dernière entrée aura un BYE
    const entriesToPair = isOdd
      ? sortedEntries.slice(0, -1)
      : sortedEntries;

    let boardNumber = 1;

    // Créer les matches normaux
    for (let i = 0; i < entriesToPair.length; i += 2) {
      const whiteEntry = entriesToPair[i];
      const blackEntry = entriesToPair[i + 1];

      const match = await this.prisma.match.create({
        data: {
          tournamentId,
          roundNumber: 1,
          boardNumber,
          whiteEntryId: whiteEntry.id,
          blackEntryId: blackEntry.id,
          status: MatchStatus.PENDING,
        },
      });

      matches.push(match);
      boardNumber++;
    }

    // Si nombre impair, créer un match BYE pour la dernière entrée
    if (isOdd) {
      const byeEntry = sortedEntries[sortedEntries.length - 1];
      
      const byeMatch = await this.prisma.match.create({
        data: {
          tournamentId,
          roundNumber: 1,
          boardNumber,
          whiteEntryId: byeEntry.id,
          blackEntryId: byeEntry.id, // Même entrée pour white et black (BYE)
          status: MatchStatus.FINISHED,
          result: MatchResult.BYE,
          resultReason: 'BYE - nombre impair de joueurs',
          finishedAt: new Date(),
        },
      });

      matches.push(byeMatch);
    }

    // 5. Mettre à jour le statut du tournoi en RUNNING
    await this.prisma.tournament.update({
      where: { id: tournamentId },
      data: { status: TournamentStatus.RUNNING },
    });

    return matches;
  }

  /**
   * Liste les matches d'un tournoi (option pour filtrer par joueur)
   */
  async listMatchesForTournament(
    tournamentId: string,
    playerId?: string,
  ): Promise<Match[]> {
    // Vérifier que le tournoi existe
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      throw new NotFoundException(
        `Tournoi avec l'ID "${tournamentId}" introuvable`,
      );
    }

    // Si playerId fourni : ne retourner que les matches où l'entrée correspond au joueur
    if (playerId) {
      return this.prisma.match.findMany({
        where: {
          tournamentId,
          OR: [
            {
              whiteEntry: {
                playerId,
              },
            },
            {
              blackEntry: {
                playerId,
              },
            },
          ],
        },
        include: {
          whiteEntry: {
            include: {
              player: {
                select: {
                  id: true,
                  username: true,
                  elo: true,
                },
              },
            },
          },
          blackEntry: {
            include: {
              player: {
                select: {
                  id: true,
                  username: true,
                  elo: true,
                },
              },
            },
          },
          tournament: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
        },
        orderBy: [
          { roundNumber: 'asc' },
          { boardNumber: 'asc' },
        ],
      });
    }

    // Sinon : retourner tous les matches du tournoi
    return this.prisma.match.findMany({
      where: { tournamentId },
      include: {
        whiteEntry: {
          include: {
            player: {
              select: {
                id: true,
                username: true,
                elo: true,
              },
            },
          },
        },
        blackEntry: {
          include: {
            player: {
              select: {
                id: true,
                username: true,
                elo: true,
              },
            },
          },
        },
        tournament: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
      orderBy: [
        { roundNumber: 'asc' },
        { boardNumber: 'asc' },
      ],
    });
  }

  /**
   * Récupère un match par id
   */
  async getMatchById(matchId: string): Promise<Match> {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        whiteEntry: {
          include: {
            player: {
              select: {
                id: true,
                username: true,
                elo: true,
              },
            },
          },
        },
        blackEntry: {
          include: {
            player: {
              select: {
                id: true,
                username: true,
                elo: true,
              },
            },
          },
        },
        tournament: {
          select: {
            id: true,
            name: true,
            status: true,
            timeControl: true,
          },
        },
      },
    });

    if (!match) {
      throw new NotFoundException(
        `Match avec l'ID "${matchId}" introuvable`,
      );
    }

    return match as any; // Type assertion pour inclure les relations
  }

  /**
   * Enregistrer le résultat d'un match (admin-only pour l'instant)
   */
  async reportResult(
    matchId: string,
    dto: ReportMatchResultDto,
  ): Promise<Match> {
    // 1. Vérifier que le match existe
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        whiteEntry: true,
        blackEntry: true,
        tournament: true,
      },
    });

    if (!match) {
      throw new NotFoundException(
        `Match avec l'ID "${matchId}" introuvable`,
      );
    }

    // Vérifier que le match n'est pas déjà FINISHED / CANCELED
    if (match.status === MatchStatus.FINISHED) {
      throw new BadRequestException('Ce match est déjà terminé');
    }

    if (match.status === MatchStatus.CANCELED) {
      throw new BadRequestException('Ce match a été annulé');
    }

    // 2. Vérifier la cohérence entre result et winnerEntryId
    if (dto.result === MatchResult.WHITE_WIN) {
      if (dto.winnerEntryId && dto.winnerEntryId !== match.whiteEntryId) {
        throw new BadRequestException(
          'winnerEntryId doit correspondre à whiteEntryId pour WHITE_WIN',
        );
      }
    } else if (dto.result === MatchResult.BLACK_WIN) {
      if (dto.winnerEntryId && dto.winnerEntryId !== match.blackEntryId) {
        throw new BadRequestException(
          'winnerEntryId doit correspondre à blackEntryId pour BLACK_WIN',
        );
      }
    } else if (dto.result === MatchResult.BYE) {
      // Pour BYE, winnerEntryId doit être white ou black entry
      if (
        dto.winnerEntryId &&
        dto.winnerEntryId !== match.whiteEntryId &&
        dto.winnerEntryId !== match.blackEntryId
      ) {
        throw new BadRequestException(
          'winnerEntryId doit correspondre à whiteEntryId ou blackEntryId pour BYE',
        );
      }
    }

    // 3. Mettre à jour le match
    const updatedMatch = await this.prisma.match.update({
      where: { id: matchId },
      data: {
        status: MatchStatus.FINISHED,
        result: dto.result,
        resultReason: dto.resultReason || null,
        finishedAt: new Date(),
        startedAt: match.startedAt || new Date(), // Si pas encore démarré, le démarrer maintenant
      },
      include: {
        whiteEntry: {
          include: {
            player: {
              select: {
                id: true,
                username: true,
                elo: true,
              },
            },
          },
        },
        blackEntry: {
          include: {
            player: {
              select: {
                id: true,
                username: true,
                elo: true,
              },
            },
          },
        },
        tournament: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    // 4. Vérifier si tous les matches de la ronde sont terminés
    //    - Si ce n'est pas la dernière ronde : générer la prochaine ronde
    //    - Si c'est la dernière ronde : déclencher la finalisation du tournoi (classement + payouts)
    await this.generateNextRoundIfNeeded(match.tournamentId);

    return updatedMatch as any;
  }

  /**
   * Génère la ronde suivante si tous les matches de la ronde actuelle sont terminés
   */
  async generateNextRoundIfNeeded(tournamentId: string): Promise<void> {
    // 1. Récupérer toutes les rounds existantes du tournoi, trouver la ronde max
    const allMatches = await this.prisma.match.findMany({
      where: { tournamentId },
      orderBy: { roundNumber: 'desc' },
    });

    if (allMatches.length === 0) {
      return; // Pas de matches, rien à faire
    }

    const maxRoundNumber = allMatches[0].roundNumber;

    // 2. Vérifier si tous les matches de cette ronde sont FINISHED
    const currentRoundMatches = allMatches.filter(
      (m) => m.roundNumber === maxRoundNumber,
    );

    const allFinished = currentRoundMatches.every(
      (m) => m.status === MatchStatus.FINISHED,
    );

    if (!allFinished) {
      return; // Pas tous terminés, on attend
    }

    // 3. Construire la liste des winners de la ronde
    const winners: string[] = []; // Array de entryIds

    for (const match of currentRoundMatches) {
      if (match.result === MatchResult.WHITE_WIN) {
        winners.push(match.whiteEntryId);
      } else if (match.result === MatchResult.BLACK_WIN) {
        winners.push(match.blackEntryId);
      } else if (match.result === MatchResult.BYE) {
        // Pour BYE, le winner est celui qui a le BYE (white ou black, peu importe)
        winners.push(match.whiteEntryId);
      } else if (match.result === MatchResult.DRAW) {
        // En cas de match nul, les deux joueurs avancent (pour un bracket simple)
        winners.push(match.whiteEntryId);
        winners.push(match.blackEntryId);
      }
    }

    // 4. Si la liste des winners a plus d'un joueur: créer une nouvelle ronde
    if (winners.length > 1) {
      const nextRoundNumber = maxRoundNumber + 1;
      let boardNumber = 1;
      const isOdd = winners.length % 2 === 1;

      // Si nombre impair, la dernière entrée aura un BYE
      const entriesToPair = isOdd ? winners.slice(0, -1) : winners;

      // Créer les matches normaux
      for (let i = 0; i < entriesToPair.length; i += 2) {
        await this.prisma.match.create({
          data: {
            tournamentId,
            roundNumber: nextRoundNumber,
            boardNumber,
            whiteEntryId: entriesToPair[i],
            blackEntryId: entriesToPair[i + 1],
            status: MatchStatus.PENDING,
          },
        });
        boardNumber++;
      }

      // Si nombre impair, créer un match BYE pour la dernière entrée
      if (isOdd) {
        const byeEntryId = winners[winners.length - 1];
        await this.prisma.match.create({
          data: {
            tournamentId,
            roundNumber: nextRoundNumber,
            boardNumber,
            whiteEntryId: byeEntryId,
            blackEntryId: byeEntryId, // Même entrée pour white et black (BYE)
            status: MatchStatus.FINISHED,
            result: MatchResult.BYE,
            resultReason: 'BYE - nombre impair de joueurs',
            finishedAt: new Date(),
          },
        });
      }
    } else if (winners.length === 1) {
      // 5. Si la liste des winners n'a qu'un seul joueur: c'est le vainqueur du tournoi
      //    → appeler la finalisation du tournoi
      await this.tournamentsService.finalizeTournamentAndPayouts(
        tournamentId,
      );
    }
  }

  /**
   * Phase 6.0.C - Rejoindre un match
   * Marque la présence et initialise la partie quand les deux joueurs ont rejoint
   */
  async joinMatch(
    matchId: string,
    playerId: string,
  ): Promise<MatchStateViewDto> {
    // 1. Charger le match avec les entrées
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        whiteEntry: {
          include: {
            player: {
              select: {
                id: true,
              },
            },
          },
        },
        blackEntry: {
          include: {
            player: {
              select: {
                id: true,
              },
            },
          },
        },
        tournament: {
          select: {
            id: true,
            timeControl: true,
          },
        },
      },
    });

    if (!match) {
      throw new NotFoundException(
        `Match avec l'ID "${matchId}" introuvable`,
      );
    }

    // 2. Vérifier que le joueur est dans le match
    const whitePlayerId = match.whiteEntry.playerId;
    const blackPlayerId = match.blackEntry.playerId;

    if (playerId !== whitePlayerId && playerId !== blackPlayerId) {
      throw new ForbiddenException({
        code: 'PLAYER_NOT_IN_MATCH',
        message: 'Vous n\'êtes pas un participant de ce match',
      });
    }

    // 3. Vérifier que le match peut être rejoint
    if (
      match.status === MatchStatus.FINISHED ||
      match.status === MatchStatus.CANCELED
    ) {
      throw new BadRequestException({
        code: 'MATCH_NOT_JOINABLE',
        message: 'Ce match ne peut plus être rejoint',
      });
    }

    const now = new Date();
    const isWhite = playerId === whitePlayerId;

    // 4. Mettre à jour les timestamps de présence
    const updateData: any = {};

    if (!match.readyAt) {
      updateData.readyAt = now;
    }

    if (isWhite && !match.whiteJoinedAt) {
      updateData.whiteJoinedAt = now;
    } else if (!isWhite && !match.blackJoinedAt) {
      updateData.blackJoinedAt = now;
    }

    // 5. Si les deux joueurs ont rejoint et le match est PENDING, initialiser la partie
    const bothJoined =
      (match.whiteJoinedAt || updateData.whiteJoinedAt) &&
      (match.blackJoinedAt || updateData.blackJoinedAt);

    if (bothJoined && match.status === MatchStatus.PENDING) {
      // Initialiser la partie
      const startFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

      // Parser timeControl (ex: "10+0" => baseMinutes=10, incrementSeconds=0)
      const timeControlMatch = match.tournament.timeControl.match(
        /^(\d+)\+(\d+)$/,
      );
      if (!timeControlMatch) {
        throw new BadRequestException(
          `Format de time control invalide: ${match.tournament.timeControl}`,
        );
      }

      const baseMinutes = parseInt(timeControlMatch[1], 10);
      const timeMs = baseMinutes * 60 * 1000;

      updateData.status = MatchStatus.RUNNING;
      updateData.startedAt = now;
      updateData.initialFen = startFen;
      updateData.currentFen = startFen;
      updateData.lastMoveAt = now;
      updateData.whiteTimeMsRemaining = timeMs;
      updateData.blackTimeMsRemaining = timeMs;
    }

    // 6. Mettre à jour le match
    const updatedMatch = await this.prisma.match.update({
      where: { id: matchId },
      data: updateData,
      include: {
        whiteEntry: {
          include: {
            player: {
              select: {
                id: true,
              },
            },
          },
        },
        blackEntry: {
          include: {
            player: {
              select: {
                id: true,
              },
            },
          },
        },
        moves: {
          orderBy: {
            moveNumber: 'desc',
          },
          take: 1,
        },
        tournament: {
          select: {
            id: true,
            timeControl: true,
          },
        },
      },
    });

    // 7. Construire et retourner MatchStateViewDto
    return this.buildMatchStateViewDto(updatedMatch);
  }

  /**
   * Phase 6.0.C - Récupérer l'état d'un match
   */
  async getMatchState(
    matchId: string,
    playerId: string,
  ): Promise<MatchStateViewDto> {
    // 1. Charger le match
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        whiteEntry: {
          include: {
            player: {
              select: {
                id: true,
              },
            },
          },
        },
        blackEntry: {
          include: {
            player: {
              select: {
                id: true,
              },
            },
          },
        },
        moves: {
          orderBy: {
            moveNumber: 'desc',
          },
          take: 1,
        },
        tournament: {
          select: {
            id: true,
            timeControl: true,
          },
        },
      },
    });

    if (!match) {
      throw new NotFoundException(
        `Match avec l'ID "${matchId}" introuvable`,
      );
    }

    // 2. Vérifier que le joueur est dans le match
    const whitePlayerId = match.whiteEntry.playerId;
    const blackPlayerId = match.blackEntry.playerId;

    if (playerId !== whitePlayerId && playerId !== blackPlayerId) {
      throw new ForbiddenException({
        code: 'PLAYER_NOT_IN_MATCH',
        message: 'Vous n\'êtes pas un participant de ce match',
      });
    }

    // 3. Construire et retourner MatchStateViewDto
    return this.buildMatchStateViewDto(match);
  }

  /**
   * Phase 6.0.C - Jouer un coup
   * Transaction atomique pour valider, appliquer et persister le coup
   */
  async playMove(
    matchId: string,
    playerId: string,
    dto: PlayMoveDto,
  ): Promise<MatchStateViewDto> {
    return await this.prisma.$transaction(async (tx) => {
      // 1. Charger le match avec verrouillage (pour éviter les conditions de course)
      const match = await tx.match.findUnique({
        where: { id: matchId },
        include: {
          whiteEntry: {
            include: {
              player: {
                select: {
                  id: true,
                },
              },
            },
          },
          blackEntry: {
            include: {
              player: {
                select: {
                  id: true,
                },
              },
            },
          },
          tournament: {
            select: {
              id: true,
              timeControl: true,
            },
          },
          moves: {
            orderBy: {
              moveNumber: 'desc',
            },
          },
        },
      });

      if (!match) {
        throw new NotFoundException(
          `Match avec l'ID "${matchId}" introuvable`,
        );
      }

      // 2. Vérifier que le joueur est dans le match
      const whitePlayerId = match.whiteEntry.playerId;
      const blackPlayerId = match.blackEntry.playerId;

      if (playerId !== whitePlayerId && playerId !== blackPlayerId) {
        throw new ForbiddenException({
          code: 'PLAYER_NOT_IN_MATCH',
          message: 'Vous n\'êtes pas un participant de ce match',
        });
      }

      // 3. Vérifier que le match est RUNNING
      if (match.status !== MatchStatus.RUNNING) {
        throw new BadRequestException({
          code: 'MATCH_NOT_RUNNING',
          message: 'Ce match n\'est pas en cours',
        });
      }

      // 4. Déterminer la couleur du joueur
      const playerColor =
        playerId === whitePlayerId ? MatchColor.WHITE : MatchColor.BLACK;

      // 5. Déterminer le trait actuel
      const currentFen = match.currentFen || match.initialFen;
      if (!currentFen) {
        throw new BadRequestException(
          'Position FEN introuvable pour ce match',
        );
      }

      const chess = this.chessEngineService.initializeGame(currentFen);
      const currentTurn = chess.turn() === 'w' ? MatchColor.WHITE : MatchColor.BLACK;

      // 6. Vérifier que c'est au joueur de jouer
      if (currentTurn !== playerColor) {
        throw new BadRequestException({
          code: 'NOT_YOUR_TURN',
          message: 'Ce n\'est pas votre tour de jouer',
        });
      }

      // 7. Calculer le temps écoulé et décrémenter le pendule
      const now = new Date();
      const lastMoveAt = match.lastMoveAt || match.startedAt || now;
      const elapsedMs = Math.max(0, now.getTime() - lastMoveAt.getTime());

      let whiteTimeMs = match.whiteTimeMsRemaining ?? 0;
      let blackTimeMs = match.blackTimeMsRemaining ?? 0;

      // Décrémenter le temps du joueur qui joue
      if (playerColor === MatchColor.WHITE) {
        whiteTimeMs = Math.max(0, whiteTimeMs - elapsedMs);
      } else {
        blackTimeMs = Math.max(0, blackTimeMs - elapsedMs);
      }

      // 8. Vérifier timeout avant d'appliquer le coup
      if (
        (playerColor === MatchColor.WHITE && whiteTimeMs <= 0) ||
        (playerColor === MatchColor.BLACK && blackTimeMs <= 0)
      ) {
        // Timeout : terminer le match
        const winnerColor =
          playerColor === MatchColor.WHITE ? MatchColor.BLACK : MatchColor.WHITE;
        const winnerEntryId =
          winnerColor === MatchColor.WHITE
            ? match.whiteEntryId
            : match.blackEntryId;
        const result =
          winnerColor === MatchColor.WHITE
            ? MatchResult.WHITE_WIN
            : MatchResult.BLACK_WIN;

        const finishedMatch = await tx.match.update({
          where: { id: matchId },
          data: {
            status: MatchStatus.FINISHED,
            result,
            resultReason: 'TIMEOUT',
            finishedAt: now,
            whiteTimeMsRemaining: whiteTimeMs,
            blackTimeMsRemaining: blackTimeMs,
          },
          include: {
            whiteEntry: {
              include: {
                player: {
                  select: {
                    id: true,
                  },
                },
              },
            },
            blackEntry: {
              include: {
                player: {
                  select: {
                    id: true,
                  },
                },
              },
            },
            moves: {
              orderBy: {
                moveNumber: 'desc',
              },
              take: 1,
            },
            tournament: {
              select: {
                id: true,
                timeControl: true,
              },
            },
          },
        });

        // Appeler generateNextRoundIfNeeded après la transaction
        setImmediate(() => {
          this.generateNextRoundIfNeeded(match.tournamentId).catch((err) => {
            console.error(
              'Erreur lors de la génération de la ronde suivante:',
              err,
            );
          });
        });

        return this.buildMatchStateViewDto(finishedMatch);
      }

      // 9. Valider et appliquer le coup via ChessEngineService
      const moveResult = this.chessEngineService.validateAndApplyMove(
        currentFen,
        {
          from: dto.from,
          to: dto.to,
          promotion: dto.promotion,
        },
      );

      if (!moveResult.success) {
        throw new BadRequestException({
          code: 'ILLEGAL_MOVE',
          message: moveResult.error || 'Ce coup est illégal',
        });
      }

      // 10. Compter les coups existants
      const moveCount = match.moves.length;
      const nextMoveNumber = moveCount + 1;

      // 11. Créer le MatchMove
      await tx.matchMove.create({
        data: {
          matchId,
          moveNumber: nextMoveNumber,
          playerId,
          color: playerColor,
          san: moveResult.san,
          from: dto.from,
          to: dto.to,
          promotion: dto.promotion || null,
          fenBefore: moveResult.fenBefore,
          fenAfter: moveResult.fenAfter,
          whiteTimeMsRemaining: whiteTimeMs,
          blackTimeMsRemaining: blackTimeMs,
        },
      });

      // 12. Vérifier si la partie est terminée
      let updateData: any = {
        currentFen: moveResult.fenAfter,
        lastMoveAt: now,
        whiteTimeMsRemaining: whiteTimeMs,
        blackTimeMsRemaining: blackTimeMs,
      };

      if (moveResult.gameEnd) {
        // Mapper GameEndReason vers MatchResult et resultReason
        let result: MatchResult | null = null;
        let resultReason: string | null = null;

        switch (moveResult.gameEnd.reason) {
          case GameEndReason.CHECKMATE:
            result =
              moveResult.gameEnd.winner === 'white'
                ? MatchResult.WHITE_WIN
                : MatchResult.BLACK_WIN;
            resultReason = 'CHECKMATE';
            break;
          case GameEndReason.STALEMATE:
            result = MatchResult.DRAW;
            resultReason = 'STALEMATE';
            break;
          case GameEndReason.INSUFFICIENT_MATERIAL:
            result = MatchResult.DRAW;
            resultReason = 'INSUFFICIENT_MATERIAL';
            break;
          case GameEndReason.FIFTY_MOVE_RULE:
            result = MatchResult.DRAW;
            resultReason = 'FIFTY_MOVE_RULE';
            break;
          case GameEndReason.THREE_FOLD_REPETITION:
            result = MatchResult.DRAW;
            resultReason = 'THREE_FOLD_REPETITION';
            break;
        }

        if (result) {
          updateData.status = MatchStatus.FINISHED;
          updateData.result = result;
          updateData.resultReason = resultReason;
          updateData.finishedAt = now;
        }
      }

      // 13. Mettre à jour le match
      const updatedMatch = await tx.match.update({
        where: { id: matchId },
        data: updateData,
        include: {
          whiteEntry: {
            include: {
              player: {
                select: {
                  id: true,
                },
              },
            },
          },
          blackEntry: {
            include: {
              player: {
                select: {
                  id: true,
                },
              },
            },
          },
          moves: {
            orderBy: {
              moveNumber: 'desc',
            },
            take: 1,
          },
          tournament: {
            select: {
              id: true,
              timeControl: true,
            },
          },
        },
      });

      // 14. Si la partie est terminée, appeler generateNextRoundIfNeeded après la transaction
      if (updateData.status === MatchStatus.FINISHED) {
        setImmediate(() => {
          this.generateNextRoundIfNeeded(match.tournamentId).catch((err) => {
            console.error(
              'Erreur lors de la génération de la ronde suivante:',
              err,
            );
          });
        });
      }

      // 15. Retourner l'état du match
      return this.buildMatchStateViewDto(updatedMatch);
    });
  }

  /**
   * Phase 6.0.C - Construire MatchStateViewDto depuis un match
   */
  private buildMatchStateViewDto(match: any): MatchStateViewDto {
    const whitePlayerId = match.whiteEntry.playerId;
    const blackPlayerId = match.blackEntry.playerId;

    // Déterminer le FEN actuel
    const fen = match.currentFen || match.initialFen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

    // Compter les coups
    const moveCount = match.moves?.length || 0;

    // Déterminer le trait depuis le FEN
    const chess = this.chessEngineService.initializeGame(fen);
    const turn = chess.turn() === 'w' ? MatchColor.WHITE : MatchColor.BLACK;

    // Dernier coup
    const lastMove = match.moves && match.moves.length > 0
      ? {
          san: match.moves[0].san,
          from: match.moves[0].from,
          to: match.moves[0].to,
          promotion: match.moves[0].promotion || null,
        }
      : null;

    return {
      matchId: match.id,
      tournamentId: match.tournamentId,
      status: match.status,
      result: match.result || null,
      resultReason: match.resultReason || null,
      whitePlayerId,
      blackPlayerId,
      fen,
      moveNumber: moveCount,
      turn,
      whiteTimeMsRemaining: match.whiteTimeMsRemaining ?? 0,
      blackTimeMsRemaining: match.blackTimeMsRemaining ?? 0,
      lastMove,
      serverTimeUtc: new Date().toISOString(),
    };
  }
}

