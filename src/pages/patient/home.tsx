import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useLanguage } from '@/lib/i18n/language-context'
import { useAuth } from '@/lib/supabase/auth-context'
import { useSync } from '@/lib/sync/sync-context'
import { Badge } from '@/components/ui/badge'
import { Gamepad2, BookOpen, Bell, Volume2 } from 'lucide-react'

export function PatientHomePage() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { user } = useAuth()
  const { status } = useSync()

  const getStatusBadge = () => {
    switch (status) {
      case 'online':
        return <Badge variant="success">{t('online')}</Badge>
      case 'offline':
        return <Badge variant="secondary">{t('offline')}</Badge>
      case 'syncing':
        return <Badge variant="warning">{t('syncing')}</Badge>
      case 'sync_complete':
        return <Badge variant="success">{t('sync_complete')}</Badge>
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 patient-ui">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {t('welcome')}, {user?.name ?? 'Friend'}!
            </h1>
          </div>
          {getStatusBadge()}
        </div>

        {/* Main Actions */}
        <div className="space-y-4">
          <Button
            className="w-full h-20 text-xl"
            size="lg"
            onClick={() => navigate('/patient/game')}
          >
            <Gamepad2 className="mr-3 h-8 w-8" />
            {t('start_activity')}
          </Button>

          <div className="grid grid-cols-2 gap-4">
            <Card
              className="cursor-pointer transition-colors hover:bg-accent/50"
              onClick={() => navigate('/patient/memories')}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <BookOpen className="mr-2 h-6 w-6" />
                  {t('my_memories')}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card
              className="cursor-pointer transition-colors hover:bg-accent/50"
              onClick={() => navigate('/patient/reminders')}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <Bell className="mr-2 h-6 w-6" />
                  {t('my_reminders')}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Voice Button */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="flex items-center justify-center p-6">
              <Button
                variant="outline"
                size="lg"
                className="w-full h-16"
                onClick={() => {
                  // Voice replay functionality
                  const utterance = new SpeechSynthesisUtterance(
                    t('welcome') + ', ' + (user?.name ?? 'Friend')
                  )
                  utterance.rate = 0.8
                  speechSynthesis.speak(utterance)
                }}
              >
                <Volume2 className="mr-3 h-8 w-8" />
                {t('hear_again')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
