/**
 * useCountdown — manages a countdown timer with phase transition.
 *
 * Returns the current seconds remaining and cleans up on unmount.
 */

import { useCallback, useEffect, useRef, useState } from 'react'

export function useCountdown() {
  const [secondsLeft, setSecondsLeft] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  /**
   * Start a countdown for `duration` seconds.
   * Calls `onComplete` when the countdown reaches zero.
   */
  const start = useCallback(
    (duration: number, onComplete: () => void) => {
      // Clear any existing timers
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)

      setSecondsLeft(duration)
      let remaining = duration

      intervalRef.current = setInterval(() => {
        remaining -= 1
        setSecondsLeft(remaining)
        if (remaining <= 0 && intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }, 1000)

      timeoutRef.current = setTimeout(() => {
        onComplete()
        timeoutRef.current = null
      }, duration * 1000)
    },
    [],
  )

  /** Stop the countdown early (e.g., when user skips) */
  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  return { secondsLeft, start, stop }
}
