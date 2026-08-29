import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useLanguage } from '@/lib/i18n/language-context'
import { User, ArrowLeft } from 'lucide-react'

export function PatientDetailsPage() {
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
              <User className="mr-3 h-8 w-8 text-primary" />
              {t('patient_details')}
            </h2>
          </div>

          {/* Patient Info */}
          <Card>
            <CardHeader>
              <CardTitle>Patient Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Name
                  </label>
                  <p className="text-lg">Patient Name</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Language
                  </label>
                  <p className="text-lg">English</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Account Created
                  </label>
                  <p className="text-lg">August 29, 2026</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
