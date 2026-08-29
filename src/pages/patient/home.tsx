import { Link } from 'react-router-dom'
import { Brain, Bell, BookHeart, CalendarCheck, ChevronRight, CircleHelp, Play, Shapes, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PatientBottomNav } from '@/components/patient/bottom-nav'
import { DEMO_PATIENT } from '@/data/demo/patient'

const supportLinks = [
  { to: '/patient/reminders', label: "Today's Reminders", icon: Bell },
  { to: '/patient/memories', label: 'My Memories', icon: BookHeart },
  { to: '/patient/progress', label: "Today's Progress", icon: TrendingUp },
  { to: '/patient/check-in', label: 'Daily Check-in', icon: CalendarCheck },
]

export function PatientHomePage() {
  return (
    <div className="patient-ui min-h-screen bg-background">
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-9 px-5 pb-28 pt-9 sm:px-8">
        <header>
          <p className="mb-2 text-xl text-muted-foreground">It’s a new day</p>
          <h1 className="text-[2.25rem] font-bold leading-tight tracking-[-0.02em] text-foreground sm:text-[2.5rem]">Good morning, {DEMO_PATIENT.firstName}</h1>
        </header>

        <Button asChild size="lg" variant="outline" className="min-h-16 w-full justify-between rounded-xl border-primary/40 px-6 text-xl">
          <Link to="/patient/help"><span className="flex items-center gap-3"><CircleHelp data-icon="inline-start" />Need Help</span><ChevronRight data-icon="inline-end" /></Link>
        </Button>

        <Button asChild size="lg" className="min-h-16 w-full justify-between rounded-xl px-6 text-xl">
          <Link to="/patient/activity"><span className="flex items-center gap-3"><Play data-icon="inline-start" />Start Today&apos;s Activities</span><ChevronRight data-icon="inline-end" /></Link>
        </Button>

        <section aria-labelledby="wellbeing-heading" className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><CalendarCheck className="size-7" aria-hidden="true" /></div>
            <h2 id="wellbeing-heading" className="text-2xl font-bold text-foreground">How are you feeling today?</h2>
          </div>
          <Button asChild size="lg" variant="outline" className="min-h-16 w-full justify-between rounded-xl px-6 text-xl"><Link to="/patient/check-in"><span>Daily Check-in</span><ChevronRight data-icon="inline-end" /></Link></Button>
        </section>

        <section aria-labelledby="activities-heading" className="flex flex-col gap-4">
          <h2 id="activities-heading" className="text-2xl font-bold text-foreground">Activities</h2>
          <div className="flex flex-col gap-4">
            <ActivityLink to="/patient/game/memory" title="Memory Recall" description="Remember familiar objects" icon={Brain} />
            <ActivityLink to="/patient/game/pattern" title="Pattern & Attention" description="Find what comes next" icon={Shapes} />
          </div>
        </section>

        <nav aria-label="Patient tools" className="flex flex-col gap-2">
          {supportLinks.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className="group flex min-h-16 cursor-pointer items-center gap-4 rounded-xl border border-border bg-card px-5 py-3 text-lg font-semibold text-foreground transition-colors duration-150 hover:border-primary/40 hover:bg-accent active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
              <Icon className="size-7 text-primary" aria-hidden="true" /><span className="flex-1">{label}</span><ChevronRight className="size-6 text-muted-foreground transition-colors duration-150 group-hover:text-primary" aria-hidden="true" />
            </Link>
          ))}
        </nav>
      </main>
      <PatientBottomNav />
    </div>
  )
}

function ActivityLink({ to, title, description, icon: Icon }: { to: string; title: string; description: string; icon: typeof Brain }) {
  return (
    <article className="flex items-center gap-4 rounded-xl border border-border bg-card p-5">
      <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-7" aria-hidden="true" /></div>
      <div className="min-w-0 flex-1"><h3 className="text-xl font-bold text-foreground">{title}</h3><p className="mt-1 text-base text-muted-foreground">{description}</p></div>
      <Button asChild size="lg" className="shrink-0 px-5"><Link to={to}><Play data-icon="inline-start" />Play</Link></Button>
    </article>
  )
}
