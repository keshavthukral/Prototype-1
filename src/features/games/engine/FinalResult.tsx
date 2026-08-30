/**
 * Final Result — simple patient-facing summary.
 *
 * Shows: activity complete, rounds completed, accuracy, encouraging message.
 * Internally, full metrics are persisted for caregiver analytics.
 */

import { useLanguage } from '@/lib/i18n/language-context'
import { Button } from '@/components/ui/button'

interface FinalResultProps {
  /** Game title */
  title: string
  /** Number of rounds/challenges completed */
  roundsCompleted: number
  /** Total rounds/challenges */
  totalRounds: number
  /** Overall accuracy percentage */
  accuracy: number
  /** Encouraging message */
  message: string
  /** Continue to next activity (daily mode) */
  onContinue?: () => void
  /** Back to activities list (practice mode) */
  onActivities?: () => void
  /** Play again */
  onAgain: () => void
  /** Label for continue button */
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
    <section className="flex flex-1 flex-col items-center justify-center text-center">
      <h1 className="text-[2.5rem] font-bold tracking-[-0.02em] text-foreground">
        {t('activity_complete')}
      </h1>

      <p className="mt-3 text-xl text-muted-foreground">{title}</p>

      <dl className="mt-8 grid w-full max-w-xl grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border">
        {stats.map(({ label, value }) => (
          <div key={label} className="bg-card p-5">
            <dt className="text-base text-muted-foreground">{label}</dt>
            <dd className="mt-2 text-2xl font-bold text-foreground">
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-6 max-w-md text-lg text-muted-foreground">{message}</p>

      <div className="mt-8 flex w-full max-w-sm flex-col gap-3">
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
          {t('play_again')}
        </Button>
      </div>
    </section>
  )
}
