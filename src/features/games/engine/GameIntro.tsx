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
    <section className="flex flex-1 flex-col items-center justify-center text-center">
      <Button
        variant="ghost"
        className="absolute left-5 top-6"
        onClick={onBack}
      >
        <ArrowLeft data-icon="inline-start" />
        {backLabel}
      </Button>

      <div className="flex size-20 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="size-10" />
      </div>

      <h1 className="mt-6 text-[2.5rem] font-bold tracking-[-0.02em] text-foreground">
        {title}
      </h1>

      <p className="mt-3 max-w-md text-xl leading-relaxed text-muted-foreground">
        {description}
      </p>

      <Button
        size="lg"
        className="mt-9 min-h-16 w-full max-w-sm text-xl"
        onClick={onStart}
      >
        {t('start_activity')}
      </Button>
    </section>
  )
}
