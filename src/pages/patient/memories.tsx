import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useLanguage } from '@/lib/i18n/language-context'
import { BookOpen } from 'lucide-react'

export function MemoriesPage() {
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
            <BookOpen className="mr-3 h-8 w-8 text-primary" />
            {t('memory_book')}
          </h1>
        </div>

        {/* Memories Content Placeholder */}
        <Card>
          <CardContent className="p-8 text-center">
            <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-lg text-muted-foreground">
              {t('no_memories')}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
