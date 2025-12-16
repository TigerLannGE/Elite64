import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Layout from '../components/Layout'
import { useAuth } from '../hooks/useAuth'
import { api, Wallet, ApiError, TransactionType, isAccountSuspended, DEPOSITS_BLOCKED_CODE, WITHDRAWALS_BLOCKED_CODE } from '../lib/api'

const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  DEPOSIT: 'Dépôt',
  WITHDRAWAL: 'Retrait',
  TOURNAMENT_BUY_IN: 'Achat tournoi',
  TOURNAMENT_PAYOUT: 'Gain tournoi',
  BONUS: 'Bonus',
  FEE: 'Frais',
}

export default function WalletPage() {
  const { isAuthenticated, loading: authLoading, logout } = useAuth()
  const router = useRouter()
  const [state, setState] = useState<{
    loading: boolean
    error: string | null
    wallet: Wallet | null
  }>({
    loading: true,
    error: null,
    wallet: null,
  })
  const [testCreditLoading, setTestCreditLoading] = useState(false)
  const [testCreditError, setTestCreditError] = useState<string | null>(null)

  // Rediriger vers /login si non connecté
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, authLoading, router])

  // Charger le wallet au montage
  useEffect(() => {
    if (!isAuthenticated || authLoading) return

    const loadWallet = async () => {
      try {
        setState({ loading: true, error: null, wallet: null })
        const wallet = await api.getMyWallet()
        setState({ loading: false, error: null, wallet })
      } catch (error) {
        const apiError = error as ApiError
        if (apiError.statusCode === 401) {
          router.push('/login')
        } else if (apiError.code === 'ACCOUNT_SUSPENDED') {
          // Compte suspendu - afficher un message clair et rediriger
          setState({
            loading: false,
            error: apiError.message || 'Votre compte a été suspendu. Contactez le support si vous pensez qu\'il s\'agit d\'une erreur.',
            wallet: null,
          })
          // Déconnecter et rediriger vers login après 3 secondes
          setTimeout(() => {
            logout()
            router.push('/login?error=suspended')
          }, 3000)
        } else if (apiError.code === DEPOSITS_BLOCKED_CODE) {
          // Dépôts bloqués (restriction ciblée) - ne pas déconnecter
          setState({
            loading: false,
            error: apiError.message || "Les dépôts sont temporairement indisponibles sur votre compte. Contactez le support pour plus d'informations.",
            wallet: null,
          })
        } else {
          setState({
            loading: false,
            error: apiError.message || 'Erreur lors du chargement du portefeuille',
            wallet: null,
          })
        }
      }
    }

    loadWallet()
  }, [isAuthenticated, authLoading, router, logout])

  const handleTestCredit = async () => {
    if (testCreditLoading) return

    try {
      setTestCreditLoading(true)
      setTestCreditError(null)
      await api.testCredit(1000) // 10,00 € en centimes
      // Rafraîchir le wallet
      const wallet = await api.getMyWallet()
      setState((prev) => ({ ...prev, wallet }))
    } catch (error) {
      const apiError = error as ApiError
      // Gestion spéciale pour les comptes suspendus
      if (apiError.code === 'ACCOUNT_SUSPENDED') {
        alert(apiError.message || 'Votre compte a été suspendu. Vous ne pouvez pas effectuer cette action. Contactez le support si vous pensez qu\'il s\'agit d\'une erreur.')
        // Déconnecter et rediriger vers login après 3 secondes
        setTimeout(() => {
          logout()
          router.push('/login?error=suspended')
        }, 3000)
      } else if (apiError.code === DEPOSITS_BLOCKED_CODE) {
        // Dépôts bloqués (restriction ciblée) - ne pas déconnecter
        setTestCreditError(apiError.message || "Les dépôts sont temporairement indisponibles sur votre compte. Contactez le support pour plus d'informations.")
      } else if (apiError.code === WITHDRAWALS_BLOCKED_CODE) {
        // Retraits bloqués (restriction ciblée) - ne pas déconnecter
        setTestCreditError(apiError.message || "Les retraits sont temporairement suspendus sur votre compte. Contactez le support pour plus d'informations.")
      } else {
        setTestCreditError(apiError.message || 'Erreur lors du crédit de test')
      }
    } finally {
      setTestCreditLoading(false)
    }
  }

  const formatAmount = (amountCents: number, currency: string = 'EUR') => {
    const amount = Math.abs(amountCents) / 100
    const sign = amountCents > 0 ? '+' : '−'
    return `${sign}${amount.toFixed(2)} ${currency}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Ne rien afficher si non connecté (redirection en cours)
  if (!isAuthenticated || authLoading) {
    return (
      <Layout title="Mon portefeuille - ChessBet">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-300">Chargement...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Mon portefeuille - ChessBet">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-white mb-8">Mon portefeuille</h1>

        {state.loading ? (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20">
            <div className="text-center text-gray-300">Chargement...</div>
          </div>
        ) : state.error ? (
          <div className={`backdrop-blur-sm rounded-lg p-6 border ${
            state.error.includes('suspendu') || state.error.includes('bloqué') || state.error.includes('bloqués') || state.error.includes('indisponibles')
              ? 'bg-orange-500/20 border-orange-500/50'
              : 'bg-red-500/20 border-red-500/50'
          }`}>
            <p className={`font-semibold mb-1 ${
              state.error.includes('suspendu') || state.error.includes('bloqué') || state.error.includes('bloqués') || state.error.includes('indisponibles')
                ? 'text-orange-200'
                : 'text-red-200'
            }`}>
              {state.error.includes('suspendu') || state.error.includes('bloqué') || state.error.includes('bloqués') || state.error.includes('indisponibles')
                ? '⚠️ Restriction sur votre compte'
                : '❌ Erreur'}
            </p>
            <p className={state.error.includes('suspendu') || state.error.includes('bloqué') || state.error.includes('bloqués') || state.error.includes('indisponibles')
              ? 'text-orange-200'
              : 'text-red-200'}>
              {state.error}
            </p>
          </div>
        ) : state.wallet ? (
          <>
            {/* Message d'erreur pour testCredit */}
            {testCreditError && (
              <div className="bg-orange-500/20 border border-orange-500/50 rounded-lg p-4 mb-6">
                <p className="text-orange-200 font-semibold mb-1">⚠️ Restriction sur votre compte</p>
                <p className="text-orange-200">{testCreditError}</p>
              </div>
            )}

            {/* Solde */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Solde disponible</p>
                  <p className="text-3xl font-bold text-white">
                    {(state.wallet.balanceCents / 100).toFixed(2)} {state.wallet.currency}
                  </p>
                </div>
                {process.env.NEXT_PUBLIC_ENABLE_TEST_CREDIT === 'true' && (
                  <button
                    onClick={handleTestCredit}
                    disabled={testCreditLoading}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    {testCreditLoading ? 'Chargement...' : 'Ajouter 10€ de crédit de test'}
                  </button>
                )}
              </div>
            </div>

            {/* Transactions */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-4">Transactions récentes</h2>
              
              {state.wallet.transactions.length === 0 ? (
                <p className="text-gray-400 text-center py-8">
                  Aucune transaction pour le moment.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/20">
                        <th className="text-left py-3 px-4 text-gray-300 font-semibold">Date</th>
                        <th className="text-left py-3 px-4 text-gray-300 font-semibold">Type</th>
                        <th className="text-right py-3 px-4 text-gray-300 font-semibold">Montant</th>
                        <th className="text-left py-3 px-4 text-gray-300 font-semibold">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.wallet.transactions.map((transaction) => (
                        <tr
                          key={transaction.id}
                          className="border-b border-white/10 hover:bg-white/5 transition-colors"
                        >
                          <td className="py-3 px-4 text-gray-300">
                            {formatDate(transaction.createdAt)}
                          </td>
                          <td className="py-3 px-4 text-gray-300">
                            {TRANSACTION_TYPE_LABELS[transaction.type] || transaction.type}
                          </td>
                          <td
                            className={`py-3 px-4 text-right font-semibold ${
                              transaction.amountCents > 0
                                ? 'text-green-400'
                                : 'text-red-400'
                            }`}
                          >
                            {formatAmount(transaction.amountCents, state.wallet?.currency || 'EUR')}
                          </td>
                          <td className="py-3 px-4 text-gray-400">
                            {transaction.description || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </Layout>
  )
}

