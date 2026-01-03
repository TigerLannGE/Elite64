import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PrizePool, TournamentStatus, TournamentEntryStatus } from '@prisma/client';

// Constantes canoniques pour le calcul du prize pool
// Prélèvement opérateur total : 9,75%
const COMMISSION_RATE = 0.05; // 5% commission plateforme
const TOURNAMENT_FEES_RATE = 0.0475; // 4,75% frais d'organisation de tournoi
// ⚠️ OPERATOR_TOTAL_RATE (0.0975) : UNIQUEMENT pour documentation/assertion
// NE JAMAIS utiliser pour calculer operatorTotalCents directement
// Toujours calculer : operatorTotalCents = commissionCents + tournamentFeesCents
const OPERATOR_TOTAL_RATE = 0.0975; // 9,75% total (documentation uniquement)

export interface PrizePoolComputationInput {
  playersCount: number;
  buyInCents: number;
}

export interface PrizePoolComputationResult {
  totalEntriesCents: number;
  commissionCents: number; // 5% du total
  tournamentFeesCents: number; // 4,75% du total
  operatorTotalCents: number; // 9,75% du total
  distributableCents: number; // 90,25% du total
}

@Injectable()
export class PrizePoolService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calcule le prize pool basé sur le nombre de joueurs et le buy-in.
   * Utilise le calcul canonique explicite (plus de logique implicite).
   * Ne persiste rien en base de données.
   */
  computePrizePool(input: PrizePoolComputationInput): PrizePoolComputationResult {
    // 1. Total des inscriptions
    const totalEntriesCents = input.playersCount * input.buyInCents;

    // 2. Commission plateforme : 5% du total
    const commissionCents = Math.floor(totalEntriesCents * COMMISSION_RATE);

    // 3. Frais d'organisation : 4,75% du total
    const tournamentFeesCents = Math.floor(totalEntriesCents * TOURNAMENT_FEES_RATE);

    // 4. Total prélèvement opérateur : SOMME des deux composantes
    // ⚠️ CRITIQUE : Ne jamais calculer via OPERATOR_TOTAL_RATE pour éviter les écarts d'arrondi
    // La traçabilité exacte exige : operatorTotalCents = commissionCents + tournamentFeesCents
    const operatorTotalCents = commissionCents + tournamentFeesCents;

    // 5. Prize pool redistribuable : total - prélèvement opérateur
    // PREUVE AUDIT-PROOF : Le buy-in inclut un prélèvement opérateur total de 9,75% (commission + frais), le reste étant redistribué
    // - Le joueur paie le buy-in complet (ex. 10 CHF)
    // - Le prélèvement opérateur est : commissionCents + tournamentFeesCents
    // - Le prize pool redistribuable est : totalEntriesCents - operatorTotalCents
    // - Vérification : totalEntriesCents = operatorTotalCents + distributableCents
    const distributableCents = totalEntriesCents - operatorTotalCents;

    // Assertion de cohérence (développement uniquement)
    if (process.env.NODE_ENV === 'development') {
      const expectedOperatorTotal = Math.floor(totalEntriesCents * OPERATOR_TOTAL_RATE);
      const diff = Math.abs(operatorTotalCents - expectedOperatorTotal);
      if (diff > 1) {
        console.warn(
          `[PrizePool] Écart d'arrondi détecté : operatorTotalCents=${operatorTotalCents}, attendu=${expectedOperatorTotal}, diff=${diff}`,
        );
      }
    }

    return {
      totalEntriesCents,
      commissionCents,
      tournamentFeesCents,
      operatorTotalCents,
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
   *
   * ⚠️ IMPORTANT : Pour les nouveaux tournois (après migration 20260101185838),
   * tournamentFeesCents est calculé via TOURNAMENT_FEES_RATE (0.0475), pas comme résidu.
   *
   * Pour les anciens tournois (avant migration), tournamentFeesCents est un "legacy derived"
   * calculé comme résidu : totalEntriesCents - commissionCents - distributableCents
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
        tournamentFeesCents: computation.tournamentFeesCents,
        operatorTotalCents: computation.operatorTotalCents,
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
