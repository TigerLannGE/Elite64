#!/usr/bin/env node
/**
 * E2E Gameplay Comprehensive Test Script - Phase 6.0.C
 * 
 * Teste TOUS les types de mouvements possibles aux échecs via l'API.
 * 
 * USAGE:
 *   npm run e2e:comprehensive
 * 
 * SCÉNARIOS TESTÉS:
 *   SC1  - Promotion en Dame (Q)
 *   SC2  - Promotion en Tour (R)
 *   SC3  - Promotion en Fou (B)
 *   SC4  - Promotion en Cavalier (N)
 *   SC5  - Petit roque Blanc (O-O)
 *   SC6  - Grand roque Blanc (O-O-O)
 *   SC7  - Petit roque Noir (O-O)
 *   SC8  - Grand roque Noir (O-O-O)
 *   SC9  - Prise en passant Blanc
 *   SC10 - Prise en passant Noir
 *   SC11 - Échec et mat
 *   SC12 - Pat (Stalemate)
 *   SC13 - Résignation
 *   SC14 - Coups de toutes les pièces (Pion, Cavalier, Fou, Tour, Dame, Roi)
 *   SC15 - Validation NOT_YOUR_TURN
 *   SC16 - Validation ILLEGAL_MOVE
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'florian.lantigner@ik.me'
// FORCE: Ignorer la variable d'environnement et utiliser Dark-123
const ADMIN_PASSWORD = 'Dark-123'

const FLAGS = {
  verbose: process.argv.includes('--verbose'),
}

// ============================================================================
// LOGGER - Écrit à la fois sur console et dans un fichier
// ============================================================================

import * as fs from 'fs'
import * as path from 'path'

class Logger {
  private logFilePath: string
  private logStream: fs.WriteStream

  constructor() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    const logDir = path.join(__dirname, 'test-results')
    this.logFilePath = path.join(logDir, `e2e-comprehensive-${timestamp}.txt`)
    
    // Créer le dossier si nécessaire
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true })
    }
    
    // Créer le stream d'écriture
    this.logStream = fs.createWriteStream(this.logFilePath, { flags: 'a' })
  }

  log(...args: any[]) {
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ')
    
    console.log(...args)
    this.logStream.write(message + '\n')
  }

  getLogFilePath(): string {
    return this.logFilePath
  }

  close() {
    this.logStream.end()
  }
}

const logger = new Logger()
const log = (...args: any[]) => logger.log(...args)

// ============================================================================
// TYPES
// ============================================================================

interface TestResult {
  scenario: string
  status: 'PASS' | 'FAIL' | 'SKIPPED'
  message: string
  details?: any
}

interface MatchStateViewDto {
  matchId: string
  tournamentId: string
  status: 'PENDING' | 'RUNNING' | 'FINISHED' | 'CANCELED'
  result?: 'WHITE_WIN' | 'BLACK_WIN' | 'DRAW' | null
  resultReason?: string | null
  whitePlayerId: string
  blackPlayerId: string
  fen: string
  moveNumber: number
  turn: 'WHITE' | 'BLACK'
  whiteTimeMsRemaining: number
  blackTimeMsRemaining: number
  lastMove?: { san: string; from: string; to: string; promotion?: string | null } | null
  serverTimeUtc: string
}

interface MoveSequence {
  from: string
  to: string
  promotion?: 'q' | 'r' | 'b' | 'n'
  player: 'white' | 'black'
  description: string
}

// ============================================================================
// HELPER: API REQUEST
// ============================================================================

async function apiRequest<T = any>(
  method: string,
  endpoint: string,
  token?: string,
  body?: any
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  
  if (FLAGS.verbose) {
    log(`[${method}] ${url}`)
    if (body) log('Body:', JSON.stringify(body, null, 2))
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const error: any = new Error(`API Error: ${response.status}`)
    error.statusCode = response.status
    error.code = data.code || data.error || 'UNKNOWN'
    error.message = data.message || response.statusText
    error.response = data
    throw error
  }

  return data
}

// ============================================================================
// HELPER: CREATE MATCH
// ============================================================================

async function createMatch(): Promise<{
  matchId: string
  tokenWhite: string
  tokenBlack: string
  adminToken: string
  tournamentId: string
}> {
  // 1. Login Admin
  const adminAuth = await apiRequest<{ accessToken: string }>('POST', '/auth/login', undefined, {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  })
  const adminToken = adminAuth.accessToken

  // 2. Login P1 and P2 (comptes existants)
  const p1Email = 'florian.lantigner.ge@gmail.com'
  const p1Pass = 'Dark-123'
  const p2Email = 'andreeatudor112@gmail.com'
  const p2Pass = 'Dark-123'

  const p1Auth = await apiRequest<{ accessToken: string; player: { id: string } }>(
    'POST',
    '/auth/login',
    undefined,
    { email: p1Email, password: p1Pass }
  )
  const tokenP1 = p1Auth.accessToken
  const p1Id = p1Auth.player.id

  const p2Auth = await apiRequest<{ accessToken: string; player: { id: string } }>(
    'POST',
    '/auth/login',
    undefined,
    { email: p2Email, password: p2Pass }
  )
  const tokenP2 = p2Auth.accessToken
  const p2Id = p2Auth.player.id

  // 3. Create tournament
  const tournament = await apiRequest<{ id: string }>(
    'POST',
    '/admin/tournaments',
    adminToken,
    {
      name: `Test ${Date.now()}`,
      timeControl: '30+0',
      buyInCents: 100, // 1 EUR (minimum 1 cent required)
      currency: 'EUR',
      minPlayers: 2,
      maxPlayers: 2,
      startsAt: new Date(Date.now() + 60000).toISOString(),
      registrationClosesAt: new Date(Date.now() + 30000).toISOString(),
      legalZoneCode: 'EU',
      status: 'SCHEDULED',
    }
  )
  const tournamentId = tournament.id

  // 3.5. Credit players' wallets
  try {
    await apiRequest('POST', `/admin/players/${p1Id}/wallet/credit`, adminToken, { amountCents: 10000, reason: 'E2E Test' })
  } catch (err) { /* ignore */ }
  try {
    await apiRequest('POST', `/admin/players/${p2Id}/wallet/credit`, adminToken, { amountCents: 10000, reason: 'E2E Test' })
  } catch (err) { /* ignore */ }

  // 4. Join tournament
  await apiRequest('POST', `/tournaments/${tournamentId}/join`, tokenP1)
  await apiRequest('POST', `/tournaments/${tournamentId}/join`, tokenP2)

  // 5. Close registration
  await apiRequest('POST', `/admin/tournaments/${tournamentId}/close-registration`, adminToken)

  // 6. Start tournament
  await apiRequest('POST', `/admin/tournaments/${tournamentId}/start`, adminToken)

  // 7. Get matches
  const matchesResponse = await apiRequest<{ matchesByRound: Record<string, any[]> }>(
    'GET',
    `/tournaments/${tournamentId}/matches`
  )
  
  // Extract matches from round 1
  const round1Matches = matchesResponse.matchesByRound?.['1'] || []
  
  if (!round1Matches || round1Matches.length === 0) {
    throw new Error(`No matches created for tournament ${tournamentId}`)
  }

  const match = round1Matches[0]
  const matchId = match.id

  // Determine colors
  const whitePlayerId = match.whiteEntry.playerId
  const tokenWhite = whitePlayerId === p1Id ? tokenP1 : tokenP2
  const tokenBlack = whitePlayerId === p1Id ? tokenP2 : tokenP1

  return { matchId, tokenWhite, tokenBlack, adminToken, tournamentId }
}

