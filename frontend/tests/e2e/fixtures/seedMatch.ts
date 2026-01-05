import { APIRequestContext } from '@playwright/test'

/**
 * Fixture pour créer un match de test via API
 * Phase 6.2.B - Tests UI E2E
 * 
 * Crée un tournoi de test, inscrit deux joueurs, démarre le tournoi,
 * et retourne les informations nécessaires pour les tests.
 */

const API_BASE_URL = process.env.PLAYWRIGHT_API_BASE_URL || process.env.API_BASE_URL || 'http://localhost:4000'

interface LoginResponse {
  accessToken: string
}

interface Player {
  id: string
  email: string
  username: string
}

interface Tournament {
  id: string
  name: string
  status: string
}

interface Match {
  id: string
  tournamentId: string
  whitePlayerId: string
  blackPlayerId: string
  status: string
}

interface MatchStateViewDto {
  matchId: string
  tournamentId: string
  whitePlayerId: string
  blackPlayerId: string
  status: string
  fen: string
  turn: 'WHITE' | 'BLACK'
}

/**
 * Login via API et retourne le token
 */
async function login(
  request: APIRequestContext,
  email: string,
  password: string
): Promise<string> {
  const response = await request.post(`${API_BASE_URL}/auth/login`, {
    data: { email, password },
  })

  if (!response.ok()) {
    const error = await response.text()
    throw new Error(`Login failed for ${email}: ${response.status()} ${error}`)
  }

  const data = (await response.json()) as LoginResponse
  return data.accessToken
}

/**
 * Créer un tournoi de test E2E (gratuit ou quasi-gratuit)
 * 
 * Option A (priorité) : buyInCents = 1 (minimum requis par le DTO @Min(1))
 * Le backend exige au minimum 1 cent, donc on crée un tournoi à 1 cent
 * et on crédite les wallets de 1 cent pour permettre l'inscription.
 */
async function createTournament(
  request: APIRequestContext,
  adminToken: string
): Promise<Tournament> {
  const response = await request.post(`${API_BASE_URL}/admin/tournaments`, {
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
    data: {
      name: `Test Tournament E2E ${Date.now()}`,
      timeControl: '10+0',
      buyInCents: 1, // Minimum requis par le DTO (@Min(1)), quasi-gratuit pour les tests
      currency: 'EUR',
      minPlayers: 2,
      maxPlayers: 2,
      startsAt: new Date(Date.now() + 60000).toISOString(), // +1 minute
      registrationClosesAt: new Date(Date.now() + 30000).toISOString(), // +30 secondes
      legalZoneCode: 'EU',
      status: 'SCHEDULED',
    },
  })

  if (!response.ok()) {
    const error = await response.text()
    throw new Error(`Failed to create tournament: ${response.status()} ${error}`)
  }

  return (await response.json()) as Tournament
}

/**
 * Inscrire un joueur à un tournoi avec retry
 * 
 * Gère les erreurs temporaires (ex: conflit de concurrence) avec retry.
 * Traite 409 "already joined" comme succès.
 */
