/**
 * ViewTimer — large countdown display used during memorization phases.
 */

import { useLanguage } from '@/lib/i18n/language-context'

interface ViewTimerProps {
  seconds: number
  title: string
  subtitle?: string
}

export function ViewTimer({ seconds, title, subtitle }: ViewTimerProps) {
  const { t } = useLanguage()

  return (
    <div className="flex flex-col items-center text-center">
      <p className="text-5xl font-bold tabular-nums text-primary">
        {seconds}
      </p>
      <h1 className="mt-4 text-3xl font-bold text-foreground">{title}</h1>
      {subtitle && (
        <p className="mt-2 text-lg text-muted-foreground">{subtitle}</p>
      )}
      <p className="mt-3 text-base text-muted-foreground">
        {t('take_time')}
      </p>
    </div>
  )
}
