import { useEffect, useMemo, useState } from 'react'
import { LoaderCircle, Volume2, VolumeX } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/language-context'
import { speechService, type SpeechState } from '@/lib/speech/speechService'
import { cn } from '@/lib/utils'

interface HearAgainProps { text: string; className?: string; label?: string; ariaLabel?: string; rate?: number; pitch?: number }

export function HearAgain({ text, className, label, ariaLabel }: HearAgainProps) {
  const { t, language } = useLanguage()
  const [serviceState, setServiceState] = useState<SpeechState>(speechService.getState())
  const requestKey = useMemo(() => `${language}:${text}`, [language, text])
  const ownsActiveRequest = serviceState.requestKey === requestKey
  const active = ownsActiveRequest && (serviceState.status === 'speaking' || serviceState.status === 'loading')
  const message = ownsActiveRequest && serviceState.status === 'unavailable' && serviceState.message ? t(serviceState.message) : undefined

  useEffect(() => speechService.subscribe(setServiceState), [])
  useEffect(() => () => { if (speechService.getState().requestKey === requestKey) speechService.stop() }, [requestKey])

  return (
    <div className={cn('flex flex-col items-start gap-2', className)}>
      <button
        type="button"
        onClick={() => void speechService.toggle(text, language)}
        aria-pressed={active}
        aria-label={active ? t('stop_voice') : ariaLabel ?? label ?? t('hear_again')}
        className="inline-flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border border-border bg-card px-5 py-3 text-lg font-semibold text-foreground transition-colors duration-150 hover:border-primary/40 hover:bg-accent active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-pressed:border-primary aria-pressed:bg-primary/10 aria-pressed:text-primary"
      >
        {ownsActiveRequest && serviceState.status === 'loading' ? <LoaderCircle className="size-6 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : active ? <VolumeX className="size-6" aria-hidden="true" /> : <Volume2 className="size-6" aria-hidden="true" />}
        <span>{active ? t('stop') : label ?? t('hear_again')}</span>
      </button>
      {message && <p role="status" className="max-w-sm text-base font-medium text-muted-foreground">{message}</p>}
    </div>
  )
}
