import { Modal } from './Modal'

/**
 * Composant ResignModal - Phase 6.2.C
 *
 * Modal pour confirmer l'abandon d'un match.
 * Remplace window.confirm() pour une meilleure UX et accessibilité.
 */
interface ResignModalProps {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
  isSubmitting?: boolean // État de chargement pendant l'appel API
}

export function ResignModal({
  isOpen,
  onConfirm,
  onCancel,
  isSubmitting = false,
}: ResignModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      title="Confirmer l'abandon"
      onClose={onCancel}
      closeOnOverlayClick={!isSubmitting} // Ne pas fermer pendant l'envoi
    >
      <div data-testid="resign-modal">
        <p className="mb-4 text-gray-700">
          Vous êtes sur le point d&apos;abandonner ce match. Cette action est irréversible.
        </p>
        {isSubmitting && (
          <p className="mb-4 text-sm text-gray-500 italic">Envoi en cours...</p>
        )}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="resign-cancel"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="resign-confirm"
          >
            {isSubmitting ? 'Envoi...' : 'Confirmer l\'abandon'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

