/**
 * Everyday Sequence — Interactive task component.
 *
 * Shows daily-routine steps in shuffled order.  The player taps
 * them one at a time to build the correct sequence, then submits.
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import type { EverydaySequenceConfig } from '@/features/games/data/challenges'
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
import { useLanguage } from '@/lib/i18n/language-context'

// ─── Props ──────────────────────────────────────────────────────

interface EverydaySequenceProps {
  config: EverydaySequenceConfig
  difficulty: DifficultyLevel
  onComplete: (metric: ChallengeMetric) => void
}

// ─── Helpers ────────────────────────────────────────────────────

/** Fisher–Yates shuffle (returns new array) */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = a[i]!
    a[i] = a[j]!
    a[j] = temp
  }
  return a
}

// ─── Component ──────────────────────────────────────────────────

export function EverydaySequence({
  config,
  difficulty,
  onComplete,
}: EverydaySequenceProps) {
  const telemetryRef = useRef(new TelemetryTracker())
  const completedRef = useRef(false)
  const [poolOrder] = useState(() => shuffle(config.steps.map((s) => s.id)))
  const [placed, setPlaced] = useState<string[]>([])
  const [completedMetric, setCompletedMetric] =
    useState<ChallengeMetric | null>(null)
  const [skipDialogOpen, setSkipDialogOpen] = useState(false)

  const totalSteps = config.steps.length
  const placedSet = new Set(placed)

  // Start telemetry on mount
  useEffect(() => {
    telemetryRef.current.start(difficulty, 'everyday-sequence')
  }, [difficulty])

  // When completed, defer onComplete to avoid setState-during-render
  useEffect(() => {
    if (completedMetric) {
      onComplete(completedMetric)
    }
  }, [completedMetric, onComplete])

  const handleSkip = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true

    const record = telemetryRef.current.skip()
    setCompletedMetric({
      challengeId: config.id,
      challengeType: 'everyday-sequence',
      correct: false,
      responseTimeMs: record.completionTimeMs,
      timeToFirstInteractionMs: record.timeToFirstInteractionMs,
      hints: 0,
      skipped: true,
      changedAnswers: record.incorrectClicks,
      difficulty,
    })
  }, [config.id, difficulty])

  const handlePoolTap = useCallback(
    (stepId: string) => {
      if (placedSet.has(stepId)) return

      // Correct if this step matches the expected next position
      const positionIndex = placed.length
      const isCorrect = config.steps[positionIndex]?.id === stepId
      telemetryRef.current.recordClick(isCorrect)

      setPlaced((prev) => [...prev, stepId])
    },
    [placed, placedSet, config.steps],
  )

  const handleRemove = useCallback((stepId: string) => {
    setPlaced((prev) => prev.filter((id) => id !== stepId))
  }, [])

  const handleSubmit = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true

    // Compare user's order against correct order position by position
    let correctCount = 0
    for (let i = 0; i < totalSteps; i++) {
      if (placed[i] === config.steps[i]?.id) {
        correctCount++
      }
    }
    const accuracy = Math.round((correctCount / totalSteps) * 100)
    const record = telemetryRef.current.complete(accuracy === 100, accuracy)
    setCompletedMetric({
      challengeId: config.id,
      challengeType: 'everyday-sequence',
      correct: accuracy === 100,
      responseTimeMs: record.completionTimeMs,
      timeToFirstInteractionMs: record.timeToFirstInteractionMs,
      hints: 0,
      skipped: false,
      changedAnswers: record.incorrectClicks,
      difficulty,
    })
  }, [placed, config.id, config.steps, totalSteps, difficulty])

  // Render while awaiting deferred onComplete
  if (completedMetric) {
    return null
  }

  // Lookup helper for step label
  const stepLabel = (id: string) =>
    config.steps.find((s) => s.id === id)?.label ?? id

  return (
    <section className="flex flex-col items-center">
      {/* Task title */}
      <h1 className="mt-3 text-center text-2xl font-bold text-foreground">
        Everyday Sequencing
      </h1>

      {/* Routine name */}
      <p className="mt-2 text-center text-lg font-semibold text-primary">
        {config.routineLabel}
      </p>

      {/* Instruction */}
      <p className="mt-2 text-center text-base text-muted-foreground">
        {config.prompt}
      </p>

      {/* Pool of shuffled steps */}
      <div className="mx-auto mt-6 flex w-full max-w-xl flex-wrap justify-center gap-3">
        {poolOrder.map((stepId) => {
          const isPlaced = placedSet.has(stepId)
          return (
            <button
              key={stepId}
              type="button"
              disabled={isPlaced}
              aria-label={`Step: ${stepLabel(stepId)}`}
              onClick={() => handlePoolTap(stepId)}
              className={[
                'flex min-h-[52px] cursor-pointer items-center rounded-2xl border-2 px-4 py-3 text-base font-semibold transition-colors duration-150 hover:border-primary/40 hover:bg-accent active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100',
                'border-border bg-card text-foreground',
              ].join(' ')}
            >
              {stepLabel(stepId)}
            </button>
          )
        })}
      </div>

      {/* Ordered list — shows placed items in sequence */}
      <ol className="mx-auto mt-6 grid w-full max-w-xl gap-3 sm:grid-cols-2">
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepId = placed[index]
          return (
            <li key={index} className="min-h-16">
              <button
                type="button"
                disabled={!stepId}
                onClick={() => stepId && handleRemove(stepId)}
                className={[
                  'flex min-h-16 w-full cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed bg-card px-5 text-left transition-colors duration-150 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100',
                  stepId
                    ? 'border-primary bg-primary/5 text-foreground'
                    : 'border-border text-muted-foreground',
                ].join(' ')}
              >
                <span className="text-xl font-bold text-muted-foreground">
                  {index + 1}
                </span>
                {stepId ? (
                  <span className="text-base font-semibold text-foreground">
                    {stepLabel(stepId)}
                  </span>
                ) : (
                  <span className="text-lg text-muted-foreground">
                    Tap a step below
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ol>

      <Button
        size="lg"
        className="mx-auto mt-6 w-full max-w-sm text-lg"
        disabled={placed.length !== totalSteps}
        onClick={handleSubmit}
      >
        Confirm
      </Button>

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
