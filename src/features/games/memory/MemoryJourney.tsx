/**
 * Memory Journey — 5-round memory game.
 *
 * Round 1: Visual Object Recall — show objects, recall from options
 * Round 2: Spatial Memory — show objects on grid, recall positions (2-3 questions)
 * Round 3: Sequence Memory — show sequence, reconstruct order
 * Round 4: Personal Memory — show family photo, identify person
 * Round 5: Delayed Recall — recall items shown at session start
 *
 * Internal scoring uses the scoring engine — never shown to the patient.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Brain, Check, Heart, Search, Grid3X3, ArrowUpDown, Image, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { GameShell } from '@/features/games/engine/GameShell'
import { GameIntro } from '@/features/games/engine/GameIntro'
import { RoundResult } from '@/features/games/engine/RoundResult'
import { FinalResult } from '@/features/games/engine/FinalResult'
import { ViewTimer } from '@/features/games/engine/ViewTimer'
import { ObjectVisual } from '@/features/games/engine/ObjectVisual'
import { TelemetryTracker } from '@/features/games/engine/telemetry'
import {
  scoreObjectRecall,
  scoreSequence,
  scoreDelayedRecall,
} from '@/features/games/engine/scoring'
import { MemoryMetricsCollector } from '@/features/games/metrics/collector'
import type {
  MemoryRoundMetric,
  ObjectRecallMetric,
  SpatialMemoryMetric,
  OrderMemoryMetric,
  PersonalMemoryMetric,
  DelayedRecallMetric,
} from '@/features/games/metrics/types'
import {
  OBJECT_POOL,
  spatialGridSize,
  sequenceLength,
  viewSeconds as getViewSeconds,
  spatialQuestions,
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

/** Human-readable label for each round type */
const ROUND_LABELS: Record<RoundType, string> = {
  'visual-recall': 'Visual Object Recall',
  'spatial': 'Spatial Memory',
  'order': 'Sequence Memory',
  'personal': 'Personal Memory',
  'delayed': 'Delayed Recall',
}

/** Icon for the intro preview per round */
const ROUND_PREVIEW_ICONS: Record<RoundType, typeof Brain> = {
  'visual-recall': Search,
  'spatial': Grid3X3,
  'order': ArrowUpDown,
  'personal': Image,
  'delayed': Clock,
}

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

function gridCols(count: number): string {
  if (count <= 4) return 'grid-cols-2'
  if (count <= 6) return 'grid-cols-3'
  return 'grid-cols-4'
}

// ─── Spatial State ──────────────────────────────────────────────

interface SpatialState {
  grid: GameChoice[]
  questions: GameChoice[]
  currentQuestionIndex: number
  correctCount: number
  incorrectAttempts: number
  firstChoiceCorrect: boolean
  questionResults: Array<{ targetId: string; correct: boolean; responseTimeMs: number }>
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

  // Spatial state (supports multiple questions)
  const [spatial, setSpatial] = useState<SpatialState | null>(null)

  // Selection state
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [ordered, setOrdered] = useState<GameChoice[]>([])

  // Tracking
  const [hints, setHints] = useState(0)
  const [changes, setChanges] = useState(0)
  const [lastSummary, setLastSummary] = useState('')
  const [lastSubtitle, setLastSubtitle] = useState('')
  const [lastCorrect, setLastCorrect] = useState<number | undefined>()
  const [lastTotal, setLastTotal] = useState<number | undefined>()

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
  const telemetryRef = useRef(new TelemetryTracker())

