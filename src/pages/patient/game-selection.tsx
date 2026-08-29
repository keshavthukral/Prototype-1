import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/language-context'
import { PatientBottomNav } from '@/components/patient/bottom-nav'
import { ArrowLeft, Brain, Grid3X3 } from 'lucide-react'

export function GameSelectionPage() {
  const navigate = useNavigate()
  const { t } = useLanguage()

  return (
    <div className="patient-ui flex min-h-screen flex-col bg-background">
      <main className="flex flex-1 flex-col px-6 pt-8 pb-24">
        {/* Back */}
        <Button
          variant="ghost"
          onClick={() => navigate('/patient')}
          className="mb-8 h-14 w-fit self-start text-base"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          {t('back')}
        </Button>

        {/* Instruction */}
        <h1 className="mb-10 text-[2rem] font-bold text-foreground sm:text-[2.5rem]">
          {t('pick_game')}
        </h1>

        {/* Two game options — large, calm, clear */}
        <div className="space-y-5">
          <button
            onClick={() => navigate('/patient/game/memory')}
            className="flex w-full items-center gap-5 rounded-2xl border border-border bg-card p-6 text-left shadow-sm transition-colors hover:bg-accent/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Brain className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                {t('memory_game')}
              </h2>
              <p className="mt-1 text-base text-muted-foreground">
                {t('remember_objects')}
              </p>
            </div>
          </button>

          <button
            onClick={() => navigate('/patient/game/pattern')}
            className="flex w-full items-center gap-5 rounded-2xl border border-border bg-card p-6 text-left shadow-sm transition-colors hover:bg-accent/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Grid3X3 className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                {t('pattern_game')}
              </h2>
              <p className="mt-1 text-base text-muted-foreground">
                {t('what_comes_next')}
              </p>
            </div>
          </button>
        </div>
      </main>

      <PatientBottomNav />
    </div>
  )
}
