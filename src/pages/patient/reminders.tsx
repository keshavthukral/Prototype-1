import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '@/lib/i18n/language-context'
import { useAuth } from '@/lib/supabase/auth-context'
import { isSupabaseConfigured, supabase } from '@/lib/supabase/client'
import { reminderRepository } from '@/lib/repositories/reminder'
import type { LocalReminder } from '@/lib/db/database'
import { PatientBottomNav } from '@/components/patient/bottom-nav'
import { ArrowLeft, Pill, Droplets, Footprints, Check, Clock, Bell, Timer, WifiOff } from 'lucide-react'
import { toast } from 'sonner'

type ReminderStatus = 'pending' | 'done' | 'later'

const typeConfig: Record<string, { icon: typeof Pill; labelKey: string }> = {
  medicine: { icon: Pill, labelKey: 'medicine' },
  hydration: { icon: Droplets, labelKey: 'hydration' },
  activity: { icon: Footprints, labelKey: 'activity_type' },
}

function getConfig(reminderType: string): { icon: typeof Pill; labelKey: string } {
  const fallback = typeConfig.activity
  if (!fallback) {
    return { icon: Footprints, labelKey: 'activity_type' }
  }
  return typeConfig[reminderType] ?? fallback
}

interface SupabaseReminderRow {
  id: string
  patient_id: string
  created_by: string | null
  title: string
  description: string | null
  reminder_type: 'medicine' | 'hydration' | 'activity'
  scheduled_time: string | null
  frequency: 'daily' | 'weekly' | 'as_needed'
  is_active: boolean
  created_at: string
  updated_at: string
}

