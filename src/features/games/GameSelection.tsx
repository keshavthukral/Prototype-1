/**
 * Game Selection — /patient/games
 *
 * Polished activity library with clear cards.
 */

import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Brain, Shapes, Clock } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/language-context'
import { cn } from '@/lib/utils'

const ACTIVITIES = [
  {
    id: 'memory',
    path: '/patient/game/memory?mode=practice',
    icon: Brain,
    titleKey: 'memory_recall' as const,
    descKey: 'memory_recall_desc' as const,
    duration: '5 min',
    difficulty: 'Adaptive',
  },
  {
    id: 'pattern',
    path: '/patient/game/pattern?mode=practice',
    icon: Shapes,
    titleKey: 'pattern_attention' as const,
    descKey: 'pattern_attention_desc' as const,
    duration: '5 min',
    difficulty: 'Adaptive',
  },
]

export function GameSelection() {
  const navigate = useNavigate()
  const { t } = useLanguage()

  return (
    <main className="patient-content mx-auto flex w-full flex-1 flex-col px-5 pt-6 pb-8 sm:px-8 lg:px-12 lg:pt-8 page-enter">

        {/* Back */}
        <button
          onClick={() => navigate('/patient')}
          className="mb-6 flex h-11 w-fit cursor-pointer items-center gap-2 rounded-lg px-2 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t('home')}
        </button>

        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {t('activities')}
          </h1>
          <p className="mt-1.5 text-base text-muted-foreground">
            Take your time. You can play either activity.
          </p>
        </header>

        {/* Activity cards */}
        <div className="flex flex-col gap-4">
          {ACTIVITIES.map((activity) => {
            const Icon = activity.icon
            return (
              <button
                key={activity.id}
                onClick={() => navigate(activity.path)}
                aria-label={`${t(activity.titleKey)}: ${t(activity.descKey)}. ${activity.duration}.`}
                className={cn(
                  'group flex w-full items-center gap-5 rounded-2xl border border-border bg-card p-5',
                  'cursor-pointer text-left transition-all duration-150',
                  'hover:border-primary/30 hover:bg-accent/50 hover:shadow-sm',
                  'active:scale-[0.99]',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'
                )}
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-150 group-hover:bg-primary/15">
                  <Icon className="h-7 w-7" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-bold text-foreground">{t(activity.titleKey)}</h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">{t(activity.descKey)}</p>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                      <Clock className="size-3" aria-hidden="true" />
                      {activity.duration}
                    </span>
                    <span className="text-xs font-medium text-primary/70">{activity.difficulty}</span>
                  </div>
                </div>
                <svg
                  className="size-5 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-primary"
                  fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            )
          })}
        </div>
    </main>
  )
}
