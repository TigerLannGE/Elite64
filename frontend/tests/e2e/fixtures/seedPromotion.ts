import { APIRequestContext } from '@playwright/test'
import { seedMatch, SeededMatch } from './seedMatch'

/**
 * Fixture pour créer une position de promotion déterministe
 * Phase 6.2.B - Tests E2E Promotion
 * 
 * Crée un match via seedMatch, puis joue une séquence de coups
 * pour mettre un pion en position de promotion (7e rangée, case de promotion vide).
 */

const API_BASE_URL = process.env.PLAYWRIGHT_API_BASE_URL || process.env.API_BASE_URL || 'http://localhost:4000'

interface MatchStateViewDto {
  matchId: string
  tournamentId: string
  whitePlayerId: string
  blackPlayerId: string
  status: string
  fen: string
  moveNumber: number
  turn: 'WHITE' | 'BLACK'
  lastMove?: {
    san: string
    from: string
    to: string
    promotion?: string | null
  } | null
}

/**
 * Obtenir l'état actuel du match
 */
async function getMatchState(
  request: APIRequestContext,
  token: string,
  matchId: string
): Promise<MatchStateViewDto> {
  const response = await request.get(`${API_BASE_URL}/matches/${matchId}/state`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok()) {
    const errorBody = await response.text()
    throw new Error(`getMatchState failed: ${response.status()} ${errorBody}`)
  }

  return (await response.json()) as MatchStateViewDto
}

/**
 * Jouer un coup et vérifier l'état après
 */
async function playMoveAndVerify(
  request: APIRequestContext,
  token: string,
  matchId: string,
  from: string,
  to: string,
  expectedTurnAfter: 'WHITE' | 'BLACK',
  expectedMoveNumberAfter: number
): Promise<MatchStateViewDto> {
  const response = await request.post(`${API_BASE_URL}/matches/${matchId}/move`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    data: {
      from,
      to,
    },
  })

  if (!response.ok()) {
    const errorBody = await response.text()
    throw new Error(`playMove failed: ${response.status()} ${errorBody}`)
  }

  const newState = (await response.json()) as MatchStateViewDto

  // Vérifications déterministes
  if (!newState.fen) {
    throw new Error(`FEN is null after move ${from}->${to}`)
  }

  if (newState.turn !== expectedTurnAfter) {
    throw new Error(
      `Turn mismatch after move ${from}->${to}: expected ${expectedTurnAfter}, got ${newState.turn}`
    )
  }

  if (newState.moveNumber !== expectedMoveNumberAfter) {
    throw new Error(
      `MoveNumber mismatch after move ${from}->${to}: expected ${expectedMoveNumberAfter}, got ${newState.moveNumber}`
    )
  }

  if (!newState.lastMove || newState.lastMove.from !== from || newState.lastMove.to !== to) {
    throw new Error(
      `lastMove mismatch after move ${from}->${to}: expected from=${from} to=${to}, got ${JSON.stringify(newState.lastMove)}`
    )
  }

  return newState
}

/**
 * Vérifier qu'un pion est en position de promotion
 * 
 * Vérifie que :
 * - Le dernier coup était bien vers la case de promotion (promotionFrom -> promotionTo)
 * - C'est le bon tour pour promouvoir
 * - Le FEN est valide
 */
function isPawnReadyForPromotion(
  state: MatchStateViewDto,
  promotionFrom: string,
  promotionTo: string
): boolean {
  // Vérifier que le dernier coup était bien vers la case de promotion
  if (!state.lastMove) {
    return false
  }

  // Le dernier coup devrait être vers promotionFrom (le pion est maintenant en promotionFrom)
  // Mais en fait, après a6->a7, le dernier coup devrait être a6->a7
  // Donc lastMove.to devrait être promotionFrom
  if (state.lastMove.to !== promotionFrom) {
    return false
  }

  // Vérifier que c'est le bon tour pour promouvoir
  // Pour un pion blanc en a7, c'est le tour des blancs qui peuvent promouvoir
  // Pour un pion noir en a2, c'est le tour des noirs qui peuvent promouvoir
  const isWhitePawn = promotionFrom[1] === '7' // 7e rangée pour blancs
  if (isWhitePawn && state.turn !== 'WHITE') {
    return false
  }
  if (!isWhitePawn && state.turn !== 'BLACK') {
    return false
  }

  // Vérifier que le FEN est valide (non null)
  if (!state.fen || state.fen.trim() === '') {
    return false
  }

  return true
}

/**
 * Interface pour les données de position de promotion
 */
export interface PromotionPosition {
  matchId: string
  tournamentId: string
  whiteToken: string
  blackToken: string
  promotionFrom: string // Case de départ (ex: 'a7')
  promotionTo: string // Case de promotion (ex: 'a8')
  promotionColor: 'WHITE' | 'BLACK' // Camp qui peut promouvoir
  currentState: MatchStateViewDto // État actuel du match
}

