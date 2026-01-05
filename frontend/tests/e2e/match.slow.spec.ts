import { test, expect } from './fixtures/auth'
import { seedMatch } from './fixtures/seedMatch'

/**
 * Tests E2E "slow" - Phase 6.2.B
 *
 * Tests qui nécessitent des délais réels (ex: NO_SHOW timeout).
 * Ces tests ne sont PAS inclus dans la suite rapide/CI.
 *
 * Pour exécuter uniquement ces tests :
 * E2E=1 npx playwright test tests/e2e/match.slow.spec.ts
 */
test.describe('Match Slow E2E', () => {
  test('should resolve NO_SHOW after 90 seconds when only one player joins @slow', async ({
    request,
    browser,
  }) => {
    // Timeout du test : 130s (90s backend + 40s marge pour polling et latence)
    test.setTimeout(130000)
    // Créer un match de test avec un seul joueur qui rejoint
    const seeded = await seedMatch(request, {
      joinSecondPlayer: false, // Ne pas faire rejoindre le 2e joueur
    })

    // Déterminer quel joueur a rejoint (blanc ou noir)
    const joinedPlayerToken =
      seeded.matchState.whitePlayerId === seeded.whitePlayerId
        ? seeded.whitePlayerToken
        : seeded.blackPlayerToken

    // Créer un contexte authentifié pour le joueur qui a rejoint
    const joinedContext = await browser.newContext({
      storageState: {
        cookies: [],
        origins: [
          {
            origin: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
            localStorage: [
              {
                name: 'authToken',
                value: joinedPlayerToken,
              },
            ],
          },
        ],
      },
    })

    const joinedPage = await joinedContext.newPage()
    await joinedPage.goto(`/matches/${seeded.matchId}`)

    // Vérifier que la page se charge
    await expect(joinedPage.getByTestId('chessboard')).toBeVisible()

    // Le backend résout NO_SHOW de manière "lazy" via /state|/join|/move
    // Le frontend fait déjà du polling sur /state toutes les 2 secondes
    // On attend que le statut change à FINISHED avec resultReason NO_SHOW
    // Timeout: 120000ms (2 minutes) pour laisser le temps au backend (90s + marge)

    const statusBadge = joinedPage.getByTestId('status-badge')

    // Attendre que le statut change à FINISHED
    await expect
      .poll(
        async () => {
          try {
            const isVisible = await statusBadge.isVisible()
            if (!isVisible) return false

            const statusText = await statusBadge.textContent()
            // Vérifier que le statut indique "Terminé" ou "Finished"
            return (
              statusText &&
              (statusText.toLowerCase().includes('terminé') ||
                statusText.toLowerCase().includes('finished') ||
                statusText.toLowerCase().includes('fini'))
            )
          } catch {
            return false
          }
        },
        {
          timeout: 120000, // 2 minutes (90s backend + marge)
          intervals: [2000], // Vérifier toutes les 2 secondes (fréquence du polling)
        }
      )
      .toBeTruthy()

    // Vérifier que le statut badge est visible et indique "Terminé"
    await expect(statusBadge).toBeVisible()
    const statusText = await statusBadge.textContent()
    expect(statusText).toMatch(/terminé|finished|fini/i)

    // Vérifier que resultReason contient NO_SHOW (si affiché dans l'UI)
    // Le resultReason est affiché dans un <span> séparé après le status-badge
    // On cherche dans toute la page pour être sûr
    const pageContent = await joinedPage.textContent('body')
    expect(pageContent).toMatch(/NO_SHOW/i)

    await joinedContext.close()
  })
})

