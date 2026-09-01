import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, Check, Clock, Droplets, Apple, Footprints, Gamepad2, Phone, Pill, Timer, WifiOff, Bell } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/supabase/auth-context'
import { useLanguage } from '@/lib/i18n/language-context'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { db, type LocalReminder } from '@/lib/db/database'
import { reminderRepository } from '@/lib/repositories/reminder'
import { cn } from '@/lib/utils'

const icons = { medicine: Pill, hydration: Droplets, meal: Apple, walk: Footprints, family_call: Phone, daily_activity: Gamepad2 }
const labelKeys = { medicine: 'medicine', hydration: 'hydration', meal: 'meal', walk: 'walk', family_call: 'family_call', daily_activity: 'daily_activity' } as const
const formatTime = (value: string | undefined, language: 'en' | 'as') => value ? new Intl.DateTimeFormat(language === 'as' ? 'as-IN' : 'en-IN', { hour: 'numeric', minute: '2-digit' }).format(new Date(2000, 0, 1, Number(value.split(':')[0]), Number(value.split(':')[1]))) : ''

export function RemindersPage() {
  const { user } = useAuth()
  const { language, t } = useLanguage()
  const [now, setNow] = useState(Date.now())
  const [snoozeId, setSnoozeId] = useState<string | null>(null)
  const [optimistic, setOptimistic] = useState<Set<string>>(new Set())
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 30_000); return () => window.clearInterval(timer) }, [])
  const allReminders = useLiveQuery(() => user ? db.reminders.where('patientId').equals(user.id).and((item) => item.isActive).sortBy('scheduledTime') : [], [user?.id]) ?? []
  const completions = useLiveQuery(() => user ? db.reminderCompletions.where('patientId').equals(user.id).toArray() : [], [user?.id]) ?? []
  const start = new Date(); start.setHours(0, 0, 0, 0)
  const completedIds = useMemo(() => new Set([...completions.filter((item) => item.completedAt >= start && (item.status === 'taken' || item.status === 'done')).map((item) => item.reminderId), ...optimistic]), [completions, optimistic])
  const previouslyCompleted = useMemo(() => new Set(completions.filter((item) => item.status === 'taken' || item.status === 'done').map((item) => item.reminderId)), [completions])
  const shown = allReminders.filter((item) => item.frequency === 'daily' || (item.frequency === 'specific_days' && item.specificDays?.includes(new Date(now).getDay())) || (item.frequency === 'once' && (!previouslyCompleted.has(item.id) || completedIds.has(item.id))))

  const complete = async (reminder: LocalReminder) => {
    setOptimistic((items) => new Set(items).add(reminder.id)); setSnoozeId(null)
    try { await reminderRepository.complete(reminder, reminder.reminderType === 'medicine' ? 'taken' : 'done'); toast.success(t('completed_mark')) }
    catch { setOptimistic((items) => { const next = new Set(items); next.delete(reminder.id); return next }); toast.error(t('reminder_update_failed')) }
  }
  const snooze = async (reminder: LocalReminder, minutes: number) => {
    setSnoozeId(null)
    try { await reminderRepository.snooze(reminder, minutes); setNow(Date.now()); toast.success(t('reminder_saved_later')) }
    catch { toast.error(t('reminder_update_failed')) }
  }

  return (
    <main id="main-content" className="patient-content mx-auto flex w-full flex-col gap-7 px-5 pt-6 pb-8 sm:px-8 lg:px-12 lg:pt-8 page-enter">
      <Button asChild variant="ghost" size="sm" className="w-fit px-2">
        <Link to="/patient"><ArrowLeft data-icon="inline-start" />{t('back')}</Link>
      </Button>

      <header>
        <h1 className="text-3xl font-bold tracking-tight text-foreground lg:text-4xl">{t('reminders_title')}</h1>
        <p className="mt-1.5 text-base text-muted-foreground">{t('reminders_prepared')}</p>
        {(!navigator.onLine || !isSupabaseConfigured()) && (
          <p className="mt-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <WifiOff className="size-4" />{t('works_offline')}
          </p>
        )}
      </header>

      <ReminderSection
        title={t('today')}
        empty={t('no_pending_reminders')}
        reminders={shown.filter((item) => !completedIds.has(item.id))}
        now={now} language={language} snoozeId={snoozeId}
        onComplete={complete} onSnoozeOpen={setSnoozeId} onSnooze={snooze}
      />
      <ReminderSection
        title={t('completed')}
        empty={t('no_completed_reminders')}
        reminders={shown.filter((item) => completedIds.has(item.id))}
        now={now} language={language} completed snoozeId={snoozeId}
        onComplete={complete} onSnoozeOpen={setSnoozeId} onSnooze={snooze}
      />
    </main>
  )
}

