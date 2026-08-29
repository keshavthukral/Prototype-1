import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SidebarLayout } from '@/components/caregiver/sidebar-layout'
import { useAuth } from '@/lib/supabase/auth-context'
import { isSupabaseConfigured, supabase } from '@/lib/supabase/client'
import { reminderRepository, type ReminderFrequency, type ReminderType } from '@/lib/repositories/reminder'
import { DEMO_PATIENT_ID } from '@/data/demo/patient'

const types: [ReminderType, string][] = [['medicine','Medicine'],['hydration','Hydration'],['meal','Meal'],['walk','Walk'],['family_call','Family Call'],['daily_activity','Daily Activity']]
const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

export function ReminderForm() {
  const { reminderId } = useParams(); const editing = Boolean(reminderId); const navigate = useNavigate(); const { user } = useAuth()
  const [patientId, setPatientId] = useState(''); const [title, setTitle] = useState(''); const [description, setDescription] = useState(''); const [type, setType] = useState<ReminderType>('daily_activity'); const [time, setTime] = useState(''); const [frequency, setFrequency] = useState<ReminderFrequency>('daily'); const [specificDays, setSpecificDays] = useState<number[]>([]); const [saving, setSaving] = useState(false)

  useEffect(() => { void (async () => {
    if (reminderId) { const item = await reminderRepository.getById(reminderId); if (item) { setPatientId(item.patientId); setTitle(item.title); setDescription(item.description ?? ''); setType(item.reminderType); setTime(item.scheduledTime ?? ''); setFrequency(item.frequency); setSpecificDays(item.specificDays ?? []) } return }
    if (!isSupabaseConfigured()) { setPatientId(DEMO_PATIENT_ID); return }
    if (user) { const { data } = await supabase.from('caregiver_patient_links').select('patient_id').eq('caregiver_id', user.id).limit(1); const links = data as unknown as Array<{ patient_id: string }> | null; setPatientId(links?.[0]?.patient_id ?? user.id) }
  })() }, [reminderId, user])

  const submit = async (event: React.FormEvent) => { event.preventDefault(); if (!patientId || !title.trim() || !time || (frequency === 'specific_days' && !specificDays.length)) { toast.error('Complete the required fields.'); return } setSaving(true); try { const values = { patientId, createdBy: user?.id, title: title.trim(), description: description.trim() || undefined, reminderType: type, scheduledTime: time, frequency, specificDays: frequency === 'specific_days' ? specificDays : undefined, isActive: true }; if (reminderId) await reminderRepository.update(reminderId, values); else await reminderRepository.create({ id: crypto.randomUUID(), ...values }); toast.success(editing ? 'Reminder updated' : 'Reminder created'); navigate('/caregiver/reminders') } catch { toast.error('Could not save reminder.') } finally { setSaving(false) } }

  return <SidebarLayout><div className="max-w-2xl px-6 py-8"><header className="mb-6"><h1 className="flex items-center gap-3 text-2xl font-bold text-foreground"><Bell className="size-6 text-primary" />{editing ? 'Edit Reminder' : 'Create Reminder'}</h1><p className="mt-2 text-sm text-muted-foreground">Reminder wording is entered by the caregiver. This app does not recommend medication or dosage.</p></header><Card><CardHeader><CardTitle>Reminder details</CardTitle></CardHeader><CardContent><form onSubmit={submit} className="flex flex-col gap-5"><div><Label htmlFor="type">Type</Label><Select value={type} onValueChange={(value) => setType(value as ReminderType)}><SelectTrigger id="type" className="mt-2"><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{types.map(([value,label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectGroup></SelectContent></Select></div><div><Label htmlFor="title">Title</Label><Input id="title" className="mt-2" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Evening medicine" /></div><div><Label htmlFor="description">Description (optional)</Label><Input id="description" className="mt-2" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Enter the caregiver-configured reminder text" /></div><div><Label htmlFor="time">Time</Label><Input id="time" type="time" className="mt-2" value={time} onChange={(e) => setTime(e.target.value)} /></div><div><Label htmlFor="frequency">Frequency</Label><Select value={frequency} onValueChange={(value) => setFrequency(value as ReminderFrequency)}><SelectTrigger id="frequency" className="mt-2"><SelectValue /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="once">Once</SelectItem><SelectItem value="daily">Daily</SelectItem><SelectItem value="specific_days">Specific days</SelectItem></SelectGroup></SelectContent></Select></div>{frequency === 'specific_days' && <fieldset><legend className="text-sm font-medium text-foreground">Days</legend><div className="mt-2 flex flex-wrap gap-2">{days.map((day,index) => <button key={day} type="button" aria-pressed={specificDays.includes(index)} onClick={() => setSpecificDays((values) => values.includes(index) ? values.filter((value) => value !== index) : [...values,index])} className="min-h-11 cursor-pointer rounded-lg border border-border bg-card px-3 text-sm font-medium transition-colors duration-150 hover:border-primary/40 aria-pressed:border-primary aria-pressed:bg-primary/10 aria-pressed:text-primary">{day}</button>)}</div></fieldset>}<div className="flex gap-3"><Button type="button" variant="outline" onClick={() => navigate('/caregiver/reminders')}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Reminder'}</Button></div></form></CardContent></Card></div></SidebarLayout>
}
