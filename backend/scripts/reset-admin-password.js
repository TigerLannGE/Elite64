#!/usr/bin/env node
/**
 * Script pour réinitialiser le mot de passe admin
 * Usage: node reset-admin-password.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'florian.lantigner@ik.me';
const NEW_PASSWORD = process.env.NEW_PASSWORD || 'Elite6424!';

async function main() {
  console.log('🔐 Réinitialisation du mot de passe admin...\n');
  console.log(`Email: ${ADMIN_EMAIL}`);
  console.log(`Nouveau mot de passe: ${NEW_PASSWORD}\n`);

  try {
    // 1. Vérifier que le joueur existe
    const player = await prisma.player.findUnique({
      where: { email: ADMIN_EMAIL },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isActive: true,
      },
    });

    if (!player) {
      console.error(`❌ Aucun compte trouvé avec l'email: ${ADMIN_EMAIL}`);
      process.exit(1);
    }

    console.log('✅ Compte trouvé:');
    console.log(`   ID: ${player.id}`);
    console.log(`   Username: ${player.username}`);
    console.log(`   Role: ${player.role}`);
    console.log(`   Active: ${player.isActive}\n`);

    // 2. Hasher le nouveau mot de passe
    console.log('🔒 Hashing du nouveau mot de passe...');
    const hashedPassword = await bcrypt.hash(NEW_PASSWORD, 10);
    console.log('✅ Hash généré\n');

    // 3. Mettre à jour le mot de passe
    console.log('💾 Mise à jour du mot de passe...');
    await prisma.player.update({
      where: { email: ADMIN_EMAIL },
      data: { passwordHash: hashedPassword },
    });

    console.log('✅ Mot de passe mis à jour avec succès!\n');
    console.log('🎉 Vous pouvez maintenant vous connecter avec:');
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Mot de passe: ${NEW_PASSWORD}\n`);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

