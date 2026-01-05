import { useState, useEffect, useRef } from 'react'
import { Modal } from './Modal'

/**
 * Composant PromptModal - Phase 6.2.C
 *
 * Remplace window.prompt par un modal React accessible.
 *
 * Usage :
 * ```tsx
 * const [showPrompt, setShowPrompt] = useState(false)
 * const [promptValue, setPromptValue] = useState<string | null>(null)
 *
 * <PromptModal
 *   isOpen={showPrompt}
 *   title="Promotion du pion"
 *   message="Choisissez une pièce:\nq = Dame\nr = Tour\nb = Fou\nn = Cavalier"
 *   defaultValue="q"
 *   onConfirm={(value) => { setPromptValue(value); setShowPrompt(false) }}
 *   onCancel={() => setShowPrompt(false)}
 * />
 * ```
 */
interface PromptModalProps {
  isOpen: boolean
  title: string
  message: string
  defaultValue?: string
  onConfirm: (value: string) => void
  onCancel: () => void
  confirmLabel?: string
  cancelLabel?: string
  validate?: (value: string) => boolean // Fonction de validation optionnelle
}

export function PromptModal({
  isOpen,
  title,
  message,
  defaultValue = '',
  onConfirm,
  onCancel,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  validate,
}: PromptModalProps) {
  const [value, setValue] = useState(defaultValue)
  const inputRef = useRef<HTMLInputElement>(null)

  // Réinitialiser la valeur quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue)
      // Focus sur l'input après un court délai pour que le Modal ait fini son focus trap
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 100)
    }
  }, [isOpen, defaultValue])

  const handleConfirm = () => {
    if (validate && !validate(value)) {
      return // Ne pas confirmer si la validation échoue
    }
    onConfirm(value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleConfirm()
    }
  }

  // Convertir les \n en <br> pour le message
  const messageLines = message.split('\n')

  return (
    <Modal isOpen={isOpen} title={title} onClose={onCancel}>
      <div>
        <div className="mb-4">
          {messageLines.map((line, index) => (
            <p key={index} className="text-gray-700">
              {line}
            </p>
          ))}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full px-3 py-2 border border-gray-300 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          data-testid="modal-prompt-input"
          autoFocus
        />
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
            onClick={handleConfirm}
            disabled={validate && !validate(value)}
            className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="modal-confirm-button"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}

