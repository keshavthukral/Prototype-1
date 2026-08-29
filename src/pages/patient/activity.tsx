import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '@/lib/i18n/language-context'
import { useAuth } from '@/lib/supabase/auth-context'
import { HearAgain } from '@/components/patient/hear-again'
import { Check, Star, RotateCcw } from 'lucide-react'

// ─── Game engine imports ──────────────────────────────────────
import {
  computeNextDifficulty,
  getStartingDifficulty,
  type DifficultyLevel,
} from '@/lib/games/adaptive-engine'
import { pickObjects, getObjectName, type MemoryObject } from '@/lib/games/memory-data'
import { getPatternRounds, type PatternRound } from '@/lib/games/pattern-data'
import {
  saveGameSession,
  getRecentSessions,
} from '@/lib/repositories/game-session'

// ─── Types ────────────────────────────────────────────────────

type GamePhase =
  | 'memory-ready'
  | 'memory-memorize'
  | 'memory-recall'
  | 'memory-result'
  | 'pattern-ready'
  | 'pattern-play'
  | 'pattern-result'
  | 'all-done'

// ─── Component ────────────────────────────────────────────────

export function ActivityPage() {
  const navigate = useNavigate()
  const { t, language } = useLanguage()
  const { user } = useAuth()

  // ── Adaptive difficulty ──
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(1)
  const [difficultyLoaded, setDifficultyLoaded] = useState(false)

  // ── Phase ──
  const [phase, setPhase] = useState<GamePhase>('memory-ready')

  // ── Memory game state ──
  const [memObjects, setMemObjects] = useState<MemoryObject[]>([])
  const [memSelected, setMemSelected] = useState<string[]>([])
  const [memViewTimeLeft, setMemViewTimeLeft] = useState(0)
  const [memScore, setMemScore] = useState(0)
  const [memStartTime, setMemStartTime] = useState(0)
  const [memHintsUsed, setMemHintsUsed] = useState(0)
  const [memShowHint, setMemShowHint] = useState(false)

  // ── Pattern game state ──
  const [patRounds, setPatRounds] = useState<PatternRound[]>([])
  const [patRound, setPatRound] = useState(0)
  const [patAnswer, setPatAnswer] = useState<string | null>(null)
  const [patScore, setPatScore] = useState(0)
  const [patFeedback, setPatFeedback] = useState<'correct' | 'incorrect' | null>(null)
  const [patHintsUsed, setPatHintsUsed] = useState(0)
  const [patShowHint, setPatShowHint] = useState(false)
  const patTotalTimeRef = useRef(0)
  const patRoundStartRef = useRef(0)

  // ── Timer refs (cleaned only on unmount) ──
  const memCountdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const memTransitionRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const patAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cleanup ALL timers on unmount only
  useEffect(() => {
    return () => {
      if (memCountdownRef.current) clearInterval(memCountdownRef.current)
      if (memTransitionRef.current) clearTimeout(memTransitionRef.current)
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current)
      if (patAdvanceRef.current) clearTimeout(patAdvanceRef.current)
    }
  }, [])

  // ── Load difficulty ──
  useEffect(() => {
    async function loadDifficulty() {
      if (!user?.id) {
        setDifficulty(getStartingDifficulty())
        setDifficultyLoaded(true)
        return
      }
      const memSessions = await getRecentSessions(user.id, 'memory', 3)
      const patSessions = await getRecentSessions(user.id, 'pattern', 3)
      let d = getStartingDifficulty()
      if (memSessions.length > 0 || patSessions.length > 0) {
        const allSessions = [...memSessions, ...patSessions].sort(
          (a, b) => b.responseTimeMs - a.responseTimeMs,
        )
        const decision = computeNextDifficulty(d, allSessions)
        d = decision.newDifficulty
      }
      setDifficulty(d)
      setDifficultyLoaded(true)
    }
    loadDifficulty()
  }, [user?.id])

  // ═══════════════════════════════════════════════════════════
  // MEMORY GAME — simple state machine
  // ═══════════════════════════════════════════════════════════

  const startMemory = useCallback(() => {
    const objects = pickObjects(difficulty)
    setMemObjects(objects)
    setMemSelected([])
    setMemScore(0)
    setMemStartTime(0)
    setMemHintsUsed(0)
    setMemShowHint(false)

    // Immediately show objects (MEMORIZE phase)
    const viewTime = objects.length <= 3 ? 8 : objects.length <= 4 ? 10 : 14
    setMemViewTimeLeft(viewTime)
    setPhase('memory-memorize')

    // Countdown display — using a ref so it persists across renders
    let remaining = viewTime
    memCountdownRef.current = setInterval(() => {
      remaining -= 1
      setMemViewTimeLeft(remaining)
      if (remaining <= 0 && memCountdownRef.current) {
        clearInterval(memCountdownRef.current)
        memCountdownRef.current = null
      }
    }, 1000)

    // Transition to RECALL after viewing time — set directly, not in an effect
    memTransitionRef.current = setTimeout(() => {
      setMemStartTime(Date.now())
      setPhase('memory-recall')
      memTransitionRef.current = null
    }, viewTime * 1000)
  }, [difficulty])

  const toggleMemObject = (id: string) => {
    setMemSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    )
  }

  const useMemoryHint = () => {
    setMemHintsUsed(prev => prev + 1)
    setMemShowHint(true)
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current)
    hintTimerRef.current = setTimeout(() => {
      setMemShowHint(false)
      hintTimerRef.current = null
    }, 3000)
  }

  const submitMemoryRecall = async () => {
    const responseTimeMs = Date.now() - memStartTime
    const correct = memSelected.filter(id =>
      memObjects.some(o => o.id === id),
    ).length
    setMemScore(correct)

    if (user?.id) {
      await saveGameSession({
        patientId: user.id,
        gameType: 'memory',
        difficultyLevel: difficulty,
        correctCount: correct,
        totalCount: memObjects.length,
        responseTimeMs,
        hintsUsed: memHintsUsed,
      })
    }

    setPhase('memory-result')
  }

  // ═══════════════════════════════════════════════════════════
  // PATTERN GAME
  // ═══════════════════════════════════════════════════════════

  const startPattern = useCallback(() => {
    const rounds = getPatternRounds(difficulty)
    setPatRounds(rounds)
    setPatRound(0)
    setPatScore(0)
    setPatAnswer(null)
    setPatFeedback(null)
    setPatHintsUsed(0)
    setPatShowHint(false)
    patTotalTimeRef.current = 0
    patRoundStartRef.current = Date.now()
    setPhase('pattern-play')
  }, [difficulty])

  const handlePatternAnswer = (answer: string) => {
    if (patAnswer !== null) return
    setPatAnswer(answer)
    const pattern = patRounds[patRound]
    if (!pattern) return
    const isCorrect = answer === pattern.answer
    if (isCorrect) setPatScore(prev => prev + 1)
    setPatFeedback(isCorrect ? 'correct' : 'incorrect')
    patTotalTimeRef.current += Date.now() - patRoundStartRef.current

    patAdvanceRef.current = setTimeout(() => {
      if (patRound + 1 >= patRounds.length) {
        // Record session
        const correctCount = patScore + (isCorrect ? 1 : 0)
        if (user?.id) {
          saveGameSession({
            patientId: user.id,
            gameType: 'pattern',
            difficultyLevel: difficulty,
            correctCount,
            totalCount: patRounds.length,
            responseTimeMs: patTotalTimeRef.current,
            hintsUsed: patHintsUsed,
          })
        }
        setPhase('pattern-result')
      } else {
        setPatRound(prev => prev + 1)
        setPatAnswer(null)
        setPatFeedback(null)
        setPatShowHint(false)
        patRoundStartRef.current = Date.now()
      }
      patAdvanceRef.current = null
    }, 1200)
  }

  const usePatternHint = () => {
    setPatHintsUsed(prev => prev + 1)
    setPatShowHint(true)
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current)
    hintTimerRef.current = setTimeout(() => {
      setPatShowHint(false)
      hintTimerRef.current = null
    }, 3000)
  }

  // ── Navigation ──
  const goHome = () => navigate('/patient', { replace: true })

  // ── Render helpers ──
  const currentPattern = patRounds[patRound]

  if (!difficultyLoaded) {
    return (
      <div className="patient-ui flex min-h-screen flex-col items-center justify-center bg-background">
        <p className="text-lg text-muted-foreground">{t('loading')}</p>
      </div>
    )
  }

  return (
    <div className="patient-ui flex min-h-screen flex-col bg-background">
      <main className="flex flex-1 flex-col px-6 pt-8 pb-12">

        {/* ══ MEMORY READY ══════════════════════════════════════ */}
        {phase === 'memory-ready' && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="mb-6 text-5xl" aria-hidden="true">🧠</div>
            <h1 className="mb-3 text-[2rem] font-bold text-foreground">
              {t('activity_memory_title')}
            </h1>
            <p className="mb-8 max-w-sm text-lg text-muted-foreground">
              {t('memory_game_instruction')}
            </p>
            <HearAgain text={t('memory_game_instruction')} label={t('voice_instruction')} className="mb-6" />
            <button
              onClick={startMemory}
              className="h-20 w-full max-w-sm cursor-pointer rounded-2xl bg-primary px-8 text-xl font-semibold text-primary-foreground shadow-sm transition-colors duration-150 hover:bg-primary/90 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              {t('start_game')}
            </button>
          </div>
        )}

        {/* ══ MEMORY MEMORIZE ═══════════════════════════════════ */}
        {phase === 'memory-memorize' && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <p className="mb-4 text-lg text-muted-foreground">
              {t('memorize_objects')}
            </p>
            <div className="mb-6 text-3xl font-bold text-primary">
              {memViewTimeLeft}s
            </div>
            <div className={`grid gap-4 w-full max-w-md ${
              memObjects.length <= 3 ? 'grid-cols-3' :
              memObjects.length <= 4 ? 'grid-cols-2' :
              'grid-cols-3'
            }`}>
              {memObjects.map(obj => (
                <div
                  key={obj.id}
                  className="flex flex-col items-center gap-2 rounded-2xl border-2 border-border bg-card p-4"
                >
                  <span className="text-5xl">{obj.emoji}</span>
                  <span className="text-base font-medium text-foreground">
                    {getObjectName(obj, language)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ MEMORY RECALL ═════════════════════════════════════ */}
        {phase === 'memory-recall' && (
          <div className="flex flex-1 flex-col">
            <h1 className="mb-2 text-[1.75rem] font-bold text-foreground">
              {t('what_do_you_remember')}
            </h1>
            <p className="mb-6 text-lg text-muted-foreground">
              {t('tap_objects_remembered')}
            </p>

            {memShowHint && (
              <div className="mb-4 rounded-xl bg-primary/10 p-3 text-center text-sm font-medium text-primary">
                {t('memory_hint_text')}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {memObjects.map(obj => {
                const sel = memSelected.includes(obj.id)
                return (
                  <button
                    key={obj.id}
                    onClick={() => toggleMemObject(obj.id)}
                    className={`relative flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 p-5 transition-colors duration-150 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                      sel ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/30'
                    }`}
                    aria-pressed={sel}
                  >
                    <span className="text-4xl">{obj.emoji}</span>
                    <span className="text-base font-medium text-foreground">
                      {getObjectName(obj, language)}
                    </span>
                    {sel && <Check className="h-5 w-5 text-primary" />}
                  </button>
                )
              })}
            </div>

            <div className="mt-auto pt-6 space-y-3">
              <button
                onClick={useMemoryHint}
                disabled={memShowHint}
                className="h-12 w-full cursor-pointer rounded-xl border border-border bg-card text-sm font-medium text-muted-foreground transition-colors duration-150 hover:bg-accent active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
              >
                {t('use_hint')} ({memHintsUsed})
              </button>
              <button
                onClick={submitMemoryRecall}
                disabled={memSelected.length === 0}
                className="h-16 w-full cursor-pointer rounded-2xl bg-primary text-lg font-semibold text-primary-foreground shadow-sm transition-colors duration-150 hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                {t('done')}
              </button>
            </div>
          </div>
        )}

        {/* ══ MEMORY RESULT ═════════════════════════════════════ */}
        {phase === 'memory-result' && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="mb-4 text-5xl" aria-hidden="true">
              {memScore === memObjects.length ? '🌟' : memScore >= memObjects.length / 2 ? '😊' : '💪'}
            </div>
            <h1 className="mb-2 text-[2rem] font-bold text-foreground">
              {t('well_done')}
            </h1>
            <div className="mb-4 flex items-center gap-2 text-3xl font-bold text-primary">
              <Star className="h-8 w-8" aria-hidden="true" />
              <span>{memScore} / {memObjects.length}</span>
            </div>
            <p className="mb-8 text-lg text-muted-foreground">
              {t('objects_correct')}
            </p>
            <HearAgain
              text={`${t('well_done')}! ${memScore} ${t('objects_correct')}`}
              label={t('hear_again')}
              className="mb-6"
            />
            <button
              onClick={startPattern}
              className="h-16 w-full max-w-sm cursor-pointer rounded-2xl bg-primary px-8 text-lg font-semibold text-primary-foreground shadow-sm transition-colors duration-150 hover:bg-primary/90 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              {t('activity_pattern_title')}
            </button>
          </div>
        )}

        {/* ══ PATTERN READY ═════════════════════════════════════ */}
        {phase === 'pattern-ready' && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="mb-6 text-5xl" aria-hidden="true">🔍</div>
            <h1 className="mb-3 text-[2rem] font-bold text-foreground">{t('activity_pattern_title')}</h1>
            <p className="mb-8 max-w-sm text-lg text-muted-foreground">{t('pattern_instruction')}</p>
            <HearAgain text={t('pattern_instruction')} label={t('voice_instruction')} className="mb-6" />
            <button
              onClick={startPattern}
              className="h-20 w-full max-w-sm cursor-pointer rounded-2xl bg-primary px-8 text-xl font-semibold text-primary-foreground shadow-sm transition-colors duration-150 hover:bg-primary/90 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              {t('start_game')}
            </button>
          </div>
        )}

        {/* ══ PATTERN PLAY ══════════════════════════════════════ */}
        {phase === 'pattern-play' && currentPattern && (
          <div className="flex flex-1 flex-col">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">{patRound + 1} / {patRounds.length}</span>
              <div className="flex items-center gap-1 text-sm font-medium text-primary">
                <Star className="h-4 w-4" aria-hidden="true" /><span>{patScore}</span>
              </div>
            </div>
            <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-border">
              <div className="h-full rounded-full bg-primary transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${(patRound / patRounds.length) * 100}%` }} />
            </div>

            <h2 className="mb-6 text-center text-[1.5rem] font-bold text-foreground">{t('what_comes_next')}</h2>

            {patShowHint && (
              <div className="mb-4 rounded-xl bg-primary/10 p-3 text-center text-sm font-medium text-primary">
                {t('pattern_hint_text')}
              </div>
            )}

            <div className="mb-8 flex items-center justify-center gap-3" aria-label="Pattern sequence">
              {currentPattern.sequence.map((item, i) => (
                <span key={i} className="text-4xl sm:text-5xl">{item}</span>
              ))}
              <span className="text-4xl sm:text-5xl" aria-hidden="true">❓</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {currentPattern.options.map(opt => {
                const isSel = patAnswer === opt
                const isCorrect = opt === currentPattern.answer
                const showOk = patFeedback && isCorrect
                const showBad = patFeedback && isSel && !isCorrect
                return (
                  <button
                    key={opt}
                    onClick={() => handlePatternAnswer(opt)}
                    disabled={patAnswer !== null}
                    aria-pressed={isSel}
                    className={`relative flex h-20 cursor-pointer items-center justify-center rounded-2xl border-2 text-4xl transition-colors duration-150 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:active:scale-100 ${
                      showOk ? 'border-success bg-success/10' :
                      showBad ? 'border-destructive bg-destructive/10' :
                      isSel ? 'border-primary bg-primary/10' :
                      'border-border bg-card hover:border-primary/30'
                    }`}
                    aria-label={`Option: ${opt}`}
                  >
                    {opt}
                    {(isSel || showOk) && <Check className={`absolute right-3 top-3 h-6 w-6 ${showOk ? 'text-success' : 'text-primary'}`} aria-label={showOk ? 'Correct answer' : 'Selected'} />}
                  </button>
                )
              })}
            </div>

            <div className="mt-auto pt-4">
              <button
                onClick={usePatternHint}
                disabled={patShowHint}
                className="h-12 w-full cursor-pointer rounded-xl border border-border bg-card text-sm font-medium text-muted-foreground transition-colors duration-150 hover:bg-accent active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
              >
                {t('use_hint')} ({patHintsUsed})
              </button>
            </div>
          </div>
        )}

        {/* ══ PATTERN RESULT ════════════════════════════════════ */}
        {phase === 'pattern-result' && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="mb-4 text-5xl" aria-hidden="true">
              {patScore === patRounds.length ? '🌟' : patScore >= patRounds.length / 2 ? '😊' : '💪'}
            </div>
            <h1 className="mb-2 text-[2rem] font-bold text-foreground">
              {t('well_done')}
            </h1>
            <div className="mb-4 flex items-center gap-2 text-3xl font-bold text-primary">
              <Star className="h-8 w-8" aria-hidden="true" />
              <span>{patScore} / {patRounds.length}</span>
            </div>
            <p className="mb-8 text-lg text-muted-foreground">{t('patterns_correct')}</p>
            <HearAgain
              text={`${t('well_done')}! ${patScore} ${t('patterns_correct')}`}
              label={t('hear_again')}
              className="mb-6"
            />
            <button
              onClick={() => setPhase('all-done')}
              className="h-16 w-full max-w-sm cursor-pointer rounded-2xl bg-primary px-8 text-lg font-semibold text-primary-foreground shadow-sm transition-colors duration-150 hover:bg-primary/90 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              {t('activity_all_done')}
            </button>
          </div>
        )}

        {/* ══ ALL DONE ══════════════════════════════════════════ */}
        {phase === 'all-done' && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="mb-6 text-6xl" aria-hidden="true">🎉</div>
            <h1 className="mb-3 text-[2rem] font-bold text-foreground">{t('activity_all_done')}</h1>
            <p className="mb-2 text-lg text-muted-foreground">
              {t('memory_game')}: {memScore}/{memObjects.length}
            </p>
            <p className="mb-8 text-lg text-muted-foreground">
              {t('pattern_game')}: {patScore}/{patRounds.length}
            </p>
            <HearAgain text={t('activity_all_done')} label={t('hear_again')} className="mb-8" />
            <div className="flex w-full max-w-sm flex-col gap-3">
              <button
                onClick={() => {
                  setPhase('memory-ready')
                  setMemObjects([])
                  setPatRounds([])
                }}
                className="h-16 cursor-pointer rounded-2xl bg-primary px-8 text-lg font-semibold text-primary-foreground shadow-sm transition-colors duration-150 hover:bg-primary/90 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
              >
                <RotateCcw className="mr-2 inline h-5 w-5" />
                {t('play_again')}
              </button>
              <button
                onClick={goHome}
                className="h-14 cursor-pointer rounded-2xl border-2 border-border bg-card px-8 text-lg font-semibold text-foreground shadow-sm transition-colors duration-150 hover:border-primary/30 hover:bg-accent active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
              >
                {t('activity_go_home')}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
