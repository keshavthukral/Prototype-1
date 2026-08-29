import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, BatteryMedium, CheckCircle2, HeartHandshake, Phone, Smile } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { PatientBottomNav } from '@/components/patient/bottom-nav'
import { HearAgain } from '@/components/patient/hear-again'
import { DEMO_PATIENT_ID } from '@/data/demo/patient'
import { useLanguage } from '@/lib/i18n/language-context'
import { saveWellBeingCheckIn } from '@/lib/repositories/check-in'
import type { ReportedEnergy, ReportedMood } from '@/lib/db/database'
import { cn } from '@/lib/utils'

const copy = {
  en: { title: 'Daily Check-in', back: 'Back', next: 'Next', saving: 'Saving…', questions: ['How are you feeling today?', 'How is your energy today?', 'Would you like to talk to someone?'], moods: { very_good: 'Very good', good: 'Good', okay: 'Okay', not_so_good: 'Not so good' }, energies: { good: 'Good', okay: 'Okay', low: 'Low' }, contact: { no: "No, I'm okay", yes: 'Yes, contact my caregiver' }, thanks: 'Thank you for checking in.', saved: 'Your answers are saved on this device.', contactCaregiver: 'Contact Caregiver', home: 'Back to Home', saveError: 'Your check-in could not be saved. Please try again.' },
  as: { title: 'দৈনিক খবৰ লোৱা', back: 'পিছলৈ', next: 'পৰৱৰ্তী', saving: 'সংৰক্ষণ হৈ আছে…', questions: ['আজি আপোনাৰ মন কেনেকুৱা?', 'আজি আপোনাৰ শক্তি কেনেকুৱা?', 'আপুনি কাৰোবাৰ লগত কথা পাতিব বিচাৰে নেকি?'], moods: { very_good: 'খুব ভাল', good: 'ভাল', okay: 'ঠিকেই আছে', not_so_good: 'ইমান ভাল নহয়' }, energies: { good: 'ভাল', okay: 'ঠিকেই আছে', low: 'কম' }, contact: { no: 'নালাগে, মই ঠিকেই আছোঁ', yes: 'হয়, মোৰ যত্ন লওঁতাজনৰ সৈতে যোগাযোগ কৰক' }, thanks: 'খবৰ দিয়াৰ বাবে ধন্যবাদ।', saved: 'আপোনাৰ উত্তৰ এই ডিভাইচত সংৰক্ষণ কৰা হৈছে।', contactCaregiver: 'যত্ন লওঁতাজনৰ সৈতে যোগাযোগ কৰক', home: 'মূল পৃষ্ঠালৈ', saveError: 'আপোনাৰ উত্তৰ সংৰক্ষণ কৰিব পৰা নগ’ল। আকৌ চেষ্টা কৰক।' },
} as const

type Step = 0 | 1 | 2 | 3

