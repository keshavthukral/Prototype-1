import { Link } from 'react-router-dom'
import {
  Brain,
  CalendarCheck,
  ChevronRight,
  Clock,
  Heart,
  Shapes,
  Shield,
  Sparkles,
  Zap,
  Sun,
  CloudRain,
  Flower2,
} from 'lucide-react'
import { PageReader } from '@/components/patient/page-reader'
import { DEMO_PATIENT } from '@/data/demo/patient'
import { useLanguage } from '@/lib/i18n/language-context'
import { cn } from '@/lib/utils'

function formatDate(): string {
  const now = new Date()
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]
  return `${weekdays[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`
}

/** Time-of-day greeting */
function getGreeting(): { emoji: React.ReactNode; text: string } {
  const h = new Date().getHours()
  if (h < 12) return { emoji: <Sun className="size-5 text-amber-500" />, text: 'Good morning' }
  if (h < 17) return { emoji: <Sparkles className="size-5 text-primary" />, text: 'Good afternoon' }
  return { emoji: <CloudRain className="size-5 text-blue-400" />, text: 'Good evening' }
}

export function PatientHomePage() {
  const { t } = useLanguage()
  const greeting = getGreeting()

  return (
    <>
      <PageReader />

      <main id="main-content" className="patient-content w-full px-5 pt-6 pb-8 sm:px-8 lg:px-12 lg:pt-8 page-enter">

        {/* ── Welcoming Header ──────────────────────────────── */}
        <header className="mb-6 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            {greeting.emoji}
            <h1 className="text-3xl font-bold leading-snug tracking-tight text-foreground lg:text-4xl">
              {greeting.text}, {DEMO_PATIENT.firstName}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">{formatDate()}</p>
        </header>

        {/* ── Desktop: Two-column layout ────────────────────── */}
        <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">

          {/* LEFT / PRIMARY column */}
          <div className="flex flex-1 flex-col gap-6 min-w-0">

            {/* ── Hero CTA: Start Today's Activities ── */}
            <section aria-labelledby="start-today-heading">
              <Link
                to="/patient/game/memory?mode=daily"
                className={cn(
                  'group relative flex items-center gap-5 overflow-hidden rounded-3xl',
                  'border-2 border-primary/25 bg-gradient-to-br from-primary/[0.06] via-primary/[0.03] to-transparent',
                  'px-6 py-6',
                  'transition-all duration-200 hover:border-primary/45 hover:shadow-md hover:shadow-primary/5',
                  'active:scale-[0.99]',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                )}
              >
                {/* Decorative circle */}
                <div className="absolute -right-8 -top-8 size-32 rounded-full bg-primary/[0.06] blur-xl" aria-hidden="true" />

                <div className="relative flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm shadow-primary/20">
                  <Zap className="size-7" aria-hidden="true" />
                </div>
                <div className="relative min-w-0 flex-1">
                  <h2 id="start-today-heading" className="text-xl font-bold text-foreground">
                    {t('start_today')}
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    Two gentle activities to keep your mind active today.
                  </p>
                </div>
                <ChevronRight
                  className="relative size-6 shrink-0 text-primary/60 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-primary"
                  aria-hidden="true"
                />
              </Link>
            </section>

            {/* ── Game Cards — visually distinct per game ────── */}
            <section aria-labelledby="games-heading">
              <h2
                id="games-heading"
                className="mb-3 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {t('activities')}
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Memory Journey */}
                <GameCard
                  to="/patient/game/memory"
                  title={t('memory_recall')}
                  description="Recall objects, locations, and personal memories"
                  duration="5 min"
                  icon={Brain}
                  color="emerald"
                  tags={['Visual recall', 'Spatial memory', 'Personal stories']}
                />

                {/* Attention Adventure */}
                <GameCard
                  to="/patient/game/pattern"
                  title={t('pattern_attention')}
                  description="Connect trails, find targets, and follow changing rules"
                  duration="5 min"
                  icon={Shapes}
                  color="violet"
                  tags={['Trail connect', 'Cancellation', 'Rule switch']}
                />
              </div>
            </section>

            {/* ── Daily Check-in ── */}
            <section aria-labelledby="checkin-heading">
              <Link
                to="/patient/check-in"
                className={cn(
                  'group flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-5',
                  'transition-all duration-150 hover:border-primary/30 hover:bg-accent/50 hover:shadow-sm',
                  'active:scale-[0.99]',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                )}
              >
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                  <CalendarCheck className="size-6" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 id="checkin-heading" className="text-lg font-bold text-foreground">
                    {t('daily_check_in')}
                  </h2>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                    {t('feeling_today')}
                  </p>
                </div>
                <ChevronRight
                  className="size-5 shrink-0 text-muted-foreground/50 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-primary"
                  aria-hidden="true"
                />
              </Link>
            </section>
          </div>

          {/* RIGHT / SECONDARY column (desktop only) */}
          <div className="flex w-full flex-col gap-6 lg:w-[340px] lg:shrink-0">
            <nav
              aria-label={t('patient_tools')}
              className="flex flex-col rounded-2xl border border-border bg-card p-2"
            >
              <QuickLink
                to="/patient/reminders"
                icon={Clock}
                label={t('today_reminders')}
                subtitle="See what's coming up today"
                accent="text-amber-500"
              />
              <div className="h-px bg-border mx-3" />
              <QuickLink
                to="/patient/memories"
                icon={Heart}
                label={t('my_memories')}
                subtitle="People and moments that matter"
                accent="text-rose-500"
              />
              <div className="h-px bg-border mx-3" />
              <QuickLink
                to="/patient/progress"
                icon={Flower2}
                label={t('today_progress')}
                subtitle="See what you've completed"
                accent="text-emerald-500"
              />
              <div className="h-px bg-border mx-3" />
              <QuickLink
                to="/patient/help"
                icon={Shield}
                label={t('need_help')}
                subtitle="Get assistance"
                accent="text-blue-500"
              />
            </nav>
          </div>
        </div>
      </main>
    </>
  )
}

