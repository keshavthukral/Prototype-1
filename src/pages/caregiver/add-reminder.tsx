import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLanguage } from '@/lib/i18n/language-context'
import { Bell, ArrowLeft } from 'lucide-react'

export function AddReminderPage() {
  const navigate = useNavigate()
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-background caregiver-ui">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-card p-4">
          <div className="mb-8">
            <h1 className="text-xl font-bold text-foreground">
              {t('app_name')}
            </h1>
            <p className="text-sm text-muted-foreground">{t('dashboard')}</p>
          </div>

          <nav className="space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => navigate('/caregiver/dashboard')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('back')}
            </Button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground flex items-center">
              <Bell className="mr-3 h-8 w-8 text-primary" />
              {t('add_reminder')}
            </h2>
          </div>

          {/* Add Reminder Form */}
          <Card>
            <CardHeader>
              <CardTitle>Create New Reminder</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Reminder Title</Label>
                  <Input id="title" placeholder="e.g., Take medicine" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Reminder Type</Label>
                  <select
                    id="type"
                    className="flex h-12 w-full rounded-lg border border-input bg-background px-4 py-3 text-base"
                  >
                    <option value="medicine">{t('medicine')}</option>
                    <option value="hydration">{t('hydration')}</option>
                    <option value="activity">{t('activity')}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Input id="time" type="time" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency</Label>
                  <select
                    id="frequency"
                    className="flex h-12 w-full rounded-lg border border-input bg-background px-4 py-3 text-base"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <Button type="submit" className="w-full">
                  {t('save')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
