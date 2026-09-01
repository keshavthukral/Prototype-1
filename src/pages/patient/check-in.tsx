import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, BatteryMedium, CheckCircle2, HeartHandshake, Phone, Smile } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

import { HearAgain } from '@/components/patient/hear-again'
import { DEMO_PATIENT_ID } from '@/data/demo/patient'
import { useLanguage } from '@/lib/i18n/language-context'
import { saveWellBeingCheckIn } from '@/lib/repositories/check-in'
import type { ReportedEnergy, ReportedMood } from '@/lib/db/database'
import { cn } from '@/lib/utils'

type Step = 0 | 1 | 2 | 3

export function CheckInPage() {
  const { t } = useLanguage()
  const c = {
    title: t('checkin_title'),
    back: t('back'),
    next: t('next'),
    saving: t('saving'),
    questions: [t('checkin_q1'), t('checkin_q2'), t('checkin_q3')],
    moods: { very_good: t('mood_very_good'), good: t('mood_good'), okay: t('mood_okay'), not_so_good: t('mood_not_good') },
    energies: { good: t('energy_good'), okay: t('energy_okay'), low: t('energy_low') },
    contact: { no: t('contact_no'), yes: t('contact_yes') },
    thanks: t('checkin_thanks'),
    saved: t('saved_device'),
    contactCaregiver: t('contact_caregiver'),
    home: t('back_home'),
    saveError: t('checkin_save_error'),
  }
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
    <main id="main-content" className="patient-content mx-auto flex min-h-screen w-full flex-col px-5 pt-6 pb-8 sm:px-8 lg:px-12 lg:pt-8 page-enter">
        {/* Back + Progress */}
        <div className="flex items-center justify-between gap-4">
          <Button asChild variant="ghost" size="sm" className="min-h-11 px-2">
            <Link to="/patient"><ArrowLeft data-icon="inline-start" />{c.back}</Link>
          </Button>
          {step < 3 && (
            <p className="text-sm font-semibold text-muted-foreground">
              {step + 1} / 3
            </p>
          )}
        </div>

        {step < 3 && (
          <Progress
            value={((step + 1) / 3) * 100}
            className="mt-4 h-1.5"
            aria-label={t('question_of').replace('{current}', String(step + 1)).replace('{total}', '3')}
          />
        )}

        {step < 3 ? (
          <section aria-labelledby="check-in-question" className="flex flex-1 flex-col justify-center gap-6 py-8">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                {step === 0 ? <Smile className="size-7" aria-hidden="true" /> : step === 1 ? <BatteryMedium className="size-7" aria-hidden="true" /> : <HeartHandshake className="size-7" aria-hidden="true" />}
              </div>
              <p className="text-sm font-semibold text-primary">{c.title}</p>
              <h1 id="check-in-question" className="max-w-xl text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl">
                {question}
              </h1>
              <HearAgain text={question} />
            </div>

            {step === 0 && (
              <ChoiceGrid>
                {(Object.keys(c.moods) as ReportedMood[]).map((value) => (
                  <Choice key={value} label={c.moods[value]} selected={mood === value} onClick={() => setMood(value)} suffix={value === 'very_good' || value === 'good' ? '🙂' : value === 'okay' ? '😐' : '🙁'} />
                ))}
              </ChoiceGrid>
            )}
            {step === 1 && (
              <ChoiceGrid>
                {(Object.keys(c.energies) as ReportedEnergy[]).map((value) => (
                  <Choice key={value} label={c.energies[value]} selected={energy === value} onClick={() => setEnergy(value)} />
                ))}
              </ChoiceGrid>
            )}
            {step === 2 && (
              <ChoiceGrid>
                <Choice label={c.contact.no} selected={requestedContact === false} onClick={() => void complete(false)} disabled={saving} />
                <Choice label={c.contact.yes} selected={requestedContact === true} onClick={() => void complete(true)} disabled={saving} />
              </ChoiceGrid>
            )}

            {step < 2 && (
              <Button
                size="lg"
                disabled={step === 0 ? !mood : !energy}
                onClick={() => setStep((step + 1) as Step)}
                className="min-h-16 w-full rounded-xl text-lg disabled:cursor-not-allowed"
              >
                {c.next}
              </Button>
            )}

            {saving && (
              <p role="status" className="text-center text-base font-semibold text-muted-foreground">{c.saving}</p>
            )}
          </section>
        ) : (
          <section className="flex flex-1 flex-col items-center justify-center gap-5 py-10 text-center">
            <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CheckCircle2 className="size-9" aria-hidden="true" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{c.thanks}</h1>
            <p className="text-base text-muted-foreground">{c.saved}</p>
            <div className="mt-3 flex w-full max-w-sm flex-col gap-3">
              {requestedContact && (
                <Button asChild size="lg" className="min-h-16 rounded-xl text-lg">
                  <Link to="/patient/help"><Phone data-icon="inline-start" />{c.contactCaregiver}</Link>
                </Button>
              )}
              <Button asChild size="lg" variant={requestedContact ? 'outline' : 'default'} className="min-h-16 rounded-xl text-lg">
                <Link to="/patient">{c.home}</Link>
              </Button>
            </div>
          </section>
        )}
    </main>
  )
}

function ChoiceGrid({ children }: { children: ReactNode }) {
  return <div role="group" className="grid gap-3 sm:grid-cols-2">{children}</div>
}

function Choice({ label, selected, onClick, suffix, disabled }: { label: string; selected: boolean; onClick: () => void; suffix?: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={`${label}${selected ? ' (selected)' : ''}`}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex min-h-16 cursor-pointer items-center justify-between gap-4 rounded-2xl border-2 border-border bg-card px-5 py-4 text-left text-lg font-bold text-foreground',
        'transition-all duration-150',
        'hover:border-primary/40 hover:bg-accent/50',
        'active:scale-[0.98]',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        'aria-pressed:border-primary aria-pressed:bg-primary/10',
        'disabled:cursor-not-allowed disabled:opacity-50',
        selected && 'border-primary bg-primary/10'
      )}
    >
      <span>{label}</span>
      {suffix && <span className="text-2xl" aria-hidden="true">{suffix}</span>}
    </button>
  )
}
