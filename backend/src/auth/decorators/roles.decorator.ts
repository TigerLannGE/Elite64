import { SetMetadata } from '@nestjs/common';
import { PlayerRole } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: PlayerRole[]) => SetMetadata(ROLES_KEY, roles);

/**
 * Rôles autorisés pour les fonctionnalités admin
 * SUPER_ADMIN peut faire tout ce qu'un ADMIN peut faire
 */
export const ADMIN_ROLES = [PlayerRole.ADMIN, PlayerRole.SUPER_ADMIN] as const;
