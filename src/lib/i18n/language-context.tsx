import { createContext, useContext, useState, type ReactNode } from 'react'
import type { Language } from '@/types'
import { strings as legacyStrings } from './strings'
import { en as patientEnglish } from '@/i18n/en'
import { as as patientAssamese } from '@/i18n/as'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const LANGUAGE_STORAGE_KEY = 'brainbuddy-language'

function getStoredLanguage(): Language {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY)
    if (stored === 'en' || stored === 'as') {
      return stored
    }
  } catch {
    // localStorage not available
  }
  return 'en'
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getStoredLanguage)

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang)
    } catch {
      // localStorage not available
    }
  }

  const strings: Record<string, string> = {
    ...legacyStrings[language],
    ...(language === 'en' ? patientEnglish : patientAssamese),
  }

  const t = (key: string): string => {
    const value = strings[key]
    if (value) return value
    const message = `Missing ${language} translation: ${key}`
    if (import.meta.env.DEV) throw new Error(message)
    return `⟦${key}⟧`
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
