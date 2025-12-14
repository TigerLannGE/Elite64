const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'

export interface ApiError {
  message: string
  statusCode?: number
  code?: string
}

// Constantes pour les codes d'erreur
export const ACCOUNT_SUSPENDED_CODE = 'ACCOUNT_SUSPENDED'
export const TOURNAMENTS_BLOCKED_CODE = 'TOURNAMENTS_BLOCKED'
export const DEPOSITS_BLOCKED_CODE = 'DEPOSITS_BLOCKED'
export const WITHDRAWALS_BLOCKED_CODE = 'WITHDRAWALS_BLOCKED'

// Fonction utilitaire pour vérifier si une erreur est ACCOUNT_SUSPENDED
export function isAccountSuspended(error: unknown): boolean {
  const apiError = error as ApiError
  return apiError?.code === ACCOUNT_SUSPENDED_CODE || 
         (apiError?.statusCode === 403 && apiError?.code === ACCOUNT_SUSPENDED_CODE)
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Une erreur est survenue' }))
    
    // Extraire le message : peut être une string ou un objet avec { code, message }
    let message = 'Une erreur est survenue'
    let code: string | undefined
    
    if (typeof errorData.message === 'string') {
      message = errorData.message
    } else if (errorData.message && typeof errorData.message === 'object') {
      // Cas où NestJS a mis l'objet dans message
      message = errorData.message.message || message
      code = errorData.message.code
    }
    
    // Vérifier aussi si le code est directement dans errorData
    if (!code && errorData.code) {
      code = errorData.code
    }
    
    const error = {
      message,
      statusCode: response.status,
      code,
    } as ApiError
    
    // Ne pas logger les erreurs 401 pour /auth/me (vérification de token normale)
    if (response.status === 401 && !response.url?.includes('/auth/login')) {
      // Erreur silencieuse pour les vérifications de token
      throw error
    }
    
    throw error
  }
  return response.json()
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  }

  // Ajouter le token d'authentification si disponible
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      }
    }
  }

  const response = await fetch(url, config)
  return handleResponse<T>(response)
}

// Types pour les réponses API
export type PlayerRole = 'PLAYER' | 'ADMIN' | 'SUPER_ADMIN'

export interface Player {
  id: string
  username: string
  email: string
  countryCode: string
  dateOfBirth: string
  emailVerified: boolean
  role: PlayerRole
}

export interface LoginResponse {
  accessToken: string
  player: Player
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  countryCode: string
  dateOfBirth: string
}

// Types pour les wallets et transactions
export type TransactionType = 
  | 'DEPOSIT'
  | 'WITHDRAWAL'
  | 'TOURNAMENT_BUY_IN'
  | 'TOURNAMENT_PAYOUT'
  | 'BONUS'
  | 'FEE'

export interface Transaction {
  id: string
  createdAt: string
  walletId: string
  type: TransactionType
  amountCents: number
  description: string | null
  externalRef: string | null
}

export interface Wallet {
  id: string
  playerId: string
  balanceCents: number
  currency: string
  createdAt: string
  updatedAt: string
  transactions: Transaction[]
}

export interface TestCreditResponse {
  transaction: Transaction
  newBalanceCents: number
}

// Types pour les tournois
export type TournamentStatus = 
  | 'DRAFT'
  | 'SCHEDULED'
  | 'READY'
  | 'RUNNING'
  | 'FINISHED'
  | 'CANCELED'

export interface PrizePoolView {
  totalEntriesCents: number
  commissionCents: number
  distributableCents: number
}

export interface TournamentListItem {
  id: string
  name: string
  timeControl: string
  status: TournamentStatus
  buyInCents: number
  currency: string
  minPlayers: number
  maxPlayers: number
  currentPlayers: number
  eloMin?: number | null
  eloMax?: number | null
  startsAt: string | null
  endsAt: string | null
  registrationClosesAt: string | null
  legalZoneCode: string
  prizePools: {
    min: PrizePoolView
    current: PrizePoolView
    max: PrizePoolView
  }
}

export interface JoinTournamentResponse {
  message: string
  entryId: string
}

// Types pour les matches
export type MatchStatus = 'PENDING' | 'RUNNING' | 'FINISHED' | 'CANCELED'

export type MatchResult = 'WHITE_WIN' | 'BLACK_WIN' | 'DRAW' | 'BYE'

