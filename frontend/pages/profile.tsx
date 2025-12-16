import Head from 'next/head'
import Link from 'next/link'
import { useAuth } from '../hooks/useAuth'
import { getRoleColor } from '../lib/roleColors'
import { RoleIcon } from '../components/RoleIcon'

export default function Profile() {
  const { player, loading, isAdmin } = useAuth()

  if (loading) {
    return (
      <>
        <Head>
          <title>Profil - ChessBet</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
          <div className="container mx-auto px-4 py-8">
            <p className="text-gray-300 text-center">Chargement...</p>
          </div>
        </main>
      </>
    )
  }

  if (!player) {
    return (
      <>
        <Head>
          <title>Profil - ChessBet</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
          <div className="container mx-auto px-4 py-8">
            <p className="text-gray-300 text-center">Veuillez vous connecter pour voir votre profil.</p>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Profil - ChessBet</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-white">Mon Profil</h1>
            <Link 
              href="/lobby" 
              className="text-gray-300 hover:text-white transition-colors"
            >
              Lobby
            </Link>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 max-w-2xl">
            <div className="space-y-4">
              <div className="pb-4 border-b border-white/20">
                <h2 className="text-2xl font-semibold text-white">Informations du compte</h2>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-400">Nom d&apos;utilisateur</label>
                  <div className="flex items-center gap-2 mt-1">
                    {player.role !== 'PLAYER' && (
                      <RoleIcon role={player.role} className="w-5 h-5" />
                    )}
                    <p 
                      className="text-lg font-semibold"
                      style={{ color: getRoleColor(player.role) }}
                    >
                      {player.username}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-400">Email</label>
                  <p className="text-white text-lg">{player.email}</p>
                  {player.emailVerified ? (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-green-600 text-white mt-1">
                      ✓ Vérifié
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-yellow-600 text-white mt-1">
                      ⚠ Non vérifié
                    </span>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-400">Pays</label>
                  <p className="text-white text-lg">{player.countryCode}</p>
                </div>

                {isAdmin ? (
                  <div>
                    <label className="text-sm font-medium text-gray-400">Statut</label>
                    <p className="text-sm text-gray-400 mt-1">
                      Vous avez accès aux fonctionnalités d&apos;administration.
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}





