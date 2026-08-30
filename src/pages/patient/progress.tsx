import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Brain, CheckCircle2, Shapes } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PatientBottomNav } from '@/components/patient/bottom-nav'
import { useAuth } from '@/lib/supabase/auth-context'
import { dbOperations } from '@/lib/db/database'
import { useLanguage } from '@/lib/i18n/language-context'

export function ProgressPage() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [completed, setCompleted] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!user) return
    void dbOperations.getGameSessions(user.id).then((sessions) => {
      const today = new Date().toDateString()
      setCompleted(new Set(sessions.filter((item) => item.completedAt.toDateString() === today).map((item) => item.gameType)))
    })
  }, [user])

  return (
    <div className="patient-ui min-h-screen bg-background">
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-7 px-5 pb-28 pt-7 sm:px-8">
        <Button asChild variant="ghost" className="w-fit px-3"><Link to="/patient"><ArrowLeft data-icon="inline-start" />{t('back')}</Link></Button>
        <header><h1 className="text-[2.25rem] font-bold tracking-[-0.02em] text-foreground sm:text-[2.5rem]">{t('progress_title')}</h1><p className="mt-2 text-xl text-muted-foreground">{t('progress_intro')}</p></header>
        <div className="flex flex-col gap-4">
          <ProgressRow icon={Brain} label={t('memory_activity')} done={completed.has('memory')} />
          <ProgressRow icon={Shapes} label={t('pattern_activity')} done={completed.has('pattern')} />
        </div>
        <p className="rounded-xl bg-primary/10 p-6 text-xl font-semibold leading-relaxed text-primary">{completed.size === 2 ? t('progress_complete') : t('progress_encouragement')}</p>
      </main>
      <PatientBottomNav />
    </div>
  )
}

function ProgressRow({ icon: Icon, label, done }: { icon: typeof Brain; label: string; done: boolean }) {
  const { t } = useLanguage()
  return <div className="flex min-h-20 items-center gap-4 rounded-xl border border-border bg-card p-5"><Icon className="size-8 text-primary" /><span className="flex-1 text-xl font-bold text-foreground">{label}</span><span className="flex items-center gap-2 text-lg font-semibold text-primary">{done && <CheckCircle2 className="size-6" />}{done ? t('completed_mark') : t('not_yet')}</span></div>
}
