import { defineConfig, devices } from '@playwright/test'

/**
 * Configuration Playwright pour tests UI E2E
 * Phase 6.2.B - Tests UI E2E
 * 
 * Configuration adaptée à Next.js avec :
 * - baseURL configurable via env (PLAYWRIGHT_BASE_URL)
 * - retries = 1 ou 2 selon l'environnement
 * - trace activée en cas d'échec
 * - Chromium uniquement
 */
export default defineConfig({
  // Dossier contenant les tests
  testDir: './tests/e2e',

  // Exécution en parallèle (améliore les performances)
  fullyParallel: true,

  // Désactiver les tests .only() en CI
  forbidOnly: !!process.env.CI,

  // Retries : 2 en CI, 1 en local (évite les tests flaky)
  retries: process.env.CI ? 2 : 1,

  // Workers : 1 en CI pour stabilité, parallèle en local
  workers: process.env.CI ? 1 : undefined,

  // Reporter : HTML pour visualisation, list pour CI
  reporter: process.env.CI ? 'list' : [['html', { outputFolder: 'playwright-report' }], ['list']],

  // Configuration partagée pour tous les tests
  use: {
    // baseURL configurable via env (défaut: http://localhost:3000)
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',

    // Trace activée uniquement en cas d'échec (pour debugging)
    trace: 'on-first-retry',

    // Screenshot uniquement en cas d'échec
    screenshot: 'only-on-failure',

    // Vidéo uniquement en cas d'échec (retain pour garder les vidéos)
    video: 'retain-on-failure',

    // Timeout par action (30s par défaut, augmenté pour stabilité)
    actionTimeout: 10000,

    // Timeout de navigation (30s par défaut)
    navigationTimeout: 30000,
  },

  // Projets (navigateurs) : Chromium uniquement
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Serveur web local (Next.js dev server)
  // Démarré automatiquement avant les tests si non déjà démarré
  webServer: {
    command: 'npm run dev',
    url: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    reuseExistingServer: !process.env.CI, // Réutiliser le serveur existant en local
    timeout: 120 * 1000, // 2 minutes pour démarrer
    stdout: 'ignore', // Ignorer les logs du serveur
    stderr: 'pipe', // Capturer les erreurs
  },
})

