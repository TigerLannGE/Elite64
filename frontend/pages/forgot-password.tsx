import { useState, FormEvent } from 'react'
import Link from 'next/link'
import Layout from '../components/Layout'
import { api, ApiError } from '../lib/api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await api.forgotPassword(email)
      setSubmitted(true)
    } catch (err) {
      const apiError = err as ApiError
      // On affiche toujours le même message pour des raisons de sécurité
      setSubmitted(true)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <Layout title="Mot de passe oublié - ChessBet">
        <div className="container mx-auto px-4 py-16 flex items-center justify-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20 max-w-md w-full text-center">
            <div className="text-4xl mb-4">📧</div>
            <h1 className="text-2xl font-bold text-white mb-4">
              Email envoyé
            </h1>
            <p className="text-gray-200 mb-6">
              Si un compte existe pour cet e-mail, un lien de réinitialisation a été envoyé.
            </p>
            <p className="text-gray-400 text-sm mb-6">
              Vérifiez votre boîte de réception et vos spams. Le lien est valide pendant une durée limitée.
            </p>
            <Link
              href="/login"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors inline-block"
            >
              Retour à la connexion
            </Link>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Mot de passe oublié - ChessBet">
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20 max-w-md w-full">
          <h1 className="text-3xl font-bold text-white mb-6 text-center">
            Mot de passe oublié
          </h1>

          <p className="text-gray-300 text-sm mb-6 text-center">
            Entrez votre adresse e-mail et nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </p>

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {loading ? 'Envoi...' : 'Envoyer le lien de réinitialisation'}
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