  // Refs
  const usedIdsRef = useRef(new Set<string>())
  const taskStartedAt = useRef(0)
  const countdownRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [viewTimeLeft, setViewTimeLeft] = useState(0)

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

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (countdownRef.current) clearTimeout(countdownRef.current)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  // ── Timer helpers ──
  const startCountdown = useCallback((seconds: number, onComplete: () => void) => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (countdownRef.current) clearTimeout(countdownRef.current)
    setViewTimeLeft(seconds)
    let remaining = seconds
    intervalRef.current = setInterval(() => {
      remaining -= 1
      setViewTimeLeft(remaining)
      if (remaining <= 0 && intervalRef.current) clearInterval(intervalRef.current)
    }, 1000)
    countdownRef.current = setTimeout(() => {
      onComplete()
      countdownRef.current = null
    }, seconds * 1000)
  }, [])

  const beginTask = useCallback(() => {
    setPhase('task')
    taskStartedAt.current = performance.now()
  }, [])

  // ── Session Start ──
  const startSession = () => {
    usedIdsRef.current = new Set()
    const targetCount = difficulty === 1 ? 3 : difficulty === 2 ? 4 : difficulty === 3 ? 5 : 6
    const delayed = shuffle(OBJECT_POOL).slice(0, targetCount)
    delayed.forEach((d) => usedIdsRef.current.add(d.id))
    setDelayedObjects(delayed)
    collectorRef.current.reset()
    setMetrics([])
    setTotalCorrect(0)
    setTotalPossible(0)
    setRound(0)
    setSelected(new Set())
    setOrdered([])
    setHints(0)
    setChanges(0)
    setSelectedAnswer(null)
    setPersonalQuestion(null)
    setSpatial(null)
    setShowHeader(true)

    // Show delayed objects first so user can memorise them
    setConfig({ targets: delayed, distractors: [], options: delayed })
    setPhase('delayed-preview')
    startCountdown(getViewSeconds(difficulty), () => {
      // After preview, begin Round 1
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
      setChanges(0)
      setSelectedAnswer(null)
      setPersonalQuestion(null)
      setSpatial(null)
      setShowHeader(true)

      const type = ROUND_TYPES[index]

      switch (type) {
        case 'visual-recall': {
          // Use the initial targets directly — no new memorization.
          // The user already encoded these during the initial encoding screen.
          const excludeIds = delayed.map((d) => d.id)
          const distractorPool = OBJECT_POOL.filter(
            (o) => !excludeIds.includes(o.id) && !usedIdsRef.current.has(o.id),
          )
          const distCount = difficulty === 1 ? 2 : difficulty === 2 ? 3 : difficulty === 3 ? 4 : 5
          const distractors = shuffle(distractorPool).slice(0, distCount)
          distractors.forEach((d) => usedIdsRef.current.add(d.id))

          const options = shuffle([...delayed, ...distractors])
          setConfig({ targets: delayed, distractors, options })

          // Go directly to task — no memorise phase needed.
          beginTask()
          break
        }

        case 'spatial': {
          const count = spatialGridSize(difficulty)
          const qCount = spatialQuestions(difficulty)
          const available = OBJECT_POOL.filter((o) => !usedIdsRef.current.has(o.id))
          const shuffledPool = shuffle(available)
          const gridItems = shuffledPool.slice(0, count)
          gridItems.forEach((g) => usedIdsRef.current.add(g.id))
          const questions = shuffle([...gridItems]).slice(0, qCount)
          setSpatial({
            grid: gridItems,
            questions,
            currentQuestionIndex: 0,
            correctCount: 0,
            incorrectAttempts: 0,
            firstChoiceCorrect: false,
            questionResults: [],
          })
          setPhase('memorise')
          startCountdown(getViewSeconds(difficulty), beginTask)
          break
        }

        case 'order': {
          const count = sequenceLength(difficulty)
          const available = OBJECT_POOL.filter((o) => !usedIdsRef.current.has(o.id))
          const targets = shuffle(available).slice(0, count)
          targets.forEach((t) => usedIdsRef.current.add(t.id))
          setConfig({ targets, distractors: [], options: shuffle(targets) })
          setPhase('memorise')
          startCountdown(getViewSeconds(difficulty), beginTask)
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
          beginTask()
          break
        }

        case 'delayed': {
          // Delayed recall — no memorise phase. The user already saw these
          // objects at session start. Go straight to recognition task.
          const distractorPool = shuffle(
            OBJECT_POOL.filter(
              (item) => !delayed.some((d) => d.id === item.id) && !usedIdsRef.current.has(item.id),
            ),
          ).slice(0, difficulty + 1)
          const recognitionOptions = shuffle([
            ...delayed,
            ...distractorPool,
          ])
          setConfig({ targets: delayed, distractors: distractorPool, options: recognitionOptions })
          beginTask()
          break
        }
      }  }, [beginTask, difficulty, startCountdown],
  )

  // ── Selection handlers ──
  const toggleSelected = (id: string) => {
    telemetryRef.current.recordChange()
    setChanges((v) => v + 1)
    setSelected((current) => {
      const next = new Set(current)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const addToOrder = (item: GameChoice) => {
    telemetryRef.current.recordInteraction()
    if (ordered.some((v) => v.id === item.id)) return
    setChanges((v) => v + 1)
    setOrdered((current) => [...current, item])
  }

  const removeFromOrder = (id: string) => {
    telemetryRef.current.recordChange()
    setChanges((v) => v + 1)
    setOrdered((current) => current.filter((item) => item.id !== id))
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
    setLastCorrect(correct)
    setLastTotal(possible)
    setPhase('round-result')
  }

  // ── Submit Visual Object Recall (uses scoring engine) ──
  const submitObjectLike = () => {
    if (!config) return
    const score = scoreObjectRecall({
      targetIds: new Set(config.targets.map((item) => item.id)),
      selectedIds: [...selected],
      totalTargets: config.targets.length,
    })

    const metric: ObjectRecallMetric = {
      round: round + 1,
      roundType: 'object-recall',
      correctTargets: score.targetsSelectedCorrectly,
      missedTargets: score.missedTargets,
      incorrectSelections: score.falseSelections,
      totalTargets: score.targetsShown,
      responseTimeMs: performance.now() - taskStartedAt.current,
      timeToFirstInteractionMs: telemetryRef.current['firstInteractionAt']
        ? (telemetryRef.current['firstInteractionAt'] as number) - taskStartedAt.current
        : performance.now() - taskStartedAt.current,
      hints,
      accuracy: score.accuracy,
      skipped: false,
      selectionChanges: changes,
      hesitationDurationMs: telemetryRef.current['firstInteractionAt']
        ? (telemetryRef.current['firstInteractionAt'] as number) - taskStartedAt.current
        : 0,
    }

    finishRound(
      metric,
      `${score.targetsSelectedCorrectly} of ${score.targetsShown} remembered`,
      '',
      Math.max(0, score.targetsSelectedCorrectly - score.falseSelections),
      score.targetsShown,
    )
  }

  // ── Spatial Location Choose ──
  const chooseLocation = (index: number) => {
    if (!spatial) return
    telemetryRef.current.recordInteraction()
    setChanges((v) => v + 1)

    const currentQuestion = spatial.questions[spatial.currentQuestionIndex]
    if (!currentQuestion) return

    const originalPosition = spatial.grid.findIndex(
      (item) => item.id === currentQuestion.id,
    )
    const isCorrect = index === originalPosition
    const responseTimeMs = performance.now() - taskStartedAt.current

    const newIncorrectAttempts = isCorrect ? 0 : spatial.incorrectAttempts + 1
    const firstChoiceCorrect = spatial.currentQuestionIndex === 0
      ? isCorrect
      : spatial.firstChoiceCorrect

    if (!isCorrect) {
      // Wrong — try again
      setSpatial({
        ...spatial,
        incorrectAttempts: newIncorrectAttempts,
      })
      return
    }

    // Correct!
    const newResults = [...spatial.questionResults, {
      targetId: currentQuestion.id,
      correct: true,
      responseTimeMs,
    }]

    const newCorrectCount = spatial.correctCount + 1

    if (spatial.currentQuestionIndex + 1 >= spatial.questions.length) {
      // All spatial questions done
      const totalQ = spatial.questions.length
      const accuracy = (newCorrectCount / totalQ) * 100

      const metric: SpatialMemoryMetric = {
        round: round + 1,
        roundType: 'spatial-memory',
        correctLocations: newCorrectCount,
        totalLocations: totalQ,
        spatialErrors: spatial.incorrectAttempts,
        firstChoiceCorrect,
        locationQuestions: newResults,
        responseTimeMs: performance.now() - taskStartedAt.current,
        timeToFirstInteractionMs: performance.now() - taskStartedAt.current,
        hints,
        accuracy,
        skipped: false,
        selectionChanges: changes,
        hesitationDurationMs: 0,
      }

      finishRound(metric, `${newCorrectCount} of ${totalQ} locations found`, '', newCorrectCount, totalQ)
    } else {
      // Move to next question
      setSpatial({
        ...spatial,
        currentQuestionIndex: spatial.currentQuestionIndex + 1,
        correctCount: newCorrectCount,
        incorrectAttempts: 0,
        firstChoiceCorrect,
        questionResults: newResults,
      })
    }
  }

  // ── Submit Order (uses scoring engine) ──
  const submitOrder = () => {
    if (!config) return
    const correctOrder = config.targets.map((t) => t.id)
    const userOrder = ordered.map((o) => o.id)

    const score = scoreSequence({
      correctOrder,
      userOrder,
      reorders: changes,
      timeToFirstActionMs: performance.now() - taskStartedAt.current,
      completionTimeMs: performance.now() - taskStartedAt.current,
    })

    const metric: OrderMemoryMetric = {
      round: round + 1,
      roundType: 'order-memory',
      correctPositions: score.correctPositions,
      totalPositions: score.totalPositions,
      orderingErrors: score.totalPositions - score.correctPositions,
      sequenceDistance: score.sequenceDistance,
      responseTimeMs: performance.now() - taskStartedAt.current,
      timeToFirstInteractionMs: performance.now() - taskStartedAt.current,
      hints,
      accuracy: score.accuracy,
      skipped: false,
      selectionChanges: changes,
      hesitationDurationMs: 0,
    }

    finishRound(
      metric,
      `${score.correctPositions} of ${score.totalPositions} positions correct`,
      '',
      score.correctPositions,
      score.totalPositions,
    )
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
      timeToFirstInteractionMs: performance.now() - taskStartedAt.current,
      hints,
      accuracy: isCorrect ? 100 : 0,
      skipped: false,
      selectionChanges: changes,
      hesitationDurationMs: 0,
    }

    finishRound(
      metric,
      isCorrect ? 'That is right!' : 'Nice try',
      isCorrect ? '' : `The answer is ${personalQuestion.correctAnswer}.`,
      isCorrect ? 1 : 0,
      1,
    )
  }

  // ── Submit Delayed Recall (uses scoring engine) ──
  const submitDelayedRecall = () => {
    if (!config) return
    const score = scoreDelayedRecall({
      targetIds: new Set(config.targets.map((item) => item.id)),
      selectedIds: [...selected],
      totalTargets: config.targets.length,
    })

    const metric: DelayedRecallMetric = {
      round: round + 1,
      roundType: 'delayed-recall',
      correctTargets: score.correct,
      missedTargets: config.targets.length - score.correct,
      incorrectSelections: score.falseSelections,
      totalTargets: score.totalTargets,
      itemsIntroducedEarlier: 3,
      responseTimeMs: performance.now() - taskStartedAt.current,
      timeToFirstInteractionMs: performance.now() - taskStartedAt.current,
      hints,
      accuracy: score.accuracy,
      skipped: false,
      selectionChanges: changes,
      hesitationDurationMs: 0,
    }

    finishRound(
      metric,
      `${score.correct} of ${score.totalTargets} remembered`,
      '',
      Math.max(0, score.correct - score.falseSelections),
      score.totalTargets,
    )
  }

  // ── Next Round ──
  const nextRound = () => {
    if (round + 1 >= TOTAL_ROUNDS) {
      persistAndFinish()
    } else {
      prepareRound(round + 1, delayedObjects)
    }
  }

  // ── Persist & Finish ──
  const persistAndFinish = () => {
    const sessionMetrics = collectorRef.current.getSessionMetrics({
      mode,
      difficulty,
      completed: true,
    })

    if (user?.id) {
      void Promise.allSettled([
        saveGameSession({
          patientId: user.id,
          gameType: 'memory',
          difficultyLevel: difficulty,
          correctCount: totalCorrect,
          totalCount: totalPossible,
          responseTimeMs: sessionMetrics.averageResponseTimeMs,
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
    phase === 'intro' || phase === 'delayed-preview'
      ? navigate(mode === 'daily' ? '/patient' : '/patient/games')
      : undefined

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
      showHeader={showHeader && phase !== 'delayed-preview'}
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
          duration="~5 minutes"
          preview={ROUND_TYPES.map((type) => ({
            label: ROUND_LABELS[type],
            icon: ROUND_PREVIEW_ICONS[type],
          }))}
        />
      )}

      {/* ── DELAYED PREVIEW ── */}
      {phase === 'delayed-preview' && config && (
        <div className="flex flex-col items-center justify-center px-4 pt-4 pb-8">
          <Button
            variant="ghost"
            size="sm"
            className="mb-4 self-start"
            onClick={goBack}
          >
            <ArrowLeft data-icon="inline-start" />
            {t('back')}
          </Button>
          <ViewTimer
            seconds={viewTimeLeft}
            title={t('remember_later')}
            subtitle={t('see_again_later')}
          />
          <div className="mx-auto mt-8 grid w-full max-w-2xl grid-cols-2 gap-3 sm:grid-cols-3">
            {config.targets.map((item) => (
              <div key={item.id} className="flex min-h-32 flex-col items-center justify-center rounded-2xl border border-border bg-card p-4 text-primary">
                <ObjectVisual item={item} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MEMORISE PHASE ── */}
      {phase === 'memorise' && (
        <div className="flex flex-col items-center justify-center px-4 pt-4 pb-8">
          <ViewTimer
            seconds={viewTimeLeft}
            title={
              ROUND_TYPES[round] === 'order'
                ? t('remember_order')
                : ROUND_TYPES[round] === 'spatial'
                  ? t('remember_locations')
                  : t('remember_objects')
            }
            subtitle={t('take_time')}
          />
          <div className={`mx-auto mt-8 grid w-full max-w-2xl gap-3 ${
            ROUND_TYPES[round] === 'spatial' && spatial
              ? gridCols(spatial.grid.length)
              : 'grid-cols-2 sm:grid-cols-3'
          }`}>
            {(ROUND_TYPES[round] === 'spatial' && spatial
              ? spatial.grid
              : config?.targets ?? []
            ).map((item, index) => (
              <div key={item.id} className="flex min-h-32 flex-col items-center justify-center rounded-2xl border border-border bg-card p-4 text-primary">
                {ROUND_TYPES[round] === 'order' && (
                  <span className="mb-1 text-xs font-bold text-muted-foreground">{index + 1}</span>
                )}
                <ObjectVisual item={item} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TASK: Visual Object Recall (Round 1) ── */}
      {phase === 'task' && ROUND_TYPES[round] === 'visual-recall' && config && (
        <ObjectRecallTask
          title={t('just_seen')}
          config={config}
          selected={selected}
          onToggle={toggleSelected}
          onSubmit={submitObjectLike}
        />
      )}

      {/* ── TASK: Spatial Memory (Round 2) ── */}
      {phase === 'task' && ROUND_TYPES[round] === 'spatial' && spatial && (
        <SpatialTask
          spatial={spatial}
          attempts={spatial.incorrectAttempts}
          onChoose={chooseLocation}
        />
      )}

      {/* ── TASK: Order Memory (Round 3) ── */}
      {phase === 'task' && ROUND_TYPES[round] === 'order' && config && (
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
            telemetryRef.current.recordInteraction()
            setSelectedAnswer(answer)
            setChanges((v) => v + 1)
          }}
          onSubmit={submitPersonal}
        />
      )}

      {/* ── TASK: Delayed Recall (Round 5) ── */}
      {phase === 'task' && ROUND_TYPES[round] === 'delayed' && config && (
        <ObjectRecallTask
          title={t('seen_earlier')}
          config={config}
          selected={selected}
          onToggle={toggleSelected}
          onSubmit={submitDelayedRecall}
        />
      )}

      {/* ── ROUND RESULT ── */}
      {phase === 'round-result' && (
        <RoundResult
          message={lastSummary}
          subtitle={lastSubtitle || undefined}
          correct={lastCorrect}
          total={lastTotal}
          isLast={round + 1 >= TOTAL_ROUNDS}
          onNext={nextRound}
          roundLabel={`${(ROUND_TYPES[round] ? ROUND_LABELS[ROUND_TYPES[round]] : undefined) ?? 'Round'} — Round ${round + 1} of ${TOTAL_ROUNDS}`}
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
              ? () => navigate('/patient/game/pattern?mode=daily')
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
          roundBreakdown={metrics.map((m, i) => ({
            label: (ROUND_TYPES[i] ? ROUND_LABELS[ROUND_TYPES[i]] : undefined) ?? `Round ${i + 1}`,
            correct: 'correctTargets' in m ? m.correctTargets : 'correctLocations' in m ? m.correctLocations : 'correctPositions' in m ? m.correctPositions : 'correct' in m ? (m.correct ? 1 : 0) : 0,
            total: 'totalTargets' in m ? m.totalTargets : 'totalLocations' in m ? m.totalLocations : 'totalPositions' in m ? m.totalPositions : 1,
          }))}
        />
      )}
    </GameShell>
  )
}

// ─── Sub-tasks ──────────────────────────────────────────────────

function ObjectRecallTask({
  title, config, selected, onToggle, onSubmit,
}: {
  title: string; config: MemoryRoundConfig; selected: Set<string>
  onToggle: (id: string) => void; onSubmit: () => void
}) {
  const { t } = useLanguage()
  return (
    <section className="flex flex-col items-center">
      <h1 className="mt-3 text-center text-2xl font-bold text-foreground">{title}</h1>
      <div className="mx-auto mt-6 grid w-full max-w-xl grid-cols-2 gap-3 sm:grid-cols-3">
        {config.options.map((item) => {
          const chosen = selected.has(item.id)
          return (
            <button key={item.id} onClick={() => onToggle(item.id)} aria-pressed={chosen}
              className="relative flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-border bg-card p-4 text-primary transition-colors duration-150 hover:border-primary/40 hover:bg-accent active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-pressed:border-primary aria-pressed:bg-primary/10">
              <ObjectVisual item={item} />
              {chosen && <Check className="absolute right-3 top-3 size-6 text-primary" aria-label={t('selected')} />}
            </button>
          )
        })}
      </div>
      <Button size="lg" className="mx-auto mt-6 w-full max-w-sm text-lg" onClick={onSubmit} disabled={selected.size === 0}>
        {t('submit_answer')}
      </Button>
    </section>
  )
}

function SpatialTask({
  spatial, attempts, onChoose,
}: {
  spatial: SpatialState; attempts: number; onChoose: (index: number) => void
}) {
  const { t } = useLanguage()
  const currentQ = spatial.questions[spatial.currentQuestionIndex]
  if (!currentQ) return null

  return (
    <section className="flex flex-col items-center">
      <h1 className="mt-5 text-center text-2xl font-bold text-foreground">
        {t('where_was').replace('{object}', currentQ.label.toLowerCase())}
      </h1>
      <p className="mt-2 text-base text-muted-foreground">
        {t('spatial_question_count').replace('{current}', String(spatial.currentQuestionIndex + 1)).replace('{total}', String(spatial.questions.length))}
      </p>
      {attempts > 0 && (
        <p role="status" className="mt-4 rounded-2xl bg-secondary px-5 py-3 text-base text-foreground">
          {t('try_another_place')}
        </p>
      )}
      <div className={`mt-6 grid w-full max-w-2xl gap-3 ${gridCols(spatial.grid.length)}`}>
        {spatial.grid.map((_item, index) => (
          <button key={index} onClick={() => onChoose(index)}
            aria-label={t('position').replace('{number}', String(index + 1))}
            className="flex aspect-square cursor-pointer items-center justify-center rounded-2xl border-2 border-border bg-card transition-colors duration-150 hover:border-primary/50 hover:bg-primary/10 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
            <span className="text-lg font-bold text-muted-foreground">{index + 1}</span>
          </button>
        ))}
      </div>
    </section>
  )
}

function OrderTask({
  config, ordered, onAdd, onRemove, onSubmit,
}: {
  config: MemoryRoundConfig; ordered: GameChoice[]
  onAdd: (item: GameChoice) => void; onRemove: (id: string) => void; onSubmit: () => void
}) {
  const { t } = useLanguage()
  return (
    <section className="flex flex-col">
      <h1 className="mt-4 text-center text-2xl font-bold text-foreground">{t('order_instruction')}</h1>
      <p className="mt-2 text-center text-base text-muted-foreground">{t('order_help')}</p>
      <div className="mx-auto mt-6 flex w-full max-w-xl flex-wrap justify-center gap-3">
        {config.options.map((item) => (
          <button key={item.id} onClick={() => onAdd(item)}
            disabled={ordered.some((v) => v.id === item.id)}
            className="flex min-h-24 min-w-28 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-border bg-card p-3 text-primary transition-colors duration-150 hover:border-primary/40 hover:bg-accent active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100">
            <ObjectVisual item={item} compact />
          </button>
        ))}
      </div>
      <ol className="mx-auto mt-6 grid w-full max-w-xl gap-3 sm:grid-cols-2">
        {Array.from({ length: config.targets.length }, (_, index) => {
          const item = ordered[index]
          return (
            <li key={index} className="min-h-16">
              <button disabled={!item} onClick={() => item && onRemove(item.id)}
                className="flex min-h-16 w-full cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed border-border bg-card px-5 text-left text-primary transition-colors duration-150 hover:border-primary/40 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100">
                <span className="text-xl font-bold text-muted-foreground">{index + 1}</span>
                {item ? <ObjectVisual item={item} compact /> : <span className="text-lg text-muted-foreground">{t('choose_object')}</span>}
              </button>
            </li>
          )
        })}
      </ol>
      <Button size="lg" className="mx-auto w-full max-w-sm text-lg"
        disabled={ordered.length !== config.targets.length} onClick={onSubmit}>
        {t('submit_answer')}
      </Button>
    </section>
  )
}

function PersonalMemoryTask({
  question, selectedAnswer, onSelect, onSubmit,
}: {
  question: { card: { id: string; name: string; relationship: string; imageUrl: string; description: string }; options: string[]; correctAnswer: string } | null
  selectedAnswer: string | null; onSelect: (answer: string) => void; onSubmit: () => void
}) {
  const { t } = useLanguage()
  if (!question) {
  return (
    <section className="flex flex-col items-center justify-center text-center">
      <div className="flex size-20 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Heart className="size-10" /></div>
        <h1 className="mt-5 text-2xl font-bold text-foreground">No personal memory available</h1>
        <p className="mt-3 text-lg text-muted-foreground">Moving on to the next exercise.</p>
        <Button size="lg" className="mt-9 min-h-16 w-full max-w-sm text-xl" onClick={onSubmit}>{t('next_round')}</Button>
      </section>
    )
  }
  return (
    <section className="flex flex-col items-center">
      <h1 className="mt-5 text-center text-2xl font-bold text-foreground">Who is this?</h1>
      <p className="mt-2 text-base text-muted-foreground">{question.card.description}</p>
      <div className="mt-6 flex size-40 items-center justify-center overflow-hidden rounded-2xl border-2 border-border bg-card">
        <img src={question.card.imageUrl} alt={question.card.name} className="size-full object-cover" />
      </div>
      <div className="mx-auto mt-6 grid w-full max-w-md grid-cols-1 gap-3">
        {question.options.map((option) => {
          const chosen = selectedAnswer === option
          return (
            <button key={option} onClick={() => onSelect(option)} aria-pressed={chosen}
              className={`flex min-h-14 cursor-pointer items-center justify-center rounded-2xl border-2 px-6 text-base font-semibold transition-colors duration-150 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${chosen ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-foreground hover:border-primary/40 hover:bg-accent'}`}>
              {option}{chosen && <Check className="ml-3 size-5 text-primary" />}
            </button>
          )
        })}
      </div>
      <Button size="lg" className="mx-auto w-full max-w-sm text-lg" disabled={selectedAnswer === null} onClick={onSubmit}>
        {t('submit_answer')}
      </Button>
    </section>
  )
}
