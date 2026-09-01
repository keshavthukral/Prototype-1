/**
 * ViewTimer — large countdown display used during memorization phases.
 */

interface ViewTimerProps {
  seconds: number
  title: string
  subtitle?: string
}

export function ViewTimer({ seconds, title, subtitle }: ViewTimerProps) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative flex size-20 items-center justify-center rounded-full bg-primary/10">
        <span className="text-3xl font-bold tabular-nums text-primary">
          {seconds}
        </span>
      </div>
      <h1 className="mt-4 text-2xl font-bold text-foreground">{title}</h1>
      {subtitle && (
        <p className="mt-1.5 text-base text-muted-foreground">{subtitle}</p>
      )}
    </div>
  )
}
