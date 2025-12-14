import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import { JwtPayload } from './types/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Trouver le joueur par email
    const player = await this.prisma.player.findUnique({
      where: { email },
    });

    if (!player) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Vérifier que l'email est vérifié
    if (!player.isEmailVerified) {
      throw new UnauthorizedException('Please verify your email before logging in.');
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, player.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Vérifier que le compte n'est pas suspendu
    if (!player.isActive) {
      throw new ForbiddenException({
        code: 'ACCOUNT_SUSPENDED',
        message: "Votre compte a été suspendu. Contactez le support si vous pensez qu'il s'agit d'une erreur.",
      });
    }

    // Générer le token JWT
    const payload: JwtPayload = { 
      sub: player.id, 
      email: player.email, 
      username: player.username,
      role: player.role,
    };
    const accessToken = this.jwtService.sign(payload);

    // Retourner les informations du joueur (sans passwordHash) et le token
    const { passwordHash: _, ...playerWithoutPassword } = player;
    return {
      accessToken,
      player: playerWithoutPassword,
    };
  }

  async getProfile(playerId: string) {
    const player = await this.prisma.player.findUnique({
      where: { id: playerId },
      select: {
        id: true,
        username: true,
        email: true,
        countryCode: true,
        dateOfBirth: true,
        elo: true,
        kycStatus: true,
        role: true,
        isActive: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!player) {
      throw new NotFoundException('Player not found');
    }

    return player;
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto) {
    const { token } = verifyEmailDto;

    const player = await this.prisma.player.findUnique({
      where: { emailVerificationToken: token },
    });

    if (!player) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    // Vérifier que le token n'est pas expiré
    if (player.emailVerificationExpiresAt && player.emailVerificationExpiresAt < new Date()) {
      throw new BadRequestException('Verification token has expired');
    }

    // Mettre à jour le joueur
    await this.prisma.player.update({
      where: { id: player.id },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiresAt: null,
      },
    });

    return { message: 'Email verified successfully' };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    const player = await this.prisma.player.findUnique({
      where: { email },
    });

    // Pour éviter de leak l'existence du compte, on renvoie toujours le même message
    if (!player) {
      return {
        message: 'If an account exists for this email, a reset link has been sent.',
      };
    }

    // Générer un token de réinitialisation
    const resetToken = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Expire dans 1 heure

    // Sauvegarder le token
    await this.prisma.player.update({
      where: { id: player.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpiresAt: expiresAt,
      },
    });

    // Envoyer l'email
    try {
      await this.mailService.sendPasswordResetMail(player.email, resetToken);
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email de réinitialisation:', error);
      // On continue quand même pour ne pas leak l'existence du compte
    }

    return {
      message: 'If an account exists for this email, a reset link has been sent.',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, newPassword } = resetPasswordDto;

    const player = await this.prisma.player.findUnique({
      where: { passwordResetToken: token },
    });

    if (!player) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Vérifier que le token n'est pas expiré
    if (player.passwordResetExpiresAt && player.passwordResetExpiresAt < new Date()) {
      throw new BadRequestException('Reset token has expired');
    }

    // Hasher le nouveau mot de passe
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Mettre à jour le mot de passe et vider les tokens
    await this.prisma.player.update({
      where: { id: player.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
      },
    });

    return { message: 'Password reset successfully' };
  }

  /**
   * Génère un token de vérification d'email et envoie l'email
   * Utilisé lors de la création d'un compte
   */
  async generateAndSendEmailVerification(playerId: string, playerEmail: string): Promise<void> {
    const verificationToken = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Expire dans 24 heures

    await this.prisma.player.update({
      where: { id: playerId },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationExpiresAt: expiresAt,
      },
    });

    try {
      await this.mailService.sendEmailVerificationMail(playerEmail, verificationToken);
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email de vérification:', error);
      // On ne throw pas pour ne pas bloquer la création du compte
    }
  }
}

