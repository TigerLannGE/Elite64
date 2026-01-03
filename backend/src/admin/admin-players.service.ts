import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface PlayerListItem {
  id: string;
  username: string;
  email: string;
  countryCode: string;
  role: string;
  isActive: boolean;
  blockTournaments: boolean;
  blockWalletDeposits: boolean;
  blockWalletWithdrawals: boolean;
  moderationNote: string | null;
  createdAt: Date;
}

export interface PlayerDetails extends PlayerListItem {
  // On pourra ajouter des stats plus tard
}

@Injectable()
export class AdminPlayersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    skip: number = 0,
    take: number = 50,
    search?: string,
  ): Promise<{ data: PlayerListItem[]; total: number; skip: number; take: number }> {
    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' as const } },
            { username: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [players, total] = await Promise.all([
      this.prisma.player.findMany({
        where,
        skip,
        take,
        select: {
          id: true,
          username: true,
          email: true,
          countryCode: true,
          role: true,
          isActive: true,
          blockTournaments: true,
          blockWalletDeposits: true,
          blockWalletWithdrawals: true,
          moderationNote: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.player.count({ where }),
    ]);

    return {
      data: players,
      total,
      skip,
      take,
    };
  }

  async findOne(id: string): Promise<PlayerDetails> {
    const player = await this.prisma.player.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        countryCode: true,
        role: true,
        isActive: true,
        blockTournaments: true,
        blockWalletDeposits: true,
        blockWalletWithdrawals: true,
        moderationNote: true,
        createdAt: true,
      },
    });

    if (!player) {
      throw new NotFoundException(`Player with ID "${id}" not found`);
    }

    return player;
  }

  async updateStatus(id: string, isActive: boolean): Promise<PlayerDetails> {
    const player = await this.prisma.player.findUnique({
      where: { id },
    });

    if (!player) {
      throw new NotFoundException(`Player with ID "${id}" not found`);
    }

    const updatedPlayer = await this.prisma.player.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        username: true,
        email: true,
        countryCode: true,
        role: true,
        isActive: true,
        blockTournaments: true,
        blockWalletDeposits: true,
        blockWalletWithdrawals: true,
        moderationNote: true,
        createdAt: true,
      },
    });

    return updatedPlayer;
  }

  async updateRestrictions(
    id: string,
    restrictions: {
      blockTournaments?: boolean;
      blockWalletDeposits?: boolean;
      blockWalletWithdrawals?: boolean;
      moderationNote?: string;
    },
  ): Promise<PlayerDetails> {
    const player = await this.prisma.player.findUnique({
      where: { id },
    });

    if (!player) {
      throw new NotFoundException(`Player with ID "${id}" not found`);
    }

    // Construire l'objet de mise à jour avec uniquement les champs fournis
    const updateData: {
      blockTournaments?: boolean;
      blockWalletDeposits?: boolean;
      blockWalletWithdrawals?: boolean;
      moderationNote?: string | null;
    } = {};

    if (restrictions.blockTournaments !== undefined) {
      updateData.blockTournaments = restrictions.blockTournaments;
    }
    if (restrictions.blockWalletDeposits !== undefined) {
      updateData.blockWalletDeposits = restrictions.blockWalletDeposits;
    }
    if (restrictions.blockWalletWithdrawals !== undefined) {
      updateData.blockWalletWithdrawals = restrictions.blockWalletWithdrawals;
    }
    if (restrictions.moderationNote !== undefined) {
      // Permettre de définir null pour effacer la note
      updateData.moderationNote = restrictions.moderationNote || null;
    }

    const updatedPlayer = await this.prisma.player.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        countryCode: true,
        role: true,
        isActive: true,
        blockTournaments: true,
        blockWalletDeposits: true,
        blockWalletWithdrawals: true,
        moderationNote: true,
        createdAt: true,
      },
    });

    return updatedPlayer;
  }
}
