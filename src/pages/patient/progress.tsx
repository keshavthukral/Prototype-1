import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Brain, CheckCircle2, Shapes } from 'lucide-react'
import { Button } from '@/components/ui/button'

import { useAuth } from '@/lib/supabase/auth-context'
import { dbOperations } from '@/lib/db/database'
import { useLanguage } from '@/lib/i18n/language-context'
import { cn } from '@/lib/utils'

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
    <main id="main-content" className="patient-content mx-auto flex w-full flex-col gap-6 px-5 pt-6 pb-8 sm:px-8 lg:px-12 lg:pt-8 page-enter">
        <Button asChild variant="ghost" size="sm" className="w-fit px-2">
          <Link to="/patient"><ArrowLeft data-icon="inline-start" />{t('back')}</Link>
        </Button>

        <header>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('progress_title')}</h1>
          <p className="mt-1.5 text-base text-muted-foreground">{t('progress_intro')}</p>
        </header>

        <div className="flex flex-col gap-3">
          <ProgressRow icon={Brain} label={t('memory_activity')} done={completed.has('memory')} />
          <ProgressRow icon={Shapes} label={t('pattern_activity')} done={completed.has('pattern')} />
        </div>

        <div className={cn(
          'rounded-2xl border p-5',
          completed.size === 2
            ? 'border-success/20 bg-success/5'
            : 'border-primary/20 bg-primary/[0.04]'
        )}>
          <p className="text-base font-semibold leading-relaxed text-foreground">
            {completed.size === 2 ? t('progress_complete') : t('progress_encouragement')}
          </p>
        </div>
    </main>
  )
}

function ProgressRow({ icon: Icon, label, done }: { icon: typeof Brain; label: string; done: boolean }) {
  const { t } = useLanguage()
  return (
    <div className={cn(
      'flex min-h-16 items-center gap-4 rounded-2xl border bg-card p-4',
      done ? 'border-success/30' : 'border-border'
    )}>
      <div className={cn(
        'flex size-11 shrink-0 items-center justify-center rounded-xl',
        done ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'
      )}>
        <Icon className="size-5" />
      </div>
      <span className="flex-1 text-base font-bold text-foreground" id={`progress-${label.replace(/\s/g, '-').toLowerCase()}`}>{label}</span>
      <span
        className={cn(
          'flex items-center gap-1.5 text-sm font-semibold',
          done ? 'text-success' : 'text-muted-foreground'
        )}
        role="status"
        aria-label={`${label}: ${done ? t('completed_mark') : t('not_yet')}`}
      >
        {done && <CheckCircle2 className="size-4" aria-hidden="true" />}
        {done ? t('completed_mark') : t('not_yet')}
      </span>
    </div>
  )
}
