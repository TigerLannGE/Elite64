// Ce fichier doit être importé en PREMIER dans main.ts
// pour charger les variables d'environnement avant l'instanciation des modules

import * as dotenv from 'dotenv';
import { resolve, join } from 'path';

// Déterminer le chemin du fichier .env
// En mode compilé, __dirname pointe vers dist/config/, donc on remonte jusqu'à backend/
// En mode dev (ts-node), __dirname pointe vers src/config/
const isCompiled = __dirname.includes('dist');
const backendRoot = isCompiled
  ? resolve(__dirname, '../..') // dist/config -> backend/
  : resolve(__dirname, '../..'); // src/config -> backend/

// Essayer plusieurs emplacements possibles
const envPaths = [
  join(backendRoot, '.env'), // backend/.env (recommandé)
  resolve(process.cwd(), '.env'), // Racine du workspace
  resolve(process.cwd(), 'backend', '.env'), // workspace/backend/.env
];

let envLoaded = false;
let loadedPath = '';

for (const envPath of envPaths) {
  const result = dotenv.config({ path: envPath });
  if (!result.error) {
    envLoaded = true;
    loadedPath = envPath;
    console.log('✓ Fichier .env chargé depuis:', envPath);
    break;
  }
}

if (!envLoaded) {
  console.warn('⚠️ Fichier .env non trouvé dans les emplacements suivants:');
  envPaths.forEach((path) => console.warn(`   - ${path}`));
  console.warn('   Créez un fichier .env dans backend/.env ou copiez env.example');
}

// Afficher les variables SMTP chargées (sans le mot de passe) pour debug
console.log('\n📋 Variables d\'environnement chargées:');
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
  if (loadedPath) {
    console.warn(`   Fichier .env trouvé à: ${loadedPath}`);
  } else {
    console.warn('   Emplacements recherchés:');
    envPaths.forEach((path) => console.warn(`     - ${path}`));
  }
}