export function CheckInPage() {
  const { language } = useLanguage()
  const c = copy[language]
  const [step, setStep] = useState<Step>(0)
  const [mood, setMood] = useState<ReportedMood | null>(null)
  const [energy, setEnergy] = useState<ReportedEnergy | null>(null)
  const [requestedContact, setRequestedContact] = useState<boolean | null>(null)
  const [saving, setSaving] = useState(false)

  const complete = async (answer: boolean) => {
    if (!mood || !energy || saving) return
    setRequestedContact(answer)
    setSaving(true)
    try {
      await saveWellBeingCheckIn({ patientId: DEMO_PATIENT_ID, reportedMood: mood, reportedEnergy: energy, requestedContact: answer })
      setStep(3)
    } catch {
      toast.error(c.saveError)
    } finally {
      setSaving(false)
    }
  }

  const question = step === 3 ? '' : c.questions[step]!
  return (
    <div className="patient-ui min-h-screen bg-background">
      <main className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-2xl flex-col px-5 pb-28 pt-7 sm:px-8">
        <div className="flex items-center justify-between gap-4">
          <Button asChild variant="ghost" className="min-h-12 px-3"><Link to="/patient"><ArrowLeft data-icon="inline-start" />{c.back}</Link></Button>
          {step < 3 && <p className="text-base font-semibold text-muted-foreground">{step + 1} / 3</p>}
        </div>
        {step < 3 && <Progress value={((step + 1) / 3) * 100} className="mt-5 h-2" aria-label={`Question ${step + 1} of 3`} />}
        {step < 3 ? (
          <section aria-labelledby="check-in-question" className="flex flex-1 flex-col justify-center gap-8 py-10">
            <div className="flex flex-col items-center gap-5 text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">{step === 0 ? <Smile aria-hidden="true" /> : step === 1 ? <BatteryMedium aria-hidden="true" /> : <HeartHandshake aria-hidden="true" />}</div>
              <p className="text-lg font-semibold text-primary">{c.title}</p>
              <h1 id="check-in-question" className="max-w-xl text-[2rem] font-bold leading-tight tracking-[-0.02em] text-foreground sm:text-[2.5rem]">{question}</h1>
              <HearAgain text={question} />
            </div>
            {step === 0 && <ChoiceGrid>{(Object.keys(c.moods) as ReportedMood[]).map((value) => <Choice key={value} label={c.moods[value]} selected={mood === value} onClick={() => setMood(value)} suffix={value === 'very_good' || value === 'good' ? '🙂' : value === 'okay' ? '😐' : '🙁'} />)}</ChoiceGrid>}
            {step === 1 && <ChoiceGrid>{(Object.keys(c.energies) as ReportedEnergy[]).map((value) => <Choice key={value} label={c.energies[value]} selected={energy === value} onClick={() => setEnergy(value)} />)}</ChoiceGrid>}
            {step === 2 && <ChoiceGrid><Choice label={c.contact.no} selected={requestedContact === false} onClick={() => void complete(false)} disabled={saving} /><Choice label={c.contact.yes} selected={requestedContact === true} onClick={() => void complete(true)} disabled={saving} /></ChoiceGrid>}
            {step < 2 && <Button size="lg" disabled={step === 0 ? !mood : !energy} onClick={() => setStep((step + 1) as Step)} className="min-h-16 w-full rounded-xl text-xl disabled:cursor-not-allowed">{c.next}</Button>}
            {saving && <p role="status" className="text-center text-lg font-semibold text-muted-foreground">{c.saving}</p>}
          </section>
        ) : (
          <section className="flex flex-1 flex-col items-center justify-center gap-6 py-12 text-center">
            <CheckCircle2 className="size-20 text-primary" aria-hidden="true" />
            <h1 className="text-[2.25rem] font-bold tracking-[-0.02em] text-foreground sm:text-[2.5rem]">{c.thanks}</h1>
            <p className="text-xl text-muted-foreground">{c.saved}</p>
            <div className="mt-4 flex w-full flex-col gap-4">
              {requestedContact && <Button asChild size="lg" className="min-h-16 rounded-xl text-xl"><Link to="/patient/help"><Phone data-icon="inline-start" />{c.contactCaregiver}</Link></Button>}
              <Button asChild size="lg" variant={requestedContact ? 'outline' : 'default'} className="min-h-16 rounded-xl text-xl"><Link to="/patient">{c.home}</Link></Button>
            </div>
          </section>
        )}
      </main>
      <PatientBottomNav />
    </div>
  )
}

function ChoiceGrid({ children }: { children: ReactNode }) { return <div role="group" className="grid gap-4 sm:grid-cols-2">{children}</div> }
function Choice({ label, selected, onClick, suffix, disabled }: { label: string; selected: boolean; onClick: () => void; suffix?: string; disabled?: boolean }) {
  return <button type="button" aria-pressed={selected} disabled={disabled} onClick={onClick} className={cn('flex min-h-20 cursor-pointer items-center justify-between gap-4 rounded-xl border-2 border-border bg-card px-6 py-4 text-left text-xl font-bold text-foreground transition-colors duration-150 hover:border-primary/40 hover:bg-accent active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-pressed:border-primary aria-pressed:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60', selected && 'border-primary bg-primary/10')}><span>{label}</span>{suffix && <span className="text-3xl" aria-hidden="true">{suffix}</span>}</button>
}
