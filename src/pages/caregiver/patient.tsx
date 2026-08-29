import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useLanguage } from '@/lib/i18n/language-context'
import { useAuth } from '@/lib/supabase/auth-context'
import { usePatientDetail, useLinkedPatientId } from '@/lib/hooks/use-caregiver-data'
import { SidebarLayout } from '@/components/caregiver/sidebar-layout'
import {
  User,
  Bell,
  BookOpen,
  Gamepad2,
  Pill,
  Droplets,
  Footprints,
  Clock,
  RefreshCw,
  AlertCircle,
  Plus,
  TrendingUp,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

// =====================================================
// Helpers
// =====================================================

function formatTimeAgo(date: Date, t: (key: string) => string): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return t('just_now')
  if (diffMin < 60) return `${diffMin}${t('minutes_ago')}`
  if (diffHr < 24) return `${diffHr}${t('hours_ago')}`
  if (diffDay === 1) return t('yesterday')
  return `${diffDay}${t('days_ago')}`
}

const reminderTypeConfig = {
  medicine: { icon: Pill, color: 'text-blue-600', bg: 'bg-blue-50' },
  hydration: { icon: Droplets, color: 'text-sky-600', bg: 'bg-sky-50' },
  meal: { icon: Bell, color: 'text-primary', bg: 'bg-primary/10' },
  walk: { icon: Footprints, color: 'text-primary', bg: 'bg-primary/10' },
  family_call: { icon: Bell, color: 'text-primary', bg: 'bg-primary/10' },
  daily_activity: { icon: Gamepad2, color: 'text-primary', bg: 'bg-primary/10' },
}

// =====================================================
// Loading skeleton
// =====================================================

function PatientDetailSkeleton() {
  return (
    <div className="px-6 py-6 lg:px-8 max-w-[1000px]">
      <Skeleton className="h-5 w-40 mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-xl">
          <CardContent className="pt-6">
            <Skeleton className="h-4 w-24 mb-4" />
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i}>
                  <Skeleton className="h-3 w-16 mb-1.5" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="pt-6">
            <Skeleton className="h-4 w-28 mb-4" />
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i}>
                  <Skeleton className="h-3 w-16 mb-1.5" />
                  <Skeleton className="h-6 w-10" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl lg:col-span-2">
          <CardContent className="pt-6">
            <Skeleton className="h-4 w-32 mb-4" />
            <Skeleton className="h-[180px] w-full rounded" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// =====================================================
// Empty state
// =====================================================

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  onAction,
}: {
  icon: typeof Bell
  title: string
  description: string
  action?: string
  onAction?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted mb-3">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground max-w-[220px]">{description}</p>
      {action && onAction && (
        <Button variant="outline" size="sm" className="mt-3 h-8 rounded-lg text-xs" onClick={onAction}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          {action}
        </Button>
      )}
    </div>
  )
}

// =====================================================
// Error state
// =====================================================

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useLanguage()
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <AlertCircle className="h-8 w-8 text-destructive mb-3" />
      <p className="text-sm font-medium text-foreground">{t('error_loading')}</p>
      <p className="mt-1 text-xs text-muted-foreground max-w-[280px]">{message}</p>
      <Button variant="outline" size="sm" className="mt-4 h-8 rounded-lg text-xs" onClick={onRetry}>
        <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
        {t('retry_load')}
      </Button>
    </div>
  )
}

// =====================================================
// Main
// =====================================================