export interface TournamentMatch {
  id: string
  tournamentId: string
  roundNumber: number
  boardNumber: number
  whiteEntryId: string
  blackEntryId: string
  whiteEntry: {
    id: string
    player: {
      id: string
      username: string
      elo?: number | null
    }
  }
  blackEntry: {
    id: string
    player: {
      id: string
      username: string
      elo?: number | null
    }
  }
  status: MatchStatus
  result: MatchResult | null
  resultReason?: string | null
  startedAt: string | null
  finishedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface TournamentMatchesResponse {
  tournament: {
    id: string
    name: string
    status: TournamentStatus
  }
  matchesByRound: Record<string, TournamentMatch[]>
}

export interface TournamentStanding {
  playerId: string
  username: string
  position: number
  wins: number
  losses: number
  draws: number
  payoutCents?: number | null
}

// Admin - Players
export interface AdminPlayer {
  id: string
  username: string
  email: string
  countryCode: string
  role: PlayerRole
  isActive: boolean
  createdAt: string
  // Restrictions ciblées (modération fine)
  blockTournaments: boolean
  blockWalletDeposits: boolean
  blockWalletWithdrawals: boolean
  moderationNote?: string | null
}

export interface UpdatePlayerRestrictionsPayload {
  blockTournaments?: boolean
  blockWalletDeposits?: boolean
  blockWalletWithdrawals?: boolean
  moderationNote?: string
}

export interface AdminPlayersResponse {
  data: AdminPlayer[]
  total: number
  skip: number
  take: number
}

// Admin - Tournaments
export interface AdminTournament {
  id: string
  name: string
  status: TournamentStatus
  timeControl: string
  buyInCents: number
  currency: string
  minPlayers: number
  maxPlayers: number
  currentPlayers: number
  eloMin: number | null
  eloMax: number | null
  startsAt: string | null
  endsAt: string | null
  registrationClosesAt: string | null
  legalZoneCode: string
  createdAt: string
  updatedAt: string
}

// Fonctions API
export const api = {
  // Auth
  login: (email: string, password: string) =>
    apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (data: RegisterRequest) =>
    apiRequest<{ message: string }>('/players', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  verifyEmail: (token: string) =>
    apiRequest<{ message: string }>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),

  forgotPassword: (email: string) =>
    apiRequest<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, newPassword: string) =>
    apiRequest<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    }),

  getMe: () =>
    apiRequest<Player>('/auth/me'),

  // Wallets
  getMyWallet: () =>
    apiRequest<Wallet>('/wallets/me'),

  testCredit: (amountCents: number) =>
    apiRequest<TestCreditResponse>('/wallets/test-credit', {
      method: 'POST',
      body: JSON.stringify({ amountCents }),
    }),

  // Tournaments
  getTournaments: () =>
    apiRequest<TournamentListItem[]>('/tournaments'),

  getTournament: (id: string) =>
    apiRequest<TournamentListItem>(`/tournaments/${id}`),

  joinTournament: (tournamentId: string) =>
    apiRequest<JoinTournamentResponse>(`/tournaments/${tournamentId}/join`, {
      method: 'POST',
    }),

  getTournamentMatches: (id: string) =>
    apiRequest<TournamentMatchesResponse>(`/tournaments/${id}/matches`),

  getTournamentStandings: (id: string) =>
    apiRequest<TournamentStanding[]>(`/tournaments/${id}/standings`),

  // Admin - Players
  getAdminPlayers: (skip?: number, take?: number, search?: string) => {
    const params = new URLSearchParams()
    if (skip !== undefined) params.append('skip', skip.toString())
    if (take !== undefined) params.append('take', take.toString())
    if (search) params.append('search', search)
    const query = params.toString()
    return apiRequest<AdminPlayersResponse>(`/admin/players${query ? `?${query}` : ''}`)
  },

  updateAdminPlayerStatus: (id: string, isActive: boolean) =>
    apiRequest<AdminPlayer>(`/admin/players/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    }),

  updateAdminPlayerRestrictions: (id: string, payload: UpdatePlayerRestrictionsPayload) =>
    apiRequest<AdminPlayer>(`/admin/players/${id}/restrictions`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  // Admin - Tournaments
  getAdminTournaments: () =>
    apiRequest<AdminTournament[]>('/admin/tournaments'),

  createTournament: (data: {
    name: string
    timeControl: string
    buyInCents: number
    currency?: string
    minPlayers: number
    maxPlayers: number
    eloMin?: number
    eloMax?: number
    startsAt?: string
    endsAt?: string
    registrationClosesAt?: string
    legalZoneCode: string
    status?: TournamentStatus
  }) =>
    apiRequest<AdminTournament>('/admin/tournaments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  closeRegistration: (tournamentId: string) =>
    apiRequest<{ message: string }>(`/admin/tournaments/${tournamentId}/close-registration`, {
      method: 'POST',
    }),

  adminStartTournament: (id: string) =>
    apiRequest<TournamentMatch[]>(`/admin/tournaments/${id}/start`, {
      method: 'POST',
    }),

  adminReportMatchResult: (matchId: string, payload: {
    result: MatchResult
    winnerEntryId?: string
    resultReason?: string
  }) =>
    apiRequest<TournamentMatch>(`/admin/matches/${matchId}/result`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deleteTournament: (tournamentId: string) =>
    apiRequest<{ message: string }>(`/admin/tournaments/${tournamentId}`, {
      method: 'DELETE',
    }),
}
