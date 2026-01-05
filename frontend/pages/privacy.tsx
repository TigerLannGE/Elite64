import Layout from '../components/Layout'

export default function Privacy() {
  return (
    <Layout title="Politique de Confidentialité - Elite64">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8">
            Politique de Confidentialité
          </h1>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20 space-y-6 text-gray-200">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">1. Collecte des données</h2>
              <p>
                Elite64 collecte les données suivantes lors de votre inscription :
              </p>
              <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
                <li>Nom d&apos;utilisateur</li>
                <li>Adresse e-mail</li>
                <li>Date de naissance (pour vérification de l&apos;âge)</li>
                <li>Code pays</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">2. Utilisation des données</h2>
              <p>
                Vos données personnelles sont utilisées pour :
              </p>
              <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
                <li>Gérer votre compte et votre participation aux tournois</li>
                <li>Vérifier votre âge et votre éligibilité</li>
                <li>Vous envoyer des communications importantes concernant votre compte</li>
                <li>Respecter nos obligations légales</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">3. Protection des données</h2>
              <p>
                Nous mettons en œuvre des mesures de sécurité appropriées pour protéger vos données personnelles
                contre tout accès non autorisé, modification, divulgation ou destruction.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">4. Partage des données</h2>
              <p>
                Nous ne vendons pas vos données personnelles à des tiers. Nous pouvons partager vos données uniquement
                dans les cas suivants :
              </p>
              <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
                <li>Pour respecter une obligation légale</li>
                <li>Pour protéger nos droits et notre sécurité</li>
                <li>Avec votre consentement explicite</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">5. Vos droits</h2>
              <p>
                Conformément à la réglementation applicable (RGPD, etc.), vous disposez des droits suivants :
              </p>
              <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
                <li>Droit d&apos;accès à vos données</li>
                <li>Droit de rectification</li>
                <li>Droit à l&apos;effacement</li>
                <li>Droit à la portabilité</li>
                <li>Droit d&apos;opposition</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">6. Conservation des données</h2>
              <p>
                Nous conservons vos données personnelles aussi longtemps que nécessaire pour fournir nos services
                et respecter nos obligations légales.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">7. Cookies</h2>
              <p>
                Nous utilisons des cookies et technologies similaires pour améliorer votre expérience sur la plateforme.
                Vous pouvez gérer vos préférences de cookies dans les paramètres de votre navigateur.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">8. Contact</h2>
              <p>
                Pour toute question concernant cette politique de confidentialité ou pour exercer vos droits,
                vous pouvez nous contacter à l&apos;adresse suivante :
              </p>
              <p className="mt-2">
                <a href="mailto:contact@elite64.app" className="text-blue-400 hover:text-blue-300 underline">
                  contact@elite64.app
                </a>
              </p>
            </section>

            <div className="mt-8 pt-6 border-t border-white/20 text-sm text-gray-400">
              <p>
                <strong className="text-white">Dernière mise à jour :</strong> {new Date().toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

