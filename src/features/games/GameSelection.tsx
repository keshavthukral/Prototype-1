/**
 * Game Selection — /patient/games
 *
 * Simple list: two activities, each one tap away.
 */

import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Brain, Grid3X3 } from 'lucide-react'

export function GameSelection() {
  const navigate = useNavigate()

  return (
    <div className="patient-ui flex min-h-screen flex-col bg-background">
      <main className="flex flex-1 flex-col px-6 pt-8 pb-12">

        {/* Back */}
        <button
          onClick={() => navigate('/patient')}
          className="mb-8 flex h-12 w-fit cursor-pointer items-center gap-2 rounded-lg px-2 text-base text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <ArrowLeft className="h-5 w-5" />
          Home
        </button>

        <h1 className="mb-8 text-[2.25rem] font-bold text-foreground sm:text-[2.5rem]">
          Activities
        </h1>

        {/* Simple list of activities */}
        <div className="space-y-4">
          <button
            onClick={() => navigate('/patient/game/memory?mode=practice')}
            className="flex w-full items-center gap-5 rounded-xl border border-border bg-card p-5 transition-colors duration-150 hover:border-primary/30 hover:bg-accent/50 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Brain className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <h2 className="text-lg font-semibold text-foreground">Memory Recall</h2>
              <p className="text-sm text-muted-foreground">Remember familiar objects</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/patient/game/pattern?mode=practice')}
            className="flex w-full items-center gap-5 rounded-xl border border-border bg-card p-5 transition-colors duration-150 hover:border-primary/30 hover:bg-accent/50 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Grid3X3 className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <h2 className="text-lg font-semibold text-foreground">Pattern &amp; Attention</h2>
              <p className="text-sm text-muted-foreground">Find what comes next</p>
            </div>
          </button>
        </div>
      </main>
    </div>
  )
}
