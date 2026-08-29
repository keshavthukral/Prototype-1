import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useLanguage } from '@/lib/i18n/language-context'
import { Grid3X3 } from 'lucide-react'

export function PatternGamePage() {
  const navigate = useNavigate()
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-background p-4 patient-ui">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/patient/game')}
            className="mb-4"
          >
            ← {t('back')}
          </Button>
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <Grid3X3 className="mr-3 h-8 w-8 text-primary" />
            {t('pattern_game')}
          </h1>
        </div>

        {/* Game Content Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              {t('what_comes_next')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg text-muted-foreground">
              Game implementation coming soon...
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
