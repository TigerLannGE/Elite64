import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  Match,
  MatchStatus,
  MatchResult,
  MatchColor,
  TournamentStatus,
  TournamentEntryStatus,
  TieBreakPolicy,
  Prisma,
} from '@prisma/client';
import { Chess } from 'chess.js';
import { ReportMatchResultDto } from './dto/report-match-result.dto';
import { PlayMoveDto } from './dto/play-move.dto';
import { MatchStateViewDto } from './dto/match-state-view.dto';
import { TournamentsService } from '../tournaments/tournaments.service';
import { ChessEngineService } from './chess-engine.service';
import { GameEndReason } from './types/chess-engine.types';
import {
  JOIN_WINDOW_SECONDS,
  NO_SHOW_GRACE_SECONDS,
  TOTAL_NO_SHOW_MS,
} from './match.config';
import { RESULT_REASON_TIEBREAK_PENDING } from './match.constants';

@Injectable()
export class MatchesService {
  private readonly logger = new Logger(MatchesService.name);

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
   * Résout éventuellement un no-show pré-premier coup pour un match donné.
   *
   * - Ne fait rien si le match n'est pas PENDING, si readyAt est null,
   *   si noShowResolvedAt est déjà renseigné, ou si le délai (JOIN_WINDOW_SECONDS
   *   + NO_SHOW_GRACE_SECONDS) n'est pas encore écoulé.
   * - Si aucun joueur n'a rejoint → DOUBLE_NO_SHOW (DRAW).
   * - Si un seul joueur a rejoint → NO_SHOW, l'autre perd par forfait.
   *
   * Retourne true si une résolution a été appliquée, false sinon.
   */
  private async maybeResolveNoShow(matchId: string): Promise<boolean> {
    const result = await this.prisma.$transaction(async (tx) => {
      const match = await tx.match.findUnique({
        where: { id: matchId },
        include: {
          whiteEntry: true,
          blackEntry: true,
        },
      });

      if (
        !match ||
        match.status !== MatchStatus.PENDING ||
        !match.readyAt ||
        match.noShowResolvedAt
      ) {
        return { resolved: false, tournamentId: null as string | null };
      }

      const now = new Date();
      const deadline = new Date(match.readyAt.getTime() + TOTAL_NO_SHOW_MS);

      if (now < deadline) {
        return { resolved: false, tournamentId: null as string | null };
      }

      const whiteJoined = !!match.whiteJoinedAt;
      const blackJoined = !!match.blackJoinedAt;
      const joinedCount = (whiteJoined ? 1 : 0) + (blackJoined ? 1 : 0);

      // Deux joueurs présents : pas de no-show à résoudre
      if (joinedCount === 2) {
        return { resolved: false, tournamentId: null as string | null };
      }

      let data: any = {
        status: MatchStatus.FINISHED,
        noShowResolvedAt: now,
        finishedAt: now,
      };

      if (joinedCount === 0) {
        // DOUBLE_NO_SHOW → match nul
        data.result = MatchResult.DRAW;
        data.resultReason = 'DOUBLE_NO_SHOW';
      } else {
        // Un seul joueur présent → victoire par no-show
        const winnerIsWhite = whiteJoined && !blackJoined;
        data.result = winnerIsWhite
          ? MatchResult.WHITE_WIN
          : MatchResult.BLACK_WIN;
        data.resultReason = 'NO_SHOW';
      }

      await tx.match.update({
        where: { id: matchId },
        data,
      });

      return { resolved: true, tournamentId: match.tournamentId as string };
    });

    if (result.resolved && result.tournamentId) {
      await this.generateNextRoundIfNeeded(result.tournamentId);
      return true;
    }

    return false;
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

    // 3. Phase 6.0.D.3 - Si DRAW, vérifier si tie-break nécessaire
    let resultReason: string | null = dto.resultReason || null;
    if (dto.result === MatchResult.DRAW) {
      const tournament = await this.prisma.tournament.findUnique({
        where: { id: match.tournamentId },
        select: { tieBreakPolicy: true },
      });

      if (tournament && tournament.tieBreakPolicy !== TieBreakPolicy.NONE) {
        // Marquage explicite : DRAW avec tie-break pending
        resultReason = RESULT_REASON_TIEBREAK_PENDING;
      }
      // Sinon, utiliser dto.resultReason (ou null)
    }

    // 4. Mettre à jour le match
    const updatedMatch = await this.prisma.match.update({
      where: { id: matchId },
      data: {
        status: MatchStatus.FINISHED,
        result: dto.result,
        resultReason,
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

    // 5. Phase 6.0.D.3 - Si DRAW avec tie-break pending, créer les tie-breaks APRÈS commit (post-transaction)
    // ⚠️ Utiliser matchId (parent) et non activeMatchId (peut être un tie-break)
    const isDrawWithTieBreak =
      dto.result === MatchResult.DRAW &&
      resultReason === RESULT_REASON_TIEBREAK_PENDING;
    
    if (isDrawWithTieBreak) {
      try {
        await this.createTieBreakMatches(matchId);
      } catch (err) {
        this.logger.error(
          `[reportResult] Erreur lors de la création des tie-breaks pour parent ${matchId}:`,
          err,
        );
        // On ne propage pas l'erreur pour ne pas faire échouer le report qui a réussi
      }
    }

    // 6. Phase 6.0.D.4 - Si le match est un tie-break terminé, résoudre le tie-break
    const matchForTieBreak = await this.prisma.match.findUnique({
      where: { id: matchId },
      select: { isTieBreak: true, parentMatchId: true },
    });

    if (matchForTieBreak?.isTieBreak && matchForTieBreak.parentMatchId) {
      try {
        await this.resolveTieBreak(matchForTieBreak.parentMatchId);
      } catch (err) {
        this.logger.error(
          `[reportResult] Erreur lors de la résolution du tie-break pour parent ${matchForTieBreak.parentMatchId}:`,
          err,
        );
        // On ne propage pas l'erreur
      }
    }

    // 7. Vérifier si tous les matches de la ronde sont terminés
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
      include: {
        tournament: {
          select: { tieBreakPolicy: true }
        }
      },
      orderBy: { roundNumber: 'desc' },
    });

    if (allMatches.length === 0) {
      return; // Pas de matches, rien à faire
    }

    const maxRoundNumber = allMatches[0].roundNumber;

    // 2. Filtrer les matchs tie-break (ils ne comptent pas pour la progression)
    const currentRoundMatches = allMatches.filter(
      (m) => m.roundNumber === maxRoundNumber && !m.isTieBreak
    );

    // 3. Vérifier si tous les matches de cette ronde sont FINISHED
    const allFinished = currentRoundMatches.every(
      (m) => m.status === MatchStatus.FINISHED,
    );

    if (!allFinished) {
      return; // Pas tous terminés, on attend
    }

    // 4. ⭐ DÉCISION B3 - Vérifier qu'aucun match DRAW n'a de tie-break pending
    // Règle simple : si un parent est DRAW + TIEBREAK_PENDING → return immédiatement
    for (const match of currentRoundMatches) {
      if (
        match.result === MatchResult.DRAW &&
        match.resultReason === RESULT_REASON_TIEBREAK_PENDING &&
        match.tournament.tieBreakPolicy !== TieBreakPolicy.NONE
      ) {
        // ⭐ Return immédiatement sans inspecter les tie-breaks (respect strict B3)
        return;
      }
    }

    // 5. Construire la liste des winners de la ronde
    // ⭐ Pas de relecture dans la boucle : on utilise les données déjà chargées
    const winners: string[] = [];

    for (const match of currentRoundMatches) {
      if (match.result === MatchResult.WHITE_WIN) {
        winners.push(match.whiteEntryId);
      } else if (match.result === MatchResult.BLACK_WIN) {
        winners.push(match.blackEntryId);
      } else if (match.result === MatchResult.BYE) {
        winners.push(match.whiteEntryId);
      } else if (match.result === MatchResult.DRAW) {
        // Si DRAW avec tie-break pending, on a déjà vérifié plus haut → skip
        if (
          match.resultReason === RESULT_REASON_TIEBREAK_PENDING &&
          match.tournament.tieBreakPolicy !== TieBreakPolicy.NONE
        ) {
          // Ne pas ajouter de winner (déjà géré par le return plus haut)
          continue;
        }
        
        // DRAW sans tie-break : comportement Phase 5 (les deux avancent)
        winners.push(match.whiteEntryId);
        winners.push(match.blackEntryId);
      }
    }

    // 6. Si la liste des winners a plus d'un joueur: créer une nouvelle ronde
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
      // 7. Si la liste des winners n'a qu'un seul joueur: c'est le vainqueur du tournoi
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
    // Phase 6.0.D.4 - Redirection vers tie-break actif si nécessaire
    const activeMatchId = await this.getActivePlayableMatchId(matchId, playerId);

    // Résoudre éventuellement un no-show avant toute autre logique
    await this.maybeResolveNoShow(activeMatchId);
    
    // 1. Charger le match avec les entrées (utiliser activeMatchId)
    const match = await this.prisma.match.findUnique({
      where: { id: activeMatchId },
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
    // Phase 6.0.D.4 - Redirection vers tie-break actif si nécessaire
    const activeMatchId = await this.getActivePlayableMatchId(matchId, playerId);

    // Résoudre éventuellement un no-show avant de retourner l'état
    await this.maybeResolveNoShow(activeMatchId);
    
    // 1. Charger le match (utiliser activeMatchId)
    const match = await this.prisma.match.findUnique({
      where: { id: activeMatchId },
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
    // Phase 6.0.D.4 - Redirection vers tie-break actif si nécessaire (avant la transaction)
    const activeMatchId = await this.getActivePlayableMatchId(matchId, playerId);

    // Sécurité : tenter de résoudre un éventuel no-show avant d'autoriser un coup
    await this.maybeResolveNoShow(activeMatchId);
    
    let wasMatchFinished = false;
    let tournamentId: string;
    let originalMatchIdForTieBreak: string | null = null; // ID du parent si DRAW avec tie-break ou tie-break terminé
    let isDrawWithTieBreak = false;
    
    const stateView = await this.prisma.$transaction(async (tx) => {
      // 1. Charger le match avec verrouillage (utiliser activeMatchId)
      const match = await tx.match.findUnique({
        where: { id: activeMatchId },
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
            // On ne charge que le dernier coup pour :
            // - limiter la charge en DB
            // - respecter le contrat de buildMatchStateViewDto,
            //   qui s'attend à recevoir le dernier coup en premier.
            take: 1,
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

        // Stocker les infos pour appel après la transaction
        wasMatchFinished = true;
        tournamentId = match.tournamentId;

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

      // 10. Déterminer le prochain numéro de coup
      // Comme nous ne chargeons que le dernier coup (take: 1, orderBy desc),
      // `match.moves[0].moveNumber` reflète le nombre TOTAL de coups joués.
      const lastRecordedMove =
        match.moves && match.moves.length > 0 ? match.moves[0] : null;
      const lastMoveNumber =
        lastRecordedMove && typeof lastRecordedMove.moveNumber === 'number'
          ? lastRecordedMove.moveNumber
          : 0;
      const nextMoveNumber = lastMoveNumber + 1;

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
          updateData.finishedAt = now;

          // Phase 6.0.D.3 - Si DRAW, vérifier si tie-break nécessaire
          if (result === MatchResult.DRAW) {
            const tournament = await tx.tournament.findUnique({
              where: { id: match.tournamentId },
              select: { tieBreakPolicy: true },
            });

            if (tournament && tournament.tieBreakPolicy !== TieBreakPolicy.NONE) {
              // Marquage explicite : DRAW avec tie-break pending
              updateData.resultReason = RESULT_REASON_TIEBREAK_PENDING;
            } else {
              // DRAW sans tie-break : utiliser la raison normale
              updateData.resultReason = resultReason;
            }
          } else {
            // Pas un DRAW : utiliser la raison normale
            updateData.resultReason = resultReason;
          }
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

      // 14. Stocker les infos pour usage après la transaction
      wasMatchFinished = updateData.status === MatchStatus.FINISHED;
      tournamentId = match.tournamentId;
      
      // Phase 6.0.D.4 - Si le match actif est un tie-break terminé, résoudre le tie-break
      // Sinon, si c'est un parent DRAW avec tie-break pending, stocker l'ID du parent pour créer les tie-breaks
      if (wasMatchFinished) {
        if (match.isTieBreak && match.parentMatchId) {
          // C'est un tie-break terminé : résoudre le tie-break (sera fait après la transaction)
          originalMatchIdForTieBreak = match.parentMatchId;
        } else if (
          updateData.result === MatchResult.DRAW &&
          updateData.resultReason === RESULT_REASON_TIEBREAK_PENDING
        ) {
          // C'est un parent DRAW avec tie-break pending : stocker l'ID du parent pour créer les tie-breaks
          originalMatchIdForTieBreak = match.id;
          isDrawWithTieBreak = true;
        }
      }
      
      // 15. Retourner l'état du match
      return this.buildMatchStateViewDto(updatedMatch);
    });

    // 16. Phase 6.0.D.3 - Si DRAW avec tie-break pending, créer les tie-breaks APRÈS commit (post-transaction)
    // ⚠️ Utiliser originalMatchIdForTieBreak (parent) et non activeMatchId (peut être un tie-break)
    if (wasMatchFinished && isDrawWithTieBreak && originalMatchIdForTieBreak) {
      try {
        await this.createTieBreakMatches(originalMatchIdForTieBreak);
      } catch (err) {
        this.logger.error(
          `[playMove] Erreur lors de la création des tie-breaks pour parent ${originalMatchIdForTieBreak}:`,
          err,
        );
        // On ne propage pas l'erreur pour ne pas faire échouer le coup qui a été joué avec succès
      }
    }

    // 17. Phase 6.0.D.4 - Si le match actif est un tie-break terminé, résoudre le tie-break
    if (wasMatchFinished && originalMatchIdForTieBreak && !isDrawWithTieBreak) {
      try {
        await this.resolveTieBreak(originalMatchIdForTieBreak);
      } catch (err) {
        this.logger.error(
          `[playMove] Erreur lors de la résolution du tie-break pour parent ${originalMatchIdForTieBreak}:`,
          err,
        );
        // On ne propage pas l'erreur
      }
    }

    // 18. Si la partie est terminée, appeler generateNextRoundIfNeeded APRÈS la transaction (de manière synchrone)
    if (wasMatchFinished) {
      try {
        await this.generateNextRoundIfNeeded(tournamentId);
      } catch (err) {
        this.logger.error(
          `[playMove] Erreur lors de la génération de la ronde suivante pour tournoi ${tournamentId}:`,
          err,
        );
        // On ne propage pas l'erreur pour ne pas faire échouer le coup qui a été joué avec succès
      }
      }

    return stateView;
  }

  /**
   * Phase 6.0.C1 - Abandonner un match
   *
   * - match doit exister
   * - joueur doit être participant
   * - match doit être RUNNING
   * - termine le match par RESIGNATION et déclenche la logique de tournoi
   */
  async resignMatch(
    matchId: string,
    playerId: string,
  ): Promise<MatchStateViewDto> {
    const finishedMatch = await this.prisma.$transaction(async (tx) => {
      // 1. Charger le match avec les entrées et le tournoi
      const match = await tx.match.findUnique({
        where: { id: matchId },
        include: {
          whiteEntry: true,
          blackEntry: true,
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
            take: 1,
          },
        },
      });

      if (!match) {
        throw new NotFoundException(
          `Match avec l'ID "${matchId}" introuvable`,
        );
      }

      const whitePlayerId = match.whiteEntry.playerId;
      const blackPlayerId = match.blackEntry.playerId;

      // 2. Vérifier que le joueur est dans le match
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

      // 4. Déterminer la couleur du joueur qui abandonne et le gagnant
      const resigningColor =
        playerId === whitePlayerId ? MatchColor.WHITE : MatchColor.BLACK;
      const winnerColor =
        resigningColor === MatchColor.WHITE ? MatchColor.BLACK : MatchColor.WHITE;

      const result =
        winnerColor === MatchColor.WHITE
          ? MatchResult.WHITE_WIN
          : MatchResult.BLACK_WIN;

      const now = new Date();

      // 5. Mettre à jour le match comme terminé par résignation
      const updated = await tx.match.update({
        where: { id: matchId },
        data: {
          status: MatchStatus.FINISHED,
          result,
          resultReason: 'RESIGNATION',
          finishedAt: now,
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

      return updated as any;
    });

    // 6. Après commit : déclencher la logique de tournoi (Phase 5) - SYNCHRONE
    try {
      await this.generateNextRoundIfNeeded(finishedMatch.tournamentId);
    } catch (err) {
          console.error(
        '[resignMatch] Erreur lors de la génération de la ronde suivante:',
            err,
          );
      // On ne propage pas l'erreur pour ne pas faire échouer la résignation qui a réussi
    }

    // 7. Retourner l'état canonique du match
    return this.buildMatchStateViewDto(finishedMatch);
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
    // IMPORTANT :
    // - Dans plusieurs appels (joinMatch, getMatchState, playMove),
    //   nous chargeons uniquement le dernier coup avec `take: 1` et
    //   `orderBy: moveNumber desc`.
    // - Dans ce cas, `match.moves.length` vaut 1, mais le champ
    //   `moveNumber` du premier élément reflète le nombre TOTAL de coups
    //   joués dans la partie.
    const moves = match.moves ?? [];
    const moveCount =
      moves.length > 0 && typeof moves[0].moveNumber === 'number'
        ? moves[0].moveNumber
        : moves.length;

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

  /**
   * Phase 6.0.D.3 - Crée automatiquement les matchs tie-break pour un match parent terminé en DRAW
   * 
   * Cette méthode est idempotente : si les tie-breaks existent déjà (contrainte unique DB),
   * elle ne crée pas de doublons (gestion P2002).
   * 
   * @param parentMatchId - ID du match parent terminé en DRAW
   * @throws NotFoundException si le match parent n'existe pas
   * @throws BadRequestException si le match n'est pas un parent DRAW ou si tieBreakPolicy = NONE
   */
  async createTieBreakMatches(parentMatchId: string): Promise<void> {
    // 1. Charger le match parent avec le tournoi et les entries
    const parentMatch = await this.prisma.match.findUnique({
      where: { id: parentMatchId },
      include: {
        tournament: {
          select: {
            id: true,
            tieBreakPolicy: true,
            tieBreakTimeControl: true,
            timeControl: true,
          },
        },
        whiteEntry: {
          select: {
            id: true,
            playerId: true,
          },
        },
        blackEntry: {
          select: {
            id: true,
            playerId: true,
          },
        },
      },
    });

    if (!parentMatch) {
      throw new NotFoundException(
        `Match parent avec l'ID "${parentMatchId}" introuvable`,
      );
    }

    // 2. Vérifier que c'est un match parent (pas un tie-break)
    if (parentMatch.isTieBreak) {
      // No-op : on ne crée pas de tie-break pour un tie-break
      return;
    }

    // 3. Vérifier que le match est terminé en DRAW
    if (
      parentMatch.status !== MatchStatus.FINISHED ||
      parentMatch.result !== MatchResult.DRAW
    ) {
      // No-op : pas de tie-break si pas DRAW
      return;
    }

    // 4. Vérifier que le tournoi a une politique de tie-break
    if (parentMatch.tournament.tieBreakPolicy === TieBreakPolicy.NONE) {
      // No-op : pas de tie-break si policy = NONE
      return;
    }

    // 5. Déterminer le nombre de tie-breaks à créer selon la politique
    const tieBreakPolicy = parentMatch.tournament.tieBreakPolicy;
    let tieBreakCount: number;

    switch (tieBreakPolicy) {
      case TieBreakPolicy.RAPID:
      case TieBreakPolicy.BLITZ:
      case TieBreakPolicy.ARMAGEDDON:
        tieBreakCount = 1;
        break;
      case TieBreakPolicy.BEST_OF_3:
        tieBreakCount = 3;
        break;
      case TieBreakPolicy.BEST_OF_5:
        tieBreakCount = 5;
        break;
      default:
        throw new BadRequestException(
          `Politique de tie-break non supportée: ${tieBreakPolicy}`,
        );
    }

    // 6. Déterminer le time control pour les tie-breaks
    const tieBreakTimeControl =
      parentMatch.tournament.tieBreakTimeControl ??
      parentMatch.tournament.timeControl;

    // 7. Créer chaque tie-break avec idempotence
    for (let tieBreakIndex = 1; tieBreakIndex <= tieBreakCount; tieBreakIndex++) {
      try {
        await this.createSingleTieBreakMatch(
          parentMatch,
          tieBreakIndex,
          tieBreakTimeControl,
          tieBreakPolicy,
        );
      } catch (error: any) {
        // Gérer l'idempotence : si P2002 (contrainte unique violée), ignorer (déjà créé)
        if (error.code === 'P2002') {
          // Tie-break déjà créé, continuer
          continue;
        }
        // Autre erreur : propager
        throw error;
      }
    }
  }

  /**
   * Phase 6.0.D.3 - Crée un seul match tie-break
   * 
   * @param parentMatch - Match parent terminé en DRAW
   * @param tieBreakIndex - Index du tie-break (1..N)
   * @param timeControl - Time control à utiliser pour ce tie-break
   * @param tieBreakPolicy - Politique de tie-break (pour déterminer les couleurs)
   */
  private async createSingleTieBreakMatch(
    parentMatch: Match & {
      tournament: {
        id: string;
        tieBreakPolicy: TieBreakPolicy;
        tieBreakTimeControl: string | null;
        timeControl: string;
      };
      whiteEntry: { id: string; playerId: string };
      blackEntry: { id: string; playerId: string };
    },
    tieBreakIndex: number,
    timeControl: string,
    tieBreakPolicy: TieBreakPolicy,
  ): Promise<Match> {
    // 1. Déterminer les couleurs de manière déterministe
    // Règle : alternance des couleurs à chaque tie-break (index pair = swap, impair = même)
    // Exception ARMAGEDDON : inversion systématique (noir = blanc du parent, blanc = noir du parent)
    let whiteEntryId: string;
    let blackEntryId: string;

    if (tieBreakPolicy === TieBreakPolicy.ARMAGEDDON) {
      // ARMAGEDDON : inversion systématique (décision 0.6)
      whiteEntryId = parentMatch.blackEntry.id;
      blackEntryId = parentMatch.whiteEntry.id;
    } else {
      // Autres politiques : alternance selon tieBreakIndex
      if (tieBreakIndex % 2 === 0) {
        // Index pair : swap des couleurs
        whiteEntryId = parentMatch.blackEntry.id;
        blackEntryId = parentMatch.whiteEntry.id;
      } else {
        // Index impair : mêmes couleurs que le parent
        whiteEntryId = parentMatch.whiteEntry.id;
        blackEntryId = parentMatch.blackEntry.id;
      }
    }

    // 2. Créer le match tie-break
    const tieBreakMatch = await this.prisma.match.create({
      data: {
        tournamentId: parentMatch.tournamentId,
        roundNumber: parentMatch.roundNumber, // Même ronde que le parent
        boardNumber: parentMatch.boardNumber, // Même board que le parent
        whiteEntryId,
        blackEntryId,
        status: MatchStatus.PENDING,
        result: null,
        resultReason: null,
        isTieBreak: true,
        parentMatchId: parentMatch.id,
        tieBreakIndex,
        tieBreakType: tieBreakPolicy,
        timeControlOverride: timeControl, // Décision 0.5 : persister timeControlOverride
        initialFen: null, // Position de départ standard
        currentFen: null,
        whiteTimeMsRemaining: null,
        blackTimeMsRemaining: null,
        startedAt: null,
        finishedAt: null,
        lastMoveAt: null,
        readyAt: null,
        whiteJoinedAt: null,
        blackJoinedAt: null,
      },
    });

    return tieBreakMatch;
  }

  /**
   * Phase 6.0.D.4 - Retourne l'ID du match jouable actif à partir d'un matchId.
   * Si le match est un parent avec tie-break pending, retourne le tie-break actif (tieBreakIndex minimal non terminé).
   * Sinon, retourne le matchId original.
   * 
   * ⚠️ SÉCURITÉ : Vérifie que le joueur a le droit d'accéder au match (mêmes entryIds).
   * 
   * @param matchId - ID du match (parent ou tie-break)
   * @param playerId - ID du joueur (pour vérification d'autorisation) - OBLIGATOIRE
   * @returns ID du match jouable actif
   * @throws NotFoundException si le match n'existe pas
   * @throws ForbiddenException si le joueur n'est pas autorisé (code: PLAYER_NOT_IN_MATCH)
   */
  private async getActivePlayableMatchId(
    matchId: string, 
    playerId: string
  ): Promise<string> {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        tournament: {
          select: { tieBreakPolicy: true }
        },
        whiteEntry: {
          include: { player: { select: { id: true } } }
        },
        blackEntry: {
          include: { player: { select: { id: true } } }
        },
        tieBreakMatches: {
          where: {
            status: { not: MatchStatus.FINISHED }
          },
          orderBy: { tieBreakIndex: 'asc' },
          take: 1,
          select: {
            id: true,
            whiteEntryId: true,
            blackEntryId: true,
          }
        }
      }
    });

    if (!match) {
      throw new NotFoundException(`Match avec l'ID "${matchId}" introuvable`);
    }

    // ⚠️ Sécurité : Vérifier que les entryIds existent (pas de BYE/PENDING incomplet)
    if (!match.whiteEntryId || !match.blackEntryId) {
      throw new BadRequestException(
        'Ce match n\'a pas d\'entrées complètes (BYE ou match incomplet)',
      );
    }

    // ⚠️ PIÈGE 1 - Vérification d'autorisation
    const whitePlayerId = match.whiteEntry?.playerId;
    const blackPlayerId = match.blackEntry?.playerId;
    
    if (!whitePlayerId || !blackPlayerId) {
      throw new BadRequestException(
        'Ce match n\'a pas de joueurs associés aux entrées',
      );
    }
    
    if (playerId !== whitePlayerId && playerId !== blackPlayerId) {
      // Le joueur n'a pas le droit d'accéder à ce match
      // ⚠️ DÉCISION : Throw ForbiddenException immédiatement (pas de retour de matchId)
      throw new ForbiddenException({
        code: 'PLAYER_NOT_IN_MATCH',
        message: 'Vous n\'êtes pas un participant de ce match'
      });
    }

    // Si c'est un tie-break, retourner directement
    if (match.isTieBreak) {
      return matchId;
    }

    // Si c'est un parent avec resultReason = "TIEBREAK_PENDING" et tie-break actif
    if (
      match.result === MatchResult.DRAW &&
      match.resultReason === RESULT_REASON_TIEBREAK_PENDING &&
      match.tournament.tieBreakPolicy !== TieBreakPolicy.NONE
    ) {
      // ⚠️ PIÈGE 2 - Cas où tous les tie-breaks sont terminés mais parent pas encore mis à jour
      if (match.tieBreakMatches.length === 0) {
        // Tous les tie-breaks sont terminés, mais parent pas encore mis à jour
        // Recharger le parent et, si encore DRAW, déclencher resolveTieBreak() (best effort)
        const updatedParent = await this.prisma.match.findUnique({
          where: { id: matchId }
        });
        
        if (updatedParent && updatedParent.result === MatchResult.DRAW) {
          // Parent toujours en DRAW : déclencher résolution (best effort, non bloquant)
          const tournamentId = match.tournamentId || 'unknown';
          this.resolveTieBreak(matchId).catch(err => {
            this.logger.warn(
              `[getActivePlayableMatchId] best-effort resolveTieBreak failed - matchId=${matchId}, tournamentId=${tournamentId}, error=${err.message}`,
            );
          });
        }
        
        // Retourner le parent (même s'il est encore en DRAW, l'utilisateur verra l'état actuel)
        return matchId;
      }
      
      // Retourner le tie-break actif (tieBreakIndex minimal non terminé)
      const activeTieBreak = match.tieBreakMatches[0];
      
      // ⚠️ Option A - Vérification par entryIds (plus robuste)
      // Vérifier que les entryIds du tie-break correspondent au set {parent.whiteEntryId, parent.blackEntryId}
      const parentEntryIds = new Set([match.whiteEntryId, match.blackEntryId]);
      const tieBreakEntryIds = new Set([
        activeTieBreak.whiteEntryId,
        activeTieBreak.blackEntryId,
      ]);
      
      // Les deux sets doivent contenir les mêmes entryIds
      if (
        parentEntryIds.size === tieBreakEntryIds.size &&
        [...parentEntryIds].every(id => tieBreakEntryIds.has(id))
      ) {
        return activeTieBreak.id;
      } else {
        // Cas théoriquement impossible mais sécurité : throw ForbiddenException
        throw new ForbiddenException({
          code: 'PLAYER_NOT_IN_MATCH',
          message: 'Vous n\'êtes pas un participant de ce match'
        });
      }
    }

    // Sinon, retourner le match original
    return matchId;
  }

  /**
   * Phase 6.0.D.4 - Résout un tie-break et met à jour le match parent
   * 
   * Cette méthode est appelée en "best effort" : les erreurs sont loggées mais ne sont pas propagées.
   * 
   * @param parentMatchId - ID du match parent avec tie-break pending
   */
  async resolveTieBreak(parentMatchId: string): Promise<void> {
    // 1. Charger le match parent avec tous les tie-breaks
    const parentMatch = await this.prisma.match.findUnique({
      where: { id: parentMatchId },
      include: {
        tournament: {
          select: {
            id: true,
            tieBreakPolicy: true,
          },
        },
        tieBreakMatches: {
          where: {
            status: MatchStatus.FINISHED,
          },
          select: {
            result: true,
            whiteEntryId: true,
            blackEntryId: true,
          },
          orderBy: { tieBreakIndex: 'asc' },
        },
      },
    });

    if (!parentMatch) {
      throw new NotFoundException(
        `Match parent avec l'ID "${parentMatchId}" introuvable`,
      );
    }

    // 2. Vérifier que c'est bien un parent avec tie-break pending
    if (
      parentMatch.isTieBreak ||
      parentMatch.result !== MatchResult.DRAW ||
      parentMatch.resultReason !== RESULT_REASON_TIEBREAK_PENDING
    ) {
      // Pas un parent avec tie-break pending, no-op
      return;
    }

    // 3. Vérifier que tous les tie-breaks sont terminés
    const tieBreakPolicy = parentMatch.tournament.tieBreakPolicy;
    let expectedTieBreakCount: number;

    switch (tieBreakPolicy) {
      case TieBreakPolicy.RAPID:
      case TieBreakPolicy.BLITZ:
      case TieBreakPolicy.ARMAGEDDON:
        expectedTieBreakCount = 1;
        break;
      case TieBreakPolicy.BEST_OF_3:
        expectedTieBreakCount = 3;
        break;
      case TieBreakPolicy.BEST_OF_5:
        expectedTieBreakCount = 5;
        break;
      default:
        // NONE ou autre : pas de tie-break à résoudre
        return;
    }

    if (parentMatch.tieBreakMatches.length < expectedTieBreakCount) {
      // Pas tous les tie-breaks terminés, attendre
      return;
    }

    // 4. Déterminer le vainqueur selon la politique
    let winnerEntryId: string | null = null;
    let resultReason: string;

    switch (tieBreakPolicy) {
      case TieBreakPolicy.RAPID:
      case TieBreakPolicy.BLITZ:
        // 1 match → winner direct
        const singleMatch = parentMatch.tieBreakMatches[0];
        if (singleMatch.result === MatchResult.WHITE_WIN) {
          winnerEntryId = singleMatch.whiteEntryId;
        } else if (singleMatch.result === MatchResult.BLACK_WIN) {
          winnerEntryId = singleMatch.blackEntryId;
        } else if (singleMatch.result === MatchResult.DRAW) {
          // DRAW dans un tie-break RAPID/BLITZ : cas edge, ne pas résoudre
          this.logger.warn(
            `[resolveTieBreak] DRAW in tie-break - parentId=${parentMatchId}, tournamentId=${parentMatch.tournamentId}, policy=${tieBreakPolicy} - not resolved`,
          );
          return;
        }
        resultReason = tieBreakPolicy === TieBreakPolicy.RAPID 
          ? 'TIE_BREAK_RAPID' 
          : 'TIE_BREAK_BLITZ';
        break;

      case TieBreakPolicy.ARMAGEDDON:
        // ARMAGEDDON : noir gagne si nul (décision 0.6)
        const armageddonMatch = parentMatch.tieBreakMatches[0];
        if (armageddonMatch.result === MatchResult.WHITE_WIN) {
          winnerEntryId = armageddonMatch.whiteEntryId;
        } else if (armageddonMatch.result === MatchResult.BLACK_WIN) {
          winnerEntryId = armageddonMatch.blackEntryId;
        } else if (armageddonMatch.result === MatchResult.DRAW) {
          // DRAW → noir gagne (décision 0.6)
          // Pour un DRAW Armageddon : winnerEntryId = blackEntryId du tie-break
          winnerEntryId = armageddonMatch.blackEntryId;
        }
        resultReason = 'TIE_BREAK_ARMAGEDDON';
        break;

      case TieBreakPolicy.BEST_OF_3:
      case TieBreakPolicy.BEST_OF_5:
        // BEST_OF_3/5 : compter les victoires par entryId
        winnerEntryId = this.findBestOfNWinner(parentMatch.tieBreakMatches);
        if (!winnerEntryId) {
          // Égalité ou pas de vainqueur déterminé : cas edge, ne pas résoudre
          // Résumé compact des résultats : [1:WHITE_WIN,2:BLACK_WIN,3:DRAW]
          const resultsSummary = parentMatch.tieBreakMatches
            .map((m, idx) => `${idx + 1}:${m.result}`)
            .join(',');
          const policyLabel = tieBreakPolicy === TieBreakPolicy.BEST_OF_3 ? '3' : '5';
          this.logger.warn(
            `[resolveTieBreak] no winner - parentId=${parentMatchId}, tournamentId=${parentMatch.tournamentId}, policy=BEST_OF_${policyLabel}, results=[${resultsSummary}] - not resolved`,
          );
          return;
        }
        resultReason = tieBreakPolicy === TieBreakPolicy.BEST_OF_3
          ? 'TIE_BREAK_BEST_OF_3'
          : 'TIE_BREAK_BEST_OF_5';
        break;

      default:
        return;
    }

    if (!winnerEntryId) {
      // Impossible de déterminer un vainqueur, ne pas résoudre
      return;
    }

    // 5. Mettre à jour le match parent
    const parentResult =
      winnerEntryId === parentMatch.whiteEntryId
        ? MatchResult.WHITE_WIN
        : MatchResult.BLACK_WIN;

    await this.prisma.match.update({
      where: { id: parentMatchId },
      data: {
        result: parentResult,
        resultReason,
      },
    });

    // 6. Appeler generateNextRoundIfNeeded() après mise à jour du parent
    try {
      await this.generateNextRoundIfNeeded(parentMatch.tournamentId);
    } catch (err) {
      this.logger.error(
        `[resolveTieBreak] generateNextRoundIfNeeded failed - parentId=${parentMatchId}, tournamentId=${parentMatch.tournamentId}`,
        err instanceof Error ? err.stack : String(err),
      );
      // On ne propage pas l'erreur
    }
  }

  /**
   * Phase 6.0.D.4 - Trouve le vainqueur d'un BEST_OF_N en comptant les victoires par entryId
   * 
   * @param tieBreakMatches - Liste des matchs tie-break terminés (triés par tieBreakIndex)
   * @returns EntryId du vainqueur ou null si aucun vainqueur déterminé (égalité ou pas assez de victoires)
   */
  private findBestOfNWinner(tieBreakMatches: Array<{
    result: MatchResult;
    whiteEntryId: string;
    blackEntryId: string;
  }>): string | null {
    // Compter les victoires par entryId
    const winsByEntryId: Record<string, number> = {};

    for (const match of tieBreakMatches) {
      if (match.result === MatchResult.WHITE_WIN) {
        winsByEntryId[match.whiteEntryId] = (winsByEntryId[match.whiteEntryId] || 0) + 1;
      } else if (match.result === MatchResult.BLACK_WIN) {
        winsByEntryId[match.blackEntryId] = (winsByEntryId[match.blackEntryId] || 0) + 1;
      }
      // DRAW : pas de victoire comptée
    }

    // Trouver l'entryId avec le plus de victoires
    let maxWins = 0;
    let winnerEntryId: string | null = null;
    let hasTie = false;

    for (const [entryId, wins] of Object.entries(winsByEntryId)) {
      if (wins > maxWins) {
        maxWins = wins;
        winnerEntryId = entryId;
        hasTie = false;
      } else if (wins === maxWins && winnerEntryId) {
        // Égalité : pas de vainqueur déterminé
        hasTie = true;
      }
    }

    if (hasTie || !winnerEntryId) {
      return null;
    }

    // Vérifier le seuil de victoires (BEST_OF_3 = 2, BEST_OF_5 = 3)
    const totalMatches = tieBreakMatches.length;
    const requiredWins = totalMatches === 3 ? 2 : totalMatches === 5 ? 3 : 0;

    if (maxWins >= requiredWins) {
      return winnerEntryId;
    }

    return null;
  }
}

