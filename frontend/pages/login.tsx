import { useState, FormEvent, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Layout from '../components/Layout'
import { useAuth } from '../hooks/useAuth'
import { api, ApiError, isAccountSuspended } from '../lib/api'

export default function Login() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Vérifier si on arrive depuis une redirection suite à une suspension
  useEffect(() => {
    if (router.query.error === 'suspended') {
      setError("Votre compte a été suspendu. Si vous pensez qu'il s'agit d'une erreur, contactez le support.")
      // Nettoyer l'URL
      router.replace('/login', undefined, { shallow: true })
    }
  }, [router])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    // Éviter les doubles soumissions
    if (loading) {
      return
    }
    
    setError(null)
    setLoading(true)

    try {
      await login(email, password)
      router.push('/lobby')
    } catch (err) {
      const apiError = err as ApiError
      // Gestion spéciale pour les comptes suspendus
      if (apiError.code === 'ACCOUNT_SUSPENDED') {
        setError(
          "Votre compte a été suspendu. Si vous pensez qu'il s'agit d'une erreur, contactez le support."
        )
      } else {
        setError(apiError.message || 'Impossible de vous connecter.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout title="Connexion - ChessBet">
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20 max-w-md w-full">
          <h1 className="text-3xl font-bold text-white mb-6 text-center">
            Connexion
          </h1>

          {error && (
            <div className={`border px-4 py-3 rounded-lg mb-4 ${
              error.includes('suspendu') 
                ? 'bg-orange-500/20 border-orange-500 text-orange-200' 
                : 'bg-red-500/20 border-red-500 text-red-200'
            }`}>
              <div className="font-semibold mb-1 text-base">
                {error.includes('suspendu') ? '⚠️ Compte suspendu' : '❌ Erreur de connexion'}
              </div>
              <div className="text-sm">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-gray-200 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="votre@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-gray-200 mb-2">
                Mot de passe
              </label>
              <input
                type="password"
                id="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
            </div>

            <div className="text-right">
              <Link
                href="/forgot-password"
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                Mot de passe oublié ?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <p className="mt-6 text-center text-gray-300 text-sm">
            Pas encore de compte ?{' '}
            <Link href="/register" className="text-blue-400 hover:text-blue-300">
              S'inscrire
            </Link>
          </p>
        </div>
      </div>
    </Layout>
  )
}
