import { useNavigate } from 'react-router-dom'
import { useLanguage } from '@/lib/i18n/language-context'
import { Globe } from 'lucide-react'
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
    <div className="patient-ui flex min-h-screen flex-col items-center bg-background px-6 py-12 page-enter">
      <main className="flex w-full max-w-lg flex-col items-center px-4" role="main">
        {/* ── Brand Header ─────────────────────────────────── */}
        <div className="mb-3 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Globe className="size-8" aria-hidden="true" />
        </div>

        <h1 className="mt-4 mb-2 text-4xl font-bold tracking-tight text-foreground">
          {t('app_name')}
        </h1>

        <p className="mb-10 text-center text-base leading-relaxed text-muted-foreground">
          {t('select_language')}
        </p>

        {/* ── Language Options ─────────────────────────────── */}
        <div className="flex w-full flex-col gap-4">
          {LANGUAGES.map(({ code, label, nativeLabel }) => (
            <button
              key={code}
              onClick={() => handleSelect(code)}
              className={cn(
                'group flex w-full flex-col items-center gap-1.5 rounded-2xl border-2 p-7',
                'cursor-pointer text-center transition-all duration-150',
                'active:scale-[0.99]',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                language === code
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border bg-card hover:border-primary/40 hover:bg-accent/50 hover:shadow-sm'
              )}
              aria-label={t('select_language_label').replace('{language}', label)}
              aria-pressed={language === code}
            >
              {/* Native script — primary, very large */}
              <span className="text-[2rem] font-bold leading-tight text-foreground">
                {nativeLabel}
              </span>

              {/* English name — secondary */}
              <span className="text-sm text-muted-foreground">
                {label}
              </span>

              {/* Selected indicator */}
              {language === code && (
                <span className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                  <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  Selected
                </span>
              )}
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}
