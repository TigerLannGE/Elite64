import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PrizePool, TournamentStatus, TournamentEntryStatus } from '@prisma/client';

// Constantes pour le calcul du prize pool
// Modèle économique : prélèvement total de 9.75% (5% commission + 4.75% frais tournoi)
const COMMISSION_RATE = 0.05; // 5% commission plateforme
const TOURNAMENT_FEE_RATE = 0.0475; // 4.75% frais de tournoi

export interface PrizePoolComputationInput {
  playersCount: number;
  buyInCents: number;
}

export interface PrizePoolComputationResult {
  totalEntriesCents: number;
  commissionCents: number;
  distributableCents: number;
}

@Injectable()
export class PrizePoolService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calcule le prize pool basé sur le nombre de joueurs et le buy-in.
   * Ne persiste rien en base de données.
   */
  computePrizePool(input: PrizePoolComputationInput): PrizePoolComputationResult {
    // 1. totalEntriesCents = playersCount * buyInCents
    const totalEntriesCents = input.playersCount * input.buyInCents;

    // 2. commissionCents = floor(totalEntriesCents * COMMISSION_RATE) [5%]
    const commissionCents = Math.floor(totalEntriesCents * COMMISSION_RATE);

    // 3. tournamentFeeCents = floor(totalEntriesCents * TOURNAMENT_FEE_RATE) [4.75%]
    const tournamentFeeCents = Math.floor(totalEntriesCents * TOURNAMENT_FEE_RATE);

    // 4. distributableCents = totalEntriesCents - commissionCents - tournamentFeeCents
    //    Prélèvement total = 5% + 4.75% = 9.75%
    const distributableCents = totalEntriesCents - commissionCents - tournamentFeeCents;

    // 5. Retourner { totalEntriesCents, commissionCents, distributableCents }
    return {
      totalEntriesCents,
      commissionCents,
      distributableCents,
    };
  }

  /**
   * Prépare les calculs min/current/max pour l'affichage dans le lobby.
   * Ne persiste rien en base de données.
   */
  computePrizePoolForMinCurrentMax(params: {
    minPlayers: number;
    maxPlayers: number;
    currentPlayers: number;
    buyInCents: number;
  }): {
    min: PrizePoolComputationResult;
    max: PrizePoolComputationResult;
    current: PrizePoolComputationResult;
  } {
    return {
      min: this.computePrizePool({
        playersCount: params.minPlayers,
        buyInCents: params.buyInCents,
      }),
      max: this.computePrizePool({
        playersCount: params.maxPlayers,
        buyInCents: params.buyInCents,
      }),
      current: this.computePrizePool({
        playersCount: params.currentPlayers,
        buyInCents: params.buyInCents,
      }),
    };
  }

  /**
   * Fige le prize pool d'un tournoi au moment de la clôture des inscriptions.
   * Crée ou met à jour le PrizePool et change le statut du tournoi à READY.
   */
  async lockPrizePoolForTournament(tournamentId: string): Promise<PrizePool> {
    // 1. Récupérer le tournoi + compter les TournamentEntry CONFIRMED
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
      throw new NotFoundException(`Tournoi avec l'ID "${tournamentId}" introuvable`);
    }

    // 2. Si count < tournament.minPlayers -> throw (annulation gérée côté service d'appel)
    const confirmedCount = tournament.entries.length;
    if (confirmedCount < tournament.minPlayers) {
      throw new BadRequestException(
        `Nombre de joueurs insuffisant (${confirmedCount}/${tournament.minPlayers} minimum requis). Le tournoi doit être annulé.`,
      );
    }

    // 3. Utiliser computePrizePool({ playersCount: count, buyInCents: tournament.buyInCents })
    const computation = this.computePrizePool({
      playersCount: confirmedCount,
      buyInCents: tournament.buyInCents,
    });

    // 4. Créer ou mettre à jour le PrizePool associé dans une transaction
    const prizePool = await this.prisma.$transaction(async (tx) => {
      // Vérifier si un PrizePool existe déjà
      const existingPrizePool = await tx.prizePool.findUnique({
        where: { tournamentId },
      });

      const prizePoolData = {
        totalEntriesCents: computation.totalEntriesCents,
        commissionCents: computation.commissionCents,
        distributableCents: computation.distributableCents,
        currency: tournament.currency,
        lockedAt: new Date(),
        distributionJson: null, // Sera défini plus tard lors de la distribution
      };

      let prizePool: PrizePool;
      if (existingPrizePool) {
        // Mettre à jour le PrizePool existant
        prizePool = await tx.prizePool.update({
          where: { tournamentId },
          data: prizePoolData,
        });
      } else {
        // Créer un nouveau PrizePool
        prizePool = await tx.prizePool.create({
          data: {
            tournamentId,
            ...prizePoolData,
          },
        });
      }

      // 5. Mettre à jour le statut du tournoi : READY
      await tx.tournament.update({
        where: { id: tournamentId },
        data: {
          status: TournamentStatus.READY,
        },
      });

      return prizePool;
    });

    // 6. Retourner le PrizePool
    return prizePool;
  }
}
