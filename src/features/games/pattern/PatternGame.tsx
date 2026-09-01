import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Check, Grid3X3, Lightbulb } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Celebration } from '@/features/games/Celebration'
import { ExitDialog } from '@/features/games/ExitDialog'
import { getPatternQuestions } from '@/features/games/data/patterns'
import type { GameMode, PatternQuestionConfig } from '@/features/games/types'
import { computeNextDifficulty, getStartingDifficulty, type DifficultyLevel } from '@/lib/games/adaptive-engine'
import { getRecentSessions, saveGameSession, saveRichGameMetrics } from '@/lib/repositories/game-session'
import { useAuth } from '@/lib/supabase/auth-context'

type Phase = 'intro' | 'question' | 'feedback' | 'final-result' | 'daily-complete'
interface QuestionMetric { questionId: string; type: string; correct: boolean; responseTimeMs: number; timeBeforeFirstInteractionMs: number; changedAnswers: number; hints: number; difficulty: DifficultyLevel; completionState: 'completed' | 'skipped' }
const TOTAL_QUESTIONS = 6

export function PatternGame() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const mode: GameMode = searchParams.get('mode') === 'daily' ? 'daily' : 'practice'
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(1)
  const [ready, setReady] = useState(false)
  const [phase, setPhase] = useState<Phase>('intro')
  const [questions, setQuestions] = useState<PatternQuestionConfig[]>([])
  const [index, setIndex] = useState(0)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [correct, setCorrect] = useState(false)
  const [metrics, setMetrics] = useState<QuestionMetric[]>([])
  const [changedAnswers, setChangedAnswers] = useState(0)
  const [hints, setHints] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [exitOpen, setExitOpen] = useState(false)
  const questionStartedAt = useRef(0)
  const firstInteractionAt = useRef<number | null>(null)

  useEffect(() => {
    void (async () => {
      if (user?.id) {
        const recent = await getRecentSessions(user.id, 'pattern', 5)
        setDifficulty(recent.length ? computeNextDifficulty(recent[0]?.difficulty ?? 1, recent).newDifficulty : getStartingDifficulty())
      }
      setReady(true)
    })()
  }, [user?.id])

  const beginQuestion = useCallback((nextIndex: number) => {
    setIndex(nextIndex); setSelectedIndex(null); setChangedAnswers(0); setHints(0); setShowHint(false)
    questionStartedAt.current = performance.now(); firstInteractionAt.current = null; setPhase('question')
  }, [])

  const startGame = () => { setQuestions(getPatternQuestions(difficulty)); setMetrics([]); beginQuestion(0) }
  const current = questions[index]
  const noteInteraction = () => { if (firstInteractionAt.current === null) firstInteractionAt.current = performance.now() }
  const selectAnswer = (answerIndex: number) => { noteInteraction(); if (selectedIndex !== null && selectedIndex !== answerIndex) setChangedAnswers((value) => value + 1); setSelectedIndex(answerIndex) }
  const useHint = () => { noteInteraction(); setHints((value) => value + 1); setShowHint(true) }

  const recordQuestion = (completionState: 'completed' | 'skipped') => {
    if (!current) return
    const now = performance.now()
    const isCorrect = completionState === 'completed' && selectedIndex !== null && current.options[selectedIndex] === current.answer
    const metric: QuestionMetric = { questionId: current.id, type: current.type, correct: isCorrect, responseTimeMs: Math.round(now - questionStartedAt.current), timeBeforeFirstInteractionMs: Math.round((firstInteractionAt.current ?? now) - questionStartedAt.current), changedAnswers, hints, difficulty, completionState }
    setMetrics((values) => [...values, metric]); setCorrect(isCorrect); setPhase('feedback')
  }

  const persistAndFinish = (allMetrics: QuestionMetric[]) => {
    const completed = allMetrics.filter((item) => item.completionState === 'completed')
    const correctCount = allMetrics.filter((item) => item.correct).length
    const responseTimes = completed.map((item) => item.responseTimeMs)
    const average = responseTimes.length ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) : 0
    const mean = average
    const variation = responseTimes.length ? Math.round(Math.sqrt(responseTimes.reduce((sum, time) => sum + Math.pow(time - mean, 2), 0) / responseTimes.length)) : 0
    if (user?.id) {
      void Promise.allSettled([
        saveGameSession({ patientId: user.id, gameType: 'pattern', difficultyLevel: difficulty, correctCount, totalCount: TOTAL_QUESTIONS, responseTimeMs: average, hintsUsed: allMetrics.reduce((sum, item) => sum + item.hints, 0) }),
        saveRichGameMetrics({ patientId: user.id, gameType: 'pattern', metrics: { mode, difficulty, questions: allMetrics, averageResponseTimeMs: average, responseTimeVariationMs: variation, questionsSkipped: allMetrics.filter((item) => item.completionState === 'skipped').length, questionsCompleted: completed.length, accuracy: correctCount / TOTAL_QUESTIONS * 100, completed: true } }),
      ]).then((results) => { if (results.some((item) => item.status === 'rejected')) toast.info('Activity complete. Some details will save later.') })
    }
    setPhase('final-result')
  }

  const nextQuestion = () => { if (index + 1 >= TOTAL_QUESTIONS) persistAndFinish(metrics); else beginQuestion(index + 1) }
  const correctCount = metrics.filter((item) => item.correct).length
  const completedCount = metrics.filter((item) => item.completionState === 'completed').length
  const averageResponse = completedCount ? Math.round(metrics.filter((item) => item.completionState === 'completed').reduce((sum, item) => sum + item.responseTimeMs, 0) / completedCount / 1000) : 0
  const accuracy = Math.round(correctCount / TOTAL_QUESTIONS * 100)
  const goBack = () => phase === 'intro' ? navigate(mode === 'daily' ? '/patient' : '/patient/games') : setExitOpen(true)

  if (!ready) return <div className="patient-ui flex min-h-screen items-center justify-center bg-background"><p className="text-xl text-muted-foreground">Loading activity…</p></div>

  return (
    <div className="patient-ui bg-background">
      <ExitDialog open={exitOpen} onOpenChange={setExitOpen} onLeave={() => navigate(mode === 'daily' ? '/patient' : '/patient/games')} />
      <Celebration active={phase === 'final-result' && (accuracy >= 50 || mode === 'daily')} />
      <main className="mx-auto flex w-full max-w-5xl flex-col px-5 py-6 sm:px-8 lg:px-12">
        {phase !== 'intro' && phase !== 'final-result' && phase !== 'daily-complete' && <PatternHeader index={index} onBack={goBack} />}
        {phase === 'intro' && <PatternIntro backLabel={mode === 'daily' ? 'Home' : 'Activities'} onBack={goBack} onStart={startGame} />}
        {phase === 'question' && current && <QuestionView question={current} selectedIndex={selectedIndex} showHint={showHint} hints={hints} onSelect={selectAnswer} onHint={useHint} onSubmit={() => recordQuestion('completed')} onSkip={() => recordQuestion('skipped')} />}
        {phase === 'feedback' && current && <Feedback correct={correct} skipped={metrics[metrics.length - 1]?.completionState === 'skipped'} answer={current.answer} last={index + 1 >= TOTAL_QUESTIONS} onNext={nextQuestion} />}
        {phase === 'final-result' && <PatternResults correct={correctCount} averageResponse={averageResponse} completed={completedCount} mode={mode} onFinishDaily={() => setPhase('daily-complete')} onActivities={() => navigate('/patient/games')} onAgain={startGame} />}
        {phase === 'daily-complete' && <section className="flex flex-col items-center justify-center text-center px-4 pt-8 pb-12"><div className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary"><Check className="size-10" /></div><h1 className="mt-5 text-3xl font-bold text-foreground">Today&apos;s Activities Complete</h1><p className="mt-2 text-base text-muted-foreground">Well done for taking part today.</p><Button size="lg" className="mt-8 min-h-16 w-full max-w-sm text-lg" onClick={() => navigate('/patient')}>Return Home</Button></section>}
      </main>
    </div>
  )
}

