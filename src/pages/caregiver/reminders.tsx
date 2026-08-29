import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { Bell, Pencil, Plus, Power, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SidebarLayout } from '@/components/caregiver/sidebar-layout'
import { db } from '@/lib/db/database'
import { reminderRepository } from '@/lib/repositories/reminder'

export function CaregiverRemindersPage() {
  const navigate = useNavigate(); const reminders = useLiveQuery(() => db.reminders.toArray(), []) ?? []
  const toggle = async (id: string, active: boolean) => { await reminderRepository.update(id, { isActive: !active }); toast.success(active ? 'Reminder disabled' : 'Reminder enabled') }
  const remove = async (id: string) => { if (!window.confirm('Delete this reminder?')) return; await reminderRepository.delete(id); toast.success('Reminder deleted') }
  return <SidebarLayout><div className="px-6 py-8"><div className="flex items-center justify-between gap-4"><div><h1 className="text-2xl font-bold text-foreground">Reminders</h1><p className="mt-1 text-sm text-muted-foreground">Create and manage patient reminders.</p></div><Button onClick={() => navigate('/caregiver/reminders/new')}><Plus data-icon="inline-start" />Create Reminder</Button></div><Card className="mt-6"><CardHeader><CardTitle>All reminders</CardTitle></CardHeader><CardContent className="flex flex-col gap-3">{reminders.map((item) => <div key={item.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-border p-4"><div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Bell className="size-5" /></div><div className="min-w-48 flex-1"><p className={`font-semibold ${item.isActive ? 'text-foreground' : 'text-muted-foreground line-through'}`}>{item.title}</p><p className="text-sm text-muted-foreground">{item.scheduledTime} · {item.frequency.replace('_',' ')}</p></div><Button variant="outline" size="sm" onClick={() => navigate(`/caregiver/reminders/${item.id}/edit`)}><Pencil data-icon="inline-start" />Edit</Button><Button variant="outline" size="sm" onClick={() => void toggle(item.id,item.isActive)}><Power data-icon="inline-start" />{item.isActive ? 'Disable' : 'Enable'}</Button><Button variant="destructive" size="sm" onClick={() => void remove(item.id)}><Trash2 data-icon="inline-start" />Delete</Button></div>)}{!reminders.length && <p className="py-8 text-center text-muted-foreground">No reminders configured.</p>}</CardContent></Card></div></SidebarLayout>
}