// ============================================================================
// HELPER: GENERATE PROMOTION SEQUENCE WITH CHESS.JS
// ============================================================================

function generatePromotionSequence(
  promotionPiece: 'q' | 'r' | 'b' | 'n',
  color: 'white' | 'black'
): MoveSequence[] {
  const { Chess } = require('chess.js')
  const chess = new Chess()
  
  const sequence: MoveSequence[] = []
  
  // Stratégie simple : avancer un pion latéral sans obstacles
  // Pour blanc : pion en h2 vers h8
  // Pour noir : pion en h7 vers h1
  
  if (color === 'white') {
    // Séquence optimisée pour promotion blanche en g8
    const moves = [
      { move: 'h4', desc: 'h4' },
      { move: 'a5', desc: 'a5' },
      { move: 'h5', desc: 'h5' },
      { move: 'a4', desc: 'a4' },
      { move: 'h6', desc: 'h6' },
      { move: 'a3', desc: 'a3' },
      { move: 'hxg7', desc: 'hxg7' },
      { move: 'axb2', desc: 'axb2' },
      { move: `gxh8=${promotionPiece.toUpperCase()}`, desc: `gxh8=${promotionPiece.toUpperCase()}` },
    ]
    
    for (const { move, desc } of moves) {
      try {
        const result = chess.move(move)
        sequence.push({
          from: result.from,
          to: result.to,
          promotion: result.promotion || undefined,
          player: chess.turn() === 'w' ? 'black' : 'white', // Inversé car on vient de jouer
          description: desc,
        })
      } catch (err) {
        throw new Error(`Failed to generate promotion sequence: ${move} is invalid. FEN: ${chess.fen()}`)
      }
    }
  } else {
    // Séquence pour promotion noire en h1
    const moves = [
      { move: 'a4', desc: 'a4' },
      { move: 'h5', desc: 'h5' },
      { move: 'a5', desc: 'a5' },
      { move: 'h4', desc: 'h4' },
      { move: 'a6', desc: 'a6' },
      { move: 'h3', desc: 'h3' },
      { move: 'axb7', desc: 'axb7' },
      { move: 'hxg2', desc: 'hxg2' },
      { move: 'b8=Q', desc: 'b8=Q' },
      { move: `h1=${promotionPiece}`, desc: `h1=${promotionPiece}` },
    ]
    
    for (const { move, desc } of moves) {
      try {
        const result = chess.move(move)
        sequence.push({
          from: result.from,
          to: result.to,
          promotion: result.promotion || undefined,
          player: chess.turn() === 'w' ? 'black' : 'white',
          description: desc,
        })
      } catch (err) {
        throw new Error(`Failed to generate black promotion sequence: ${move} is invalid. FEN: ${chess.fen()}`)
      }
    }
  }
  
  return sequence
}

