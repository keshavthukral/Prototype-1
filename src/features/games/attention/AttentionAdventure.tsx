/**
 * Attention Adventure — 6–8 short challenges from 7 types.
 *
 * TYPE A: What Comes Next (visual sequences)
 * TYPE B: Find the Different One
 * TYPE C: Target Find
 * TYPE D: Sequence Completion (A-B-C pattern)
 * TYPE E: Simple Number Pattern
 * TYPE F: Match the Pair
 * TYPE G: Quick Choice
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Check, Grid3X3, Lightbulb } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { GameShell } from '@/features/games/engine/GameShell'
import { GameIntro } from '@/features/games/engine/GameIntro'
import { FinalResult } from '@/features/games/engine/FinalResult'
import { AttentionMetricsCollector } from '@/features/games/metrics/collector'
import type { ChallengeMetric } from '@/features/games/metrics/types'
import { getSessionChallenges, type ChallengeConfig } from '@/features/games/data/challenges'
import type { GameMode } from '@/features/games/types'
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

// ─── Types ──────────────────────────────────────────────────────

type Phase = 'intro' | 'challenge' | 'feedback' | 'final-result' | 'daily-complete'

const TOTAL_CHALLENGES = 7

// ─── Main Component ─────────────────────────────────────────────

export function AttentionAdventure() {
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
  const [index, setIndex] = useState(0)
  const [challenges, setChallenges] = useState<ChallengeConfig[]>([])
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [correct, setCorrect] = useState(false)
  const [metrics, setMetrics] = useState<ChallengeMetric[]>([])
  const [hints, setHints] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [changes, setChanges] = useState(0)

  // Match-pair state
  const [matchSelected, setMatchSelected] = useState<string[]>([])
  const [matchedPairs, setMatchedPairs] = useState<Set<string>>(new Set())

  // Session
  const collectorRef = useRef(new AttentionMetricsCollector())

  // Refs
  const challengeStartedAt = useRef(0)
  const firstInteractionAt = useRef<number | null>(null)

  // ── Load difficulty ──
  useEffect(() => {
    void (async () => {
      if (user?.id) {
        const recent = await getRecentSessions(user.id, 'pattern', 5)
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

  const beginChallenge = useCallback((nextIndex: number) => {
    setIndex(nextIndex)
    setSelectedIndex(null)
    setChanges(0)
    setHints(0)
    setShowHint(false)
    setMatchSelected([])
    setMatchedPairs(new Set())
    challengeStartedAt.current = performance.now()
    firstInteractionAt.current = null
    setPhase('challenge')
  }, [])

  // ── Start Game ──
  const startGame = () => {
    const pool = getSessionChallenges(difficulty, TOTAL_CHALLENGES)
    setChallenges(pool)
    setMetrics([])
    collectorRef.current.reset()
    beginChallenge(0)
  }

  const current = challenges[index]

  // ── Selection ──
  const selectAnswer = (answerIndex: number) => {
    noteInteraction()
    if (selectedIndex !== null && selectedIndex !== answerIndex)
      setChanges((v) => v + 1)
    setSelectedIndex(answerIndex)
  }

  const useHint = () => {
    noteInteraction()
    setHints((v) => v + 1)
    setShowHint(true)
  }

  // ── Match pair handlers ──
  const handleMatchSelect = (item: string) => {
    if (!current) return
    noteInteraction()
    if (matchedPairs.has(item)) return

    const next = [...matchSelected, item]
    setMatchSelected(next)
    setChanges((v) => v + 1)

    // Check if we have a pair
    if (next.length === 2) {
      const pair = current.pairs?.find(
        (p) =>
          (p.left === next[0] && p.right === next[1]) ||
          (p.left === next[1] && p.right === next[0]),
      )
      if (pair) {
        const newMatched = new Set(matchedPairs)
        newMatched.add(pair.left)
        newMatched.add(pair.right)
        setMatchedPairs(newMatched)
      }
      // Clear selection after a brief delay
      setTimeout(() => setMatchSelected([]), 400)
    }
  }

  // ── Record Challenge ──
  const recordChallenge = (completionState: 'completed' | 'skipped') => {
    if (!current) return
    const now = performance.now()

    let isCorrect = false
    if (completionState === 'completed') {
      if (current.type === 'match-pair') {
        // All pairs matched
        const totalPairs = current.pairs?.length ?? 0
        isCorrect = matchedPairs.size / 2 >= totalPairs
      } else if (current.type === 'target-find') {
        // Handled differently — auto-submit
        isCorrect = true
      } else {
        isCorrect =
          selectedIndex !== null &&
          current.options[selectedIndex] === current.answer
      }
    }

    const metric: ChallengeMetric = {
      challengeId: current.id,
      challengeType: current.type,
      correct: isCorrect,
      responseTimeMs: Math.round(now - challengeStartedAt.current),
      timeToFirstInteractionMs: Math.round(
        (firstInteractionAt.current ?? now) - challengeStartedAt.current,
      ),
      hints,
      skipped: completionState === 'skipped',
      changedAnswers: changes,
      difficulty,
    }

    collectorRef.current.addChallenge(metric)
    setMetrics((v) => [...v, metric])
    setCorrect(isCorrect)
    setPhase('feedback')
  }

  // ── Next Challenge ──
  const nextChallenge = () => {
    if (index + 1 >= TOTAL_CHALLENGES) {
      persistAndFinish()
    } else {
      beginChallenge(index + 1)
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
      const correctCount = metrics.filter((m) => m.correct).length
      void Promise.allSettled([
        saveGameSession({
          patientId: user.id,
          gameType: 'pattern',
          difficultyLevel: difficulty,
          correctCount,
          totalCount: TOTAL_CHALLENGES,
          responseTimeMs: sessionMetrics.averageResponseTimeMs,
          hintsUsed: metrics.reduce((sum, m) => sum + m.hints, 0),
        }),
        saveRichGameMetrics({
          patientId: user.id,
          gameType: 'pattern',
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
  const correctCount = metrics.filter((m) => m.correct).length
  const accuracy = Math.round((correctCount / TOTAL_CHALLENGES) * 100)
  const encouragingMessage =
    accuracy >= 80
      ? 'Excellent work! Your attention is sharp.'
      : accuracy >= 50
        ? 'Well done! Keep practising.'
        : 'Every effort helps. You are doing great.'

  const goBack = () =>
    phase === 'intro'
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
      totalSteps={TOTAL_CHALLENGES}
      currentStep={index}
      showHeader={phase !== 'intro' && phase !== 'final-result' && phase !== 'daily-complete'}
      celebrate={phase === 'final-result' && (accuracy >= 50 || mode === 'daily')}
      onBack={() => navigate(mode === 'daily' ? '/patient' : '/patient/games')}
    >
      {/* ── INTRO ── */}
      {phase === 'intro' && (
        <GameIntro
          icon={Grid3X3}
          title="Pattern & Attention"
          description="Short visual questions. Take your time."
          backLabel={mode === 'daily' ? t('home') : t('activities')}
          onBack={goBack}
          onStart={startGame}
        />
      )}

      {/* ── CHALLENGE ── */}
      {phase === 'challenge' && current && (
        <ChallengeView
          challenge={current}
          selectedIndex={selectedIndex}
          showHint={showHint}
          hints={hints}
          matchSelected={matchSelected}
          matchedPairs={matchedPairs}
          onSelect={selectAnswer}
          onMatchSelect={handleMatchSelect}
          onHint={useHint}
          onSubmit={() => recordChallenge('completed')}
          onSkip={() => recordChallenge('skipped')}
        />
      )}

      {/* ── FEEDBACK ── */}
      {phase === 'feedback' && current && (
        <Feedback
          correct={correct}
          skipped={metrics[metrics.length - 1]?.skipped ?? false}
          last={index + 1 >= TOTAL_CHALLENGES}
          onNext={nextChallenge}
        />
      )}

      {/* ── FINAL RESULT ── */}
      {phase === 'final-result' && (
        <FinalResult
          title="Pattern & Attention"
          roundsCompleted={metrics.length}
          totalRounds={TOTAL_CHALLENGES}
          accuracy={accuracy}
          message={encouragingMessage}
          onContinue={
            mode === 'daily'
              ? () => setPhase('daily-complete')
              : undefined
          }
          onActivities={
            mode === 'practice'
              ? () => navigate('/patient/games')
              : undefined
          }
          onAgain={startGame}
          continueLabel={t('finish_today')}
        />
      )}

      {/* ── DAILY COMPLETE ── */}
      {phase === 'daily-complete' && (
        <section className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Check className="size-10" />
          </div>
          <h1 className="mt-6 text-[2.5rem] font-bold text-foreground">
            {t('daily_complete')}
          </h1>
          <p className="mt-3 text-xl text-muted-foreground">
            {t('daily_complete_message')}
          </p>
          <Button
            size="lg"
            className="mt-9 min-h-16 w-full max-w-sm text-xl"
            onClick={() => navigate('/patient')}
          >
            {t('return_home')}
          </Button>
        </section>
      )}
    </GameShell>
  )
}

