/**
 * Attention Adventure V2 — 7 challenge types in a coherent game world.
 *
 * 1. Garden Search — find all flowers in illustrated scene
 * 2. Find What Changed — spot changes in a scene
 * 3. Odd One Out — polished visual grid
 * 4. Matching Pairs — card memory board
 * 5. Follow the Rule — rule switching
 * 6. Complete the Story — visual sequences
 * 7. Quick Find — quick identification
 *
 * Uses deterministic seeded variation for session variety.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Check, Grid3X3, Lightbulb } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { GameShell } from '@/features/games/engine/GameShell'
import { GameIntro } from '@/features/games/engine/GameIntro'
import { FinalResult } from '@/features/games/engine/FinalResult'
import { TelemetryTracker } from '@/features/games/engine/telemetry'
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
import { sessionSeed } from '@/lib/games/seeded-random'

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
  // Target-find state
  const [targetFindSelected, setTargetFindSelected] = useState<Set<number>>(new Set())

  // Rule-switch state
  const [ruleSwitchIndex, setRuleSwitchIndex] = useState(0)
  const [currentPrompt, setCurrentPrompt] = useState('')

  // Find-what-changed state
  const [showingBefore, setShowingBefore] = useState(true)

  // Challenges ref
  const challengesRef = useRef<ChallengeConfig[]>([])

  // Session
  const collectorRef = useRef(new AttentionMetricsCollector())
  const telemetryRef = useRef(new TelemetryTracker())

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

  // Keep ref in sync
  useEffect(() => {
    challengesRef.current = challenges
  }, [challenges])

  // ── Helpers ──
  const beginChallenge = useCallback((nextIndex: number) => {
    setIndex(nextIndex)
    setSelectedIndex(null)
    setChanges(0)
    setHints(0)
    setShowHint(false)
    setMatchSelected([])
    setMatchedPairs(new Set())
    setTargetFindSelected(new Set())
    setRuleSwitchIndex(0)
    setShowingBefore(true)

    const c = challengesRef.current[nextIndex]
    if (c?.type === 'rule-switch' && c.ruleChanges) {
      setCurrentPrompt(c.ruleChanges.from)
    } else if (c) {
      setCurrentPrompt(c.prompt)
    }

    telemetryRef.current.start(difficulty, c?.type ?? 'unknown')
    setPhase('challenge')
  }, [difficulty])

  // ── Start Game ──
  const startGame = () => {
    const seed = sessionSeed()
    const pool = getSessionChallenges(difficulty, TOTAL_CHALLENGES, seed)
    setChallenges(pool)
    challengesRef.current = pool
    setMetrics([])
    collectorRef.current.reset()
    telemetryRef.current.reset()
    beginChallenge(0)
  }

  const current = challenges[index]

  // ── Selection ──
  const selectAnswer = (answerIndex: number) => {
    telemetryRef.current.recordInteraction()
    if (selectedIndex !== null && selectedIndex !== answerIndex)
      setChanges((v) => v + 1)
    setSelectedIndex(answerIndex)
  }

  const useHint = () => {
    telemetryRef.current.recordHint()
    setHints((v) => v + 1)
    setShowHint(true)
  }

  // ── Target Find toggle ──
  const toggleTargetFind = (itemIndex: number) => {
    telemetryRef.current.recordInteraction()
    setTargetFindSelected((prev) => {
      const next = new Set(prev)
      if (next.has(itemIndex)) next.delete(itemIndex)
      else next.add(itemIndex)
      return next
    })
    setChanges((v) => v + 1)
  }

  // ── Rule Switch ──
  const handleRuleSwitchAnswer = (answerIndex: number) => {
    telemetryRef.current.recordInteraction()
    if (selectedIndex !== null && selectedIndex !== answerIndex)
      setChanges((v) => v + 1)
    setSelectedIndex(answerIndex)

    if (!current?.ruleChanges) return
    const newRuleIdx = ruleSwitchIndex + 1
    if (newRuleIdx >= (current.ruleChanges.changeAt ?? 2)) {
      setCurrentPrompt(current.ruleChanges.to)
    }
    setRuleSwitchIndex(newRuleIdx)
  }

  // ── Match pair handlers ──
  const handleMatchSelect = (item: string) => {
    if (!current) return
    telemetryRef.current.recordInteraction()
    if (matchedPairs.has(item)) return

    const next = [...matchSelected, item]
    setMatchSelected(next)
    setChanges((v) => v + 1)

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
      setTimeout(() => setMatchSelected([]), 400)
    }
  }

  // ── Find What Changed — auto-advance after viewing "before" ──
  useEffect(() => {
    if (phase === 'challenge' && current?.type === 'find-different' && current.beforeItems && showingBefore) {
      const timer = setTimeout(() => setShowingBefore(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [phase, current, showingBefore])

  // ── Record Challenge ──
  const recordChallenge = (completionState: 'completed' | 'skipped') => {
    if (!current) return

    let isCorrect = false
    if (completionState === 'completed') {
      if (current.type === 'match-pair') {
        const totalPairs = current.pairs?.length ?? 0
        isCorrect = matchedPairs.size / 2 >= totalPairs
      } else if (current.type === 'target-find') {
        const targets = current.targetIndices ?? []
        const selected = [...targetFindSelected]
        const correctTargets = selected.filter((i) => targets.includes(i)).length
        isCorrect = correctTargets === targets.length && selected.length === targets.length
      } else if (current.type === 'rule-switch') {
        isCorrect = selectedIndex !== null && current.options[selectedIndex] === current.answer
      } else {
        isCorrect =
          selectedIndex !== null &&
          current.options[selectedIndex] === current.answer
      }
    }

    const record = completionState === 'skipped'
      ? telemetryRef.current.skip()
      : telemetryRef.current.complete(isCorrect, isCorrect ? 100 : 0)

    const metric: ChallengeMetric = {
      challengeId: current.id,
      challengeType: current.type,
      correct: isCorrect,
      responseTimeMs: record.completionTimeMs,
      timeToFirstInteractionMs: record.timeToFirstInteractionMs,
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
      ? t('v2_result_excellent')
      : accuracy >= 50
        ? t('v2_result_practise')
        : t('v2_result_great')

  const goBack = useCallback(() => {
    navigate(mode === 'daily' ? '/patient' : '/patient/games')
  }, [navigate, mode])

  if (!ready) {
    return (
      <div className="patient-ui flex min-h-screen items-center justify-center bg-background">
        <p className="text-xl text-muted-foreground">{t('loading_activity')}</p>
      </div>
    )
  }

  return (
    <GameShell
      totalSteps={TOTAL_CHALLENGES}
      currentStep={index}
      showHeader={phase !== 'intro' && phase !== 'final-result' && phase !== 'daily-complete'}
      celebrate={phase === 'final-result' && (accuracy >= 50 || mode === 'daily')}
      onBack={() => navigate(mode === 'daily' ? '/patient' : '/patient/games')}
    >
      {phase === 'intro' && (
        <GameIntro
          icon={Grid3X3}
          title="Attention & Pattern Adventure"
          description={t('attention_adventure_desc')}
          backLabel={mode === 'daily' ? t('home') : t('activities')}
          onBack={goBack}
          onStart={startGame}
        />
      )}

      {phase === 'challenge' && current && (
        <ChallengeView
          challenge={current}
          selectedIndex={selectedIndex}
          currentPrompt={currentPrompt}
          showHint={showHint}
          hints={hints}
          matchSelected={matchSelected}
          matchedPairs={matchedPairs}
          targetFindSelected={targetFindSelected}
          showingBefore={showingBefore}
          onSelect={current.type === 'rule-switch' ? handleRuleSwitchAnswer : selectAnswer}
          onMatchSelect={handleMatchSelect}
          onTargetFindToggle={toggleTargetFind}
          onHint={useHint}
          onSubmit={() => recordChallenge('completed')}
          onSkip={() => recordChallenge('skipped')}
        />
      )}

      {phase === 'feedback' && current && (
        <Feedback
          correct={correct}
          skipped={metrics[metrics.length - 1]?.skipped ?? false}
          last={index + 1 >= TOTAL_CHALLENGES}
          onNext={nextChallenge}
        />
      )}

      {phase === 'final-result' && (
        <FinalResult
          title="Pattern & Attention"
          roundsCompleted={metrics.length}
          totalRounds={TOTAL_CHALLENGES}
          accuracy={accuracy}
          message={encouragingMessage}
          onContinue={mode === 'daily' ? () => setPhase('daily-complete') : undefined}
          onActivities={mode === 'practice' ? () => navigate('/patient/games') : undefined}
          onAgain={startGame}
          continueLabel={t('finish_today')}
        />
      )}

      {phase === 'daily-complete' && (
        <section className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Check className="size-10" />
          </div>
          <h1 className="mt-6 text-[2.5rem] font-bold text-foreground">{t('daily_complete')}</h1>
          <p className="mt-3 text-xl text-muted-foreground">{t('daily_complete_message')}</p>
          <Button size="lg" className="mt-9 min-h-16 w-full max-w-sm text-xl" onClick={() => navigate('/patient')}>
            {t('return_home')}
          </Button>
        </section>
      )}
    </GameShell>
  )
}

// ─── Challenge View ─────────────────────────────────────────────

function ChallengeView({
  challenge, selectedIndex, currentPrompt, showHint, hints,
  matchSelected, matchedPairs, targetFindSelected, showingBefore,
  onSelect, onMatchSelect, onTargetFindToggle, onHint, onSubmit, onSkip,
}: {
  challenge: ChallengeConfig; selectedIndex: number | null; currentPrompt: string
  showHint: boolean; hints: number; matchSelected: string[]; matchedPairs: Set<string>
  targetFindSelected: Set<number>; showingBefore: boolean
  onSelect: (index: number) => void; onMatchSelect: (item: string) => void
  onTargetFindToggle: (index: number) => void
  onHint: () => void; onSubmit: () => void; onSkip: () => void
}) {
  const { t } = useLanguage()
  const isOddOneOut = challenge.type === 'find-different' && !challenge.beforeItems
  const isFindChanged = challenge.type === 'find-different' && Boolean(challenge.beforeItems)
  const isMatchPair = challenge.type === 'match-pair'
  const isTargetFind = challenge.type === 'target-find'

  const allPairsMatched =
    isMatchPair && challenge.pairs && matchedPairs.size >= challenge.pairs.length * 2

  return (
    <section className="flex flex-1 flex-col">
      <h1 className="mt-3 text-center text-3xl font-bold text-foreground">{currentPrompt}</h1>

      {showHint && (
        <p className="mx-auto mt-4 rounded-xl bg-primary/10 px-5 py-3 text-lg font-medium text-primary">
          {challenge.type === 'find-different'
            ? isFindChanged ? t('hint_find_changed') : t('hint_odd_one')
            : challenge.type === 'match-pair'
              ? t('hint_match_pair')
              : challenge.type === 'target-find'
                ? t('hint_garden_search')
                : challenge.type === 'rule-switch'
                  ? t('hint_rule_switch')
                  : challenge.type === 'visual-sequence'
                    ? t('hint_visual_sequence')
                    : t('hint_quick_find')}
        </p>
      )}

      {/* Visual sequence */}
      {!isOddOneOut && !isFindChanged && !isMatchPair && !isTargetFind && challenge.sequence.length > 0 && (
        <div className="mx-auto mt-10 flex min-h-36 w-full max-w-3xl flex-wrap items-center justify-center gap-3 rounded-2xl border border-border bg-card p-6 shadow-sm" aria-label="Visual sequence">
          {challenge.sequence.map((item, i) => (
            <span key={`${item}-${i}`} className="flex size-16 items-center justify-center rounded-xl bg-secondary text-4xl font-bold text-foreground">{item}</span>
          ))}
          <span className="flex size-16 items-center justify-center rounded-xl border-2 border-dashed border-primary bg-primary/10 text-4xl font-bold text-primary">?</span>
        </div>
      )}

      {/* Find What Changed — before/after scene */}
      {isFindChanged && (
        <div className="mx-auto mt-8 w-full max-w-lg">
          {showingBefore ? (
            <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-b from-card to-primary/5 p-6 shadow-md">
              <p className="mb-4 text-center text-sm font-medium text-muted-foreground">Look carefully at this scene...</p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                {(challenge.beforeItems ?? challenge.grid ?? []).map((item, i) => (
                  <span key={i} className="flex size-16 items-center justify-center rounded-xl bg-card border border-border/50 text-3xl shadow-sm">{item}</span>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-border bg-card p-6 shadow-sm">
              <p className="mb-4 text-center text-sm font-medium text-primary">What is different now?</p>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {(challenge.afterItems ?? challenge.grid ?? []).map((item, i) => {
                  const isChosen = selectedIndex === i
                  return (
                    <button key={i} onClick={() => onSelect(i)} aria-pressed={isChosen}
                      className={`relative flex aspect-square cursor-pointer items-center justify-center rounded-xl border-2 text-3xl transition-all duration-150 shadow-sm active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                        isChosen ? 'border-primary bg-primary/10 shadow-md' : 'border-border bg-card hover:border-primary/40 hover:bg-accent hover:shadow-sm'
                      }`}>
                      {item}
                      {isChosen && <Check className="absolute right-2 top-2 size-5 text-primary" />}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Find Different grid (Odd One Out) */}
      {isOddOneOut && challenge.grid && (
        <div className="mx-auto mt-10 grid w-full max-w-md gap-3"
          style={{ gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(challenge.grid.length))}, 1fr)` }}>
          {challenge.grid.map((item, i) => {
            const isChosen = selectedIndex === i
            return (
              <button key={i} onClick={() => onSelect(i)} aria-pressed={isChosen}
                className={`relative flex aspect-square cursor-pointer items-center justify-center rounded-2xl border-2 text-3xl shadow-sm transition-all duration-150 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                  isChosen ? 'border-primary bg-primary/10 shadow-md' : 'border-border bg-card hover:border-primary/40 hover:bg-accent hover:shadow-sm'
                }`}>
                {item}
                {isChosen && <Check className="absolute right-2 top-2 size-5 text-primary" />}
              </button>
            )
          })}
        </div>
      )}

      {/* Target Find — toggleable items (Garden Search) */}
      {isTargetFind && challenge.targetItems && (
        <div className="mx-auto mt-10 flex flex-wrap items-center justify-center gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
          {challenge.targetItems.map((item, i) => {
            const isSelected = targetFindSelected.has(i)
            return (
              <button key={i} onClick={() => onTargetFindToggle(i)} aria-pressed={isSelected}
                className={`relative flex size-16 cursor-pointer items-center justify-center rounded-xl border-2 text-3xl shadow-sm transition-all duration-150 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                  isSelected ? 'border-primary bg-primary/10 shadow-md' : 'border-transparent bg-secondary hover:border-primary/30 hover:shadow-sm'
                }`}>
                {item}
                {isSelected && <Check className="absolute -right-1 -top-1 size-4 text-primary" />}
              </button>
            )
          })}
        </div>
      )}

      {/* Match Pair */}
      {isMatchPair && challenge.pairs && (
        <div className="mx-auto mt-10 grid w-full max-w-md grid-cols-4 gap-3">
          {challenge.options.map((item) => {
            const isMatched = matchedPairs.has(item)
            const isSelected = matchSelected.includes(item)
            return (
              <button key={item} onClick={() => onMatchSelect(item)} disabled={isMatched} aria-pressed={isSelected}
                className={`relative flex h-20 cursor-pointer items-center justify-center rounded-2xl border-2 text-3xl shadow-sm transition-all duration-150 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-40 ${
                  isMatched ? 'border-success bg-success/10 shadow-md' : isSelected ? 'border-primary bg-primary/10 shadow-md' : 'border-border bg-card hover:border-primary/40 hover:bg-accent hover:shadow-sm'
                }`}>
                {item}
                {isMatched && <Check className="absolute right-1 top-1 size-4 text-success" />}
              </button>
            )
          })}
        </div>
      )}

      {/* Multiple choice (for rule-switch, sequence-completion, quick-choice, etc.) */}
      {!isOddOneOut && !isFindChanged && !isMatchPair && !isTargetFind && (
        <div className="mx-auto mt-8 grid w-full max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
          {challenge.options.map((option, optionIndex) => {
            const isSelected = selectedIndex === optionIndex
            return (
              <button key={`${option}-${optionIndex}`} onClick={() => onSelect(optionIndex)}
                aria-pressed={isSelected} aria-label={`Answer ${optionIndex + 1}: ${option}`}
                className="relative flex min-h-24 cursor-pointer items-center justify-center rounded-2xl border-2 border-border bg-card text-4xl font-bold text-foreground shadow-sm transition-all duration-150 hover:border-primary/40 hover:bg-accent hover:shadow-md active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-pressed:border-primary aria-pressed:bg-primary/10 aria-pressed:text-primary aria-pressed:shadow-md">
                {option}
                {isSelected && <Check className="absolute right-2 top-2 size-5 text-primary" />}
              </button>
            )
          })}
        </div>
      )}

      <div className="mx-auto mt-auto flex w-full max-w-3xl flex-col gap-3 pt-8 sm:flex-row">
        <Button variant="outline" size="lg" className="text-lg" onClick={onHint} disabled={showHint}>
          <Lightbulb data-icon="inline-start" />{t('hint')} {hints > 0 ? `(${hints})` : ''}
        </Button>
        <Button variant="ghost" size="lg" className="text-lg" onClick={onSkip}>{t('skip')}</Button>
        <Button size="lg" className="flex-1 text-lg" onClick={onSubmit}
          disabled={
            isMatchPair
              ? !allPairsMatched
              : isTargetFind
                ? targetFindSelected.size === 0
                : isFindChanged && showingBefore
                  ? true
                  : selectedIndex === null
          }>
          {isMatchPair
            ? allPairsMatched ? t('check_answer') : `${matchedPairs.size / 2} / ${challenge.pairs?.length ?? 0} matched`
            : isTargetFind
              ? targetFindSelected.size > 0 ? `${targetFindSelected.size} selected` : t('check_answer')
              : isFindChanged && showingBefore
                ? 'Looking...'
                : t('check_answer')}
        </Button>
      </div>
    </section>
  )
}

// ─── Feedback ───────────────────────────────────────────────────

function Feedback({ correct, skipped, last, onNext }: {
  correct: boolean; skipped: boolean; last: boolean; onNext: () => void
}) {
  const { t } = useLanguage()
  return (
    <section className="flex flex-1 flex-col items-center justify-center text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Check className="size-10" />
      </div>
      <h1 className="mt-6 text-3xl font-bold text-foreground">
        {skipped ? t('thats_okay') : correct ? t('thats_right') : t('nice_try')}
      </h1>
      {!correct && !skipped && (
        <p className="mt-3 text-xl text-muted-foreground">{t('nice_try')}</p>
      )}
      <Button size="lg" className="mt-9 min-h-16 w-full max-w-sm text-xl" onClick={onNext}>
        {last ? t('see_results') : t('next_question')}
      </Button>
    </section>
  )
}
