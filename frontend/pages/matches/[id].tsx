import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'
import Layout from '../../components/Layout'
import { useAuth } from '../../hooks/useAuth'
import { api, MatchStateViewDto, ApiError } from '../../lib/api'
import { getMatchErrorMessage, mapMatchApiError, MatchErrorInfo } from '../../lib/match-error-mapper'
import {
  getMatchUiStatus,
  isMatchFinished,
  isTieBreakPending,
} from '../../utils/match-status'
import { useMatchTimer } from '../../utils/match-timer'
import { useMatchPolling } from '../../hooks/useMatchPolling'
import { MatchConnectionIndicator } from '../../components/MatchConnectionIndicator'
import { PromotionModal } from '../../components/ui/PromotionModal'
import { ResignModal } from '../../components/ui/ResignModal'
import { GameOverModal } from '../../components/ui/GameOverModal'

// Type pour un coup dans l'historique
interface MoveHistoryItem {
  moveNumber: number
  san: string
  from: string
  to: string
  promotion?: string | null
  key: string // Clé stable pour déduplication
}

// Import dynamique de Chessboard sans SSR
const Chessboard = dynamic(
  () => import('react-chessboard').then((mod) => mod.Chessboard),
  { ssr: false }
)

/*
 * Manual test plan - Phase 6.2 UX Improvements
 * 
 * 1. Historique des coups :
 *    - Démarrer un match, jouer 2 coups (ex: e4, e5)
 *    - Vérifier que la liste affiche "1. e4 e5" (ou format équivalent)
 *    - Attendre un coup adverse via polling
 *    - Vérifier que le nouveau coup est ajouté automatiquement à la liste
 * 
 * 2. Highlight dernier coup :
 *    - Jouer un coup (ex: e2 → e4)
 *    - Vérifier que les cases e2 et e4 sont highlightées en bleu
 *    - Attendre un coup adverse via polling
 *    - Vérifier que le highlight se met à jour pour les nouvelles cases (from/to)
 * 
 * 3. Reset et edge cases :
 *    - Refresh la page : accepter que l'historique reparte à zéro
 *      (limitation : pas d'endpoint pour récupérer l'historique complet)
 *    - Vérifier que le highlight disparaît quand lastMove est null (début de partie)
 *    - Vérifier que la déduplication fonctionne (pas de doublons)
 * 
 * 4. Robustesse :
 *    - Vérifier que le drag/drop fonctionne toujours correctement
 *    - Vérifier que le polling met à jour l'historique même sans playMove local
 * 
 * Manual test plan - Phase 6.2.C Promotion Modal
 * 
 * 1. Promotion :
 *    - Faire avancer un pion jusqu'à la dernière rangée (blanc vers 8, noir vers 1)
 *    - Vérifier que le modal de promotion apparaît automatiquement (data-testid="promotion-modal")
 *    - Choisir une pièce (ex: Dame/Q) et vérifier:
 *      - Le modal se ferme
 *      - Le coup est joué avec la promotion correcte
 *      - L'historique SAN se met à jour avec la promotion (ex: "e8=Q")
 *      - Le highlight du dernier coup est visible
 *    - Tester l'annulation: cliquer sur "Annuler" (data-testid="promotion-cancel") et vérifier que le coup n'est pas joué
 *    - Tester les 4 choix: Q (Dame), R (Tour), B (Fou), N (Cavalier) - vérifier que chaque choix fonctionne
 * 
 * Manual test plan - Phase 6.2.C Resign Modal
 * 
 * 1. Résignation :
 *    - Cliquer sur le bouton "Abandonner" (data-testid="resign-button")
 *    - Vérifier que le modal de résignation apparaît (data-testid="resign-modal")
 *    - Tester l'annulation: cliquer sur "Annuler" (data-testid="resign-cancel") et vérifier:
 *      - Le modal se ferme
 *      - Aucun changement de statut (le match reste RUNNING)
 *    - Tester la confirmation: cliquer sur "Confirmer" (data-testid="resign-confirm") et vérifier:
 *      - Le bouton affiche "Envoi..." pendant l'appel API
 *      - Les boutons sont désactivés pendant l'envoi
 *      - Le modal se ferme après succès
 *      - Le statut change à FINISHED (vérifier data-testid="status-badge")
 *    - Tester l'erreur: si l'appel API échoue, vérifier que:
 *      - L'error-banner apparaît avec le message d'erreur
 *      - Le modal reste ouvert (pour permettre de réessayer)
 *      - Les boutons redeviennent actifs
 * 
 * Manual test plan - Phase 6.1.B Error UX Improvements
 * 
 * 1. Erreur joinMatch (bloquante) :
 *    - Essayer d'accéder à un match où vous n'êtes pas participant
 *    - Résultat attendu : Écran d'erreur rouge avec titre "Accès refusé" et message clair
 *    - Vérifier que le bouton "Retour au lobby" est présent
 * 
 * 2. Erreur playMove (non bloquante) :
 *    - Jouer un coup invalide (ex: déplacer un pion en arrière)
 *    - Résultat attendu : Banner orange non bloquant avec titre "Coup invalide" et message
 *    - Vérifier que le banner peut être fermé avec le bouton ×
 *    - Vérifier que l'échiquier reste utilisable
 * 
 * 3. Erreur NOT_YOUR_TURN (attendue, info) :
 *    - Essayer de jouer quand ce n'est pas votre tour (si possible)
 *    - Résultat attendu : Banner bleu (info) avec message "Ce n'est pas votre tour"
 *    - Vérifier que l'erreur est informative, pas alarmante
 * 
 * 4. Erreur polling (discret) :
 *    - Couper temporairement la connexion réseau pendant le polling
 *    - Résultat attendu : Banner jaune discret avec message "Connexion instable, tentative de reconnexion…"
 *    - Vérifier que le banner disparaît quand la connexion est rétablie
 *    - Vérifier qu'il n'y a pas d'alert() ou de spam d'erreurs
 * 
 * 5. Erreur resignMatch (bloquante) :
 *    - Essayer d'abandonner un match déjà terminé (si possible)
 *    - Résultat attendu : Écran d'erreur avec message clair
 */

