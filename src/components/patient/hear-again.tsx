import { useState, useCallback } from 'react'
import { useLanguage } from '@/lib/i18n/language-context'
import { Volume2, VolumeX } from 'lucide-react'
import { cn } from '@/lib/utils'

interface HearAgainProps {
  text: string
  rate?: number
  pitch?: number
  className?: string
  label?: string
  ariaLabel?: string
}

const SPEECH_LANG_MAP: Record<string, string> = {
  en: 'en-US',
  as: 'as-IN',
}

export function HearAgain({
  text,
  rate = 0.8,
  pitch = 1.0,
  className,
  label,
  ariaLabel,
}: HearAgainProps) {
  const { t, language } = useLanguage()
  const [speaking, setSpeaking] = useState(false)
  const [notAvailable, setNotAvailable] = useState(false)

  const speak = useCallback(() => {
    if (!text) return

    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = rate
    utterance.pitch = pitch

    const langCode = SPEECH_LANG_MAP[language] ?? 'en-US'
    utterance.lang = langCode

    const voices = window.speechSynthesis.getVoices()
    const matchingVoice = voices.find(v => v.lang.startsWith(language))
    if (matchingVoice) {
      utterance.voice = matchingVoice
    }

    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => {
      setSpeaking(false)
      setNotAvailable(true)
    }

    window.speechSynthesis.speak(utterance)
  }, [text, rate, pitch, language])

  if (notAvailable) {
    return (
      <span className={cn('text-sm text-muted-foreground', className)}>
        {text}
      </span>
    )
  }

  return (
    <button
      onClick={speak}
      disabled={speaking}
      className={cn(
        'inline-flex items-center gap-2 rounded-lg px-4 py-3 text-base font-medium',
        'transition-colors duration-150',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        speaking
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground',
        className
      )}
      aria-label={ariaLabel ?? label ?? t('hear_again')}
    >
      {speaking ? (
        <VolumeX className="h-5 w-5 animate-pulse" />
      ) : (
        <Volume2 className="h-5 w-5" />
      )}
      <span>{label ?? t('hear_again')}</span>
    </button>
  )
}
