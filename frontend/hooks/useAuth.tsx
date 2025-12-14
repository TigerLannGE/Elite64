import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/router'
import { api, Player, ApiError, isAccountSuspended } from '../lib/api'

interface AuthContextType {
  isAuthenticated: boolean
  player: Player | null
  loading: boolean
  isAdmin: boolean
  isSuperAdmin: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshPlayer: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [player, setPlayer] = useState<Player | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const checkAuth = async () => {
    if (typeof window === 'undefined') {
      setLoading(false)
      return
    }

    const token = localStorage.getItem('authToken')
    if (!token) {
      setIsAuthenticated(false)
      setPlayer(null)
      setLoading(false)
      return
    }

    try {
      const playerData = await api.getMe()
      setPlayer(playerData)
      setIsAuthenticated(true)
    } catch (error) {
      // Token invalide, expiré, ou compte suspendu - on nettoie
      // Si c'est une suspension (code ACCOUNT_SUSPENDED), on nettoie aussi le token
      if (isAccountSuspended(error)) {
        // Compte suspendu - nettoyer le token et rediriger vers login
        localStorage.removeItem('authToken')
        setIsAuthenticated(false)
        setPlayer(null)
        // Rediriger vers login avec un message si on est sur une page protégée
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          router.push('/login?error=suspended')
        }
      } else {
        // Token invalide ou expiré - on nettoie silencieusement
        // Ne pas afficher d'erreur si c'est juste une vérification au montage
        localStorage.removeItem('authToken')
        setIsAuthenticated(false)
        setPlayer(null)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    const response = await api.login(email, password)
    localStorage.setItem('authToken', response.accessToken)
    // Récupérer les données complètes du joueur (incluant le rôle) via /auth/me
    // Si le compte est suspendu, getMe() lèvera une erreur ACCOUNT_SUSPENDED
    try {
      const playerData = await api.getMe()
      setPlayer(playerData)
      setIsAuthenticated(true)
    } catch (error) {
      // Si getMe() échoue (compte suspendu entre login et getMe), nettoyer
      localStorage.removeItem('authToken')
      throw error // Re-lancer l'erreur pour que le composant login puisse l'afficher
    }
  }

  const logout = () => {
    localStorage.removeItem('authToken')
    setPlayer(null)
    setIsAuthenticated(false)
    router.push('/')
  }

  const refreshPlayer = async () => {
    await checkAuth()
  }

  // Calculer isAdmin et isSuperAdmin basés sur le rôle
  const isAdmin = player?.role === 'ADMIN' || player?.role === 'SUPER_ADMIN'
  const isSuperAdmin = player?.role === 'SUPER_ADMIN'

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        player,
        loading,
        isAdmin,
        isSuperAdmin,
        login,
        logout,
        refreshPlayer,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