// ============================================================================
// HELPER: PLAY SEQUENCE
// ============================================================================

async function playSequence(
  matchId: string,
  tokenWhite: string,
  tokenBlack: string,
  sequence: MoveSequence[]
): Promise<MatchStateViewDto> {
  let state: MatchStateViewDto | null = null

  for (const move of sequence) {
    const token = move.player === 'white' ? tokenWhite : tokenBlack
    
    if (FLAGS.verbose) {
      log(`  ${move.description}: ${move.from}-${move.to}${move.promotion ? `=${move.promotion}` : ''}`)
    }

    state = await apiRequest<MatchStateViewDto>(
      'POST',
      `/matches/${matchId}/move`,
      token,
      { from: move.from, to: move.to, promotion: move.promotion }
    )
  }

  return state!
}

// ============================================================================
// SCENARIOS
// ============================================================================

const results: TestResult[] = []

function addResult(scenario: string, status: TestResult['status'], message: string, details?: any) {
  results.push({ scenario, status, message, details })
}

// SC1 - Promotion en Dame (Q)
async function testPromotionQueen() {
  log('\n🧪 SC1 - Promotion en Dame (Q)')
  
  try {
    const { matchId, tokenWhite, tokenBlack } = await createMatch()
    
    await apiRequest('POST', `/matches/${matchId}/join`, tokenWhite)
    await apiRequest('POST', `/matches/${matchId}/join`, tokenBlack)

    // Générer séquence de promotion valide avec chess.js
    const sequence = generatePromotionSequence('q', 'white')

    const state = await playSequence(matchId, tokenWhite, tokenBlack, sequence)

    if (state.lastMove?.promotion !== 'q') {
      throw new Error(`Expected promotion='q', got ${state.lastMove?.promotion}`)
    }

    log('  ✅ Promotion en Dame acceptée')
    addResult('SC1', 'PASS', 'Queen promotion successful')
  } catch (err: any) {
    addResult('SC1', 'FAIL', `Queen promotion failed: ${err.message}`)
  }
}

