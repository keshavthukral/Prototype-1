import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/language-context'
import { PatientBottomNav } from '@/components/patient/bottom-nav'
import { ArrowLeft, Check, RotateCcw, Star } from 'lucide-react'

// Simple color/shape patterns
const PATTERNS = [
  {
    sequence: ['🔴', '🔵', '🔴', '🔵'],
    answer: '🔴',
    options: ['🔴', '🔵', '🟢', '🟡'],
  },
  {
    sequence: ['🟠', '🟠', '🟡', '🟠', '🟠'],
    answer: '🟡',
    options: ['🟠', '🟡', '🔴', '🔵'],
  },
  {
    sequence: ['🟢', '🔵', '🟢', '🔵', '🟢'],
    answer: '🔵',
    options: ['🟢', '🔵', '🟡', '🟠'],
  },
  {
    sequence: ['⭐', '🌙', '⭐', '🌙', '⭐'],
    answer: '🌙',
    options: ['⭐', '🌙', '☀️', '🌈'],
  },
  {
    sequence: ['🟥', '🟧', '🟨', '🟥', '🟧'],
    answer: '🟨',
    options: ['🟥', '🟧', '🟨', '🟩'],
  },
]

type Phase = 'ready' | 'play' | 'result'

export function PatternGamePage() {
  const navigate = useNavigate()
  const { t } = useLanguage()

  const [phase, setPhase] = useState<Phase>('ready')
  const [currentRound, setCurrentRound] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null)

  const totalRounds = PATTERNS.length
  const currentPattern = PATTERNS[currentRound] ?? PATTERNS[0]

  const startGame = useCallback(() => {
    setCurrentRound(0)
    setScore(0)
    setSelectedAnswer(null)
    setFeedback(null)
    setPhase('play')
  }, [])

  const handleAnswer = (answer: string) => {
    if (selectedAnswer !== null || !currentPattern) return // Already answered
    setSelectedAnswer(answer)

    const isCorrect = answer === currentPattern.answer
    if (isCorrect) setScore(prev => prev + 1)
    setFeedback(isCorrect ? 'correct' : 'incorrect')

    // Advance after brief feedback
    setTimeout(() => {
      if (currentRound + 1 >= totalRounds) {
        setPhase('result')
      } else {
        setCurrentRound(prev => prev + 1)
        setSelectedAnswer(null)
        setFeedback(null)
      }
    }, 1500)
  }

  return (
    <div className="patient-ui flex min-h-screen flex-col bg-background">
      <main className="flex flex-1 flex-col px-6 pt-8 pb-24">
        {/* Ready phase */}
        {phase === 'ready' && (
          <>
            <Button
              variant="ghost"
              onClick={() => navigate('/patient/games')}
              className="mb-8 h-14 w-fit self-start text-base"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              {t('back')}
            </Button>

            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <div className="mb-8 text-6xl">🔍</div>
              <h1 className="mb-4 text-[2rem] font-bold text-foreground">
                {t('pattern_game')}
              </h1>
              <p className="mb-10 text-lg text-muted-foreground">
                {t('pattern_instruction')}
              </p>
              <Button
                onClick={startGame}
                className="h-20 w-full max-w-sm text-xl font-semibold"
                size="lg"
              >
                {t('start_game')}
              </Button>
            </div>
          </>
        )}

        {/* Play phase — one pattern at a time */}
        {phase === 'play' && currentPattern && (
          <div className="flex flex-1 flex-col">
            {/* Progress */}
            <div className="mb-6 flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                {currentRound + 1} / {totalRounds}
              </span>
              <div className="flex items-center gap-1 text-sm font-medium text-primary">
                <Star className="h-4 w-4" />
                <span>{score}</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-8 h-2 w-full overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-500 motion-reduce:transition-none"
                style={{ width: `${((currentRound) / totalRounds) * 100}%` }}
              />
            </div>

            {/* Instruction */}
            <h2 className="mb-8 text-center text-[1.75rem] font-bold text-foreground">
              {t('what_comes_next')}
            </h2>

            {/* Pattern display */}
            <div className="mb-8 flex items-center justify-center gap-3">
              {currentPattern.sequence.map((item, i) => (
                <span key={i} className="text-4xl sm:text-5xl">
                  {item}
                </span>
              ))}
              <span className="text-4xl sm:text-5xl">❓</span>
            </div>

            {/* Answer options — large touch targets */}
            <div className="grid grid-cols-2 gap-4">
              {currentPattern.options.map((option) => {
                const isSelected = selectedAnswer === option
                const isCorrectAnswer = option === currentPattern.answer
                const showCorrect = feedback && isCorrectAnswer
                const showWrong = feedback && isSelected && !isCorrectAnswer

                return (
                  <button
                    key={option}
                    onClick={() => handleAnswer(option)}
                    disabled={selectedAnswer !== null}
                    aria-pressed={isSelected}
                    className={`relative flex h-20 cursor-pointer items-center justify-center rounded-2xl border-2 text-4xl transition-colors duration-150 hover:bg-accent active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:active:scale-100 ${
                      showCorrect
                        ? 'border-success bg-success/10'
                        : showWrong
                          ? 'border-destructive bg-destructive/10'
                          : isSelected
                            ? 'border-primary bg-primary/10'
                            : 'border-border bg-card hover:border-primary/30'
                    }`}
                  >
                    {option}
                    {(isSelected || showCorrect) && <Check className={`absolute right-3 top-3 h-6 w-6 ${showCorrect ? 'text-success' : 'text-primary'}`} aria-label={showCorrect ? 'Correct answer' : 'Selected'} />}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Result phase */}
        {phase === 'result' && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="mb-6 text-5xl">
              {score === totalRounds ? '🌟' : score >= totalRounds / 2 ? '😊' : '💪'}
            </div>

            <h1 className="mb-2 text-[2rem] font-bold text-foreground">
              {score === totalRounds ? t('excellent') : t('well_done')}
            </h1>

            <div className="mb-8 flex items-center gap-2 text-3xl font-bold text-primary">
              <Star className="h-8 w-8" />
              <span>{score} / {totalRounds}</span>
            </div>

            <p className="mb-10 text-lg text-muted-foreground">
              {t('patterns_correct')}
            </p>

            <div className="flex w-full max-w-sm flex-col gap-3">
              <Button
                onClick={startGame}
                className="h-16 text-lg font-semibold"
                size="lg"
              >
                <RotateCcw className="mr-2 h-5 w-5" />
                {t('play_again')}
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate('/patient')}
                className="h-14 text-base text-muted-foreground"
              >
                {t('back_home')}
              </Button>
            </div>
          </div>
        )}
      </main>

      <PatientBottomNav />
    </div>
  )
}
