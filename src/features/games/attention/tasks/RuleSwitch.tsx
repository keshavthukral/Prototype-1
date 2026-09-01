/**
 * Rule Switch — Interactive task component.
 *
 * Shows a persistent rule (category + members) and presents items
 * one at a time.  The user answers Yes/No: does this item belong
 * to the active category?  Midway through, the rule switches to a
 * second category.  The active rule is always visible.
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { ArrowRightLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { RuleSwitchConfig } from '@/features/games/data/challenges'
import type { ChallengeMetric } from '@/features/games/metrics/types'
import type { DifficultyLevel } from '@/lib/games/adaptive-engine'
import { TelemetryTracker } from '@/features/games/engine/telemetry'
import { ObjectVisual } from '@/features/games/engine/ObjectVisual'
import { OBJECT_POOL } from '@/features/games/data/objects'
import {
  belongsToCategory,
  getCategoryMembers,
} from '@/features/games/data/rule-switch'
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

interface RuleSwitchProps {
  config: RuleSwitchConfig
  difficulty: DifficultyLevel
  onComplete: (metric: ChallengeMetric) => void
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

export function RuleSwitch({ config, difficulty, onComplete }: RuleSwitchProps) {
  const telemetryRef = useRef(new TelemetryTracker())
  const [currentIndex, setCurrentIndex] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [showSwitchNotice, setShowSwitchNotice] = useState(false)
  const [completedMetric, setCompletedMetric] =
    useState<ChallengeMetric | null>(null)
  const completedRef = useRef(false)
  const [skipDialogOpen, setSkipDialogOpen] = useState(false)

  const { initialRule, switchedRule, itemObjectIds } = config
  const totalItems = itemObjectIds.length
  const switchAt = switchedRule.switchAt

  // Start telemetry on mount
  useEffect(() => {
    telemetryRef.current.start(difficulty, 'rule-switch')
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
      challengeType: 'rule-switch',
      correct: false,
      responseTimeMs: record.completionTimeMs,
      timeToFirstInteractionMs: record.timeToFirstInteractionMs,
      hints: 0,
      skipped: true,
      changedAnswers: record.incorrectClicks,
      difficulty,
    })
  }, [config.id, difficulty])

  const isBeforeSwitch = currentIndex < switchAt
  const activeCategory = isBeforeSwitch
    ? initialRule.matchCategory
    : switchedRule.matchCategory

  const currentItem = itemObjectIds[currentIndex]
  const item = currentItem ? objectById(currentItem) : null

  const handleAnswer = useCallback(
    (answeredYes: boolean) => {
      if (completedRef.current || currentIndex >= totalItems) return

      const belongs = belongsToCategory(
        itemObjectIds[currentIndex]!,
        activeCategory,
      )
      const isCorrect = answeredYes === belongs

      telemetryRef.current.recordClick(isCorrect)

      const nextCorrect = isCorrect ? correctCount + 1 : correctCount
      const nextIndex = currentIndex + 1

      // Show rule-change notice briefly
      if (nextIndex === switchAt && !showSwitchNotice) {
        setShowSwitchNotice(true)
        // Auto-dismiss after 1.5s
        setTimeout(() => setShowSwitchNotice(false), 1500)
      }

      if (nextIndex >= totalItems) {
        // All items answered — compute result
        completedRef.current = true
        const accuracy = Math.round((nextCorrect / totalItems) * 100)
        const record = telemetryRef.current.complete(
          accuracy === 100,
          accuracy,
        )
        setCompletedMetric({
          challengeId: config.id,
          challengeType: 'rule-switch',
          correct: accuracy === 100,
          responseTimeMs: record.completionTimeMs,
          timeToFirstInteractionMs: record.timeToFirstInteractionMs,
          hints: 0,
          skipped: false,
          changedAnswers: record.incorrectClicks,
          difficulty,
        })
      }

      setCorrectCount(nextCorrect)
      setCurrentIndex(nextIndex)
    },
    [
      currentIndex,
      totalItems,
      activeCategory,
      itemObjectIds,
      correctCount,
      showSwitchNotice,
      switchAt,
      config.id,
      difficulty,
    ],
  )

  // Render while awaiting deferred onComplete
  if (completedMetric) {
    return null
  }

  const categoryMembers = getCategoryMembers(activeCategory)
  const memberLabels = categoryMembers
    .map((id) => objectById(id).label)
    .join(', ')

  return (
    <section className="flex flex-col items-center">
      {/* Task title */}
      <h1 className="mt-3 text-center text-2xl font-bold text-foreground">
        Rule Switch
      </h1>

      {/* Persistent rule display */}
      <div
        className={`mt-4 w-full max-w-md rounded-2xl border-2 px-5 py-4 transition-colors duration-300 ${
          showSwitchNotice
            ? 'border-primary bg-primary/5'
            : 'border-border bg-card'
        }`}
      >
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Current rule
          </p>
          {showSwitchNotice && (
            <span className="flex items-center gap-1 text-xs font-medium text-primary">
              <ArrowRightLeft className="size-3" aria-hidden="true" />
              Changed
            </span>
          )}
        </div>
        <p className="mt-1.5 text-lg font-bold text-foreground">
          {activeCategory}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Includes: {memberLabels}
        </p>
      </div>

      {/* Instruction */}
      <p className="mt-4 text-center text-base text-muted-foreground">
        Does this belong to the category?
      </p>

      {/* Progress */}
      <p className="mt-1 text-sm text-muted-foreground">
        {currentIndex + 1} of {totalItems}
      </p>

      {/* Current item */}
      {item && (
        <div className="mx-auto mt-5 flex min-h-[120px] w-full max-w-xs items-center justify-center rounded-2xl border border-border bg-card">
          <ObjectVisual item={item} />
        </div>
      )}

      {/* Yes / No buttons — consistent positions, not randomized */}
      <div className="mx-auto mt-6 grid w-full max-w-xs grid-cols-2 gap-4">
        <Button
          size="lg"
          variant="outline"
          className="min-h-16 text-xl font-bold"
          onClick={() => handleAnswer(true)}
        >
          Yes
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="min-h-16 text-xl font-bold"
          onClick={() => handleAnswer(false)}
        >
          No
        </Button>
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