/**
 * Créer une position de promotion déterministe
 * 
 * Scénario : Pion blanc en a7, prêt à promouvoir en a8
 * Séquence minimale pour éviter les collisions :
 * - a2->a4 (blanc, avance de 2)
 * - b7->b6 (noir, défense)
 * - a4->a5 (blanc)
 * - b6->b5 (noir)
 * - a5->a6 (blanc)
 * - b5->b4 (noir)
 * - a6->a7 (blanc, pion en 7e rangée)
 * - b4->b3 (noir, libère la voie)
 * 
 * À ce stade, le pion blanc est en a7 et peut promouvoir en a8.
 */
export async function seedPromotionPosition(
  request: APIRequestContext,
  options?: {
    player1Email?: string
    player1Password?: string
    player2Email?: string
    player2Password?: string
    adminEmail?: string
    adminPassword?: string
  }
): Promise<PromotionPosition> {
  // 1. Créer un match via seedMatch
  const seeded = await seedMatch(request, {
    ...options,
    joinSecondPlayer: true, // Les deux joueurs doivent rejoindre
  })

  // 2. Séquence de coups pour mettre un pion blanc en position de promotion
  // On utilise la colonne 'a' pour éviter les collisions avec les pièces centrales
  const moves: Array<{
    from: string
    to: string
    token: string
    expectedTurnAfter: 'WHITE' | 'BLACK'
    expectedMoveNumberAfter: number
  }> = [
    // Blanc : a2->a4 (avance de 2)
    {
      from: 'a2',
      to: 'a4',
      token: seeded.whitePlayerToken,
      expectedTurnAfter: 'BLACK',
      expectedMoveNumberAfter: 1,
    },
    // Noir : b7->b6 (défense simple, ne bloque pas)
    {
      from: 'b7',
      to: 'b6',
      token: seeded.blackPlayerToken,
      expectedTurnAfter: 'WHITE',
      expectedMoveNumberAfter: 2,
    },
    // Blanc : a4->a5
    {
      from: 'a4',
      to: 'a5',
      token: seeded.whitePlayerToken,
      expectedTurnAfter: 'BLACK',
      expectedMoveNumberAfter: 3,
    },
    // Noir : b6->b5
    {
      from: 'b6',
      to: 'b5',
      token: seeded.blackPlayerToken,
      expectedTurnAfter: 'WHITE',
      expectedMoveNumberAfter: 4,
    },
    // Blanc : a5->a6
    {
      from: 'a5',
      to: 'a6',
      token: seeded.whitePlayerToken,
      expectedTurnAfter: 'BLACK',
      expectedMoveNumberAfter: 5,
    },
    // Noir : b5->b4
    {
      from: 'b5',
      to: 'b4',
      token: seeded.blackPlayerToken,
      expectedTurnAfter: 'WHITE',
      expectedMoveNumberAfter: 6,
    },
    // Blanc : a6->a7 (pion en 7e rangée, prêt pour promotion)
    {
      from: 'a6',
      to: 'a7',
      token: seeded.whitePlayerToken,
      expectedTurnAfter: 'BLACK',
      expectedMoveNumberAfter: 7,
    },
    // Noir : b4->b3 (libère la voie, ne bloque pas)
    {
      from: 'b4',
      to: 'b3',
      token: seeded.blackPlayerToken,
      expectedTurnAfter: 'WHITE',
      expectedMoveNumberAfter: 8,
    },
  ]

  // 3. Jouer chaque coup et vérifier l'état
  let currentState: MatchStateViewDto | null = null
  for (const move of moves) {
    currentState = await playMoveAndVerify(
      request,
      move.token,
      seeded.matchId,
      move.from,
      move.to,
      move.expectedTurnAfter,
      move.expectedMoveNumberAfter
    )

    // Petite pause entre les coups pour laisser le backend traiter
    await new Promise((resolve) => setTimeout(resolve, 200))
  }

  if (!currentState) {
    throw new Error('No state after playing moves')
  }

  // 4. Vérifier que le pion est en position de promotion
  const promotionFrom = 'a7'
  const promotionTo = 'a8'

  if (!isPawnReadyForPromotion(currentState, promotionFrom, promotionTo)) {
    throw new Error(
      `Pawn not ready for promotion: FEN=${currentState.fen}, turn=${currentState.turn}, lastMove=${JSON.stringify(currentState.lastMove)}, from=${promotionFrom}, to=${promotionTo}`
    )
  }

  // 5. Vérifier que c'est bien le tour des blancs (qui peuvent promouvoir)
  if (currentState.turn !== 'WHITE') {
    throw new Error(
      `Expected WHITE turn for promotion, got ${currentState.turn}`
    )
  }

  return {
    matchId: seeded.matchId,
    tournamentId: seeded.tournamentId,
    whiteToken: seeded.whitePlayerToken,
    blackToken: seeded.blackPlayerToken,
    promotionFrom,
    promotionTo,
    promotionColor: 'WHITE',
    currentState,
  }
}