async function joinTournament(
  request: APIRequestContext,
  token: string,
  tournamentId: string,
  retryCount = 0,
  maxRetries = 3
): Promise<void> {
  const response = await request.post(
    `${API_BASE_URL}/tournaments/${tournamentId}/join`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  // 409 "already joined" est considéré comme succès
  if (response.status() === 409) {
    const body = await response.text()
    if (body.toLowerCase().includes('already') || body.toLowerCase().includes('déjà')) {
      return // Succès : le joueur est déjà inscrit
    }
  }

  if (!response.ok()) {
    // Lire le body AVANT de throw (fail-fast avec message explicite)
    const errorBody = await response.text()
    const errorMessage = `joinTournament failed: ${response.status()} ${errorBody}`

    // Retry si on n'a pas atteint le maximum et que l'erreur n'est pas définitive
    if (retryCount < maxRetries && response.status() >= 500) {
      // Erreur serveur (5xx) : retry avec délai exponentiel
      const delays = [250, 500, 1000] // ms
      const delay = delays[retryCount] || 1000
      await new Promise((resolve) => setTimeout(resolve, delay))
      return joinTournament(request, token, tournamentId, retryCount + 1, maxRetries)
    }

    // Erreur définitive ou max retries atteint : throw avec status + body
    throw new Error(errorMessage)
  }
}

/**
 * Fermer les inscriptions d'un tournoi (admin) avec retry
 */
async function closeRegistration(
  request: APIRequestContext,
  adminToken: string,
  tournamentId: string,
  retryCount = 0,
  maxRetries = 3
): Promise<void> {
  const response = await request.post(
    `${API_BASE_URL}/admin/tournaments/${tournamentId}/close-registration`,
    {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    }
  )

  // 409 "already closed" est considéré comme succès
  if (response.status() === 409) {
    const body = await response.text()
    if (body.toLowerCase().includes('already') || body.toLowerCase().includes('déjà') || body.toLowerCase().includes('closed')) {
      return // Succès : les inscriptions sont déjà fermées
    }
  }

  if (!response.ok()) {
    // Lire le body AVANT de throw (fail-fast avec message explicite)
    const errorBody = await response.text()
    const errorMessage = `closeRegistration failed: ${response.status()} ${errorBody}`

    // Retry si on n'a pas atteint le maximum et que l'erreur n'est pas définitive
    if (retryCount < maxRetries && response.status() >= 500) {
      // Erreur serveur (5xx) : retry avec délai exponentiel
      const delays = [250, 500, 1000] // ms
      const delay = delays[retryCount] || 1000
      await new Promise((resolve) => setTimeout(resolve, delay))
      return closeRegistration(request, adminToken, tournamentId, retryCount + 1, maxRetries)
    }

    // Erreur définitive ou max retries atteint : throw avec status + body
    throw new Error(errorMessage)
  }
}

/**
 * Démarrer un tournoi (admin) avec retry
 */
async function startTournament(
  request: APIRequestContext,
  adminToken: string,
  tournamentId: string,
  retryCount = 0,
  maxRetries = 3
): Promise<void> {
  const response = await request.post(
    `${API_BASE_URL}/admin/tournaments/${tournamentId}/start`,
    {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    }
  )

  // 409 "already started" est considéré comme succès
  if (response.status() === 409) {
    const body = await response.text()
    if (body.toLowerCase().includes('already') || body.toLowerCase().includes('déjà') || body.toLowerCase().includes('started')) {
      return // Succès : le tournoi est déjà démarré
    }
  }

  if (!response.ok()) {
    // Lire le body AVANT de throw (fail-fast avec message explicite)
    const errorBody = await response.text()
    const errorMessage = `startTournament failed: ${response.status()} ${errorBody}`

    // Retry si on n'a pas atteint le maximum et que l'erreur n'est pas définitive
    if (retryCount < maxRetries && response.status() >= 500) {
      // Erreur serveur (5xx) : retry avec délai exponentiel
      const delays = [250, 500, 1000] // ms
      const delay = delays[retryCount] || 1000
      await new Promise((resolve) => setTimeout(resolve, delay))
      return startTournament(request, adminToken, tournamentId, retryCount + 1, maxRetries)
    }

    // Erreur définitive ou max retries atteint : throw avec status + body
    throw new Error(errorMessage)
  }
}

/**
 * Obtenir les matches d'un tournoi
 */
async function getTournamentMatches(
  request: APIRequestContext,
  token: string,
  tournamentId: string
): Promise<Match[]> {
  const response = await request.get(
    `${API_BASE_URL}/tournaments/${tournamentId}/matches`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  if (!response.ok()) {
    const error = await response.text()
    throw new Error(`Failed to get matches: ${response.status()} ${error}`)
  }

  const data = (await response.json()) as { matchesByRound: Record<string, Match[]> }
  
  // Extraire les matches de la première ronde
  const round1Matches = data.matchesByRound?.['1'] || []
  return round1Matches
}

/**
 * Joindre un match avec retry
 * 
 * Gère les erreurs temporaires (ex: conflit de concurrence) avec retry.
 * Traite 409 (already joined) comme succès.
 */
async function joinMatch(
  request: APIRequestContext,
  token: string,
  matchId: string,
  retryCount = 0,
  maxRetries = 3
): Promise<MatchStateViewDto> {
  const response = await request.post(`${API_BASE_URL}/matches/${matchId}/join`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  // 409 "already joined" est considéré comme succès
  if (response.status() === 409) {
    const body = await response.text()
    if (body.toLowerCase().includes('already') || body.toLowerCase().includes('déjà')) {
      // Retourner l'état actuel du match
      const stateResponse = await request.get(`${API_BASE_URL}/matches/${matchId}/state`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!stateResponse.ok()) {
        const error = await stateResponse.text()
        throw new Error(`Failed to get match state after already joined: ${stateResponse.status()} ${error}`)
      }
      return (await stateResponse.json()) as MatchStateViewDto
    }
  }

  if (!response.ok()) {
    // Lire le body AVANT de throw (fail-fast avec message explicite)
    const errorBody = await response.text()
    const errorMessage = `joinMatch failed: ${response.status()} ${errorBody}`

    // Retry si on n'a pas atteint le maximum et que l'erreur n'est pas définitive
    if (retryCount < maxRetries && response.status() >= 500) {
      // Erreur serveur (5xx) : retry avec délai exponentiel
      const delays = [250, 500, 1000] // ms
      const delay = delays[retryCount] || 1000
      await new Promise((resolve) => setTimeout(resolve, delay))
      return joinMatch(request, token, matchId, retryCount + 1, maxRetries)
    }

    // Erreur définitive ou max retries atteint : throw avec status + body
    throw new Error(errorMessage)
  }

  return (await response.json()) as MatchStateViewDto
}

/**
 * Interface pour les données de match seedé
 */
export interface SeededMatch {
  matchId: string
  tournamentId: string
  whitePlayerId: string
  blackPlayerId: string
  whitePlayerToken: string
  blackPlayerToken: string
  whitePlayerEmail: string
  blackPlayerEmail: string
  matchState: MatchStateViewDto
}

/**
 * Créer un match de test complet
 * 
 * @param request - APIRequestContext de Playwright
 * @param options - Options pour la création (emails, passwords, admin)
 * @returns Données du match seedé
 */
export async function seedMatch(
  request: APIRequestContext,
  options: {
    player1Email?: string
    player1Password?: string
    player2Email?: string
    player2Password?: string
    adminEmail?: string
    adminPassword?: string
    joinSecondPlayer?: boolean // Par défaut true (comportement actuel)
  } = {}
): Promise<SeededMatch> {
  // Récupérer les credentials depuis env ou options
  const adminEmail = options.adminEmail || process.env.ADMIN_EMAIL || 'florian.lantigner@ik.me'
  const adminPassword = options.adminPassword || process.env.ADMIN_PASSWORD || 'Dark-123'
  const player1Email = options.player1Email || process.env.P1_EMAIL || 'florian.lantigner.ge@gmail.com'
  const player1Password = options.player1Password || process.env.P1_PASSWORD || 'Dark-123'
  const player2Email = options.player2Email || process.env.P2_EMAIL || 'andreeatudor112@gmail.com'
  const player2Password = options.player2Password || process.env.P2_PASSWORD || 'Dark-123'

  // 1. Login admin
  const adminToken = await login(request, adminEmail, adminPassword)

  // 2. Créer un tournoi
  const tournament = await createTournament(request, adminToken)

  // 3. Login players
  const player1Token = await login(request, player1Email, player1Password)
  const player2Token = await login(request, player2Email, player2Password)

  // 4. Obtenir les IDs des joueurs
  const player1Response = await request.get(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${player1Token}` },
  })
  const player1 = (await player1Response.json()) as Player

  const player2Response = await request.get(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${player2Token}` },
  })
  const player2 = (await player2Response.json()) as Player

  // 5. Créditer les wallets des joueurs (nécessaire pour l'inscription)
  // Le tournoi coûte 1 cent (minimum requis par le DTO @Min(1)), on crédite 1 cent par joueur
  // Utilisation de l'endpoint /wallets/test-credit (accessible avec le token du joueur)
  
  // GARDE DE SÉCURITÉ : Ne pas utiliser /wallets/test-credit hors contexte E2E
  if (process.env.E2E !== '1') {
    throw new Error(
      'Refusing to use /wallets/test-credit outside E2E context. Set E2E=1 to enable.'
    )
  }

  // GARDE DE SÉCURITÉ : Vérifier que l'API pointe sur localhost (optionnel mais recommandé)
  if (!API_BASE_URL.includes('localhost') && !API_BASE_URL.includes('127.0.0.1')) {
    throw new Error(
      `Refusing to use /wallets/test-credit on non-localhost API: ${API_BASE_URL}. This endpoint should only be used in E2E tests on localhost.`
    )
  }

  const creditAmountCents = 1

  const creditResponse1 = await request.post(`${API_BASE_URL}/wallets/test-credit`, {
    headers: { Authorization: `Bearer ${player1Token}` },
    data: { amountCents: creditAmountCents },
  })
  if (!creditResponse1.ok()) {
    const error = await creditResponse1.text()
    throw new Error(`Failed to credit player1 wallet: ${creditResponse1.status()} ${error}`)
  }

  const creditResponse2 = await request.post(`${API_BASE_URL}/wallets/test-credit`, {
    headers: { Authorization: `Bearer ${player2Token}` },
    data: { amountCents: creditAmountCents },
  })
  if (!creditResponse2.ok()) {
    const error = await creditResponse2.text()
    throw new Error(`Failed to credit player2 wallet: ${creditResponse2.status()} ${error}`)
  }

  // 5.5. Vérifier que les wallets ont bien été crédités
  // Vérification explicite du solde après crédit pour détecter les problèmes tôt
  const wallet1Response = await request.get(`${API_BASE_URL}/wallets/me`, {
    headers: { Authorization: `Bearer ${player1Token}` },
  })
  if (!wallet1Response.ok()) {
    const error = await wallet1Response.text()
    throw new Error(`Failed to get player1 wallet: ${wallet1Response.status()} ${error}`)
  }
  const wallet1 = (await wallet1Response.json()) as { balanceCents: number }
  if (wallet1.balanceCents < creditAmountCents) {
    throw new Error(
      `Player1 wallet balance (${wallet1.balanceCents} cents) is insufficient after credit. Expected at least ${creditAmountCents} cents.`
    )
  }

  const wallet2Response = await request.get(`${API_BASE_URL}/wallets/me`, {
    headers: { Authorization: `Bearer ${player2Token}` },
  })
  if (!wallet2Response.ok()) {
    const error = await wallet2Response.text()
    throw new Error(`Failed to get player2 wallet: ${wallet2Response.status()} ${error}`)
  }
  const wallet2 = (await wallet2Response.json()) as { balanceCents: number }
  if (wallet2.balanceCents < creditAmountCents) {
    throw new Error(
      `Player2 wallet balance (${wallet2.balanceCents} cents) is insufficient after credit. Expected at least ${creditAmountCents} cents.`
    )
  }

  // 6. Inscrire les deux joueurs (fail-fast avec retry)
  await joinTournament(request, player1Token, tournament.id)
  await joinTournament(request, player2Token, tournament.id)

  // 7. Fermer les inscriptions (fail-fast avec retry)
  await closeRegistration(request, adminToken, tournament.id)

  // 8. Démarrer le tournoi (génère automatiquement les matches) (fail-fast avec retry)
  await startTournament(request, adminToken, tournament.id)

  // 9. Attendre un peu que le tournoi démarre (génération des matches)
  await new Promise((resolve) => setTimeout(resolve, 2000))

  // 10. Obtenir les matches du tournoi
  const matches = await getTournamentMatches(request, player1Token, tournament.id)

  if (matches.length === 0) {
    throw new Error('No matches generated after tournament start')
  }

  // Prendre le premier match
  const match = matches[0]

  // 11. Joindre le match avec le premier joueur
  const matchState1 = await joinMatch(request, player1Token, match.id)

  // 12. Joindre le deuxième joueur seulement si joinSecondPlayer est true (défaut)
  const joinSecondPlayer = options.joinSecondPlayer !== false // true par défaut
  if (joinSecondPlayer) {
    await joinMatch(request, player2Token, match.id)
  }

  // Utiliser matchState1 comme référence
  const matchState = matchState1

  return {
    matchId: match.id,
    tournamentId: tournament.id,
    whitePlayerId: matchState.whitePlayerId,
    blackPlayerId: matchState.blackPlayerId,
    // Déterminer les tokens selon les couleurs
    whitePlayerToken: matchState.whitePlayerId === player1.id ? player1Token : player2Token,
    blackPlayerToken: matchState.whitePlayerId === player1.id ? player2Token : player1Token,
    whitePlayerEmail: matchState.whitePlayerId === player1.id ? player1Email : player2Email,
    blackPlayerEmail: matchState.whitePlayerId === player1.id ? player2Email : player1Email,
    matchState,
  }
}

