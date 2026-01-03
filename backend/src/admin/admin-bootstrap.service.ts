import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlayerRole } from '@prisma/client';

@Injectable()
export class AdminBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(AdminBootstrapService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;

    if (!superAdminEmail) {
      this.logger.warn(
        'SUPER_ADMIN_EMAIL is not defined in environment variables. No super admin will be bootstrapped.',
      );
      return;
    }

    try {
      // Chercher le joueur avec cet email
      const player = await this.prisma.player.findUnique({
        where: { email: superAdminEmail },
        select: { id: true, email: true, role: true },
      });

      if (!player) {
        this.logger.warn(
          `Player with email "${superAdminEmail}" not found. Super admin promotion skipped.`,
        );
        return;
      }

      // Si le joueur existe mais n'est pas déjà SUPER_ADMIN, le promouvoir
      if (player.role !== PlayerRole.SUPER_ADMIN) {
        await this.prisma.player.update({
          where: { id: player.id },
          data: { role: PlayerRole.SUPER_ADMIN },
        });

        this.logger.log(`✅ Player "${player.email}" has been promoted to SUPER_ADMIN`);
      } else {
        this.logger.log(`Player "${player.email}" is already SUPER_ADMIN`);
      }
    } catch (error) {
      this.logger.error(`Error during super admin bootstrap: ${error.message}`, error.stack);
      // Ne pas bloquer le démarrage de l'application en cas d'erreur
    }
  }
}
