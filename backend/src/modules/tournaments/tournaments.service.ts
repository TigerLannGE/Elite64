import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionsService } from '../../transactions/transactions.service';
import { PrizePoolService } from '../prize-pool/prize-pool.service';
import { PlayerRestrictionsService } from '../../moderation/player-restrictions.service';
import { MatchesService } from '../matches/matches.service';
import {
  Tournament,
  TournamentStatus,
  TournamentEntryStatus,
  TransactionType,
  MatchResult,
  MatchStatus,
} from '@prisma/client';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';

export interface TournamentPublicView {
  id: string;
  name: string;
  timeControl: string;
  status: TournamentStatus;
  buyInCents: number;
  currency: string;
  minPlayers: number;
  maxPlayers: number;
  currentPlayers: number;
  eloMin?: number | null;
  eloMax?: number | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
  registrationClosesAt?: Date | null;
  legalZoneCode: string;
  prizePools: {
    min: {
      totalEntriesCents: number;
      commissionCents: number;
      distributableCents: number;
    };
    current: {
      totalEntriesCents: number;
      commissionCents: number;
      distributableCents: number;
    };
    max: {
      totalEntriesCents: number;
      commissionCents: number;
      distributableCents: number;
    };
  };
}

export interface TournamentAdminView {
  id: string;
  name: string;
  status: TournamentStatus;
  timeControl: string;
  buyInCents: number;
  currency: string;
  minPlayers: number;
  maxPlayers: number;
  currentPlayers: number;
  eloMin?: number | null;
  eloMax?: number | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
  registrationClosesAt?: Date | null;
  legalZoneCode: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class TournamentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transactionsService: TransactionsService,
    private readonly prizePoolService: PrizePoolService,
    private readonly playerRestrictionsService: PlayerRestrictionsService,
    @Inject(forwardRef(() => MatchesService))
    private readonly matchesService: MatchesService,
  ) {}

  /**
   * Crée un tournoi en statut DRAFT ou SCHEDULED (admin uniquement)
   */
  async createTournamentAsAdmin(
    dto: CreateTournamentDto,
    adminId: string,
  ): Promise<Tournament> {
    // Validation : minPlayers <= maxPlayers
    if (dto.minPlayers > dto.maxPlayers) {
      throw new BadRequestException(
        'minPlayers ne peut pas être supérieur à maxPlayers',
      );
    }

    // Validation : registrationClosesAt doit être avant startsAt si les deux sont définis
    if (dto.registrationClosesAt && dto.startsAt) {
      const registrationClosesAt = new Date(dto.registrationClosesAt);
      const startsAt = new Date(dto.startsAt);
      if (registrationClosesAt >= startsAt) {
        throw new BadRequestException(
          'registrationClosesAt doit être antérieur à startsAt',
        );
      }
    }

    // Créer le tournoi
    const tournament = await this.prisma.tournament.create({
      data: {
        name: dto.name,
        timeControl: dto.timeControl,
        buyInCents: dto.buyInCents,
        currency: dto.currency || 'EUR',
        minPlayers: dto.minPlayers,
        maxPlayers: dto.maxPlayers,
        eloMin: dto.eloMin,
        eloMax: dto.eloMax,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
        registrationClosesAt: dto.registrationClosesAt
          ? new Date(dto.registrationClosesAt)
          : null,
        legalZoneCode: dto.legalZoneCode,
        status: dto.status || TournamentStatus.DRAFT,
      },
    });

    return tournament;
  }

  /**
   * Retourne les tournois visibles dans le lobby
   */
  async listPublicTournaments(): Promise<TournamentPublicView[]> {
    const now = new Date();

    // Filtrer par statut (SCHEDULED, READY, RUNNING)
    // Filtrer par dates (startsAt >= now - marge, ou registrationClosesAt >= now)
    const tournaments = await this.prisma.tournament.findMany({
      where: {
        status: {
          in: [
            TournamentStatus.SCHEDULED,
            TournamentStatus.READY,
            TournamentStatus.RUNNING,
          ],
        },
        OR: [
          {
            registrationClosesAt: {
              gte: now,
            },
          },
          {
            startsAt: {
              gte: now,
            },
          },
        ],
      },
      include: {
        entries: {
          where: {
            status: TournamentEntryStatus.CONFIRMED,
          },
        },
      },
      orderBy: {
        startsAt: 'asc',
      },
    });

    // Transformer chaque tournoi pour inclure les prize pools calculés
    return tournaments.map((tournament) => {
      const currentPlayers = tournament.entries.length;

      const prizePools = this.prizePoolService.computePrizePoolForMinCurrentMax(
        {
          minPlayers: tournament.minPlayers,
          maxPlayers: tournament.maxPlayers,
          currentPlayers,
          buyInCents: tournament.buyInCents,
        },
      );

      return {
        id: tournament.id,
        name: tournament.name,
        timeControl: tournament.timeControl,
        status: tournament.status,
        buyInCents: tournament.buyInCents,
        currency: tournament.currency,
        minPlayers: tournament.minPlayers,
        maxPlayers: tournament.maxPlayers,
        currentPlayers,
        eloMin: tournament.eloMin,
        eloMax: tournament.eloMax,
        startsAt: tournament.startsAt,
        endsAt: tournament.endsAt,
        registrationClosesAt: tournament.registrationClosesAt,
        legalZoneCode: tournament.legalZoneCode,
        prizePools,
      };
    });
  }

  /**
   * Retourne la liste des tournois pour l'admin (tous les statuts, sans filtres de dates)
   */
  async listAdminTournaments(): Promise<TournamentAdminView[]> {
    const tournaments = await this.prisma.tournament.findMany({
      include: {
        entries: {
          where: {
            status: TournamentEntryStatus.CONFIRMED,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return tournaments.map((tournament) => ({
      id: tournament.id,
      name: tournament.name,
      status: tournament.status,
      timeControl: tournament.timeControl,
      buyInCents: tournament.buyInCents,
      currency: tournament.currency,
      minPlayers: tournament.minPlayers,
      maxPlayers: tournament.maxPlayers,
      currentPlayers: tournament.entries.length,
      eloMin: tournament.eloMin,
      eloMax: tournament.eloMax,
      startsAt: tournament.startsAt,
      endsAt: tournament.endsAt,
      registrationClosesAt: tournament.registrationClosesAt,
      legalZoneCode: tournament.legalZoneCode,
      createdAt: tournament.createdAt,
      updatedAt: tournament.updatedAt,
    }));
  }

  /**
   * Retourne le détail d'un tournoi avec les prize pools calculés
   */
  async getTournamentPublicView(id: string): Promise<TournamentPublicView> {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id },
      include: {
        entries: {
          where: {
            status: TournamentEntryStatus.CONFIRMED,
          },
        },
      },
    });

    if (!tournament) {
      throw new NotFoundException(`Tournoi avec l'ID "${id}" introuvable`);
    }

    const currentPlayers = tournament.entries.length;

    const prizePools = this.prizePoolService.computePrizePoolForMinCurrentMax({
      minPlayers: tournament.minPlayers,
      maxPlayers: tournament.maxPlayers,
      currentPlayers,
      buyInCents: tournament.buyInCents,
    });

    return {
      id: tournament.id,
      name: tournament.name,
      timeControl: tournament.timeControl,
      status: tournament.status,
      buyInCents: tournament.buyInCents,
      currency: tournament.currency,
      minPlayers: tournament.minPlayers,
      maxPlayers: tournament.maxPlayers,
      currentPlayers,
      eloMin: tournament.eloMin,
      eloMax: tournament.eloMax,
      startsAt: tournament.startsAt,
      endsAt: tournament.endsAt,
      registrationClosesAt: tournament.registrationClosesAt,
      legalZoneCode: tournament.legalZoneCode,
      prizePools,
    };
  }

  /**
   * Inscription d'un joueur à un tournoi
   */
  async joinTournament(
    tournamentId: string,
    playerId: string,
  ): Promise<{ message: string; entryId: string }> {
    // 1. Récupérer le tournoi
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        entries: {
          where: {
            status: TournamentEntryStatus.CONFIRMED,
          },
        },
      },
    });

    if (!tournament) {
      throw new NotFoundException(
        `Tournoi avec l'ID "${tournamentId}" introuvable`,
      );
    }

    // Vérifier le statut (SCHEDULED)
    if (tournament.status !== TournamentStatus.SCHEDULED) {
      throw new BadRequestException(
        `Ce tournoi n'accepte plus d'inscriptions (statut: ${tournament.status})`,
      );
    }

    // Vérifier les dates (now < registrationClosesAt ou startsAt)
    const now = new Date();
    const registrationClosesAt = tournament.registrationClosesAt || tournament.startsAt;
    if (registrationClosesAt && now >= registrationClosesAt) {
      throw new BadRequestException(
        'Les inscriptions sont closes pour ce tournoi',
      );
    }

    // 2. Vérifier que le player n'est pas déjà inscrit
    const existingEntry = await this.prisma.tournamentEntry.findUnique({
      where: {
        playerId_tournamentId: {
          playerId,
          tournamentId,
        },
      },
    });

    if (existingEntry) {
      throw new BadRequestException(
        'Vous êtes déjà inscrit à ce tournoi',
      );
    }

    // 3. Vérifier que le tournoi n'a pas atteint maxPlayers
    const confirmedCount = tournament.entries.length;
    if (confirmedCount >= tournament.maxPlayers) {
      throw new BadRequestException('Le tournoi est complet');
    }

    // 4. Récupérer le joueur avec ses restrictions et vérifier les permissions
    const player = await this.prisma.player.findUnique({
      where: { id: playerId },
      select: {
        id: true,
        isActive: true,
        blockTournaments: true,
        blockWalletDeposits: true,
        blockWalletWithdrawals: true,
      },
    });

    if (!player) {
      throw new NotFoundException(
        `Joueur avec l'ID "${playerId}" introuvable`,
      );
    }

    // Vérifier les restrictions avant toute opération
    this.playerRestrictionsService.assertCanJoinTournament(player);

    // 5. Récupérer le wallet du joueur
    const wallet = await this.prisma.wallet.findUnique({
      where: { playerId },
    });

    if (!wallet) {
      throw new NotFoundException(
        `Portefeuille introuvable pour le joueur "${playerId}"`,
      );
    }

    // 6. Utiliser transactionsService.debitWallet
    await this.transactionsService.debitWallet({
      walletId: wallet.id,
      type: TransactionType.TOURNAMENT_BUY_IN,
      amountCents: tournament.buyInCents,
      description: `Buy-in tournoi ${tournament.name}`,
    });

    // 7. Créer un TournamentEntry pour ce joueur
    const entry = await this.prisma.tournamentEntry.create({
      data: {
        playerId,
        tournamentId,
        status: TournamentEntryStatus.CONFIRMED,
        buyInPaidCents: tournament.buyInCents,
      },
    });

    // 8. Retourner une info de confirmation
    return {
      message: `Inscription réussie au tournoi "${tournament.name}"`,
      entryId: entry.id,
    };
  }

  /**
   * Ferme les inscriptions et traite le tournoi (annulation ou figement du prize pool)
   */
  async closeRegistrationAndProcess(
    tournamentId: string,
  ): Promise<
    | { action: 'canceled'; message: string; refundedCount: number }
    | { action: 'locked'; prizePool: any }
  > {
    // 1. Récupérer le tournoi avec ses entries CONFIRMED
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        entries: {
          where: {
            status: TournamentEntryStatus.CONFIRMED,
          },
          include: {
            player: {
              include: {
                wallet: true,
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

    const confirmedCount = tournament.entries.length;

    // 2. Si nombre d'inscrits < minPlayers : annuler et rembourser
    if (confirmedCount < tournament.minPlayers) {
      // Rembourser chaque entry
      let refundedCount = 0;
      for (const entry of tournament.entries) {
        if (entry.player.wallet) {
          await this.transactionsService.creditWallet({
            walletId: entry.player.wallet.id,
            type: TransactionType.TOURNAMENT_PAYOUT, // Utiliser TOURNAMENT_PAYOUT pour les remboursements
            amountCents: entry.buyInPaidCents,
            description: `Remboursement tournoi annulé ${tournament.name}`,
          });
          refundedCount++;
        }
      }

      // Mettre le tournoi en CANCELED
      await this.prisma.tournament.update({
        where: { id: tournamentId },
        data: {
          status: TournamentStatus.CANCELED,
        },
      });

      return {
        action: 'canceled',
        message: `Tournoi annulé (${confirmedCount}/${tournament.minPlayers} joueurs minimum requis). ${refundedCount} joueur(s) remboursé(s).`,
        refundedCount,
      };
    }

    // 3. Si nombre d'inscrits >= minPlayers : figer le prize pool
    const prizePool = await this.prizePoolService.lockPrizePoolForTournament(
      tournamentId,
    );

    return {
      action: 'locked',
      prizePool,
    };
  }

  /**
   * Met à jour un tournoi (admin uniquement)
   * Seulement si statut DRAFT / SCHEDULED et pas d'inscrits pour certains champs
   */
  async updateTournamentAsAdmin(
    tournamentId: string,
    dto: UpdateTournamentDto,
  ): Promise<Tournament> {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        entries: {
          where: {
            status: TournamentEntryStatus.CONFIRMED,
          },
        },
      },
    });

    if (!tournament) {
      throw new NotFoundException(
        `Tournoi avec l'ID "${tournamentId}" introuvable`,
      );
    }

    // Vérifier que le statut permet la modification
    if (
      tournament.status !== TournamentStatus.DRAFT &&
      tournament.status !== TournamentStatus.SCHEDULED
    ) {
      throw new BadRequestException(
        `Impossible de modifier un tournoi avec le statut ${tournament.status}`,
      );
    }

    // Si le tournoi a des inscrits, certains champs ne peuvent pas être modifiés
    const hasEntries = tournament.entries.length > 0;
    if (hasEntries) {
      const restrictedFields = [
        'buyInCents',
        'minPlayers',
        'maxPlayers',
        'currency',
      ];
      for (const field of restrictedFields) {
        if (dto[field] !== undefined) {
          throw new BadRequestException(
            `Impossible de modifier "${field}" car le tournoi a déjà des inscrits`,
          );
        }
      }
    }

    // Préparer les données de mise à jour
    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.timeControl !== undefined) updateData.timeControl = dto.timeControl;
    if (dto.buyInCents !== undefined) updateData.buyInCents = dto.buyInCents;
    if (dto.currency !== undefined) updateData.currency = dto.currency;
    if (dto.minPlayers !== undefined) updateData.minPlayers = dto.minPlayers;
    if (dto.maxPlayers !== undefined) updateData.maxPlayers = dto.maxPlayers;
    if (dto.eloMin !== undefined) updateData.eloMin = dto.eloMin;
    if (dto.eloMax !== undefined) updateData.eloMax = dto.eloMax;
    if (dto.startsAt !== undefined)
      updateData.startsAt = dto.startsAt ? new Date(dto.startsAt) : null;
    if (dto.endsAt !== undefined)
      updateData.endsAt = dto.endsAt ? new Date(dto.endsAt) : null;
    if (dto.registrationClosesAt !== undefined)
      updateData.registrationClosesAt = dto.registrationClosesAt
        ? new Date(dto.registrationClosesAt)
        : null;
    if (dto.legalZoneCode !== undefined)
      updateData.legalZoneCode = dto.legalZoneCode;
    if (dto.status !== undefined) updateData.status = dto.status;

    // Validation : minPlayers <= maxPlayers si les deux sont modifiés
    const finalMinPlayers = updateData.minPlayers ?? tournament.minPlayers;
    const finalMaxPlayers = updateData.maxPlayers ?? tournament.maxPlayers;
    if (finalMinPlayers > finalMaxPlayers) {
      throw new BadRequestException(
        'minPlayers ne peut pas être supérieur à maxPlayers',
      );
    }

    // Mettre à jour
    const updated = await this.prisma.tournament.update({
      where: { id: tournamentId },
      data: updateData,
    });

    return updated;
  }

  /**
   * Finalise le tournoi et distribue les gains basés sur le classement
   */
  async finalizeTournamentAndPayouts(tournamentId: string): Promise<void> {
    // 1. Vérifier que le tournoi est en statut RUNNING et qu'il existe un PrizePool associé
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        prizePool: true,
        matches: {
          include: {
            whiteEntry: {
              include: {
                player: {
                  include: {
                    wallet: true,
                  },
                },
              },
            },
            blackEntry: {
              include: {
                player: {
                  include: {
                    wallet: true,
                  },
                },
              },
            },
          },
          orderBy: [
            { roundNumber: 'desc' },
            { boardNumber: 'asc' },
          ],
        },
      },
    });

    if (!tournament) {
      throw new NotFoundException(
        `Tournoi avec l'ID "${tournamentId}" introuvable`,
      );
    }

    if (tournament.status !== TournamentStatus.RUNNING) {
      throw new BadRequestException(
        `Le tournoi doit être en statut RUNNING pour être finalisé (statut actuel: ${tournament.status})`,
      );
    }

    if (!tournament.prizePool) {
      throw new BadRequestException(
        'Aucun prize pool associé à ce tournoi',
      );
    }

    // 2. Récupérer tous les matches du tournoi, identifier les positions
    //    - Vainqueur (position 1)
    //    - Finaliste (position 2)
    //    - Éventuels demi-finalistes (position 3 ex aequo) si tu veux les récompenser

    // Trouver la dernière ronde (roundNumber max)
    if (tournament.matches.length === 0) {
      throw new BadRequestException(
        'Aucun match trouvé pour ce tournoi',
      );
    }

    const maxRound = Math.max(
      ...tournament.matches.map((m) => m.roundNumber),
    );
    const finalRoundMatches = tournament.matches.filter(
      (m) => m.roundNumber === maxRound,
    );

    // Identifier le vainqueur (celui qui a gagné le match final)
    const finalMatch = finalRoundMatches[0];
    let winnerEntryId: string | null = null;

    if (finalMatch.result === MatchResult.WHITE_WIN) {
      winnerEntryId = finalMatch.whiteEntryId;
    } else if (finalMatch.result === MatchResult.BLACK_WIN) {
      winnerEntryId = finalMatch.blackEntryId;
    } else if (finalMatch.result === MatchResult.BYE) {
      winnerEntryId = finalMatch.whiteEntryId; // Pour BYE, le winner est celui qui a le BYE
    }

    // Si pas de vainqueur clair, on ne peut pas finaliser
    if (!winnerEntryId) {
      throw new BadRequestException(
        'Impossible de déterminer le vainqueur du tournoi',
      );
    }

    // Identifier le finaliste (le perdant du match final)
    let finalistEntryId: string | null = null;
    if (finalMatch.whiteEntryId === winnerEntryId) {
      finalistEntryId = finalMatch.blackEntryId;
    } else {
      finalistEntryId = finalMatch.whiteEntryId;
    }

    // Pour les positions 3+, on peut identifier les perdants des demi-finales
    // Pour l'instant, on se concentre sur les positions 1 et 2

    // 3. Charger le PrizePool (distributableCents + distributionJson)
    const prizePool = tournament.prizePool;
    const distributableCents = prizePool.distributableCents;

    // Parser le distributionJson
    let distributionJson: Record<string, number> = {};
    if (prizePool.distributionJson) {
      try {
        distributionJson =
          typeof prizePool.distributionJson === 'string'
            ? JSON.parse(prizePool.distributionJson)
            : (prizePool.distributionJson as Record<string, number>);
      } catch (e) {
        // Si le JSON est invalide, utiliser une distribution par défaut
        distributionJson = { '1': 1.0 }; // 100% au vainqueur
      }
    } else {
      // Pas de distribution définie, utiliser une distribution par défaut
      distributionJson = { '1': 1.0 }; // 100% au vainqueur
    }

    // 4. Calculer pour chaque position définie dans distributionJson
    //    payoutCents = floor(distributableCents * ratio)
    const payouts: Array<{
      entryId: string;
      position: number;
      payoutCents: number;
    }> = [];

    // Position 1 (vainqueur)
    if (distributionJson['1'] && distributionJson['1'] > 0) {
      const payoutCents = Math.floor(
        distributableCents * distributionJson['1'],
      );
      if (payoutCents > 0 && winnerEntryId) {
        payouts.push({
          entryId: winnerEntryId,
          position: 1,
          payoutCents,
        });
      }
    }

    // Position 2 (finaliste)
    if (distributionJson['2'] && distributionJson['2'] > 0) {
      const payoutCents = Math.floor(
        distributableCents * distributionJson['2'],
      );
      if (payoutCents > 0 && finalistEntryId) {
        payouts.push({
          entryId: finalistEntryId,
          position: 2,
          payoutCents,
        });
      }
    }

    // Positions 3+ (si définies dans distributionJson)
    // Pour l'instant, on ne gère que les positions 1 et 2
    // TODO: Implémenter la logique pour identifier les positions 3+ si nécessaire

    // 5. Pour chaque joueur qui a une position payée :
    //    - Charger son Wallet.
    //    - Créer une transaction TOURNAMENT_PAYOUT via TransactionsService
    // 6. Mettre à jour le tournoi : status = FINISHED, endsAt = maintenant
    // 7. Tout faire dans une transaction Prisma pour garantir la cohérence

    await this.prisma.$transaction(async (tx) => {
      // Distribuer les payouts
      for (const payout of payouts) {
        // Trouver l'entrée pour obtenir le joueur et son wallet
        const entry = tournament.matches
          .flatMap((m) => [m.whiteEntry, m.blackEntry])
          .find((e) => e.id === payout.entryId);

        if (entry && entry.player.wallet) {
          await this.transactionsService.creditWallet({
            walletId: entry.player.wallet.id,
            type: TransactionType.TOURNAMENT_PAYOUT,
            amountCents: payout.payoutCents,
            description: `Gain du tournoi "${tournament.name}" - Position #${payout.position}`,
            externalRef: payout.entryId,
          });
        }
      }

      // Mettre à jour le tournoi
      await tx.tournament.update({
        where: { id: tournamentId },
        data: {
          status: TournamentStatus.FINISHED,
          endsAt: new Date(),
        },
      });
    });
  }

  /**
   * Démarre un tournoi en générant les matches du premier tour
   */
  async startTournament(tournamentId: string) {
    // 1. Vérifier que le tournoi est en statut READY
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      throw new NotFoundException(
        `Tournoi avec l'ID "${tournamentId}" introuvable`,
      );
    }

    if (tournament.status !== TournamentStatus.READY) {
      throw new BadRequestException(
        `Le tournoi doit être en statut READY pour être démarré (statut actuel: ${tournament.status})`,
      );
    }

    // 2. Appeler MatchesService.generateInitialMatchesForTournament(tournamentId)
    //    Cette méthode met déjà à jour le statut en RUNNING
    const matches = await this.matchesService.generateInitialMatchesForTournament(
      tournamentId,
    );

    // 3. Retourner les matches créés
    return matches;
  }

  /**
   * Retourne les matches d'un tournoi groupés par ronde
   */
  async getTournamentMatches(tournamentId: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      throw new NotFoundException(
        `Tournoi avec l'ID "${tournamentId}" introuvable`,
      );
    }

    const matches = await this.prisma.match.findMany({
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
      },
      orderBy: [
        { roundNumber: 'asc' },
        { boardNumber: 'asc' },
      ],
    });

    // Grouper par ronde
    const matchesByRound: Record<number, typeof matches> = {};
    for (const match of matches) {
      if (!matchesByRound[match.roundNumber]) {
        matchesByRound[match.roundNumber] = [];
      }
      matchesByRound[match.roundNumber].push(match);
    }

    return {
      tournament: {
        id: tournament.id,
        name: tournament.name,
        status: tournament.status,
      },
      matchesByRound,
    };
  }

  /**
   * Retourne le classement du tournoi
   */
  async getTournamentStandings(tournamentId: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        prizePool: true,
        matches: {
          include: {
            whiteEntry: {
              include: {
                player: {
                  select: {
                    id: true,
                    username: true,
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
                  },
                },
              },
            },
          },
        },
        entries: {
          include: {
            player: {
              select: {
                id: true,
                username: true,
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

    // Calculer les statistiques pour chaque joueur
    const playerStats: Record<
      string,
      {
        playerId: string;
        username: string;
        wins: number;
        losses: number;
        draws: number;
        position?: number;
        payoutCents?: number;
      }
    > = {};

    // Initialiser tous les joueurs avec 0 wins/losses
    for (const entry of tournament.entries) {
      playerStats[entry.playerId] = {
        playerId: entry.playerId,
        username: entry.player.username,
        wins: 0,
        losses: 0,
        draws: 0,
      };
    }

    // Parcourir tous les matches pour calculer wins/losses
    for (const match of tournament.matches) {
      if (match.status === MatchStatus.FINISHED && match.result) {
        const whitePlayerId = match.whiteEntry.playerId;
        const blackPlayerId = match.blackEntry.playerId;

        if (match.result === MatchResult.WHITE_WIN) {
          playerStats[whitePlayerId].wins++;
          playerStats[blackPlayerId].losses++;
        } else if (match.result === MatchResult.BLACK_WIN) {
          playerStats[blackPlayerId].wins++;
          playerStats[whitePlayerId].losses++;
        } else if (match.result === MatchResult.DRAW) {
          playerStats[whitePlayerId].draws++;
          playerStats[blackPlayerId].draws++;
        } else if (match.result === MatchResult.BYE) {
          // Pour BYE, le winner est celui qui a le BYE
          if (match.whiteEntryId === match.blackEntryId) {
            // Match BYE (même joueur white et black)
            playerStats[whitePlayerId].wins++;
          }
        }
      }
    }

    // Calculer les positions basées sur les wins (et éventuellement d'autres critères)
    // Pour l'instant, on trie simplement par wins décroissant
    const standings = Object.values(playerStats)
      .sort((a, b) => {
        // Trier par wins décroissant, puis par losses croissant, puis par draws décroissant
        if (a.wins !== b.wins) {
          return b.wins - a.wins;
        }
        if (a.losses !== b.losses) {
          return a.losses - b.losses;
        }
        return b.draws - a.draws;
      })
      .map((stats, index) => ({
        ...stats,
        position: index + 1,
      }));

    // Calculer les payouts si le tournoi est terminé et qu'il y a un prize pool
    if (
      tournament.status === TournamentStatus.FINISHED &&
      tournament.prizePool
    ) {
      const distributableCents = tournament.prizePool.distributableCents;
      let distributionJson: Record<string, number> = {};

      if (tournament.prizePool.distributionJson) {
        try {
          distributionJson =
            typeof tournament.prizePool.distributionJson === 'string'
              ? JSON.parse(tournament.prizePool.distributionJson)
              : (tournament.prizePool.distributionJson as Record<
                  string,
                  number
                >);
        } catch (e) {
          distributionJson = { '1': 1.0 };
        }
      } else {
        distributionJson = { '1': 1.0 };
      }

      // Calculer les payouts pour chaque position
      for (const standing of standings) {
        const positionKey = standing.position.toString();
        if (distributionJson[positionKey] && distributionJson[positionKey] > 0) {
          standing.payoutCents = Math.floor(
            distributableCents * distributionJson[positionKey],
          );
        }
      }
    }

    return standings;
  }
}

