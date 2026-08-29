import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useLanguage } from '@/lib/i18n/language-context'
import { Bell } from 'lucide-react'

export function RemindersPage() {
  const navigate = useNavigate()
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-background p-4 patient-ui">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/patient')}
            className="mb-4"
          >
            ← {t('back')}
          </Button>
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <Bell className="mr-3 h-8 w-8 text-primary" />
            {t('reminders')}
          </h1>
        </div>

        {/* Reminders Content Placeholder */}
        <Card>
          <CardContent className="p-8 text-center">
            <Bell className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-lg text-muted-foreground">
              {t('no_reminders')}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
