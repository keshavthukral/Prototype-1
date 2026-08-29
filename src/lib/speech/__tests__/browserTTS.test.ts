import { describe, expect, it, vi } from 'vitest'

describe('browserTTS', () => {
  it('waits for voices, reuses the discovered list, and never substitutes Assamese', async () => {
    let voices: Array<{ name: string; lang: string; default: boolean; localService: boolean; voiceURI: string }> = []
    const listeners = new Set<() => void>()
    const spoken: Array<{ voice?: { lang: string }; lang: string; rate: number; pitch: number; volume: number }> = []
    let cancelCount = 0
    const speechSynthesis = {
      getVoices: () => voices,
      addEventListener: (_name: string, listener: () => void) => listeners.add(listener),
      removeEventListener: (_name: string, listener: () => void) => listeners.delete(listener),
      cancel: () => { cancelCount += 1 },
      speak: (utterance: { onstart?: () => void; voice?: { lang: string }; lang: string; rate: number; pitch: number; volume: number }) => { spoken.push(utterance); utterance.onstart?.() },
    }
    class Utterance { text: string; lang = ''; voice?: { lang: string }; rate = 1; pitch = 1; volume = 1; onstart?: () => void; onend?: () => void; onerror?: () => void; constructor(text: string) { this.text = text } }
    vi.stubGlobal('window', { speechSynthesis, setTimeout, SpeechSynthesisUtterance: Utterance })
    vi.stubGlobal('SpeechSynthesisUtterance', Utterance)

    const { browserTTS } = await import('../browserTTS')
    const first = browserTTS.speak('Welcome', 'en', { onStart: vi.fn(), onEnd: vi.fn(), onError: vi.fn() })
    voices = [{ name: 'Indian English', lang: 'en-IN', default: true, localService: true, voiceURI: 'en-in' }]
    listeners.forEach((listener) => listener())
    expect(await first).toBe(true)
    expect(spoken[0]?.voice?.lang).toBe('en-IN')
    expect(spoken[0]).toMatchObject({ rate: 0.9, pitch: 1, volume: 1 })

    expect(await browserTTS.speak('Welcome again', 'en', { onStart: vi.fn(), onEnd: vi.fn(), onError: vi.fn() })).toBe(true)
    expect(await browserTTS.speak('স্বাগতম', 'as', { onStart: vi.fn(), onEnd: vi.fn(), onError: vi.fn() })).toBe(false)
    expect(spoken).toHaveLength(2)

    voices.push({ name: 'Assamese', lang: 'as-IN', default: false, localService: true, voiceURI: 'as-in' })
    listeners.forEach((listener) => listener())
    expect(await browserTTS.speak('স্বাগতম', 'as', { onStart: vi.fn(), onEnd: vi.fn(), onError: vi.fn() })).toBe(true)
    expect(spoken[2]?.voice?.lang).toBe('as-IN')
    expect(cancelCount).toBe(3)
    vi.unstubAllGlobals()
  })
})
