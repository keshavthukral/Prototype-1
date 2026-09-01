/**
 * Game Intro — full-screen intro card used by both games.
 *
 * Shows a visual preview of what the game involves,
 * a clear title, and a prominent Start button.
 */

import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/language-context'
import type { LucideIcon } from 'lucide-react'

interface GameIntroProps {
  icon: LucideIcon
  title: string
  description: string
  backLabel: string
  onBack: () => void
  onStart: () => void
  /** Optional visual preview of what the game involves */
  preview?: Array<{ label: string; icon: LucideIcon }>
  /** Optional estimated duration text */
  duration?: string
}

export function GameIntro({
  icon: Icon,
  title,
  description,
  backLabel,
  onBack,
  onStart,
  preview,
  duration,
}: GameIntroProps) {
  const { t } = useLanguage()

  return (
    <section className="flex flex-col items-center justify-center text-center px-4 py-10">
      <Button
        variant="ghost"
        size="sm"
        className="mb-8 self-start"
        onClick={onBack}
        aria-label={backLabel}
      >
        <ArrowLeft data-icon="inline-start" />
        {backLabel}
      </Button>

      {/* Hero icon */}
      <div className="relative">
        <div className="flex size-20 items-center justify-center rounded-3xl bg-primary/10 text-primary shadow-sm">
          <Icon className="size-10" aria-hidden="true" />
        </div>
        {/* Decorative ring */}
        <div className="absolute inset-0 rounded-3xl ring-2 ring-primary/10 ring-offset-4 ring-offset-background" aria-hidden="true" />
      </div>

      <h1 className="mt-6 text-3xl font-bold tracking-tight text-foreground">
        {title}
      </h1>

      <p className="mt-3 max-w-md text-base leading-relaxed text-muted-foreground">
        {description}
      </p>

      {/* Visual preview — what the player will do */}
      {preview && preview.length > 0 && (
        <div className="mt-8 w-full max-w-md">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-3">
            Here's what you'll do
          </p>
          <div className="flex flex-col gap-2">
            {preview.map((step, i) => {
              const StepIcon = step.icon
              return (
                <div
                  key={step.label}
                  className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/50 px-4 py-3"
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <StepIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span className="text-sm font-medium text-foreground">{step.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Duration badge */}
      {duration && (
        <p className="mt-4 text-sm font-medium text-muted-foreground">
          {duration}
        </p>
      )}

      <Button
        size="lg"
        className="mt-8 min-h-16 w-full max-w-sm text-lg"
        onClick={onStart}
      >
        {t('start_activity')}
      </Button>
    </section>
  )
}
