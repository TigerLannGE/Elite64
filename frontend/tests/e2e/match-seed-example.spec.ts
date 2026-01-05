import { test, expect } from '@playwright/test'
import { seedMatch } from './fixtures/seedMatch'

/**
 * Exemple de test utilisant la fixture seedMatch
 * Phase 6.2.B - Tests UI E2E
 * 
 * Ce test démontre comment utiliser seedMatch pour créer un match de test
 * et tester l'interface utilisateur avec des données réelles.
 */
test.describe('Match Seed Example', () => {
  test('should create a match and access it', async ({ request, page }) => {
    // Créer un match de test via API
    const seeded = await seedMatch(request)

    // Vérifier que le match a été créé
    expect(seeded.matchId).toBeTruthy()
    expect(seeded.tournamentId).toBeTruthy()
    expect(seeded.whitePlayerToken).toBeTruthy()
    expect(seeded.blackPlayerToken).toBeTruthy()

    // Naviguer vers le match (sans authentification pour l'instant)
    // Note: Pour un test complet, utiliser authenticatedPagePlayer1
    await page.goto(`/matches/${seeded.matchId}`)

    // Vérifier que la page se charge
    await expect(page).toHaveTitle(/Elite64/i)
  })
})

