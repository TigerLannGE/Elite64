import { useEffect, useState, Fragment } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Layout from '../../components/Layout'
import { useAuth } from '../../hooks/useAuth'
import { api, AdminPlayer, ApiError } from '../../lib/api'
import { getRoleColor } from '../../lib/roleColors'
import { RoleIcon } from '../../components/RoleIcon'

function getRoleLabel(role: string): string {
  const roleLabels = {
    PLAYER: 'Joueur',
    ADMIN: 'Administrateur',
    SUPER_ADMIN: 'Super Administrateur',
  }
  return roleLabels[role as keyof typeof roleLabels] || 'Joueur'
}

interface RestrictionsEditorProps {
  player: AdminPlayer
  onSave: (playerId: string, restrictions: {
    blockTournaments: boolean
    blockWalletDeposits: boolean
    blockWalletWithdrawals: boolean
    moderationNote?: string
  }) => Promise<void>
  onCancel: () => void
  isUpdating: boolean
}

function RestrictionsEditor({ player, onSave, onCancel, isUpdating }: RestrictionsEditorProps) {
  const [blockTournaments, setBlockTournaments] = useState(player.blockTournaments)
  const [blockWalletDeposits, setBlockWalletDeposits] = useState(player.blockWalletDeposits)
  const [blockWalletWithdrawals, setBlockWalletWithdrawals] = useState(player.blockWalletWithdrawals)
  const [moderationNote, setModerationNote] = useState(player.moderationNote || '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSave(player.id, {
      blockTournaments,
      blockWalletDeposits,
      blockWalletWithdrawals,
      moderationNote: moderationNote.trim() || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="border-b border-white/10 pb-4 mb-4">
        <h3 className="text-lg font-semibold text-white mb-2">
          Modifier les restrictions pour {player.username}
        </h3>
        <p className="text-sm text-gray-400">
          Les restrictions ciblées permettent de bloquer certaines actions sans suspendre complètement le compte.
        </p>
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={blockTournaments}
            onChange={(e) => setBlockTournaments(e.target.checked)}
            className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-2"
            disabled={isUpdating}
          />
          <span className="text-white font-medium">Interdire les tournois</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={blockWalletDeposits}
            onChange={(e) => setBlockWalletDeposits(e.target.checked)}
            className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-2"
            disabled={isUpdating}
          />
          <span className="text-white font-medium">Bloquer les dépôts</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={blockWalletWithdrawals}
            onChange={(e) => setBlockWalletWithdrawals(e.target.checked)}
            className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-2"
            disabled={isUpdating}
          />
          <span className="text-white font-medium">Bloquer les retraits</span>
        </label>
      </div>

      <div>
        <label htmlFor={`moderation-note-${player.id}`} className="block text-sm font-medium text-gray-300 mb-2">
          Note de modération (optionnel)
        </label>
        <textarea
          id={`moderation-note-${player.id}`}
          value={moderationNote}
          onChange={(e) => setModerationNote(e.target.value)}
          placeholder="Ajouter une note pour expliquer les restrictions..."
          rows={3}
          maxLength={1000}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          disabled={isUpdating}
        />
        <p className="text-xs text-gray-400 mt-1">
          {moderationNote.length}/1000 caractères
        </p>
      </div>

      {player.moderationNote && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
          <p className="text-xs font-medium text-blue-200 mb-1">Note actuelle :</p>
          <p className="text-sm text-gray-300">{player.moderationNote}</p>
        </div>
      )}

      <div className="flex items-center gap-3 pt-4 border-t border-white/10">
        <button
          type="submit"
          disabled={isUpdating}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white text-sm font-medium rounded transition-colors"
        >
          {isUpdating ? 'Mise à jour...' : 'Enregistrer'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isUpdating}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-600/50 disabled:cursor-not-allowed text-white text-sm font-medium rounded transition-colors"
        >
          Annuler
        </button>
      </div>
    </form>
  )
}

