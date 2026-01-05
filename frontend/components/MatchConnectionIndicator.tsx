import { MatchUiSeverity } from '../utils/match-status'

interface MatchConnectionIndicatorProps {
  isConnected: boolean
  retryCount: number
}

/**
 * Indicateur de connexion pour le match
 * Phase 6.1.B - Gameplay UX Completion
 */
export function MatchConnectionIndicator({
  isConnected,
  retryCount,
}: MatchConnectionIndicatorProps) {
  // Toujours afficher l'indicateur (même si connecté)
  let severity: MatchUiSeverity = 'info'
  let label = 'Connecté'
  let bgColor = 'bg-green-100'
  let textColor = 'text-green-800'
  let borderColor = 'border-green-200'

  if (!isConnected) {
    // Déconnecté
    severity = 'danger'
    label = 'Déconnecté - Reconnexion en cours...'
    bgColor = 'bg-red-100'
    textColor = 'text-red-800'
    borderColor = 'border-red-200'
  } else if (retryCount > 0) {
    // Reconnexion en cours
    severity = 'warning'
    label = `Reconnexion... (${retryCount} tentative${retryCount > 1 ? 's' : ''})`
    bgColor = 'bg-yellow-100'
    textColor = 'text-yellow-800'
    borderColor = 'border-yellow-200'
  }

  return (
    <div
      className={`${bgColor} ${borderColor} border rounded-lg p-2 mb-4`}
      role="status"
      aria-live="polite"
    >
      <p className={`${textColor} text-sm font-medium`}>{label}</p>
    </div>
  )
}