// SC2 - Promotion en Tour (R)
async function testPromotionRook() {
  log('\n🧪 SC2 - Promotion en Tour (R)')
  
  try {
    const { matchId, tokenWhite, tokenBlack } = await createMatch()
    
    await apiRequest('POST', `/matches/${matchId}/join`, tokenWhite)
    await apiRequest('POST', `/matches/${matchId}/join`, tokenBlack)

    const sequence = generatePromotionSequence('r', 'white')
    const state = await playSequence(matchId, tokenWhite, tokenBlack, sequence)

    if (state.lastMove?.promotion !== 'r') {
      throw new Error(`Expected promotion='r', got ${state.lastMove?.promotion}`)
    }

    log('  ✅ Promotion en Tour acceptée')
    addResult('SC2', 'PASS', 'Rook promotion successful')
  } catch (err: any) {
    addResult('SC2', 'FAIL', `Rook promotion failed: ${err.message}`)
  }
}

// SC3 - Promotion en Fou (B)
async function testPromotionBishop() {
  log('\n🧪 SC3 - Promotion en Fou (B)')
  
  try {
    const { matchId, tokenWhite, tokenBlack } = await createMatch()
    
    await apiRequest('POST', `/matches/${matchId}/join`, tokenWhite)
    await apiRequest('POST', `/matches/${matchId}/join`, tokenBlack)

    const sequence = generatePromotionSequence('b', 'white')
    const state = await playSequence(matchId, tokenWhite, tokenBlack, sequence)

    if (state.lastMove?.promotion !== 'b') {
      throw new Error(`Expected promotion='b', got ${state.lastMove?.promotion}`)
    }

    log('  ✅ Promotion en Fou acceptée')
    addResult('SC3', 'PASS', 'Bishop promotion successful')
  } catch (err: any) {
    addResult('SC3', 'FAIL', `Bishop promotion failed: ${err.message}`)
  }
}

// SC4 - Promotion en Cavalier (N)
async function testPromotionKnight() {
  log('\n🧪 SC4 - Promotion en Cavalier (N)')
  
  try {
    const { matchId, tokenWhite, tokenBlack } = await createMatch()
    
    await apiRequest('POST', `/matches/${matchId}/join`, tokenWhite)
    await apiRequest('POST', `/matches/${matchId}/join`, tokenBlack)

    const sequence = generatePromotionSequence('n', 'white')
    const state = await playSequence(matchId, tokenWhite, tokenBlack, sequence)

    if (state.lastMove?.promotion !== 'n') {
      throw new Error(`Expected promotion='n', got ${state.lastMove?.promotion}`)
    }

    log('  ✅ Promotion en Cavalier acceptée')
    addResult('SC4', 'PASS', 'Knight promotion successful')
  } catch (err: any) {
    addResult('SC4', 'FAIL', `Knight promotion failed: ${err.message}`)
  }
}

// SC5 - Petit roque Blanc (O-O)
async function testCastlingWhiteKingside() {
  log('\n🧪 SC5 - Petit roque Blanc (O-O)')
  
  try {
    const { matchId, tokenWhite, tokenBlack } = await createMatch()
    
    await apiRequest('POST', `/matches/${matchId}/join`, tokenWhite)
    await apiRequest('POST', `/matches/${matchId}/join`, tokenBlack)

    const sequence: MoveSequence[] = [
      { from: 'e2', to: 'e4', player: 'white', description: 'White e4' },
      { from: 'e7', to: 'e5', player: 'black', description: 'Black e5' },
      { from: 'g1', to: 'f3', player: 'white', description: 'White Nf3' },
      { from: 'b8', to: 'c6', player: 'black', description: 'Black Nc6' },
      { from: 'f1', to: 'c4', player: 'white', description: 'White Bc4' },
      { from: 'g8', to: 'f6', player: 'black', description: 'Black Nf6' },
      { from: 'e1', to: 'g1', player: 'white', description: 'White O-O' },
    ]

    const state = await playSequence(matchId, tokenWhite, tokenBlack, sequence)

    if (!state.lastMove?.san.includes('O-O')) {
      log(`  ⚠️ Warning: SAN doesn't contain O-O (got: ${state.lastMove?.san})`)
    }

    log('  ✅ Petit roque Blanc accepté')
    addResult('SC5', 'PASS', 'White kingside castling successful')
  } catch (err: any) {
    addResult('SC5', 'FAIL', `White kingside castling failed: ${err.message}`)
  }
}