export default function MatchPage() {
  const router = useRouter()
  const { player: user, isAuthenticated, loading: authLoading } = useAuth()
  const [matchState, setMatchState] = useState<MatchStateViewDto | null>(null)
  const [error, setError] = useState<MatchErrorInfo | null>(null) // Erreur bloquante (joinMatch, resignMatch)
  const [loading, setLoading] = useState<boolean>(true)
  const [moveError, setMoveError] = useState<MatchErrorInfo | null>(null) // Erreur non bloquante (playMove)
  const [pollingError, setPollingError] = useState<MatchErrorInfo | null>(null) // Erreur polling (discret)
  
  // Phase 6.2.C - État UNIQUE pour la promotion (100% modale)
  // Source de vérité centrale : pendingPromotionMove
  // - Ouverture du modal uniquement via cet état
  // - Fermeture uniquement après confirmation ou annulation explicite
  // - Aucun fallback automatique, aucune UI legacy
  const [showPromotionModal, setShowPromotionModal] = useState(false)
  const [pendingPromotionMove, setPendingPromotionMove] = useState<{
    from: string
    to: string
    color: 'WHITE' | 'BLACK'
  } | null>(null)
  const [promotionSubmitting, setPromotionSubmitting] = useState(false)

  // Phase 6.2.C - État pour le modal de résignation
  const [showResignModal, setShowResignModal] = useState(false)
  const [isResigning, setIsResigning] = useState(false)

  // Phase 6.2.C - État pour le modal "Match terminé" (anti-jitter)
  const [isGameOverModalOpen, setIsGameOverModalOpen] = useState(false)
  const gameOverModalOpenedRef = useRef(false) // Garde pour éviter réouverture à chaque poll

  
  // Phase 6.2 - Historique des coups (liste SAN)
  const [moves, setMoves] = useState<MoveHistoryItem[]>([])
  const lastProcessedMoveRef = useRef<string | null>(null) // Clé du dernier coup traité

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
        // Erreur bloquante : écran d'erreur clair
        const errorInfo = mapMatchApiError(err)
        setError(errorInfo)
      } finally {
        setLoading(false)
      }
    }

    joinAndLoadMatch()
  }, [matchId, isAuthenticated, user])

  // Phase 6.2 - Reset historique quand matchId change
  useEffect(() => {
    setMoves([])
    lastProcessedMoveRef.current = null
  }, [matchId])

  // Phase 6.2.C - Ouvrir le modal "Match terminé" une seule fois quand le match se termine
  useEffect(() => {
    if (!matchState) return

    // Ne pas afficher si TIEBREAK_PENDING (ce n'est pas "terminé" côté UX)
    if (isTieBreakPending(matchState)) {
      return
    }

    // Ouvrir le modal UNE FOIS quand l'état passe à terminé
    if (isMatchFinished(matchState) && !gameOverModalOpenedRef.current) {
      setIsGameOverModalOpen(true)
      gameOverModalOpenedRef.current = true
    }
  }, [matchState])

  // Phase 6.2.C - Reset la garde quand matchId change (nouveau match)
  useEffect(() => {
    gameOverModalOpenedRef.current = false
    setIsGameOverModalOpen(false)
  }, [matchId])

  // Polling robuste avec retry/backoff
  const { isConnected, retryCount, lastError } = useMatchPolling(
    matchId,
    matchState ? !isMatchFinished(matchState) : false,
    (state) => {
      setMatchState(state)
      // Réinitialiser l'erreur polling si le polling réussit
      setPollingError(null)
    },
    (err) => {
      // Erreur réseau pendant le polling : afficher un indicateur discret
      const errorInfo = mapMatchApiError(err)
      // Ne pas spammer : seulement si c'est une erreur réseau (pas les erreurs attendues)
      if (!errorInfo.isExpected && errorInfo.severity === 'warning') {
        setPollingError(errorInfo)
      }
      console.error('Erreur polling:', err)
    }
  )

  // Phase 6.2 - Mettre à jour l'historique des coups quand lastMove change
  useEffect(() => {
    if (!matchState?.lastMove || !matchState?.moveNumber) {
      // Si lastMove est null, ne rien ajouter (début de partie ou reset)
      return
    }

    const { san, from, to, promotion } = matchState.lastMove
    const moveNumber = matchState.moveNumber
    
    // Créer une clé stable pour déduplication
    const moveKey = `${moveNumber}-${san}-${from}-${to}${promotion ? `-${promotion}` : ''}`
    
    // Vérifier si ce coup a déjà été ajouté
    if (lastProcessedMoveRef.current === moveKey) {
      return // Déjà traité
    }

    // Ajouter le nouveau coup à l'historique
    setMoves((prevMoves) => {
      // Vérifier une seconde fois pour éviter les doublons (race condition)
      if (prevMoves.some((m) => m.key === moveKey)) {
        return prevMoves
      }

      const newMove: MoveHistoryItem = {
        moveNumber,
        san,
        from,
        to,
        promotion: promotion || null,
        key: moveKey,
      }

      return [...prevMoves, newMove]
    })

    // Marquer ce coup comme traité
    lastProcessedMoveRef.current = moveKey
  }, [matchState?.lastMove, matchState?.moveNumber])

  // Phase 6.2.C - SEUL point d'entrée pour jouer un coup avec promotion
  // Cette fonction est appelée UNIQUEMENT depuis le PromotionModal React
  // Aucun autre chemin de code ne doit appeler api.playMove() avec promotion
  // Garantie : le coup n'est envoyé à l'API qu'après validation explicite du modal
  const handlePromotionChoose = async (promotion: 'q' | 'r' | 'b' | 'n') => {
    // Sécurité : empêcher double-submit
    if (promotionSubmitting) return
    if (!matchId || !matchState || !pendingPromotionMove) return
    if (isMatchFinished(matchState)) return // Match terminé, ne pas jouer

    setPromotionSubmitting(true)
    setMoveError(null)

    try {
      // Phase 6.2.C - SEUL endroit où api.playMove() est appelé avec promotion
      // Aucun fallback automatique, aucun coup par défaut
      const move = {
        from: pendingPromotionMove.from,
        to: pendingPromotionMove.to,
        promotion,
      }
      console.log('📤 Envoi du coup avec promotion:', move)

      const newState = await api.playMove(matchId, move)
      setMatchState(newState)
      
      // Succès : fermer modal + reset (fermeture explicite uniquement)
      setShowPromotionModal(false)
      setPendingPromotionMove(null)
    } catch (err) {
      // Erreur : afficher via système existant + réactiver les choix
      const errorInfo = mapMatchApiError(err)
      setMoveError(errorInfo)
      // Ne pas fermer le modal en cas d'erreur pour permettre de réessayer
      // L'utilisateur doit confirmer ou annuler explicitement
    } finally {
      setPromotionSubmitting(false)
    }
  }

  // Phase 6.2.C - Annulation explicite de la promotion
  // Fermeture du modal + reset de l'état (aucun coup n'est joué)
  // Aucun fallback, aucun coup par défaut
  const handlePromotionCancel = () => {
    setShowPromotionModal(false)
    setPendingPromotionMove(null)
    setPromotionSubmitting(false)
  }

  // Phase 6.2.C - Gérer le drop d'une pièce
  // 
  // ═══════════════════════════════════════════════════════════════════════════
  // PROMOTION 100% MODALE - GARANTIES (Phase 6.2.C)
  // ═══════════════════════════════════════════════════════════════════════════
  // 
  // ✅ Un seul point d'entrée UX : PromotionModal React
  // ✅ Aucun overlay/react-chessboard UI legacy (promotionToSquare={null})
  // ✅ Aucun window.prompt/confirm
  // ✅ Aucun fallback automatique
  // ✅ Le coup n'est JAMAIS envoyé à l'API dans handlePieceDrop pour les promotions
  // ✅ Le coup n'est envoyé qu'après validation explicite du modal (handlePromotionChoose)
  // ✅ return false empêche react-chessboard de finaliser le drop
  // ✅ Comportement déterministe et testable
  // 
  // ═══════════════════════════════════════════════════════════════════════════
  const handlePieceDrop = (sourceSquare: string, targetSquare: string, piece?: string): boolean => {
    // Phase 6.2.C - Garde : bloquer tout nouveau drop si modal de promotion ouvert
    if (showPromotionModal || promotionSubmitting) {
      return false
    }

    if (!matchId || !matchState) return false

    setMoveError(null)

    // Phase 6.2.C - Détection SYNCHRONE de promotion (avant async)
    // Nécessaire pour empêcher react-chessboard d'afficher son sélecteur interne
    // + promotionToSquare={null} sur Chessboard désactive complètement l'overlay legacy
    try {
      const { Chess } = require('chess.js')
      const chess = new Chess(matchState.fen)
      const pieceOnSquare = chess.get(sourceSquare)

      if (!pieceOnSquare) {
        console.error('❌ Aucune pièce trouvée sur', sourceSquare)
        setMoveError({
          title: 'Erreur',
          message: 'Erreur : aucune pièce sur cette case',
          severity: 'warning',
          isExpected: false,
        })
        return false
      }

      // Vérifier si c'est un pion qui arrive sur la dernière rangée
      const isPawn = pieceOnSquare.type === 'p'
      const isWhitePawn = pieceOnSquare.color === 'w' && targetSquare[1] === '8'
      const isBlackPawn = pieceOnSquare.color === 'b' && targetSquare[1] === '1'
      const isLastRank = isWhitePawn || isBlackPawn

      if (isPawn && isLastRank) {
        // Phase 6.2.C - Promotion détectée : ouvrir UNIQUEMENT notre modal React
        // GARANTIES :
        // - Aucun overlay/react-chessboard UI legacy (promotionToSquare={null} + return false)
        // - Aucun window.prompt/confirm
        // - Aucun fallback automatique
        // - Un seul point d'entrée UX : PromotionModal React
        // - Le coup n'est JAMAIS envoyé à l'API ici (seulement via handlePromotionChoose)
        
        // Sécurité : ne pas ouvrir si match terminé ou matchId absent
        if (!matchId || isMatchFinished(matchState)) {
          return false
        }

        // Déterminer la couleur du pion
        const promotionColor: 'WHITE' | 'BLACK' = pieceOnSquare.color === 'w' ? 'WHITE' : 'BLACK'

        // Phase 6.2.C - Mettre à jour l'état UNIQUE (source de vérité)
        // Cet état déclenche l'ouverture du modal via showPromotionModal
        setPendingPromotionMove({
          from: sourceSquare,
          to: targetSquare,
          color: promotionColor,
        })
        setShowPromotionModal(true)

        // CRITIQUE: return false empêche react-chessboard de finaliser le drop
        // - Aucun coup n'est joué automatiquement
        // - Aucun overlay legacy ne s'affiche (promotionToSquare={null})
        // - Le drop est bloqué jusqu'à validation explicite du modal
        return false
      }
    } catch (err) {
      console.error('❌ Erreur lors de la détection de promotion:', err)
      return false
    }

    // Phase 6.2.C - Pas de promotion : exécuter le coup normalement (async)
    // IMPORTANT: Cette branche ne gère JAMAIS les promotions
    // Les promotions sont gérées UNIQUEMENT via handlePromotionChoose (appelé depuis le modal)
    ;(async () => {
      try {
        // Aucune promotion ici : move sans champ promotion
        const move = { from: sourceSquare, to: targetSquare }
        console.log('📤 Envoi du coup:', move)
        const newState = await api.playMove(matchId, move)

        // Mettre à jour l'état avec la réponse du serveur
        // Note: L'historique sera mis à jour automatiquement via le useEffect qui surveille lastMove
        setMatchState(newState)
      } catch (err) {
        // Erreur non bloquante : banner avec message contextuel
        const errorInfo = mapMatchApiError(err)
        setMoveError(errorInfo)
      }
    })()

    // Retourner true pour autoriser le déplacement visuel (pas de promotion)
    return true
  }

  // Phase 6.2.C - Ouvrir le modal de résignation
  const handleResignClick = () => {
    if (!matchId || !matchState) return
    setShowResignModal(true)
  }

  // Phase 6.2.C - Confirmer la résignation depuis le modal
  const handleResignConfirm = async () => {
    if (!matchId || !matchState) return

    // Empêcher double appel API
    if (isResigning) return

    setIsResigning(true)
    setError(null)

    try {
      const newState = await api.resignMatch(matchId)
      setMatchState(newState)
      setShowResignModal(false)
    } catch (err) {
      // Erreur bloquante : message clair (utilise le mécanisme existant error-banner)
      const errorInfo = mapMatchApiError(err)
      setError(errorInfo)
      // Ne pas fermer le modal en cas d'erreur pour que l'utilisateur puisse réessayer
    } finally {
      setIsResigning(false)
    }
  }

  const handleResignCancel = () => {
    setShowResignModal(false)
    setIsResigning(false)
  }

  // Phase 6.2.C - Handlers pour le modal "Match terminé"
  const handleGameOverClose = () => {
    setIsGameOverModalOpen(false)
  }

  const handleGameOverNavigateToTournament = () => {
    if (matchState?.tournamentId) {
      router.push(`/tournaments/${matchState.tournamentId}`)
    }
  }

  const handleGameOverNavigateToLobby = () => {
    router.push('/lobby')
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
    if (isMatchFinished(matchState)) {
      return false
    }

    // Activer seulement si c'est le tour du joueur
    return isMyTurn()
  }

  // Timer client-side synchronisé (toujours appelé pour respecter les règles des hooks)
  const timer = useMatchTimer(
    matchState?.whiteTimeMsRemaining ?? 0,
    matchState?.blackTimeMsRemaining ?? 0,
    matchState?.serverTimeUtc ?? new Date().toISOString(),
    matchState?.turn ?? 'WHITE',
    (matchState?.status === 'RUNNING') || false,
    matchState?.moveNumber // Passer moveNumber pour détecter les changements
  )

  // État UI du match
  const matchUiStatus = matchState ? getMatchUiStatus(matchState) : null

  // Phase 6.2 - Helper pour formater l'historique des coups (regroupement par tour)
  const formatMovesForDisplay = (movesList: MoveHistoryItem[]): string[] => {
    if (movesList.length === 0) return []
    
    const formatted: string[] = []
    let i = 0

    while (i < movesList.length) {
      const currentMove = movesList[i]
      
      // Déterminer le numéro de tour : moveNumber impair = coup blanc (tour N), pair = coup noir (tour N)
      // moveNumber 1 = tour 1 blanc, moveNumber 2 = tour 1 noir, moveNumber 3 = tour 2 blanc, etc.
      const turnNumber = Math.ceil(currentMove.moveNumber / 2)
      const isWhiteMove = currentMove.moveNumber % 2 === 1
      
      if (isWhiteMove && i + 1 < movesList.length) {
        // Coup blanc suivi d'un coup noir du même tour
        const blackMove = movesList[i + 1]
        if (Math.ceil(blackMove.moveNumber / 2) === turnNumber) {
          formatted.push(`${turnNumber}. ${currentMove.san} ${blackMove.san}`)
          i += 2
        } else {
          // Coup blanc seul (pas de coup noir suivant du même tour)
          formatted.push(`${turnNumber}. ${currentMove.san}`)
          i += 1
        }
      } else {
        // Coup noir seul ou dernier coup
        formatted.push(`${turnNumber}... ${currentMove.san}`)
        i += 1
      }
    }

    return formatted
  }

  // Phase 6.2 - Styles pour highlight du dernier coup (from/to)
  const getSquareStyles = (): Record<string, React.CSSProperties> => {
    if (!matchState?.lastMove) {
      return {} // Pas de highlight si pas de dernier coup
    }

    const { from, to } = matchState.lastMove
    
    return {
      [from]: {
        backgroundColor: 'rgba(59, 130, 246, 0.5)', // Bleu semi-transparent
      },
      [to]: {
        backgroundColor: 'rgba(59, 130, 246, 0.5)', // Bleu semi-transparent
      },
    }
  }

  // Redirection en cours
  if (!authLoading && !isAuthenticated) {
    return null
  }

  return (
    <Layout>
      {/* Phase 6.2.C - Modal de promotion (100% modale, UNIQUE point d'entrée UX) */}
      {/* 
        GARANTIES :
        - Aucune UI legacy (overlay, inline, window.prompt)
        - Un seul modal visible lors d'une promotion
        - Comportement déterministe et testable
        - Le coup n'est envoyé à l'API qu'après validation explicite
        - Aucun fallback automatique
      */}
      <PromotionModal
        isOpen={showPromotionModal}
        onChoose={handlePromotionChoose}
        onCancel={handlePromotionCancel}
        isSubmitting={promotionSubmitting}
      />
      {/* Phase 6.2.C - Modal de résignation */}
      <ResignModal
        isOpen={showResignModal}
        onConfirm={handleResignConfirm}
        onCancel={handleResignCancel}
        isSubmitting={isResigning}
      />
      {/* Phase 6.2.C - Modal "Match terminé" */}
      <GameOverModal
        isOpen={isGameOverModalOpen}
        matchState={matchState}
        tournamentId={matchState?.tournamentId || null}
        onClose={handleGameOverClose}
        onNavigateToTournament={handleGameOverNavigateToTournament}
        onNavigateToLobby={handleGameOverNavigateToLobby}
      />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Match {matchId}</h1>
          {matchUiStatus && (
            <div className="flex items-center gap-4 text-gray-600">
              <span
                data-testid="status-badge"
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  matchUiStatus.severity === 'info'
                    ? 'bg-blue-100 text-blue-800'
                    : matchUiStatus.severity === 'warning'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {matchUiStatus.label}
              </span>
              {matchState?.result && matchUiStatus.key !== 'TIEBREAK_PENDING' && (
                <span className="font-medium">
                  Résultat: {matchState.result}
                </span>
              )}
              {matchState?.resultReason &&
                matchUiStatus.key !== 'TIEBREAK_PENDING' && (
                  <span className="text-sm">({matchState.resultReason})</span>
                )}
            </div>
          )}
        </div>

        {/* Erreur principale (bloquante) */}
        {error && (
          <div
            data-testid="error-banner"
            className={`mb-6 rounded-lg p-4 border ${
            error.severity === 'danger'
              ? 'bg-red-50 border-red-200'
              : error.severity === 'warning'
              ? 'bg-orange-50 border-orange-200'
              : 'bg-blue-50 border-blue-200'
          }`}>
            <h3 className={`font-bold mb-2 ${
              error.severity === 'danger'
                ? 'text-red-800'
                : error.severity === 'warning'
                ? 'text-orange-800'
                : 'text-blue-800'
            }`}>
              {error.title}
            </h3>
            <p className={`${
              error.severity === 'danger'
                ? 'text-red-700'
                : error.severity === 'warning'
                ? 'text-orange-700'
                : 'text-blue-700'
            }`}>
              {error.message}
            </p>
            {error.severity === 'danger' && (
              <button
                onClick={() => router.push('/lobby')}
                className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
              >
                Retour au lobby
              </button>
            )}
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
              {/* Indicateur de connexion */}
              <div data-testid="connection-indicator">
                <MatchConnectionIndicator
                  isConnected={isConnected}
                  retryCount={retryCount}
                />
              </div>

              {/* Erreur de coup (non bloquante) */}
              {moveError && (
                <div
                  data-testid="error-banner"
                  className={`mb-4 rounded-lg p-3 border ${
                  moveError.severity === 'danger'
                    ? 'bg-red-50 border-red-200'
                    : moveError.severity === 'warning'
                    ? 'bg-orange-50 border-orange-200'
                    : 'bg-blue-50 border-blue-200'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className={`font-medium text-sm mb-1 ${
                        moveError.severity === 'danger'
                          ? 'text-red-800'
                          : moveError.severity === 'warning'
                          ? 'text-orange-800'
                          : 'text-blue-800'
                      }`}>
                        {moveError.title}
                      </p>
                      <p className={`text-sm ${
                        moveError.severity === 'danger'
                          ? 'text-red-700'
                          : moveError.severity === 'warning'
                          ? 'text-orange-700'
                          : 'text-blue-700'
                      }`}>
                        {moveError.message}
                      </p>
                    </div>
                    <button
                      onClick={() => setMoveError(null)}
                      className={`ml-3 text-sm font-bold ${
                        moveError.severity === 'danger'
                          ? 'text-red-600 hover:text-red-800'
                          : moveError.severity === 'warning'
                          ? 'text-orange-600 hover:text-orange-800'
                          : 'text-blue-600 hover:text-blue-800'
                      }`}
                      aria-label="Fermer"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}

              {/* Erreur polling (discret) */}
              {pollingError && !isConnected && (
                <div
                  data-testid="error-banner"
                  className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-2"
                >
                  <p className="text-yellow-800 text-xs">
                    {pollingError.message}
                  </p>
                </div>
              )}

              {/* Échiquier */}
              {/* Phase 6.2.C - Configuration Chessboard pour promotion 100% modale */}
              {/* 
                GARANTIES :
                - promotionToSquare={null} : désactive complètement l'overlay legacy de react-chessboard
                - onPieceDrop retourne false pour les promotions : empêche react-chessboard de finaliser le drop
                - Aucune UI de promotion ne peut s'afficher en dehors de PromotionModal React
                - Un seul point d'entrée UX : notre modal React
              */}
              <div data-testid="chessboard" className="bg-white rounded-lg shadow-lg p-4">
                <Chessboard
                  position={matchState.fen}
                  onPieceDrop={handlePieceDrop}
                  boardOrientation={getBoardOrientation()}
                  arePiecesDraggable={arePiecesDraggable()}
                  customBoardStyle={{
                    borderRadius: '4px',
                    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
                  }}
                  customSquareStyles={getSquareStyles()}
                  // Phase 6.2.C - Désactiver complètement l'overlay de promotion interne de react-chessboard
                  // La promotion est gérée UNIQUEMENT par notre modal React (PromotionModal)
                  // promotionToSquare={null} empêche l'affichage de l'overlay legacy
                  promotionToSquare={null}
                />
              </div>

              {/* Phase 6.2 - Historique des coups */}
              <div data-testid="move-list" className="mt-4 bg-white rounded-lg shadow-lg p-4">
                <h3 className="text-lg font-bold mb-3">Coups</h3>
                {moves.length === 0 ? (
                  <p className="text-sm text-gray-500">Aucun coup joué</p>
                ) : (
                  <div className="max-h-48 overflow-y-auto">
                    <div className="flex flex-wrap gap-2 text-sm font-mono">
                      {formatMovesForDisplay(moves).map((formattedMove, index) => (
                        <span
                          key={`move-${index}`}
                          className="px-2 py-1 bg-gray-100 rounded text-gray-800"
                        >
                          {formattedMove}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
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
                    <p
                      data-testid="timer-white"
                      className={`text-2xl font-mono font-bold ${
                        matchState.turn === 'WHITE' &&
                        matchState.status === 'RUNNING'
                          ? timer.whiteTimeMs < 30000
                            ? 'text-red-600 animate-pulse' // < 30s : danger
                            : timer.whiteTimeMs < 60000
                            ? 'text-orange-600' // < 60s : warning
                            : 'text-red-600' // Joueur actif : rouge
                          : 'text-gray-800'
                      }`}
                    >
                      {formatTime(timer.whiteTimeMs)}
                    </p>
                  </div>

                  {/* Temps restant Noirs */}
                  <div>
                    <p className="text-sm text-gray-600">⚫ Temps Noirs</p>
                    <p
                      data-testid="timer-black"
                      className={`text-2xl font-mono font-bold ${
                        matchState.turn === 'BLACK' &&
                        matchState.status === 'RUNNING'
                          ? timer.blackTimeMs < 30000
                            ? 'text-red-600 animate-pulse' // < 30s : danger
                            : timer.blackTimeMs < 60000
                            ? 'text-orange-600' // < 60s : warning
                            : 'text-red-600' // Joueur actif : rouge
                          : 'text-gray-800'
                      }`}
                    >
                      {formatTime(timer.blackTimeMs)}
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
                    data-testid="resign-button"
                    onClick={handleResignClick}
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

              {/* Tie-break pending */}
              {isTieBreakPending(matchState) && (
                <div data-testid="tiebreak-pending-cta" className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 font-medium mb-2">
                    Match nul - Tie-break en attente
                  </p>
                  <p className="text-sm text-yellow-700 mb-3">
                    Un match de départage sera créé pour déterminer le vainqueur.
                  </p>
                  <button
                    onClick={() =>
                      router.push(`/tournaments/${matchState.tournamentId}`)
                    }
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
                  >
                    Retour au tournoi
                  </button>
                </div>
              )}

              {/* Match terminé */}
              {isMatchFinished(matchState) && !isTieBreakPending(matchState) && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-800 font-medium mb-2">
                    Match terminé
                  </p>
                  
                  {/* Vainqueur */}
                  {((matchState.result === 'WHITE_WIN' && user?.id === matchState.whitePlayerId) ||
                    (matchState.result === 'BLACK_WIN' && user?.id === matchState.blackPlayerId)) && (
                    <>
                      <button
                        onClick={() => router.push(`/tournaments/${matchState.tournamentId}`)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors mb-2"
                      >
                        🏆 Retour au tournoi
                      </button>
                      <button
                        onClick={() => router.push('/lobby')}
                        className="w-full bg-gray-400 hover:bg-gray-500 text-white text-sm py-1 px-4 rounded transition-colors"
                      >
                        Retour au lobby
                      </button>
                    </>
                  )}
                  
                  {/* Perdant */}
                  {((matchState.result === 'WHITE_WIN' && user?.id === matchState.blackPlayerId) ||
                    (matchState.result === 'BLACK_WIN' && user?.id === matchState.whitePlayerId)) && (
                    <>
                      <button
                        onClick={() => router.push(`/tournaments/${matchState.tournamentId}`)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors mb-2"
                      >
                        Retour au tournoi
                      </button>
                      <button
                        onClick={() => router.push('/lobby')}
                        className="w-full bg-gray-400 hover:bg-gray-500 text-white text-sm py-1 px-4 rounded transition-colors"
                      >
                        Retour au lobby
                      </button>
                    </>
                  )}
                  
                  {/* Match nul */}
                  {matchState.result === 'DRAW' && 
                   user && 
                   (user.id === matchState.whitePlayerId || user.id === matchState.blackPlayerId) && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/tournaments/${matchState.tournamentId}`)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors"
                      >
                        Retour au tournoi
                      </button>
                      <button
                        onClick={() => router.push('/lobby')}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
                      >
                        Retour au lobby
                      </button>
                    </div>
                  )}
                  
                  {/* Spectateur */}
                  {user && 
                   user.id !== matchState.whitePlayerId && 
                   user.id !== matchState.blackPlayerId && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/tournaments/${matchState.tournamentId}`)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors"
                      >
                        Retour au tournoi
                      </button>
                      <button
                        onClick={() => router.push('/lobby')}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
                      >
                        Retour au lobby
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

