import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Apple, Armchair, ArrowLeft, Banana, BookOpen, BriefcaseBusiness, Check, CircleDot, Clock3, Coffee, Disc, FlaskRound, Flower2, Footprints, Glasses, GraduationCap, GripVertical, KeyRound, Lamp, Lightbulb, Phone, Umbrella, UtensilsCrossed, Volleyball } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Celebration } from '@/features/games/Celebration'
import { ExitDialog } from '@/features/games/ExitDialog'
import { OBJECT_POOL, buildMemoryRound } from '@/features/games/data/objects'
import type { GameChoice, GameMode, MemoryRoundConfig } from '@/features/games/types'
import { computeNextDifficulty, getStartingDifficulty, type DifficultyLevel } from '@/lib/games/adaptive-engine'
import { getRecentSessions, saveGameSession, saveRichGameMetrics } from '@/lib/repositories/game-session'
import { useAuth } from '@/lib/supabase/auth-context'

type Phase = 'intro' | 'delayed-preview' | 'memorise' | 'task' | 'round-result' | 'final-result'
type RoundType = 'object' | 'order' | 'location' | 'delayed'
type Metric = Record<string, unknown> & { round: number; type: RoundType; responseTimeMs: number; hints: number; accuracy: number }

const TOTAL_ROUNDS = 4
const ROUND_TYPES: RoundType[] = ['object', 'order', 'location', 'delayed']
const iconMap: Record<string, typeof Apple> = { apple: Apple, key: KeyRound, cup: Coffee, book: BookOpen, umbrella: Umbrella, flower: Flower2, clock: Clock3, glasses: Glasses, chair: Armchair, banana: Banana, telephone: Phone, bag: BriefcaseBusiness, spoon: UtensilsCrossed, ball: Volleyball, plate: Disc, hat: GraduationCap, ring: CircleDot, bottle: FlaskRound, lamp: Lamp, shoe: Footprints }

function viewSeconds(difficulty: DifficultyLevel) { return difficulty === 1 ? 8 : difficulty === 2 ? 7 : 5 }
function shuffle<T>(values: T[]) { return [...values].sort(() => Math.random() - 0.5) }

