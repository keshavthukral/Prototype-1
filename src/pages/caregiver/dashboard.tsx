import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useLanguage } from '@/lib/i18n/language-context'
import { useAuth } from '@/lib/supabase/auth-context'
import { Badge } from '@/components/ui/badge'
import { 
  LayoutDashboard, 
  User, 
  Bell, 
  BookOpen, 
  LogOut,
  TrendingUp,
  Clock,
  CheckCircle2
} from 'lucide-react'

export function CaregiverDashboardPage() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { user, logout } = useAuth()

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
              <LayoutDashboard className="mr-2 h-4 w-4" />
              {t('dashboard')}
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => navigate('/caregiver/patient')}
            >
              <User className="mr-2 h-4 w-4" />
              {t('patient_details')}
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => navigate('/caregiver/reminders/new')}
            >
              <Bell className="mr-2 h-4 w-4" />
              {t('add_reminder')}
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => navigate('/caregiver/memories/new')}
            >
              <BookOpen className="mr-2 h-4 w-4" />
              {t('add_memory')}
            </Button>
          </nav>

          <div className="mt-auto pt-8">
            <div className="mb-4 text-sm">
              <p className="font-medium">{user?.name}</p>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                logout()
                navigate('/')
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {t('logout')}
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground">
              {t('dashboard')}
            </h2>
            <p className="text-muted-foreground">
              Overview of patient activity and progress
            </p>
          </div>

          {/* Stats Cards */}
          <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('today_activities')}
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-muted-foreground">
                  Games completed today
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('memory_performance')}
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">78%</div>
                <p className="text-xs text-muted-foreground">
                  Average accuracy
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('attention_performance')}
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">82%</div>
                <p className="text-xs text-muted-foreground">
                  Pattern accuracy
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('reminder_completion')}
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">5/6</div>
                <p className="text-xs text-muted-foreground">
                  Reminders completed
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>{t('recent_activity')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <p className="font-medium">Memory Game Completed</p>
                    <p className="text-sm text-muted-foreground">Score: 85%</p>
                  </div>
                  <Badge variant="success">Completed</Badge>
                </div>
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <p className="font-medium">Medicine Reminder</p>
                    <p className="text-sm text-muted-foreground">Taken</p>
                  </div>
                  <Badge variant="success">Done</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Pattern Game</p>
                    <p className="text-sm text-muted-foreground">In progress</p>
                  </div>
                  <Badge variant="warning">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