export default function AdminPlayers() {
  const { player, isAdmin, loading: authLoading } = useAuth()
  const router = useRouter()
  const [players, setPlayers] = useState<AdminPlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [editingRestrictionsId, setEditingRestrictionsId] = useState<string | null>(null)
  const [updatingRestrictionsId, setUpdatingRestrictionsId] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading) {
      if (!isAdmin) {
        router.replace('/login')
      }
    }
  }, [authLoading, isAdmin, router])

  useEffect(() => {
    if (isAdmin && !authLoading) {
      loadPlayers()
    }
  }, [isAdmin, authLoading])

  const loadPlayers = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.getAdminPlayers(0, 100)
      setPlayers(response.data)
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.message || 'Erreur lors du chargement des joueurs')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (playerId: string, currentStatus: boolean) => {
    try {
      setUpdatingId(playerId)
      setError(null)
      const updatedPlayer = await api.updateAdminPlayerStatus(playerId, !currentStatus)
      
      // Mettre à jour le state local
      setPlayers(players.map(p => p.id === playerId ? updatedPlayer : p))
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.message || 'Erreur lors de la mise à jour du statut')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleUpdateRestrictions = async (
    playerId: string,
    restrictions: {
      blockTournaments: boolean
      blockWalletDeposits: boolean
      blockWalletWithdrawals: boolean
      moderationNote?: string
    }
  ) => {
    try {
      setUpdatingRestrictionsId(playerId)
      setError(null)
      const updatedPlayer = await api.updateAdminPlayerRestrictions(playerId, restrictions)
      
      // Mettre à jour le state local
      setPlayers(players.map(p => p.id === playerId ? updatedPlayer : p))
      
      // Fermer le panneau d'édition
      setEditingRestrictionsId(null)
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.message || 'Erreur lors de la mise à jour des restrictions')
    } finally {
      setUpdatingRestrictionsId(null)
    }
  }

  if (authLoading || !isAdmin) {
    return (
      <Layout title="Admin - Joueurs - Elite64">
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
    <Layout title="Gestion des joueurs - Elite64">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold text-white">
              Gestion des joueurs
            </h1>
            <div className="flex items-center gap-4">
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

          {/* Tableau des joueurs */}
          {loading ? (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20">
              <div className="text-white text-center">
                <div className="text-4xl mb-4 animate-spin">⏳</div>
                <p>Chargement des joueurs...</p>
              </div>
            </div>
          ) : players.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20">
              <p className="text-gray-300 text-center">Aucun joueur trouvé.</p>
            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Nom d&apos;utilisateur
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Pays
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Rôle
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Restrictions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {players.map((p) => {
                      const hasRestrictions = p.blockTournaments || p.blockWalletDeposits || p.blockWalletWithdrawals
                      const isEditing = editingRestrictionsId === p.id
                      
                      return (
                        <Fragment key={p.id}>
                          <tr className="hover:bg-white/5">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                {p.role !== 'PLAYER' && (
                                  <RoleIcon role={p.role} className="w-4 h-4" />
                                )}
                                <span className="text-white font-medium" style={{ color: getRoleColor(p.role) }}>
                                  {p.username}
                                </span>
                                {hasRestrictions && (
                                  <span
                                    className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-500/20 border border-orange-500/50"
                                    title="Ce joueur a des restrictions ciblées"
                                  >
                                    <span className="text-orange-200 text-xs font-bold">!</span>
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                              {p.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                              {p.countryCode}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-gray-300">{getRoleLabel(p.role)}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {p.isActive ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-200">
                                  Actif
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-200">
                                  Suspendu
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-wrap gap-1">
                                {hasRestrictions ? (
                                  <>
                                    {p.blockTournaments && (
                                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-orange-500/20 text-orange-200">
                                        Tournois bloqués
                                      </span>
                                    )}
                                    {p.blockWalletDeposits && (
                                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-500/20 text-yellow-200">
                                        Dépôts bloqués
                                      </span>
                                    )}
                                    {p.blockWalletWithdrawals && (
                                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-500/20 text-purple-200">
                                        Retraits bloqués
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-gray-400 text-xs">Aucune restriction ciblée</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                {updatingId === p.id ? (
                                  <div className="text-gray-400 text-sm">Mise à jour...</div>
                                ) : p.isActive ? (
                                  <button
                                    onClick={() => handleToggleStatus(p.id, true)}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded transition-colors"
                                  >
                                    Suspendre
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleToggleStatus(p.id, false)}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded transition-colors"
                                  >
                                    Réactiver
                                  </button>
                                )}
                                <button
                                  onClick={() => setEditingRestrictionsId(isEditing ? null : p.id)}
                                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
                                >
                                  {isEditing ? 'Annuler' : 'Restrictions'}
                                </button>
                              </div>
                            </td>
                          </tr>
                          {isEditing && (
                            <tr>
                              <td colSpan={7} className="px-6 py-4 bg-white/5">
                                <RestrictionsEditor
                                  player={p}
                                  onSave={handleUpdateRestrictions}
                                  onCancel={() => setEditingRestrictionsId(null)}
                                  isUpdating={updatingRestrictionsId === p.id}
                                />
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      )
                    })}
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

