function configuredNumber(value: string | undefined, fallback: string): string {
  return value?.trim() || fallback
}

export const SUPPORT_CONTACTS = {
  caregiver: { name: 'Rahul Sharma', phone: configuredNumber(import.meta.env.VITE_CAREGIVER_PHONE, '+91 98765 43210') },
  family: { label: 'Family Member', phone: configuredNumber(import.meta.env.VITE_FAMILY_PHONE, '+91 98765 43211') },
  emergency: { label: 'Emergency Services', phone: configuredNumber(import.meta.env.VITE_EMERGENCY_NUMBER, '112') },
} as const
