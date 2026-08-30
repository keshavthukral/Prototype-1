import type { en } from './en'
export type PatientTranslationKey = keyof typeof en
export type PatientTranslations = { [K in PatientTranslationKey]: string }
