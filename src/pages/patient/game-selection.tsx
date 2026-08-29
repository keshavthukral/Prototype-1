import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useLanguage } from '@/lib/i18n/language-context'
import { Brain, Grid3X3 } from 'lucide-react'

export function GameSelectionPage() {
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
          <h1 className="text-3xl font-bold text-foreground">
            {t('start_activity')}
          </h1>
        </div>

        {/* Game Options */}
        <div className="space-y-4">
          <Card
            className="cursor-pointer transition-colors hover:bg-accent/50"
            onClick={() => navigate('/patient/game/memory')}
          >
            <CardHeader>
              <CardTitle className="flex items-center text-2xl">
                <Brain className="mr-3 h-8 w-8 text-primary" />
                {t('memory_game')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {t('remember_objects')}
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer transition-colors hover:bg-accent/50"
            onClick={() => navigate('/patient/game/pattern')}
          >
            <CardHeader>
              <CardTitle className="flex items-center text-2xl">
                <Grid3X3 className="mr-3 h-8 w-8 text-primary" />
                {t('pattern_game')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {t('what_comes_next')}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