function ReminderSection({ title, empty, reminders, now, language, completed, snoozeId, onComplete, onSnoozeOpen, onSnooze }: { title: string; empty: string; reminders: LocalReminder[]; now: number; language: 'en' | 'as'; completed?: boolean; snoozeId: string | null; onComplete: (item: LocalReminder) => void; onSnoozeOpen: (id: string | null) => void; onSnooze: (item: LocalReminder, minutes: number) => void }) {
  const { t } = useLanguage()
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      {reminders.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <Bell className="mx-auto mb-2 size-8 text-muted-foreground/40" aria-hidden="true" />
          <p className="text-base text-muted-foreground">{empty}</p>
        </div>
      ) : (
        reminders.map((item) => {
          const Icon = icons[item.reminderType]
          const snoozed = Boolean(item.snoozedUntil && new Date(item.snoozedUntil).getTime() > now)
          const titleText = language === 'as' ? item.titleAs ?? item.title : item.title
          return (
            <article
              key={item.id}
              className={cn(
                'rounded-2xl border border-border bg-card p-5',
                completed && 'opacity-60'
              )}
            >
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  {completed ? <Check className="reminder-check size-6" /> : <Icon className="size-6" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 text-primary" />
                    <span className="text-sm font-semibold text-primary">{formatTime(item.scheduledTime, language)}</span>
                  </div>
                  <h3 className="mt-1 text-lg font-bold text-foreground">{titleText}</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">{t(labelKeys[item.reminderType])}</p>
                </div>
              </div>

              {snoozed ? (
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-secondary px-4 py-3">
                  <Timer className="size-5 text-primary shrink-0" />
                  <span className="text-sm font-semibold text-foreground">
                    {t('remind_again_at').replace('{time}', formatTime(new Date(item.snoozedUntil!).toTimeString().slice(0, 5), language))}
                  </span>
                </div>
              ) : !completed ? (
                <div className="mt-4">
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button size="lg" className="flex-1 text-base" onClick={() => onComplete(item)} aria-label={`${item.reminderType === 'medicine' ? t('taken') : t('done')}: ${titleText}`}>
                      <Check data-icon="inline-start" aria-hidden="true" />
                      {item.reminderType === 'medicine' ? t('taken') : t('done')}
                    </Button>
                    <Button size="lg" variant="outline" className="flex-1 text-base" onClick={() => onSnoozeOpen(snoozeId === item.id ? null : item.id)} aria-label={`${t('remind_me_later')}: ${titleText}`}>
                      <Timer data-icon="inline-start" aria-hidden="true" />
                      {t('remind_me_later')}
                    </Button>
                  </div>
                  {snoozeId === item.id && (
                    <div className="mt-3 rounded-xl border border-border bg-secondary p-4">
                      <p className="mb-3 text-sm font-semibold text-foreground">{t('remind_in')}</p>
                      <div className="grid grid-cols-3 gap-2">
                        {([10, 30, 60] as const).map((minutes) => (
                          <Button key={minutes} variant="outline" size="sm" onClick={() => onSnooze(item, minutes)}>
                            {minutes === 60 ? t('one_hour') : t('minutes').replace('{count}', String(minutes))}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </article>
          )
        })
      )}
    </section>
  )
}
