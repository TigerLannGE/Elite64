import { useEffect, useState, useRef, useCallback } from 'react'
import { api, MatchStateViewDto, ApiError } from '../lib/api'

/**
 * Hook pour polling robuste avec retry/backoff et indicateur de connexion
 * Phase 6.1.B - Gameplay UX Completion
 *
 * Utilise setTimeout récursif (pas setInterval) pour éviter les timers multiples
 */
export function useMatchPolling(
  matchId: string | null,
  isMatchActive: boolean,
  onUpdate: (state: MatchStateViewDto) => void,
  onError?: (error: ApiError) => void
): {
  isConnected: boolean
  retryCount: number
  lastError: ApiError | null
} {
  const [isConnected, setIsConnected] = useState(true)
  const [retryCount, setRetryCount] = useState(0)
  const [lastError, setLastError] = useState<ApiError | null>(null)

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)
  const retryCountRef = useRef(0)
  const onUpdateRef = useRef(onUpdate)
  const onErrorRef = useRef(onError)

  // Mettre à jour les refs des callbacks
  useEffect(() => {
    onUpdateRef.current = onUpdate
    onErrorRef.current = onError
  }, [onUpdate, onError])

  // Fonction récursive pour scheduler le prochain poll
  const scheduleNext = useCallback(
    (delay: number) => {
      if (!isMatchActive || !matchId || !isMountedRef.current) {
        return
      }

      timeoutRef.current = setTimeout(async () => {
        if (!isMountedRef.current || !matchId) {
          return
        }

        try {
          const state = await api.getMatchState(matchId)
          
          if (!isMountedRef.current) {
            return
          }

          // Succès : reset retry count et connexion
          retryCountRef.current = 0
          setRetryCount(0)
          setIsConnected(true)
          setLastError(null)
          onUpdateRef.current(state)

          // Scheduler le prochain poll avec interval normal
          scheduleNext(2000)
        } catch (err) {
          if (!isMountedRef.current) {
            return
          }

          const apiError = err as ApiError
          retryCountRef.current = retryCountRef.current + 1
          const newRetryCount = retryCountRef.current

          setRetryCount(newRetryCount)
          setLastError(apiError)

          // Après 3 échecs consécutifs, marquer comme déconnecté
          if (newRetryCount >= 3) {
            setIsConnected(false)
          }

          // Appeler le callback d'erreur si fourni
          if (onErrorRef.current) {
            onErrorRef.current(apiError)
          }

          // Backoff exponentiel : 1s, 2s, 4s, max 8s
          const backoffDelay = Math.min(
            1000 * Math.pow(2, newRetryCount - 1),
            8000
          )
          scheduleNext(backoffDelay)
        }
      }, delay)
    },
    [matchId, isMatchActive]
  )

  // Démarrer le polling
  useEffect(() => {
    isMountedRef.current = true

    if (matchId && isMatchActive) {
      // Premier appel après 2 secondes
      scheduleNext(2000)
    }

    return () => {
      isMountedRef.current = false
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [matchId, isMatchActive, scheduleNext])

  return {
    isConnected,
    retryCount,
    lastError,
  }
}

