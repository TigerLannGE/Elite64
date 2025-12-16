import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Layout from '../components/Layout'
import { api, ApiError } from '../lib/api'

export default function VerifyEmail() {
  const router = useRouter()
  const { token } = router.query
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token || typeof token !== 'string') {
      setStatus('error')
      setMessage('Token manquant dans l\'URL.')
      return
    }

    const verifyEmail = async () => {
      try {
        await api.verifyEmail(token)
        setStatus('success')
        setMessage('Votre adresse e-mail a été vérifiée avec succès.')
      } catch (err) {
        const apiError = err as ApiError
        setStatus('error')
        setMessage(apiError.message || 'Lien invalide ou expiré.')
      }
    }

    verifyEmail()
  }, [token])

  return (
    <Layout title="Vérification d&apos;email - ChessBet">
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20 max-w-md w-full text-center">
          {status === 'loading' && (
            <>
              <div className="text-4xl mb-4 animate-pulse">⏳</div>
              <h1 className="text-2xl font-bold text-white mb-4">
                Vérification en cours...
              </h1>
              <p className="text-gray-200">
                Veuillez patienter pendant la vérification de votre adresse e-mail.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="text-4xl mb-4">✅</div>
              <h1 className="text-2xl font-bold text-white mb-4">
                Email vérifié
              </h1>
              <p className="text-gray-200 mb-6">
                {message}
              </p>
              <p className="text-gray-300 text-sm mb-6">
                Vous pouvez maintenant vous connecter à votre compte.
              </p>
              <Link
                href="/login"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors inline-block"
              >
                Aller à la connexion
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="text-4xl mb-4">❌</div>
              <h1 className="text-2xl font-bold text-white mb-4">
                Erreur de vérification
              </h1>
              <p className="text-red-200 mb-6">
                {message}
              </p>
              <div className="space-y-3">
                <Link
                  href="/login"
                  className="block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                >
                  Aller à la connexion
                </Link>
                <Link
                  href="/"
                  className="block text-gray-300 hover:text-white transition-colors text-sm"
                >
                  Retour à l&apos;accueil
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  )
}

