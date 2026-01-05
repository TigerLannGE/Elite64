import { ApiError } from './api'

/**
 * Type pour le résultat du mapping d'erreur
 */
export interface MatchErrorInfo {
  title: string
  message: string
  severity: 'info' | 'warning' | 'danger'
  isExpected: boolean
}

/**
 * Mappe les codes d'erreur backend vers des messages UX en français
 * Phase 6.1.B - Gameplay UX Completion
 * @deprecated Utiliser mapMatchApiError pour une meilleure UX
 */
export function getMatchErrorMessage(error: unknown): string {
  return mapMatchApiError(error).message
}

/**
 * Mappe une erreur API vers un objet structuré avec title, message, severity et isExpected
 * Phase 6.1.B - Amélioration UX des erreurs
 */
export function mapMatchApiError(err: unknown): MatchErrorInfo {
  const apiError = err as ApiError

  // Erreur réseau (fetch failed, timeout, etc.)
  if (!apiError || !apiError.statusCode) {
    return {
      title: 'Connexion instable',
      message: 'Connexion instable, tentative de reconnexion…',
      severity: 'warning',
      isExpected: false,
    }
  }

  // Erreur 5xx (serveur)
  if (apiError.statusCode >= 500) {
    return {
      title: 'Erreur serveur',
      message: 'Erreur serveur. Veuillez réessayer dans quelques instants.',
      severity: 'danger',
      isExpected: false,
    }
  }

  // Erreur 4xx avec code spécifique
  if (apiError.code) {
    switch (apiError.code) {
      case 'ILLEGAL_MOVE':
        return {
          title: 'Coup invalide',
          message: "Ce coup n'est pas valide selon les règles des échecs.",
          severity: 'warning',
          isExpected: true, // Erreur attendue lors d'un coup invalide
        }
      case 'DRAW_NOT_ALLOWED':
        return {
          title: 'Match nul non autorisé',
          message: 'Match nul non autorisé par les règles du tournoi.',
          severity: 'warning',
          isExpected: true,
        }
      case 'NOT_YOUR_TURN':
        return {
          title: "Ce n'est pas votre tour",
          message: "Ce n'est pas votre tour de jouer.",
          severity: 'info',
          isExpected: true, // Erreur attendue si l'utilisateur essaie de jouer hors tour
        }
      case 'MATCH_NOT_RUNNING':
        return {
          title: 'Match non disponible',
          message: "Ce match n'est pas en cours.",
          severity: 'warning',
          isExpected: false,
        }
      case 'PLAYER_NOT_IN_MATCH':
        return {
          title: 'Accès refusé',
          message: "Vous n'êtes pas participant de ce match.",
          severity: 'danger',
          isExpected: false, // Erreur de permission, bloquante
        }
      case 'MATCH_NOT_JOINABLE':
        return {
          title: 'Match non joignable',
          message: "Ce match n'est plus joignable.",
          severity: 'danger',
          isExpected: false, // Erreur bloquante
        }
      default:
        // Code inconnu, utiliser le message du backend si disponible
        return {
          title: 'Erreur',
          message: apiError.message || 'Une erreur est survenue.',
          severity: 'warning',
          isExpected: false,
        }
    }
  }

  // Erreur 4xx sans code spécifique, utiliser le message
  if (apiError.statusCode >= 400 && apiError.statusCode < 500) {
    return {
      title: 'Erreur de requête',
      message: apiError.message || 'Requête invalide. Veuillez réessayer.',
      severity: 'warning',
      isExpected: false,
    }
  }

  // Fallback générique
  return {
    title: 'Erreur',
    message: apiError.message || 'Une erreur est survenue.',
    severity: 'warning',
    isExpected: false,
  }
}

