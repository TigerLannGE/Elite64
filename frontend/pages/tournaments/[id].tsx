import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Layout from '../../components/Layout'
import { useAuth } from '../../hooks/useAuth'
import {
  api,
  TournamentListItem,
  TournamentMatchesResponse,
  TournamentStanding,
  TournamentMatch,
  ApiError,
} from '../../lib/api'

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

// Fonction pour obtenir le label d'une ronde
function getRoundLabel(roundNumber: number, totalRounds: number): string {
  if (roundNumber === totalRounds && totalRounds > 1) {
    return 'Finale'
  } else if (roundNumber === totalRounds - 1 && totalRounds > 2) {
    return 'Demi-finale'
  } else if (roundNumber === totalRounds - 2 && totalRounds > 3) {
    return 'Quart de finale'
  } else {
    return `Round ${roundNumber}`
  }
}

// Fonction pour obtenir le label du statut d'un match
function getMatchStatusLabel(status: TournamentMatch['status']): string {
  const labels: Record<string, string> = {
    PENDING: 'À venir',
    RUNNING: 'En cours',
    FINISHED: 'Terminé',
    CANCELED: 'Annulé',
  }
  return labels[status] || status
}

// Fonction pour obtenir le résultat formaté d'un match
function getMatchResultText(match: TournamentMatch): string {
  if (match.status !== 'FINISHED' || !match.result) {
    return ''
  }

  const whitePlayer = match.whiteEntry.player.username
  const blackPlayer = match.blackEntry.player.username

  switch (match.result) {
    case 'WHITE_WIN':
      return `Victoire de ${whitePlayer}`
    case 'BLACK_WIN':
      return `Victoire de ${blackPlayer}`
    case 'DRAW':
      return 'Match nul'
    case 'BYE':
      return `BYE - ${whitePlayer}`
    default:
      return ''
  }
}