// ─── Challenge View ─────────────────────────────────────────────

function ChallengeView({
  challenge,
  selectedIndex,
  showHint,
  hints,
  matchSelected,
  matchedPairs,
  onSelect,
  onMatchSelect,
  onHint,
  onSubmit,
  onSkip,
}: {
  challenge: ChallengeConfig
  selectedIndex: number | null
  showHint: boolean
  hints: number
  matchSelected: string[]
  matchedPairs: Set<string>
  onSelect: (index: number) => void
  onMatchSelect: (item: string) => void
  onHint: () => void
  onSubmit: () => void
  onSkip: () => void
}) {
  const { t } = useLanguage()
  const isAttention = challenge.type === 'find-different'
  const isMatchPair = challenge.type === 'match-pair'
  const isTargetFind = challenge.type === 'target-find'

  // For match-pair: check if all pairs are matched
  const allPairsMatched =
    isMatchPair &&
    challenge.pairs &&
    matchedPairs.size >= challenge.pairs.length * 2

  return (
    <section className="flex flex-1 flex-col">
      {/* Prompt */}
      <h1 className="mt-3 text-center text-3xl font-bold text-foreground">
        {challenge.prompt}
      </h1>

      {/* Hint */}
      {showHint && (
        <p className="mx-auto mt-4 rounded-xl bg-primary/10 px-5 py-3 text-lg font-medium text-primary">
          {isAttention
            ? 'Look carefully at each shape.'
            : isMatchPair
              ? 'Tap two cards that go together.'
              : 'Look for what repeats or changes.'}
        </p>
      )}

      {/* Visual sequence display */}
      {!isAttention && !isMatchPair && !isTargetFind && challenge.sequence.length > 0 && (
        <div
          className="mx-auto mt-10 flex min-h-36 w-full max-w-3xl flex-wrap items-center justify-center gap-3 rounded-xl border border-border bg-card p-6"
          aria-label="Visual sequence"
        >
          {challenge.sequence.map((item, i) => (
            <span
              key={`${item}-${i}`}
              className="flex size-16 items-center justify-center rounded-xl bg-secondary text-4xl font-bold text-foreground"
            >
              {item}
            </span>
          ))}
          <span className="flex size-16 items-center justify-center rounded-xl border-2 border-dashed border-primary bg-primary/10 text-4xl font-bold text-primary">
            ?
          </span>
        </div>
      )}

      {/* Find Different grid */}
      {isAttention && challenge.grid && (
        <div
          className="mx-auto mt-10 grid w-full max-w-md gap-3"
          style={{
            gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(challenge.grid.length))}, 1fr)`,
          }}
        >
          {challenge.grid.map((item, i) => {
            const isChosen = selectedIndex === i
            return (
              <button
                key={i}
                onClick={() => onSelect(i)}
                aria-pressed={isChosen}
                className={`flex aspect-square cursor-pointer items-center justify-center rounded-xl border-2 text-3xl transition-colors duration-150 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                  isChosen
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-card hover:border-primary/40 hover:bg-accent'
                }`}
              >
                {item}
                {isChosen && (
                  <Check className="absolute right-2 top-2 size-5 text-primary" />
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Target Find display */}
      {isTargetFind && challenge.targetItems && (
        <div className="mx-auto mt-10 flex flex-wrap items-center justify-center gap-4 rounded-xl border border-border bg-card p-6">
          {challenge.targetItems.map((item, i) => (
            <span
              key={i}
              className="flex size-16 items-center justify-center rounded-xl bg-secondary text-3xl"
            >
              {item}
            </span>
          ))}
        </div>
      )}

      {/* Match Pair */}
      {isMatchPair && challenge.pairs && (
        <div className="mx-auto mt-10 grid w-full max-w-md grid-cols-4 gap-3">
          {challenge.options.map((item) => {
            const isMatched = matchedPairs.has(item)
            const isSelected = matchSelected.includes(item)
            return (
              <button
                key={item}
                onClick={() => onMatchSelect(item)}
                disabled={isMatched}
                aria-pressed={isSelected}
                className={`flex h-20 cursor-pointer items-center justify-center rounded-xl border-2 text-3xl transition-colors duration-150 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-40 ${
                  isMatched
                    ? 'border-success bg-success/10'
                    : isSelected
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-card hover:border-primary/40 hover:bg-accent'
                }`}
              >
                {item}
              </button>
            )
          })}
        </div>
      )}

      {/* Multiple choice options (for most challenge types) */}
      {!isAttention && !isMatchPair && !isTargetFind && (
        <div
          className={`mx-auto mt-8 grid w-full max-w-3xl gap-4 ${
            challenge.type === 'quick-choice' ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-4'
          }`}
        >
          {challenge.options.map((option, optionIndex) => {
            const isSelected = selectedIndex === optionIndex
            return (
              <button
                key={`${option}-${optionIndex}`}
                onClick={() => onSelect(optionIndex)}
                aria-pressed={isSelected}
                aria-label={`Answer ${optionIndex + 1}: ${option}`}
                className="relative flex min-h-24 cursor-pointer items-center justify-center rounded-xl border-2 border-border bg-card text-4xl font-bold text-foreground transition-colors duration-150 hover:border-primary/40 hover:bg-accent active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-pressed:border-primary aria-pressed:bg-primary/10 aria-pressed:text-primary"
              >
                {option}
                {isSelected && (
                  <Check className="absolute right-2 top-2 size-5 text-primary" />
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Buttons */}
      <div className="mx-auto mt-auto flex w-full max-w-3xl flex-col gap-3 pt-8 sm:flex-row">
        <Button
          variant="outline"
          size="lg"
          className="text-lg"
          onClick={onHint}
          disabled={showHint}
        >
          <Lightbulb data-icon="inline-start" />
          {t('hint')} {hints > 0 ? `(${hints})` : ''}
        </Button>
        <Button variant="ghost" size="lg" className="text-lg" onClick={onSkip}>
          {t('skip')}
        </Button>
        <Button
          size="lg"
          className="flex-1 text-lg"
          onClick={onSubmit}
          disabled={
            !isMatchPair &&
            !isTargetFind &&
            selectedIndex === null
          }
        >
          {isMatchPair
            ? allPairsMatched
              ? t('check_answer')
              : `${matchedPairs.size / 2} / ${challenge.pairs?.length ?? 0} matched`
            : t('check_answer')}
        </Button>
      </div>
    </section>
  )
}

// ─── Feedback ───────────────────────────────────────────────────

function Feedback({
  correct,
  skipped,
  last,
  onNext,
}: {
  correct: boolean
  skipped: boolean
  last: boolean
  onNext: () => void
}) {
  const { t } = useLanguage()

  return (
    <section className="flex flex-1 flex-col items-center justify-center text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Check className="size-10" />
      </div>

      <h1 className="mt-6 text-3xl font-bold text-foreground">
        {skipped
          ? t('thats_okay')
          : correct
            ? t('thats_right')
            : t('nice_try')}
      </h1>

      {!correct && !skipped && (
        <p className="mt-3 text-xl text-muted-foreground">
          Keep trying — you are doing well.
        </p>
      )}

      <Button
        size="lg"
        className="mt-9 min-h-16 w-full max-w-sm text-xl"
        onClick={onNext}
      >
        {last ? t('see_results') : t('next_question')}
      </Button>
    </section>
  )
}
