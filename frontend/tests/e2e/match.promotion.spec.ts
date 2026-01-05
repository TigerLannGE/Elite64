import { test, expect, APIRequestContext } from '@playwright/test'
import { seedPromotionPosition } from './fixtures/seedPromotion'

/**
 * Tests E2E Promotion - Phase 6.2.B
 * 
 * Tests déterministes pour valider la promotion via API.
 * Utilise seedPromotionPosition pour créer une position de promotion,
 * puis joue le coup de promotion et vérifie que ça fonctionne.
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
 * Vérifier qu'une dame est présente à la case de promotion dans le FEN
 */
function hasQueenAtSquare(fen: string, square: string): boolean {
  // Format FEN : "position turn castling enpassant halfmove fullmove"
  const [position] = fen.split(' ')
  
  // Extraire la rangée et la colonne
  const rank = square[1] // '8' pour blancs, '1' pour noirs
  const file = square[0] // 'a' à 'h'
  
  // Convertir la colonne en index (a=0, b=1, ..., h=7)
  const fileIndex = file.charCodeAt(0) - 'a'.charCodeAt(0)
  
  // Extraire les rangées du FEN (séparées par '/')
  const ranks = position.split('/')
  
  // La rangée 8 est la première (index 0) pour les blancs
  // La rangée 1 est la dernière (index 7) pour les noirs
  const rankIndex = rank === '8' ? 0 : 7
  
  const targetRank = ranks[rankIndex]
  
  // Parser la rangée pour trouver la case
  let currentFile = 0
  for (let i = 0; i < targetRank.length; i++) {
    const char = targetRank[i]
    if (char >= '1' && char <= '8') {
      // C'est un nombre (cases vides)
      const emptySquares = parseInt(char, 10)
      if (currentFile <= fileIndex && fileIndex < currentFile + emptySquares) {
        // La case est vide, pas de dame
        return false
      }
      currentFile += emptySquares
    } else {
      // C'est une pièce
      if (currentFile === fileIndex) {
        // Vérifier si c'est une dame (Q pour blancs, q pour noirs)
        return char === 'Q' || char === 'q'
      }
      currentFile++
    }
  }
  
  return false
}

test.describe('Match Promotion E2E', () => {
  test('should promote pawn to queen via API', async ({ request }) => {
    // 1. Créer une position de promotion déterministe
    const position = await seedPromotionPosition(request)

    // 2. Obtenir l'état initial (avant promotion)
    const stateBefore = await getMatchState(request, position.whiteToken, position.matchId)
    const moveNumberBefore = stateBefore.moveNumber

    // 3. Jouer le coup de promotion via API
    const promotionResponse = await request.post(
      `${API_BASE_URL}/matches/${position.matchId}/move`,
      {
        headers: {
          Authorization: `Bearer ${position.whiteToken}`,
        },
        data: {
          from: position.promotionFrom,
          to: position.promotionTo,
          promotion: 'q', // Promotion en dame
        },
      }
    )

    // 4. Vérifier que la réponse est OK (fail-fast avec message explicite)
    if (!promotionResponse.ok()) {
      const errorBody = await promotionResponse.text()
      throw new Error(
        `Promotion move failed: ${promotionResponse.status()} ${errorBody}`
      )
    }

    const promotionResult = (await promotionResponse.json()) as MatchStateViewDto

    // 5. Vérifier que moveNumber a augmenté
    expect(promotionResult.moveNumber).toBe(moveNumberBefore + 1)

    // 6. Vérifier que lastMove contient la promotion
    expect(promotionResult.lastMove).toBeTruthy()
    expect(promotionResult.lastMove?.from).toBe(position.promotionFrom)
    expect(promotionResult.lastMove?.to).toBe(position.promotionTo)
    expect(promotionResult.lastMove?.promotion).toBe('q')

    // 7. Obtenir l'état final via GET /state
    const stateAfter = await getMatchState(request, position.whiteToken, position.matchId)

    // 8. Vérifier que le FEN reflète une dame à la case de promotion
    // Pour un pion blanc promu en dame, on cherche 'Q' (majuscule) à la case a8
    const hasQueen = hasQueenAtSquare(stateAfter.fen, position.promotionTo)
    expect(hasQueen).toBeTruthy()

    // 9. Vérifier que moveNumber a augmenté dans l'état final
    expect(stateAfter.moveNumber).toBe(moveNumberBefore + 1)

    // 10. Vérifier que le tour a changé (maintenant c'est le tour des noirs)
    expect(stateAfter.turn).toBe('BLACK')
  })
})

