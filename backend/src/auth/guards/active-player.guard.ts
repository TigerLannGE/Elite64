import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../types/jwt-payload.interface';

@Injectable()
export class ActivePlayerGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: JwtPayload = request.user;

    // Vérifier que l'utilisateur est présent (doit être injecté par JwtAuthGuard)
    if (!user || !user.sub) {
      throw new ForbiddenException('User not authenticated');
    }

    // Récupérer le joueur depuis la base de données pour vérifier isActive
    const player = await this.prisma.player.findUnique({
      where: { id: user.sub },
      select: {
        id: true,
        isActive: true,
      },
    });

    if (!player) {
      throw new ForbiddenException('Player not found');
    }

    if (!player.isActive) {
      throw new ForbiddenException({
        code: 'ACCOUNT_SUSPENDED',
        message: "Votre compte a été suspendu. Contactez le support si vous pensez qu'il s'agit d'une erreur.",
      });
    }

    return true;
  }
}

