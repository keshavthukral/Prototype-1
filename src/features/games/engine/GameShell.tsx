/**
 * Game Shell — shared wrapper for both Memory Journey and Attention Adventure.
 *
 * Provides: progress bar, round/step indicator, exit dialog, celebration.
 */

import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Celebration } from '@/features/games/Celebration'
import { ExitDialog } from '@/features/games/ExitDialog'
import { useLanguage } from '@/lib/i18n/language-context'

interface GameShellProps {
  totalSteps: number
  currentStep: number
  showHeader?: boolean
  celebrate?: boolean
  onBack: () => void
  children: React.ReactNode
}

export function GameShell({
  totalSteps,
  currentStep,
  showHeader = true,
  celebrate = false,
  onBack,
  children,
}: GameShellProps) {
  const [exitOpen, setExitOpen] = useState(false)

  const handleBack = () => {
    if (showHeader) setExitOpen(true)
    else onBack()
  }

  return (
    <>
      <ExitDialog
        open={exitOpen}
        onOpenChange={setExitOpen}
        onLeave={onBack}
      />
      <Celebration active={celebrate} />
      <main className="mx-auto flex w-full max-w-5xl flex-col px-5 py-5 sm:px-8 lg:px-12 lg:py-8 page-enter">
        {showHeader && (
          <GameHeader
            current={currentStep}
            total={totalSteps}
            onBack={handleBack}
          />
        )}
        {children}
      </main>
    </>
  )
}

// ─── Header ─────────────────────────────────────────────────────

function GameHeader({
  current,
  total,
  onBack,
}: {
  current: number
  total: number
  onBack: () => void
}) {
  const { t } = useLanguage()
  const pct = total > 0 ? ((current + 1) / total) * 100 : 0

  return (
    <header className="mb-4">
      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="px-2">
          <ArrowLeft data-icon="inline-start" />
          {t('back')}
        </Button>
        <p className="text-sm font-semibold text-muted-foreground">
          {t('count_of')
            .replace('{current}', String(current + 1))
            .replace('{total}', String(total))}
        </p>
      </div>
      {/* Progress bar */}
      <div
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary"
        role="progressbar"
        aria-valuenow={current + 1}
        aria-valuemin={1}
        aria-valuemax={total}
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-500 motion-reduce:transition-none"
          style={{ width: `${pct}%` }}
        />
      </div>
      {/* Dot indicators */}
      <div className="mt-2.5 flex justify-center gap-1.5" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={`size-2 rounded-full transition-colors duration-200 ${
              i < current
                ? 'bg-primary'
                : i === current
                  ? 'bg-primary ring-2 ring-primary/25'
                  : 'bg-border'
            }`}
          />
        ))}
      </div>
    </header>
  )
}
