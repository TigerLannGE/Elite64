import { useState, FormEvent } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Layout from '../components/Layout'
import { api, ApiError } from '../lib/api'

export default function Register() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    countryCode: '',
    dateOfBirth: '',
  })
  const [confirmAge, setConfirmAge] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validations
    if (!confirmAge) {
      setError('Vous devez confirmer avoir au moins 18 ans.')
      return
    }

    if (!acceptTerms) {
      setError('Vous devez accepter les Conditions Générales et la Politique de Confidentialité.')
      return
    }

    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }

    setLoading(true)

    try {
      await api.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        countryCode: formData.countryCode,
        dateOfBirth: formData.dateOfBirth,
      })

      setSuccess(true)
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.message || 'Une erreur est survenue lors de l\'inscription.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Layout title="Inscription réussie - Elite64">
        <div className="container mx-auto px-4 py-16 flex items-center justify-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20 max-w-md w-full text-center">
            <div className="text-4xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-white mb-4">
              Compte créé avec succès
            </h1>
            <p className="text-gray-200 mb-6">
              Merci de vérifier votre e-mail pour activer votre compte. Un lien de vérification vous a été envoyé.
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
    <Layout title="Inscription - Elite64">
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20 max-w-md w-full">
          <h1 className="text-3xl font-bold text-white mb-6 text-center">
            Inscription
          </h1>

          <p className="text-gray-300 text-sm mb-6 text-center">
            Vous devez avoir au moins <strong className="text-white">18 ans</strong> pour créer un compte.
          </p>

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-gray-200 mb-2">
                Nom d&apos;utilisateur
              </label>
              <input
                type="text"
                id="username"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="username"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-gray-200 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Au moins 8 caractères"
                minLength={8}
              />
            </div>

            <div>
              <label htmlFor="countryCode" className="block text-gray-200 mb-2">
                Code pays (ISO 3166-1 alpha-2)
              </label>
              <input
                type="text"
                id="countryCode"
                required
                value={formData.countryCode}
                onChange={(e) => setFormData({ ...formData, countryCode: e.target.value.toUpperCase() })}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="FR, US, CA, etc."
                maxLength={2}
                pattern="[A-Z]{2}"
              />
              <p className="text-xs text-gray-400 mt-1">
                Exemples : FR (France), US (États-Unis), CA (Canada)
              </p>
            </div>

            <div>
              <label htmlFor="dateOfBirth" className="block text-gray-200 mb-2">
                Date de naissance
              </label>
              <input
                type="date"
                id="dateOfBirth"
                required
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmAge}
                  onChange={(e) => setConfirmAge(e.target.checked)}
                  className="mt-1"
                />
                <span className="text-sm text-gray-200">
                  Je confirme avoir au moins <strong className="text-white">18 ans</strong> et que la participation est autorisée dans ma juridiction.
                </span>
              </label>

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-1"
                />
                <span className="text-sm text-gray-200">
                  J&apos;accepte les{' '}
                  <Link href="/terms" className="text-blue-400 hover:text-blue-300 underline">
                    Conditions Générales
                  </Link>
                  {' '}et la{' '}
                  <Link href="/privacy" className="text-blue-400 hover:text-blue-300 underline">
                    Politique de Confidentialité
                  </Link>
                  .
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {loading ? 'Inscription en cours...' : "S'inscrire"}
            </button>
          </form>

          <p className="mt-6 text-center text-gray-300 text-sm">
            Déjà un compte ?{' '}
            <Link href="/login" className="text-blue-400 hover:text-blue-300">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </Layout>
  )
}
