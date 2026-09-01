/**
 * Round Result — shown after each round/challenge with encouraging feedback.
 */

import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/language-context'

interface RoundResultProps {
  message: string
  subtitle?: string
  correct?: number
  total?: number
  isLast: boolean
  onNext: () => void
}

export function RoundResult({
  message,
  subtitle,
  correct,
  total,
  isLast,
  onNext,
}: RoundResultProps) {
  const { t } = useLanguage()

  return (
    <section className="flex flex-col items-center justify-center text-center px-4 pt-8 pb-12">
      <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Check className="size-8" aria-hidden="true" />
      </div>

      <h1 className="mt-5 text-2xl font-bold text-foreground">
        {correct != null && total != null && total > 0
          ? correct / total >= 0.8
            ? t('thats_right')
            : correct / total >= 0.4
              ? t('good_effort')
              : t('nice_try')
          : t('good_effort')}
      </h1>

      {correct != null && total != null && (
        <dl className="mt-4 flex items-center gap-3">
          <dd className="text-4xl font-bold tabular-nums text-primary">
            {correct}
          </dd>
          <dt className="text-lg font-medium text-muted-foreground">
            / {total}
          </dt>
        </dl>
      )}

      <p className="mt-2 max-w-md text-base text-muted-foreground">
        {message}
      </p>

      {subtitle && (
        <p className="mt-1 text-sm text-muted-foreground/80">{subtitle}</p>
      )}

      <Button
        size="lg"
        className="mt-8 min-h-16 w-full max-w-sm text-lg"
        onClick={onNext}
      >
        {isLast ? t('see_results') : t('next_round')}
      </Button>
    </section>
  )
}
