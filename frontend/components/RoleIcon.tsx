import { PlayerRole } from '../lib/api'

interface RoleIconProps {
  role: PlayerRole
  className?: string
}

export function RoleIcon({ role, className = 'w-4 h-4' }: RoleIconProps) {
  const iconColor = {
    PLAYER: '#71717a', // Acier
    ADMIN: '#1e40af', // Bleu marine
    SUPER_ADMIN: '#B87333', // Cuivre satiné
  }[role] || '#71717a'

  const icons = {
    PLAYER: (
      // Deux épées qui se croisent - version simple et élégante
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <line
          x1="6"
          y1="6"
          x2="18"
          y2="18"
          stroke={iconColor}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="18"
          y1="6"
          x2="6"
          y2="18"
          stroke={iconColor}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle
          cx="12"
          cy="12"
          r="2"
          fill={iconColor}
        />
      </svg>
    ),
    ADMIN: (
      // Bouclier - version simple et élégante
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path
          d="M12 2L4 5V11C4 16.55 7.16 21.74 12 23C16.84 21.74 20 16.55 20 11V5L12 2Z"
          stroke={iconColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M9 10L12 13L15 10"
          stroke={iconColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    SUPER_ADMIN: (
      // Couronne - version simple et élégante
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path
          d="M5 16L3 7L8.5 10L12 4L15.5 10L21 7L19 16H5Z"
          stroke={iconColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M5 16H19V20H5V16Z"
          stroke={iconColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    ),
  }

  return icons[role] || icons.PLAYER
}

