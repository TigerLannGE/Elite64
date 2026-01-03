import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Configuration SMTP Infomaniak
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    // Vérification des variables d'environnement
    if (!smtpHost || !smtpUser || !smtpPass) {
      console.error('⚠️ Configuration SMTP incomplète:');
      console.error(`  SMTP_HOST: ${smtpHost ? '✓' : '✗'}`);
      console.error(`  SMTP_USER: ${smtpUser ? '✓' : '✗'}`);
      console.error(`  SMTP_PASS: ${smtpPass ? '✓' : '✗'}`);
      console.error('  Veuillez configurer les variables SMTP dans votre fichier .env');
    }

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true pour 465, false pour les autres ports
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      // Options supplémentaires pour Infomaniak
      tls: {
        rejectUnauthorized: false, // Accepte les certificats auto-signés si nécessaire
      },
    });

    // Test de la connexion au démarrage (optionnel, en mode développement)
    if (process.env.NODE_ENV === 'development') {
      this.verifyConnection().catch((error) => {
        console.warn('⚠️ Impossible de vérifier la connexion SMTP:', error.message);
      });
    }
  }

  private async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      console.log('✓ Connexion SMTP vérifiée avec succès');
    } catch (error) {
      console.error('✗ Erreur de connexion SMTP:', error);
      throw error;
    }
  }

  async sendEmailVerificationMail(playerEmail: string, token: string): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;
    const fromEmail = process.env.SMTP_FROM || 'ChessBet <no-reply@chessbet.com>';

    const mailOptions = {
      from: fromEmail,
      to: playerEmail,
      subject: 'Vérifiez votre adresse e-mail - ChessBet',
      html: `
        <h1>Bienvenue sur ChessBet !</h1>
        <p>Merci de vous être inscrit. Veuillez vérifier votre adresse e-mail en cliquant sur le lien ci-dessous :</p>
        <p><a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Vérifier mon e-mail</a></p>
        <p>Ou copiez ce lien dans votre navigateur :</p>
        <p>${verificationUrl}</p>
        <p>Ce lien expire dans 24 heures.</p>
        <p>Si vous n'avez pas créé de compte, ignorez cet e-mail.</p>
      `,
      text: `
        Bienvenue sur ChessBet !
        
        Merci de vous être inscrit. Veuillez vérifier votre adresse e-mail en visitant ce lien :
        ${verificationUrl}
        
        Ce lien expire dans 24 heures.
        
        Si vous n'avez pas créé de compte, ignorez cet e-mail.
      `,
    };

    try {
      console.log(`📧 Tentative d'envoi d'email de vérification à: ${playerEmail}`);
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✓ Email de vérification envoyé avec succès. Message ID: ${info.messageId}`);
    } catch (error) {
      console.error("✗ Erreur lors de l'envoi de l'e-mail de vérification:");
      console.error('  Détails:', error);
      if (error.code) {
        console.error(`  Code d'erreur: ${error.code}`);
      }
      if (error.response) {
        console.error(`  Réponse serveur: ${error.response}`);
      }
      throw new Error(`Failed to send verification email: ${error.message || 'Unknown error'}`);
    }
  }

  async sendPasswordResetMail(playerEmail: string, token: string): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
    const fromEmail = process.env.SMTP_FROM || 'ChessBet <no-reply@chessbet.com>';

    const mailOptions = {
      from: fromEmail,
      to: playerEmail,
      subject: 'Réinitialisation de votre mot de passe - ChessBet',
      html: `
        <h1>Réinitialisation de mot de passe</h1>
        <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le lien ci-dessous pour continuer :</p>
        <p><a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Réinitialiser mon mot de passe</a></p>
        <p>Ou copiez ce lien dans votre navigateur :</p>
        <p>${resetUrl}</p>
        <p>Ce lien expire dans 1 heure.</p>
        <p>Si vous n'avez pas demandé de réinitialisation, ignorez cet e-mail. Votre mot de passe ne sera pas modifié.</p>
      `,
      text: `
        Réinitialisation de mot de passe
        
        Vous avez demandé à réinitialiser votre mot de passe. Visitez ce lien pour continuer :
        ${resetUrl}
        
        Ce lien expire dans 1 heure.
        
        Si vous n'avez pas demandé de réinitialisation, ignorez cet e-mail. Votre mot de passe ne sera pas modifié.
      `,
    };

    try {
      console.log(`📧 Tentative d'envoi d'email de réinitialisation à: ${playerEmail}`);
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✓ Email de réinitialisation envoyé avec succès. Message ID: ${info.messageId}`);
    } catch (error) {
      console.error("✗ Erreur lors de l'envoi de l'e-mail de réinitialisation:");
      console.error('  Détails:', error);
      if (error.code) {
        console.error(`  Code d'erreur: ${error.code}`);
      }
      if (error.response) {
        console.error(`  Réponse serveur: ${error.response}`);
      }
      throw new Error(`Failed to send password reset email: ${error.message || 'Unknown error'}`);
    }
  }
}
