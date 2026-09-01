import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { LoaderCircle, Square, Volume2 } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/language-context'
import { speechService, type SpeechState } from '@/lib/speech/speechService'
import { cn } from '@/lib/utils'

function pageText(): string {
  const main = document.querySelector('main')
  if (!main) return ''
  const copy = main.cloneNode(true) as HTMLElement
  copy.querySelectorAll('[data-page-reader], nav, canvas, [aria-hidden="true"]').forEach((node) => node.remove())
  return (copy.innerText || copy.textContent || '').replace(/\s+/g, ' ').trim()
}

export function PageReader() {
  const { pathname, search } = useLocation()
  const { language, t } = useLanguage()
  const [text, setText] = useState('')
  const [speechState, setSpeechState] = useState<SpeechState>(speechService.getState())
  const requestKey = useMemo(() => `${language}:${text}`, [language, text])
  const ownsRequest = speechState.requestKey === requestKey
  const active = ownsRequest && (speechState.status === 'loading' || speechState.status === 'speaking')

  useEffect(() => speechService.subscribe(setSpeechState), [])
  useEffect(() => {
    const update = () => setText(pageText())
    const frame = requestAnimationFrame(update)
    const observer = new MutationObserver(update)
    observer.observe(document.body, { childList: true, subtree: true, characterData: true })
    return () => { cancelAnimationFrame(frame); observer.disconnect(); if (speechService.getState().requestKey === requestKey) speechService.stop() }
  }, [pathname, search, requestKey])

  if (!pathname.startsWith('/patient') || pathname === '/patient/language') return null
  const message = ownsRequest && speechState.status === 'unavailable' && speechState.message ? t(speechState.message) : null

  return (
    <div data-page-reader className="fixed right-4 top-4 z-40 flex max-w-[calc(100vw-2rem)] flex-col items-end gap-2 sm:right-6 sm:top-6">
      <button
        type="button"
        onClick={() => text ? void speechService.toggle(text, language) : undefined}
        disabled={!text}
        aria-pressed={active}
        className={cn(
          'inline-flex min-h-[52px] cursor-pointer items-center gap-2.5 rounded-xl px-4 py-2.5',
          'text-sm font-semibold transition-all duration-150',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
          'disabled:cursor-not-allowed disabled:opacity-40',
          'shadow-sm border',
          active
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border bg-white text-foreground hover:border-primary/40 hover:bg-accent'
        )}
      >
        {ownsRequest && speechState.status === 'loading'
          ? <LoaderCircle className="size-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
          : active
            ? <Square className="size-4 fill-current" aria-hidden="true" />
            : <Volume2 className="size-5" aria-hidden="true" />
        }
        <span>{active ? t('page_reader_stop') : t('page_reader_hear')}</span>
      </button>
      {message && (
        <p role="status" className="rounded-lg bg-white border border-border px-3 py-2 text-xs font-medium text-muted-foreground shadow-sm">
          {message}
        </p>
      )}
    </div>
  )
}
