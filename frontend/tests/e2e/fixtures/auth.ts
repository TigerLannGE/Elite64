import { test as base, expect, Browser, APIRequestContext, Page } from '@playwright/test'

/**
 * Fixture d'authentification réutilisable
 * Phase 6.2.B - Tests UI E2E
 * 
 * Crée une session utilisateur stable via API et produit un storageState
 * pour réutiliser la session dans les tests.
 */

const API_BASE_URL = process.env.PLAYWRIGHT_API_BASE_URL || process.env.API_BASE_URL || 'http://localhost:4000'

interface LoginResponse {
  accessToken: string
}

/**
 * Login via API (plus rapide et stable que UI login)
 */
async function loginViaAPI(
  request: APIRequestContext,
  email: string,
  password: string
): Promise<string> {
  const response = await request.post(`${API_BASE_URL}/auth/login`, {
    data: {
      email,
      password,
    },
  })

  if (!response.ok()) {
    const error = await response.text()
    throw new Error(`Login failed: ${response.status()} ${error}`)
  }

  const data = (await response.json()) as LoginResponse
  return data.accessToken
}

/**
 * Créer un storageState pour un utilisateur authentifié
 */
async function createStorageState(
  request: APIRequestContext,
  email: string,
  password: string
): Promise<{ cookies: any[]; origins: any[] }> {
  // Login via API
  const token = await loginViaAPI(request, email, password)

  // Vérifier que le token fonctionne en appelant /auth/me
  const meResponse = await request.get(`${API_BASE_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!meResponse.ok()) {
    throw new Error(`Failed to verify token: ${meResponse.status()}`)
  }

  // Créer le storageState avec le token dans localStorage
  // Playwright simule localStorage via storageState
  const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'
  
  return {
    cookies: [],
    origins: [
      {
        origin: baseURL,
        localStorage: [
          {
            name: 'authToken',
            value: token,
          },
        ],
      },
    ],
  }
}

/**
 * Fixture d'authentification
 * 
 * Usage:
 * ```ts
 * import { test, expect } from './fixtures/auth'
 * 
 * test('my test', async ({ authenticatedPage }) => {
 *   await authenticatedPage.goto('/lobby')
 *   // L'utilisateur est déjà authentifié
 * })
 * ```
 */
export const test = base.extend<{
  authenticatedPage: any
  authenticatedPagePlayer1: any
  authenticatedPagePlayer2: any
}>({
  // Page authentifiée avec utilisateur par défaut (env vars)
  authenticatedPage: async ({ browser, request }: { browser: Browser; request: APIRequestContext }, use: (page: Page) => Promise<void>) => {
    const email = process.env.PLAYWRIGHT_USER_EMAIL || process.env.P1_EMAIL || 'florian.lantigner.ge@gmail.com'
    const password = process.env.PLAYWRIGHT_USER_PASSWORD || process.env.P1_PASSWORD || 'Dark-123'

    // Créer le storageState via API
    const storageState = await createStorageState(request, email, password)

    // Créer un nouveau contexte avec le storageState
    const authenticatedContext = await browser.newContext({
      storageState,
    })

    const page = await authenticatedContext.newPage()
    await use(page)

    await authenticatedContext.close()
  },

  // Page authentifiée avec Player 1 (explicit)
  authenticatedPagePlayer1: async ({ browser, request }: { browser: Browser; request: APIRequestContext }, use: (page: Page) => Promise<void>) => {
    const email = process.env.P1_EMAIL || 'florian.lantigner.ge@gmail.com'
    const password = process.env.P1_PASSWORD || 'Dark-123'

    const storageState = await createStorageState(request, email, password)
    const authenticatedContext = await browser.newContext({
      storageState,
    })

    const page = await authenticatedContext.newPage()
    await use(page)

    await authenticatedContext.close()
  },

  // Page authentifiée avec Player 2 (explicit)
  authenticatedPagePlayer2: async ({ browser, request }: { browser: Browser; request: APIRequestContext }, use: (page: Page) => Promise<void>) => {
    const email = process.env.P2_EMAIL || 'andreeatudor112@gmail.com'
    const password = process.env.P2_PASSWORD || 'Dark-123'

    const storageState = await createStorageState(request, email, password)
    const authenticatedContext = await browser.newContext({
      storageState,
    })

    const page = await authenticatedContext.newPage()
    await use(page)

    await authenticatedContext.close()
  },
})

export { expect }

