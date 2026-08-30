import { en } from './en'
import { as } from './as'

export function assertPatientTranslationsComplete(): void {
  if (!import.meta.env.DEV) return
  const englishKeys = Object.keys(en)
  const assameseKeys = new Set(Object.keys(as))
  const missing = englishKeys.filter((key) => !assameseKeys.has(key) || !as[key as keyof typeof as].trim())
  const extra = Object.keys(as).filter((key) => !(key in en))
  if (missing.length || extra.length) {
    throw new Error(`Patient translation mismatch. Missing Assamese: ${missing.join(', ') || 'none'}. Extra Assamese: ${extra.join(', ') || 'none'}.`)
  }
}
