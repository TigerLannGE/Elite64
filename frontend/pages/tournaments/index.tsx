import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Layout from '../../components/Layout'
import { useAuth } from '../../hooks/useAuth'
import { api, TournamentListItem, ApiError } from '../../lib/api'

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

// Fonction pour obtenir le label du statut
function getStatusLabel(status: TournamentListItem['status']): string {
  const labels: Record<string, string> = {
    DRAFT: 'Brouillon',
    SCHEDULED: 'Programmé',
    READY: 'Prêt',
    RUNNING: 'En cours',
    FINISHED: 'Terminé',
    CANCELED: 'Annulé',
  }
  return labels[status] || status
}

// Fonction pour obtenir la couleur du badge de statut
function getStatusBadgeColor(status: TournamentListItem['status']): string {
  const colors: Record<string, string> = {
    SCHEDULED: 'bg-blue-500/20 text-blue-200 border-blue-500/30',
    READY: 'bg-green-500/20 text-green-200 border-green-500/30',
    RUNNING: 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30',
    FINISHED: 'bg-gray-500/20 text-gray-200 border-gray-500/30',
    CANCELED: 'bg-red-500/20 text-red-200 border-red-500/30',
    DRAFT: 'bg-gray-500/20 text-gray-200 border-gray-500/30',
  }
  return colors[status] || 'bg-gray-500/20 text-gray-200 border-gray-500/30'
}

type FilterTab = 'active' | 'finished'

export default function TournamentsList() {
  const router = useRouter()
  const { isAuthenticated, loading } = useAuth()
  const [tournaments, setTournaments] = useState<TournamentListItem[]>([])
  const [loadingTournaments, setLoadingTournaments] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<FilterTab>('active')

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

  // Filtrer les tournois selon l'onglet actif
  const filteredTournaments = tournaments.filter((tournament) => {
    if (activeTab === 'active') {
      return ['SCHEDULED', 'READY', 'RUNNING'].includes(tournament.status)
    } else {
      return tournament.status === 'FINISHED'
    }
  })

  if (loading || loadingTournaments) {
    return (
      <Layout title="Tous les tournois - ChessBet">
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
    <Layout title="Tous les tournois - ChessBet">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8">
            Tous les tournois
          </h1>

          {/* Message d'erreur */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
              <p className="text-red-200">{error}</p>
            </div>
          )}

          {/* Onglets de filtre */}
          <div className="flex gap-2 mb-6 border-b border-white/10">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === 'active'
                  ? 'text-white border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              À venir / en cours
            </button>
            <button
              onClick={() => setActiveTab('finished')}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === 'finished'
                  ? 'text-white border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Terminés
            </button>
          </div>

          {/* Liste des tournois */}
          {filteredTournaments.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20">
              <p className="text-gray-300 text-center py-8">
                {activeTab === 'active'
                  ? 'Aucun tournoi à venir ou en cours pour le moment.'
                  : 'Aucun tournoi terminé pour le moment.'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredTournaments.map((tournament) => {
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
                            <div className="flex flex-wrap gap-2 text-sm text-gray-300 mb-2">
                              <span>⏱️ {tournament.timeControl}</span>
                              <span>•</span>
                              <span>💰 Droit d&apos;entrée : {formatCents(tournament.buyInCents, tournament.currency)}</span>
                              <span>•</span>
                              <span>👥 {tournament.currentPlayers} / {tournament.maxPlayers}</span>
                              {tournament.startsAt && (
                                <>
                                  <span>•</span>
                                  <span>
                                    🗓️ {new Date(tournament.startsAt).toLocaleString('fr-FR', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeColor(tournament.status)}`}>
                            {getStatusLabel(tournament.status)}
                          </span>
                        </div>

                        {/* Badge Skill game */}
                        <div className="inline-block px-3 py-1 rounded-full bg-purple-500/20 text-purple-200 border border-purple-500/30 text-xs font-medium mb-3">
                          🎯 Skill game
                        </div>

                        {/* Détails supplémentaires */}
                        <div className="text-sm text-gray-400 mt-3">
                          {tournament.registrationClosesAt && (
                            <p>
                              Inscriptions closes le :{' '}
                              {new Date(tournament.registrationClosesAt).toLocaleString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          )}
                          {tournament.endsAt && tournament.status === 'FINISHED' && (
                            <p>
                              Terminé le :{' '}
                              {new Date(tournament.endsAt).toLocaleString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          )}
                          {tournament.eloMin && tournament.eloMax && (
                            <p>
                              Elo requis : {tournament.eloMin} - {tournament.eloMax}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Bouton Voir le tournoi */}
                      <div className="flex items-center">
                        <Link
                          href={`/tournaments/${tournament.id}`}
                          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                        >
                          Voir le tournoi
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Mention légale */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-xs text-gray-500 text-center italic">
              Service réservé aux joueurs majeurs, participation interdite dans les juridictions où ce type de compétition n&apos;est pas autorisé.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}

