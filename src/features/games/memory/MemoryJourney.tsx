/**
 * Memory Journey — 5-round memory game.
 *
 * Round 1: Visual Object Recall — show objects, recall from options
 * Round 2: Spatial Memory — show objects on grid, recall positions
 * Round 3: Order Memory — show sequence, reconstruct order
 * Round 4: Personal Memory — show family photo, identify person
 * Round 5: Delayed Recall — recall items shown at session start
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Brain, Check, Heart, Lightbulb } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { GameShell } from '@/features/games/engine/GameShell'
import { GameIntro } from '@/features/games/engine/GameIntro'
import { RoundResult } from '@/features/games/engine/RoundResult'
import { FinalResult } from '@/features/games/engine/FinalResult'
import { ViewTimer } from '@/features/games/engine/ViewTimer'
import { ObjectVisual } from '@/features/games/engine/ObjectVisual'
import { useCountdown } from '@/features/games/engine/useCountdown'
import { MemoryMetricsCollector } from '@/features/games/metrics/collector'
import type {
  MemoryRoundMetric,
  ObjectRecallMetric,
  SpatialMemoryMetric,
  OrderMemoryMetric,
  PersonalMemoryMetric,
} from '@/features/games/metrics/types'
import {
  OBJECT_POOL,
  buildMemoryRound,
} from '@/features/games/data/objects'
import {
  getPersonalMemoryCards,
  buildPersonalQuestion,
} from '@/features/games/data/personal-memories'
import type { GameChoice, GameMode, MemoryRoundConfig } from '@/features/games/types'
import {
  computeNextDifficulty,
  type DifficultyLevel,
} from '@/lib/games/adaptive-engine'
import {
  getRecentSessions,
  saveGameSession,
  saveRichGameMetrics,
} from '@/lib/repositories/game-session'
import { useAuth } from '@/lib/supabase/auth-context'
import { useLanguage } from '@/lib/i18n/language-context'

// ─── Constants ──────────────────────────────────────────────────

const TOTAL_ROUNDS = 5

type RoundType = 'visual-recall' | 'spatial' | 'order' | 'personal' | 'delayed'
const ROUND_TYPES: RoundType[] = [
  'visual-recall',
  'spatial',
  'order',
  'personal',
  'delayed',
]

type Phase =
  | 'intro'
  | 'delayed-preview'
  | 'memorise'
  | 'task'
  | 'round-result'
  | 'final-result'

// ─── Helpers ────────────────────────────────────────────────────

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

function viewSeconds(d: DifficultyLevel): number {
  return d === 1 ? 8 : d === 2 ? 7 : 5
}

function gridCols(count: number): string {
  if (count <= 4) return 'grid-cols-2'
  if (count <= 6) return 'grid-cols-3'
  return 'grid-cols-4'
}

// ─── Main Component ─────────────────────────────────────────────

export function MemoryJourney() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useLanguage()
  const [searchParams] = useSearchParams()
  const mode: GameMode =
    searchParams.get('mode') === 'daily' ? 'daily' : 'practice'

  // ── State ──
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(1)
  const [ready, setReady] = useState(false)
  const [phase, setPhase] = useState<Phase>('intro')
  const [round, setRound] = useState(0)
  const [showHeader, setShowHeader] = useState(false)

  // Round configs
  const [config, setConfig] = useState<MemoryRoundConfig | null>(null)
  const [delayedObjects, setDelayedObjects] = useState<GameChoice[]>([])
  const [locationObjects, setLocationObjects] = useState<GameChoice[]>([])
  const [locationTarget, setLocationTarget] = useState<GameChoice | null>(null)

  // Selection state
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [ordered, setOrdered] = useState<GameChoice[]>([])

  // Tracking
  const [hints, setHints] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [changes, setChanges] = useState(0)
  const [incorrectAttempts, setIncorrectAttempts] = useState(0)
  const [lastSummary, setLastSummary] = useState('')
  const [lastSubtitle, setLastSubtitle] = useState('')

  // Personal memory
  const [personalQuestion, setPersonalQuestion] = useState<{
    card: { id: string; name: string; relationship: string; imageUrl: string; description: string }
    options: string[]
    correctAnswer: string
  } | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)

  // Overall results
  const [totalCorrect, setTotalCorrect] = useState(0)
  const [totalPossible, setTotalPossible] = useState(0)

  // Session
  const [metrics, setMetrics] = useState<MemoryRoundMetric[]>([])
  const collectorRef = useRef(new MemoryMetricsCollector())

  // Refs
  const taskStartedAt = useRef(0)
  const firstInteractionAt = useRef<number | null>(null)

  // Countdown
  const countdown = useCountdown()

  // ── Load difficulty ──
  useEffect(() => {
    void (async () => {
      if (user?.id) {
        const recent = await getRecentSessions(user.id, 'memory', 5)
        if (recent.length) {
          setDifficulty(
            computeNextDifficulty(
              recent[0]?.difficulty ?? 1,
              recent,
            ).newDifficulty,
          )
        }
      }
      setReady(true)
    })()
  }, [user?.id])

  // ── Helpers ──
  const noteInteraction = () => {
    if (firstInteractionAt.current === null)
      firstInteractionAt.current = performance.now()
  }

  const beginTask = useCallback(() => {
    setPhase('task')
    taskStartedAt.current = performance.now()
    firstInteractionAt.current = null
  }, [])

  // ── Session Start ──
  const startSession = () => {
    // Pick 3 delayed objects (quietly introduced)
    const delayed = shuffle(OBJECT_POOL).slice(0, 3)
    setDelayedObjects(delayed)
    collectorRef.current.reset()
    setMetrics([])
    setTotalCorrect(0)
    setTotalPossible(0)

    // Show delayed preview first
    setPhase('delayed-preview')
    countdown.start(viewSeconds(difficulty), () => {
      // Move to first round (visual-recall)
      prepareRound(0, delayed)
    })
  }

  // ── Prepare Round ──
  const prepareRound = useCallback(
    (index: number, delayed: GameChoice[]) => {
      setRound(index)
      setSelected(new Set())
      setOrdered([])
      setHints(0)
      setShowHint(false)
      setChanges(0)
      setIncorrectAttempts(0)
      setSelectedAnswer(null)
      setPersonalQuestion(null)
      setShowHeader(true)

      const type = ROUND_TYPES[index]

      switch (type) {
        case 'visual-recall': {
          const roundConfig = buildMemoryRound(difficulty)
          setConfig(roundConfig)
          setPhase('memorise')
          countdown.start(viewSeconds(difficulty), beginTask)
          break
        }

        case 'spatial': {
          const count = difficulty === 1 ? 4 : difficulty === 2 ? 6 : 8
          const key = OBJECT_POOL.find((item) => item.id === 'key')!
          const others = shuffle(
            OBJECT_POOL.filter((item) => item.id !== 'key'),
          ).slice(0, count - 1)
          const locations = shuffle([key, ...others])
          setLocationObjects(locations)
          setLocationTarget(key)
          setConfig({ targets: locations, distractors: [], options: locations })
          setPhase('memorise')
          countdown.start(viewSeconds(difficulty), beginTask)
          break
        }

        case 'order': {
          const count = difficulty + 2
          const targets = shuffle(OBJECT_POOL).slice(0, count)
          setConfig({ targets, distractors: [], options: shuffle(targets) })
          setPhase('memorise')
          countdown.start(viewSeconds(difficulty), beginTask)
          break
        }

        case 'personal': {
          const cards = getPersonalMemoryCards()
          if (cards.length > 0) {
            const card = cards[Math.floor(Math.random() * cards.length)]
            if (card) {
              const question = buildPersonalQuestion(card)
              setPersonalQuestion(question)
            }
          }
          // Personal memory doesn't need memorise phase — show directly
          beginTask()
          break
        }

        case 'delayed': {
          const options = shuffle([
            ...delayed,
            ...shuffle(
              OBJECT_POOL.filter(
                (item) => !delayed.some((d) => d.id === item.id),
              ),
            ).slice(0, difficulty + 1),
          ])
          setConfig({
            targets: delayed,
            distractors: [],
            options,
          })
          beginTask()
          break
        }
      }
    },
    [beginTask, countdown, difficulty],
  )

  const prepareRoundWithDelayed = useCallback(
    (index: number) => {
      prepareRound(index, delayedObjects)
    },
    [prepareRound, delayedObjects],
  )

  // ── Selection handlers ──
  const toggleSelected = (id: string) => {
    noteInteraction()
    setChanges((v) => v + 1)
    setSelected((current) => {
      const next = new Set(current)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const addToOrder = (item: GameChoice) => {
    noteInteraction()
    if (ordered.some((v) => v.id === item.id)) return
    setChanges((v) => v + 1)
    setOrdered((current) => [...current, item])
  }

  const removeFromOrder = (id: string) => {
    noteInteraction()
    setChanges((v) => v + 1)
    setOrdered((current) => current.filter((item) => item.id !== id))
  }

  const useHint = () => {
    setHints((v) => v + 1)
    setShowHint(true)
  }

  // ── Round Completion ──
  const finishRound = (
    metric: MemoryRoundMetric,
    summary: string,
    subtitle: string,
    correct: number,
    possible: number,
  ) => {
    collectorRef.current.addRound(metric)
    setMetrics((current) => [...current, metric])
    setTotalCorrect((v) => v + correct)
    setTotalPossible((v) => v + possible)
    setLastSummary(summary)
    setLastSubtitle(subtitle)
    setPhase('round-result')
  }

  // ── Submit Visual Object Recall ──
  const submitObjectLike = () => {
    if (!config) return
    const targetIds = new Set(config.targets.map((item) => item.id))
    const correct = [...selected].filter((id) => targetIds.has(id)).length
    const falseSelections = [...selected].filter((id) => !targetIds.has(id))
      .length
    const missed = config.targets.length - correct
    const responseTimeMs = performance.now() - taskStartedAt.current
    const accuracy =
      config.targets.length > 0
        ? Math.max(0, correct - falseSelections) / config.targets.length * 100
        : 0

    const metric: ObjectRecallMetric = {
      round: round + 1,
      roundType: 'object-recall',
      correctTargets: correct,
      missedTargets: missed,
      incorrectSelections: falseSelections,
      totalTargets: config.targets.length,
      responseTimeMs,
      timeToFirstInteractionMs: firstInteractionAt.current
        ? firstInteractionAt.current - taskStartedAt.current
        : responseTimeMs,
      hints,
      accuracy,
      skipped: false,
      selectionChanges: changes,
      hesitationDurationMs: firstInteractionAt.current
        ? firstInteractionAt.current - taskStartedAt.current
        : 0,
    }

    finishRound(
      metric,
      `${correct} of ${config.targets.length} remembered`,
      '',
      Math.max(0, correct - falseSelections),
      config.targets.length,
    )
  }

  // ── Submit Order ──
  const submitOrder = () => {
    if (!config) return
    const correctPositions = config.targets.filter(
      (item, index) => ordered[index]?.id === item.id,
    ).length
    const responseTimeMs = performance.now() - taskStartedAt.current
    const accuracy =
      config.targets.length > 0
        ? (correctPositions / config.targets.length) * 100
        : 0

    const metric: OrderMemoryMetric = {
      round: round + 1,
      roundType: 'order-memory',
      correctPositions,
      totalPositions: config.targets.length,
      orderingErrors: config.targets.length - correctPositions,
      responseTimeMs,
      timeToFirstInteractionMs: firstInteractionAt.current
        ? firstInteractionAt.current - taskStartedAt.current
        : responseTimeMs,
      hints,
      accuracy,
      skipped: false,
      selectionChanges: changes,
      hesitationDurationMs: firstInteractionAt.current
        ? firstInteractionAt.current - taskStartedAt.current
        : 0,
    }

    finishRound(
      metric,
      `${correctPositions} of ${config.targets.length} positions correct`,
      '',
      correctPositions,
      config.targets.length,
    )
  }

  // ── Choose Location ──
  const chooseLocation = (index: number) => {
    noteInteraction()
    setChanges((v) => v + 1)

    if (locationObjects[index]?.id !== locationTarget?.id) {
      setIncorrectAttempts((v) => v + 1)
      return
    }

    const responseTimeMs = performance.now() - taskStartedAt.current
    const metric: SpatialMemoryMetric = {
      round: round + 1,
      roundType: 'spatial-memory',
      correctLocations: 1,
      totalLocations: 1,
      spatialErrors: incorrectAttempts,
      locationQuestions: [
        {
          targetId: locationTarget?.id ?? '',
          correct: true,
          responseTimeMs,
        },
      ],
      responseTimeMs,
      timeToFirstInteractionMs: firstInteractionAt.current
        ? firstInteractionAt.current - taskStartedAt.current
        : responseTimeMs,
      hints,
      accuracy: 100,
      skipped: false,
      selectionChanges: changes,
      hesitationDurationMs: firstInteractionAt.current
        ? firstInteractionAt.current - taskStartedAt.current
        : 0,
    }

    finishRound(metric, 'You found the right place', '', 1, 1)
  }

  // ── Submit Personal Memory ──
  const submitPersonal = () => {
    if (!personalQuestion) return
    const isCorrect = selectedAnswer === personalQuestion.correctAnswer
    const responseTimeMs = performance.now() - taskStartedAt.current

    const metric: PersonalMemoryMetric = {
      round: round + 1,
      roundType: 'personal-memory',
      correct: isCorrect,
      targetName: personalQuestion.card.name,
      distractorsShown: personalQuestion.options.filter(
        (o) => o !== personalQuestion.correctAnswer,
      ),
      responseTimeMs,
      timeToFirstInteractionMs: firstInteractionAt.current
        ? firstInteractionAt.current - taskStartedAt.current
        : responseTimeMs,
      hints,
      accuracy: isCorrect ? 100 : 0,
      skipped: false,
      selectionChanges: changes,
      hesitationDurationMs: firstInteractionAt.current
        ? firstInteractionAt.current - taskStartedAt.current
        : 0,
    }

    finishRound(
      metric,
      isCorrect ? 'That is right!' : 'Nice try',
      isCorrect
        ? ''
        : `The answer is ${personalQuestion.correctAnswer}.`,
      isCorrect ? 1 : 0,
      1,
    )
  }

  // ── Next Round ──
  const nextRound = () => {
    if (round + 1 >= TOTAL_ROUNDS) {
      persistAndFinish()
    } else {
      prepareRoundWithDelayed(round + 1)
    }
  }

  // ── Persist & Finish ──
  const persistAndFinish = () => {
    const sessionMetrics = collectorRef.current.getSessionMetrics({
      mode,
      difficulty,
      completed: true,
    })

    const avgResponse = sessionMetrics.averageResponseTimeMs

    if (user?.id) {
      void Promise.allSettled([
        saveGameSession({
          patientId: user.id,
          gameType: 'memory',
          difficultyLevel: difficulty,
          correctCount: totalCorrect,
          totalCount: totalPossible,
          responseTimeMs: avgResponse,
          hintsUsed: metrics.reduce((sum, m) => sum + m.hints, 0),
        }),
        saveRichGameMetrics({
          patientId: user.id,
          gameType: 'memory',
          metrics: sessionMetrics as unknown as Record<string, unknown>,
        }),
      ]).then((results) => {
        if (results.some((r) => r.status === 'rejected'))
          toast.info(t('details_save_later'))
      })
    }

    setPhase('final-result')
  }

  // ── Computed ──
  const accuracy =
    totalPossible > 0 ? Math.round((totalCorrect / totalPossible) * 100) : 0

  const encouragingMessage =
    accuracy >= 80
      ? 'Wonderful work! You remembered a lot.'
      : accuracy >= 50
        ? 'Well done! Keep it up.'
        : 'Every effort counts. You are doing great.'

  const goBack = () =>
    phase === 'intro'
      ? navigate(mode === 'daily' ? '/patient' : '/patient/games')
      : undefined // handled by exit dialog

  // ── Loading ──
  if (!ready) {
    return (
      <div className="patient-ui flex min-h-screen items-center justify-center bg-background">
        <p className="text-xl text-muted-foreground">{t('loading_activity')}</p>
      </div>
    )
  }

  // ── Render ──
  return (
    <GameShell
      totalSteps={TOTAL_ROUNDS}
      currentStep={round}
      showHeader={showHeader}
      celebrate={phase === 'final-result' && accuracy >= 50}
      onBack={() => navigate(mode === 'daily' ? '/patient' : '/patient/games')}
    >
      {/* ── INTRO ── */}
      {phase === 'intro' && (
        <GameIntro
          icon={Brain}
          title="Memory Journey"
          description="Five gentle activities to help you remember."
          backLabel={mode === 'daily' ? t('home') : t('activities')}
          onBack={goBack}
          onStart={startSession}
        />
      )}

      {/* ── DELAYED PREVIEW ── */}
      {phase === 'delayed-preview' && (
        <div className="flex flex-1 flex-col items-center justify-center">
          <ViewTimer
            seconds={countdown.secondsLeft}
            title={t('remember_later')}
            subtitle={t('see_again_later')}
          />
          <div
            className={`mx-auto mt-8 grid w-full max-w-2xl gap-4 ${gridCols(delayedObjects.length)}`}
          >
            {delayedObjects.map((item) => (
              <div
                key={item.id}
                className="flex min-h-28 flex-col items-center justify-center rounded-xl border border-border bg-card p-4 text-primary"
              >
                <ObjectVisual item={item} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MEMORISE PHASE ── */}
      {phase === 'memorise' && config && (
        <div className="flex flex-1 flex-col items-center justify-center">
          <ViewTimer
            seconds={countdown.secondsLeft}
            title={
              ROUND_TYPES[round] === 'order'
                ? t('remember_order')
                : ROUND_TYPES[round] === 'spatial'
                  ? t('remember_locations')
                  : t('remember_objects')
            }
            subtitle={t('take_time')}
          />
          <div
            className={`mx-auto mt-8 grid w-full max-w-2xl gap-4 ${
              ROUND_TYPES[round] === 'spatial'
                ? gridCols(
                    (ROUND_TYPES[round] === 'spatial'
                      ? locationObjects
                      : config.targets
                    ).length,
                  )
                : 'grid-cols-2 sm:grid-cols-3'
            }`}
          >
            {(ROUND_TYPES[round] === 'spatial'
              ? locationObjects
              : config.targets
            ).map((item) => (
              <div
                key={item.id}
                className="flex min-h-32 flex-col items-center justify-center rounded-xl border border-border bg-card p-4 text-primary"
              >
                <ObjectVisual item={item} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TASK: Visual Object Recall (Round 1) ── */}
      {phase === 'task' &&
        ROUND_TYPES[round] === 'visual-recall' &&
        config && (
          <ObjectRecallTask
            title={t('just_seen')}
            config={config}
            selected={selected}
            onToggle={toggleSelected}
            hints={hints}
            showHint={showHint}
            onHint={useHint}
            onSubmit={submitObjectLike}
          />
        )}

      {/* ── TASK: Spatial Memory (Round 2) ── */}
      {phase === 'task' && ROUND_TYPES[round] === 'spatial' && (
        <SpatialTask
          count={locationObjects.length}
          target={locationTarget}
          attempts={incorrectAttempts}
          onChoose={chooseLocation}
        />
      )}

      {/* ── TASK: Order Memory (Round 3) ── */}
      {phase === 'task' &&
        ROUND_TYPES[round] === 'order' &&
        config && (
          <OrderTask
            config={config}
            ordered={ordered}
            onAdd={addToOrder}
            onRemove={removeFromOrder}
            onSubmit={submitOrder}
          />
        )}

      {/* ── TASK: Personal Memory (Round 4) ── */}
      {phase === 'task' && ROUND_TYPES[round] === 'personal' && (
        <PersonalMemoryTask
          question={personalQuestion}
          selectedAnswer={selectedAnswer}
          onSelect={(answer) => {
            noteInteraction()
            setSelectedAnswer(answer)
            setChanges((v) => v + 1)
          }}
          onSubmit={submitPersonal}
        />
      )}

      {/* ── TASK: Delayed Recall (Round 5) ── */}
      {phase === 'task' &&
        ROUND_TYPES[round] === 'delayed' &&
        config && (
          <ObjectRecallTask
            title={t('seen_earlier')}
            config={config}
            selected={selected}
            onToggle={toggleSelected}
            hints={hints}
            showHint={showHint}
            onHint={useHint}
            onSubmit={submitObjectLike}
          />
        )}

      {/* ── ROUND RESULT ── */}
      {phase === 'round-result' && (
        <RoundResult
          message={lastSummary}
          subtitle={lastSubtitle || undefined}
          isLast={round + 1 >= TOTAL_ROUNDS}
          onNext={nextRound}
        />
      )}

      {/* ── FINAL RESULT ── */}
      {phase === 'final-result' && (
        <FinalResult
          title="Memory Journey"
          roundsCompleted={metrics.length}
          totalRounds={TOTAL_ROUNDS}
          accuracy={accuracy}
          message={encouragingMessage}
          onContinue={
            mode === 'daily'
              ? () =>
                  navigate(
                    '/patient/game/pattern?mode=daily',
                  )
              : undefined
          }
          onActivities={
            mode === 'practice'
              ? () => navigate('/patient/games')
              : undefined
          }
          onAgain={() => {
            setPhase('intro')
            setShowHeader(false)
          }}
          continueLabel={t('continue_pattern')}
        />
      )}
    </GameShell>
  )
}

// ─── Sub-tasks ──────────────────────────────────────────────────

function ObjectRecallTask({
  title,
  config,
  selected,
  onToggle,
  hints,
  showHint,
  onHint,
  onSubmit,
}: {
  title: string
  config: MemoryRoundConfig
  selected: Set<string>
  onToggle: (id: string) => void
  hints: number
  showHint: boolean
  onHint: () => void
  onSubmit: () => void
}) {
  const { t } = useLanguage()

  return (
    <section className="flex flex-1 flex-col">
      <h1 className="mt-4 text-center text-3xl font-bold text-foreground">
        {title}
      </h1>

      {showHint && (
        <p className="mx-auto mt-4 rounded-xl bg-primary/10 px-5 py-3 text-lg font-medium text-primary">
          {t('memory_hint')}
        </p>
      )}

      <div className="mx-auto mt-8 grid w-full max-w-2xl grid-cols-2 gap-4 sm:grid-cols-3">
        {config.options.map((item) => {
          const chosen = selected.has(item.id)
          return (
            <button
              key={item.id}
              onClick={() => onToggle(item.id)}
              aria-pressed={chosen}
              className="relative flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-border bg-card p-4 text-primary transition-colors duration-150 hover:border-primary/40 hover:bg-accent active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-pressed:border-primary aria-pressed:bg-primary/10"
            >
              <ObjectVisual item={item} />
              {chosen && (
                <Check
                  className="absolute right-3 top-3 size-6 text-primary"
                  aria-label={t('selected')}
                />
              )}
            </button>
          )
        })}
      </div>

      <div className="mx-auto mt-auto flex w-full max-w-2xl flex-col gap-3 pt-7 sm:flex-row">
        <Button
          variant="outline"
          size="lg"
          className="flex-1 text-lg"
          onClick={onHint}
          disabled={showHint}
        >
          <Lightbulb data-icon="inline-start" />
          {t('hint')} {hints > 0 ? `(${hints})` : ''}
        </Button>
        <Button
          size="lg"
          className="flex-1 text-lg"
          onClick={onSubmit}
          disabled={selected.size === 0}
        >
          {t('submit_answer')}
        </Button>
      </div>
    </section>
  )
}

function SpatialTask({
  count,
  target,
  attempts,
  onChoose,
}: {
  count: number
  target: GameChoice | null
  attempts: number
  onChoose: (index: number) => void
}) {
  const { t } = useLanguage()

  return (
    <section className="flex flex-1 flex-col items-center">
      <h1 className="mt-5 text-center text-3xl font-bold text-foreground">
        {t('where_was').replace(
          '{object}',
          target?.label.toLowerCase() ?? '',
        )}
      </h1>
      <p className="mt-2 text-lg text-muted-foreground">
        {t('choose_place')}
      </p>

      {attempts > 0 && (
        <p
          role="status"
          className="mt-4 rounded-xl bg-secondary px-5 py-3 text-lg text-foreground"
        >
          {t('try_another_place')}
        </p>
      )}

      <div
        className={`mt-8 grid w-full max-w-2xl gap-4 ${gridCols(count)}`}
      >
        {Array.from({ length: count }, (_, index) => (
          <button
            key={index}
            onClick={() => onChoose(index)}
            className="flex aspect-square cursor-pointer items-center justify-center rounded-xl border-2 border-border bg-card text-2xl font-bold text-muted-foreground transition-colors duration-150 hover:border-primary/50 hover:bg-primary/10 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            aria-label={t('position').replace('{number}', String(index + 1))}
          >
            {index + 1}
          </button>
        ))}
      </div>
    </section>
  )
}

function OrderTask({
  config,
  ordered,
  onAdd,
  onRemove,
  onSubmit,
}: {
  config: MemoryRoundConfig
  ordered: GameChoice[]
  onAdd: (item: GameChoice) => void
  onRemove: (id: string) => void
  onSubmit: () => void
}) {
  const { t } = useLanguage()

  return (
    <section className="flex flex-1 flex-col">
      <h1 className="mt-4 text-center text-3xl font-bold text-foreground">
        {t('order_instruction')}
      </h1>
      <p className="mt-2 text-center text-lg text-muted-foreground">
        {t('order_help')}
      </p>

      <div className="mx-auto mt-7 flex w-full max-w-3xl flex-wrap justify-center gap-3">
        {config.options.map((item) => (
          <button
            key={item.id}
            onClick={() => onAdd(item)}
            disabled={ordered.some((v) => v.id === item.id)}
            className="flex min-h-24 min-w-28 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-border bg-card p-3 text-primary transition-colors duration-150 hover:border-primary/40 hover:bg-accent active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
          >
            <ObjectVisual item={item} compact />
          </button>
        ))}
      </div>

      <ol className="mx-auto mt-8 grid w-full max-w-3xl gap-3 sm:grid-cols-2">
        {Array.from({ length: config.targets.length }, (_, index) => {
          const item = ordered[index]
          return (
            <li key={index} className="min-h-20">
              <button
                disabled={!item}
                onClick={() => item && onRemove(item.id)}
                className="flex min-h-20 w-full cursor-pointer items-center gap-4 rounded-xl border-2 border-dashed border-border bg-card px-5 text-left text-primary transition-colors duration-150 hover:border-primary/40 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
              >
                <span className="text-xl font-bold text-muted-foreground">
                  {index + 1}
                </span>
                {item ? (
                  <ObjectVisual item={item} compact />
                ) : (
                  <span className="text-lg text-muted-foreground">
                    {t('choose_object')}
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ol>

      <Button
        size="lg"
        className="mx-auto mt-auto w-full max-w-sm text-lg"
        disabled={ordered.length !== config.targets.length}
        onClick={onSubmit}
      >
        {t('check_order')}
      </Button>
    </section>
  )
}

function PersonalMemoryTask({
  question,
  selectedAnswer,
  onSelect,
  onSubmit,
}: {
  question: {
    card: { id: string; name: string; relationship: string; imageUrl: string; description: string }
    options: string[]
    correctAnswer: string
  } | null
  selectedAnswer: string | null
  onSelect: (answer: string) => void
  onSubmit: () => void
}) {
  const { t } = useLanguage()

  if (!question) {
    // Fallback: show generic object recall
    return (
      <section className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="flex size-20 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Heart className="size-10" />
        </div>
        <h1 className="mt-6 text-3xl font-bold text-foreground">
          Personal memories are being prepared.
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          This round will be available soon.
        </p>
        <Button size="lg" className="mt-9 min-h-16 w-full max-w-sm text-xl" onClick={onSubmit}>
          {t('next_round')}
        </Button>
      </section>
    )
  }

  return (
    <section className="flex flex-1 flex-col items-center">
      <h1 className="mt-5 text-center text-3xl font-bold text-foreground">
        Who is this?
      </h1>
      <p className="mt-2 text-lg text-muted-foreground">
        {question.card.description}
      </p>

      <div className="mt-8 flex size-40 items-center justify-center overflow-hidden rounded-2xl border-2 border-border bg-card">
        <img
          src={question.card.imageUrl}
          alt={question.card.name}
          className="size-full object-cover"
        />
      </div>

      <div className="mx-auto mt-8 grid w-full max-w-md grid-cols-1 gap-3">
        {question.options.map((option) => {
          const chosen = selectedAnswer === option
          return (
            <button
              key={option}
              onClick={() => onSelect(option)}
              aria-pressed={chosen}
              className={`flex min-h-16 cursor-pointer items-center justify-center rounded-xl border-2 px-6 text-lg font-semibold transition-colors duration-150 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                chosen
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-card text-foreground hover:border-primary/40 hover:bg-accent'
              }`}
            >
              {option}
              {chosen && (
                <Check className="ml-3 size-5 text-primary" />
              )}
            </button>
          )
        })}
      </div>

      <Button
        size="lg"
        className="mx-auto mt-auto w-full max-w-sm text-lg"
        disabled={selectedAnswer === null}
        onClick={onSubmit}
      >
        {t('submit_answer')}
      </Button>
    </section>
  )
}