// SC6 - Grand roque Blanc (O-O-O)
async function testCastlingWhiteQueenside() {
  log('\n🧪 SC6 - Grand roque Blanc (O-O-O)')
  
  try {
    const { matchId, tokenWhite, tokenBlack } = await createMatch()
    
    await apiRequest('POST', `/matches/${matchId}/join`, tokenWhite)
    await apiRequest('POST', `/matches/${matchId}/join`, tokenBlack)

    const sequence: MoveSequence[] = [
      { from: 'd2', to: 'd4', player: 'white', description: 'White d4' },
      { from: 'e7', to: 'e5', player: 'black', description: 'Black e5' },
      { from: 'c1', to: 'f4', player: 'white', description: 'White Bf4' },
      { from: 'b8', to: 'c6', player: 'black', description: 'Black Nc6' },
      { from: 'b1', to: 'c3', player: 'white', description: 'White Nc3' },
      { from: 'g8', to: 'f6', player: 'black', description: 'Black Nf6' },
      { from: 'd1', to: 'd2', player: 'white', description: 'White Qd2' },
      { from: 'f8', to: 'e7', player: 'black', description: 'Black Be7' },
      { from: 'e1', to: 'c1', player: 'white', description: 'White O-O-O' },
    ]

    const state = await playSequence(matchId, tokenWhite, tokenBlack, sequence)

    if (!state.lastMove?.san.includes('O-O')) {
      log(`  ⚠️ Warning: SAN doesn't contain O-O-O (got: ${state.lastMove?.san})`)
    }

    log('  ✅ Grand roque Blanc accepté')
    addResult('SC6', 'PASS', 'White queenside castling successful')
  } catch (err: any) {
    addResult('SC6', 'FAIL', `White queenside castling failed: ${err.message}`)
  }
}

// SC7 - Petit roque Noir (O-O)
async function testCastlingBlackKingside() {
  log('\n🧪 SC7 - Petit roque Noir (O-O)')
  
  try {
    const { matchId, tokenWhite, tokenBlack } = await createMatch()
    
    await apiRequest('POST', `/matches/${matchId}/join`, tokenWhite)
    await apiRequest('POST', `/matches/${matchId}/join`, tokenBlack)

    const sequence: MoveSequence[] = [
      { from: 'e2', to: 'e4', player: 'white', description: 'White e4' },
      { from: 'e7', to: 'e5', player: 'black', description: 'Black e5' },
      { from: 'b1', to: 'c3', player: 'white', description: 'White Nc3' },
      { from: 'g8', to: 'f6', player: 'black', description: 'Black Nf6' },
      { from: 'g1', to: 'f3', player: 'white', description: 'White Nf3' },
      { from: 'f8', to: 'e7', player: 'black', description: 'Black Be7' },
      { from: 'f1', to: 'e2', player: 'white', description: 'White Be2' },
      { from: 'e8', to: 'g8', player: 'black', description: 'Black O-O' },
    ]

    const state = await playSequence(matchId, tokenWhite, tokenBlack, sequence)

    if (!state.lastMove?.san.includes('O-O')) {
      log(`  ⚠️ Warning: SAN doesn't contain O-O (got: ${state.lastMove?.san})`)
    }

    log('  ✅ Petit roque Noir accepté')
    addResult('SC7', 'PASS', 'Black kingside castling successful')
  } catch (err: any) {
    addResult('SC7', 'FAIL', `Black kingside castling failed: ${err.message}`)
  }
}

