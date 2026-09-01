/**
 * Activity Hub — /patient/games
 *
 * Visual activity library with large, distinct cards per game.
 * Each card shows the game icon, a one-sentence description,
 * estimated duration, and a preview of what's inside.
 */

import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Brain, Shapes, Clock, Zap, Grid3X3, Search, ArrowUpDown, Image } from 'lucide-react'
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
    color: 'emerald' as const,
    rounds: [
      { label: 'Visual recall', icon: Search },
      { label: 'Spatial memory', icon: Grid3X3 },
      { label: 'Order memory', icon: ArrowUpDown },
      { label: 'Personal story', icon: Image },
      { label: 'Delayed recall', icon: Brain },
    ],
  },
  {
    id: 'pattern',
    path: '/patient/game/pattern?mode=practice',
    icon: Shapes,
    titleKey: 'pattern_attention' as const,
    descKey: 'pattern_attention_desc' as const,
    duration: '5 min',
    color: 'violet' as const,
    rounds: [
      { label: 'Trail connect', icon: Zap },
      { label: 'Cancellation', icon: Search },
      { label: 'Rule switch', icon: ArrowUpDown },
      { label: 'Daily sequences', icon: Grid3X3 },
    ],
  },
]

const COLOR_MAP = {
  emerald: {
    iconBg: 'bg-emerald-500/10',
    iconText: 'text-emerald-600',
    ring: 'group-hover:ring-emerald-400/30',
    badge: 'bg-emerald-500/10 text-emerald-700',
    roundDot: 'bg-emerald-500/20 text-emerald-700',
  },
  violet: {
    iconBg: 'bg-violet-500/10',
    iconText: 'text-violet-600',
    ring: 'group-hover:ring-violet-400/30',
    badge: 'bg-violet-500/10 text-violet-700',
    roundDot: 'bg-violet-500/20 text-violet-700',
  },
} as const

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

      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Choose your activity
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          Take your time. Pick whichever feels right today.
        </p>
      </header>

      {/* Activity cards — large, visual, per-game */}
      <div className="flex flex-col gap-5">
        {ACTIVITIES.map((activity) => {
          const Icon = activity.icon
          const c = COLOR_MAP[activity.color]
          return (
            <button
              key={activity.id}
              onClick={() => navigate(activity.path)}
              aria-label={`${t(activity.titleKey)}: ${t(activity.descKey)}. ${activity.duration}.`}
              className={cn(
                'group relative flex w-full flex-col overflow-hidden rounded-3xl border border-border bg-card',
                'cursor-pointer text-left transition-all duration-200',
                'hover:shadow-lg hover:ring-2',
                'active:scale-[0.99]',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                c.ring,
              )}
            >
              {/* Top section */}
              <div className="flex items-start gap-5 px-6 pt-6 pb-4">
                <div className={cn(
                  'flex size-14 shrink-0 items-center justify-center rounded-2xl shadow-sm',
                  c.iconBg,
                  c.iconText,
                )}>
                  <Icon className="size-7" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-bold text-foreground">{t(activity.titleKey)}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {t(activity.descKey)}
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <Clock className="size-3.5" aria-hidden="true" />
                      {activity.duration}
                    </span>
                    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', c.badge)}>
                      Adaptive
                    </span>
                  </div>
                </div>
              </div>

              {/* Preview of what's inside */}
              <div className="border-t border-border/60 bg-secondary/30 px-6 py-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">
                  What you'll do
                </p>
                <div className="flex flex-wrap gap-2">
                  {activity.rounds.map((round) => {
                    const RoundIcon = round.icon
                    return (
                      <span
                        key={round.label}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
                          c.roundDot,
                        )}
                      >
                        <RoundIcon className="size-3" aria-hidden="true" />
                        {round.label}
                      </span>
                    )
                  })}
                </div>
              </div>

              {/* Start action */}
              <div className="flex items-center justify-between border-t border-border/60 px-6 py-4">
                <span className="text-sm font-semibold text-primary">Start activity</span>
                <svg
                  className="size-5 text-muted-foreground transition-all duration-200 group-hover:translate-x-1 group-hover:text-primary"
                  fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            </button>
          )
        })}
      </div>
    </main>
  )
}
