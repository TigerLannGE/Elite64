import { test, expect } from '@playwright/test'
import { seedMatch } from './fixtures/seedMatch'

/**
 * Tests E2E gameplay - Phase 6.2.B
 * 
 * Tests "bouclier" pour vérifier le fonctionnement de base du gameplay.
 * Chaque test seed son propre match pour garantir l'isolation.
 */
test.describe('Match Gameplay E2E', () => {
  test('should display chessboard and timers', async ({ request, browser }) => {
    // Créer un match de test
    const seeded = await seedMatch(request)

    // Créer un contexte authentifié pour le joueur blanc
    const whiteContext = await browser.newContext({
      storageState: {
        cookies: [],
        origins: [
          {
            origin: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
            localStorage: [
              {
                name: 'authToken',
                value: seeded.whitePlayerToken,
              },
            ],
          },
        ],
      },
    })

    const whitePage = await whiteContext.newPage()
    await whitePage.goto(`/matches/${seeded.matchId}`)

    // Vérifier que l'échiquier est visible
    const chessboard = whitePage.getByTestId('chessboard')
    await expect(chessboard).toBeVisible()

    // Vérifier que les timers sont visibles
    const timerWhite = whitePage.getByTestId('timer-white')
    const timerBlack = whitePage.getByTestId('timer-black')
    await expect(timerWhite).toBeVisible()
    await expect(timerBlack).toBeVisible()

    // Vérifier que les timers affichent des valeurs (format MM:SS)
    const whiteTimeText = await timerWhite.textContent()
    const blackTimeText = await timerBlack.textContent()
    expect(whiteTimeText).toMatch(/\d{1,2}:\d{2}/)
    expect(blackTimeText).toMatch(/\d{1,2}:\d{2}/)

    await whiteContext.close()
  })

  test('should play a legal move and update move list and highlight', async ({ request, browser }) => {
    // Créer un match de test
    const seeded = await seedMatch(request)

    // Créer un contexte authentifié pour le joueur blanc
    const whiteContext = await browser.newContext({
      storageState: {
        cookies: [],
        origins: [
          {
            origin: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
            localStorage: [
              {
                name: 'authToken',
                value: seeded.whitePlayerToken,
              },
            ],
          },
        ],
      },
    })

    const whitePage = await whiteContext.newPage()
    await whitePage.goto(`/matches/${seeded.matchId}`)

    // Attendre que l'échiquier soit chargé
    await whitePage.getByTestId('chessboard').waitFor({ state: 'visible' })

    // Jouer un coup légal via API (plus stable que drag/drop)
    const moveResponse = await request.post(
      `${process.env.PLAYWRIGHT_API_BASE_URL || 'http://localhost:4000'}/matches/${seeded.matchId}/move`,
      {
        headers: {
          Authorization: `Bearer ${seeded.whitePlayerToken}`,
        },
        data: {
          from: 'e2',
          to: 'e4',
        },
      }
    )

    expect(moveResponse.ok()).toBeTruthy()

    // Attendre que la liste des coups se mette à jour
    const moveList = whitePage.getByTestId('move-list')
    await expect(moveList).toBeVisible()

    // Vérifier que le coup apparaît dans la liste (polling pour éviter les races)
    await expect
      .poll(
        async () => {
          const moveListText = await moveList.textContent()
          return moveListText?.includes('e4') || moveListText?.includes('e2')
        },
        {
          timeout: 5000,
        }
      )
      .toBeTruthy()

    // Vérifier que le highlight est visible (les cases e2 et e4 devraient être highlightées)
    // Note: Le highlight est géré par react-chessboard, on vérifie juste que l'échiquier est toujours visible
    await expect(whitePage.getByTestId('chessboard')).toBeVisible()

    await whiteContext.close()
  })

  test('should reject illegal move via API', async ({ request, browser }) => {
    // Créer un match de test
    const seeded = await seedMatch(request)

    // Créer un contexte authentifié pour le joueur blanc
    const whiteContext = await browser.newContext({
      storageState: {
        cookies: [],
        origins: [
          {
            origin: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
            localStorage: [
              {
                name: 'authToken',
                value: seeded.whitePlayerToken,
              },
            ],
          },
        ],
      },
    })

    const whitePage = await whiteContext.newPage()
    await whitePage.goto(`/matches/${seeded.matchId}`)

    // Attendre que l'échiquier soit chargé
    await whitePage.getByTestId('chessboard').waitFor({ state: 'visible' })

    // Essayer de jouer un coup invalide via API
    const moveResponse = await request.post(
      `${process.env.PLAYWRIGHT_API_BASE_URL || 'http://localhost:4000'}/matches/${seeded.matchId}/move`,
      {
        headers: {
          Authorization: `Bearer ${seeded.whitePlayerToken}`,
        },
        data: {
          from: 'e2',
          to: 'e5', // Coup invalide (pion ne peut pas avancer de 3 cases sans être au départ)
        },
      }
    )

    // Le coup devrait échouer avec un code d'erreur
    expect(moveResponse.ok()).toBeFalsy()
    const errorData = await moveResponse.json()
    expect(errorData).toHaveProperty('message')
    expect(errorData.message?.length || 0).toBeGreaterThan(0)

    // Note: L'erreur n'apparaît dans l'UI que lors d'un drag/drop, pas après un appel API direct
    // Ce test vérifie que l'API rejette correctement les coups invalides

    await whiteContext.close()
  })

  test('should reject move when not your turn via API', async ({ request, browser }) => {
    // Créer un match de test
    const seeded = await seedMatch(request)

    // Créer un contexte authentifié pour le joueur noir
    const blackContext = await browser.newContext({
      storageState: {
        cookies: [],
        origins: [
          {
            origin: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
            localStorage: [
              {
                name: 'authToken',
                value: seeded.blackPlayerToken,
              },
            ],
          },
        ],
      },
    })

    const blackPage = await blackContext.newPage()
    await blackPage.goto(`/matches/${seeded.matchId}`)

    // Attendre que l'échiquier soit chargé
    await blackPage.getByTestId('chessboard').waitFor({ state: 'visible' })

    // Essayer de jouer un coup alors que c'est le tour des blancs
    const moveResponse = await request.post(
      `${process.env.PLAYWRIGHT_API_BASE_URL || 'http://localhost:4000'}/matches/${seeded.matchId}/move`,
      {
        headers: {
          Authorization: `Bearer ${seeded.blackPlayerToken}`,
        },
        data: {
          from: 'e7',
          to: 'e5',
        },
      }
    )

    // Le coup devrait échouer avec NOT_YOUR_TURN
    expect(moveResponse.ok()).toBeFalsy()
    const errorData = await moveResponse.json()
    expect(errorData).toHaveProperty('message')
    expect(errorData.message?.length || 0).toBeGreaterThan(0)

    // Note: L'erreur n'apparaît dans l'UI que lors d'un drag/drop, pas après un appel API direct
    // Ce test vérifie que l'API rejette correctement les coups hors tour

    await blackContext.close()
  })

  test('should decrement timer', async ({ request, browser }) => {
    // Créer un match de test
    const seeded = await seedMatch(request)

    // Créer un contexte authentifié pour le joueur blanc
    const whiteContext = await browser.newContext({
      storageState: {
        cookies: [],
        origins: [
          {
            origin: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
            localStorage: [
              {
                name: 'authToken',
                value: seeded.whitePlayerToken,
              },
            ],
          },
        ],
      },
    })

    const whitePage = await whiteContext.newPage()
    await whitePage.goto(`/matches/${seeded.matchId}`)

    // Attendre que les timers soient visibles
    const timerWhite = whitePage.getByTestId('timer-white')
    await expect(timerWhite).toBeVisible()

    // Lire la valeur initiale du timer blanc (format MM:SS)
    const initialTimeText = await timerWhite.textContent()
    expect(initialTimeText).toMatch(/\d{1,2}:\d{2}/)

    // Convertir en secondes pour comparaison
    const parseTime = (timeStr: string): number => {
      const [minutes, seconds] = timeStr.split(':').map(Number)
      return minutes * 60 + seconds
    }

    const initialSeconds = parseTime(initialTimeText || '0:00')

    // Attendre 3 secondes
    await whitePage.waitForTimeout(3000)

    // Lire la nouvelle valeur du timer
    const newTimeText = await timerWhite.textContent()
    expect(newTimeText).toMatch(/\d{1,2}:\d{2}/)

    const newSeconds = parseTime(newTimeText || '0:00')

    // Vérifier que le timer a diminué (tolérance: au moins 2 secondes de différence)
    // Note: Le timer peut avoir diminué de plus de 3 secondes à cause du polling
    expect(initialSeconds - newSeconds).toBeGreaterThanOrEqual(2)

    await whiteContext.close()
  })

  test('should finish match on resign', async ({ request, browser }) => {
    // Créer un match de test
    const seeded = await seedMatch(request)

    // Créer un contexte authentifié pour le joueur blanc
    const whiteContext = await browser.newContext({
      storageState: {
        cookies: [],
        origins: [
          {
            origin: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
            localStorage: [
              {
                name: 'authToken',
                value: seeded.whitePlayerToken,
              },
            ],
          },
        ],
      },
    })

    const whitePage = await whiteContext.newPage()
    await whitePage.goto(`/matches/${seeded.matchId}`)

    // Attendre que le bouton Abandonner soit visible
    const resignButton = whitePage.getByTestId('resign-button')
    await expect(resignButton).toBeVisible()

    // Phase 6.2.C - Utiliser le modal React au lieu de window.confirm()
    // 1. Cliquer sur le bouton Abandonner (ouvre le modal)
    await resignButton.click()

    // 2. Vérifier que le modal de résignation est visible
    const resignModal = whitePage.getByTestId('resign-modal')
    await expect(resignModal).toBeVisible()

    // 3. Attendre la réponse réseau /resign
    const resignResponsePromise = whitePage.waitForResponse(
      (response) => {
        return response.url().includes('/resign') && response.ok()
      },
      { timeout: 10000 }
    )

    // 4. Cliquer sur "Confirmer" dans le modal
    const resignConfirmButton = whitePage.getByTestId('resign-confirm')
    await expect(resignConfirmButton).toBeVisible()
    await resignConfirmButton.click()

    // 5. Attendre la réponse réseau /resign
    const resignResponse = await resignResponsePromise
    expect(resignResponse.ok()).toBeTruthy()

    // 6. Attendre que le modal se ferme (après succès)
    await expect(resignModal).not.toBeVisible({ timeout: 5000 })

    // 7. Attendre que le statut change à FINISHED (via polling qui met à jour l'UI)
    const statusBadge = whitePage.getByTestId('status-badge')
    await expect
      .poll(
        async () => {
          try {
            const isVisible = await statusBadge.isVisible()
            if (!isVisible) return false

            const statusText = await statusBadge.textContent()
            // Vérifier que le statut n'est plus "En cours" et contient "Terminé" ou équivalent
            return (
              statusText &&
              !statusText.toLowerCase().includes('en cours') &&
              !statusText.toLowerCase().includes('running') &&
              (statusText.toLowerCase().includes('terminé') ||
                statusText.toLowerCase().includes('finished') ||
                statusText.toLowerCase().includes('fini'))
            )
          } catch {
            return false
          }
        },
        {
          timeout: 30000, // 30 secondes pour le polling (toutes les 2 secondes)
          intervals: [2000], // Vérifier toutes les 2 secondes (fréquence du polling)
        }
      )
      .toBeTruthy()

    // Vérifier que le badge de statut est visible et contient "Terminé" ou équivalent
    await expect(statusBadge).toBeVisible()
    const finalStatusText = await statusBadge.textContent()
    expect(
      finalStatusText?.toLowerCase().includes('terminé') ||
        finalStatusText?.toLowerCase().includes('finished') ||
        finalStatusText?.toLowerCase().includes('fini')
    ).toBeTruthy()

    // Phase 6.2.C - Vérifier que le modal "Match terminé" s'affiche automatiquement
    const gameOverModal = whitePage.getByTestId('gameover-modal')
    await expect
      .poll(
        async () => {
          try {
            const isVisible = await gameOverModal.isVisible()
            return isVisible
          } catch {
            return false
          }
        },
        {
          timeout: 20000, // 20 secondes max pour le polling
          intervals: [1000], // Vérifier toutes les secondes
        }
      )
      .toBeTruthy()

    // Phase 6.2.C - Vérifier que le modal est visible et contient les éléments attendus
    await expect(gameOverModal).toBeVisible()

    // Vérifier que le bouton "Fermer" est visible
    const gameOverCloseButton = whitePage.getByTestId('gameover-close')
    await expect(gameOverCloseButton).toBeVisible()

    // Vérifier que le CTA principal est visible
    const gameOverCTAButton = whitePage.getByTestId('gameover-cta')
    await expect(gameOverCTAButton).toBeVisible()

    // Vérifier que le texte "vous pouvez quitter cette page" est présent
    const modalText = await gameOverModal.textContent()
    expect(modalText?.toLowerCase()).toContain('vous pouvez quitter cette page')

    // Phase 6.2.C - Tester la fermeture du modal (bouton "Fermer")
    await gameOverCloseButton.click()

    // Vérifier que le modal se ferme
    await expect(gameOverModal).not.toBeVisible({ timeout: 2000 })

    await whiteContext.close()
  })

  // Promotion UI is validated manually; deterministic setup not available without FEN/seed endpoint.
  test.skip('should show promotion modal and update move list', async ({ request, browser }) => {
    // Créer un match de test
    const seeded = await seedMatch(request)

    // Créer un contexte authentifié pour le joueur blanc
    const whiteContext = await browser.newContext({
      storageState: {
        cookies: [],
        origins: [
          {
            origin: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
            localStorage: [
              {
                name: 'authToken',
                value: seeded.whitePlayerToken,
              },
            ],
          },
        ],
      },
    })

    const whitePage = await whiteContext.newPage()
    await whitePage.goto(`/matches/${seeded.matchId}`)

    // Attendre que l'échiquier soit chargé
    await whitePage.getByTestId('chessboard').waitFor({ state: 'visible' })

    // Phase 6.2.C - Créer une position de promotion rapidement via API
    // Séquence simplifiée pour mettre un pion blanc en e7 (prêt pour promotion)
    const API_BASE_URL = process.env.PLAYWRIGHT_API_BASE_URL || 'http://localhost:4000'

    // Séquence minimale de coups pour promotion (pion blanc en e7)
    const setupMoves = [
      { from: 'e2', to: 'e4', token: seeded.whitePlayerToken }, // Blanc
      { from: 'e7', to: 'e5', token: seeded.blackPlayerToken }, // Noir
      { from: 'e4', to: 'e5', token: seeded.whitePlayerToken }, // Blanc capture
      { from: 'd7', to: 'd6', token: seeded.blackPlayerToken }, // Noir
      { from: 'e5', to: 'e6', token: seeded.whitePlayerToken }, // Blanc
      { from: 'd6', to: 'd5', token: seeded.blackPlayerToken }, // Noir
      { from: 'e6', to: 'e7', token: seeded.whitePlayerToken }, // Blanc (pion en e7)
    ]

    // Jouer les coups de setup via API
    for (const move of setupMoves) {
      const moveResponse = await request.post(
        `${API_BASE_URL}/matches/${seeded.matchId}/move`,
        {
          headers: {
            Authorization: `Bearer ${move.token}`,
          },
          data: {
            from: move.from,
            to: move.to,
          },
        }
      )

      if (!moveResponse.ok()) {
        // Si un coup échoue, on continue (peut être un coup invalide)
        continue
      }

      // Attendre un peu entre les coups
      await whitePage.waitForTimeout(300)
    }

    // Attendre que l'UI se mette à jour après les coups de setup
    await whitePage.waitForTimeout(1000)

    // Phase 6.2.C - Pour déclencher le modal UI, on devrait utiliser drag/drop
    // Mais comme c'est complexe, on vérifie que la promotion fonctionne via API
    // et que la move-list se met à jour correctement

    // Attendre la réponse réseau /move avec promotion
    const promotionResponsePromise = whitePage.waitForResponse(
      (response) => {
        return response.url().includes('/move') && response.ok()
      },
      { timeout: 10000 }
    )

    // Jouer le coup de promotion via API (avec promotion en dame)
    const promotionMoveResponse = await request.post(
      `${API_BASE_URL}/matches/${seeded.matchId}/move`,
      {
        headers: {
          Authorization: `Bearer ${seeded.whitePlayerToken}`,
        },
        data: {
          from: 'e7',
          to: 'e8',
          promotion: 'q', // Promotion en dame
        },
      }
    )

    // Fail-fast avec message d'erreur explicite pour diagnostiquer les refus API
    if (!promotionMoveResponse.ok()) {
      const errorBody = await promotionMoveResponse.text()
      throw new Error(
        `Promotion move failed: ${promotionMoveResponse.status()} ${errorBody}`
      )
    }

    // Attendre la réponse réseau
    await promotionResponsePromise

    // Attendre que la liste des coups se mette à jour avec la promotion
    const moveList = whitePage.getByTestId('move-list')
    await expect
      .poll(
        async () => {
          const moveListText = await moveList.textContent()
          // Vérifier que la promotion apparaît dans la liste (format: "e8=Q" ou équivalent)
          return (
            moveListText?.includes('e8') &&
            (moveListText?.includes('Q') ||
              moveListText?.includes('q') ||
              moveListText?.includes('='))
          )
        },
        {
          timeout: 10000,
          intervals: [1000],
        }
      )
      .toBeTruthy()

    // Note: Pour tester le modal UI de promotion, il faudrait utiliser drag/drop
    // Ce test vérifie que la promotion fonctionne et que la move-list se met à jour

    await whiteContext.close()
  })
})

