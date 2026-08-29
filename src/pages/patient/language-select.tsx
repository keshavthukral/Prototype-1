import { useNavigate } from 'react-router-dom'
import { useLanguage } from '@/lib/i18n/language-context'
import type { Language } from '@/types'
import { cn } from '@/lib/utils'

const LANGUAGES: { code: Language; label: string; nativeLabel: string }[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'as', label: 'Assamese', nativeLabel: '\u0905\u0938\u092E\u0940\u09AF\u09BC\u09BE' },
]

export function LanguageSelectPage() {
  const navigate = useNavigate()
  const { language, setLanguage, t } = useLanguage()

  const handleSelect = (code: Language) => {
    setLanguage(code)
    navigate('/patient', { replace: true })
  }

  return (
    <div className="patient-ui flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <main className="flex w-full max-w-md flex-col items-center" role="main">
        {/* App name */}
        <h1 className="mb-2 text-[2.25rem] font-bold text-foreground sm:text-[2.5rem]">
          {t('app_name')}
        </h1>

        {/* Instruction */}
        <p className="mb-12 text-lg text-muted-foreground">
          {t('select_language')}
        </p>

        {/* Language options — extremely large, obvious */}
        <div className="flex w-full flex-col gap-5">
          {LANGUAGES.map(({ code, label, nativeLabel }) => (
            <button
              key={code}
              onClick={() => handleSelect(code)}
              className={cn(
                'flex w-full flex-col items-center gap-2 rounded-xl border-2 p-8',
                'text-center transition-all duration-150',
                'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring',
                'active:scale-[0.98]',
                language === code
                  ? 'border-primary bg-primary/10 shadow-sm'
                  : 'border-border bg-card hover:border-primary/40 hover:bg-accent/50'
              )}
              aria-label={`Select ${label}`}
              aria-pressed={language === code}
            >
              {/* Native script — primary, very large */}
              <span className="text-[2rem] font-bold leading-tight text-foreground">
                {nativeLabel}
              </span>

              {/* English name — secondary */}
              <span className="text-base text-muted-foreground">
                {label}
              </span>
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}
