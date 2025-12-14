import { useState, FormEvent, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Layout from '../components/Layout'
import { api, ApiError } from '../lib/api'

export default function ResetPassword() {
  const router = useRouter()
  const { token } = router.query
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token || typeof token !== 'string') {
      setError('Token manquant dans l\'URL.')
    }
  }, [token])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!token || typeof token !== 'string') {
      setError('Token manquant.')
      return
    }

    if (newPassword.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    setLoading(true)

    try {
      await api.resetPassword(token, newPassword)
      setSuccess(true)
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.message || 'Le lien de réinitialisation est invalide ou a expiré.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Layout title="Mot de passe réinitialisé - ChessBet">
        <div className="container mx-auto px-4 py-16 flex items-center justify-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20 max-w-md w-full text-center">
            <div className="text-4xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-white mb-4">
              Mot de passe réinitialisé
            </h1>
            <p className="text-gray-200 mb-6">
              Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.
            </p>
            <Link
              href="/login"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors inline-block"
            >
              Aller à la connexion
            </Link>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Réinitialisation du mot de passe - ChessBet">
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20 max-w-md w-full">
          <h1 className="text-3xl font-bold text-white mb-6 text-center">
            Réinitialiser le mot de passe
          </h1>

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="block text-gray-200 mb-2">
                Nouveau mot de passe
              </label>
              <input
                type="password"
                id="newPassword"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Au moins 8 caractères"
                minLength={8}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-gray-200 mb-2">
                Confirmer le mot de passe
              </label>
              <input
                type="password"
                id="confirmPassword"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Confirmez votre mot de passe"
                minLength={8}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !token}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
            </button>
          </form>

          <p className="mt-6 text-center text-gray-300 text-sm">
            <Link href="/login" className="text-blue-400 hover:text-blue-300">
              Retour à la connexion
            </Link>
          </p>
        </div>
      </div>
    </Layout>
  )
}