/* ── Game Card — visually distinct per game type ────────────── */

const COLOR_MAP = {
  emerald: {
    iconBg: 'bg-emerald-500/10',
    iconText: 'text-emerald-600',
    tagBg: 'bg-emerald-500/8',
    tagText: 'text-emerald-700',
    borderHover: 'hover:border-emerald-400/40',
  },
  violet: {
    iconBg: 'bg-violet-500/10',
    iconText: 'text-violet-600',
    tagBg: 'bg-violet-500/8',
    tagText: 'text-violet-700',
    borderHover: 'hover:border-violet-400/40',
  },
} as const

function GameCard({
  to,
  title,
  description,
  duration,
  icon: Icon,
  color,
  tags,
}: {
  to: string
  title: string
  description: string
  duration: string
  icon: React.ElementType
  color: keyof typeof COLOR_MAP
  tags: string[]
}) {
  const c = COLOR_MAP[color]
  return (
    <Link
      to={to}
      className={cn(
        'group flex flex-col rounded-2xl border border-border bg-card p-5',
        'transition-all duration-200 hover:shadow-md',
        'active:scale-[0.99]',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        c.borderHover,
      )}
    >
      {/* Icon + Title row */}
      <div className="flex items-center gap-3">
        <div className={cn('flex size-11 shrink-0 items-center justify-center rounded-xl', c.iconBg, c.iconText)}>
          <Icon className="size-6" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-foreground">{title}</h3>
          <span className="text-xs font-medium text-muted-foreground">{duration}</span>
        </div>
      </div>

      {/* Description */}
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>

      {/* Tags */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className={cn(
              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
              c.tagBg,
              c.tagText,
            )}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Arrow */}
      <div className="mt-4 flex items-center gap-1 text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
        <span>Open activity</span>
        <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </div>
    </Link>
  )
}

/* ── Quick Link ────────────────────────────────────────────── */

function QuickLink({
  to,
  icon: Icon,
  label,
  subtitle,
  accent,
}: {
  to: string
  icon: React.ElementType
  label: string
  subtitle: string
  accent?: string
}) {
  return (
    <Link
      to={to}
      className={cn(
        'group flex items-center gap-4 px-4 py-4 transition-all duration-150',
        'hover:bg-accent/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        'rounded-xl',
      )}
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
        <Icon className={cn('size-5', accent ?? 'text-muted-foreground')} aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <span className="block text-base font-semibold text-foreground">{label}</span>
        <span className="block text-sm text-muted-foreground">{subtitle}</span>
      </div>
      <ChevronRight
        className="size-4 shrink-0 text-muted-foreground/50 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-primary"
        aria-hidden="true"
      />
    </Link>
  )
}
