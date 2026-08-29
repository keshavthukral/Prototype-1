import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLanguage } from '@/lib/i18n/language-context'
import { BookOpen, ArrowLeft } from 'lucide-react'

export function AddMemoryPage() {
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
              <BookOpen className="mr-3 h-8 w-8 text-primary" />
              {t('add_memory')}
            </h2>
          </div>

          {/* Add Memory Form */}
          <Card>
            <CardHeader>
              <CardTitle>Add Memory Entry</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('name')}</Label>
                  <Input id="name" placeholder="e.g., Grandma" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="relationship">{t('relationship')}</Label>
                  <Input id="relationship" placeholder="e.g., Grandmother" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">{t('description')}</Label>
                  <textarea
                    id="description"
                    rows={4}
                    className="flex w-full rounded-lg border border-input bg-background px-4 py-3 text-base placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="A short memory or description..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="photo">{t('photo')}</Label>
                  <Input id="photo" type="file" accept="image/*" />
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
