/**
 * Cancellation — Interactive task component.
 *
 * Displays a field of objects; the player must find and tap every
 * instance of a specific target.  The target is shown clearly above
 * the grid so the user never has to memorize it.
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { CancellationConfig } from '@/features/games/data/challenges'
import type { ChallengeMetric } from '@/features/games/metrics/types'
import type { DifficultyLevel } from '@/lib/games/adaptive-engine'
import { TelemetryTracker } from '@/features/games/engine/telemetry'
import { ObjectVisual } from '@/features/games/engine/ObjectVisual'
import { OBJECT_POOL } from '@/features/games/data/objects'
import type { GameChoice } from '@/features/games/types'
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

interface CancellationProps {
  config: CancellationConfig
  difficulty: DifficultyLevel
  onComplete: (metric: ChallengeMetric) => void
}

// ─── Grid column helper ─────────────────────────────────────────

function gridCols(count: number): string {
  if (count <= 4) return 'grid-cols-2'
  if (count <= 9) return 'grid-cols-3'
  if (count <= 16) return 'grid-cols-4'
  return 'grid-cols-5'
}

// ─── Object lookup ──────────────────────────────────────────────

function objectById(id: string): GameChoice {
  return (
    OBJECT_POOL.find((o) => o.id === id) ?? {
      id,
      emoji: '❓',
      label: id,
    }
  )
}

// ─── Component ──────────────────────────────────────────────────

export function Cancellation({ config, difficulty, onComplete }: CancellationProps) {
  const telemetryRef = useRef(new TelemetryTracker())
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [deselectCount, setDeselectCount] = useState(0)
  const completedRef = useRef(false)
  const [skipDialogOpen, setSkipDialogOpen] = useState(false)

  // Start telemetry on mount
  useEffect(() => {
    telemetryRef.current.start(difficulty, 'cancellation')
  }, [difficulty])

  const targetObject = objectById(config.targetObjectId)
  const totalTargets = config.targetIndices.length
  const foundCount = [...selected].filter((idx) =>
    config.targetIndices.includes(idx),
  ).length
  const remaining = totalTargets - foundCount

  const handleSkip = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true

    const record = telemetryRef.current.skip()
    const metric: ChallengeMetric = {
      challengeId: config.id,
      challengeType: 'cancellation',
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

  const toggleCell = useCallback(
    (index: number) => {
      telemetryRef.current.recordInteraction()
      setSelected((prev) => {
        const next = new Set(prev)
        if (next.has(index)) {
          next.delete(index)
          setDeselectCount((c) => c + 1)
        } else {
          next.add(index)
        }
        return next
      })
    },
    [],
  )

  const handleSubmit = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true

    const targetSet = new Set(config.targetIndices)
    let correctCount = 0
    for (const idx of selected) {
      if (targetSet.has(idx)) correctCount++
    }
    const incorrectCount = selected.size - correctCount

    const accuracy = Math.max(
      0,
      Math.min(
        100,
        Math.round(((correctCount - incorrectCount) / config.targetIndices.length) * 100),
      ),
    )

    const record = telemetryRef.current.complete(accuracy === 100, accuracy)
    const metric: ChallengeMetric = {
      challengeId: config.id,
      challengeType: 'cancellation',
      correct: accuracy === 100,
      responseTimeMs: record.completionTimeMs,
      timeToFirstInteractionMs: record.timeToFirstInteractionMs,
      hints: 0,
      skipped: false,
      changedAnswers: deselectCount,
      difficulty,
    }
    onComplete(metric)
  }, [config, selected, deselectCount, difficulty, onComplete])

  return (
    <section className="flex flex-col items-center">
      {/* Task title */}
      <h1 className="mt-3 text-center text-2xl font-bold text-foreground">
        Cancellation
      </h1>

      {/* Target preview — always visible */}
      <div className="mt-4 flex flex-col items-center gap-1 rounded-2xl border border-border bg-card px-6 py-4">
        <p className="text-sm font-medium text-muted-foreground">
          Find and tap every
        </p>
        <div className="flex items-center gap-3">
          <ObjectVisual item={targetObject} showLabel={false} />
          <span className="text-lg font-bold text-foreground">
            {targetObject.label}
          </span>
        </div>
      </div>

      {/* Progress indicator */}
      <p className="mt-3 text-sm text-muted-foreground">
        {remaining === 0
          ? `All ${totalTargets} targets found`
          : `${foundCount} of ${totalTargets} targets found`}
      </p>

      {/* Grid */}
      <div
        className={`mx-auto mt-6 grid w-full max-w-xl gap-2.5 ${gridCols(config.gridObjectIds.length)}`}
      >
        {config.gridObjectIds.map((objectId, index) => {
          const item = objectById(objectId)
          const isSelected = selected.has(index)

          return (
            <button
              key={`${objectId}-${index}`}
              type="button"
              aria-label={`${item.label}${isSelected ? ', selected' : ''}`}
              aria-pressed={isSelected}
              onClick={() => toggleCell(index)}
              className={[
                'relative flex min-h-[56px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 p-2.5 transition-colors duration-150 hover:border-primary/40 hover:bg-accent active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                isSelected
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-card',
              ].join(' ')}
            >
              <ObjectVisual item={item} compact showLabel={false} />
              {isSelected && (
                <Check
                  className="absolute right-1.5 top-1.5 size-4 text-primary"
                  aria-hidden="true"
                />
              )}
            </button>
          )
        })}
      </div>

      <Button
        size="lg"
        className="mx-auto mt-6 w-full max-w-sm text-lg"
        disabled={selected.size === 0}
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
