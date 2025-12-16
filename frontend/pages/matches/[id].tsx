import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'
import Layout from '../../components/Layout'
import { useAuth } from '../../hooks/useAuth'
import { api, MatchStateViewDto, ApiError } from '../../lib/api'

// Import dynamique de Chessboard sans SSR
const Chessboard = dynamic(
  () => import('react-chessboard').then((mod) => mod.Chessboard),
  { ssr: false }
)

export default function MatchPage() {
  const router = useRouter()
  const { player: user, isAuthenticated, loading: authLoading } = useAuth()
  const [matchState, setMatchState] = useState<MatchStateViewDto | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [moveError, setMoveError] = useState<string | null>(null)

  const matchId = typeof router.query.id === 'string' ? router.query.id : null

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  // Join match et chargement initial
  useEffect(() => {
    if (!matchId || !isAuthenticated || !user) return

    const joinAndLoadMatch = async () => {
      try {
        setLoading(true)
        setError(null)
        const state = await api.joinMatch(matchId)
        setMatchState(state)
      } catch (err) {
        const apiError = err as ApiError
        setError(apiError.message || 'Erreur lors du chargement du match')
      } finally {
        setLoading(false)
      }
    }

    joinAndLoadMatch()
  }, [matchId, isAuthenticated, user])

  // Polling toutes les 2 secondes
  useEffect(() => {
    if (!matchId || !matchState) return

    // Arrêter le polling si le match est terminé
    if (matchState.status === 'FINISHED' || matchState.status === 'CANCELED') {
      return
    }

    const interval = setInterval(async () => {
      try {
        const state = await api.getMatchState(matchId)
        setMatchState(state)
      } catch (err) {
        // Erreur silencieuse pendant le polling (pour ne pas spammer l'UI)
        console.error('Erreur polling:', err)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [matchId, matchState])

  // Gérer le drop d'une pièce
  const handlePieceDrop = (sourceSquare: string, targetSquare: string, piece?: string): boolean => {
    if (!matchId || !matchState) return false

    setMoveError(null)

    // Exécuter la logique asynchrone sans bloquer
    ;(async () => {
      try {
        // Détecter si promotion nécessaire
        let promotion: 'q' | 'r' | 'b' | 'n' | undefined = undefined

        // Debug : afficher les valeurs reçues
        console.log('🎯 handlePieceDrop:', { sourceSquare, targetSquare, piece, fen: matchState.fen })

        // Déterminer la pièce depuis la position actuelle (FEN) car react-chessboard v4 ne passe pas toujours le paramètre piece
        const { Chess } = require('chess.js')
        const chess = new Chess(matchState.fen)
        const pieceOnSquare = chess.get(sourceSquare)
        
        console.log('🔍 Pièce détectée depuis FEN:', pieceOnSquare)

        if (!pieceOnSquare) {
          console.error('❌ Aucune pièce trouvée sur', sourceSquare)
          setMoveError('Erreur : aucune pièce sur cette case')
          return
        }

        // Vérifier si c'est un pion qui arrive sur la dernière rangée
        const isPawn = pieceOnSquare.type === 'p'
        const isWhitePawn = pieceOnSquare.color === 'w' && targetSquare[1] === '8'
        const isBlackPawn = pieceOnSquare.color === 'b' && targetSquare[1] === '1'
        const isLastRank = isWhitePawn || isBlackPawn

        console.log('🔍 Promotion check:', { isPawn, pieceColor: pieceOnSquare.color, targetRank: targetSquare[1], isLastRank })

        if (isPawn && isLastRank) {
          // Demander la promotion via prompt
          const choice = window.prompt(
            'Promotion du pion. Choisissez une pièce:\nq = Dame\nr = Tour\nb = Fou\nn = Cavalier',
            'q'
          )

          if (choice && ['q', 'r', 'b', 'n'].includes(choice.toLowerCase())) {
            promotion = choice.toLowerCase() as 'q' | 'r' | 'b' | 'n'
            console.log('✅ Promotion choisie:', promotion)
          } else {
            // Promotion invalide ou annulée
            console.log('❌ Promotion annulée ou invalide')
            setMoveError('Promotion invalide ou annulée')
            return
          }
        }

        // Envoyer le coup au serveur
        const move = { from: sourceSquare, to: targetSquare, promotion }
        console.log('📤 Envoi du coup:', move)
        const newState = await api.playMove(matchId, move)
        
        // Mettre à jour l'état avec la réponse du serveur
        setMatchState(newState)
      } catch (err) {
        const apiError = err as ApiError
        setMoveError(apiError.message || 'Coup invalide')
      }
    })()

    // Retourner true immédiatement pour autoriser le déplacement visuel
    return true
  }

  // Gérer la résignation
  const handleResign = async () => {
    if (!matchId || !matchState) return

    // Double confirmation
    const confirm1 = window.confirm('Êtes-vous sûr de vouloir abandonner ce match ?')
    if (!confirm1) return

    const confirm2 = window.confirm('Confirmer l\'abandon ? Cette action est irréversible.')
    if (!confirm2) return

    try {
      setError(null)
      const newState = await api.resignMatch(matchId)
      setMatchState(newState)
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.message || 'Erreur lors de l\'abandon')
    }
  }

  // Formater le temps en mm:ss
  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  // Déterminer l'orientation du plateau
  const getBoardOrientation = (): 'white' | 'black' => {
    if (!matchState || !user) return 'white'
    
    // Si le joueur est blanc, orientation white, sinon black
    if (user.id === matchState.whitePlayerId) {
      return 'white'
    } else if (user.id === matchState.blackPlayerId) {
      return 'black'
    }
    
    // Spectateur : orientation par défaut
    return 'white'
  }

  // Déterminer si c'est au tour du joueur
  const isMyTurn = (): boolean => {
    if (!matchState || !user) return false
    
    if (matchState.turn === 'WHITE') {
      return user.id === matchState.whitePlayerId
    } else {
      return user.id === matchState.blackPlayerId
    }
  }

  // Déterminer si le joueur peut déplacer les pièces
  const arePiecesDraggable = (): boolean => {
    if (!matchState) return false
    
    // Désactiver si le match est terminé
    if (matchState.status === 'FINISHED' || matchState.status === 'CANCELED') {
      return false
    }

    // Activer seulement si c'est le tour du joueur
    return isMyTurn()
  }

  // Redirection en cours
  if (!authLoading && !isAuthenticated) {
    return null
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Match {matchId}</h1>
          {matchState && (
            <div className="flex items-center gap-4 text-gray-600">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                matchState.status === 'RUNNING' ? 'bg-green-100 text-green-800' :
                matchState.status === 'FINISHED' ? 'bg-blue-100 text-blue-800' :
                matchState.status === 'CANCELED' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {matchState.status}
              </span>
              {matchState.result && (
                <span className="font-medium">
                  Résultat: {matchState.result}
                </span>
              )}
              {matchState.resultReason && (
                <span className="text-sm">
                  ({matchState.resultReason})
                </span>
              )}
            </div>
          )}
        </div>

        {/* Erreur principale */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Loading initial */}
        {loading && (
          <div className="text-center py-12">
            <p className="text-gray-600">Chargement du match...</p>
          </div>
        )}

        {/* Contenu principal */}
        {!loading && matchState && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Colonne gauche : Échiquier */}
            <div className="lg:col-span-2">
              {/* Erreur de coup */}
              {moveError && (
                <div className="mb-4 bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <p className="text-orange-800 text-sm">{moveError}</p>
                </div>
              )}

              {/* Échiquier */}
              <div className="bg-white rounded-lg shadow-lg p-4">
                <Chessboard
                  position={matchState.fen}
                  onPieceDrop={handlePieceDrop}
                  boardOrientation={getBoardOrientation()}
                  arePiecesDraggable={arePiecesDraggable()}
                  customBoardStyle={{
                    borderRadius: '4px',
                    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
                  }}
                />
              </div>

              {/* Dernier coup */}
              {matchState.lastMove && (
                <div className="mt-4 bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Dernier coup:</span>{' '}
                    {matchState.lastMove.san} ({matchState.lastMove.from} → {matchState.lastMove.to})
                    {matchState.lastMove.promotion && ` = ${matchState.lastMove.promotion.toUpperCase()}`}
                  </p>
                </div>
              )}
            </div>

            {/* Colonne droite : Informations et contrôles */}
            <div className="space-y-6">
              {/* Informations de partie */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold mb-4">Informations</h2>
                
                <div className="space-y-3">
                  {/* Tour actuel */}
                  <div>
                    <p className="text-sm text-gray-600">Au tour de</p>
                    <p className={`text-lg font-bold ${
                      matchState.turn === 'WHITE' ? 'text-gray-800' : 'text-gray-600'
                    }`}>
                      {matchState.turn === 'WHITE' ? '⚪ Blancs' : '⚫ Noirs'}
                      {isMyTurn() && matchState.status === 'RUNNING' && (
                        <span className="ml-2 text-sm text-green-600">(Votre tour)</span>
                      )}
                    </p>
                  </div>

                  {/* Numéro de coup */}
                  <div>
                    <p className="text-sm text-gray-600">Coup n°</p>
                    <p className="text-lg font-bold">{matchState.moveNumber}</p>
                  </div>

                  {/* Temps restant Blancs */}
                  <div>
                    <p className="text-sm text-gray-600">⚪ Temps Blancs</p>
                    <p className={`text-2xl font-mono font-bold ${
                      matchState.turn === 'WHITE' && matchState.status === 'RUNNING'
                        ? 'text-red-600'
                        : 'text-gray-800'
                    }`}>
                      {formatTime(matchState.whiteTimeMsRemaining)}
                    </p>
                  </div>

                  {/* Temps restant Noirs */}
                  <div>
                    <p className="text-sm text-gray-600">⚫ Temps Noirs</p>
                    <p className={`text-2xl font-mono font-bold ${
                      matchState.turn === 'BLACK' && matchState.status === 'RUNNING'
                        ? 'text-red-600'
                        : 'text-gray-800'
                    }`}>
                      {formatTime(matchState.blackTimeMsRemaining)}
                    </p>
                  </div>

                  {/* Heure serveur */}
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Heure serveur: {new Date(matchState.serverTimeUtc).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bouton Abandonner */}
              {matchState.status === 'RUNNING' && (user?.id === matchState.whitePlayerId || user?.id === matchState.blackPlayerId) && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <button
                    onClick={handleResign}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                  >
                    Abandonner
                  </button>
                  <p className="mt-2 text-xs text-gray-500 text-center">
                    Vous perdrez automatiquement ce match
                  </p>
                </div>
              )}

              {/* Statut spectateur */}
              {user && user.id !== matchState.whitePlayerId && user.id !== matchState.blackPlayerId && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    👁️ Vous observez ce match en tant que spectateur
                  </p>
                </div>
              )}

              {/* Match terminé */}
              {(matchState.status === 'FINISHED' || matchState.status === 'CANCELED') && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-800 font-medium mb-2">
                    Match terminé
                  </p>
                  <button
                    onClick={() => router.push('/lobby')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
                  >
                    Retour au lobby
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

