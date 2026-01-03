import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlayerDto } from './dto/create-player.dto';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

@Injectable()
export class PlayersService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async create(createPlayerDto: CreatePlayerDto) {
    const { username, email, password, countryCode, dateOfBirth } = createPlayerDto;

    // Vérifier l'âge minimum (18 ans)
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 18) {
      throw new BadRequestException('You must be at least 18 years old to register.');
    }

    // Vérifier si le username existe déjà
    const existingUsername = await this.prisma.player.findUnique({
      where: { username },
    });

    if (existingUsername) {
      throw new ConflictException(`Le nom d'utilisateur "${username}" est déjà pris`);
    }

    // Vérifier si l'email existe déjà
    const existingEmail = await this.prisma.player.findUnique({
      where: { email },
    });

    if (existingEmail) {
      throw new ConflictException(`L'email "${email}" est déjà utilisé`);
    }

    // Hasher le mot de passe
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Générer un token de vérification d'email
    const emailVerificationToken = randomBytes(32).toString('hex');
    const emailVerificationExpiresAt = new Date();
    emailVerificationExpiresAt.setHours(emailVerificationExpiresAt.getHours() + 24); // Expire dans 24h

    // Créer le joueur et son wallet en une transaction
    const player = await this.prisma.$transaction(async (tx) => {
      const newPlayer = await tx.player.create({
        data: {
          username,
          email,
          passwordHash,
          countryCode,
          dateOfBirth: birthDate,
          elo: 1200, // Elo initial par défaut
          kycStatus: 'PENDING',
          isActive: true,
          isEmailVerified: false,
          emailVerificationToken,
          emailVerificationExpiresAt,
        },
      });

      // Créer le wallet associé avec un solde initial de 0
      await tx.wallet.create({
        data: {
          playerId: newPlayer.id,
          balanceCents: 0,
          currency: 'EUR',
        },
      });

      return newPlayer;
    });

    // Envoyer l'email de vérification (ne bloque pas la création du compte)
    try {
      await this.mailService.sendEmailVerificationMail(player.email, emailVerificationToken);
    } catch (error) {
      console.error("Erreur lors de l'envoi de l'email de vérification:", error);
      // On continue quand même pour ne pas bloquer la création du compte
    }

    // Retourner le joueur sans le passwordHash
    const { passwordHash: _passwordHash, ...playerWithoutPassword } = player;
    void _passwordHash;
    return playerWithoutPassword;
  }

  async findOne(id: string) {
    const player = await this.prisma.player.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        countryCode: true,
        elo: true,
        kycStatus: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!player) {
      throw new NotFoundException(`Joueur avec l'ID "${id}" introuvable`);
    }

    return player;
  }

  async findAll(skip = 0, take = 50) {
    const [players, total] = await Promise.all([
      this.prisma.player.findMany({
        skip,
        take,
        select: {
          id: true,
          username: true,
          email: true,
          countryCode: true,
          elo: true,
          kycStatus: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.player.count(),
    ]);

    return {
      data: players,
      total,
      skip,
      take,
    };
  }
}
