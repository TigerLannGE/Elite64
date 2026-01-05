import { useEffect, useState, useRef } from 'react'
import { MatchColor } from '../lib/api'

/**
 * Hook pour gérer le timer client-side synchronisé sur serverTimeUtc
 * Phase 6.1.B - Gameplay UX Completion
 * 
 * ROOT CAUSE (bug fix 2024):
 * Le backend ne décrémente pas les temps entre les polls; il renvoie souvent 10:00.
 * L'ancienne logique écrasait les valeurs locales à chaque poll, causant des resets
 * visuels (10:00 → 09:59 → 09:57 → 10:00).
 * 
 * Solution: Logique "snapshot + countdown":
 * - Stocker un snapshot serveur uniquement quand les valeurs changent vraiment
 * - Décrémenter localement à partir du snapshot: displayed = snapshotMs - elapsed
 * - Ne jamais écraser le temps local si les valeurs serveur n'ont pas changé
 * - Recaler uniquement si l'écart > 1500ms pour éviter le jitter
 * 
 * Invariant: aucun reset visuel tant que personne ne joue
 * 
 * @param whiteTimeMsRemaining - Temps restant blanc (millisecondes)
 * @param blackTimeMsRemaining - Temps restant noir (millisecondes)
 * @param serverTimeUtc - Heure serveur UTC (ISO string)
 * @param turn - Tour actuel (WHITE ou BLACK)
 * @param isRunning - Si le match est en cours (status === 'RUNNING')
 * @param moveNumber - Numéro de coup (optionnel, pour détecter les changements)
 */
