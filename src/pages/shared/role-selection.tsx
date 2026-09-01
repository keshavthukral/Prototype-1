import { useNavigate } from 'react-router-dom'
import { useLanguage } from '@/lib/i18n/language-context'
import { Heart, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

export function RoleSelectionPage() {
  const navigate = useNavigate()
  const { t } = useLanguage()

  return (
    <div className="flex min-h-screen flex-col items-center bg-background px-6 py-12 page-enter">
      <main className="flex w-full max-w-lg flex-col items-center px-4" role="main">
        {/* ── Brand Header ─────────────────────────────────── */}
        <div className="mb-3 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Heart className="size-8" aria-hidden="true" />
        </div>

        <h1 className="mt-4 mb-2 text-4xl font-bold tracking-tight text-foreground">
          {t('app_name')}
        </h1>

        <p className="mb-10 max-w-sm text-center text-base leading-relaxed text-muted-foreground">
          A simple companion for everyday memory, activities, and reminders.
        </p>

        {/* ── Role Cards ───────────────────────────────────── */}
        <div className="flex w-full flex-col gap-4">
          <button
            onClick={() => navigate('/patient/language')}
            className={cn(
              'group flex w-full items-center gap-5 rounded-2xl border-2 border-border bg-card p-6',
              'cursor-pointer text-left transition-all duration-150',
              'hover:border-primary/40 hover:bg-accent/50 hover:shadow-sm',
              'active:scale-[0.99]',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'
            )}
            aria-label={t('i_am_patient')}
          >
            <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-150 group-hover:bg-primary/15">
              <Heart className="size-7" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold text-foreground">{t('i_am_patient')}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Access your activities, games, and memories
              </p>
            </div>
            <svg className="size-5 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>

          <button
            onClick={() => navigate('/caregiver/login')}
            className={cn(
              'group flex w-full items-center gap-5 rounded-2xl border-2 border-border bg-card p-6',
              'cursor-pointer text-left transition-all duration-150',
              'hover:border-primary/40 hover:bg-accent/50 hover:shadow-sm',
              'active:scale-[0.99]',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'
            )}
            aria-label={t('i_am_caregiver')}
          >
            <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground transition-colors duration-150 group-hover:bg-accent">
              <Users className="size-7" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold text-foreground">{t('i_am_caregiver')}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Monitor progress and manage care
              </p>
            </div>
            <svg className="size-5 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      </main>
    </div>
  )
}
