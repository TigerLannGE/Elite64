import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionsService } from '../transactions/transactions.service';
import { PlayerRestrictionsService } from '../moderation/player-restrictions.service';
import { TransactionType } from '@prisma/client';

@Injectable()
export class WalletsService {
  constructor(
    private prisma: PrismaService,
    private transactionsService: TransactionsService,
    private playerRestrictionsService: PlayerRestrictionsService,
  ) {}

  async findByPlayerId(playerId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { playerId },
      select: {
        id: true,
        playerId: true,
        balanceCents: true,
        currency: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!wallet) {
      throw new NotFoundException(
        `Portefeuille pour le joueur avec l'ID "${playerId}" introuvable`,
      );
    }

    return wallet;
  }

  /**
   * Récupère le wallet du joueur connecté avec ses transactions.
   */
  async findMyWalletWithTransactions(playerId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { playerId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 50, // Limiter à 50 dernières transactions par défaut
        },
      },
    });

    if (!wallet) {
      throw new NotFoundException(
        `Portefeuille pour le joueur avec l'ID "${playerId}" introuvable`,
      );
    }

    return wallet;
  }

  /**
   * Endpoint DEV uniquement pour créditer un wallet de test.
   * Ne doit JAMAIS être disponible en production.
   */
  async testCredit(playerId: string, amountCents: number) {
    // Vérifier que nous sommes en mode développement
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException(
        'Cette fonctionnalité n\'est pas disponible en production',
      );
    }

    // Récupérer le joueur avec ses restrictions
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

    // Vérifier les restrictions avant toute opération de dépôt
    this.playerRestrictionsService.assertCanDeposit(player);

    // Récupérer le wallet du joueur
    const wallet = await this.findByPlayerId(playerId);

    // Créditer le wallet via TransactionsService
    return this.transactionsService.creditWallet({
      walletId: wallet.id,
      type: TransactionType.BONUS,
      amountCents,
      description: 'Crédit de test (DEV uniquement)',
      externalRef: null,
    });
  }

  /**
   * Méthode pour les retraits (à implémenter plus tard).
   * Prévoit déjà la vérification des restrictions.
   */
  async withdraw(playerId: string, amountCents: number) {
    // Récupérer le joueur avec ses restrictions
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

    // Vérifier les restrictions avant toute opération de retrait
    this.playerRestrictionsService.assertCanWithdraw(player);

    // TODO: Implémenter la logique de retrait
    // Récupérer le wallet, vérifier le solde, débiter, etc.
    throw new ForbiddenException('Les retraits ne sont pas encore implémentés');
  }
}

