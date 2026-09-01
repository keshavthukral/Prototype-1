import { useLiveQuery } from 'dexie-react-hooks'
import { CalendarDays, CheckCircle2, Circle, MessageCircle } from 'lucide-react'
import { SidebarLayout } from '@/components/caregiver/sidebar-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DEMO_PATIENT_ID } from '@/data/demo/patient'
import { db, type ReportedEnergy, type ReportedMood } from '@/lib/db/database'

const moodLabels: Record<ReportedMood, string> = { very_good: 'Very good', good: 'Good', okay: 'Okay', not_so_good: 'Not so good' }
const energyLabels: Record<ReportedEnergy, string> = { good: 'Good', okay: 'Okay', low: 'Low' }

export function CaregiverReportsPage() {
  const checkIns = useLiveQuery(() => db.wellBeingCheckIns.where('patientId').equals(DEMO_PATIENT_ID).reverse().sortBy('reportedAt'), [])
  return (
    <SidebarLayout>
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-6 py-6 lg:px-8">
        <header><h1 className="text-xl font-semibold tracking-tight text-foreground">Daily Reports</h1><p className="mt-1 text-sm text-muted-foreground">Activity performance and self-reported well-being are shown separately.</p></header>
        <Card>
          <CardHeader><CardTitle>Daily Check-in</CardTitle><CardDescription>Patient-selected answers only. This is not a diagnosis or health score.</CardDescription></CardHeader>
          <CardContent>
            {checkIns === undefined ? <p className="text-sm text-muted-foreground">Loading check-ins…</p> : checkIns.length === 0 ? <div className="flex items-center gap-3 py-6 text-muted-foreground"><Circle aria-hidden="true" /><p>No check-in recorded yet.</p></div> : <div className="flex flex-col gap-0">{checkIns.map((checkIn, index) => <article key={checkIn.id} className={index === 0 ? 'pb-5' : 'border-t border-border py-5'}><div className="mb-4 flex items-center justify-between gap-4"><h2 className="font-semibold text-foreground">{checkIn.reportedAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</h2><span className="flex items-center gap-2 text-sm text-muted-foreground"><CalendarDays aria-hidden="true" />{checkIn.reportedAt.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}</span></div><dl className="grid gap-4 sm:grid-cols-3"><ReportValue label="Mood selected" value={moodLabels[checkIn.reportedMood]} /><ReportValue label="Energy" value={energyLabels[checkIn.reportedEnergy]} /><ReportValue label="Requested contact" value={checkIn.requestedContact ? 'Yes' : 'No'} emphasis={checkIn.requestedContact} /></dl></article>)}</div>}
          </CardContent>
        </Card>
        <p className="flex items-center gap-2 text-sm text-muted-foreground"><MessageCircle aria-hidden="true" />Check-in history remains separate from cognitive-game performance.</p>
      </div>
    </SidebarLayout>
  )
}

function ReportValue({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
  return <div><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt><dd className="mt-2 flex items-center gap-2 text-base font-semibold text-foreground">{emphasis && <CheckCircle2 className="text-primary" aria-hidden="true" />}{value}</dd></div>
}
