/**
 * Final Result — simple patient-facing summary.
 */

import { useLanguage } from '@/lib/i18n/language-context'
import { Button } from '@/components/ui/button'
import { CheckCircle2 } from 'lucide-react'

interface FinalResultProps {
  title: string
  roundsCompleted: number
  totalRounds: number
  accuracy: number
  message: string
  onContinue?: () => void
  onActivities?: () => void
  onAgain: () => void
  continueLabel?: string
}

export function FinalResult({
  title,
  roundsCompleted,
  totalRounds,
  accuracy,
  message,
  onContinue,
  onActivities,
  onAgain,
  continueLabel,
}: FinalResultProps) {
  const { t } = useLanguage()

  const stats = [
    { label: t('accuracy'), value: `${accuracy}%` },
    {
      label: t('rounds_completed'),
      value: `${roundsCompleted} / ${totalRounds}`,
    },
  ]

  return (
    <section className="flex flex-col items-center justify-center text-center px-4 py-12">
      <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <CheckCircle2 className="size-8" aria-hidden="true" />
      </div>

      <h1 className="mt-5 text-3xl font-bold tracking-tight text-foreground">
        {t('activity_complete')}
      </h1>

      <p className="mt-1.5 text-base text-muted-foreground">{title}</p>

      <dl className="mt-6 grid w-full max-w-sm grid-cols-2 gap-3">
        {stats.map(({ label, value }) => (
          <div key={label} className="flex flex-col items-center rounded-xl border border-border bg-card p-4">
            <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
            <dd className="mt-1 text-2xl font-bold text-foreground">
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-4 max-w-md text-base text-muted-foreground">{message}</p>

      <div className="mt-6 flex w-full max-w-sm flex-col gap-3">
        {onContinue && (
          <Button size="lg" className="text-lg" onClick={onContinue}>
            {continueLabel ?? t('continue_pattern')}
          </Button>
        )}
        {onActivities && (
          <Button
            size="lg"
            variant={onContinue ? 'outline' : 'default'}
            onClick={onActivities}
          >
            {t('back_activities')}
          </Button>
        )}
        <Button size="lg" variant="ghost" onClick={onAgain}>
          {t('try_again')}
        </Button>
      </div>
    </section>
  )
}