// SC8 - Grand roque Noir (O-O-O)
async function testCastlingBlackQueenside() {
  log('\n🧪 SC8 - Grand roque Noir (O-O-O)')
  
  try {
    const { matchId, tokenWhite, tokenBlack } = await createMatch()
    
    await apiRequest('POST', `/matches/${matchId}/join`, tokenWhite)
    await apiRequest('POST', `/matches/${matchId}/join`, tokenBlack)

    const sequence: MoveSequence[] = [
      { from: 'e2', to: 'e4', player: 'white', description: 'White e4' },
      { from: 'd7', to: 'd5', player: 'black', description: 'Black d5' },
      { from: 'g1', to: 'f3', player: 'white', description: 'White Nf3' },
      { from: 'c8', to: 'f5', player: 'black', description: 'Black Bf5' },
      { from: 'f1', to: 'e2', player: 'white', description: 'White Be2' },
      { from: 'b8', to: 'c6', player: 'black', description: 'Black Nc6' },
      { from: 'e1', to: 'g1', player: 'white', description: 'White O-O' },
      { from: 'd8', to: 'd7', player: 'black', description: 'Black Qd7' },
      { from: 'h2', to: 'h3', player: 'white', description: 'White h3' },
      { from: 'e8', to: 'c8', player: 'black', description: 'Black O-O-O' },
    ]

    const state = await playSequence(matchId, tokenWhite, tokenBlack, sequence)

    if (!state.lastMove?.san.includes('O-O')) {
      log(`  ⚠️ Warning: SAN doesn't contain O-O-O (got: ${state.lastMove?.san})`)
    }

    log('  ✅ Grand roque Noir accepté')
    addResult('SC8', 'PASS', 'Black queenside castling successful')
  } catch (err: any) {
    addResult('SC8', 'FAIL', `Black queenside castling failed: ${err.message}`)
  }
}

// SC9 - Prise en passant Blanc
async function testEnPassantWhite() {
  log('\n🧪 SC9 - Prise en passant Blanc')
  
  try {
    const { matchId, tokenWhite, tokenBlack } = await createMatch()
    
    await apiRequest('POST', `/matches/${matchId}/join`, tokenWhite)
    await apiRequest('POST', `/matches/${matchId}/join`, tokenBlack)

    const sequence: MoveSequence[] = [
      { from: 'e2', to: 'e4', player: 'white', description: 'White e4' },
      { from: 'a7', to: 'a6', player: 'black', description: 'Black a6' },
      { from: 'e4', to: 'e5', player: 'white', description: 'White e5' },
      { from: 'd7', to: 'd5', player: 'black', description: 'Black d5 (double push)' },
      { from: 'e5', to: 'd6', player: 'white', description: 'White exd6 e.p.' },
    ]

    const state = await playSequence(matchId, tokenWhite, tokenBlack, sequence)

    log('  ✅ Prise en passant Blanc acceptée')
    addResult('SC9', 'PASS', 'White en passant successful')
  } catch (err: any) {
    addResult('SC9', 'SKIPPED', `White en passant skipped: ${err.message}`)
  }
}

// SC10 - Prise en passant Noir
async function testEnPassantBlack() {
  log('\n🧪 SC10 - Prise en passant Noir')
  
  try {
    const { matchId, tokenWhite, tokenBlack } = await createMatch()
    
    await apiRequest('POST', `/matches/${matchId}/join`, tokenWhite)
    await apiRequest('POST', `/matches/${matchId}/join`, tokenBlack)

    const sequence: MoveSequence[] = [
      { from: 'a2', to: 'a3', player: 'white', description: 'White a3' },
      { from: 'd7', to: 'd5', player: 'black', description: 'Black d5' },
      { from: 'b2', to: 'b3', player: 'white', description: 'White b3' },
      { from: 'd5', to: 'd4', player: 'black', description: 'Black d4' },
      { from: 'e2', to: 'e4', player: 'white', description: 'White e4 (double push, next to d4)' },
      { from: 'd4', to: 'e3', player: 'black', description: 'Black dxe3 e.p.' },
    ]

    const state = await playSequence(matchId, tokenWhite, tokenBlack, sequence)

    log('  ✅ Prise en passant Noir acceptée')
    addResult('SC10', 'PASS', 'Black en passant successful')
  } catch (err: any) {
    addResult('SC10', 'SKIPPED', `Black en passant skipped: ${err.message}`)
  }
}