export default function TournamentDetail() {
  const router = useRouter()
  const { id } = router.query
  const { isAuthenticated, player, loading: authLoading } = useAuth()
  const [tournament, setTournament] = useState<TournamentListItem | null>(null)
  const [matchesData, setMatchesData] = useState<TournamentMatchesResponse | null>(null)
  const [standings, setStandings] = useState<TournamentStanding[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    if (id && typeof id === 'string' && isAuthenticated && !authLoading) {
      loadTournamentData(id)
    }
  }, [id, isAuthenticated, authLoading])

  const loadTournamentData = async (tournamentId: string) => {
    try {
      setLoading(true)
      setError(null)
      setNotFound(false)

      // Charger les données en parallèle
      const [tournamentData, matchesDataResult, standingsData] = await Promise.all([
        api.getTournament(tournamentId),
        api.getTournamentMatches(tournamentId),
        api.getTournamentStandings(tournamentId),
      ])

      setTournament(tournamentData)
      setMatchesData(matchesDataResult)
      setStandings(standingsData)
    } catch (err) {
      const apiError = err as ApiError
      if (apiError.statusCode === 404) {
        setNotFound(true)
      } else {
        setError(apiError.message || 'Erreur lors du chargement du tournoi')
      }
    } finally {
      setLoading(false)
    }
  }

  // Vérifier si le joueur connecté est impliqué dans un match
  const isPlayerInMatch = (match: TournamentMatch): boolean => {
    if (!player) return false
    return (
      match.whiteEntry.player.id === player.id ||
      match.blackEntry.player.id === player.id
    )
  }

  // Calculer le nombre total de rondes
  const totalRounds = matchesData
    ? Math.max(
        ...Object.keys(matchesData.matchesByRound).map((r) => parseInt(r, 10)),
        0,
      )
    : 0

  if (authLoading || loading) {
    return (
      <Layout title="Détail du tournoi - Elite64">
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

  if (notFound) {
    return (
      <Layout title="Tournoi introuvable - Elite64">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-white mb-4">
              Tournoi introuvable
            </h1>
            <p className="text-gray-300 mb-6">
              Le tournoi que vous recherchez n&apos;existe pas ou a été supprimé.
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/tournaments"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                ← Retour aux tournois
              </Link>
              <Link
                href="/lobby"
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
              >
                ← Retour au lobby
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (error || !tournament) {
    return (
      <Layout title="Erreur - Elite64">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-6 mb-6">
              <p className="text-red-200">
                {error || 'Erreur lors du chargement du tournoi'}
              </p>
            </div>
            <div className="flex gap-4">
              <Link
                href="/tournaments"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                ← Retour aux tournois
              </Link>
              <Link
                href="/lobby"
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
              >
                ← Retour au lobby
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title={`${tournament.name} - Elite64`}>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Navigation */}
          <div className="flex gap-4 mb-6">
            <Link
              href="/tournaments"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              ← Retour aux tournois
            </Link>
            <span className="text-gray-500">•</span>
            <Link
              href="/lobby"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              ← Retour au lobby
            </Link>
          </div>

          {/* Section Résumé du tournoi */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 mb-6">
            <h1 className="text-4xl font-bold text-white mb-6">
              {tournament.name}
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">
                  Informations
                </h2>
                <div className="space-y-2 text-gray-300">
                  <p>
                    <span className="font-semibold text-white">Time control :</span>{' '}
                    {tournament.timeControl}
                  </p>
                  <p>
                    <span className="font-semibold text-white">Statut :</span>{' '}
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-200 border border-blue-500/30">
                      {getStatusLabel(tournament.status)}
                    </span>
                  </p>
                  <p>
                    <span className="font-semibold text-white">Droit d&apos;entrée :</span>{' '}
                    {formatCents(tournament.buyInCents, tournament.currency)}
                  </p>
                  <p>
                    <span className="font-semibold text-white">Joueurs :</span>{' '}
                    {tournament.currentPlayers} / {tournament.minPlayers} min /{' '}
                    {tournament.maxPlayers} max
                  </p>
                  {tournament.startsAt && (
                    <p>
                      <span className="font-semibold text-white">Début :</span>{' '}
                      {new Date(tournament.startsAt).toLocaleString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  )}
                  {tournament.endsAt && (
                    <p>
                      <span className="font-semibold text-white">Fin :</span>{' '}
                      {new Date(tournament.endsAt).toLocaleString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  )}
                  {tournament.registrationClosesAt && (
                    <p>
                      <span className="font-semibold text-white">
                        Inscriptions closes :
                      </span>{' '}
                      {new Date(tournament.registrationClosesAt).toLocaleString('fr-FR', {
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
                      <span className="font-semibold text-white">Elo requis :</span>{' '}
                      {tournament.eloMin} - {tournament.eloMax}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-white mb-4">
                  Prize Pool
                </h2>
                <div className="space-y-3">
                  <div className="bg-gray-500/20 rounded-lg p-3 border border-gray-500/30">
                    <div className="text-xs text-gray-400 mb-1">Minimum</div>
                    <div className="text-lg font-semibold text-white">
                      {formatCents(
                        tournament.prizePools.min.distributableCents,
                        tournament.currency,
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      ({tournament.minPlayers} joueurs)
                    </div>
                  </div>
                  <div className="bg-blue-500/20 rounded-lg p-3 border border-blue-500/30">
                    <div className="text-xs text-blue-300 mb-1">Actuel</div>
                    <div className="text-lg font-semibold text-white">
                      {formatCents(
                        tournament.prizePools.current.distributableCents,
                        tournament.currency,
                      )}
                    </div>
                    <div className="text-xs text-blue-300 mt-1">
                      ({tournament.currentPlayers} joueurs)
                    </div>
                  </div>
                  <div className="bg-green-500/20 rounded-lg p-3 border border-green-500/30">
                    <div className="text-xs text-green-300 mb-1">Maximum</div>
                    <div className="text-lg font-semibold text-white">
                      {formatCents(
                        tournament.prizePools.max.distributableCents,
                        tournament.currency,
                      )}
                    </div>
                    <div className="text-xs text-green-300 mt-1">
                      ({tournament.maxPlayers} joueurs)
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Rappel légal */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-sm text-gray-400 italic">
                🎯 Compétition d&apos;échecs basée sur la compétence. Aucune mécanique de
                pari ni de hasard.
              </p>
            </div>
          </div>

          {/* Section Matches */}
          {matchesData && Object.keys(matchesData.matchesByRound).length > 0 && (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 mb-6">
              <h2 className="text-2xl font-bold text-white mb-6">Matches</h2>

              {Object.entries(matchesData.matchesByRound)
                .sort(([a], [b]) => parseInt(a, 10) - parseInt(b, 10))
                .map(([roundNumberStr, matches]) => {
                  const roundNumber = parseInt(roundNumberStr, 10)
                  return (
                    <div key={roundNumber} className="mb-8 last:mb-0">
                      <h3 className="text-xl font-semibold text-white mb-4">
                        {getRoundLabel(roundNumber, totalRounds)}
                      </h3>
                      <div className="space-y-3">
                        {matches.map((match) => {
                          const isPlayerMatch = isPlayerInMatch(match)
                          return (
                            <div
                              key={match.id}
                              className={`bg-white/5 rounded-lg p-4 border ${
                                isPlayerMatch
                                  ? 'border-blue-500/50 bg-blue-500/10'
                                  : 'border-white/10'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <span className="text-sm font-semibold text-gray-400">
                                      Board {match.boardNumber}
                                    </span>
                                    <span
                                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                        match.status === 'FINISHED'
                                          ? 'bg-green-500/20 text-green-200 border border-green-500/30'
                                          : match.status === 'RUNNING'
                                          ? 'bg-yellow-500/20 text-yellow-200 border border-yellow-500/30'
                                          : 'bg-gray-500/20 text-gray-200 border border-gray-500/30'
                                      }`}
                                    >
                                      {getMatchStatusLabel(match.status)}
                                    </span>
                                  </div>
                                  <div className="text-white">
                                    <span className="font-semibold">
                                      {match.whiteEntry.player.username}
                                    </span>
                                    {match.whiteEntry.player.elo && (
                                      <span className="text-sm text-gray-400 ml-2">
                                        ({match.whiteEntry.player.elo})
                                      </span>
                                    )}
                                    <span className="mx-3 text-gray-500">vs</span>
                                    <span className="font-semibold">
                                      {match.blackEntry.player.username}
                                    </span>
                                    {match.blackEntry.player.elo && (
                                      <span className="text-sm text-gray-400 ml-2">
                                        ({match.blackEntry.player.elo})
                                      </span>
                                    )}
                                  </div>
                                  {match.status === 'FINISHED' && match.result && (
                                    <div className="mt-2 text-sm text-gray-300">
                                      {getMatchResultText(match)}
                                      {match.resultReason && (
                                        <span className="text-gray-500 ml-2">
                                          ({match.resultReason})
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Bouton pour rejoindre/jouer le match */}
                                {isPlayerMatch && (match.status === 'PENDING' || match.status === 'RUNNING') && (
                                  <div className="ml-4">
                                    <Link
                                      href={`/matches/${match.id}`}
                                      className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                                        match.status === 'RUNNING'
                                          ? 'bg-green-600 hover:bg-green-700 text-white'
                                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                                      }`}
                                    >
                                      {match.status === 'RUNNING' ? 'Jouer le match' : 'Rejoindre le match'}
                                    </Link>
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
            </div>
          )}

          {/* Section Classement / Résultats */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">
              Classement / Résultats
            </h2>

            {tournament.status !== 'FINISHED' ? (
              <p className="text-gray-300 text-center py-8">
                Le classement final sera disponible à la fin du tournoi.
              </p>
            ) : standings.length === 0 ? (
              <p className="text-gray-300 text-center py-8">
                Aucun classement disponible pour le moment.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-white font-semibold">
                        Position
                      </th>
                      <th className="text-left py-3 px-4 text-white font-semibold">
                        Joueur
                      </th>
                      <th className="text-center py-3 px-4 text-white font-semibold">
                        Victoires
                      </th>
                      <th className="text-center py-3 px-4 text-white font-semibold">
                        Défaites
                      </th>
                      <th className="text-center py-3 px-4 text-white font-semibold">
                        Nuls
                      </th>
                      <th className="text-right py-3 px-4 text-white font-semibold">
                        Gains
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((standing, index) => (
                      <tr
                        key={standing.playerId}
                        className={`border-b border-white/5 ${
                          standing.position === 1
                            ? 'bg-yellow-500/10'
                            : index % 2 === 0
                            ? 'bg-white/5'
                            : ''
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {standing.position === 1 && (
                              <span className="text-yellow-400 text-lg">👑</span>
                            )}
                            <span className="text-white font-semibold">
                              {standing.position}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-white font-medium">
                            {standing.username}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-green-300">
                          {standing.wins}
                        </td>
                        <td className="py-3 px-4 text-center text-red-300">
                          {standing.losses}
                        </td>
                        <td className="py-3 px-4 text-center text-gray-300">
                          {standing.draws}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {standing.payoutCents ? (
                            <span className="text-green-400 font-semibold">
                              {formatCents(standing.payoutCents, tournament.currency)}
                            </span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

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

