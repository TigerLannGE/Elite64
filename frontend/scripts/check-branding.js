#!/usr/bin/env node

/**
 * Script de vérification du branding public
 * 
 * Vérifie qu'aucune occurrence de "ChessBet" n'existe dans les surfaces publiques.
 * Utilisé comme garde-fou anti-régression pour le branding.
 * 
 * Usage: npm run branding:scan
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const PUBLIC_PATHS = [
  'frontend/pages',
  'frontend/components',
  'frontend/public',
  'backend/src/mail',
  'backend/src/modules',
];

const EXCLUDE_PATTERNS = [
  'node_modules',
  '.next',
  'dist',
  'test-results',
  'playwright-report',
];

function checkBranding() {
  console.log('🔍 Vérification du branding public...\n');
  
  let hasErrors = false;
  const errors = [];

  for (const publicPath of PUBLIC_PATHS) {
    const fullPath = path.join(process.cwd(), '..', publicPath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  Chemin non trouvé: ${publicPath}`);
      continue;
    }

    try {
      // Construire la commande grep avec exclusions
      const excludeArgs = EXCLUDE_PATTERNS.map(p => `--exclude-dir=${p}`).join(' ');
      const command = `grep -ri "ChessBet\\|Chessbet\\|chessbet" "${fullPath}" ${excludeArgs} 2>/dev/null || true`;
      
      const result = execSync(command, { 
        encoding: 'utf-8',
        cwd: path.join(process.cwd(), '..'),
        shell: '/bin/bash'
      });

      if (result.trim()) {
        hasErrors = true;
        const matches = result.trim().split('\n').filter(line => line.trim());
        errors.push({
          path: publicPath,
          matches: matches
        });
      } else {
        console.log(`✅ ${publicPath}: Aucune occurrence trouvée`);
      }
    } catch (error) {
      // Sur Windows, grep peut ne pas être disponible, utiliser une alternative
      console.log(`⚠️  Impossible de scanner ${publicPath} (grep non disponible ou erreur)`);
    }
  }

  console.log('\n');

  if (hasErrors) {
    console.error('❌ ERREUR: Occurrences de "ChessBet" trouvées dans les surfaces publiques:\n');
    errors.forEach(({ path, matches }) => {
      console.error(`📁 ${path}:`);
      matches.forEach(match => {
        console.error(`   ${match}`);
      });
      console.error('');
    });
    console.error('🚫 Le branding public doit utiliser exclusivement "Elite64" ou "Elite64 – Competitive Chess Arena"');
    process.exit(1);
  } else {
    console.log('✅ Aucune occurrence de "ChessBet" trouvée dans les surfaces publiques');
    console.log('✅ Le branding public est conforme au Document 00 – Chef de projet (Arbitrage B)');
    process.exit(0);
  }
}

// Version Windows-compatible avec recherche de fichiers
function checkBrandingWindows() {
  console.log('🔍 Vérification du branding public (Windows)...\n');
  
  let hasErrors = false;
  const errors = [];

  for (const publicPath of PUBLIC_PATHS) {
    const fullPath = path.join(process.cwd(), '..', publicPath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  Chemin non trouvé: ${publicPath}`);
      continue;
    }

    try {
      // Recherche récursive dans les fichiers
      const files = findFiles(fullPath, ['.ts', '.tsx', '.js', '.jsx', '.json', '.html', '.txt']);
      const matches = [];

      for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8');
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
          if (/ChessBet|Chessbet|chessbet/i.test(line)) {
            matches.push(`${file}:${index + 1}: ${line.trim()}`);
          }
        });
      }

      if (matches.length > 0) {
        hasErrors = true;
        errors.push({
          path: publicPath,
          matches: matches
        });
      } else {
        console.log(`✅ ${publicPath}: Aucune occurrence trouvée`);
      }
    } catch (error) {
      console.log(`⚠️  Erreur lors du scan de ${publicPath}: ${error.message}`);
    }
  }

  console.log('\n');

  if (hasErrors) {
    console.error('❌ ERREUR: Occurrences de "ChessBet" trouvées dans les surfaces publiques:\n');
    errors.forEach(({ path, matches }) => {
      console.error(`📁 ${path}:`);
      matches.slice(0, 10).forEach(match => {
        console.error(`   ${match}`);
      });
      if (matches.length > 10) {
        console.error(`   ... et ${matches.length - 10} autres occurrences`);
      }
      console.error('');
    });
    console.error('🚫 Le branding public doit utiliser exclusivement "Elite64" ou "Elite64 – Competitive Chess Arena"');
    process.exit(1);
  } else {
    console.log('✅ Aucune occurrence de "ChessBet" trouvée dans les surfaces publiques');
    console.log('✅ Le branding public est conforme au Document 00 – Chef de projet (Arbitrage B)');
    process.exit(0);
  }
}

function findFiles(dir, extensions, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Exclure les dossiers à ignorer
      if (!EXCLUDE_PATTERNS.some(pattern => filePath.includes(pattern))) {
        findFiles(filePath, extensions, fileList);
      }
    } else if (stat.isFile()) {
      const ext = path.extname(file);
      if (extensions.includes(ext)) {
        fileList.push(filePath);
      }
    }
  });

  return fileList;
}

// Détecter le système d'exploitation
const isWindows = process.platform === 'win32';

if (isWindows) {
  checkBrandingWindows();
} else {
  checkBranding();
}

