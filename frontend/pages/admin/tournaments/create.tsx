import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Layout from '../../../components/Layout'
import { useAuth } from '../../../hooks/useAuth'
import { api, ApiError, TournamentStatus } from '../../../lib/api'

type PrizePoolMode = 'AUTO' | 'FIXE'
type TimeControlOption = '10+0' | '3+0' | '1+0'

export default function CreateTournament() {
  const { isAdmin, loading: authLoading } = useAuth()
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: '',
    maxPlayers: 4,
    timeControl: '10+0' as TimeControlOption,
    buyInCents: 1000,
    prizePoolMode: 'AUTO' as PrizePoolMode,
    startsAt: '',
    startImmediately: false,
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  if (authLoading || !isAdmin) {
    return (
      <Layout title="Créer un tournoi - ChessBet">
        <div className="container mx-auto px-4 py-16 flex items-center justify-center">
          <div className="text-white text-center">
            <div className="text-4xl mb-4 animate-pulse">⏳</div>
            <p>Chargement...</p>
          </div>
        </div>
      </Layout>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Préparer les données pour l'API
      const tournamentData: any = {
        name: formData.name,
        timeControl: formData.timeControl,
        buyInCents: formData.buyInCents,
        currency: 'EUR',
        minPlayers: 2, // Minimum par défaut
        maxPlayers: formData.maxPlayers,
        legalZoneCode: 'FR', // Par défaut, peut être étendu plus tard
        status: 'SCHEDULED', // Toujours SCHEDULED pour que le tournoi soit visible dans le lobby
      }

      // Gérer startsAt
      if (formData.startImmediately) {
        // Si démarrage immédiat, définir startsAt à maintenant
        tournamentData.startsAt = new Date().toISOString()
      } else if (formData.startsAt) {
        tournamentData.startsAt = new Date(formData.startsAt).toISOString()
      } else {
        // Si aucune date n'est renseignée, définir une date par défaut (dans 1 heure)
        // pour que le tournoi soit visible dans le lobby
        const defaultStartDate = new Date()
        defaultStartDate.setHours(defaultStartDate.getHours() + 1)
        tournamentData.startsAt = defaultStartDate.toISOString()
      }

      // Note: prizePoolMode n'est pas encore géré par le backend
      // Pour l'instant, on utilise la logique par défaut (AUTO)
      // TODO: Implémenter prizePoolMode dans le backend si nécessaire

      const tournament = await api.createTournament(tournamentData)

      setSuccess(`Tournoi "${tournament.name}" créé avec succès !`)
      
      // Rediriger vers la page de gestion des tournois après 2 secondes
      setTimeout(() => {
        router.push('/admin/tournaments')
      }, 2000)
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.message || 'Erreur lors de la création du tournoi')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
        // Si "démarrage immédiat" est coché, vider startsAt
        ...(name === 'startImmediately' && checked ? { startsAt: '' } : {}),
      }))
    } else if (name === 'maxPlayers' || name === 'buyInCents') {
      setFormData((prev) => ({
        ...prev,
        [name]: parseInt(value, 10) || 0,
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  return (
    <Layout title="Créer un tournoi - ChessBet">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold text-white">
              Créer un tournoi
            </h1>
            <div className="flex items-center gap-4">
              <Link
                href="/admin/tournaments"
                className="text-gray-300 hover:text-white transition-colors text-sm"
              >
                ← Retour aux tournois
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

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20">
            <div className="space-y-6">
              {/* Nom du tournoi */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                  Nom du tournoi *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Tournoi Rapide Décembre 2025"
                />
              </div>

              {/* Nombre maximum de joueurs */}
              <div>
                <label htmlFor="maxPlayers" className="block text-sm font-medium text-gray-300 mb-2">
                  Nombre maximum de joueurs *
                </label>
                <input
                  type="number"
                  id="maxPlayers"
                  name="maxPlayers"
                  required
                  min="2"
                  max="128"
                  value={formData.maxPlayers}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="mt-1 text-sm text-gray-400">
                  Minimum: 2 joueurs (fixe)
                </p>
              </div>

              {/* Time Control */}
              <div>
                <label htmlFor="timeControl" className="block text-sm font-medium text-gray-300 mb-2">
                  Time Control *
                </label>
                <select
                  id="timeControl"
                  name="timeControl"
                  required
                  value={formData.timeControl}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="10+0">10+0 (10 minutes, pas d&apos;incrément)</option>
                  <option value="3+0">3+0 (3 minutes, pas d&apos;incrément)</option>
                  <option value="1+0">1+0 (1 minute, pas d&apos;incrément)</option>
                </select>
              </div>

              {/* Buy-in */}
              <div>
                <label htmlFor="buyInCents" className="block text-sm font-medium text-gray-300 mb-2">
                  Buy-in (en centimes) *
                </label>
                <input
                  type="number"
                  id="buyInCents"
                  name="buyInCents"
                  required
                  min="0"
                  step="100"
                  value={formData.buyInCents}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="mt-1 text-sm text-gray-400">
                  {new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: 'EUR',
                    minimumFractionDigits: 2,
                  }).format(formData.buyInCents / 100)}
                </p>
              </div>

              {/* Prize Pool Mode */}
              <div>
                <label htmlFor="prizePoolMode" className="block text-sm font-medium text-gray-300 mb-2">
                  Mode Prize Pool
                </label>
                <select
                  id="prizePoolMode"
                  name="prizePoolMode"
                  value={formData.prizePoolMode}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="AUTO">AUTO (calculé automatiquement)</option>
                  <option value="FIXE">FIXE (montant fixe - à venir)</option>
                </select>
                <p className="mt-1 text-sm text-gray-400">
                  {formData.prizePoolMode === 'AUTO'
                    ? 'Le prize pool sera calculé automatiquement à partir des buy-ins'
                    : 'Mode FIXE : à implémenter dans une version future'}
                </p>
              </div>

              {/* Démarrage immédiat */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="startImmediately"
                  name="startImmediately"
                  checked={formData.startImmediately}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
                />
                <label htmlFor="startImmediately" className="ml-2 text-sm font-medium text-gray-300">
                  Démarrage immédiat (statut SCHEDULED)
                </label>
              </div>

              {/* Date de début (si pas immédiat) */}
              {!formData.startImmediately && (
                <div>
                  <label htmlFor="startsAt" className="block text-sm font-medium text-gray-300 mb-2">
                    Date de début (optionnel)
                  </label>
                  <input
                    type="datetime-local"
                    id="startsAt"
                    name="startsAt"
                    value={formData.startsAt}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-sm text-gray-400">
                    Si non renseigné, une date par défaut sera définie (dans 1 heure). Le tournoi sera visible dans le lobby.
                  </p>
                </div>
              )}

              {/* Boutons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                >
                  {loading ? 'Création...' : 'Créer le tournoi'}
                </button>
                <Link
                  href="/admin/tournaments"
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors text-center"
                >
                  Annuler
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  )
}
