import { PlayerRole } from './api'

/**
 * Retourne la couleur hex pour le pseudo selon le rôle
 * - PLAYER : Acier (#71717a)
 * - ADMIN : Bleu marine (#1e40af)
 * - SUPER_ADMIN : Cuivre satiné (#B87333)
 */
export function getRoleColor(role: PlayerRole | undefined | null): string {
  if (!role) return '#d1d5db' // Par défaut si pas de rôle
  
  const roleColors = {
    PLAYER: '#71717a', // Acier
    ADMIN: '#1e40af', // Bleu marine
    SUPER_ADMIN: '#B87333', // Cuivre satiné
  }
  return roleColors[role as PlayerRole] || roleColors.PLAYER
}

/**
 * Retourne la classe CSS Tailwind pour la couleur du pseudo selon le rôle (pour compatibilité)
 */
export function getRoleColorClass(role: PlayerRole | undefined | null): string {
  if (!role) return 'text-gray-300'
  
  const roleColors = {
    PLAYER: 'text-gray-500', // Acier
    ADMIN: 'text-blue-800', // Bleu marine
    SUPER_ADMIN: 'text-amber-700', // Cuivre satiné
  }
  return roleColors[role as PlayerRole] || roleColors.PLAYER
}

/**
 * Retourne la classe CSS Tailwind pour la couleur du pseudo avec effet hover
 */
export function getRoleColorClassWithHover(role: PlayerRole | undefined | null): string {
  if (!role) return 'text-gray-300 hover:text-white'
  
  const roleColors = {
    PLAYER: 'text-gray-500 hover:text-gray-400', // Acier
    ADMIN: 'text-blue-800 hover:text-blue-700', // Bleu marine
    SUPER_ADMIN: 'text-amber-700 hover:text-amber-600', // Cuivre satiné
  }
  return roleColors[role as PlayerRole] || roleColors.PLAYER
}

