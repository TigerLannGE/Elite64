import { useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Layout from '../../components/Layout'
import { useAuth } from '../../hooks/useAuth'

function getRoleLabel(role: string | undefined): string {
  const roleLabels = {
    ADMIN: 'Administrateur',
    SUPER_ADMIN: 'Super Administrateur',
    PLAYER: 'Joueur',
  }
  return roleLabels[role as keyof typeof roleLabels] || 'Joueur'
}

export default function AdminDashboard() {
  const { player, isAdmin, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!isAdmin) {
        router.replace('/login')
      }
    }
  }, [loading, isAdmin, router])

  if (loading || !isAdmin) {
    return (
      <Layout title="Admin - Elite64">
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
    <Layout title="Tableau de bord administrateur - Elite64">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold text-white">
              Tableau de bord administrateur
            </h1>
            <Link
              href="/lobby"
              className="text-gray-300 hover:text-white transition-colors text-sm"
            >
              ← Retour au lobby
            </Link>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 mb-8">
            <p className="text-gray-200 text-lg">
              Bonjour <strong className="text-white">{player?.username}</strong> ({getRoleLabel(player?.role)})
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link
              href="/admin/players"
              className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 hover:bg-white/15 transition-colors block"
            >
              <h2 className="text-2xl font-bold text-white mb-2">
                Gestion des joueurs
              </h2>
              <p className="text-gray-300 text-sm">
                Lister, consulter et gérer les comptes joueurs. Suspendre ou réactiver des comptes.
              </p>
            </Link>

            <Link
              href="/admin/tournaments"
              className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 hover:bg-white/15 transition-colors block"
            >
              <h2 className="text-2xl font-bold text-white mb-2">
                Gestion des tournois
              </h2>
              <p className="text-gray-300 text-sm">
                Consulter tous les tournois, voir les détails et gérer leur statut.
              </p>
            </Link>

            <Link
              href="/admin/tournaments/create"
              className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 hover:bg-white/15 transition-colors block"
            >
              <h2 className="text-2xl font-bold text-white mb-2">
                Créer un tournoi
              </h2>
              <p className="text-gray-300 text-sm">
                Créer un nouveau tournoi avec tous les paramètres nécessaires. Idéal pour les tests et la gestion avancée.
              </p>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  )
}
