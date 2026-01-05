import { MatchStateViewDto } from '../lib/api'

/**
 * Helpers pour déterminer l'état UI d'un match
 * Phase 6.1.B - Gameplay UX Completion
 */

export type MatchUiStatusKey =
  | 'RUNNING'
  | 'FINISHED'
  | 'DRAW'
  | 'TIEBREAK_PENDING'
  | 'CANCELED'
  | 'PENDING'

export type MatchUiSeverity = 'info' | 'warning' | 'danger'

export interface MatchUiStatus {
  key: MatchUiStatusKey
  label: string
  severity: MatchUiSeverity
}

/**
 * Vérifie si le match est terminé en DRAW
 */
export function isDraw(matchState: MatchStateViewDto): boolean {
  return matchState.result === 'DRAW'
}

/**
 * Vérifie si le match est en DRAW avec tie-break en attente
 */
export function isTieBreakPending(matchState: MatchStateViewDto): boolean {
  return (
    matchState.result === 'DRAW' &&
    matchState.resultReason === 'TIEBREAK_PENDING'
  )
}

/**
 * Vérifie si le match est terminé (FINISHED ou CANCELED)
 */
export function isMatchFinished(matchState: MatchStateViewDto): boolean {
  return (
    matchState.status === 'FINISHED' || matchState.status === 'CANCELED'
  )
}

/**
 * Retourne l'état UI du match avec label et severity
 * Le composant décide ensuite comment rendre la severity (couleur, badge, etc.)
 */
export function getMatchUiStatus(matchState: MatchStateViewDto): MatchUiStatus {
  // TIEBREAK_PENDING a la priorité sur DRAW
  if (isTieBreakPending(matchState)) {
    return {
      key: 'TIEBREAK_PENDING',
      label: 'Match nul - Tie-break en attente',
      severity: 'warning',
    }
  }

  // DRAW normal
  if (isDraw(matchState)) {
    return {
      key: 'DRAW',
      label: 'Match nul',
      severity: 'warning',
    }
  }

  // Statut standard
  switch (matchState.status) {
    case 'RUNNING':
      return {
        key: 'RUNNING',
        label: 'En cours',
        severity: 'info',
      }
    case 'FINISHED':
      return {
        key: 'FINISHED',
        label: 'Terminé',
        severity: 'info',
      }
    case 'CANCELED':
      return {
        key: 'CANCELED',
        label: 'Annulé',
        severity: 'danger',
      }
    case 'PENDING':
      return {
        key: 'PENDING',
        label: 'En attente',
        severity: 'info',
      }
    default:
      return {
        key: 'PENDING',
        label: 'État inconnu',
        severity: 'warning',
      }
  }
}

