import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  Match,
  MatchStatus,
  MatchResult,
  TournamentStatus,
  TournamentEntryStatus,
} from '@prisma/client';
import { ReportMatchResultDto } from './dto/report-match-result.dto';
import { TournamentsService } from '../tournaments/tournaments.service';

@Injectable()
export class MatchesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => TournamentsService))
    private readonly tournamentsService: TournamentsService,
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
}