function PatternHeader({ index, onBack }: { index: number; onBack: () => void }) { return <header className="mb-4"><div className="flex items-center justify-between gap-4"><Button variant="ghost" size="sm" onClick={onBack} className="px-2"><ArrowLeft data-icon="inline-start" />Back</Button><p className="text-sm font-semibold text-muted-foreground">Question {index + 1} of 6</p></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-valuemin={1} aria-valuemax={6} aria-valuenow={index + 1}><div className="h-full rounded-full bg-primary transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${(index + 1) / 6 * 100}%` }} /></div></header> }
function PatternIntro({ backLabel, onBack, onStart }: { backLabel: string; onBack: () => void; onStart: () => void }) { return <section className="flex flex-col items-center justify-center text-center px-4 pt-8 pb-12"><Button variant="ghost" size="sm" className="mb-8 self-start" onClick={onBack}><ArrowLeft data-icon="inline-start" />{backLabel}</Button><div className="flex size-20 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Grid3X3 className="size-10" /></div><h1 className="mt-5 text-3xl font-bold tracking-tight text-foreground">Pattern &amp; Attention</h1><p className="mt-2 max-w-md text-base leading-relaxed text-muted-foreground">Six short visual questions. Take your time.</p><Button size="lg" className="mt-8 min-h-16 w-full max-w-sm text-lg" onClick={onStart}>Start Activity</Button></section> }
function QuestionView({ question, selectedIndex, showHint, hints, onSelect, onHint, onSubmit, onSkip }: { question: PatternQuestionConfig; selectedIndex: number | null; showHint: boolean; hints: number; onSelect: (index: number) => void; onHint: () => void; onSubmit: () => void; onSkip: () => void }) { const attention = question.type === 'attention'; return <section className="flex flex-col"><h1 className="mt-4 text-center text-2xl font-bold text-foreground">{question.prompt}</h1>{showHint && <p className="mx-auto mt-4 rounded-xl bg-primary/10 px-5 py-3 text-lg font-medium text-primary">{attention ? 'Look carefully at each shape.' : 'Look for what repeats or changes.'}</p>}{!attention && <div className="mx-auto mt-10 flex min-h-36 w-full max-w-3xl flex-wrap items-center justify-center gap-3 rounded-xl border border-border bg-card p-6" aria-label="Visual sequence">{question.sequence.map((item, itemIndex) => <span key={`${item}-${itemIndex}`} className={`flex size-16 items-center justify-center rounded-xl text-4xl font-bold ${item === '?' ? 'border-2 border-dashed border-primary bg-primary/10 text-primary' : 'bg-secondary text-foreground'}`}>{item}</span>)}{question.type !== 'missing' && <span className="flex size-16 items-center justify-center rounded-xl border-2 border-dashed border-primary bg-primary/10 text-4xl font-bold text-primary">?</span>}</div>}<div className={`mx-auto mt-8 grid w-full max-w-3xl gap-4 ${attention ? 'grid-cols-4' : 'grid-cols-2 sm:grid-cols-4'}`}>{question.options.map((option, optionIndex) => <button key={`${option}-${optionIndex}`} onClick={() => onSelect(optionIndex)} aria-pressed={selectedIndex === optionIndex} aria-label={`Answer ${optionIndex + 1}: ${option}`} className="relative flex min-h-24 cursor-pointer items-center justify-center rounded-xl border-2 border-border bg-card text-4xl font-bold text-foreground transition-colors duration-150 hover:border-primary/40 hover:bg-accent active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-pressed:border-primary aria-pressed:bg-primary/10 aria-pressed:text-primary">{option}{selectedIndex === optionIndex && <Check className="absolute right-2 top-2 size-5 text-primary" />}</button>)}</div><div className="mx-auto flex w-full max-w-3xl flex-col gap-3 pt-7 sm:flex-row"><Button variant="outline" size="lg" className="text-lg" onClick={onHint} disabled={showHint}><Lightbulb data-icon="inline-start" />Hint {hints > 0 ? `(${hints})` : ''}</Button><Button variant="ghost" size="lg" className="text-lg" onClick={onSkip}>Skip</Button><Button size="lg" className="flex-1 text-lg" onClick={onSubmit} disabled={selectedIndex === null}>Check Answer</Button></div></section> }
function Feedback({ correct, skipped, answer, last, onNext }: { correct: boolean; skipped: boolean; answer: string; last: boolean; onNext: () => void }) { return <section className="flex flex-col items-center justify-center text-center px-4 pt-8 pb-12"><div className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary"><Check className="size-10" /></div><h1 className="mt-6 text-3xl font-bold text-foreground">{skipped ? 'That’s okay' : correct ? 'That’s right' : 'Nice try'}</h1>{!correct && <p className="mt-3 text-xl text-muted-foreground">The answer is <span className="font-bold text-foreground">{answer}</span>.</p>}<Button size="lg" className="mt-9 min-h-16 w-full max-w-sm text-xl" onClick={onNext}>{last ? 'See Results' : 'Next Question'}</Button></section> }
function PatternResults({ correct, averageResponse, completed, mode, onFinishDaily, onActivities, onAgain }: { correct: number; averageResponse: number; completed: number; mode: GameMode; onFinishDaily: () => void; onActivities: () => void; onAgain: () => void }) { const items = [['Correct patterns', `${correct} of 6`], ['Average response time', `${averageResponse} sec`], ['Questions completed', `${completed} of 6`]]; return <section className="flex flex-col items-center justify-center text-center px-4 pt-8 pb-12"><h1 className="text-3xl font-bold tracking-tight text-foreground">Activity Complete</h1><p className="mt-2 text-base text-muted-foreground">Pattern &amp; Attention</p><dl className="mt-6 grid w-full max-w-xl gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">{items.map(([label,value]) => <div key={label} className="bg-card p-5"><dt className="text-base text-muted-foreground">{label}</dt><dd className="mt-2 text-2xl font-bold text-foreground">{value}</dd></div>)}</dl><div className="mt-6 flex w-full max-w-sm flex-col gap-3"><Button size="lg" className="text-lg" onClick={mode === 'daily' ? onFinishDaily : onActivities}>{mode === 'daily' ? 'Finish Today’s Activities' : 'Back to Activities'}</Button><Button size="lg" variant="outline" onClick={onAgain}>Play Again</Button></div></section> }