export function PatientDetailsPage() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { user } = useAuth()
  const patientId = useLinkedPatientId(user?.id ?? null)
  const data = usePatientDetail(patientId)

  if (data.isLoading) {
    return (
      <SidebarLayout>
        <PatientDetailSkeleton />
      </SidebarLayout>
    )
  }

  if (data.error) {
    return (
      <SidebarLayout>
        <div className="px-6 py-6 lg:px-8">
          <ErrorState message={data.error} onRetry={data.refresh} />
        </div>
      </SidebarLayout>
    )
  }

  // Chart data for engagement trends
  const chartData = (() => {
    const memoryByDate = new Map<string, number[]>()
    const patternByDate = new Map<string, number[]>()

    data.recentSessions.forEach((s) => {
      const key = s.completedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      const map = s.gameType === 'memory' ? memoryByDate : patternByDate
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(s.accuracy)
    })

    const allDates = new Set([...memoryByDate.keys(), ...patternByDate.keys()])
    const sorted = Array.from(allDates).sort((a, b) => new Date(a).getTime() - new Date(b).getTime())

    return sorted.map((date) => ({
      date,
      memory: memoryByDate.has(date)
        ? Math.round(memoryByDate.get(date)!.reduce((a, b) => a + b, 0) / memoryByDate.get(date)!.length)
        : null,
      pattern: patternByDate.has(date)
        ? Math.round(patternByDate.get(date)!.reduce((a, b) => a + b, 0) / patternByDate.get(date)!.length)
        : null,
    }))
  })()

  const completedReminders = data.reminders.filter((r) => r.todayCompleted).length
  const totalReminders = data.reminders.length
  const hasChartData = chartData.length > 0

  return (
    <SidebarLayout>
      <div className="px-6 py-6 lg:px-8 max-w-[1000px]">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground tracking-tight flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            {t('patient_details')}
          </h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-lg text-xs"
              onClick={() => navigate('/caregiver/reminders/new')}
            >
              <Bell className="h-3.5 w-3.5 mr-1.5" />
              {t('add_reminder')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-lg text-xs"
              onClick={() => navigate('/caregiver/memories/new')}
            >
              <BookOpen className="h-3.5 w-3.5 mr-1.5" />
              {t('add_memory')}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile */}
          <Card className="rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">{t('profile_label')}</CardTitle>
            </CardHeader>
            <CardContent>
              {data.patient ? (
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                      {t('name')}
                    </label>
                    <p className="mt-1 text-sm font-medium text-foreground">{data.patient.name}</p>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                      {t('language_label')}
                    </label>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {data.patient.preferredLanguage === 'as' ? t('assamese') : t('english')}
                    </p>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                      {t('member_since')}
                    </label>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {data.patient.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t('no_data')}</p>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
          <Card className="rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">{t('performance_history')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    {t('memory_performance')}
                  </label>
                  <p className="mt-1 text-2xl font-semibold text-foreground tabular-nums">
                    {data.memoryStats.sessionsPlayed > 0
                      ? `${data.memoryStats.averageAccuracy}%`
                      : '\u2014'}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {data.memoryStats.sessionsPlayed} {t('sessions_played').toLowerCase()}
                  </p>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    {t('attention_performance')}
                  </label>
                  <p className="mt-1 text-2xl font-semibold text-foreground tabular-nums">
                    {data.patternStats.sessionsPlayed > 0
                      ? `${data.patternStats.averageAccuracy}%`
                      : '\u2014'}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {data.patternStats.sessionsPlayed} {t('sessions_played').toLowerCase()}
                  </p>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    {t('memories_count')}
                  </label>
                  <p className="mt-1 text-2xl font-semibold text-foreground tabular-nums">
                    {data.memories.length || '\u2014'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Engagement trends */}
          <Card className="rounded-xl lg:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    {t('performance_history')}
                  </CardTitle>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {t('performance_history_desc')}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {hasChartData ? (
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{ top: 8, right: 12, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <Tooltip
                        contentStyle={{
                          fontSize: 12,
                          border: '1px solid #e2e8f0',
                          borderRadius: 8,
                          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                        }}
                        formatter={(value: number, name: string) => [
                          `${value}%`,
                          name === 'memory' ? t('memory_performance') : t('attention_performance'),
                        ]}
                      />
                      <Legend
                        formatter={(value) =>
                          value === 'memory' ? t('memory_performance') : t('attention_performance')
                        }
                        iconType="line"
                        iconSize={12}
                        wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="memory"
                        stroke="#0d9488"
                        strokeWidth={2}
                        dot={{ r: 3, fill: '#0d9488' }}
                        connectNulls
                        name="memory"
                      />
                      <Line
                        type="monotone"
                        dataKey="pattern"
                        stroke="#64748b"
                        strokeWidth={1.5}
                        dot={{ r: 2.5, fill: '#64748b' }}
                        strokeDasharray="4 2"
                        connectNulls
                        name="pattern"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState
                  icon={Gamepad2}
                  title={t('no_sessions')}
                  description={t('no_sessions_desc')}
                />
              )}
            </CardContent>
          </Card>

          {/* Recent sessions */}
          <Card className="rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{t('recent_sessions_label')}</CardTitle>
            </CardHeader>
            <CardContent>
              {data.recentSessions.length > 0 ? (
                <div className="space-y-0">
                  {data.recentSessions.slice(0, 6).map((session, i) => (
                    <div key={session.id}>
                      {i > 0 && <Separator />}
                      <div className="flex items-center justify-between py-2.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-[11px] font-semibold text-foreground tabular-nums">
                            {Math.round(session.accuracy)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {session.gameType === 'memory' ? t('memory_performance') : t('attention_performance')}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {t('difficulty_label')} {session.difficultyLevel} &middot; {formatTimeAgo(session.completedAt, t)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Gamepad2}
                  title={t('no_sessions')}
                  description={t('no_sessions_desc')}
                />
              )}
            </CardContent>
          </Card>

          {/* Reminders */}
          <Card className="rounded-xl">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{t('reminder_status')}</CardTitle>
                {totalReminders > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {completedReminders}/{totalReminders} {t('completed_today').toLowerCase()}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {data.reminders.length > 0 ? (
                <div className="space-y-0">
                  {data.reminders.map((r, i) => {
                    const config = reminderTypeConfig[r.reminder.reminderType]
                    const Icon = config.icon
                    return (
                      <div key={r.reminder.id}>
                        {i > 0 && <Separator />}
                        <div className="flex items-center gap-3 py-2.5">
                          <div
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
                              r.todayCompleted
                                ? 'bg-emerald-50 text-emerald-600'
                                : `${config.bg} ${config.color}`
                            }`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p
                              className={`text-sm font-medium truncate ${
                                r.todayCompleted
                                  ? 'text-muted-foreground line-through'
                                  : 'text-foreground'
                              }`}
                            >
                              {r.reminder.title}
                            </p>
                            {r.reminder.scheduledTime && (
                              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {r.reminder.scheduledTime}
                              </p>
                            )}
                          </div>
                          {r.todayCompleted && (
                            <Badge
                              variant="outline"
                              className="text-[10px] border-emerald-200 text-emerald-600 bg-emerald-50 shrink-0"
                            >
                              {t('done')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <EmptyState
                  icon={Bell}
                  title={t('no_reminders_configured')}
                  description={t('no_reminders_desc')}
                  action={t('add_reminder')}
                  onAction={() => navigate('/caregiver/reminders/new')}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </SidebarLayout>
  )
}
