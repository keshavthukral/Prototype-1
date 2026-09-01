/**
 * Trail Connect — Interactive task component.
 *
 * Displays numbered points at absolute positions inside a container.
 * The player must tap them in ascending order (1 → 2 → …).
 * Correct taps draw connecting lines; incorrect taps show a calm
 * error message.  The next expected number is always indicated.
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { Check } from 'lucide-react'
import type { TrailConnectConfig } from '@/features/games/data/challenges'
import type { ChallengeMetric } from '@/features/games/metrics/types'
import type { DifficultyLevel } from '@/lib/games/adaptive-engine'
import { TelemetryTracker } from '@/features/games/engine/telemetry'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/language-context'

// ─── Props ──────────────────────────────────────────────────────

interface TrailConnectProps {
  config: TrailConnectConfig
  difficulty: DifficultyLevel
  onComplete: (metric: ChallengeMetric) => void
}

// ─── Component ──────────────────────────────────────────────────

export function TrailConnect({ config, difficulty, onComplete }: TrailConnectProps) {
  const telemetryRef = useRef(new TelemetryTracker())
  const [tappedIds, setTappedIds] = useState<Set<string>>(new Set())
  const [nextIndex, setNextIndex] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const completedRef = useRef(false)
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [skipDialogOpen, setSkipDialogOpen] = useState(false)

  // Start telemetry on mount
  useEffect(() => {
    telemetryRef.current.start(difficulty, 'trail-connect')
  }, [difficulty])

  // Cleanup error timer on unmount
  useEffect(() => {
    return () => {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current)
    }
  }, [])

  const handleSkip = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true

    const record = telemetryRef.current.skip()
    const metric: ChallengeMetric = {
      challengeId: config.id,
      challengeType: 'trail-connect',
      correct: false,
      responseTimeMs: record.completionTimeMs,
      timeToFirstInteractionMs: record.timeToFirstInteractionMs,
      hints: 0,
      skipped: true,
      changedAnswers: record.incorrectClicks,
      difficulty,
    }
    onComplete(metric)
  }, [config.id, difficulty, onComplete])

  const totalPoints = config.points.length
  const nextExpectedId = config.order[nextIndex] ?? null
  const nextPoint = nextExpectedId
    ? config.points.find((p) => p.id === nextExpectedId)
    : null

  const handlePointTap = useCallback(
    (pointId: string) => {
      if (completedRef.current) return
      // Already tapped — no-op
      if (tappedIds.has(pointId)) return

      const expectedId = config.order[nextIndex]
      const isCorrect = pointId === expectedId

      if (isCorrect) {
        telemetryRef.current.recordClick(true)
        const nextTapped = new Set(tappedIds)
        nextTapped.add(pointId)
        setTappedIds(nextTapped)
        setErrorMessage(null)

        const nextIdx = nextIndex + 1
        setNextIndex(nextIdx)

        // If all points have been tapped correctly, complete the challenge
        if (nextIdx === totalPoints) {
          completedRef.current = true
          const record = telemetryRef.current.complete(true, 100)
          const metric: ChallengeMetric = {
            challengeId: config.id,
            challengeType: 'trail-connect',
            correct: true,
            responseTimeMs: record.completionTimeMs,
            timeToFirstInteractionMs: record.timeToFirstInteractionMs,
            hints: 0,
            skipped: false,
            changedAnswers: record.incorrectClicks,
            difficulty,
          }
          onComplete(metric)
        }
      } else {
        // Wrong tap — show calm message, don't reset progress
        telemetryRef.current.recordClick(false)

        // Clear any existing error timer
        if (errorTimerRef.current) clearTimeout(errorTimerRef.current)

        setErrorMessage("That's not the next number.")
        errorTimerRef.current = setTimeout(() => {
          setErrorMessage(null)
          errorTimerRef.current = null
        }, 2000)
      }
    },
    [tappedIds, nextIndex, config.order, config.id, difficulty, onComplete, totalPoints],
  )

  // ── Build ordered tapped list for line drawing ──
  const tappedOrder = config.order.filter((id) => tappedIds.has(id))

  return (
    <section className="flex flex-col items-center">
      {/* Task title */}
      <h1 className="mt-3 text-center text-2xl font-bold text-foreground">
        Trail Connect
      </h1>

      {/* Instruction card */}
      <div className="mt-3 flex flex-col items-center gap-1 rounded-2xl border border-border bg-card px-6 py-3">
        <p className="text-sm font-medium text-muted-foreground">
          Tap the numbers in order
        </p>
        <p className="text-lg font-bold text-foreground">
          {totalPoints > 0 ? '1' : '?'} → {totalPoints}
        </p>
      </div>

      {/* Progress indicator */}
      <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
        <span>
          {tappedIds.size} of {totalPoints} completed
        </span>
        {nextPoint && (
          <>
            <span aria-hidden="true">·</span>
            <span>
              Next:{' '}
              <span className="font-semibold text-foreground">
                {nextPoint.label}
              </span>
            </span>
          </>
        )}
      </div>

      {/* Error message */}
      {errorMessage && (
        <p
          role="status"
          className="mt-2 rounded-xl bg-destructive/5 px-4 py-2 text-sm font-medium text-destructive"
        >
          {errorMessage}
        </p>
      )}

      {/* Progress bar */}
      <div className="mx-auto mt-4 h-1.5 w-full max-w-xl overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300 motion-reduce:transition-none"
          style={{ width: `${totalPoints > 0 ? (tappedIds.size / totalPoints) * 100 : 0}%` }}
          role="progressbar"
          aria-valuenow={tappedIds.size}
          aria-valuemin={0}
          aria-valuemax={totalPoints}
          aria-label={`${tappedIds.size} of ${totalPoints} completed`}
        />
      </div>

      {/* Visual field */}
      <div
        className="relative mx-auto mt-5 aspect-[4/3] w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-card to-secondary/30 shadow-sm"
        style={{
          backgroundImage:
            'radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      >
        {/* SVG connecting lines */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          {tappedOrder.length > 1 &&
            tappedOrder.map((id, i) => {
              if (i === 0) return null
              const prevPoint = config.points.find((p) => p.id === tappedOrder[i - 1])!
              const currPoint = config.points.find((p) => p.id === id)!
              return (
                <line
                  key={`${tappedOrder[i - 1]}-${id}`}
                  x1={`${prevPoint.x}%`}
                  y1={`${prevPoint.y}%`}
                  x2={`${currPoint.x}%`}
                  y2={`${currPoint.y}%`}
                  stroke="hsl(var(--primary))"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.85"
                />
              )
            })}
        </svg>

        {/* Points */}
        {config.points.map((point) => {
          const isTapped = tappedIds.has(point.id)
          const isNext = nextExpectedId === point.id

          return (
            <button
              key={point.id}
              type="button"
              aria-label={`Number ${point.label}${isNext ? ', next' : ''}${isTapped ? ', completed' : ''}`}
              aria-pressed={isTapped}
              onClick={() => handlePointTap(point.id)}
              style={{
                left: `${point.x}%`,
                top: `${point.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
              className={[
                'absolute flex min-h-[52px] min-w-[52px] items-center justify-center rounded-full border-2 text-lg font-bold transition-all duration-200 active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                isTapped
                  ? 'border-primary bg-primary text-primary-foreground shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)] shadow-md'
                  : isNext
                    ? 'border-primary bg-primary/15 text-primary shadow-md'
                    : 'border-border bg-card text-foreground shadow-sm hover:border-primary/40 hover:bg-accent',
              ].join(' ')}
            >
              {isTapped ? (
                <Check className="size-5" aria-hidden="true" />
              ) : (
                point.label
              )}
            </button>
          )
        })}
      </div>

      {/* Skip task — secondary, low-emphasis */}
      <SkipTaskButton onSkip={() => setSkipDialogOpen(true)} />

      {/* Skip confirmation dialog */}
      <SkipConfirmDialog
        open={skipDialogOpen}
        onOpenChange={setSkipDialogOpen}
        onConfirmSkip={handleSkip}
      />
    </section>
  )
}

// ─── Skip task button ──────────────────────────────────────────

function SkipTaskButton({ onSkip }: { onSkip: () => void }) {
  const { t } = useLanguage()
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onSkip}
      className="mt-4 text-sm text-muted-foreground hover:text-foreground"
    >
      {t('skip')} task
    </Button>
  )
}

// ─── Skip confirmation dialog ──────────────────────────────────

function SkipConfirmDialog({
  open,
  onOpenChange,
  onConfirmSkip,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirmSkip: () => void
}) {
  const { t } = useLanguage()
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Skip this task?</AlertDialogTitle>
          <AlertDialogDescription>
            You can move on to the next exercise.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="cursor-pointer">
            Continue task
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirmSkip}
            className="cursor-pointer"
          >
            {t('skip')} task
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
