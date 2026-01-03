import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionType } from '@prisma/client';

export interface CreateTransactionParams {
  walletId: string;
  type: TransactionType;
  amountCents: number; // POSITIF ou NEGATIF selon la logique métier
  description?: string;
  externalRef?: string | null;
}

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crée une transaction et met à jour le wallet dans une seule transaction Prisma.
   * Tous les mouvements d'argent doivent passer par cette méthode.
   */
  async createTransactionAndUpdateWallet(params: CreateTransactionParams) {
    // 1. Vérifier que amountCents != 0
    if (params.amountCents === 0) {
      throw new BadRequestException('Le montant de la transaction ne peut pas être zéro');
    }

    // 2. Récupérer le wallet
    const wallet = await this.prisma.wallet.findUnique({
      where: { id: params.walletId },
    });

    if (!wallet) {
      throw new NotFoundException(`Portefeuille avec l'ID "${params.walletId}" introuvable`);
    }

    // 3. Calculer le nouveau solde : balanceCents + amountCents
    const newBalanceCents = wallet.balanceCents + params.amountCents;

    // 4. Si le solde devient < 0 → BadRequestException ("Insufficient funds")
    if (newBalanceCents < 0) {
      throw new BadRequestException('Fonds insuffisants');
    }

    // 5. Utiliser prisma.$transaction([...]) pour :
    //    - créer la Transaction
    //    - mettre à jour le Wallet.balanceCents
    const result = await this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          walletId: params.walletId,
          type: params.type,
          amountCents: params.amountCents,
          description: params.description,
          externalRef: params.externalRef,
        },
      });

      const updatedWallet = await tx.wallet.update({
        where: { id: params.walletId },
        data: { balanceCents: newBalanceCents },
      });

      return { transaction, wallet: updatedWallet };
    });

    // 6. Retourner la transaction + nouveau solde
    return {
      transaction: result.transaction,
      newBalanceCents: result.wallet.balanceCents,
    };
  }

  /**
   * Crédite un wallet (montant positif).
   * Vérifie que amountCents > 0 et appelle createTransactionAndUpdateWallet.
   */
  async creditWallet(
    params: Omit<CreateTransactionParams, 'amountCents'> & {
      amountCents: number;
    },
  ) {
    // Vérifier que amountCents > 0
    if (params.amountCents <= 0) {
      throw new BadRequestException('Le montant de crédit doit être strictement positif');
    }

    // Appeler createTransactionAndUpdateWallet avec amountCents positif
    return this.createTransactionAndUpdateWallet({
      ...params,
      amountCents: params.amountCents,
    });
  }

  /**
   * Débite un wallet (montant négatif).
   * Vérifie que amountCents > 0 et appelle createTransactionAndUpdateWallet avec amountCents NEGATIF.
   */
  async debitWallet(
    params: Omit<CreateTransactionParams, 'amountCents'> & {
      amountCents: number;
    },
  ) {
    // Vérifier que amountCents > 0
    if (params.amountCents <= 0) {
      throw new BadRequestException('Le montant de débit doit être strictement positif');
    }

    // Appeler createTransactionAndUpdateWallet avec amountCents NEGATIF
    return this.createTransactionAndUpdateWallet({
      ...params,
      amountCents: -params.amountCents,
    });
  }

  /**
   * Trouve les transactions d'un wallet, triées par createdAt DESC.
   */
  async findTransactionsByWallet(walletId: string, options?: { skip?: number; take?: number }) {
    // Vérifier que le wallet existe
    const wallet = await this.prisma.wallet.findUnique({
      where: { id: walletId },
    });

    if (!wallet) {
      throw new NotFoundException(`Portefeuille avec l'ID "${walletId}" introuvable`);
    }

    // Renvoyer les transactions triées par createdAt DESC
    return this.prisma.transaction.findMany({
      where: { walletId },
      orderBy: { createdAt: 'desc' },
      skip: options?.skip,
      take: options?.take,
    });
  }
}