export function RemindersPage() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { user } = useAuth()
  const [reminders, setReminders] = useState<LocalReminder[]>([])
  const [statuses, setStatuses] = useState<Record<string, ReminderStatus>>({})
  const [loading, setLoading] = useState(true)
  const [isOfflineCache, setIsOfflineCache] = useState(false)

  const loadReminders = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }

    const patientId = user.id
    const localReminders = await reminderRepository.getByPatientId(patientId)

    if (localReminders.length > 0) {
      setReminders(localReminders)
      setIsOfflineCache(!isSupabaseConfigured() || !navigator.onLine)
      setLoading(false)
      return
    }

    if (isSupabaseConfigured() && navigator.onLine) {
      try {
        const { data } = await supabase
          .from('reminders')
          .select('*')
          .eq('is_active', true)
          .order('scheduled_time')

        if (data && data.length > 0) {
          const typedData = data as unknown as SupabaseReminderRow[]
          for (const remote of typedData) {
            await reminderRepository.create({
              id: remote.id,
              patientId: remote.patient_id,
              createdBy: remote.created_by ?? undefined,
              title: remote.title,
              description: remote.description ?? undefined,
              reminderType: remote.reminder_type,
              scheduledTime: remote.scheduled_time ?? undefined,
              frequency: remote.frequency,
              isActive: remote.is_active,
            })
          }

          const cachedReminders = await reminderRepository.getByPatientId(patientId)
          setReminders(cachedReminders)
        }
      } catch (err) {
        console.error('Failed to fetch reminders from Supabase:', err)
      }
    }

    setLoading(false)
  }, [user])

  useEffect(() => {
    loadReminders()
  }, [loadReminders])

  const markDone = useCallback(async (reminder: LocalReminder) => {
    setStatuses((prev) => ({ ...prev, [reminder.id]: 'done' }))

    await reminderRepository.addCompletion({
      id: crypto.randomUUID(),
      reminderId: reminder.id,
      patientId: reminder.patientId,
      status: 'done',
      completedAt: new Date(),
    })

    if (!navigator.onLine || !isSupabaseConfigured()) {
      toast.info('Saved on this device', { duration: 2500 })
    } else {
      try {
        await supabase.from('reminder_completions').insert({
          reminder_id: reminder.id,
          patient_id: reminder.patientId,
          status: 'done',
        } as never)
      } catch {
        // Already queued
      }
    }
  }, [])

  const markTaken = useCallback(async (reminder: LocalReminder) => {
    setStatuses((prev) => ({ ...prev, [reminder.id]: 'done' }))

    await reminderRepository.addCompletion({
      id: crypto.randomUUID(),
      reminderId: reminder.id,
      patientId: reminder.patientId,
      status: 'taken',
      completedAt: new Date(),
    })

    if (!navigator.onLine || !isSupabaseConfigured()) {
      toast.info('Saved on this device', { duration: 2500 })
    } else {
      try {
        await supabase.from('reminder_completions').insert({
          reminder_id: reminder.id,
          patient_id: reminder.patientId,
          status: 'taken',
        } as never)
      } catch {
        // Already queued
      }
    }
  }, [])

  const markLater = useCallback((reminderId: string) => {
    setStatuses((prev) => ({ ...prev, [reminderId]: 'later' }))
    toast.info(t('remind_later'))
  }, [t])

  return (
    <div className="patient-ui flex min-h-screen flex-col bg-background">
      <main className="flex flex-1 flex-col px-6 pt-8 pb-24">
        <button
          onClick={() => navigate('/patient')}
          className="mb-6 flex h-12 w-fit items-center gap-2 rounded-lg px-2 text-base text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          {t('back')}
        </button>

        <header className="mb-8">
          <h1 className="mb-1 text-[2.25rem] font-bold text-foreground sm:text-[2.5rem]">
            {t('my_reminders')}
          </h1>
          <p className="text-lg text-muted-foreground">
            {t('reminders_instruction')}
          </p>
          {isOfflineCache && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <WifiOff className="h-4 w-4" />
              {t('offline_cached')}
            </p>
          )}
        </header>

        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-lg text-muted-foreground">{t('loading')}</p>
          </div>
        ) : reminders.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <Bell className="mb-4 h-12 w-12 text-muted-foreground/50" aria-hidden="true" />
            <p className="text-lg text-muted-foreground">{t('no_reminders')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reminders.map((reminder) => {
              const status = statuses[reminder.id] ?? 'pending'
              const config = getConfig(reminder.reminderType)
              const Icon = config.icon

              return (
                <article
                  key={reminder.id}
                  className={`rounded-xl border border-border bg-card p-5 transition-opacity ${
                    status !== 'pending' ? 'opacity-50' : ''
                  }`}
                  aria-label={reminder.title}
                >
                  <div className="flex items-start gap-4">
                    {/* Type icon */}
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-foreground">{reminder.title}</h3>
                      <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <span className="font-medium">{t(config.labelKey)}</span>
                        </span>
                        {reminder.scheduledTime && (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-4 w-4" aria-hidden="true" />
                            {reminder.scheduledTime}
                          </span>
                        )}
                        {!reminder.synced && (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-500">
                            <WifiOff className="h-3.5 w-3.5" />
                            {t('queued_for_sync')}
                          </span>
                        )}
                      </div>
                      {reminder.description && (
                        <p className="mt-1 text-sm text-muted-foreground">{reminder.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex gap-3">
                    {status === 'pending' ? (
                      <>
                        {reminder.reminderType === 'medicine' ? (
                          <button
                            onClick={() => markTaken(reminder)}
                            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors duration-150 hover:bg-primary/90 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                          >
                            <Check className="h-4 w-4" aria-hidden="true" />
                            {t('taken')}
                          </button>
                        ) : (
                          <button
                            onClick={() => markDone(reminder)}
                            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors duration-150 hover:bg-primary/90 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                          >
                            <Check className="h-4 w-4" aria-hidden="true" />
                            {t('done')}
                          </button>
                        )}

                        <button
                          onClick={() => markLater(reminder.id)}
                          className="flex h-12 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        >
                          <Timer className="h-4 w-4" aria-hidden="true" />
                          {t('remind_later')}
                        </button>
                      </>
                    ) : (
                      <div className="flex h-12 items-center gap-2 text-sm font-medium text-success">
                        <Check className="h-5 w-5" aria-hidden="true" />
                        <span>{status === 'done' ? t('done') : t('remind_later')}</span>
                      </div>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </main>

      <PatientBottomNav />
    </div>
  )
}
