import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Check, Copy, Home, Phone, Shield, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { PatientBottomNav } from '@/components/patient/bottom-nav'
import { SUPPORT_CONTACTS } from '@/config/support'
import { DEMO_PATIENT_ID } from '@/data/demo/patient'
import { useAuth } from '@/lib/supabase/auth-context'
import { createSupportRequest } from '@/lib/repositories/support-request'

export function HelpPage() {
  const { user } = useAuth()
  const [requested, setRequested] = useState(false)
  const [saving, setSaving] = useState(false)

  const askForContact = async () => {
    if (saving || requested) return
    setSaving(true)
    try {
      await createSupportRequest(user?.role === 'patient' ? user.id : DEMO_PATIENT_ID)
      setRequested(true)
      toast.success('Your request is saved. Rahul will see it when the app syncs.')
    } catch {
      toast.error('Could not save your request. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="patient-ui min-h-screen bg-background">
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-5 pb-28 pt-7 sm:px-8">
        <Button asChild variant="ghost" className="w-fit min-h-12 px-3"><Link to="/patient"><ArrowLeft data-icon="inline-start" />Back</Link></Button>
        <header><p className="text-lg font-semibold text-primary">Need Help</p><h1 className="mt-2 text-[2.25rem] font-bold tracking-[-0.02em] text-foreground sm:text-[2.5rem]">How can we help?</h1><p className="mt-3 text-xl leading-relaxed text-muted-foreground">Choose one option below.</p></header>

        <section aria-label="Call someone" className="flex flex-col gap-4">
          <ContactOption icon={UserRound} title="Call Caregiver" subtitle={SUPPORT_CONTACTS.caregiver.name} phone={SUPPORT_CONTACTS.caregiver.phone} />
          <ContactOption icon={Phone} title="Call Family Member" subtitle={SUPPORT_CONTACTS.family.label} phone={SUPPORT_CONTACTS.family.phone} />
          <ContactOption icon={Shield} title="Emergency Services" subtitle="Call your configured emergency number" phone={SUPPORT_CONTACTS.emergency.phone} />
        </section>

        <section aria-labelledby="contact-request-heading" className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6">
          <div><h2 id="contact-request-heading" className="text-2xl font-bold text-foreground">Would you like Rahul to call you?</h2><p className="mt-2 text-lg text-muted-foreground">This sends a support request. It is not an emergency alert.</p></div>
          <Button size="lg" onClick={() => void askForContact()} disabled={saving || requested} className="min-h-16 w-full rounded-xl text-xl disabled:cursor-not-allowed">
            {requested ? <Check data-icon="inline-start" /> : <Phone data-icon="inline-start" />}{requested ? 'Request Sent' : saving ? 'Saving…' : 'Ask caregiver to contact me'}
          </Button>
          {requested && <p role="status" className="text-lg font-semibold text-primary">Your request is saved. Rahul will be notified when syncing is available.</p>}
        </section>

        <Button asChild size="lg" variant="outline" className="min-h-16 rounded-xl text-xl"><Link to="/patient"><Home data-icon="inline-start" />Back Home</Link></Button>
      </main>
      <PatientBottomNav />
    </div>
  )
}

function ContactOption({ icon: Icon, title, subtitle, phone }: { icon: typeof Phone; title: string; subtitle: string; phone: string }) {
  const [copied, setCopied] = useState(false)
  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(phone)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      toast.error(`Please copy this number: ${phone}`)
    }
  }
  return (
    <article className="flex flex-col gap-5 rounded-xl border border-border bg-card p-6 sm:flex-row sm:items-center">
      <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><Icon aria-hidden="true" /></div>
      <div className="min-w-0 flex-1"><h2 className="text-2xl font-bold text-foreground">{title}</h2><p className="mt-1 text-lg text-muted-foreground">{subtitle}</p><a href={`tel:${phone.replace(/\s/g, '')}`} className="mt-2 inline-block cursor-pointer text-2xl font-bold text-foreground underline decoration-primary/40 underline-offset-4 transition-colors duration-150 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">{phone}</a></div>
      <div className="flex shrink-0 gap-3 sm:flex-col">
        <Button asChild size="lg" className="min-h-14 flex-1 rounded-xl"><a href={`tel:${phone.replace(/\s/g, '')}`}><Phone data-icon="inline-start" />Call</a></Button>
        <Button type="button" size="lg" variant="outline" onClick={() => void copyNumber()} className="min-h-14 flex-1 rounded-xl"><Copy data-icon="inline-start" />{copied ? 'Copied' : 'Copy Number'}</Button>
      </div>
    </article>
  )
}
