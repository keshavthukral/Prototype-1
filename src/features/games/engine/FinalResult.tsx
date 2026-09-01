/**
 * Final Result — patient-facing summary with visual progress bar,
 * encouraging message, and clear next-step actions.
 */

import { useLanguage } from '@/lib/i18n/language-context'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Trophy, ArrowRight, RotateCcw, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

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
  /** Optional visual breakdown of performance per round */
  roundBreakdown?: Array<{ label: string; correct: number; total: number }>
}

function getPerformanceColor(accuracy: number): string {
  if (accuracy >= 80) return 'text-primary'
  if (accuracy >= 50) return 'text-emerald-600'
  return 'text-amber-600'
}

function getBarColor(accuracy: number): string {
  if (accuracy >= 80) return 'bg-primary'
  if (accuracy >= 50) return 'bg-emerald-500'
  return 'bg-amber-500'
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
  roundBreakdown,
}: FinalResultProps) {
  const { t } = useLanguage()

  const accuracyColor = getPerformanceColor(accuracy)
  const barColor = getBarColor(accuracy)

  return (
    <section className="flex flex-col items-center justify-center text-center px-4 py-10">
      {/* Trophy icon */}
      <div className="relative">
        <div className="flex size-20 items-center justify-center rounded-3xl bg-primary/10 text-primary shadow-sm">
          <Trophy className="size-10" aria-hidden="true" />
        </div>
        {/* Decorative ring */}
        <div className="absolute inset-0 rounded-3xl ring-2 ring-primary/10 ring-offset-4 ring-offset-background" aria-hidden="true" />
      </div>

      <h1 className="mt-6 text-3xl font-bold tracking-tight text-foreground">
        {t('activity_complete')}
      </h1>

      <p className="mt-1.5 text-base text-muted-foreground">{title}</p>

      {/* Accuracy — big visual number + progress bar */}
      <div className="mt-6 w-full max-w-sm">
        <div className={cn('text-5xl font-bold tabular-nums', accuracyColor)}>
          {accuracy}%
        </div>
        <p className="mt-1 text-sm font-medium text-muted-foreground">{t('accuracy')}</p>

        {/* Visual progress bar */}
        <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-700 ease-out',
              barColor,
            )}
            style={{ width: `${Math.max(accuracy, 2)}%` }}
            role="progressbar"
            aria-valuenow={accuracy}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${accuracy}% accuracy`}
          />
        </div>
      </div>

      {/* Rounds completed pill */}
      <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2">
        <CheckCircle2 className="size-4 text-muted-foreground" aria-hidden="true" />
        <span className="text-sm font-medium text-muted-foreground">
          {t('rounds_completed')}: {roundsCompleted} / {totalRounds}
        </span>
      </div>

      {/* Round breakdown (if available) */}
      {roundBreakdown && roundBreakdown.length > 0 && (
        <div className="mt-5 w-full max-w-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">
            Round breakdown
          </p>
          <div className="flex flex-col gap-1.5">
            {roundBreakdown.map((r, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border border-border/60 bg-card/50 px-3 py-2">
                <span className="text-xs font-medium text-muted-foreground w-24 shrink-0 truncate">
                  {r.label}
                </span>
                <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div
                    className={cn('h-full rounded-full', r.correct / r.total >= 0.8 ? 'bg-primary' : r.correct / r.total >= 0.4 ? 'bg-emerald-500' : 'bg-amber-500')}
                    style={{ width: `${r.total > 0 ? (r.correct / r.total) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-muted-foreground tabular-nums">
                  {r.correct}/{r.total}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Encouraging message */}
      <p className="mt-4 max-w-md text-base text-muted-foreground">{message}</p>

      {/* Actions */}
      <div className="mt-6 flex w-full max-w-sm flex-col gap-3">
        {onContinue && (
          <Button size="lg" className="text-lg gap-2" onClick={onContinue}>
            {continueLabel ?? t('continue_pattern')}
            <ArrowRight className="size-5" aria-hidden="true" />
          </Button>
        )}
        {onActivities && (
          <Button
            size="lg"
            variant={onContinue ? 'outline' : 'default'}
            onClick={onActivities}
            className="gap-2"
          >
            <Home className="size-5" aria-hidden="true" />
            {t('back_activities')}
          </Button>
        )}
        <Button size="lg" variant="ghost" onClick={onAgain} className="gap-2">
          <RotateCcw className="size-4" aria-hidden="true" />
          {t('try_again')}
        </Button>
      </div>
    </section>
  )
}
