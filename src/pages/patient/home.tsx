import { useNavigate } from 'react-router-dom'
import { useLanguage } from '@/lib/i18n/language-context'
import { useAuth } from '@/lib/supabase/auth-context'
import { PatientBottomNav } from '@/components/patient/bottom-nav'
import { Gamepad2 } from 'lucide-react'

export function PatientHomePage() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { user } = useAuth()

  const greetingText = t('welcome') + ', ' + (user?.name ?? t('friend')) + '!'

  return (
    <div className="patient-ui flex min-h-screen flex-col bg-background">
      <main className="flex flex-1 flex-col items-center justify-center px-6 pt-12 pb-24 text-center">
        {/* Greeting */}
        <h1 className="mb-2 text-[2.25rem] font-bold leading-tight text-foreground sm:text-[2.5rem]">
          {greetingText}
        </h1>
        <p className="mb-10 text-lg text-muted-foreground">
          {t('how_are_you_today')}
        </p>

        {/* Single primary action */}
        <button
          onClick={() => navigate('/patient/game/memory?mode=daily')}
          className="flex w-full max-w-sm items-center justify-center gap-3 rounded-xl bg-primary px-8 py-6 text-xl font-semibold text-primary-foreground transition-colors duration-150 hover:bg-primary/90 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          <Gamepad2 className="h-7 w-7" />
          {t('start_today_activity')}
        </button>
      </main>

      <PatientBottomNav />
    </div>
  )
}
