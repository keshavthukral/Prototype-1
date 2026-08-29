/**
 * Memory Recall Game
 *
 * Three rounds: memorise → recall → result.
 * Supports daily and practice modes via `mode` prop.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useLanguage } from '@/lib/i18n/language-context'
import { useAuth } from '@/lib/supabase/auth-context'
import { HearAgain } from '@/components/patient/hear-again'
import { ArrowLeft, Check } from 'lucide-react'
import { computeNextDifficulty, getStartingDifficulty, type DifficultyLevel } from '@/lib/games/adaptive-engine'
import { saveGameSession, getRecentSessions } from '@/lib/repositories/game-session'
import { toast } from 'sonner'
import { buildMemoryRound } from '@/features/games/data/objects'
import { ExitDialog } from '@/features/games/ExitDialog'
import type { GameMode, MemoryRoundConfig } from '@/features/games/types'
import { targetsCountForDifficulty } from '@/features/games/types'

type Phase = 'intro' | 'memorise' | 'recall' | 'round-result' | 'final-result'

const TOTAL_ROUNDS = 3

export function MemoryGame() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const mode: GameMode = searchParams.get('mode') === 'daily' ? 'daily' : 'practice'

  const [difficulty, setDifficulty] = useState<DifficultyLevel>(1)
  const [difficultyLoaded, setDifficultyLoaded] = useState(false)
  const [phase, setPhase] = useState<Phase>('intro')
  const [round, setRound] = useState(0)
  const [roundConfig, setRoundConfig] = useState<MemoryRoundConfig | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [roundCorrect, setRoundCorrect] = useState(0)
  const [viewTimeLeft, setViewTimeLeft] = useState(0)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [totalCorrect, setTotalCorrect] = useState(0)
  const [totalObjects, setTotalObjects] = useState(0)
  const [usedObjectIds, setUsedObjectIds] = useState<string[]>([])
  const [exitOpen, setExitOpen] = useState(false)

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const transitionRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hintRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current)
      if (transitionRef.current) clearTimeout(transitionRef.current)
      if (hintRef.current) clearTimeout(hintRef.current)
    }
  }, [])

  useEffect(() => {
    async function load() {
      if (!user?.id) { setDifficulty(getStartingDifficulty()); setDifficultyLoaded(true); return }
      const sessions = await getRecentSessions(user.id, 'memory', 5)
      if (sessions.length > 0) {
        const d = computeNextDifficulty(getStartingDifficulty(), sessions)
        setDifficulty(d.newDifficulty)
      }
      setDifficultyLoaded(true)
    }
    load()
  }, [user?.id])

  const startRound = useCallback(() => {
    const config = buildMemoryRound(difficulty, usedObjectIds)
    setRoundConfig(config)
    setSelected(new Set())
    setRoundCorrect(0)
    setHintsUsed(0)
    setShowHint(false)

    const viewTime = targetsCountForDifficulty(difficulty) <= 3 ? 6 : targetsCountForDifficulty(difficulty) <= 4 ? 7 : 8
    setViewTimeLeft(viewTime)
    setPhase('memorise')

    let remaining = viewTime
    countdownRef.current = setInterval(() => {
      remaining -= 1
      setViewTimeLeft(remaining)
      if (remaining <= 0 && countdownRef.current) {
        clearInterval(countdownRef.current)
        countdownRef.current = null
      }
    }, 1000)

    transitionRef.current = setTimeout(() => {
      setPhase('recall')
      transitionRef.current = null
    }, viewTime * 1000)
  }, [difficulty, usedObjectIds])

  const toggleChoice = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const useHint = () => {
    setHintsUsed(h => h + 1)
    setShowHint(true)
    if (hintRef.current) clearTimeout(hintRef.current)
    hintRef.current = setTimeout(() => { setShowHint(false); hintRef.current = null }, 3000)
  }

  const submitRecall = () => {
    if (!roundConfig) return
    const correct = roundConfig.targets.filter(t => selected.has(t.id)).length
    setRoundCorrect(correct)
    setTotalCorrect(c => c + correct)
    setTotalObjects(o => o + roundConfig.targets.length)
    setUsedObjectIds(ids => [...ids, ...roundConfig.targets.map(t => t.id)])
    setPhase('round-result')
  }

  const nextRound = () => {
    if (round + 1 >= TOTAL_ROUNDS) {
      if (user?.id) {
        const total = totalObjects + (roundConfig?.targets.length ?? 0)
        const correct = totalCorrect + roundCorrect
        saveGameSession({
          patientId: user.id,
          gameType: 'memory',
          difficultyLevel: difficulty,
          correctCount: correct,
          totalCount: total,
          responseTimeMs: 0,
          hintsUsed,
        })
        if (!navigator.onLine) {
          toast.info('Score saved on this device', { duration: 3000 })
        }
      }
      setPhase('final-result')
    } else {
      setRound(r => r + 1)
      startRound()
    }
  }

  const goBack = () => {
    if (phase === 'intro') {
      navigate(mode === 'daily' ? '/patient' : '/patient/games', { replace: true })
    } else {
      setExitOpen(true)
    }
  }

  const confirmLeave = () => {
    navigate(mode === 'daily' ? '/patient' : '/patient/games', { replace: true })
  }

  const continueToPattern = () => navigate(`/patient/game/pattern?mode=daily`, { replace: true })
  const goHome = () => navigate('/patient', { replace: true })
  const goToActivities = () => navigate('/patient/games', { replace: true })

  const accuracy = totalObjects > 0 ? Math.round((totalCorrect / totalObjects) * 100) : 0

  if (!difficultyLoaded) {
    return (
      <div className="patient-ui flex min-h-screen items-center justify-center bg-background">
        <p className="text-lg text-muted-foreground">{t('loading')}</p>
      </div>
    )
  }

  return (
    <div className="patient-ui flex min-h-screen flex-col bg-background">
      <ExitDialog open={exitOpen} onOpenChange={setExitOpen} onLeave={confirmLeave} />

      <main className="flex flex-1 flex-col px-6 pt-6 pb-8 sm:px-10">

        {/* Header bar (during game) */}
        {phase !== 'intro' && phase !== 'final-result' && (
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={goBack}
              className="flex h-12 items-center gap-2 rounded-lg px-2 text-base font-medium text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <ArrowLeft className="h-5 w-5" />
              Back
            </button>
            <span className="text-sm font-medium text-muted-foreground">
              Round {round + 1} of {TOTAL_ROUNDS}
            </span>
          </div>
        )}

        {/* ══ INTRO ═════════════════════════════════════════════ */}
        {phase === 'intro' && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <button
              onClick={goBack}
              className="absolute left-4 top-6 flex h-12 items-center gap-2 rounded-lg px-2 text-base font-medium text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground sm:left-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <ArrowLeft className="h-5 w-5" />
              {mode === 'daily' ? 'Home' : 'Activities'}
            </button>

            <h1 className="mb-8 text-[2.25rem] font-bold text-foreground">Memory Recall</h1>
            <button
              onClick={() => { setRound(0); setTotalCorrect(0); setTotalObjects(0); setUsedObjectIds([]); startRound() }}
              className="h-14 w-full max-w-sm rounded-xl bg-primary px-8 text-lg font-semibold text-primary-foreground transition-colors duration-150 hover:bg-primary/90 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              Start Game
            </button>
          </div>
        )}

        {/* ══ MEMORISE ══════════════════════════════════════════ */}
        {phase === 'memorise' && roundConfig && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <p className="mb-4 text-lg font-medium text-muted-foreground">Remember these objects.</p>
            <div className="mb-4 text-4xl font-bold tabular-nums text-primary">{viewTimeLeft}s</div>

            <div className={`grid w-full max-w-md gap-4 ${
              roundConfig.targets.length <= 3 ? 'grid-cols-3' :
              roundConfig.targets.length <= 4 ? 'grid-cols-2 sm:grid-cols-4' :
              'grid-cols-3'
            }`}>
              {roundConfig.targets.map(obj => (
                <div key={obj.id} className="flex flex-col items-center gap-2 rounded-xl border-2 border-border bg-card p-5">
                  <span className="text-5xl sm:text-6xl">{obj.emoji}</span>
                  <span className="text-base font-medium text-foreground">{obj.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ RECALL ════════════════════════════════════════════ */}
        {phase === 'recall' && roundConfig && (
          <div className="flex flex-1 flex-col">
            <h2 className="mb-2 text-center text-[1.5rem] font-bold text-foreground">Tap the objects you remember.</h2>
            <p className="mb-6 text-center text-sm text-muted-foreground">Select one or more, then submit.</p>

            {showHint && (
              <div className="mb-4 rounded-xl bg-primary/10 p-3 text-center text-sm font-medium text-primary">
                Think about what you saw. Take your time.
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
              {roundConfig.options.map(obj => {
                const sel = selected.has(obj.id)
                return (
                  <button
                    key={obj.id}
                    onClick={() => toggleChoice(obj.id)}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-colors duration-150 cursor-pointer
                      focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring
                      ${sel
                        ? 'border-primary bg-primary/10 shadow-sm'
                        : 'border-border bg-card hover:border-primary/40 hover:bg-accent/50'
                      }`}
                    aria-pressed={sel}
                  >
                    <span className="text-4xl sm:text-5xl">{obj.emoji}</span>
                    <span className="text-sm font-medium text-foreground">{obj.label}</span>
                    {sel && <Check className="h-5 w-5 text-primary" aria-label="Selected" />}
                  </button>
                )
              })}
            </div>

            <div className="mt-auto flex flex-col gap-3 pt-6">
              <button
                onClick={useHint}
                disabled={showHint}
                className="h-12 w-full rounded-xl border border-border bg-card text-sm font-medium text-muted-foreground transition-colors duration-150 hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                Need a hint? ({hintsUsed})
              </button>
              <button
                onClick={submitRecall}
                disabled={selected.size === 0}
                className="h-14 w-full rounded-xl bg-primary text-lg font-semibold text-primary-foreground transition-colors duration-150 hover:bg-primary/90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                Submit Answer
              </button>
            </div>
          </div>
        )}

        {/* ══ ROUND RESULT ══════════════════════════════════════ */}
        {phase === 'round-result' && roundConfig && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <h2 className="mb-3 text-[1.75rem] font-bold text-foreground">
              {roundCorrect === roundConfig.targets.length ? 'Well done.' : 'Good effort.'}
            </h2>
            <p className="mb-8 text-lg text-muted-foreground">
              {roundCorrect} of {roundConfig.targets.length} objects
            </p>
            <button
              onClick={nextRound}
              className="h-14 w-full max-w-sm rounded-xl bg-primary px-8 text-lg font-semibold text-primary-foreground transition-colors duration-150 hover:bg-primary/90 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {round + 1 >= TOTAL_ROUNDS ? 'See Results' : 'Next Round'}
            </button>
          </div>
        )}

        {/* ══ FINAL RESULT ══════════════════════════════════════ */}
        {phase === 'final-result' && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <h1 className="mb-3 text-[2.25rem] font-bold text-foreground">Memory Recall Complete</h1>
            <p className="mb-8 text-xl font-semibold text-primary">{accuracy}% accuracy</p>

            <div className="flex w-full max-w-sm flex-col gap-3">
              {mode === 'daily' ? (
                <button
                  onClick={continueToPattern}
                  className="h-14 rounded-xl bg-primary px-8 text-lg font-semibold text-primary-foreground transition-colors duration-150 hover:bg-primary/90 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  Continue to Pattern &amp; Attention
                </button>
              ) : (
                <button
                  onClick={goToActivities}
                  className="h-14 rounded-xl bg-primary px-8 text-lg font-semibold text-primary-foreground transition-colors duration-150 hover:bg-primary/90 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  Back to Activities
                </button>
              )}
              <button
                onClick={() => { setRound(0); setTotalCorrect(0); setTotalObjects(0); setUsedObjectIds([]); setPhase('intro') }}
                className="h-12 rounded-xl border-2 border-border bg-card px-8 text-base font-semibold text-foreground transition-colors duration-150 hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                Play Again
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
