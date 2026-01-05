import { Modal } from './Modal'

/**
 * Composant ConfirmModal - Phase 6.2.C
 *
 * Remplace window.confirm par un modal React accessible.
 *
 * Usage :
 * ```tsx
 * const [showConfirm, setShowConfirm] = useState(false)
 * const [confirmed, setConfirmed] = useState(false)
 *
 * <ConfirmModal
 *   isOpen={showConfirm}
 *   title="Confirmer l'action"
 *   message="Êtes-vous sûr de vouloir continuer ?"
 *   onConfirm={() => { setConfirmed(true); setShowConfirm(false) }}
 *   onCancel={() => setShowConfirm(false)}
 * />
 * ```
 */
interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  confirmLabel?: string
  cancelLabel?: string
  confirmVariant?: 'primary' | 'danger' // Par défaut 'primary'
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  confirmVariant = 'primary',
}: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} title={title} onClose={onCancel}>
      <div>
        <p className="mb-4 text-gray-700">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
            data-testid="modal-cancel-button"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-white rounded transition-colors ${
              confirmVariant === 'danger'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
            data-testid="modal-confirm-button"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}

