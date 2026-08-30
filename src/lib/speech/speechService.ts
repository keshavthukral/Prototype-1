import { browserTTS, type SpeechLanguage } from './browserTTS'
import { bhashiniTTS } from './bhashiniTTS'
import { speechCache } from './speechCache'

export type SpeechStatus = 'idle' | 'loading' | 'speaking' | 'unavailable'
export interface SpeechState { status: SpeechStatus; message?: string; requestKey?: string }
type Listener = (state: SpeechState) => void

class SpeechService {
  private state: SpeechState = { status: 'idle' }
  private listeners = new Set<Listener>()
  private audio: HTMLAudioElement | null = null
  private audioUrl: string | null = null
  private generation = 0

  constructor() { if (typeof window !== 'undefined') void browserTTS.initialize() }
  subscribe(listener: Listener) { this.listeners.add(listener); listener(this.state); return () => { this.listeners.delete(listener) } }
  getState() { return this.state }

  stop() {
    this.generation += 1; browserTTS.cancel()
    if (this.audio) { this.audio.pause(); this.audio.currentTime = 0; this.audio = null }
    if (this.audioUrl) { URL.revokeObjectURL(this.audioUrl); this.audioUrl = null }
    this.setState({ status: 'idle' })
  }

  async toggle(text: string, language: SpeechLanguage) {
    const requestKey = `${language}:${text}`
    if ((this.state.status === 'speaking' || this.state.status === 'loading') && this.state.requestKey === requestKey) { this.stop(); return }
    this.stop(); const generation = this.generation; this.setState({ status: 'loading', requestKey })
    if (!text.trim()) { this.setState({ status: 'unavailable', message: 'nothing_to_read', requestKey }); return }

    if (language === 'en') {
      const started = await browserTTS.speak(text, 'en', { onStart: () => generation === this.generation && this.setState({ status: 'speaking', requestKey }), onEnd: () => generation === this.generation && this.setState({ status: 'idle' }), onError: () => generation === this.generation && this.setState({ status: 'unavailable', message: 'voice_unavailable_device', requestKey }) })
      if (!started && generation === this.generation) this.setState({ status: 'unavailable', message: 'voice_unavailable_device', requestKey })
      return
    }

    if (await browserTTS.hasAssameseVoice()) {
      if (generation !== this.generation) return
      await browserTTS.speak(text, 'as', { onStart: () => generation === this.generation && this.setState({ status: 'speaking', requestKey }), onEnd: () => generation === this.generation && this.setState({ status: 'idle' }), onError: () => generation === this.generation && this.setState({ status: 'unavailable', message: 'voice_unavailable_assamese', requestKey }) })
      return
    }

    let audio: Blob | null = null
    if (navigator.onLine) { audio = await bhashiniTTS.synthesizeAssamese(text); if (audio) await speechCache.put('as', text, audio) }
    if (!audio) audio = await speechCache.get('as', text)
    if (generation !== this.generation) return
    if (!audio) { this.setState({ status: 'unavailable', message: navigator.onLine ? 'voice_not_configured' : 'voice_unavailable_offline', requestKey }); return }
    this.playAudio(audio, requestKey, generation)
  }

  private playAudio(blob: Blob, requestKey: string, generation: number) {
    this.audioUrl = URL.createObjectURL(blob); this.audio = new Audio(this.audioUrl)
    this.audio.onplay = () => generation === this.generation && this.setState({ status: 'speaking', requestKey })
    this.audio.onended = () => generation === this.generation && this.stop()
    this.audio.onerror = () => generation === this.generation && this.setState({ status: 'unavailable', message: 'voice_cached_error', requestKey })
    void this.audio.play().catch(() => { if (generation === this.generation) this.setState({ status: 'unavailable', message: 'voice_tap_again', requestKey }) })
  }
  private setState(state: SpeechState) { this.state = state; this.listeners.forEach((listener) => listener(state)) }
}

export const speechService = new SpeechService()
