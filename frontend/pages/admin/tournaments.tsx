import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Layout from '../../components/Layout'
import { useAuth } from '../../hooks/useAuth'
import { api, AdminTournament, ApiError, TournamentStatus } from '../../lib/api'

function getStatusBadgeClass(status: TournamentStatus): string {
  const statusClasses = {
    DRAFT: 'bg-gray-500/20 text-gray-200',
    SCHEDULED: 'bg-blue-500/20 text-blue-200',
    READY: 'bg-green-500/20 text-green-200',
    RUNNING: 'bg-yellow-500/20 text-yellow-200',
    FINISHED: 'bg-purple-500/20 text-purple-200',
    CANCELED: 'bg-red-500/20 text-red-200',
  }
  return statusClasses[status] || statusClasses.DRAFT
}

function getStatusLabel(status: TournamentStatus): string {
  const statusLabels = {
    DRAFT: 'Brouillon',
    SCHEDULED: 'Programmé',
    READY: 'Prêt',
    RUNNING: 'En cours',
    FINISHED: 'Terminé',
    CANCELED: 'Annulé',
  }
  return statusLabels[status] || status
}

function formatCents(cents: number, currency: string = 'EUR'): string {
  const amount = cents / 100
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export default function AdminTournaments() {
  const { player, isAdmin, loading: authLoading } = useAuth()
  const router = useRouter()
  const [tournaments, setTournaments] = useState<AdminTournament[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [closingId, setClosingId] = useState<string | null>(null)
  const [startingId, setStartingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading) {
      if (!isAdmin) {
        router.replace('/login')
      }
    }
  }, [authLoading, isAdmin, router])

  useEffect(() => {
    if (isAdmin && !authLoading) {
      loadTournaments()
    }
  }, [isAdmin, authLoading])

  const loadTournaments = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.getAdminTournaments()
      setTournaments(data)
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.message || 'Erreur lors du chargement des tournois')
    } finally {
      setLoading(false)
    }
  }

  const handleCloseRegistration = async (tournamentId: string) => {
    try {
      setClosingId(tournamentId)
      setError(null)
      setSuccess(null)
      await api.closeRegistration(tournamentId)
      setSuccess('Inscriptions clôturées avec succès')
      // Recharger la liste des tournois après succès
      await loadTournaments()
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.message || 'Erreur lors de la clôture des inscriptions')
    } finally {
      setClosingId(null)
    }
  }

  const handleStartTournament = async (tournamentId: string) => {
    try {
      setStartingId(tournamentId)
      setError(null)
      setSuccess(null)
      await api.adminStartTournament(tournamentId)
      setSuccess('Tournoi démarré avec succès. Les matches du premier tour ont été générés.')
      // Recharger la liste des tournois après succès
      await loadTournaments()
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.message || 'Erreur lors du démarrage du tournoi')
    } finally {
      setStartingId(null)
    }
  }

  const canCloseRegistration = (tournament: AdminTournament): boolean => {
    return tournament.status === 'SCHEDULED' || tournament.status === 'DRAFT'
  }

  const canStartTournament = (tournament: AdminTournament): boolean => {
    return tournament.status === 'READY'
  }

  const handleDeleteTournament = async (tournamentId: string, tournamentName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le tournoi "${tournamentName}" ? Cette action est irréversible.`)) {
      return
    }

    try {
      setDeletingId(tournamentId)
      setError(null)
      setSuccess(null)
      await api.deleteTournament(tournamentId)
      setSuccess('Tournoi supprimé avec succès')
      // Recharger la liste des tournois après succès
      await loadTournaments()
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.message || 'Erreur lors de la suppression du tournoi')
    } finally {
      setDeletingId(null)
    }
  }

  if (authLoading || !isAdmin) {
    return (
      <Layout title="Admin - Tournois - Elite64">
        <div className="container mx-auto px-4 py-16 flex items-center justify-center">
          <div className="text-white text-center">
            <div className="text-4xl mb-4 animate-pulse">⏳</div>
            <p>Chargement...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Gestion des tournois - Elite64">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold text-white">
              Gestion des tournois
            </h1>
            <div className="flex items-center gap-4">
              <Link
                href="/admin/tournaments/create"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
              >
                + Créer un tournoi
              </Link>
              <Link
                href="/lobby"
                className="text-gray-300 hover:text-white transition-colors text-sm"
              >
                ← Retour au lobby
              </Link>
              <Link
                href="/admin"
                className="text-gray-300 hover:text-white transition-colors text-sm"
              >
                Dashboard
              </Link>
            </div>
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
              <p className="text-red-200">{error}</p>
            </div>
          )}

          {/* Message de succès */}
          {success && (
            <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 mb-6">
              <p className="text-green-200">{success}</p>
            </div>
          )}

          {/* Tableau des tournois */}
          {loading ? (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20">
              <div className="text-white text-center">
                <div className="text-4xl mb-4 animate-spin">⏳</div>
                <p>Chargement des tournois...</p>
              </div>
            </div>
          ) : tournaments.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20">
              <p className="text-gray-300 text-center">Aucun tournoi trouvé.</p>
            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Nom
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Joueurs
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Buy-in
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Début
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Clôture inscriptions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Zone légale
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {tournaments.map((tournament) => (
                      <tr key={tournament.id} className="hover:bg-white/5">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-white font-medium">{tournament.name}</div>
                          <div className="text-sm text-gray-400">{tournament.timeControl}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(tournament.status)}`}>
                            {getStatusLabel(tournament.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                          {tournament.currentPlayers} / {tournament.minPlayers}-{tournament.maxPlayers}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                          {formatCents(tournament.buyInCents, tournament.currency)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-300 text-sm">
                          {tournament.startsAt
                            ? new Date(tournament.startsAt).toLocaleString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-300 text-sm">
                          {tournament.registrationClosesAt
                            ? new Date(tournament.registrationClosesAt).toLocaleString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                          {tournament.legalZoneCode}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-2">
                            {/* Lien "Voir le tournoi" */}
                            <Link
                              href={`/tournaments/${tournament.id}`}
                              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded transition-colors text-center"
                            >
                              Voir le tournoi
                            </Link>

                            {/* Bouton "Démarrer le tournoi" */}
                            {startingId === tournament.id ? (
                              <div className="text-gray-400 text-sm text-center">Démarrage...</div>
                            ) : canStartTournament(tournament) ? (
                              <button
                                onClick={() => handleStartTournament(tournament.id)}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded transition-colors"
                              >
                                Démarrer le tournoi
                              </button>
                            ) : null}

                            {/* Bouton "Clôturer les inscriptions" */}
                            {closingId === tournament.id ? (
                              <div className="text-gray-400 text-sm text-center">Clôture...</div>
                            ) : canCloseRegistration(tournament) ? (
                              <button
                                onClick={() => handleCloseRegistration(tournament.id)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
                              >
                                Clôturer les inscriptions
                              </button>
                            ) : null}

                            {/* Bouton "Supprimer" */}
                            {deletingId === tournament.id ? (
                              <div className="text-gray-400 text-sm text-center">Suppression...</div>
                            ) : (
                              <button
                                onClick={() => handleDeleteTournament(tournament.id, tournament.name)}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded transition-colors"
                              >
                                Supprimer
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
