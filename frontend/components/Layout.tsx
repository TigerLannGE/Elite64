import Head from 'next/head'
import Link from 'next/link'
import { useAuth } from '../hooks/useAuth'
import { getRoleColor } from '../lib/roleColors'
import { RoleIcon } from './RoleIcon'

interface LayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
}

export default function Layout({ children, title = 'ChessBet - Skill Tournaments', description }: LayoutProps) {
  const { isAuthenticated, player, logout, isAdmin } = useAuth()

  return (
    <>
      <Head>
        <title>{title}</title>
        {description && <meta name="description" content={description} />}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col">
        {/* Header */}
        <header className="bg-gray-900/80 backdrop-blur-sm border-b border-white/10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <Link href="/" className="text-2xl font-bold text-white">
                ChessBet
              </Link>
              
              <nav className="flex items-center gap-4">
                {isAuthenticated ? (
                  <>
                    <Link 
                      href="/lobby" 
                      className="text-gray-300 hover:text-white transition-colors"
                    >
                      Lobby
                    </Link>
                    <Link 
                      href="/tournaments" 
                      className="text-gray-300 hover:text-white transition-colors"
                    >
                      Tournois
                    </Link>
                    <Link 
                      href="/wallet" 
                      className="text-gray-300 hover:text-white transition-colors"
                    >
                      Mon portefeuille
                    </Link>
                    {isAdmin && (
                      <Link 
                        href="/admin" 
                        className="px-3 py-1.5 rounded border border-blue-500/30 bg-blue-500/10 text-blue-200 hover:bg-blue-500/20 hover:border-blue-500/50 transition-colors font-medium"
                      >
                        Admin
                      </Link>
                    )}
                    <Link 
                      href="/profile" 
                      className="font-semibold transition-colors !no-underline flex items-center gap-1.5 hover:opacity-80"
                      style={player?.role ? { color: getRoleColor(player.role) } : { color: '#d1d5db' }}
                    >
                      {player?.role && player.role !== 'PLAYER' && (
                        <RoleIcon role={player.role} className="w-4 h-4" />
                      )}
                      <span>{player?.username || 'Mon compte'}</span>
                    </Link>
                    <button
                      onClick={logout}
                      className="text-gray-300 hover:text-white transition-colors"
                    >
                      Déconnexion
                    </button>
                  </>
                ) : (
                  <>
                    <Link 
                      href="/login" 
                      className="text-gray-300 hover:text-white transition-colors"
                    >
                      Connexion
                    </Link>
                    <Link 
                      href="/register" 
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                      Inscription
                    </Link>
                  </>
                )}
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-grow">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-gray-900/80 backdrop-blur-sm border-t border-white/10 mt-auto">
          <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm text-gray-400">
              <div>
                <h3 className="text-white font-semibold mb-2">À propos</h3>
                <p className="mb-2">
                  Compétitions d&apos;échecs basées sur la compétence, pas de jeux de hasard.
                </p>
                <p>
                  Pas de paris. Pas de hasard. Prize pools fixes déterminés à l&apos;avance.
                </p>
              </div>
              
              <div>
                <h3 className="text-white font-semibold mb-2">Conformité légale</h3>
                <p className="mb-2">
                  <strong className="text-white">18+ uniquement</strong>
                </p>
                <p className="mb-2">
                  Service réservé aux zones où les jeux de compétence payants sont autorisés.
                </p>
                <p className="text-red-400">
                  Indisponible dans certaines juridictions. Void where prohibited.
                </p>
              </div>
              
              <div>
                <h3 className="text-white font-semibold mb-2">Mentions légales</h3>
                <ul className="space-y-1">
                  <li>
                    <Link href="/terms" className="hover:text-white transition-colors">
                      Conditions Générales
                    </Link>
                  </li>
                  <li>
                    <Link href="/privacy" className="hover:text-white transition-colors">
                      Politique de Confidentialité
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-white/10 text-center text-xs text-gray-500">
              <p>© {new Date().getFullYear()} ChessBet. Tous droits réservés.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}

