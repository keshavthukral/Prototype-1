/**
 * Memory Journey V2 — 6-scene coherent journey.
 *
 * Scene 1: Market Basket — show objects on a "basket", fade, recall
 * Scene 2: Where Did It Go? — room with furniture, tap location
 * Scene 3: Morning Routine — sequence ordering of daily activities
 * Scene 4: Family Connection — Memory Book photo with questions
 * Scene 5: Pairs & Connections — familiar associations
 * Scene 6: Remember for Later — delayed recall (previewed at start)
 *
 * Internal scoring uses the scoring engine — never shown to the patient.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Brain, Check, Heart, Lightbulb, ShoppingBasket, MapPin, ListOrdered, Users, Link2, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { GameShell } from '@/features/games/engine/GameShell'
import { GameIntro } from '@/features/games/engine/GameIntro'
import { FinalResult } from '@/features/games/engine/FinalResult'
import { TelemetryTracker } from '@/features/games/engine/telemetry'
import {
  scoreObjectRecall,
  scoreDelayedRecall,
} from '@/features/games/engine/scoring'
import { MemoryMetricsCollector } from '@/features/games/metrics/collector'
import type {
  MemoryRoundMetric,
  ObjectRecallMetric,
  SpatialMemoryMetric,
  OrderMemoryMetric,
  PersonalMemoryMetric,
  AssociationRecallMetric,
  DelayedRecallMetric,
} from '@/features/games/metrics/types'
import {
  buildMarketBasketRound,
  buildSpatialRound,
  buildMorningRoutineRound,
  buildAssociationRoundV2,
  buildDelayedRecallRound,
  viewSeconds,
  type PlacedObject,
} from '@/features/games/data/objects'
import {
  getPersonalMemoryCards,
  buildPersonalQuestion,
} from '@/features/games/data/personal-memories'
import type { GameChoice, GameMode } from '@/features/games/types'
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
import { sessionSeed } from '@/lib/games/seeded-random'

// ─── Constants ──────────────────────────────────────────────────

const TOTAL_ROUNDS = 6

type SceneType = 'market-basket' | 'where-did-it-go' | 'morning-routine' | 'family-connection' | 'pairs-connections' | 'remember-for-later'
const SCENE_ORDER: SceneType[] = [
  'market-basket',
  'where-did-it-go',
  'morning-routine',
  'family-connection',
  'pairs-connections',
  'remember-for-later',
]

type Phase =
  | 'intro'
  | 'delayed-preview'
  | 'view-scene'
  | 'task'
  | 'round-result'
  | 'final-result'

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
  const [sessionSeedValue, setSessionSeedValue] = useState(0)

  // Scene data
  const [delayedObjects, setDelayedObjects] = useState<GameChoice[]>([])
  const [basketObjects, setBasketObjects] = useState<GameChoice[]>([])
  const [basketOptions, setBasketOptions] = useState<GameChoice[]>([])
  const [spatialData, setSpatialData] = useState<{
    furniture: Array<{ id: string; emoji: string; label: string }>
    placedObjects: PlacedObject[]
    questions: Array<{ objectId: string; objectEmoji: string; objectLabel: string; correctFurnitureId: string }>
  } | null>(null)
  const [currentSpatialQ, setCurrentSpatialQ] = useState(0)
  const [spatialCorrect, setSpatialCorrect] = useState(0)
  const [spatialWrong, setSpatialWrong] = useState(0)
  const [morningData, setMorningData] = useState<{
    correctOrder: Array<{ id: string; emoji: string; label: string; description: string }>
    shuffledOrder: Array<{ id: string; emoji: string; label: string; description: string }>
  } | null>(null)
  const [morningOrdered, setMorningOrdered] = useState<Array<{ id: string; emoji: string; label: string; description: string }>>([])
  const [associationData, setAssociationData] = useState<{
    pairsShown: Array<{ left: GameChoice; right: string }>
    queryLeft: GameChoice
    correctAnswer: string
    options: string[]
  } | null>(null)

  // Selection state
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)

  // Tracking
  const [hints, setHints] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [changes, setChanges] = useState(0)
  const [lastSummary, setLastSummary] = useState('')
  const [lastSubtitle, setLastSubtitle] = useState('')

  // Personal memory
  const [personalQuestion, setPersonalQuestion] = useState<{
    card: { id: string; name: string; relationship: string; imageUrl: string; description: string }
    options: string[]
    correctAnswer: string
  } | null>(null)

  // Overall results
  const [totalCorrect, setTotalCorrect] = useState(0)
  const [totalPossible, setTotalPossible] = useState(0)

  // Session
  const [metrics, setMetrics] = useState<MemoryRoundMetric[]>([])
  const collectorRef = useRef(new MemoryMetricsCollector())
  const telemetryRef = useRef(new TelemetryTracker())

  // Refs
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
    const seed = sessionSeed()
    setSessionSeedValue(seed)
    const delayed = buildDelayedRecallRound(difficulty, seed)
    setDelayedObjects(delayed.previewObjects)
    collectorRef.current.reset()
    setMetrics([])
    setTotalCorrect(0)
    setTotalPossible(0)

    setPhase('delayed-preview')
    startCountdown(viewSeconds(difficulty), () => {
      prepareRound(0, delayed.previewObjects, seed)
    })
  }

  // ── Prepare Round ──
  const prepareRound = useCallback(
    (index: number, delayed: GameChoice[], seed: number) => {
      setRound(index)
      setSelected(new Set())
      setSelectedAnswer(null)
      setHints(0)
      setShowHint(false)
      setChanges(0)
      setShowHeader(true)

      const sceneType = SCENE_ORDER[index]
      const roundSeed = seed + index * 31

      switch (sceneType) {
        case 'market-basket': {
          const data = buildMarketBasketRound(difficulty, roundSeed)
          setBasketObjects(data.basketObjects)
          setBasketOptions(data.recallOptions)
          setPhase('view-scene')
          startCountdown(viewSeconds(difficulty), beginTask)
          break
        }

        case 'where-did-it-go': {
          const data = buildSpatialRound(difficulty, roundSeed)
          setSpatialData(data)
          setCurrentSpatialQ(0)
          setSpatialCorrect(0)
          setSpatialWrong(0)
          setPhase('view-scene')
          startCountdown(viewSeconds(difficulty), beginTask)
          break
        }

        case 'morning-routine': {
          const data = buildMorningRoutineRound(difficulty, roundSeed)
          setMorningData(data)
          setMorningOrdered([])
          setPhase('view-scene')
          startCountdown(viewSeconds(difficulty), beginTask)
          break
        }

        case 'family-connection': {
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

        case 'pairs-connections': {
          const data = buildAssociationRoundV2(difficulty, roundSeed)
          setAssociationData(data)
          beginTask()
          break
        }

        case 'remember-for-later': {
          // Build options from delayed objects + distractors
          const options = buildDelayedRecallRound(difficulty, roundSeed)
          setBasketOptions(options.testOptions)
          setBasketObjects(delayed)
          beginTask()
          break
        }
      }
    },
    [beginTask, difficulty, startCountdown],
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

  const addToOrder = (item: { id: string; emoji: string; label: string; description: string }) => {
    telemetryRef.current.recordInteraction()
    if (morningOrdered.some((v) => v.id === item.id)) return
    setChanges((v) => v + 1)
    setMorningOrdered((current) => [...current, item])
  }

  const removeFromOrder = (id: string) => {
    telemetryRef.current.recordChange()
    setChanges((v) => v + 1)
    setMorningOrdered((current) => current.filter((item) => item.id !== id))
  }

  const useHint = () => {
    telemetryRef.current.recordHint()
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

  // ── Submit Scene 1: Market Basket (Object Recall) ──
  const submitMarketBasket = () => {
    const targetIds = new Set(basketObjects.map(o => o.id))
    const score = scoreObjectRecall({
      targetIds,
      selectedIds: [...selected],
      totalTargets: basketObjects.length,
    })

    const metric: ObjectRecallMetric = {
      round: round + 1,
      roundType: 'object-recall',
      correctTargets: score.targetsSelectedCorrectly,
      missedTargets: score.missedTargets,
      incorrectSelections: score.falseSelections,
      totalTargets: score.targetsShown,
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
      t('remembered_result')
        .replace('{correct}', String(score.targetsSelectedCorrectly))
        .replace('{total}', String(score.targetsShown)),
      '',
      Math.max(0, score.targetsSelectedCorrectly - score.falseSelections),
      score.targetsShown,
    )
  }

  // ── Spatial: Tap furniture ──
  const tapFurniture = (furnitureId: string) => {
    if (!spatialData) return
    telemetryRef.current.recordInteraction()

    const q = spatialData.questions[currentSpatialQ]
    if (!q) return

    setChanges((v) => v + 1)

    if (furnitureId === q.correctFurnitureId) {
      // Correct
      const newCorrect = spatialCorrect + 1
      setSpatialCorrect(newCorrect)

      if (currentSpatialQ + 1 >= spatialData.questions.length) {
        // All done
        const totalQ = spatialData.questions.length
        const metric: SpatialMemoryMetric = {
          round: round + 1,
          roundType: 'spatial-memory',
          correctLocations: newCorrect,
          totalLocations: totalQ,
          spatialErrors: spatialWrong,
          firstChoiceCorrect: currentSpatialQ === 0,
          locationQuestions: [],
          responseTimeMs: performance.now() - taskStartedAt.current,
          timeToFirstInteractionMs: performance.now() - taskStartedAt.current,
          hints,
          accuracy: (newCorrect / totalQ) * 100,
          skipped: false,
          selectionChanges: changes,
          hesitationDurationMs: 0,
        }
        finishRound(
          metric,
          t('positions_result')
            .replace('{correct}', String(newCorrect))
            .replace('{total}', String(totalQ)),
          '',
          newCorrect,
          totalQ,
        )
      } else {
        setCurrentSpatialQ(currentSpatialQ + 1)
      }
    } else {
      // Wrong
      setSpatialWrong(spatialWrong + 1)
    }
  }

  // ── Submit Scene 3: Morning Routine ──
  const submitMorning = () => {
    if (!morningData) return
    const correctOrder = morningData.correctOrder.map(s => s.id)
    const userOrder = morningOrdered.map(s => s.id)

    const correctPositions = correctOrder.filter(
      (id, i) => userOrder[i] === id,
    ).length

    const metric: OrderMemoryMetric = {
      round: round + 1,
      roundType: 'order-memory',
      correctPositions,
      totalPositions: correctOrder.length,
      orderingErrors: correctOrder.length - correctPositions,
      sequenceDistance: changes,
      responseTimeMs: performance.now() - taskStartedAt.current,
      timeToFirstInteractionMs: performance.now() - taskStartedAt.current,
      hints,
      accuracy: (correctPositions / correctOrder.length) * 100,
      skipped: false,
      selectionChanges: changes,
      hesitationDurationMs: 0,
    }

    finishRound(
      metric,
      t('positions_result')
        .replace('{correct}', String(correctPositions))
        .replace('{total}', String(correctOrder.length)),
      '',
      correctPositions,
      correctOrder.length,
    )
  }

  // ── Submit Scene 4: Family Connection ──
  const submitFamily = () => {
    if (!personalQuestion) return
    const isCorrect = selectedAnswer === personalQuestion.correctAnswer

    const metric: PersonalMemoryMetric = {
      round: round + 1,
      roundType: 'personal-memory',
      correct: isCorrect,
      targetName: personalQuestion.card.name,
      distractorsShown: personalQuestion.options.filter(
        (o) => o !== personalQuestion.correctAnswer,
      ),
      responseTimeMs: performance.now() - taskStartedAt.current,
      timeToFirstInteractionMs: performance.now() - taskStartedAt.current,
      hints,
      accuracy: isCorrect ? 100 : 0,
      skipped: false,
      selectionChanges: changes,
      hesitationDurationMs: 0,
    }

    finishRound(
      metric,
      isCorrect ? t('thats_right') : t('nice_try'),
      isCorrect ? '' : t('answer_is').replace('{answer}', personalQuestion.correctAnswer),
      isCorrect ? 1 : 0,
      1,
    )
  }

  // ── Submit Scene 5: Pairs & Connections ──
  const submitAssociation = () => {
    if (!associationData) return
    const isCorrect = selectedAnswer === associationData.correctAnswer

    const metric: AssociationRecallMetric = {
      round: round + 1,
      roundType: 'association-recall',
      pairsShown: associationData.pairsShown.length,
      correctAnswer: isCorrect,
      responseTimeMs: performance.now() - taskStartedAt.current,
      timeToFirstInteractionMs: performance.now() - taskStartedAt.current,
      hints,
      accuracy: isCorrect ? 100 : 0,
      skipped: false,
      selectionChanges: changes,
      hesitationDurationMs: 0,
    }

    finishRound(
      metric,
      isCorrect ? t('association_correct') : t('association_incorrect').replace('{answer}', associationData.correctAnswer),
      isCorrect ? '' : '',
      isCorrect ? 1 : 0,
      1,
    )
  }

  // ── Submit Scene 6: Remember for Later ──
  const submitDelayedRecall = () => {
    const targetIds = new Set(delayedObjects.map(o => o.id))
    const score = scoreDelayedRecall({
      targetIds,
      selectedIds: [...selected],
      totalTargets: delayedObjects.length,
    })

    const metric: DelayedRecallMetric = {
      round: round + 1,
      roundType: 'delayed-recall',
      correctTargets: score.correct,
      missedTargets: delayedObjects.length - score.correct,
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
      t('remembered_result')
        .replace('{correct}', String(score.correct))
        .replace('{total}', String(score.totalTargets)),
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
      prepareRound(round + 1, delayedObjects, sessionSeedValue)
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
      ? t('v2_result_wonderful')
      : accuracy >= 50
        ? t('v2_result_good')
        : t('v2_result_effort')

  const goBack = useCallback(() => {
    navigate(mode === 'daily' ? '/patient' : '/patient/games')
  }, [navigate, mode])

  // ── Scene icons ──
  const sceneIcons: Record<SceneType, typeof Brain> = {
    'market-basket': ShoppingBasket,
    'where-did-it-go': MapPin,
    'morning-routine': ListOrdered,
    'family-connection': Users,
    'pairs-connections': Link2,
    'remember-for-later': Clock,
  }

  // ── Loading ──
  if (!ready) {
    return (
      <div className="patient-ui flex min-h-screen items-center justify-center bg-background">
        <p className="text-xl text-muted-foreground">{t('loading_activity')}</p>
      </div>
    )
  }

  const sceneType = SCENE_ORDER[round] ?? 'market-basket'
  const SceneIcon = sceneIcons[sceneType] ?? Brain

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
          description={t('memory_journey_desc')}
          backLabel={mode === 'daily' ? t('home') : t('activities')}
          onBack={goBack}
          onStart={startSession}
        />
      )}

      {/* ── DELAYED PREVIEW ── */}
      {phase === 'delayed-preview' && (
        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="mb-4 flex items-center gap-3">
            <Clock className="size-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">{t('scene_6_title')}</h1>
          </div>
          <p className="mb-2 text-xl text-muted-foreground">{t('scene_6_instruction')}</p>
          <p className="mb-6 text-lg text-muted-foreground/70">{t('seconds_short').replace('{count}', String(viewTimeLeft))}</p>
          <div className="mx-auto grid w-full max-w-lg grid-cols-3 gap-6">
            {delayedObjects.map((item) => (
              <div key={item.id} className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="flex size-20 items-center justify-center rounded-xl bg-primary/5">
                  <span className="text-5xl" aria-hidden="true">{item.emoji}</span>
                </div>
                <span className="mt-3 text-lg font-semibold text-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── VIEW SCENE (memorize phase) ── */}
      {phase === 'view-scene' && (
        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="mb-4 flex items-center gap-3">
            <SceneIcon className="size-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">
              {sceneType === 'market-basket' ? t('scene_1_title') :
               sceneType === 'where-did-it-go' ? t('scene_2_title') :
               sceneType === 'morning-routine' ? t('scene_3_title') : ''}
            </h1>
          </div>
          <p className="mb-2 text-xl text-muted-foreground">
            {sceneType === 'market-basket' ? t('scene_1_instruction') :
             sceneType === 'where-did-it-go' ? t('scene_2_instruction') :
             sceneType === 'morning-routine' ? t('scene_3_instruction') : ''}
          </p>
          <p className="mb-6 text-lg text-muted-foreground/70">{t('seconds_short').replace('{count}', String(viewTimeLeft))}</p>

          {/* Market Basket scene */}
          {sceneType === 'market-basket' && (
            <div className="mx-auto w-full max-w-lg rounded-3xl border-2 border-primary/20 bg-gradient-to-b from-card to-primary/5 p-8 shadow-md">
              <p className="mb-4 text-center text-sm font-medium text-muted-foreground">{t('scene_basket_display')}</p>
              <div className="grid grid-cols-3 gap-5">
                {basketObjects.map((item) => (
                  <div key={item.id} className="flex flex-col items-center justify-center rounded-xl border border-border/50 bg-card/80 p-4">
                    <span className="text-4xl" aria-hidden="true">{item.emoji}</span>
                    <span className="mt-2 text-sm font-medium text-foreground">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Where Did It Go? scene */}
          {sceneType === 'where-did-it-go' && spatialData && (
            <div className="mx-auto w-full max-w-lg rounded-3xl border-2 border-primary/20 bg-gradient-to-b from-card to-primary/5 p-8 shadow-md">
              <p className="mb-4 text-center text-sm font-medium text-muted-foreground">{t('scene_room_display')}</p>
              <div className="grid grid-cols-3 gap-4">
                {spatialData.furniture.map((f) => {
                  const placed = spatialData.placedObjects.find(p => p.furnitureId === f.id)
                  return (
                    <div key={f.id} className="flex flex-col items-center justify-center rounded-xl border border-border/50 bg-card/80 p-3 min-h-24">
                      <span className="text-3xl" aria-hidden="true">{f.emoji}</span>
                      <span className="mt-1 text-xs font-medium text-muted-foreground">{f.label}</span>
                      {placed && (
                        <span className="mt-1 text-2xl" aria-hidden="true">
                          {basketObjects.find(o => o.id === placed.objectId)?.emoji ?? '❓'}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Morning Routine scene */}
          {sceneType === 'morning-routine' && morningData && (
            <div className="mx-auto w-full max-w-lg rounded-3xl border-2 border-primary/20 bg-gradient-to-b from-card to-primary/5 p-8 shadow-md">
              <p className="mb-4 text-center text-sm font-medium text-muted-foreground">{t('scene_sequence_display')}</p>
              <div className="flex flex-col gap-3">
                {morningData.correctOrder.map((step, i) => (
                  <div key={step.id} className="flex items-center gap-4 rounded-xl border border-border/50 bg-card/80 p-4">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                      {i + 1}
                    </span>
                    <span className="text-3xl" aria-hidden="true">{step.emoji}</span>
                    <div>
                      <span className="text-lg font-semibold text-foreground">{step.label}</span>
                      <span className="ml-2 text-sm text-muted-foreground">{step.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TASK PHASE ── */}

      {/* Scene 1: Market Basket — Recall */}
      {phase === 'task' && sceneType === 'market-basket' && (
        <BasketRecallTask
          title={t('scene_1_recall')}
          options={basketOptions}
          selected={selected}
          onToggle={toggleSelected}
          hints={hints}
          showHint={showHint}
          onHint={useHint}
          onSubmit={submitMarketBasket}
        />
      )}

      {/* Scene 2: Where Did It Go? */}
      {phase === 'task' && sceneType === 'where-did-it-go' && spatialData && spatialData.questions[currentSpatialQ] && (
        <SpatialTask
          furniture={spatialData.furniture}
          currentQuestion={spatialData.questions[currentSpatialQ]!}
          questionIndex={currentSpatialQ}
          totalQuestions={spatialData.questions.length}
          wrongAttempts={spatialWrong}
          onTapFurniture={tapFurniture}
        />
      )}

      {/* Scene 3: Morning Routine */}
      {phase === 'task' && sceneType === 'morning-routine' && morningData && (
        <MorningRoutineTask
          allSteps={morningData.shuffledOrder}
          ordered={morningOrdered}
          onAdd={addToOrder}
          onRemove={removeFromOrder}
          onSubmit={submitMorning}
        />
      )}

      {/* Scene 4: Family Connection */}
      {phase === 'task' && sceneType === 'family-connection' && (
        <FamilyConnectionTask
          question={personalQuestion}
          selectedAnswer={selectedAnswer}
          onSelect={(answer) => {
            telemetryRef.current.recordInteraction()
            setSelectedAnswer(answer)
            setChanges((v) => v + 1)
          }}
          onSubmit={submitFamily}
        />
      )}

      {/* Scene 5: Pairs & Connections */}
      {phase === 'task' && sceneType === 'pairs-connections' && (
        <PairsConnectionsTask
          data={associationData}
          selectedAnswer={selectedAnswer}
          onSelect={(answer) => {
            telemetryRef.current.recordInteraction()
            setSelectedAnswer(answer)
            setChanges((v) => v + 1)
          }}
          onSubmit={submitAssociation}
        />
      )}

      {/* Scene 6: Remember for Later */}
      {phase === 'task' && sceneType === 'remember-for-later' && (
        <BasketRecallTask
          title={t('scene_6_recall')}
          options={basketOptions}
          selected={selected}
          onToggle={toggleSelected}
          hints={hints}
          showHint={showHint}
          onHint={useHint}
          onSubmit={submitDelayedRecall}
        />
      )}

      {/* ── ROUND RESULT ── */}
      {phase === 'round-result' && (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Check className="size-10" />
          </div>
          <h1 className="mt-6 text-3xl font-bold text-foreground">
            {t('good_effort')}
          </h1>
          <p className="mt-3 max-w-md text-xl text-muted-foreground">
            {lastSummary}
          </p>
          {lastSubtitle && (
            <p className="mt-2 text-lg text-muted-foreground/80">{lastSubtitle}</p>
          )}
          <Button
            size="lg"
            className="mt-9 min-h-16 w-full max-w-sm text-xl"
            onClick={nextRound}
          >
            {round + 1 >= TOTAL_ROUNDS ? t('see_results') : t('next_round')}
          </Button>
        </div>
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
        />
      )}
    </GameShell>
  )
}

// ─── Scene 1 & 6: Basket Recall Task ────────────────────────────

function BasketRecallTask({
  title,
  options,
  selected,
  onToggle,
  hints,
  showHint,
  onHint,
  onSubmit,
}: {
  title: string
  options: GameChoice[]
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
      <h1 className="mt-4 text-center text-3xl font-bold text-foreground">{title}</h1>
      {showHint && (
        <p className="mx-auto mt-4 rounded-xl bg-primary/10 px-5 py-3 text-lg font-medium text-primary">
          {t('hint_object_recall')}
        </p>
      )}
      <div className="mx-auto mt-8 grid w-full max-w-2xl grid-cols-2 gap-4 sm:grid-cols-3">
        {options.map((item) => {
          const chosen = selected.has(item.id)
          return (
            <button
              key={item.id}
              onClick={() => onToggle(item.id)}
              aria-pressed={chosen}
              className="relative flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-border bg-card p-4 text-primary shadow-sm transition-all duration-150 hover:border-primary/40 hover:bg-accent hover:shadow-md active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-pressed:border-primary aria-pressed:bg-primary/10 aria-pressed:shadow-md"
            >
              <div className="flex size-16 items-center justify-center rounded-xl bg-primary/5">
                <span className="text-4xl" aria-hidden="true">{item.emoji}</span>
              </div>
              <span className="mt-3 text-base font-semibold text-foreground">{item.label}</span>
              {chosen && <Check className="absolute right-3 top-3 size-6 text-primary" aria-label={t('selected')} />}
            </button>
          )
        })}
      </div>
      <div className="mx-auto mt-auto flex w-full max-w-2xl flex-col gap-3 pt-7 sm:flex-row">
        <Button variant="outline" size="lg" className="flex-1 text-lg" onClick={onHint} disabled={showHint}>
          <Lightbulb data-icon="inline-start" />{t('hint')} {hints > 0 ? `(${hints})` : ''}
        </Button>
        <Button size="lg" className="flex-1 text-lg" onClick={onSubmit} disabled={selected.size === 0}>
          {t('submit_answer')}
        </Button>
      </div>
    </section>
  )
}

// ─── Scene 2: Where Did It Go? ─────────────────────────────────

function SpatialTask({
  furniture,
  currentQuestion,
  questionIndex,
  totalQuestions,
  wrongAttempts,
  onTapFurniture,
}: {
  furniture: Array<{ id: string; emoji: string; label: string }>
  currentQuestion: { objectId: string; objectEmoji: string; objectLabel: string; correctFurnitureId: string }
  questionIndex: number
  totalQuestions: number
  wrongAttempts: number
  onTapFurniture: (furnitureId: string) => void
}) {
  const { t } = useLanguage()
  if (!currentQuestion) return null

  return (
    <section className="flex flex-1 flex-col items-center">
      <h1 className="mt-5 text-center text-3xl font-bold text-foreground">
        {t('scene_2_question').replace('{object}', currentQuestion.objectLabel.toLowerCase())}
      </h1>
      <p className="mt-2 text-lg text-muted-foreground">
        {t('question_of')
          .replace('{current}', String(questionIndex + 1))
          .replace('{total}', String(totalQuestions))}
      </p>
      {wrongAttempts > 0 && (
        <p role="status" className="mt-4 rounded-xl bg-secondary px-5 py-3 text-lg text-foreground">
          {t('try_another_place')}
        </p>
      )}
      <div className="mt-8 grid w-full max-w-lg grid-cols-3 gap-4">
        {furniture.map((f) => (
          <button
            key={f.id}
            onClick={() => onTapFurniture(f.id)}
            className="flex flex-col items-center justify-center rounded-2xl border-2 border-border bg-card p-4 min-h-28 shadow-sm transition-all duration-150 hover:border-primary/50 hover:bg-primary/10 hover:shadow-md active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <span className="text-3xl" aria-hidden="true">{f.emoji}</span>
            <span className="mt-2 text-sm font-medium text-muted-foreground">{f.label}</span>
          </button>
        ))}
      </div>
      <div className="mt-6 flex items-center gap-2">
        <span className="text-lg text-muted-foreground">{t('scene_2_tap_place')}</span>
        <span className="text-4xl" aria-hidden="true">{currentQuestion.objectEmoji}</span>
      </div>
    </section>
  )
}

// ─── Scene 3: Morning Routine ──────────────────────────────────

function MorningRoutineTask({
  allSteps,
  ordered,
  onAdd,
  onRemove,
  onSubmit,
}: {
  allSteps: Array<{ id: string; emoji: string; label: string; description: string }>
  ordered: Array<{ id: string; emoji: string; label: string; description: string }>
  onAdd: (item: { id: string; emoji: string; label: string; description: string }) => void
  onRemove: (id: string) => void
  onSubmit: () => void
}) {
  const { t } = useLanguage()
  return (
    <section className="flex flex-1 flex-col">
      <h1 className="mt-4 text-center text-3xl font-bold text-foreground">{t('scene_3_instruction')}</h1>
      <p className="mt-2 text-center text-lg text-muted-foreground">{t('scene_3_help')}</p>

      {/* Available steps */}
      <div className="mx-auto mt-7 flex w-full max-w-3xl flex-wrap justify-center gap-3">
        {allSteps.map((step) => (
          <button
            key={step.id}
            onClick={() => onAdd(step)}
            disabled={ordered.some((v) => v.id === step.id)}
            className="flex min-h-24 min-w-32 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-border bg-card p-3 shadow-sm transition-all duration-150 hover:border-primary/40 hover:bg-accent hover:shadow-md active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
          >
            <span className="text-3xl" aria-hidden="true">{step.emoji}</span>
            <span className="mt-1 text-sm font-medium text-foreground">{step.label}</span>
          </button>
        ))}
      </div>

      {/* Ordered slots */}
      <ol className="mx-auto mt-8 grid w-full max-w-3xl gap-3 sm:grid-cols-2">
        {Array.from({ length: allSteps.length }, (_, index) => {
          const item = ordered[index]
          return (
            <li key={index} className="min-h-20">
              <button
                disabled={!item}
                onClick={() => item && onRemove(item.id)}
                className="flex min-h-20 w-full cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed border-border bg-card px-5 text-left shadow-sm transition-all duration-150 hover:border-primary/40 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                  {index + 1}
                </span>
                {item ? (
                  <>
                    <span className="text-2xl" aria-hidden="true">{item.emoji}</span>
                    <span className="text-base font-medium text-foreground">{item.label}</span>
                  </>
                ) : (
                  <span className="text-lg text-muted-foreground">{t('choose_object')}</span>
                )}
              </button>
            </li>
          )
        })}
      </ol>

      <Button
        size="lg"
        className="mx-auto mt-auto w-full max-w-sm text-lg"
        disabled={ordered.length !== allSteps.length}
        onClick={onSubmit}
      >
        {t('scene_3_check')}
      </Button>
    </section>
  )
}

// ─── Scene 4: Family Connection ────────────────────────────────

function FamilyConnectionTask({
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
    return (
      <section className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="flex size-20 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Heart className="size-10" /></div>
        <h1 className="mt-6 text-3xl font-bold text-foreground">{t('scene_4_title')}</h1>
        <p className="mt-3 text-lg text-muted-foreground">{t('scene_4_instruction')}</p>
        <Button size="lg" className="mt-9 min-h-16 w-full max-w-sm text-xl" onClick={onSubmit}>{t('next_round')}</Button>
      </section>
    )
  }

  return (
    <section className="flex flex-1 flex-col items-center">
      <h1 className="mt-5 text-center text-3xl font-bold text-foreground">{t('scene_4_question_who')}</h1>
      <p className="mt-2 text-lg text-muted-foreground">{t('scene_4_instruction')}</p>

      {/* Photo */}
      <div className="mt-8 flex size-44 items-center justify-center overflow-hidden rounded-3xl border-2 border-border bg-card shadow-md">
        <img src={question.card.imageUrl} alt={question.card.name} className="size-full object-cover" />
      </div>

      {/* Options */}
      <div className="mx-auto mt-8 grid w-full max-w-md grid-cols-1 gap-3">
        {question.options.map((option) => {
          const chosen = selectedAnswer === option
          return (
            <button
              key={option}
              onClick={() => onSelect(option)}
              aria-pressed={chosen}
              className={`flex min-h-16 cursor-pointer items-center justify-center rounded-2xl border-2 px-6 text-lg font-semibold shadow-sm transition-all duration-150 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                chosen
                  ? 'border-primary bg-primary/10 text-primary shadow-md'
                  : 'border-border bg-card text-foreground hover:border-primary/40 hover:bg-accent hover:shadow-sm'
              }`}
            >
              {option}{chosen && <Check className="ml-3 size-5 text-primary" />}
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

// ─── Scene 5: Pairs & Connections ──────────────────────────────

function PairsConnectionsTask({
  data,
  selectedAnswer,
  onSelect,
  onSubmit,
}: {
  data: {
    pairsShown: Array<{ left: GameChoice; right: string }>
    queryLeft: GameChoice
    correctAnswer: string
    options: string[]
  } | null
  selectedAnswer: string | null
  onSelect: (answer: string) => void
  onSubmit: () => void
}) {
  const { t } = useLanguage()
  if (!data) {
    return (
      <section className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="flex size-20 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Link2 className="size-10" /></div>
        <h1 className="mt-6 text-3xl font-bold text-foreground">{t('scene_5_title')}</h1>
        <p className="mt-3 text-lg text-muted-foreground">{t('scene_5_instruction')}</p>
        <Button size="lg" className="mt-9 min-h-16 w-full max-w-sm text-xl" onClick={onSubmit}>{t('next_round')}</Button>
      </section>
    )
  }

  return (
    <section className="flex flex-1 flex-col items-center">
      <h1 className="mt-5 text-center text-3xl font-bold text-foreground">
        {t('scene_5_question').replace('{object}', data.queryLeft.label.toLowerCase())}
      </h1>
      <p className="mt-2 text-lg text-muted-foreground">{t('scene_5_instruction')}</p>

      {/* Pairs display */}
      <div className="mx-auto mt-6 grid w-full max-w-md grid-cols-1 gap-3">
        {data.pairsShown.map((pair) => (
          <div key={pair.left.id} className="flex items-center justify-between rounded-2xl border border-border bg-card px-5 py-3 shadow-sm">
            <span className="text-lg font-semibold text-foreground">{pair.left.emoji} {pair.left.label}</span>
            <span className="text-lg text-muted-foreground">↔</span>
            <span className="text-lg font-semibold text-primary">{pair.right}</span>
          </div>
        ))}
      </div>

      {/* Options */}
      <div className="mx-auto mt-8 grid w-full max-w-md grid-cols-3 gap-3">
        {data.options.map((option) => {
          const chosen = selectedAnswer === option
          return (
            <button
              key={option}
              onClick={() => onSelect(option)}
              aria-pressed={chosen}
              className={`flex min-h-16 cursor-pointer items-center justify-center rounded-2xl border-2 px-4 text-lg font-semibold shadow-sm transition-all duration-150 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                chosen
                  ? 'border-primary bg-primary/10 text-primary shadow-md'
                  : 'border-border bg-card text-foreground hover:border-primary/40 hover:bg-accent hover:shadow-sm'
              }`}
            >
              {option}{chosen && <Check className="ml-2 size-5 text-primary" />}
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
