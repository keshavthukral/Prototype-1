import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useLanguage } from '@/lib/i18n/language-context'

export function RoleSelectionPage() {
  const navigate = useNavigate()
  const { t } = useLanguage()

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-foreground">
            {t('app_name')}
          </h1>
          <p className="text-muted-foreground">
            {t('select_role')}
          </p>
        </div>

        <div className="space-y-4">
          <Card className="cursor-pointer transition-colors hover:bg-accent/50 rounded-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">{t('i_am_patient')}</CardTitle>
              <CardDescription>
                Access your activities, games, and memories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full h-11 rounded-lg"
                size="lg"
                onClick={() => navigate('/patient/language')}
              >
                {t('i_am_patient')}
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer transition-colors hover:bg-accent/50 rounded-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">{t('i_am_caregiver')}</CardTitle>
              <CardDescription>
                Monitor progress and manage care
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full h-11 rounded-lg"
                variant="outline"
                size="lg"
                onClick={() => navigate('/caregiver/login')}
              >
                {t('i_am_caregiver')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
