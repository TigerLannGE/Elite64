import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../types/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    const player = await this.prisma.player.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isActive: true,
        isEmailVerified: true,
      },
    });

    if (!player) {
      throw new UnauthorizedException('Player not found');
    }

    if (!player.isActive) {
      throw new ForbiddenException({
        code: 'ACCOUNT_SUSPENDED',
        message:
          "Votre compte a été suspendu. Contactez le support si vous pensez qu'il s'agit d'une erreur.",
      });
    }

    return {
      sub: player.id,
      email: player.email,
      username: player.username,
      role: player.role,
    };
  }
}
