/**
 * useGameTimer — Safe, reusable countdown timer for game phases.
 *
 * Requirements:
 * - One timer instance per call
 * - Proper cleanup on unmount
 * - StrictMode safe (handles double mount)
 * - Pauses when phase ends
 * - Never recreates continuously
 * - No network dependency
 * - Visible countdown/progress
 */

import { useCallback, useEffect, useRef, useState } from 'react'

interface UseGameTimerReturn {
  /** Seconds remaining on the countdown (0 when not running) */
  secondsLeft: number
  /** Start a countdown. Calls onComplete when it reaches 0. */
  start: (durationSeconds: number, onComplete: () => void) => void
  /** Stop the timer early (e.g. user skips) */
  stop: () => void
  /** Whether the timer is currently running */
  isRunning: boolean
}

export function useGameTimer(): UseGameTimerReturn {
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onCompleteRef = useRef<(() => void) | null>(null)

  // Cleanup on unmount — StrictMode safe
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [])

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    onCompleteRef.current = null
    setIsRunning(false)
    setSecondsLeft(0)
  }, [])

  const start = useCallback(
    (durationSeconds: number, onComplete: () => void) => {
      // Clear any existing timer first
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }

      onCompleteRef.current = onComplete
      setSecondsLeft(durationSeconds)
      setIsRunning(true)

      let remaining = durationSeconds

      intervalRef.current = setInterval(() => {
        remaining -= 1
        setSecondsLeft(remaining)

        if (remaining <= 0) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
          }
        }
      }, 1000)

      timeoutRef.current = setTimeout(() => {
        // Fire completion callback
        onCompleteRef.current?.()
        onCompleteRef.current = null

        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
        timeoutRef.current = null
        setIsRunning(false)
      }, durationSeconds * 1000)
    },
    [],
  )

  return { secondsLeft, start, stop, isRunning }
}
