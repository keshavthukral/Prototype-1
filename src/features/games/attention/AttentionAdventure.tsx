/**
 * Attention Adventure — Session controller.
 *
 * Generates a 7-task session from four cognitive task types,
 * dispatches each to its own task component, collects metrics,
 * and shows the final result.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Check, Grid3X3, Zap, Search, ArrowUpDown, ListOrdered, Sparkles, ThumbsUp, Heart } from 'lucide-react'
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
import { cn } from '@/lib/utils'

// ── Task components ──
import { TrailConnect } from '@/features/games/attention/tasks/TrailConnect'
import { Cancellation } from '@/features/games/attention/tasks/Cancellation'
import { RuleSwitch } from '@/features/games/attention/tasks/RuleSwitch'
import { EverydaySequence } from '@/features/games/attention/tasks/EverydaySequence'

// ─── Types ──────────────────────────────────────────────────────

type Phase = 'intro' | 'challenge' | 'feedback' | 'final-result' | 'daily-complete'

const TOTAL_CHALLENGES = 7

/** Human-readable label for each challenge type */
const CHALLENGE_LABELS: Record<string, string> = {
  'trail-connect': 'Trail Connect',
  'cancellation': 'Cancellation',
  'rule-switch': 'Rule Switch',
  'everyday-sequence': 'Everyday Sequence',
}

// ─── Main Component ─────────────────────────────────────────────

export function AttentionAdventure() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useLanguage()
  const [searchParams] = useSearchParams()
  const mode: GameMode =
    searchParams.get('mode') === 'daily' ? 'daily' : 'practice'

  // ── Session state ──
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(1)
  const [ready, setReady] = useState(false)
  const [phase, setPhase] = useState<Phase>('intro')
  const [index, setIndex] = useState(0)
  const [challenges, setChallenges] = useState<ChallengeConfig[]>([])
  const [metrics, setMetrics] = useState<ChallengeMetric[]>([])
  const [correct, setCorrect] = useState(false)

  // Session collector
  const collectorRef = useRef(new AttentionMetricsCollector())

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

  // ── Start Game ──
  const startGame = () => {
    const pool = getSessionChallenges(difficulty, TOTAL_CHALLENGES)
    setChallenges(pool)
    setMetrics([])
    setIndex(0)
    collectorRef.current.reset()
    setPhase('challenge')
  }

  // ── Challenge complete handler (called by task components) ──
  const handleChallengeComplete = useCallback((metric: ChallengeMetric) => {
    collectorRef.current.addChallenge(metric)
    setMetrics((prev) => [...prev, metric])
    setCorrect(metric.correct)
    setPhase('feedback')
  }, [])

  // ── Next Challenge ──
  const nextChallenge = useCallback(() => {
    if (index + 1 >= TOTAL_CHALLENGES) {
      persistAndFinish()
    } else {
      setIndex((i) => i + 1)
      setPhase('challenge')
    }
  }, [index])

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
  const current = challenges[index]
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
          title="Pattern & Attention"
          description="Short visual exercises to keep your mind active. Take your time with each one."
          backLabel={mode === 'daily' ? t('home') : t('activities')}
          onBack={goBack}
          onStart={startGame}
          duration="~5 minutes"
          preview={[
            { label: 'Connect numbers in order on a trail', icon: Zap },
            { label: 'Find hidden targets in a field of objects', icon: Search },
            { label: 'Answer Yes/No as the rule changes', icon: ArrowUpDown },
            { label: 'Put daily routine steps in the right order', icon: ListOrdered },
          ]}
        />
      )}

      {phase === 'challenge' && current && (
        <ChallengeDispatch
          challenge={current}
          difficulty={difficulty}
          onComplete={handleChallengeComplete}
        />
      )}

      {phase === 'feedback' && (
        <Feedback
          correct={correct}
          skipped={metrics[metrics.length - 1]?.skipped ?? false}
          last={index + 1 >= TOTAL_CHALLENGES}
          onNext={nextChallenge}
          challengeLabel={(current?.type ? CHALLENGE_LABELS[current.type] : undefined) ?? 'Task'}
          progress={`${index + 1} of ${TOTAL_CHALLENGES}`}
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
          roundBreakdown={metrics.map((m) => ({
            label: CHALLENGE_LABELS[m.challengeType] ?? m.challengeType,
            correct: m.correct ? 1 : 0,
            total: 1,
          }))}
        />
      )}

      {phase === 'daily-complete' && (
        <section className="flex flex-col items-center justify-center text-center px-4 py-12">
          <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Check className="size-9" />
          </div>
          <h1 className="mt-5 text-3xl font-bold text-foreground">{t('daily_complete')}</h1>
          <p className="mt-2 text-base text-muted-foreground">{t('daily_complete_message')}</p>
          <Button size="lg" className="mt-8 min-h-16 w-full max-w-sm text-lg" onClick={() => navigate('/patient')}>
            {t('return_home')}
          </Button>
        </section>
      )}
    </GameShell>
  )
}

// ─── Challenge Dispatch ─────────────────────────────────────────

function ChallengeDispatch({
  challenge,
  difficulty,
  onComplete,
}: {
  challenge: ChallengeConfig
  difficulty: DifficultyLevel
  onComplete: (metric: ChallengeMetric) => void
}) {
  switch (challenge.type) {
    case 'trail-connect':
      return (
        <TrailConnect
          config={challenge}
          difficulty={difficulty}
          onComplete={onComplete}
        />
      )
    case 'cancellation':
      return (
        <Cancellation
          config={challenge}
          difficulty={difficulty}
          onComplete={onComplete}
        />
      )
    case 'rule-switch':
      return (
        <RuleSwitch
          config={challenge}
          difficulty={difficulty}
          onComplete={onComplete}
        />
      )
    case 'everyday-sequence':
      return (
        <EverydaySequence
          config={challenge}
          difficulty={difficulty}
          onComplete={onComplete}
        />
      )
    default:
      return null
  }
}

// ─── Feedback ───────────────────────────────────────────────────

function Feedback({ correct, skipped, last, onNext, challengeLabel, progress }: {
  correct: boolean; skipped: boolean; last: boolean; onNext: () => void
  challengeLabel: string; progress: string
}) {
  const { t } = useLanguage()

  // Performance-based styling
  const Icon = skipped ? Heart : correct ? Sparkles : ThumbsUp
  const iconBg = skipped ? 'bg-amber-500/10' : correct ? 'bg-primary/15' : 'bg-emerald-500/10'
  const iconText = skipped ? 'text-amber-600' : correct ? 'text-primary' : 'text-emerald-600'

  return (
    <section className="flex flex-col items-center justify-center text-center px-4 py-12">
      <div className={cn('flex size-20 items-center justify-center rounded-2xl', iconBg, iconText)}>
        <Icon className="size-9" />
      </div>
      <h1 className="mt-5 text-2xl font-bold text-foreground">
        {skipped ? t('thats_okay') : correct ? t('thats_right') : t('nice_try')}
      </h1>
      <p className="mt-1.5 text-sm font-medium text-muted-foreground">
        {challengeLabel} · {progress}
      </p>
      {!correct && !skipped && (
        <p className="mt-3 text-base text-muted-foreground">Keep trying — you are doing well.</p>
      )}
      <Button size="lg" className="mt-8 min-h-16 w-full max-w-sm text-lg" onClick={onNext}>
        {last ? t('see_results') : t('next_task')}
      </Button>
    </section>
  )
}
