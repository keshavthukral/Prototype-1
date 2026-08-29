import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '@/lib/i18n/language-context'
import { useAuth } from '@/lib/supabase/auth-context'
import { isSupabaseConfigured, supabase } from '@/lib/supabase/client'
import { memoryRepository } from '@/lib/repositories/memory'
import type { LocalMemory } from '@/lib/db/database'
import { PatientBottomNav } from '@/components/patient/bottom-nav'
import { HearAgain } from '@/components/patient/hear-again'
import { ArrowLeft, User, BookOpen, WifiOff, ChevronLeft, ChevronRight } from 'lucide-react'

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
  const { t } = useLanguage()
  const { user } = useAuth()
  const [memories, setMemories] = useState<LocalMemory[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isOfflineCache, setIsOfflineCache] = useState(false)

  const loadMemories = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }

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
        const { data } = await supabase
          .from('memories')
          .select('*')
          .order('created_at', { ascending: false })

        if (data && data.length > 0) {
          const typedData = data as unknown as SupabaseMemoryRow[]
          for (const remote of typedData) {
            await memoryRepository.create({
              id: remote.id,
              patientId: remote.patient_id,
              createdBy: remote.created_by ?? undefined,
              name: remote.name,
              relationship: remote.relationship ?? undefined,
              description: remote.description ?? undefined,
              imageUrl: remote.image_url ?? undefined,
              imageStoragePath: remote.image_storage_path ?? undefined,
            })
          }

          const cachedMemories = await memoryRepository.getByPatientId(patientId)
          setMemories(cachedMemories)
        }
      } catch (err) {
        console.error('Failed to fetch memories from Supabase:', err)
      }
    }

    setLoading(false)
  }, [user])

  useEffect(() => {
    loadMemories()
  }, [loadMemories])

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : memories.length - 1))
  }, [memories.length])

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < memories.length - 1 ? prev + 1 : 0))
  }, [memories.length])

  useEffect(() => {
    if (memories.length === 0) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrev()
      if (e.key === 'ArrowRight') goToNext()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [goToPrev, goToNext, memories.length])

  const [touchStart, setTouchStart] = useState<number | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    if (touch) setTouchStart(touch.clientX)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return
    const changedTouch = e.changedTouches[0]
    if (!changedTouch) return
    const diff = touchStart - changedTouch.clientX
    if (Math.abs(diff) > 50) {
      if (diff > 0) goToNext()
      else goToPrev()
    }
    setTouchStart(null)
  }

  const current = memories[currentIndex]
  const hasMultiple = memories.length > 1
  const readAloudText = current
    ? `${current.name}. ${current.relationship ?? ''}. ${current.description ?? ''}`
    : ''

  return (
    <div className="patient-ui flex min-h-screen flex-col bg-background">
      <main className="flex flex-1 flex-col px-6 pt-8 pb-24">
        <button
          onClick={() => navigate('/patient')}
          className="mb-6 flex h-12 w-fit items-center gap-2 rounded-lg px-2 text-base text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          {t('back')}
        </button>

        <header className="mb-8">
          <h1 className="mb-1 text-[2.25rem] font-bold text-foreground sm:text-[2.5rem]">
            {t('memory_book')}
          </h1>
          <p className="text-lg text-muted-foreground">
            {t('memory_book_instruction')}
          </p>
          {isOfflineCache && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <WifiOff className="h-4 w-4" />
              {t('viewing_cached')}
            </p>
          )}
        </header>

        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-lg text-muted-foreground">{t('loading')}</p>
          </div>
        ) : memories.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <BookOpen className="mb-4 h-12 w-12 text-muted-foreground/50" aria-hidden="true" />
            <p className="text-lg text-muted-foreground">{t('no_memories')}</p>
          </div>
        ) : current ? (
          <div
            className="flex flex-1 flex-col items-center"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Counter */}
            <p className="mb-6 text-sm font-medium text-muted-foreground">
              {t('memory_counter')
                .replace('{current}', String(currentIndex + 1))
                .replace('{total}', String(memories.length))}
            </p>

            {/* Photo — large, one at a time */}
            <div className="mb-6">
              {current.imageUrl ? (
                <div className="h-64 w-64 overflow-hidden rounded-xl bg-card ring-1 ring-border sm:h-80 sm:w-80">
                  <img
                    src={current.imageUrl}
                    alt={current.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="flex h-64 w-64 items-center justify-center rounded-xl bg-primary/5 ring-1 ring-border sm:h-80 sm:w-80">
                  <User className="h-28 w-28 text-primary/30" aria-hidden="true" />
                </div>
              )}
            </div>

            {/* Name */}
            <h2 className="mb-1 text-[1.75rem] font-bold text-foreground">{current.name}</h2>

            {/* Relationship */}
            {current.relationship && (
              <p className="mb-3 text-lg font-medium text-primary">{current.relationship}</p>
            )}

            {/* Description */}
            {current.description && (
              <p className="mb-6 max-w-sm text-center text-lg leading-relaxed text-muted-foreground">
                {current.description}
              </p>
            )}

            {/* Read aloud */}
            <HearAgain
              text={readAloudText}
              label={t('read_aloud')}
              className="mb-8"
            />

            {/* Prev / Next — large, obvious buttons for elderly users */}
            {hasMultiple && (
              <div className="flex w-full max-w-sm gap-4">
                <button
                  onClick={goToPrev}
                  className="flex h-14 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-border bg-card text-base font-medium text-foreground transition-colors duration-150 hover:border-primary/30 hover:bg-accent active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  aria-label={t('prev_memory')}
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  {t('prev_memory')}
                </button>
                <button
                  onClick={goToNext}
                  className="flex h-14 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-border bg-card text-base font-medium text-foreground transition-colors duration-150 hover:border-primary/30 hover:bg-accent active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  aria-label={t('next_memory')}
                >
                  {t('next_memory')}
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            )}

            {/* Dot indicators for multiple memories */}
            {hasMultiple && (
              <div className="mt-6 flex gap-2" aria-hidden="true">
                {memories.map((_mem, idx) => (
                  <button
                    key={_mem.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-2.5 rounded-full transition-all ${
                      idx === currentIndex
                        ? 'w-8 bg-primary'
                        : 'w-2.5 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                    }`}
                    aria-label={`Memory ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : null}
      </main>

      <PatientBottomNav />
    </div>
  )
}
