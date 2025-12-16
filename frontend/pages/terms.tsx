import Layout from '../components/Layout'

export default function Terms() {
  return (
    <Layout title="Conditions Générales - ChessBet">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8">
            Conditions Générales d&apos;Utilisation
          </h1>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20 space-y-6 text-gray-200">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">1. Objet</h2>
              <p>
                Les présentes Conditions Générales d&apos;Utilisation (CGU) régissent l&apos;utilisation de la plateforme ChessBet,
                qui organise des compétitions d&apos;échecs basées sur la compétence (skill games).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">2. Nature du service</h2>
              <p>
                ChessBet organise des <strong className="text-white">concours de compétence</strong> où les résultats
                dépendent exclusivement de la compétence des joueurs aux échecs. Aucun élément de hasard n&apos;intervient
                dans les matchs. Les prize pools sont fixes et déterminés à l&apos;avance.
              </p>
              <p className="mt-2">
                <strong className="text-white">Ce n&apos;est pas un site de paris.</strong> Ce n&apos;est pas un site de jeux de hasard.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">3. Conditions d&apos;accès</h2>
              <p>
                L&apos;utilisation de la plateforme est réservée aux personnes âgées d&apos;au moins <strong className="text-white">18 ans</strong>.
                Vous devez confirmer votre âge lors de l&apos;inscription.
              </p>
              <p className="mt-2">
                Le service est réservé aux zones où les jeux de compétence payants sont autorisés.
                Le service peut être indisponible dans certaines juridictions où ces activités sont interdites.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">4. Inscription et compte</h2>
              <p>
                Pour créer un compte, vous devez fournir des informations exactes et à jour. Vous êtes responsable
                de la confidentialité de vos identifiants de connexion.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">5. Responsabilité</h2>
              <p>
                ChessBet ne peut être tenu responsable des dommages directs ou indirects résultant de l&apos;utilisation
                ou de l&apos;impossibilité d&apos;utiliser la plateforme.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">6. Modifications</h2>
              <p>
                ChessBet se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront
                informés des modifications importantes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">7. Contact</h2>
              <p>
                Pour toute question concernant les présentes CGU, vous pouvez nous contacter via les moyens
                de contact disponibles sur la plateforme.
              </p>
            </section>

            <div className="mt-8 pt-6 border-t border-white/20 text-sm text-gray-400">
              <p>
                <strong className="text-white">Dernière mise à jour :</strong> {new Date().toLocaleDateString('fr-FR')}
              </p>
              <p className="mt-2 text-red-400">
                <strong>Void where prohibited.</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

