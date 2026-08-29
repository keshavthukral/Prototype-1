import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/language-context'
import { PatientBottomNav } from '@/components/patient/bottom-nav'
import { ArrowLeft, Check, RotateCcw, Star } from 'lucide-react'

// Friendly everyday objects with emoji representations
const OBJECTS = [
  { id: '1', emoji: '🪷', nameEn: 'Lotus', nameAs: 'কোঁপোল' },
  { id: '2', emoji: '🫖', nameEn: 'Teapot', nameAs: 'চাহৰ বাতৰী' },
  { id: '3', emoji: '🎵', nameEn: 'Music', nameAs: 'গান' },
  { id: '4', emoji: '🪔', nameEn: 'Lamp', nameAs: 'মই' },
  { id: '5', emoji: '🥭', nameEn: 'Mango', nameAs: 'আম' },
  { id: '6', emoji: '📖', nameEn: 'Book', nameAs: 'পুথি' },
  { id: '7', emoji: '🌸', nameEn: 'Flower', nameAs: 'ফুল' },
  { id: '8', emoji: '🪴', nameEn: 'Plant', nameAs: 'বৰষেণী' },
]

type Phase = 'ready' | 'memorize' | 'recall' | 'result'

export function MemoryGamePage() {
  const navigate = useNavigate()
  const { t, language } = useLanguage()

  const [phase, setPhase] = useState<Phase>('ready')
  const [currentObjectIndex, setCurrentObjectIndex] = useState(0)
  const [selectedObjects, setSelectedObjects] = useState<string[]>([])
  const [score, setScore] = useState(0)
  const [roundObjects, setRoundObjects] = useState<typeof OBJECTS>([])

  const startRound = useCallback(() => {
    // Pick 4 random objects
    const shuffled = [...OBJECTS].sort(() => Math.random() - 0.5)
    const picked = shuffled.slice(0, 4)
    setRoundObjects(picked)
    setSelectedObjects([])
    setScore(0)
    setCurrentObjectIndex(0)
    setPhase('memorize')
  }, [])

  // Memorize phase — show objects one at a time
  useEffect(() => {
    if (phase !== 'memorize') return
    if (currentObjectIndex >= roundObjects.length) {
      setPhase('recall')
      return
    }
    const timer = setTimeout(() => {
      setCurrentObjectIndex(prev => prev + 1)
    }, 3000) // 3 seconds per object
    return () => clearTimeout(timer)
  }, [phase, currentObjectIndex, roundObjects.length])

  const toggleObject = (id: string) => {
    setSelectedObjects(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const submitRecall = () => {
    const correct = selectedObjects.filter(id =>
      roundObjects.some(obj => obj.id === id)
    ).length
    setScore(correct)
    setPhase('result')
  }

  const currentObject = roundObjects[currentObjectIndex]
  const objectName = language === 'as'
    ? currentObject?.nameAs
    : currentObject?.nameEn

  return (
    <div className="patient-ui flex min-h-screen flex-col bg-background">
      <main className="flex flex-1 flex-col px-6 pt-8 pb-24">
        {/* Back button — only in ready phase */}
        {phase === 'ready' && (
          <Button
            variant="ghost"
            onClick={() => navigate('/patient/game')}
            className="mb-8 h-14 w-fit self-start text-base"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            {t('back')}
          </Button>
        )}

        {/* Ready phase — start instruction */}
        {phase === 'ready' && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="mb-8 text-6xl">🧠</div>
            <h1 className="mb-4 text-[2rem] font-bold text-foreground">
              {t('memory_game')}
            </h1>
            <p className="mb-10 text-lg text-muted-foreground">
              {t('memory_game_instruction')}
            </p>
            <Button
              onClick={startRound}
              className="h-20 w-full max-w-sm text-xl font-semibold"
              size="lg"
            >
              {t('start_game')}
            </Button>
          </div>
        )}

        {/* Memorize phase — one object at a time */}
        {phase === 'memorize' && currentObject && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <p className="mb-6 text-lg text-muted-foreground">
              {t('remember_this')}
            </p>

            <div className="mb-6 text-[5rem] leading-none">
              {currentObject.emoji}
            </div>

            <p className="mb-8 text-2xl font-medium text-foreground">
              {objectName}
            </p>

            {/* Progress dots */}
            <div className="flex gap-2">
              {roundObjects.map((_, i) => (
                <div
                  key={i}
                  className={`h-3 w-3 rounded-full transition-colors ${
                    i <= currentObjectIndex ? 'bg-primary' : 'bg-border'
                  }`}
                />
              ))}
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              {currentObjectIndex + 1} / {roundObjects.length}
            </p>
          </div>
        )}

        {/* Recall phase — select remembered objects */}
        {phase === 'recall' && (
          <div className="flex flex-1 flex-col">
            <h1 className="mb-2 text-[2rem] font-bold text-foreground">
              {t('what_do_you_remember')}
            </h1>
            <p className="mb-8 text-lg text-muted-foreground">
              {t('tap_objects_remembered')}
            </p>

            <div className="grid grid-cols-2 gap-4">
              {roundObjects.map(obj => {
                const isSelected = selectedObjects.includes(obj.id)
                const objName = language === 'as' ? obj.nameAs : obj.nameEn
                return (
                  <button
                    key={obj.id}
                    onClick={() => toggleObject(obj.id)}
                    className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-5 transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                      isSelected
                        ? 'border-primary bg-primary/10 shadow-sm'
                        : 'border-border bg-card hover:border-primary/30'
                    }`}
                  >
                    <span className="text-4xl">{obj.emoji}</span>
                    <span className="text-base font-medium text-foreground">
                      {objName}
                    </span>
                    {isSelected && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </button>
                )
              })}
            </div>

            <div className="mt-auto pt-6">
              <Button
                onClick={submitRecall}
                disabled={selectedObjects.length === 0}
                className="h-16 w-full text-lg font-semibold"
                size="lg"
              >
                {t('done')}
              </Button>
            </div>
          </div>
        )}

        {/* Result phase — calm, positive feedback */}
        {phase === 'result' && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="mb-6 text-5xl">
              {score === roundObjects.length ? '🌟' : score >= roundObjects.length / 2 ? '😊' : '💪'}
            </div>

            <h1 className="mb-2 text-[2rem] font-bold text-foreground">
              {score === roundObjects.length ? t('excellent') : t('well_done')}
            </h1>

            <div className="mb-8 flex items-center gap-2 text-3xl font-bold text-primary">
              <Star className="h-8 w-8" />
              <span>{score} / {roundObjects.length}</span>
            </div>

            <p className="mb-10 text-lg text-muted-foreground">
              {t('objects_correct')}
            </p>

            <div className="flex w-full max-w-sm flex-col gap-3">
              <Button
                onClick={startRound}
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