export function MemoryGame() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const mode: GameMode = searchParams.get('mode') === 'daily' ? 'daily' : 'practice'
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(1)
  const [ready, setReady] = useState(false)
  const [phase, setPhase] = useState<Phase>('intro')
  const [round, setRound] = useState(0)
  const [config, setConfig] = useState<MemoryRoundConfig | null>(null)
  const [delayedObjects, setDelayedObjects] = useState<GameChoice[]>([])
  const [locationObjects, setLocationObjects] = useState<GameChoice[]>([])
  const [locationTarget, setLocationTarget] = useState<GameChoice | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [ordered, setOrdered] = useState<GameChoice[]>([])
  const [viewTimeLeft, setViewTimeLeft] = useState(0)
  const [hints, setHints] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [changes, setChanges] = useState(0)
  const [incorrectAttempts, setIncorrectAttempts] = useState(0)
  const [metrics, setMetrics] = useState<Metric[]>([])
  const [totalCorrect, setTotalCorrect] = useState(0)
  const [totalPossible, setTotalPossible] = useState(0)
  const [lastSummary, setLastSummary] = useState('')
  const [exitOpen, setExitOpen] = useState(false)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const taskStartedAt = useRef(0)
  const firstInteractionAt = useRef<number | null>(null)

  useEffect(() => {
    void (async () => {
      if (user?.id) {
        const recent = await getRecentSessions(user.id, 'memory', 5)
        setDifficulty(recent.length ? computeNextDifficulty(recent[0]?.difficulty ?? 1, recent).newDifficulty : getStartingDifficulty())
      }
      setReady(true)
    })()
  }, [user?.id])

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); if (intervalRef.current) clearInterval(intervalRef.current) }, [])

  const beginTask = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setPhase('task'); taskStartedAt.current = performance.now(); firstInteractionAt.current = null
  }, [])

  const showForMemory = useCallback((seconds: number) => {
    setViewTimeLeft(seconds)
    let remaining = seconds
    intervalRef.current = setInterval(() => { remaining -= 1; setViewTimeLeft(remaining); if (remaining <= 0 && intervalRef.current) clearInterval(intervalRef.current) }, 1000)
    timerRef.current = setTimeout(beginTask, seconds * 1000)
  }, [beginTask])

  const prepareRound = useCallback((index: number) => {
    setRound(index); setSelected(new Set()); setOrdered([]); setHints(0); setShowHint(false); setChanges(0); setIncorrectAttempts(0)
    const type = ROUND_TYPES[index]
    if (type === 'delayed') { setConfig({ targets: delayedObjects, distractors: [], options: shuffle([...delayedObjects, ...shuffle(OBJECT_POOL.filter((item) => !delayedObjects.some((target) => target.id === item.id))).slice(0, difficulty + 1)]) }); beginTask(); return }
    if (type === 'object') setConfig(buildMemoryRound(difficulty))
    if (type === 'order') {
      const count = difficulty + 2
      const targets = shuffle(OBJECT_POOL).slice(0, count)
      setConfig({ targets, distractors: [], options: shuffle(targets) })
    }
    if (type === 'location') {
      const count = difficulty === 1 ? 4 : difficulty === 2 ? 6 : 8
      const key = OBJECT_POOL.find((item) => item.id === 'key')!
      const locations = shuffle([key, ...shuffle(OBJECT_POOL.filter((item) => item.id !== 'key')).slice(0, count - 1)])
      setLocationObjects(locations); setLocationTarget(key); setConfig({ targets: locations, distractors: [], options: locations })
    }
    setPhase('memorise'); showForMemory(viewSeconds(difficulty))
  }, [beginTask, delayedObjects, difficulty, showForMemory])

  const startSession = () => {
    const delayed = shuffle(OBJECT_POOL).slice(0, 3)
    setDelayedObjects(delayed); setMetrics([]); setTotalCorrect(0); setTotalPossible(0); setRound(0); setPhase('delayed-preview')
    setViewTimeLeft(viewSeconds(difficulty)); let remaining = viewSeconds(difficulty)
    intervalRef.current = setInterval(() => { remaining -= 1; setViewTimeLeft(remaining); if (remaining <= 0 && intervalRef.current) clearInterval(intervalRef.current) }, 1000)
    timerRef.current = setTimeout(() => prepareRoundWithDelayed(0, delayed), viewSeconds(difficulty) * 1000)
  }

  const prepareRoundWithDelayed = (index: number, delayed: GameChoice[]) => {
    setDelayedObjects(delayed); setRound(index); setSelected(new Set()); setOrdered([]); setHints(0); setShowHint(false); setChanges(0); setIncorrectAttempts(0)
    setConfig(buildMemoryRound(difficulty)); setPhase('memorise'); showForMemory(viewSeconds(difficulty))
  }

  const noteInteraction = () => { if (firstInteractionAt.current === null) firstInteractionAt.current = performance.now() }
  const toggleSelected = (id: string) => { noteInteraction(); setChanges((value) => value + 1); setSelected((current) => { const next = new Set(current); next.has(id) ? next.delete(id) : next.add(id); return next }) }
  const useHint = () => { setHints((value) => value + 1); setShowHint(true) }

  const finishRound = (metric: Metric, summary: string, correct: number, possible: number) => {
    setMetrics((current) => [...current, metric]); setTotalCorrect((value) => value + correct); setTotalPossible((value) => value + possible); setLastSummary(summary); setPhase('round-result')
  }

  const submitObjectLike = () => {
    if (!config) return
    const targetIds = new Set(config.targets.map((item) => item.id))
    const correct = [...selected].filter((id) => targetIds.has(id)).length
    const falseSelections = [...selected].filter((id) => !targetIds.has(id)).length
    const missed = config.targets.length - correct
    const responseTimeMs = performance.now() - taskStartedAt.current
    finishRound({ round: round + 1, type: ROUND_TYPES[round]!, correctTargets: correct, missedTargets: missed, falseSelections, timeToFirstSelectionMs: firstInteractionAt.current ? firstInteractionAt.current - taskStartedAt.current : responseTimeMs, responseTimeMs, selectionChanges: changes, hints, accuracy: Math.max(0, correct - falseSelections) / config.targets.length * 100 }, `${correct} of ${config.targets.length} remembered`, Math.max(0, correct - falseSelections), config.targets.length)
  }

  const addToOrder = (item: GameChoice) => { noteInteraction(); if (ordered.some((value) => value.id === item.id)) return; setChanges((value) => value + 1); setOrdered((current) => [...current, item]) }
  const removeFromOrder = (id: string) => { noteInteraction(); setChanges((value) => value + 1); setOrdered((current) => current.filter((item) => item.id !== id)) }
  const reorderAt = (targetIndex: number) => { if (!draggedId) return; noteInteraction(); setChanges((value) => value + 1); setOrdered((current) => { const from = current.findIndex((item) => item.id === draggedId); const next = [...current]; const item = from >= 0 ? next.splice(from, 1)[0] : config?.options.find((value) => value.id === draggedId); if (item) next.splice(targetIndex, 0, item); return next }); setDraggedId(null) }
  const submitOrder = () => {
    if (!config) return
    const correctPositions = config.targets.filter((item, index) => ordered[index]?.id === item.id).length
    const responseTimeMs = performance.now() - taskStartedAt.current
    finishRound({ round: round + 1, type: 'order', correctPositionCount: correctPositions, sequenceErrors: config.targets.length - correctPositions, responseTimeMs, answerChanges: changes, hints, accuracy: correctPositions / config.targets.length * 100 }, `${correctPositions} of ${config.targets.length} positions correct`, correctPositions, config.targets.length)
  }
  const chooseLocation = (index: number) => {
    noteInteraction(); setChanges((value) => value + 1)
    if (locationObjects[index]?.id !== locationTarget?.id) { setIncorrectAttempts((value) => value + 1); return }
    const responseTimeMs = performance.now() - taskStartedAt.current
    finishRound({ round: round + 1, type: 'location', correctLocation: true, responseTimeMs, incorrectAttempts, hints, accuracy: 100 }, 'You found the right place', 1, 1)
  }

  const persistAndFinish = () => {
    const responseTimes = metrics.map((item) => Number(item.responseTimeMs))
    const average = responseTimes.length ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) : 0
    if (user?.id) {
      void Promise.allSettled([
        saveGameSession({ patientId: user.id, gameType: 'memory', difficultyLevel: difficulty, correctCount: totalCorrect, totalCount: totalPossible, responseTimeMs: average, hintsUsed: metrics.reduce((sum, item) => sum + item.hints, 0) }),
        saveRichGameMetrics({ patientId: user.id, gameType: 'memory', metrics: { mode, difficulty, rounds: metrics, averageResponseTimeMs: average, completed: true } }),
      ]).then((results) => { if (results.some((item) => item.status === 'rejected')) toast.info('Activity complete. Some details will save later.') })
    }
    setPhase('final-result')
  }

  const nextRound = () => { if (round + 1 >= TOTAL_ROUNDS) persistAndFinish(); else prepareRound(round + 1) }
  const averageResponse = metrics.length ? Math.round(metrics.reduce((sum, item) => sum + item.responseTimeMs, 0) / metrics.length / 1000) : 0
  const accuracy = totalPossible ? Math.round(totalCorrect / totalPossible * 100) : 0
  const goBack = () => phase === 'intro' ? navigate(mode === 'daily' ? '/patient' : '/patient/games') : setExitOpen(true)

  if (!ready) return <div className="patient-ui flex min-h-screen items-center justify-center bg-background"><p className="text-xl text-muted-foreground">Loading activity…</p></div>

  return (
    <div className="patient-ui min-h-screen bg-background">
      <ExitDialog open={exitOpen} onOpenChange={setExitOpen} onLeave={() => navigate(mode === 'daily' ? '/patient' : '/patient/games')} />
      <Celebration active={phase === 'final-result' && accuracy >= 50} />
      <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-5 py-6 sm:px-8">
        {phase !== 'intro' && phase !== 'final-result' && <GameHeader round={round} onBack={goBack} />}
        {phase === 'intro' && <Intro title="Memory Recall" description="Four gentle activities using familiar objects." backLabel={mode === 'daily' ? 'Home' : 'Activities'} onBack={goBack} onStart={startSession} />}
        {phase === 'delayed-preview' && <MemoryDisplay title="Remember these for later" subtitle="You will see these objects again near the end." items={delayedObjects} seconds={viewTimeLeft} />}
        {phase === 'memorise' && config && <MemoryDisplay title={round === 1 ? 'Remember the order' : round === 2 ? 'Remember where each object is' : 'Remember these objects'} subtitle="Take your time and look carefully." items={round === 2 ? locationObjects : config.targets} seconds={viewTimeLeft} locationGrid={round === 2} />}
        {phase === 'task' && config && ROUND_TYPES[round] === 'object' && <ObjectRecall title="Which objects did you just see?" config={config} selected={selected} onToggle={toggleSelected} hints={hints} showHint={showHint} onHint={useHint} onSubmit={submitObjectLike} />}
        {phase === 'task' && config && ROUND_TYPES[round] === 'delayed' && <ObjectRecall title="Which objects did you see earlier?" config={config} selected={selected} onToggle={toggleSelected} hints={hints} showHint={showHint} onHint={useHint} onSubmit={submitObjectLike} />}
        {phase === 'task' && config && ROUND_TYPES[round] === 'order' && <OrderTask config={config} ordered={ordered} onAdd={addToOrder} onRemove={removeFromOrder} onDragStart={setDraggedId} onDrop={reorderAt} onSubmit={submitOrder} />}
        {phase === 'task' && ROUND_TYPES[round] === 'location' && <LocationTask count={locationObjects.length} target={locationTarget} attempts={incorrectAttempts} onChoose={chooseLocation} />}
        {phase === 'round-result' && <RoundResult title={lastSummary} isLast={round + 1 >= TOTAL_ROUNDS} onNext={nextRound} />}
        {phase === 'final-result' && <MemoryResults accuracy={accuracy} remembered={totalCorrect} averageResponse={averageResponse} mode={mode} onContinue={() => navigate('/patient/game/pattern?mode=daily')} onActivities={() => navigate('/patient/games')} onAgain={() => setPhase('intro')} />}
      </main>
    </div>
  )
}

