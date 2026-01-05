import { Modal } from './Modal'
import { MatchStateViewDto } from '../../lib/api'

/**
 * Composant GameOverModal - Phase 6.2.C
 *
 * Modal qui s'affiche automatiquement quand un match est terminé.
 * Affiche un message clair selon le résultat et propose un CTA de sortie.
 */
interface GameOverModalProps {
  isOpen: boolean
  matchState: MatchStateViewDto | null
  tournamentId?: string | null
  onClose: () => void
  onNavigateToTournament: () => void
  onNavigateToLobby: () => void
}

/**
 * Construire le message principal selon le résultat et la raison
 */
function getGameOverMessage(matchState: MatchStateViewDto): string {
  const { result, resultReason } = matchState

  // Cas DRAW
  if (result === 'DRAW') {
    return 'Match nul.'
  }

  // Cas victoire
  if (result === 'WHITE_WIN') {
    let message = 'Victoire des Blancs.'
    if (resultReason) {
      if (resultReason === 'RESIGN') {
        message += ' (abandon)'
      } else if (resultReason === 'TIMEOUT') {
        message += ' (temps écoulé)'
      } else if (resultReason === 'CHECKMATE') {
        message += ' (échec et mat)'
      } else if (resultReason === 'NO_SHOW' || resultReason === 'DOUBLE_NO_SHOW') {
        message += ' (no-show)'
      }
    }
    return message
  }

  if (result === 'BLACK_WIN') {
    let message = 'Victoire des Noirs.'
    if (resultReason) {
      if (resultReason === 'RESIGN') {
        message += ' (abandon)'
      } else if (resultReason === 'TIMEOUT') {
        message += ' (temps écoulé)'
      } else if (resultReason === 'CHECKMATE') {
        message += ' (échec et mat)'
      } else if (resultReason === 'NO_SHOW' || resultReason === 'DOUBLE_NO_SHOW') {
        message += ' (no-show)'
      }
    }
    return message
  }

  // Fallback
  return 'Match terminé.'
}

export function GameOverModal({
  isOpen,
  matchState,
  tournamentId,
  onClose,
  onNavigateToTournament,
  onNavigateToLobby,
}: GameOverModalProps) {
  if (!matchState) return null

  const message = getGameOverMessage(matchState)
  const hasTournamentId = !!tournamentId

  const handlePrimaryCTA = () => {
    onClose()
    if (hasTournamentId) {
      onNavigateToTournament()
    } else {
      onNavigateToLobby()
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      title="Match terminé"
      onClose={onClose}
      closeOnOverlayClick={false} // Ne pas fermer via overlay (CTA obligatoire)
    >
      <div data-testid="gameover-modal">
        <p className="mb-2 text-lg font-medium text-gray-800">{message}</p>
        <p className="mb-4 text-sm text-gray-600">Vous pouvez quitter cette page.</p>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
            data-testid="gameover-close"
          >
            Fermer
          </button>
          <button
            type="button"
            onClick={handlePrimaryCTA}
            className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
            data-testid="gameover-cta"
          >
            {hasTournamentId ? 'Retour au tournoi' : 'Retour au lobby'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

