/**
 * Round Result — shown after each round/challenge with encouraging feedback.
 */

import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/language-context'

interface RoundResultProps {
  /** Summary message for the patient */
  message: string
  /** Encouraging sub-text */
  subtitle?: string
  /** Whether this is the last round */
  isLast: boolean
  /** Callback for next round / see results */
  onNext: () => void
}

export function RoundResult({
  message,
  subtitle,
  isLast,
  onNext,
}: RoundResultProps) {
  const { t } = useLanguage()

  return (
    <section className="flex flex-1 flex-col items-center justify-center text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Check className="size-10" />
      </div>

      <h1 className="mt-6 text-3xl font-bold text-foreground">
        {t('good_effort')}
      </h1>

      <p className="mt-3 max-w-md text-xl text-muted-foreground">
        {message}
      </p>

      {subtitle && (
        <p className="mt-2 text-lg text-muted-foreground/80">{subtitle}</p>
      )}

      <Button
        size="lg"
        className="mt-9 min-h-16 w-full max-w-sm text-xl"
        onClick={onNext}
      >
        {isLast ? t('see_results') : t('next_round')}
      </Button>
    </section>
  )
}
