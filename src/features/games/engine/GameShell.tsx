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
  /** Total steps (rounds or challenges) */
  totalSteps: number
  /** Current step (0-indexed) */
  currentStep: number
  /** Whether to show the header (hide during intro/final-result) */
  showHeader?: boolean
  /** Whether celebration is active */
  celebrate?: boolean
  /** Callback when user clicks back */
  onBack: () => void
  /** Children to render in the main area */
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
    <div className="patient-ui min-h-screen bg-background">
      <ExitDialog
        open={exitOpen}
        onOpenChange={setExitOpen}
        onLeave={onBack}
      />
      <Celebration active={celebrate} />
      <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-5 py-6 sm:px-8">
        {showHeader && (
          <GameHeader
            current={currentStep}
            total={totalSteps}
            onBack={handleBack}
          />
        )}
        {children}
      </main>
    </div>
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
    <header className="mb-5">
      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft data-icon="inline-start" />
          {t('back')}
        </Button>
        <p className="text-lg font-semibold text-foreground">
          {t('count_of')
            .replace('{current}', String(current + 1))
            .replace('{total}', String(total))}
        </p>
      </div>
      {/* Progress bar */}
      <div
        className="mt-4 h-2 overflow-hidden rounded-full bg-secondary"
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
      <div className="mt-3 flex justify-center gap-2" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={`size-2.5 rounded-full transition-colors duration-300 ${
              i < current
                ? 'bg-primary'
                : i === current
                  ? 'bg-primary ring-2 ring-primary/30'
                  : 'bg-border'
            }`}
          />
        ))}
      </div>
    </header>
  )
}
