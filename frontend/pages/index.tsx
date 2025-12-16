import Link from 'next/link'
import Layout from '../components/Layout'

export default function Home() {
  return (
    <Layout
      title="ChessBet - Tournois d&apos;échecs à enjeu, 100% basés sur la compétence"
      description="Compétitions d&apos;échecs basées sur la compétence. Pas de paris. Pas de hasard. Prize pools fixes."
    >
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Tournois d&apos;échecs à enjeu, 100% basés sur la compétence
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 mb-8">
            Pas de paris. Pas de hasard. Des compétitions de skill avec des prize pools fixes, déterminés à l&apos;avance.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors text-lg"
            >
              Créer un compte
            </Link>
            <Link
              href="/login"
              className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-8 rounded-lg transition-colors text-lg"
            >
              Se connecter
            </Link>
          </div>
        </div>

        {/* Comment ça marche */}
        <div className="max-w-6xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Comment ça marche ?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Compétence, pas de hasard
              </h3>
              <p className="text-gray-300">
                Les résultats dépendent uniquement de votre niveau aux échecs. Aucun élément aléatoire n&apos;intervient dans les matchs.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Tournois rapides (≤ 1h)
              </h3>
              <p className="text-gray-300">
                Participez à des tournois rapides qui se terminent en moins d&apos;une heure. Parfait pour une session de jeu intense.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Multi-niveaux de buy-in
              </h3>
              <p className="text-gray-300">
                Choisissez votre niveau d&apos;entrée selon votre budget. Les prize pools sont fixes et transparents dès le départ.
              </p>
            </div>
          </div>
        </div>

        {/* Section Conformité */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">
              Conformité légale
            </h2>
            
            <div className="space-y-4 text-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Jeux de compétence uniquement
                </h3>
                <p>
                  ChessBet organise des <strong>concours de compétence</strong> (skill competitions) où les résultats dépendent exclusivement de la compétence des joueurs aux échecs. Aucun élément de hasard n&apos;intervient dans les matchs.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Réservé aux adultes (18+)
                </h3>
                <p>
                  Vous devez avoir au moins <strong>18 ans</strong> pour créer un compte et participer aux tournois. Une vérification d&apos;âge est effectuée lors de l&apos;inscription.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Restrictions géographiques
                </h3>
                <p>
                  Ce service est réservé aux zones où les jeux de compétence payants sont autorisés. Le service peut être indisponible dans certaines juridictions où ces activités sont interdites.
                </p>
                <p className="text-red-400 font-semibold mt-2">
                  Void where prohibited.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
