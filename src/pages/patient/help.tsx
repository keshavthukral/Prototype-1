import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Check, Copy, Home, Phone, Shield, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

import { SUPPORT_CONTACTS } from '@/config/support'
import { DEMO_PATIENT_ID } from '@/data/demo/patient'
import { useAuth } from '@/lib/supabase/auth-context'
import { createSupportRequest } from '@/lib/repositories/support-request'
import { useLanguage } from '@/lib/i18n/language-context'

export function HelpPage() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [requested, setRequested] = useState(false)
  const [saving, setSaving] = useState(false)

  const askForContact = async () => {
    if (saving || requested) return
    setSaving(true)
    try {
      await createSupportRequest(user?.role === 'patient' ? user.id : DEMO_PATIENT_ID)
      setRequested(true)
      toast.success(t('request_saved_sync'))
    } catch {
      toast.error(t('request_failed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <main id="main-content" className="patient-content mx-auto flex w-full flex-col gap-6 px-5 pt-6 pb-8 sm:px-8 lg:px-12 lg:pt-8 page-enter">
        <Button asChild variant="ghost" size="sm" className="w-fit min-h-11 px-2">
          <Link to="/patient"><ArrowLeft data-icon="inline-start" />{t('back')}</Link>
        </Button>

        <header>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('help_title')}</h1>
          <p className="mt-1.5 text-base leading-relaxed text-muted-foreground">{t('choose_option')}</p>
        </header>

        <section aria-label={t('call_someone')} className="flex flex-col gap-3">
          <ContactOption icon={UserRound} title={t('call_caregiver')} subtitle={SUPPORT_CONTACTS.caregiver.name} phone={SUPPORT_CONTACTS.caregiver.phone} />
          <ContactOption icon={Phone} title={t('call_family')} subtitle={SUPPORT_CONTACTS.family.label} phone={SUPPORT_CONTACTS.family.phone} />
          <ContactOption icon={Shield} title={t('emergency_services')} subtitle={t('emergency_subtitle')} phone={SUPPORT_CONTACTS.emergency.phone} />
        </section>

        <section aria-labelledby="contact-request-heading" className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
          <div>
            <h2 id="contact-request-heading" className="text-xl font-bold text-foreground">{t('caregiver_call_question')}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t('support_not_emergency')}</p>
          </div>
          <Button size="lg" onClick={() => void askForContact()} disabled={saving || requested} className="min-h-14 w-full rounded-xl text-base disabled:cursor-not-allowed">
            {requested ? <Check data-icon="inline-start" /> : <Phone data-icon="inline-start" />}{requested ? t('request_sent') : saving ? t('saving') : t('ask_contact')}
          </Button>
          {requested && <p role="status" className="text-sm font-semibold text-primary">{t('request_saved')}</p>}
        </section>

        <Button asChild size="lg" variant="outline" className="min-h-14 rounded-xl text-base">
          <Link to="/patient"><Home data-icon="inline-start" />{t('back_home')}</Link>
        </Button>
    </main>
  )
}

function ContactOption({ icon: Icon, title, subtitle, phone }: { icon: typeof Phone; title: string; subtitle: string; phone: string }) {
  const { t } = useLanguage()
  const [copied, setCopied] = useState(false)
  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(phone)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      toast.error(t('copy_failed').replace('{number}', phone))
    }
  }
  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center">
      <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-6" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
        <a
          href={`tel:${phone.replace(/\s/g, '')}`}
          aria-label={`${title}: ${phone}`}
          className="mt-1.5 inline-block cursor-pointer text-lg font-bold text-foreground underline decoration-primary/30 underline-offset-4 transition-colors duration-150 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {phone}
        </a>
      </div>
      <div className="flex shrink-0 gap-2 sm:flex-col">
        <Button asChild size="lg" className="min-h-12 flex-1 rounded-xl">
          <a href={`tel:${phone.replace(/\s/g, '')}`}><Phone data-icon="inline-start" />{t('call')}</a>
        </Button>
        <Button type="button" size="lg" variant="outline" onClick={() => void copyNumber()} className="min-h-12 flex-1 rounded-xl">
          <Copy data-icon="inline-start" />{copied ? t('copied') : t('copy_number')}
        </Button>
      </div>
    </article>
  )
}
