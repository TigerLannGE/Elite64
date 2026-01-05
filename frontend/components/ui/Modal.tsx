import { useEffect, useRef, ReactNode } from 'react'

/**
 * Composant Modal réutilisable - Phase 6.2.C
 *
 * Remplace window.prompt/confirm par des modals React accessibles.
 *
 * Accessibilité :
 * - role="dialog" aria-modal="true"
 * - Fermeture via ESC
 * - Fermeture via overlay click (optionnel)
 * - Focus trap simple (focus sur le premier bouton focusable)
 */
interface ModalProps {
  isOpen: boolean
  title: string
  children: ReactNode
  onClose: () => void
  closeOnOverlayClick?: boolean // Par défaut true
}

export function Modal({
  isOpen,
  title,
  children,
  onClose,
  closeOnOverlayClick = true,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const firstFocusableRef = useRef<HTMLElement | null>(null)

  // Gérer la fermeture via ESC
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  // Focus trap simple : focus sur le premier élément focusable
  useEffect(() => {
    if (!isOpen || !modalRef.current) return

    // Trouver le premier élément focusable dans le modal
    const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    if (focusableElements.length > 0) {
      firstFocusableRef.current = focusableElements[0]
      firstFocusableRef.current.focus()
    }

    // Empêcher le scroll du body quand le modal est ouvert
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Fermer seulement si on clique sur l'overlay, pas sur le contenu du modal
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
        data-testid="modal"
        onClick={(e) => e.stopPropagation()} // Empêcher la propagation du click sur le contenu
      >
        <h2
          id="modal-title"
          className="text-xl font-bold mb-4"
          data-testid="modal-title"
        >
          {title}
        </h2>
        <div className="mb-4">{children}</div>
      </div>
    </div>
  )
}

