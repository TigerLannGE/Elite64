import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PlayerRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { JwtPayload } from '../types/jwt-payload.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Récupérer les rôles requis depuis les métadonnées (handler + class)
    const requiredRoles = this.reflector.getAllAndOverride<PlayerRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si aucun rôle n'est requis, laisser passer
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Récupérer l'utilisateur depuis la requête (injecté par JwtAuthGuard)
    const request = context.switchToHttp().getRequest();
    const user: JwtPayload = request.user;

    // Vérifier que l'utilisateur existe et a un rôle
    if (!user || !user.role) {
      throw new ForbiddenException('User role not found');
    }

    // Vérifier que le rôle de l'utilisateur est dans la liste des rôles requis
    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}

