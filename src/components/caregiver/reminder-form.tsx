import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useLanguage } from '@/lib/i18n/language-context'
import { useAuth } from '@/lib/supabase/auth-context'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'
import { reminderRepository } from '@/lib/repositories/reminder'
import { SidebarLayout } from '@/components/caregiver/sidebar-layout'
import { Bell, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

interface PatientOption {
  id: string
  name: string
}

type ReminderType = 'medicine' | 'hydration' | 'activity'
type ReminderFrequency = 'daily' | 'weekly' | 'as_needed'

interface FormErrors {
  patientId?: string
  title?: string
}

export function ReminderForm() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { user } = useAuth()

  const [patients, setPatients] = useState<PatientOption[]>([])
  const [patientsLoading, setPatientsLoading] = useState(true)

  const [patientId, setPatientId] = useState('')
  const [title, setTitle] = useState('')
  const [type, setType] = useState<ReminderType>('activity')
  const [time, setTime] = useState('')
  const [frequency, setFrequency] = useState<ReminderFrequency>('daily')
  const [errors, setErrors] = useState<FormErrors>({})
  const [saving, setSaving] = useState(false)

  // Fetch linked patients
  useEffect(() => {
    const fetchPatients = async () => {
      setPatientsLoading(true)

      if (isSupabaseConfigured() && user) {
        try {
          const { data: links } = await supabase
            .from('caregiver_patient_links')
            .select('patient_id, patients(id, preferred_language)')
            .eq('caregiver_id', user.id)

          if (links && links.length > 0) {
            const mapped = links.map((link: Record<string, unknown>) => {
              const patient = link.patients as Record<string, unknown> | null
              return {
                id: link.patient_id as string,
                name: patient
                  ? `Patient ${String(patient.id).slice(0, 8)}`
                  : `Patient ${String(link.patient_id).slice(0, 8)}`,
              }
            })
            setPatients(mapped)
          } else {
            setPatients([{ id: user.id, name: 'My Patient' }])
          }
        } catch {
          setPatients([{ id: user.id, name: 'My Patient' }])
        }
      } else {
        setPatients([{ id: 'demo-patient-1', name: 'Demo Patient' }])
      }

      setPatientsLoading(false)
    }

    fetchPatients()
  }, [user])

  const validate = (): boolean => {
    const newErrors: FormErrors = {}

    if (!patientId) {
      newErrors.patientId = t('patient_required')
    }
    if (!title.trim()) {
      newErrors.title = t('title_required')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return
    setSaving(true)

    try {
      const id = crypto.randomUUID()

      await reminderRepository.create({
        id,
        patientId,
        createdBy: user?.id,
        title: title.trim(),
        reminderType: type,
        scheduledTime: time || undefined,
        frequency,
        isActive: true,
      })

      if (isSupabaseConfigured() && navigator.onLine) {
        try {
          await supabase.from('reminders').upsert(
            {
              id,
              patient_id: patientId,
              created_by: user?.id ?? null,
              title: title.trim(),
              reminder_type: type,
              scheduled_time: time || null,
              frequency,
              is_active: true,
            } as never,
            { onConflict: 'id' }
          )
        } catch {
          // Already queued for sync
        }
      }

      if (!navigator.onLine || !isSupabaseConfigured()) {
        toast.info(t('offline_saved_locally'))
      } else {
        toast.success(t('reminder_saved'))
      }

      navigate('/caregiver/dashboard')
    } catch (error) {
      console.error('Failed to save reminder:', error)
      toast.error(t('save_failed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <SidebarLayout>
      <div className="px-8 py-6 max-w-[700px]">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-foreground tracking-tight flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            {t('add_reminder')}
          </h1>
        </div>

        <Card className="rounded-xl">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* Patient Selection */}
              <div className="space-y-1.5">
                <Label htmlFor="patient" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('select_patient')}
                </Label>
                {patientsLoading ? (
                  <div className="flex h-10 items-center rounded-lg border border-input bg-background px-3 text-sm text-muted-foreground">
                    {t('loading')}
                  </div>
                ) : patients.length === 0 ? (
                  <div className="flex h-10 items-center rounded-lg border border-input bg-background px-3 text-sm text-muted-foreground">
                    {t('no_patients_linked')}
                  </div>
                ) : (
                  <Select
                    value={patientId}
                    onValueChange={(val) => {
                      setPatientId(val)
                      if (errors.patientId) setErrors((prev) => ({ ...prev, patientId: undefined }))
                    }}
                  >
                    <SelectTrigger id="patient" aria-label={t('select_patient')} className="h-10 rounded-lg">
                      <SelectValue placeholder={t('select_patient')} />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {errors.patientId && (
                  <p className="text-xs text-destructive">{errors.patientId}</p>
                )}
              </div>

              {/* Reminder Type */}
              <div className="space-y-1.5">
                <Label htmlFor="type" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('reminder_type_label')}
                </Label>
                <Select
                  value={type}
                  onValueChange={(val) => setType(val as ReminderType)}
                >
                  <SelectTrigger id="type" aria-label={t('reminder_type_label')} className="h-10 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="medicine">{t('medicine')}</SelectItem>
                    <SelectItem value="hydration">{t('hydration')}</SelectItem>
                    <SelectItem value="activity">{t('activity_type')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('reminder_title')}
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value)
                    if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }))
                  }}
                  placeholder={t('reminder_title_placeholder')}
                  aria-invalid={!!errors.title}
                  aria-describedby={errors.title ? 'title-error' : undefined}
                  className="h-10 rounded-lg"
                />
                {errors.title && (
                  <p id="title-error" className="text-xs text-destructive">{errors.title}</p>
                )}
              </div>

              {/* Time */}
              <div className="space-y-1.5">
                <Label htmlFor="time" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('reminder_time')}
                </Label>
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="h-10 rounded-lg"
                />
              </div>

              {/* Frequency */}
              <div className="space-y-1.5">
                <Label htmlFor="frequency" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('reminder_frequency')}
                </Label>
                <Select
                  value={frequency}
                  onValueChange={(val) => setFrequency(val as ReminderFrequency)}
                >
                  <SelectTrigger id="frequency" aria-label={t('reminder_frequency')} className="h-10 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">{t('frequency_daily')}</SelectItem>
                    <SelectItem value="weekly">{t('frequency_weekly')}</SelectItem>
                    <SelectItem value="as_needed">{t('frequency_as_needed')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Medical Disclaimer */}
              <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <div className="text-xs text-amber-800">
                  <p className="font-medium">{t('no_dosage_recommendations')}</p>
                  <p className="mt-0.5">{t('medical_disclaimer')}</p>
                </div>
              </div>

              {/* Submit */}
              <Button type="submit" className="w-full h-10 rounded-lg" disabled={saving}>
                {saving ? t('loading') : t('save')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  )
}
