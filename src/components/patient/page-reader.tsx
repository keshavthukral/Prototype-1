import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { LoaderCircle, Square, Volume2 } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/language-context'
import { speechService, type SpeechState } from '@/lib/speech/speechService'

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
      <button type="button" onClick={() => text ? void speechService.toggle(text, language) : undefined} disabled={!text} aria-pressed={active} className="inline-flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border border-primary/30 bg-card px-5 py-3 text-lg font-semibold text-foreground shadow-sm transition-colors duration-150 hover:border-primary hover:bg-accent active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50">
        {ownsRequest && speechState.status === 'loading' ? <LoaderCircle className="size-6 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : active ? <Square className="size-5 fill-current" aria-hidden="true" /> : <Volume2 className="size-6" aria-hidden="true" />}
        <span>{active ? t('page_reader_stop') : t('page_reader_hear')}</span>
      </button>
      {message && <p role="status" className="rounded-lg bg-card px-3 py-2 text-sm font-medium text-muted-foreground shadow-sm">{message}</p>}
    </div>
  )
}
