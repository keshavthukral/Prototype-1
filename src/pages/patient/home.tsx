import { Link } from 'react-router-dom'
import { Brain, CalendarCheck, ChevronRight, Clock, Heart, Shapes, Shield, Activity } from 'lucide-react'
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

export function PatientHomePage() {
  const { t } = useLanguage()

  return (
    <>
      <PageReader />

      <main id="main-content" className="patient-content w-full px-5 pt-6 pb-8 sm:px-8 lg:px-12 lg:pt-8 page-enter">

        {/* ── Welcoming Header ──────────────────────────────── */}
        <header className="mb-8 flex flex-col gap-1">
          <h1 className="text-3xl font-bold leading-snug tracking-tight text-foreground lg:text-4xl">
            {t('home_greeting').replace('{name}', DEMO_PATIENT.firstName)}
          </h1>
          <p className="text-sm text-muted-foreground">{formatDate()}</p>
          <p className="mt-1 text-base leading-relaxed text-muted-foreground">
            Here's what you have planned for today.
          </p>
        </header>

        {/* ── Desktop: Two-column layout ────────────────────── */}
        <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">

          {/* LEFT / PRIMARY column */}
          <div className="flex flex-1 flex-col gap-7 min-w-0">

            {/* Start Today's Activities */}
            <section aria-labelledby="start-today-heading">
              <Link
                to="/patient/game/memory?mode=daily"
                className={cn(
                  'group flex items-center gap-4 rounded-2xl border-2 border-primary/20 bg-primary/[0.04] px-5 py-5',
                  'transition-all duration-150 hover:border-primary/40 hover:bg-primary/[0.07] hover:shadow-sm',
                  'active:scale-[0.99]',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'
                )}
              >
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Activity className="size-6" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 id="start-today-heading" className="text-lg font-bold text-foreground">
                    {t('start_today')}
                  </h2>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                    A few simple activities for today.
                  </p>
                </div>
                <ChevronRight
                  className="size-5 shrink-0 text-primary transition-transform duration-150 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            </section>

            {/* Daily Check-in */}
            <section aria-labelledby="checkin-heading">
              <Link
                to="/patient/check-in"
                className={cn(
                  'group flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-5',
                  'transition-all duration-150 hover:border-primary/30 hover:bg-accent/50 hover:shadow-sm',
                  'active:scale-[0.99]',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'
                )}
              >
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
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
                  className="size-5 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-primary"
                  aria-hidden="true"
                />
              </Link>
            </section>

            {/* Activities */}
            <section aria-labelledby="activities-heading">
              <h2
                id="activities-heading"
                className="mb-3 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {t('activities')}
              </h2>
              <div className="flex flex-col rounded-2xl border border-border bg-card overflow-hidden">
                <ActivityCard
                  to="/patient/game/memory"
                  title={t('memory_recall')}
                  description={t('memory_recall_desc')}
                  duration="5 min"
                  icon={Brain}
                />
                <div className="h-px bg-border mx-4" />
                <ActivityCard
                  to="/patient/game/pattern"
                  title={t('pattern_attention')}
                  description={t('pattern_attention_desc')}
                  duration="5 min"
                  icon={Shapes}
                />
              </div>
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
              />
              <div className="h-px bg-border mx-3" />
              <QuickLink
                to="/patient/memories"
                icon={Heart}
                label={t('my_memories')}
                subtitle="People and moments that matter"
              />
              <div className="h-px bg-border mx-3" />
              <QuickLink
                to="/patient/progress"
                icon={Brain}
                label={t('today_progress')}
                subtitle="See what you've completed"
              />
              <div className="h-px bg-border mx-3" />
              <QuickLink
                to="/patient/help"
                icon={Shield}
                label={t('need_help')}
                subtitle="Get assistance"
              />
            </nav>
          </div>
        </div>
      </main>
    </>
  )
}

/* ── Activity Card ──────────────────────────────────────────── */

function ActivityCard({
  to,
  title,
  description,
  duration,
  icon: Icon,
}: {
  to: string
  title: string
  description: string
  duration: string
  icon: typeof Brain
}) {
  return (
    <Link
      to={to}
      className={cn(
        'group flex items-center gap-4 px-4 py-4 transition-all duration-150',
        'hover:bg-accent/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        'rounded-xl'
      )}
    >
      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </div>
      <span className="shrink-0 text-xs font-medium text-muted-foreground">{duration}</span>
      <ChevronRight
        className="size-4 shrink-0 text-muted-foreground/50 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-primary"
        aria-hidden="true"
      />
    </Link>
  )
}

/* ── Quick Link ────────────────────────────────────────────── */

function QuickLink({
  to,
  icon: Icon,
  label,
  subtitle,
}: {
  to: string
  icon: typeof Clock
  label: string
  subtitle: string
}) {
  return (
    <Link
      to={to}
      className={cn(
        'group flex items-center gap-4 px-4 py-4 transition-all duration-150',
        'hover:bg-accent/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        'rounded-xl'
      )}
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
        <Icon className="size-5" aria-hidden="true" />
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
