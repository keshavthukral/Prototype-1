const CACHE_NAME = 'brainbuddy-speech-v1'

export const CACHEABLE_PHRASES = [
  'Welcome', "Start today's activity", 'Remember these objects',
  'Tap the objects you remember', 'Choose what comes next', 'Well done',
  'Activity complete', 'My reminders', 'My memories', 'Need help',
] as const

async function keyFor(language: string, text: string): Promise<string> {
  const input = new TextEncoder().encode(`${language.trim().toLowerCase()}\u0000${text.trim()}`)
  const digest = await crypto.subtle.digest('SHA-256', input)
  const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
  return `${location.origin}/_speech-cache/${hash}`
}

export const speechCache = {
  async get(language: string, text: string): Promise<Blob | null> {
    if (!('caches' in window)) return null
    const cache = await caches.open(CACHE_NAME)
    const response = await cache.match(await keyFor(language, text))
    return response ? response.blob() : null
  },
  async put(language: string, text: string, audio: Blob): Promise<void> {
    if (!('caches' in window)) return
    const cache = await caches.open(CACHE_NAME)
    await cache.put(await keyFor(language, text), new Response(audio, { headers: { 'Content-Type': audio.type || 'audio/wav' } }))
  },
}