function GameHeader({ round, onBack }: { round: number; onBack: () => void }) { return <header className="mb-5"><div className="flex items-center justify-between gap-4"><Button variant="ghost" onClick={onBack}><ArrowLeft data-icon="inline-start" />Back</Button><p className="text-lg font-semibold text-foreground">Round {round + 1} of 4</p></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-valuenow={round + 1} aria-valuemin={1} aria-valuemax={4}><div className="h-full rounded-full bg-primary transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${(round + 1) * 25}%` }} /></div><div className="mt-3 flex justify-center gap-3" aria-hidden="true">{[0,1,2,3].map((item) => <span key={item} className={`size-3 rounded-full ${item <= round ? 'bg-primary' : 'bg-border'}`} />)}</div></header> }
function Intro({ title, description, backLabel, onBack, onStart }: { title: string; description: string; backLabel: string; onBack: () => void; onStart: () => void }) { return <section className="flex flex-1 flex-col items-center justify-center text-center"><Button variant="ghost" className="absolute left-5 top-6" onClick={onBack}><ArrowLeft data-icon="inline-start" />{backLabel}</Button><div className="flex size-20 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Apple className="size-10" /></div><h1 className="mt-6 text-[2.5rem] font-bold tracking-[-0.02em] text-foreground">{title}</h1><p className="mt-3 max-w-md text-xl leading-relaxed text-muted-foreground">{description}</p><Button size="lg" className="mt-9 min-h-16 w-full max-w-sm text-xl" onClick={onStart}>Start Activity</Button></section> }
function ObjectVisual({ item, compact = false }: { item: GameChoice; compact?: boolean }) { const Icon = iconMap[item.id as keyof typeof iconMap] ?? Apple; return <><Icon className={compact ? 'size-9' : 'size-12'} aria-hidden="true" /><span className="mt-2 text-base font-semibold">{item.label}</span></> }
function MemoryDisplay({ title, subtitle, items, seconds, locationGrid }: { title: string; subtitle: string; items: GameChoice[]; seconds: number; locationGrid?: boolean }) { return <section className="flex flex-1 flex-col items-center justify-center text-center"><p className="text-5xl font-bold tabular-nums text-primary">{seconds}</p><h1 className="mt-4 text-3xl font-bold text-foreground">{title}</h1><p className="mt-2 text-lg text-muted-foreground">{subtitle}</p><div className={`mt-8 grid w-full max-w-2xl gap-4 ${locationGrid ? (items.length <= 4 ? 'grid-cols-2' : 'grid-cols-3') : 'grid-cols-2 sm:grid-cols-3'}`}>{items.map((item) => <div key={item.id} className="flex min-h-32 flex-col items-center justify-center rounded-xl border border-border bg-card p-4 text-primary"><ObjectVisual item={item} /></div>)}</div></section> }
function ObjectRecall({ title, config, selected, onToggle, hints, showHint, onHint, onSubmit }: { title: string; config: MemoryRoundConfig; selected: Set<string>; onToggle: (id: string) => void; hints: number; showHint: boolean; onHint: () => void; onSubmit: () => void }) { return <section className="flex flex-1 flex-col"><h1 className="mt-4 text-center text-3xl font-bold text-foreground">{title}</h1>{showHint && <p className="mx-auto mt-4 rounded-xl bg-primary/10 px-5 py-3 text-lg font-medium text-primary">Think about the objects and take your time.</p>}<div className="mx-auto mt-8 grid w-full max-w-2xl grid-cols-2 gap-4 sm:grid-cols-3">{config.options.map((item) => { const chosen = selected.has(item.id); return <button key={item.id} onClick={() => onToggle(item.id)} aria-pressed={chosen} className="relative flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-border bg-card p-4 text-primary transition-colors duration-150 hover:border-primary/40 hover:bg-accent active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-pressed:border-primary aria-pressed:bg-primary/10"><ObjectVisual item={item} />{chosen && <Check className="absolute right-3 top-3 size-6" aria-label="Selected" />}</button>})}</div><div className="mx-auto mt-auto flex w-full max-w-2xl flex-col gap-3 pt-7 sm:flex-row"><Button variant="outline" size="lg" className="flex-1 text-lg" onClick={onHint} disabled={showHint}><Lightbulb data-icon="inline-start" />Hint {hints > 0 ? `(${hints})` : ''}</Button><Button size="lg" className="flex-1 text-lg" onClick={onSubmit} disabled={selected.size === 0}>Submit Answer</Button></div></section> }
function OrderTask({ config, ordered, onAdd, onRemove, onDragStart, onDrop, onSubmit }: { config: MemoryRoundConfig; ordered: GameChoice[]; onAdd: (item: GameChoice) => void; onRemove: (id: string) => void; onDragStart: (id: string) => void; onDrop: (index: number) => void; onSubmit: () => void }) { return <section className="flex flex-1 flex-col"><h1 className="mt-4 text-center text-3xl font-bold text-foreground">Put the objects in the remembered order</h1><p className="mt-2 text-center text-lg text-muted-foreground">Click each object in order, or drag objects into the numbered places.</p><div className="mx-auto mt-7 flex w-full max-w-3xl flex-wrap justify-center gap-3">{config.options.map((item) => <button key={item.id} draggable={!ordered.some((value) => value.id === item.id)} onDragStart={() => onDragStart(item.id)} onClick={() => onAdd(item)} disabled={ordered.some((value) => value.id === item.id)} className="flex min-h-24 min-w-28 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-border bg-card p-3 text-primary transition-colors duration-150 hover:border-primary/40 hover:bg-accent active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"><ObjectVisual item={item} compact /></button>)}</div><ol className="mx-auto mt-8 grid w-full max-w-3xl gap-3 sm:grid-cols-2">{Array.from({ length: config.targets.length }, (_, index) => { const item = ordered[index]; return <li key={index} onDragOver={(event) => event.preventDefault()} onDrop={() => onDrop(index)} className="min-h-20"><button disabled={!item} draggable={Boolean(item)} onDragStart={() => item && onDragStart(item.id)} onClick={() => item && onRemove(item.id)} className="flex min-h-20 w-full cursor-pointer items-center gap-4 rounded-xl border-2 border-dashed border-border bg-card px-5 text-left text-primary transition-colors duration-150 hover:border-primary/40 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"><span className="text-xl font-bold text-muted-foreground">{index + 1}</span>{item ? <><GripVertical className="size-5" /><ObjectVisual item={item} compact /></> : <span className="text-lg text-muted-foreground">Choose an object</span>}</button></li>})}</ol><Button size="lg" className="mx-auto mt-auto w-full max-w-sm text-lg" disabled={ordered.length !== config.targets.length} onClick={onSubmit}>Check Order</Button></section> }
function LocationTask({ count, target, attempts, onChoose }: { count: number; target: GameChoice | null; attempts: number; onChoose: (index: number) => void }) { return <section className="flex flex-1 flex-col items-center"><h1 className="mt-5 text-center text-3xl font-bold text-foreground">Where was the {target?.label.toLowerCase()}?</h1><p className="mt-2 text-lg text-muted-foreground">Choose one place.</p>{attempts > 0 && <p role="status" className="mt-4 rounded-xl bg-secondary px-5 py-3 text-lg text-foreground">Try another place.</p>}<div className={`mt-8 grid w-full max-w-2xl gap-4 ${count <= 4 ? 'grid-cols-2' : 'grid-cols-3'}`}>{Array.from({ length: count }, (_, index) => <button key={index} onClick={() => onChoose(index)} className="flex aspect-square cursor-pointer items-center justify-center rounded-xl border-2 border-border bg-card text-2xl font-bold text-muted-foreground transition-colors duration-150 hover:border-primary/50 hover:bg-primary/10 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring" aria-label={`Position ${index + 1}`}>{index + 1}</button>)}</div></section> }
function RoundResult({ title, isLast, onNext }: { title: string; isLast: boolean; onNext: () => void }) { return <section className="flex flex-1 flex-col items-center justify-center text-center"><div className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary"><Check className="size-10" /></div><h1 className="mt-6 text-3xl font-bold text-foreground">Good effort</h1><p className="mt-3 text-xl text-muted-foreground">{title}</p><Button size="lg" className="mt-9 min-h-16 w-full max-w-sm text-xl" onClick={onNext}>{isLast ? 'See Results' : 'Next Round'}</Button></section> }
function MemoryResults({ accuracy, remembered, averageResponse, mode, onContinue, onActivities, onAgain }: { accuracy: number; remembered: number; averageResponse: number; mode: GameMode; onContinue: () => void; onActivities: () => void; onAgain: () => void }) { const items = [['Accuracy', `${accuracy}%`], ['Objects remembered', String(remembered)], ['Average response time', `${averageResponse} sec`], ['Rounds completed', '4 of 4']]; return <section className="flex flex-1 flex-col items-center justify-center text-center"><h1 className="text-[2.5rem] font-bold tracking-[-0.02em] text-foreground">Activity Complete</h1><p className="mt-3 text-xl text-muted-foreground">Memory Recall</p><dl className="mt-8 grid w-full max-w-xl grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border">{items.map(([label,value]) => <div key={label} className="bg-card p-5"><dt className="text-base text-muted-foreground">{label}</dt><dd className="mt-2 text-2xl font-bold text-foreground">{value}</dd></div>)}</dl><div className="mt-8 flex w-full max-w-sm flex-col gap-3"><Button size="lg" className="text-lg" onClick={mode === 'daily' ? onContinue : onActivities}>{mode === 'daily' ? 'Continue to Pattern & Attention' : 'Back to Activities'}</Button><Button size="lg" variant="outline" onClick={onAgain}>Play Again</Button></div></section> }
