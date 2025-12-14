import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Layout from '../components/Layout'
import { useAuth } from '../hooks/useAuth'
import { api, TournamentListItem, ApiError, isAccountSuspended, TOURNAMENTS_BLOCKED_CODE } from '../lib/api'

// Fonction utilitaire pour formater les centimes en monnaie
function formatCents(cents: number, currency: string = 'EUR'): string {
  const amount = cents / 100
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Fonction pour déterminer l'état du tournoi et les couleurs
function getTournamentState(tournament: TournamentListItem) {
  const { currentPlayers, minPlayers, maxPlayers } = tournament

  if (currentPlayers < minPlayers) {
    // État 1 : < minPlayers
    return {
      state: 'below-min' as const,
      badgeColor: 'bg-gray-100 text-gray-800 border-gray-300',
      textColor: 'text-gray-200',
      title: `Prize pool min : ${formatCents(tournament.prizePools.min.distributableCents, tournament.currency)}`,
      subtitle: `Inscrits : ${currentPlayers} / min ${minPlayers} / max ${maxPlayers} – Tournoi annulé si < ${minPlayers}.`,
    }
  } else if (currentPlayers >= minPlayers && currentPlayers < maxPlayers) {
    // État 2 : entre min et max
    return {
      state: 'medium' as const,
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
      textColor: 'text-blue-200',
      title: `Prize pool actuel : ${formatCents(tournament.prizePools.current.distributableCents, tournament.currency)}`,
      subtitle: `Peut monter jusqu'à ${formatCents(tournament.prizePools.max.distributableCents, tournament.currency)}.`,
    }
  } else {
    // État 3 : max atteint
    return {
      state: 'max' as const,
      badgeColor: 'bg-green-100 text-green-800 border-green-300',
      textColor: 'text-green-200',
      title: `Prize pool max atteint : ${formatCents(tournament.prizePools.max.distributableCents, tournament.currency)}`,
      subtitle: `Tournoi complet (${maxPlayers} / ${maxPlayers}).`,
    }
  }
}

// Fonction pour vérifier si on peut rejoindre un tournoi
function canJoinTournament(tournament: TournamentListItem): boolean {
  const now = new Date()
  const registrationClosesAt = tournament.registrationClosesAt
    ? new Date(tournament.registrationClosesAt)
    : null

  return (
    (tournament.status === 'SCHEDULED' || tournament.status === 'READY') &&
    tournament.currentPlayers < tournament.maxPlayers &&
    (!registrationClosesAt || now < registrationClosesAt)
  )
}

export default function Lobby() {
  const router = useRouter()
  const { isAuthenticated, player, loading, logout } = useAuth()
  const [tournaments, setTournaments] = useState<TournamentListItem[]>([])
  const [loadingTournaments, setLoadingTournaments] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [joiningTournamentId, setJoiningTournamentId] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, loading, router])

  useEffect(() => {
    if (isAuthenticated && !loading) {
      loadTournaments()
    }
  }, [isAuthenticated, loading])

  const loadTournaments = async () => {
    try {
      setLoadingTournaments(true)
      setError(null)
      const data = await api.getTournaments()
      setTournaments(data)
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.message || 'Erreur lors du chargement des tournois')
    } finally {
      setLoadingTournaments(false)
    }
  }

  const handleJoinTournament = async (tournamentId: string) => {
    try {
      setJoiningTournamentId(tournamentId)
      setError(null)
      await api.joinTournament(tournamentId)
      // Recharger la liste des tournois après inscription réussie
      await loadTournaments()
    } catch (err) {
      const apiError = err as ApiError
      // Gestion spéciale pour les comptes suspendus
      if (apiError.code === 'ACCOUNT_SUSPENDED' || (apiError.statusCode === 403 && apiError.code === 'ACCOUNT_SUSPENDED')) {
        setError("Votre compte a été suspendu. Vous ne pouvez plus rejoindre de tournois.")
        // Déconnecter automatiquement après 3 secondes et rediriger vers login
        setTimeout(() => {
          logout()
          router.push('/login?error=suspended')
        }, 3000)
        return
      }
      // Gestion pour les tournois bloqués (restriction ciblée)
      if (apiError.code === TOURNAMENTS_BLOCKED_CODE) {
        setError("Votre compte ne peut actuellement pas participer aux tournois. Contactez le support pour plus d'informations.")
        return
      }
      // Autres erreurs
      setError(apiError.message || 'Erreur lors de l\'inscription au tournoi.')
    } finally {
      setJoiningTournamentId(null)
    }
  }

  if (loading || loadingTournaments) {
    return (
      <Layout title="Lobby - ChessBet">
        <div className="container mx-auto px-4 py-16 flex items-center justify-center">
          <div className="text-white text-center">
            <div className="text-4xl mb-4 animate-pulse">⏳</div>
            <p>Chargement...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <Layout title="Lobby - ChessBet">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold text-white">
              Lobby des Tournois
            </h1>
            <Link
              href="/tournaments"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              Voir tous les tournois
            </Link>
          </div>

          {/* Message de contexte */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 mb-6">
            <p className="text-gray-200 mb-2">
              Bonjour <strong className="text-white">{player?.username}</strong> !
            </p>
            <p className="text-gray-300 text-sm">
              Les prize pools indiqués dépendent du nombre de joueurs inscrits.
              <br />
              Le tournoi est annulé et remboursé si moins de joueurs minimum s'inscrivent.
            </p>
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className={`border rounded-lg p-4 mb-6 ${
              error.includes('suspendu') || error.includes('bloqué') || error.includes('bloqués')
                ? 'bg-orange-500/20 border-orange-500/50'
                : 'bg-red-500/20 border-red-500/50'
            }`}>
              {error.includes('suspendu') || error.includes('bloqué') || error.includes('bloqués') ? (
                <>
                  <p className="font-semibold mb-1 text-orange-200">
                    ⚠️ Restriction sur votre compte
                  </p>
                  <p className="text-orange-200">{error}</p>
                </>
              ) : (
                <p className="text-red-200">{error}</p>
              )}
            </div>
          )}

          {/* Liste des tournois */}
          {tournaments.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20">
              <p className="text-gray-300 text-center py-8">
              Aucun tournoi disponible pour le moment.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {tournaments.map((tournament) => {
                const state = getTournamentState(tournament)
                const canJoin = canJoinTournament(tournament)
                const isJoining = joiningTournamentId === tournament.id

                return (
                  <div
                    key={tournament.id}
                    className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 hover:bg-white/15 transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      {/* Informations principales */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h2 className="text-2xl font-bold text-white mb-2">
                              {tournament.name}
                            </h2>
                            <div className="flex flex-wrap gap-2 text-sm text-gray-300">
                              <span>⏱️ {tournament.timeControl}</span>
                              <span>•</span>
                              <span>💰 {formatCents(tournament.buyInCents, tournament.currency)}</span>
                              <span>•</span>
                              <span>👥 {tournament.currentPlayers} / {tournament.maxPlayers}</span>
                              {tournament.startsAt && (
                                <>
                                  <span>•</span>
                                  <span>
                                    🗓️ {new Date(tournament.startsAt).toLocaleString('fr-FR')}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            tournament.status === 'SCHEDULED' ? 'bg-blue-500/20 text-blue-200' :
                            tournament.status === 'READY' ? 'bg-green-500/20 text-green-200' :
                            tournament.status === 'RUNNING' ? 'bg-yellow-500/20 text-yellow-200' :
                            'bg-gray-500/20 text-gray-200'
                          }`}>
                            {tournament.status}
                          </span>
                        </div>

                        {/* Badge Prize Pool */}
                        <div className={`inline-block px-4 py-2 rounded-lg border ${state.badgeColor} mb-3`}>
                          <div className="font-semibold">{state.title}</div>
                          <div className="text-xs mt-1 opacity-90">{state.subtitle}</div>
                        </div>

                        {/* Détails supplémentaires */}
                        <div className="text-sm text-gray-400 mt-3">
                          {tournament.registrationClosesAt && (
                            <p>
                              Inscriptions closes le :{' '}
                              {new Date(tournament.registrationClosesAt).toLocaleString('fr-FR')}
                            </p>
                          )}
                          {tournament.eloMin && tournament.eloMax && (
                            <p>
                              Elo requis : {tournament.eloMin} - {tournament.eloMax}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Bouton Rejoindre */}
                      <div className="flex items-center">
                        {canJoin ? (
                          <button
                            onClick={() => handleJoinTournament(tournament.id)}
                            disabled={isJoining}
                            className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
                          >
                            {isJoining ? 'Inscription...' : 'Rejoindre'}
                          </button>
                        ) : (
                          <div className="px-6 py-3 bg-gray-600 text-gray-400 font-semibold rounded-lg cursor-not-allowed">
                            {tournament.currentPlayers >= tournament.maxPlayers
                              ? 'Complet'
                              : tournament.status === 'CANCELED'
                              ? 'Annulé'
                              : 'Inscriptions closes'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
