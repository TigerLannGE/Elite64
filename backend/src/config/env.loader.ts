// Ce fichier doit être importé en PREMIER dans main.ts
// pour charger les variables d'environnement avant l'instanciation des modules

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Charger le fichier .env depuis la racine du projet
const envPath = resolve(__dirname, '../../.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.warn('⚠️ Fichier .env non trouvé à:', envPath);
  console.warn('   Tentative de chargement depuis le dossier backend...');
  // Essayer aussi depuis le dossier backend
  const backendEnvPath = resolve(__dirname, '../.env');
  const backendResult = dotenv.config({ path: backendEnvPath });
  if (backendResult.error) {
    console.error('✗ Impossible de charger le fichier .env');
  } else {
    console.log('✓ Fichier .env chargé depuis:', backendEnvPath);
  }
} else {
  console.log('✓ Fichier .env chargé depuis:', envPath);
}

// Afficher les variables SMTP chargées (sans le mot de passe) pour debug
console.log("\n📋 Variables d'environnement chargées:");
console.log(`  SMTP_HOST: ${process.env.SMTP_HOST || 'NON DÉFINI'}`);
console.log(`  SMTP_PORT: ${process.env.SMTP_PORT || 'NON DÉFINI'}`);
console.log(`  SMTP_USER: ${process.env.SMTP_USER || 'NON DÉFINI'}`);
console.log(`  SMTP_PASS: ${process.env.SMTP_PASS ? '***' : 'NON DÉFINI'}`);
console.log(`  FRONTEND_URL: ${process.env.FRONTEND_URL || 'NON DÉFINI'}`);
console.log(`  DATABASE_URL: ${process.env.DATABASE_URL ? '✓' : '✗'}`);
console.log('');

if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
  console.warn('⚠️ Variables SMTP manquantes !');
  console.warn('   Vérifiez que votre fichier .env contient:');
  console.warn('   SMTP_HOST=mail.infomaniak.com');
  console.warn('   SMTP_PORT=587');
  console.warn('   SMTP_USER=votre-email@votre-domaine.com');
  console.warn('   SMTP_PASS=votre-mot-de-passe');
  console.warn(`   Fichier recherché: ${envPath}`);
}
