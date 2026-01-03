import { Injectable, ForbiddenException } from '@nestjs/common';
import { Player } from '@prisma/client';

/**
 * Type partiel pour les restrictions du joueur.
 * Permet de passer soit un Player complet, soit juste les champs nécessaires.
 */
export type PlayerRestrictions = Pick<
  Player,
  'isActive' | 'blockTournaments' | 'blockWalletDeposits' | 'blockWalletWithdrawals'
>;

@Injectable()
export class PlayerRestrictionsService {
  /**
   * Vérifie que le joueur peut rejoindre un tournoi.
   * Lance une ForbiddenException si le compte est suspendu ou si les tournois sont bloqués.
   */
  assertCanJoinTournament(player: PlayerRestrictions): void {
    if (!player.isActive) {
      throw new ForbiddenException({
        code: 'ACCOUNT_SUSPENDED',
        message:
          "Votre compte a été suspendu. Contactez le support si vous pensez qu'il s'agit d'une erreur.",
      });
    }

    if (player.blockTournaments) {
      throw new ForbiddenException({
        code: 'TOURNAMENTS_BLOCKED',
        message:
          "Votre compte ne peut actuellement pas participer aux tournois. Contactez le support pour plus d'informations.",
      });
    }
  }

  /**
   * Vérifie que le joueur peut effectuer un dépôt.
   * Lance une ForbiddenException si le compte est suspendu ou si les dépôts sont bloqués.
   */
  assertCanDeposit(player: PlayerRestrictions): void {
    if (!player.isActive) {
      throw new ForbiddenException({
        code: 'ACCOUNT_SUSPENDED',
        message:
          "Votre compte a été suspendu. Contactez le support si vous pensez qu'il s'agit d'une erreur.",
      });
    }

    if (player.blockWalletDeposits) {
      throw new ForbiddenException({
        code: 'DEPOSITS_BLOCKED',
        message:
          "Les dépôts sont temporairement indisponibles sur votre compte. Contactez le support pour plus d'informations.",
      });
    }
  }

  /**
   * Vérifie que le joueur peut effectuer un retrait.
   * Lance une ForbiddenException si le compte est suspendu ou si les retraits sont bloqués.
   */
  assertCanWithdraw(player: PlayerRestrictions): void {
    if (!player.isActive) {
      throw new ForbiddenException({
        code: 'ACCOUNT_SUSPENDED',
        message:
          "Votre compte a été suspendu. Contactez le support si vous pensez qu'il s'agit d'une erreur.",
      });
    }

    if (player.blockWalletWithdrawals) {
      throw new ForbiddenException({
        code: 'WITHDRAWALS_BLOCKED',
        message:
          "Les retraits sont temporairement suspendus sur votre compte. Contactez le support pour plus d'informations.",
      });
    }
  }
}
