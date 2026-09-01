/**
 * Round Result — shown after each round/challenge with
 * performance-appropriate feedback and visual treatment.
 *
 * Three tiers:
 *   Excellent (≥80%): warm celebration with primary color
 *   Good (40-79%): encouraging, neutral feedback
 *   Needs practice (<40%): calm, supportive, suggestion to try again
 */

import { Sparkles, ThumbsUp, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/language-context'
import { cn } from '@/lib/utils'

interface RoundResultProps {
  message: string
  subtitle?: string
  correct?: number
  total?: number
  isLast: boolean
  onNext: () => void
  /** Optional round label shown above the result */
  roundLabel?: string
}

function getPerformanceTier(correct: number, total: number): 'excellent' | 'good' | 'encourage' {
  const ratio = correct / total
  if (ratio >= 0.8) return 'excellent'
  if (ratio >= 0.4) return 'good'
  return 'encourage'
}

const TIER_CONFIG = {
  excellent: {
    iconBg: 'bg-primary/15',
    iconText: 'text-primary',
    Icon: Sparkles,
    heading: (t: ReturnType<typeof useLanguage>['t']) => t('thats_right'),
    bgTint: 'from-primary/[0.04] to-transparent',
  },
  good: {
    iconBg: 'bg-emerald-500/10',
    iconText: 'text-emerald-600',
    Icon: ThumbsUp,
    heading: (t: ReturnType<typeof useLanguage>['t']) => t('good_effort'),
    bgTint: 'from-emerald-500/[0.03] to-transparent',
  },
  encourage: {
    iconBg: 'bg-amber-500/10',
    iconText: 'text-amber-600',
    Icon: Heart,
    heading: (t: ReturnType<typeof useLanguage>['t']) => t('nice_try'),
    bgTint: 'from-amber-500/[0.03] to-transparent',
  },
} as const

export function RoundResult({
  message,
  subtitle,
  correct,
  total,
  isLast,
  onNext,
  roundLabel,
}: RoundResultProps) {
  const { t } = useLanguage()

  const hasScore = correct != null && total != null && total > 0
  const tier = hasScore ? getPerformanceTier(correct!, total!) : 'good'
  const config = TIER_CONFIG[tier]
  const TierIcon = config.Icon

  return (
    <section
      className={cn(
        'flex flex-col items-center justify-center text-center px-4 pt-8 pb-12',
        'bg-gradient-to-b',
        config.bgTint,
      )}
    >
      {/* Round label */}
      {roundLabel && (
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-4">
          {roundLabel}
        </p>
      )}

      {/* Performance icon */}
      <div className={cn('flex size-16 items-center justify-center rounded-2xl', config.iconBg, config.iconText)}>
        <TierIcon className="size-8" aria-hidden="true" />
      </div>

      {/* Heading */}
      <h1 className="mt-5 text-2xl font-bold text-foreground">
        {config.heading(t)}
      </h1>

      {/* Score pill */}
      {hasScore && (
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5">
          <span className="text-3xl font-bold tabular-nums text-primary">
            {correct}
          </span>
          <span className="text-lg font-medium text-muted-foreground">
            / {total}
          </span>
        </div>
      )}

      {/* Message */}
      <p className="mt-3 max-w-md text-base text-muted-foreground">
        {message}
      </p>

      {subtitle && (
        <p className="mt-1.5 text-sm text-muted-foreground/80">{subtitle}</p>
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
