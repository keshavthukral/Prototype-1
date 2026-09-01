/**
 * Game Intro — full-screen intro card used by both games.
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
}

export function GameIntro({
  icon: Icon,
  title,
  description,
  backLabel,
  onBack,
  onStart,
}: GameIntroProps) {
  const { t } = useLanguage()

  return (
    <section className="flex flex-col items-center justify-center text-center px-4 pt-8 pb-12">
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

      <div className="flex size-20 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="size-9" aria-hidden="true" />
      </div>

      <h1 className="mt-5 text-3xl font-bold tracking-tight text-foreground">
        {title}
      </h1>

      <p className="mt-2 max-w-md text-base leading-relaxed text-muted-foreground">
        {description}
      </p>

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
