/**
 * Pattern & Attention Game
 *
 * Five questions: show pattern → select answer → feedback → next.
 * Supports daily and practice modes via `mode` prop.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useLanguage } from '@/lib/i18n/language-context'
import { useAuth } from '@/lib/supabase/auth-context'
import { ArrowLeft } from 'lucide-react'
import { computeNextDifficulty, getStartingDifficulty, type DifficultyLevel } from '@/lib/games/adaptive-engine'
import { saveGameSession, getRecentSessions } from '@/lib/repositories/game-session'
import { toast } from 'sonner'
import { getPatternQuestions } from '@/features/games/data/patterns'
import { ExitDialog } from '@/features/games/ExitDialog'
import type { GameMode, PatternQuestionConfig } from '@/features/games/types'

type Phase = 'intro' | 'question' | 'feedback' | 'final-result' | 'daily-complete'

const TOTAL_QUESTIONS = 5

export function PatternGame() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const mode: GameMode = searchParams.get('mode') === 'daily' ? 'daily' : 'practice'

  const [difficulty, setDifficulty] = useState<DifficultyLevel>(1)
  const [difficultyLoaded, setDifficultyLoaded] = useState(false)
  const [phase, setPhase] = useState<Phase>('intro')
  const [questions, setQuestions] = useState<PatternQuestionConfig[]>([])
  const [qIndex, setQIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [startTime, setStartTime] = useState(0)
  const [exitOpen, setExitOpen] = useState(false)

  const feedbackRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hintRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (feedbackRef.current) clearTimeout(feedbackRef.current)
      if (hintRef.current) clearTimeout(hintRef.current)
    }
  }, [])

  useEffect(() => {
    async function load() {
      if (!user?.id) { setDifficulty(getStartingDifficulty()); setDifficultyLoaded(true); return }
      const sessions = await getRecentSessions(user.id, 'pattern', 5)
      if (sessions.length > 0) {
        const d = computeNextDifficulty(getStartingDifficulty(), sessions)
        setDifficulty(d.newDifficulty)
      }
      setDifficultyLoaded(true)
    }
    load()
  }, [user?.id])

  const startGame = useCallback(() => {
    const qs = getPatternQuestions(difficulty, TOTAL_QUESTIONS)
    setQuestions(qs)
    setQIndex(0)
    setSelectedAnswer(null)
    setIsCorrect(null)
    setCorrectCount(0)
    setHintsUsed(0)
    setShowHint(false)
    setStartTime(Date.now())
    setPhase('question')
  }, [difficulty])

  const submitAnswer = (answer: string) => {
    if (selectedAnswer !== null) return
    setSelectedAnswer(answer)
    const q = questions[qIndex]
    if (!q) return
    const correct = answer === q.answer
    setIsCorrect(correct)
    if (correct) setCorrectCount(c => c + 1)
    setPhase('feedback')
  }

  const nextQuestion = () => {
    if (qIndex + 1 >= TOTAL_QUESTIONS) {
      const totalTime = Date.now() - startTime
      if (user?.id) {
        saveGameSession({
          patientId: user.id,
          gameType: 'pattern',
          difficultyLevel: difficulty,
          correctCount,
          totalCount: TOTAL_QUESTIONS,
          responseTimeMs: totalTime,
          hintsUsed,
        })
        if (!navigator.onLine) {
          toast.info('Score saved on this device', { duration: 3000 })
        }
      }
      setPhase('final-result')
    } else {
      setQIndex(i => i + 1)
      setSelectedAnswer(null)
      setIsCorrect(null)
      setShowHint(false)
      setPhase('question')
    }
  }

  const useHint = () => {
    setHintsUsed(h => h + 1)
    setShowHint(true)
    if (hintRef.current) clearTimeout(hintRef.current)
    hintRef.current = setTimeout(() => { setShowHint(false); hintRef.current = null }, 3000)
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

  const goHome = () => navigate('/patient', { replace: true })
  const goToActivities = () => navigate('/patient/games', { replace: true })

  const accuracy = TOTAL_QUESTIONS > 0 ? Math.round((correctCount / TOTAL_QUESTIONS) * 100) : 0
  const currentQ = questions[qIndex]

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
              Question {qIndex + 1} of {TOTAL_QUESTIONS}
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

            <h1 className="mb-8 text-[2.25rem] font-bold text-foreground">Pattern &amp; Attention</h1>
            <button
              onClick={startGame}
              className="h-14 w-full max-w-sm rounded-xl bg-primary px-8 text-lg font-semibold text-primary-foreground transition-colors duration-150 hover:bg-primary/90 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              Start Game
            </button>
          </div>
        )}

        {/* ══ QUESTION ══════════════════════════════════════════ */}
        {phase === 'question' && currentQ && (
          <div className="flex flex-1 flex-col">
            {/* Progress bar */}
            <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-border">
              <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${(qIndex / TOTAL_QUESTIONS) * 100}%` }} />
            </div>

            <h2 className="mb-8 text-center text-[1.5rem] font-bold text-foreground">What comes next?</h2>

            {showHint && (
              <div className="mb-4 rounded-xl bg-primary/10 p-3 text-center text-sm font-medium text-primary">
                Look for what repeats. The answer follows the pattern.
              </div>
            )}

            {/* Pattern display */}
            <div className="mb-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4" aria-label="Pattern sequence">
              {currentQ.sequence.map((item, i) => (
                <span key={i} className="text-4xl sm:text-5xl">{item}</span>
              ))}
              <span className="text-4xl sm:text-5xl opacity-50" aria-hidden="true">?</span>
            </div>

            {/* Answer options */}
            <div className="grid grid-cols-3 gap-4">
              {currentQ.options.map(opt => {
                const isSel = selectedAnswer === opt
                return (
                  <button
                    key={opt}
                    onClick={() => submitAnswer(opt)}
                    disabled={selectedAnswer !== null}
                    className={`flex h-20 items-center justify-center rounded-xl border-2 text-4xl transition-colors duration-150 cursor-pointer
                      focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring
                      ${isSel
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-card hover:border-primary/40 hover:bg-accent/50 disabled:opacity-60 disabled:cursor-not-allowed'
                      }`}
                    aria-label={`Option: ${opt}`}
                  >
                    {opt}
                  </button>
                )
              })}
            </div>

            <div className="mt-auto pt-6">
              <button
                onClick={useHint}
                disabled={showHint}
                className="h-12 w-full rounded-xl border border-border bg-card text-sm font-medium text-muted-foreground transition-colors duration-150 hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                Need a hint? ({hintsUsed})
              </button>
            </div>
          </div>
        )}

        {/* ══ FEEDBACK ══════════════════════════════════════════ */}
        {phase === 'feedback' && currentQ && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <h2 className="mb-3 text-[1.75rem] font-bold text-foreground">
              {isCorrect ? 'That\u2019s right.' : 'Nice try.'}
            </h2>
            {!isCorrect && (
              <p className="mb-8 text-lg text-muted-foreground">
                The answer was <span className="font-semibold text-foreground">{currentQ.answer}</span>.
              </p>
            )}
            {isCorrect && <div className="mb-8" aria-hidden="true" />}

            <button
              onClick={nextQuestion}
              className="h-14 w-full max-w-sm rounded-xl bg-primary px-8 text-lg font-semibold text-primary-foreground transition-colors duration-150 hover:bg-primary/90 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {qIndex + 1 >= TOTAL_QUESTIONS ? 'See Results' : 'Next Pattern'}
            </button>
          </div>
        )}

        {/* ══ FINAL RESULT ══════════════════════════════════════ */}
        {phase === 'final-result' && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <h1 className="mb-3 text-[2.25rem] font-bold text-foreground">Pattern &amp; Attention Complete</h1>
            <p className="mb-8 text-xl font-semibold text-primary">{accuracy}% accuracy</p>

            <div className="flex w-full max-w-sm flex-col gap-3">
              {mode === 'daily' ? (
                <button
                  onClick={() => setPhase('daily-complete')}
                  className="h-14 rounded-xl bg-primary px-8 text-lg font-semibold text-primary-foreground transition-colors duration-150 hover:bg-primary/90 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  Finish Today&apos;s Activity
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
                onClick={startGame}
                className="h-12 rounded-xl border-2 border-border bg-card px-8 text-base font-semibold text-foreground transition-colors duration-150 hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                Play Again
              </button>
            </div>
          </div>
        )}

        {/* ══ DAILY COMPLETE ═══════════════════════════════════ */}
        {phase === 'daily-complete' && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <h1 className="mb-8 text-[2.25rem] font-bold text-foreground">All done for today.</h1>
            <button
              onClick={goHome}
              className="h-14 w-full max-w-sm rounded-xl bg-primary px-8 text-lg font-semibold text-primary-foreground transition-colors duration-150 hover:bg-primary/90 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Return Home
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
