import { Modal } from './Modal'

/**
 * Composant PromotionModal - Phase 6.2.C
 *
 * Modal pour choisir la pièce de promotion (Dame, Tour, Fou, Cavalier).
 * Remplace window.prompt() pour une meilleure UX et accessibilité.
 */
interface PromotionModalProps {
  isOpen: boolean
  onChoose: (promotion: 'q' | 'r' | 'b' | 'n') => void
  onCancel: () => void
  isSubmitting?: boolean // État de chargement pendant l'appel API
}

const promotionOptions: Array<{
  value: 'q' | 'r' | 'b' | 'n'
  label: string
  letter: string
}> = [
  { value: 'q', label: 'Dame', letter: 'Q' },
  { value: 'r', label: 'Tour', letter: 'R' },
  { value: 'b', label: 'Fou', letter: 'B' },
  { value: 'n', label: 'Cavalier', letter: 'N' },
]

export function PromotionModal({ 
  isOpen, 
  onChoose, 
  onCancel,
  isSubmitting = false 
}: PromotionModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      title="Choisir une pièce"
      onClose={onCancel}
      closeOnOverlayClick={!isSubmitting} // Ne pas fermer pendant l'envoi
    >
      <div data-testid="promotion-modal">
        <p className="mb-4 text-gray-700">Sélectionnez la pièce pour la promotion.</p>
        
        {isSubmitting && (
          <p className="mb-4 text-sm text-gray-500 italic">Traitement...</p>
        )}
        
        <div className="grid grid-cols-2 gap-3 mb-4">
          {promotionOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onChoose(option.value)}
              disabled={isSubmitting}
              className="flex flex-col items-center justify-center p-4 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:bg-transparent"
              data-testid={`promotion-choice-${option.value}`}
            >
              <span className="text-2xl font-bold text-gray-700 mb-1">{option.letter}</span>
              <span className="text-sm text-gray-600">{option.label}</span>
            </button>
          ))}
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="promotion-cancel"
          >
            Annuler
          </button>
        </div>
      </div>
    </Modal>
  )
}

