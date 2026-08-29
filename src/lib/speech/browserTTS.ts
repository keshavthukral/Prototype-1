export type SpeechLanguage = 'en' | 'as'

class BrowserTTS {
  private voices: SpeechSynthesisVoice[] = []
  private initialized: Promise<SpeechSynthesisVoice[]> | null = null
  private listening = false

  initialize(): Promise<SpeechSynthesisVoice[]> {
    if (this.initialized) return this.initialized
    this.initialized = new Promise((resolve) => {
      if (!('speechSynthesis' in window)) return resolve([])
      const load = () => { const found = window.speechSynthesis.getVoices(); if (found.length) { this.voices = found; return true } return false }
      if (!this.listening) { window.speechSynthesis.addEventListener('voiceschanged', load); this.listening = true }
      if (load()) { resolve(this.voices); return }
      const firstVoices = () => { if (load()) { window.speechSynthesis.removeEventListener('voiceschanged', firstVoices); resolve(this.voices) } }
      window.speechSynthesis.addEventListener('voiceschanged', firstVoices)
      window.setTimeout(() => { load(); window.speechSynthesis.removeEventListener('voiceschanged', firstVoices); resolve(this.voices) }, 1200)
    })
    return this.initialized
  }

  async hasAssameseVoice(): Promise<boolean> { await this.initialize(); return Boolean(this.findVoice('as', this.voices)) }
  cancel() { if ('speechSynthesis' in window) window.speechSynthesis.cancel() }

  async speak(text: string, language: SpeechLanguage, callbacks: { onStart: () => void; onEnd: () => void; onError: () => void }): Promise<boolean> {
    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) return false
    await this.initialize()
    const voice = this.findVoice(language, this.voices)
    if (language === 'as' && !voice) return false
    this.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = language === 'as' ? 'as-IN' : voice?.lang || 'en-IN'
    if (voice) utterance.voice = voice
    utterance.rate = 0.9; utterance.pitch = 1; utterance.volume = 1
    utterance.onstart = callbacks.onStart; utterance.onend = callbacks.onEnd; utterance.onerror = callbacks.onError
    window.speechSynthesis.speak(utterance)
    return true
  }

  private findVoice(language: SpeechLanguage, voices: SpeechSynthesisVoice[]) {
    if (language === 'as') return voices.find((voice) => voice.lang.toLowerCase().startsWith('as'))
    return voices.find((voice) => voice.lang.toLowerCase() === 'en-in') ?? voices.find((voice) => voice.lang.toLowerCase().startsWith('en'))
  }
}

export const browserTTS = new BrowserTTS()
