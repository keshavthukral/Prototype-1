import { isSupabaseConfigured, supabase } from '@/lib/supabase/client'

function base64Blob(value: string, contentType: string) {
  const bytes = Uint8Array.from(atob(value), (character) => character.charCodeAt(0))
  return new Blob([bytes], { type: contentType })
}

export const bhashiniTTS = {
  async synthesizeAssamese(text: string): Promise<Blob | null> {
    if (!navigator.onLine || !isSupabaseConfigured()) return null
    try {
      const { data, error } = await supabase.functions.invoke('bhashini-tts', { body: { text, language: 'as' } })
      if (error || !data?.audioBase64) return null
      return base64Blob(data.audioBase64, data.contentType || 'audio/wav')
    } catch { return null }
  },
}