export function useMatchTimer(
  whiteTimeMsRemaining: number,
  blackTimeMsRemaining: number,
  serverTimeUtc: string,
  turn: MatchColor,
  isRunning: boolean,
  moveNumber?: number
): {
  whiteTimeMs: number
  blackTimeMs: number
} {
  const [whiteTimeMs, setWhiteTimeMs] = useState(whiteTimeMsRemaining)
  const [blackTimeMs, setBlackTimeMs] = useState(blackTimeMsRemaining)

  // Snapshot serveur: valeurs de référence pour le countdown
  interface TimerSnapshot {
    whiteMs: number
    blackMs: number
    turn: MatchColor
    receivedAtClientMs: number
    moveNumber?: number
  }

  const snapshotRef = useRef<TimerSnapshot | null>(null)
  const intervalIdRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const displayedWhiteRef = useRef<number>(whiteTimeMsRemaining)
  const displayedBlackRef = useRef<number>(blackTimeMsRemaining)

  // Effet 1: Gestion du snapshot serveur
  // Dépend UNIQUEMENT des valeurs serveur (pas des valeurs dérivées locales)
  useEffect(() => {
    if (!isRunning) {
      // Si le match n'est pas en cours, réinitialiser
      snapshotRef.current = null
      setWhiteTimeMs(whiteTimeMsRemaining)
      setBlackTimeMs(blackTimeMsRemaining)
      displayedWhiteRef.current = whiteTimeMsRemaining
      displayedBlackRef.current = blackTimeMsRemaining
      return
    }

    const currentSnapshot = snapshotRef.current
    const receivedAtClientMs = Date.now()

    // Déterminer si on doit mettre à jour le snapshot
    let shouldUpdateSnapshot = false
    let updateReason = ''

    if (currentSnapshot === null) {
      // Premier snapshot
      shouldUpdateSnapshot = true
      updateReason = 'initial snapshot'
    } else {
      // Vérifier si les valeurs serveur ont changé
      const whiteChanged = Math.abs(currentSnapshot.whiteMs - whiteTimeMsRemaining) > 50 // Tolérance 50ms
      const blackChanged = Math.abs(currentSnapshot.blackMs - blackTimeMsRemaining) > 50
      const turnChanged = currentSnapshot.turn !== turn
      const moveNumberChanged = moveNumber !== undefined && currentSnapshot.moveNumber !== moveNumber

      if (whiteChanged || blackChanged || turnChanged || moveNumberChanged) {
        shouldUpdateSnapshot = true
        if (whiteChanged) updateReason += 'whiteChanged '
        if (blackChanged) updateReason += 'blackChanged '
        if (turnChanged) updateReason += 'turnChanged '
        if (moveNumberChanged) updateReason += 'moveNumberChanged '
      } else {
        // Vérifier si un recalage est nécessaire (écart > 1500ms)
        const whiteDiff = Math.abs(displayedWhiteRef.current - whiteTimeMsRemaining)
        const blackDiff = Math.abs(displayedBlackRef.current - blackTimeMsRemaining)

        if (whiteDiff > 1500 || blackDiff > 1500) {
          shouldUpdateSnapshot = true
          updateReason = `recalage (whiteDiff=${whiteDiff}ms, blackDiff=${blackDiff}ms)`
        }
      }
    }

    if (shouldUpdateSnapshot) {
      // LOG TEMPORAIRE
      console.log('[TIMER SNAPSHOT] Updating snapshot:', {
        reason: updateReason,
        oldSnapshot: currentSnapshot,
        newSnapshot: {
          whiteMs: whiteTimeMsRemaining,
          blackMs: blackTimeMsRemaining,
          turn,
          moveNumber,
          receivedAtClientMs,
        },
      })

      snapshotRef.current = {
        whiteMs: whiteTimeMsRemaining,
        blackMs: blackTimeMsRemaining,
        turn,
        receivedAtClientMs,
        moveNumber,
      }

      // Mettre à jour les états et refs avec les nouvelles valeurs serveur
      setWhiteTimeMs(whiteTimeMsRemaining)
      setBlackTimeMs(blackTimeMsRemaining)
      displayedWhiteRef.current = whiteTimeMsRemaining
      displayedBlackRef.current = blackTimeMsRemaining
    } else {
      // LOG TEMPORAIRE: Snapshot non mis à jour (valeurs identiques)
      console.log('[TIMER SNAPSHOT] Skipping update (no change):', {
        serverWhite: whiteTimeMsRemaining,
        serverBlack: blackTimeMsRemaining,
        displayedWhite: displayedWhiteRef.current,
        displayedBlack: displayedBlackRef.current,
        turn,
      })
    }
  }, [isRunning, whiteTimeMsRemaining, blackTimeMsRemaining, turn, moveNumber]) // UNIQUEMENT valeurs serveur

  // Effet 2: Interval de countdown
  // Créé UNE SEULE FOIS tant que isRunning === true
  // Lit snapshotRef.current à chaque tick (pas de dépendance)
  useEffect(() => {
    if (!isRunning) {
      // Nettoyer l'interval si le match n'est pas en cours
      if (intervalIdRef.current !== null) {
        console.log('[TIMER] Interval cleared (not running)')
        clearInterval(intervalIdRef.current)
        intervalIdRef.current = null
      }
      return
    }

    // Si l'interval existe déjà, ne pas en créer un nouveau
    if (intervalIdRef.current !== null) {
      return
    }

    // LOG TEMPORAIRE: Interval started
    console.log('[TIMER] Interval started', {
      isRunning,
      snapshot: snapshotRef.current,
    })

    const interval = setInterval(() => {
      const snapshot = snapshotRef.current
      if (snapshot === null) {
        return
      }

      const clientNow = Date.now()
      const elapsed = clientNow - snapshot.receivedAtClientMs

      // Calculer les temps affichés: snapshot - elapsed pour le joueur au trait
      let newWhiteMs: number
      let newBlackMs: number

      if (snapshot.turn === 'WHITE') {
        // Blanc au trait: décrémenter blanc, noir reste fixe
        newWhiteMs = Math.max(0, snapshot.whiteMs - elapsed)
        newBlackMs = snapshot.blackMs
      } else {
        // Noir au trait: décrémenter noir, blanc reste fixe
        newWhiteMs = snapshot.whiteMs
        newBlackMs = Math.max(0, snapshot.blackMs - elapsed)
      }

      // Mettre à jour les refs et états
      displayedWhiteRef.current = newWhiteMs
      displayedBlackRef.current = newBlackMs
      setWhiteTimeMs(newWhiteMs)
      setBlackTimeMs(newBlackMs)
    }, 1000) // Tick à 1 seconde

    intervalIdRef.current = interval

    return () => {
      console.log('[TIMER] Interval cleared (cleanup)')
      clearInterval(interval)
      intervalIdRef.current = null
    }
  }, [isRunning]) // UNIQUEMENT isRunning

  return {
    whiteTimeMs,
    blackTimeMs,
  }
}
