import { Link } from 'react-router-dom'
import { Brain, Bell, BookHeart, CalendarCheck, ChevronRight, CircleHelp, Play, Shapes, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PatientBottomNav } from '@/components/patient/bottom-nav'
import { DEMO_PATIENT } from '@/data/demo/patient'
import { useLanguage } from '@/lib/i18n/language-context'
import { IS_DEMO_MODE } from '@/config/demo'

const supportLinks = [
  { to: '/patient/reminders', labelKey: 'today_reminders', icon: Bell },
  { to: '/patient/memories', labelKey: 'my_memories', icon: BookHeart },
  { to: '/patient/progress', labelKey: 'today_progress', icon: TrendingUp },
  { to: '/patient/check-in', labelKey: 'daily_check_in', icon: CalendarCheck },
]

export function PatientHomePage() {
  const { t } = useLanguage()
  return (
    <div className="patient-ui min-h-screen bg-background">
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-9 px-5 pb-28 pt-9 sm:px-8">
        <header>
          <p className="mb-2 text-xl text-muted-foreground">{t('home_new_day')}</p>
          <h1 className="text-[2.25rem] font-bold leading-tight tracking-[-0.02em] text-foreground sm:text-[2.5rem]">{t('home_greeting').replace('{name}', DEMO_PATIENT.firstName)}</h1>
        </header>

        <Button asChild size="lg" variant="outline" className="min-h-16 w-full justify-between rounded-xl border-primary/40 px-6 text-xl">
          <Link to="/patient/help"><span className="flex items-center gap-3"><CircleHelp data-icon="inline-start" />{t('need_help')}</span><ChevronRight data-icon="inline-end" /></Link>
        </Button>

        <Button asChild size="lg" className="min-h-16 w-full justify-between rounded-xl px-6 text-xl">
          <Link to="/patient/game/memory?mode=daily"><span className="flex items-center gap-3"><Play data-icon="inline-start" />{t('start_today')}</span><ChevronRight data-icon="inline-end" /></Link>
        </Button>

        <section aria-labelledby="wellbeing-heading" className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><CalendarCheck className="size-7" aria-hidden="true" /></div>
            <h2 id="wellbeing-heading" className="text-2xl font-bold text-foreground">{t('feeling_today')}</h2>
          </div>
          <Button asChild size="lg" variant="outline" className="min-h-16 w-full justify-between rounded-xl px-6 text-xl"><Link to="/patient/check-in"><span>{t('daily_check_in')}</span><ChevronRight data-icon="inline-end" /></Link></Button>
        </section>

        <section aria-labelledby="activities-heading" className="flex flex-col gap-4">
          <h2 id="activities-heading" className="text-2xl font-bold text-foreground">{t('activities')}</h2>
          <div className="flex flex-col gap-4">
            <ActivityLink to="/patient/game/memory" title={t('memory_recall')} description={t('memory_recall_desc')} playLabel={t('play')} icon={Brain} />
            <ActivityLink to="/patient/game/pattern" title={t('pattern_attention')} description={t('pattern_attention_desc')} playLabel={t('play')} icon={Shapes} />
          </div>
        </section>

        <nav aria-label={t('patient_tools')} className="flex flex-col gap-2">
          {supportLinks.map(({ to, labelKey, icon: Icon }) => (
            <Link key={to} to={to} className="group flex min-h-16 cursor-pointer items-center gap-4 rounded-xl border border-border bg-card px-5 py-3 text-lg font-semibold text-foreground transition-colors duration-150 hover:border-primary/40 hover:bg-accent active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
              <Icon className="size-7 text-primary" aria-hidden="true" /><span className="flex-1">{t(labelKey)}</span><ChevronRight className="size-6 text-muted-foreground transition-colors duration-150 group-hover:text-primary" aria-hidden="true" />
            </Link>
          ))}
        </nav>
        {IS_DEMO_MODE && <Button asChild size="lg" variant="outline" className="min-h-14 rounded-xl"><Link to="/caregiver"><span>{t('caregiver_view')}</span><ChevronRight data-icon="inline-end" /></Link></Button>}
      </main>
      <PatientBottomNav />
    </div>
  )
}

function ActivityLink({ to, title, description, playLabel, icon: Icon }: { to: string; title: string; description: string; playLabel: string; icon: typeof Brain }) {
  return (
    <article className="flex items-center gap-4 rounded-xl border border-border bg-card p-5">
      <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-7" aria-hidden="true" /></div>
      <div className="min-w-0 flex-1"><h3 className="text-xl font-bold text-foreground">{title}</h3><p className="mt-1 text-base text-muted-foreground">{description}</p></div>
      <Button asChild size="lg" className="shrink-0 px-5"><Link to={to}><Play data-icon="inline-start" />{playLabel}</Link></Button>
    </article>
  )
}