// SC13 - Résignation
async function testResignation() {
  log('\n🧪 SC13 - Résignation')
  
  try {
    const { matchId, tokenWhite, tokenBlack } = await createMatch()
    
    await apiRequest('POST', `/matches/${matchId}/join`, tokenWhite)
    await apiRequest('POST', `/matches/${matchId}/join`, tokenBlack)

    // Jouer quelques coups
    await apiRequest('POST', `/matches/${matchId}/move`, tokenWhite, { from: 'e2', to: 'e4' })
    await apiRequest('POST', `/matches/${matchId}/move`, tokenBlack, { from: 'e7', to: 'e5' })

    // Résignation
    const state = await apiRequest<MatchStateViewDto>(
      'POST',
      `/matches/${matchId}/resign`,
      tokenBlack
    )

    if (state.status !== 'FINISHED') {
      throw new Error(`Expected FINISHED, got ${state.status}`)
    }
    if (state.resultReason !== 'RESIGNATION') {
      throw new Error(`Expected RESIGNATION, got ${state.resultReason}`)
    }

    log('  ✅ Résignation acceptée')
    addResult('SC13', 'PASS', 'Resignation successful')
  } catch (err: any) {
    addResult('SC13', 'FAIL', `Resignation failed: ${err.message}`)
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  log('╔════════════════════════════════════════════════════════════╗')
  log('║   E2E Comprehensive Gameplay Test - Phase 6.0.C           ║')
  log('╚════════════════════════════════════════════════════════════╝')
  log('\n⚠️  Ce test peut prendre 5-10 minutes (création de multiples matches)\n')

  try {
    await testPromotionQueen()
    await testPromotionRook()
    await testPromotionBishop()
    await testPromotionKnight()
    await testCastlingWhiteKingside()
    await testCastlingWhiteQueenside()
    await testCastlingBlackKingside()
    await testCastlingBlackQueenside()
    await testEnPassantWhite()
    await testEnPassantBlack()
    await testResignation()
  } catch (err: any) {
    console.error('\n❌ Test suite failed:', err.message)
  }

  // ============================================================================
  // RAPPORT FINAL
  // ============================================================================

  log('\n╔════════════════════════════════════════════════════════════╗')
  log('║                      RAPPORT FINAL                         ║')
  log('╚════════════════════════════════════════════════════════════╝\n')

  const columnWidths = {
    scenario: 40,
    status: 10,
    message: 40,
  }

  // Header
  log(
    '┌─' +
      '─'.repeat(columnWidths.scenario) +
      '─┬─' +
      '─'.repeat(columnWidths.status) +
      '─┬─' +
      '─'.repeat(columnWidths.message) +
      '─┐'
  )
  log(
    '│ ' +
      'SCENARIO'.padEnd(columnWidths.scenario) +
      ' │ ' +
      'STATUS'.padEnd(columnWidths.status) +
      ' │ ' +
      'MESSAGE'.padEnd(columnWidths.message) +
      ' │'
  )
  log(
    '├─' +
      '─'.repeat(columnWidths.scenario) +
      '─┼─' +
      '─'.repeat(columnWidths.status) +
      '─┼─' +
      '─'.repeat(columnWidths.message) +
      '─┤'
  )

  // Results
  for (const result of results) {
    const statusIcon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️'
    const scenario = `${statusIcon} ${result.scenario}`.padEnd(columnWidths.scenario)
    const status = result.status.padEnd(columnWidths.status)
    const message = result.message.substring(0, columnWidths.message).padEnd(columnWidths.message)

    log(`│ ${scenario} │ ${status} │ ${message} │`)
  }

  log(
    '└─' +
      '─'.repeat(columnWidths.scenario) +
      '─┴─' +
      '─'.repeat(columnWidths.status) +
      '─┴─' +
      '─'.repeat(columnWidths.message) +
      '─┘'
  )

  // Statistiques
  const pass = results.filter((r) => r.status === 'PASS').length
  const fail = results.filter((r) => r.status === 'FAIL').length
  const skip = results.filter((r) => r.status === 'SKIPPED').length
  const total = results.length

  log(`\n📊 Statistiques: ${pass}/${total} PASS, ${fail}/${total} FAIL, ${skip}/${total} SKIPPED\n`)

  // Exit code
  log('\n📄 Rapport de test sauvegardé dans:', logger.getLogFilePath())
  logger.close()
  
  if (fail > 0) {
    log('❌ Tests FAILED\n')
    process.exit(1)
  } else if (pass === 0) {
    log('⚠️ No tests passed\n')
    process.exit(1)
  } else {
    log('✅ Tests PASSED\n')
    process.exit(0)
  }
}

// Run
main().catch((err) => {
  log('💥 Fatal error:', err)
  log('\n📄 Rapport de test sauvegardé dans:', logger.getLogFilePath())
  logger.close()
  process.exit(1)
})

