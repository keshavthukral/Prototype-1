import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '@/lib/i18n/language-context'
import { useAuth } from '@/lib/supabase/auth-context'
import { isSupabaseConfigured, supabase } from '@/lib/supabase/client'
import { memoryRepository } from '@/lib/repositories/memory'
import type { LocalMemory } from '@/lib/db/database'

import { HearAgain } from '@/components/patient/hear-again'
import { ArrowLeft, User, BookOpen, WifiOff, ChevronLeft, ChevronRight, LayoutGrid } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SupabaseMemoryRow {
  id: string
  patient_id: string
  created_by: string | null
  name: string
  relationship: string | null
  description: string | null
  image_url: string | null
  image_storage_path: string | null
  created_at: string
  updated_at: string
}

export function MemoriesPage() {
  const navigate = useNavigate()
  const { t, language } = useLanguage()
  const { user } = useAuth()
  const [memories, setMemories] = useState<LocalMemory[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isOfflineCache, setIsOfflineCache] = useState(false)
  const [viewAll, setViewAll] = useState(false)

  const loadMemories = useCallback(async () => {
    if (!user) { setLoading(false); return }
    const patientId = user.id
    const localMemories = await memoryRepository.getByPatientId(patientId)
    if (localMemories.length > 0) {
      setMemories(localMemories)
      setIsOfflineCache(!isSupabaseConfigured() || !navigator.onLine)
      setLoading(false)
      return
    }
    if (isSupabaseConfigured() && navigator.onLine) {
      try {
        const { data } = await supabase.from('memories').select('*').order('created_at', { ascending: false })
        if (data && data.length > 0) {
          const typedData = data as unknown as SupabaseMemoryRow[]
          for (const remote of typedData) {
            await memoryRepository.create({
              id: remote.id, patientId: remote.patient_id, createdBy: remote.created_by ?? undefined,
              name: remote.name, relationship: remote.relationship ?? undefined,
              description: remote.description ?? undefined, imageUrl: remote.image_url ?? undefined,
              imageStoragePath: remote.image_storage_path ?? undefined,
            })
          }
          const cachedMemories = await memoryRepository.getByPatientId(patientId)
          setMemories(cachedMemories)
        }
      } catch (err) { console.error('Failed to fetch memories from Supabase:', err) }
    }
    setLoading(false)
  }, [user])

  useEffect(() => { loadMemories() }, [loadMemories])

  const goToPrev = useCallback(() => setCurrentIndex((prev) => (prev > 0 ? prev - 1 : memories.length - 1)), [memories.length])
  const goToNext = useCallback(() => setCurrentIndex((prev) => (prev < memories.length - 1 ? prev + 1 : 0)), [memories.length])

  useEffect(() => {
    if (memories.length === 0) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'ArrowLeft') goToPrev(); if (e.key === 'ArrowRight') goToNext() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [goToPrev, goToNext, memories.length])

  const [touchStart, setTouchStart] = useState<number | null>(null)
  const handleTouchStart = (e: React.TouchEvent) => { const touch = e.touches[0]; if (touch) setTouchStart(touch.clientX) }
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return
    const changedTouch = e.changedTouches[0]
    if (!changedTouch) return
    const diff = touchStart - changedTouch.clientX
    if (Math.abs(diff) > 50) { if (diff > 0) goToNext(); else goToPrev() }
    setTouchStart(null)
  }

  const current = memories[currentIndex]
  const hasMultiple = memories.length > 1
  const localized = (memory: LocalMemory) => ({
    name: language === 'as' ? memory.nameAs ?? memory.name : memory.name,
    relationship: language === 'as' ? memory.relationshipAs ?? memory.relationship : memory.relationship,
    description: language === 'as' ? memory.descriptionAs ?? memory.description : memory.description,
  })
  const currentText = current ? localized(current) : null
  const readAloudText = current ? `${currentText?.name}. ${currentText?.relationship ?? ''}. ${currentText?.description ?? ''}` : ''

  return (
    <main id="main-content" className="patient-content mx-auto flex w-full flex-1 flex-col px-5 pt-6 pb-8 sm:px-8 lg:px-12 lg:pt-8 page-enter">
        <button
          onClick={() => navigate('/patient')}
          className="mb-5 flex h-11 w-fit cursor-pointer items-center gap-2 rounded-lg px-2 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t('back')}
        </button>

        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {t('memory_book')}
          </h1>
          <p className="mt-1.5 text-base text-muted-foreground">
            {t('memory_book_instruction')}
          </p>
          {isOfflineCache && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <WifiOff className="h-3.5 w-3.5" />
              {t('viewing_cached')}
            </p>
          )}
        </header>

        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-base text-muted-foreground">{t('loading')}</p>
          </div>
        ) : memories.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <BookOpen className="mb-3 size-12 text-muted-foreground/30" aria-hidden="true" />
            <p className="text-base text-muted-foreground">{t('no_memories')}</p>
          </div>
        ) : viewAll ? (
          <section aria-labelledby="all-memories-heading" className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <h2 id="all-memories-heading" className="text-xl font-bold text-foreground">{t('all_memories')}</h2>
              <Button variant="outline" size="sm" onClick={() => setViewAll(false)}>{t('show_one')}</Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {memories.map((memory, index) => (
                <button
                  key={memory.id}
                  onClick={() => { setCurrentIndex(index); setViewAll(false) }}
                  className="cursor-pointer overflow-hidden rounded-2xl border border-border bg-card text-left transition-all duration-150 hover:border-primary/30 hover:bg-accent/50 hover:shadow-sm active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  {memory.imageUrl && <img src={memory.imageUrl} alt={`Photo of ${localized(memory).name}`} className="aspect-[4/3] w-full object-cover" loading="lazy" />}
                  <span className="block p-4">
                    <span className="block text-base font-bold text-foreground">{localized(memory).name}</span>
                    <span className="mt-0.5 block text-sm font-medium text-primary">{localized(memory).relationship}</span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        ) : current ? (
          <div
            className="flex flex-1 flex-col items-center"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Counter */}
            <p className="mb-4 text-sm font-medium text-muted-foreground">
              {t('memory_counter')
                .replace('{current}', String(currentIndex + 1))
                .replace('{total}', String(memories.length))}
            </p>

            {/* Photo — large, centered */}
            <div className="mb-5">
              {current.imageUrl ? (
                <div className="h-56 w-56 overflow-hidden rounded-2xl bg-card ring-1 ring-border sm:h-72 sm:w-72">
                  <img
                    src={current.imageUrl}
                    alt={currentText?.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="flex h-56 w-56 items-center justify-center rounded-2xl bg-primary/5 ring-1 ring-border sm:h-72 sm:w-72">
                  <User className="h-20 w-20 text-primary/25" aria-hidden="true" />
                </div>
              )}
            </div>

            {/* Name */}
            <h2 className="mb-0.5 text-2xl font-bold text-foreground">{currentText?.name}</h2>

            {/* Relationship */}
            {currentText?.relationship && (
              <p className="mb-2 text-base font-medium text-primary">{currentText.relationship}</p>
            )}

            {/* Description */}
            {currentText?.description && (
              <p className="mb-5 max-w-sm text-center text-base leading-relaxed text-muted-foreground">
                {currentText.description}
              </p>
            )}

            {/* Read aloud */}
            <HearAgain
              text={readAloudText}
              label={t('hear_memory')}
              className="mb-6"
            />

            {/* Prev / Next navigation */}
            {hasMultiple && (
              <div className="flex w-full max-w-sm gap-3">
                <button
                  onClick={goToPrev}
                  className="flex h-14 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-border bg-card text-base font-medium text-foreground transition-colors duration-150 hover:border-primary/30 hover:bg-accent active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  aria-label={t('previous')}
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  {t('previous')}
                </button>
                <button
                  onClick={goToNext}
                  className="flex h-14 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-border bg-card text-base font-medium text-foreground transition-colors duration-150 hover:border-primary/30 hover:bg-accent active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  aria-label={t('next_memory')}
                >
                  {t('next_memory')}
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            )}

            <Button variant="outline" size="lg" className="mt-5 text-base" onClick={() => setViewAll(true)}>
              <LayoutGrid data-icon="inline-start" />{t('view_all_memories')}
            </Button>

            {/* Dot indicators */}
            {hasMultiple && (
              <div className="mt-5 flex gap-1.5" aria-hidden="true">
                {memories.map((_mem, idx) => (
                  <button
                    key={_mem.id}
                    onClick={() => setCurrentIndex(idx)}
                    aria-pressed={idx === currentIndex}
                    className={cn(
                      'size-2.5 rounded-full transition-colors duration-150 cursor-pointer',
                      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                      idx === currentIndex ? 'bg-primary' : 'bg-border hover:bg-muted-foreground/30'
                    )}
                    aria-label={`${t('memories')} ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : null}
    </main>
  )
}
