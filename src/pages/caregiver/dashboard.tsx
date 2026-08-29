import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useLanguage } from '@/lib/i18n/language-context'
import { useAuth } from '@/lib/supabase/auth-context'
import { useCaregiverData, useLinkedPatientId } from '@/lib/hooks/use-caregiver-data'
import { SidebarLayout } from '@/components/caregiver/sidebar-layout'
import {
  Bell,
  BookOpen,
  ArrowRight,
  Pill,
  Droplets,
  Footprints,
  Clock,
  Gamepad2,
  RefreshCw,
  AlertCircle,
  Plus,
  PhoneCall,
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

const activityIcon: Record<string, typeof Gamepad2> = {
  game: Gamepad2,
  reminder: Bell,
  memory: BookOpen,
}

// =====================================================
// Loading skeleton
// =====================================================

function DashboardSkeleton() {
  return (
    <div className="px-6 py-6 lg:px-8 max-w-[1200px]">
      <Skeleton className="h-5 w-32 mb-6" />

      {/* Top metrics skeleton */}
      <div className="mb-6 flex items-center gap-8 border-b border-border pb-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i}>
            <Skeleton className="h-3 w-20 mb-2" />
            <Skeleton className="h-6 w-14" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        <div className="space-y-6">
          <Card className="rounded-xl">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-36" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[220px] w-full rounded" />
            </CardContent>
          </Card>
          <Card className="rounded-xl">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-28" />
            </CardHeader>
            <CardContent>
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 py-3">
                  <Skeleton className="h-7 w-7 rounded-md" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card className="rounded-xl">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-28" />
            </CardHeader>
            <CardContent>
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 py-3">
                  <Skeleton className="h-7 w-7 rounded-md" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-36 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// =====================================================
// Empty state component
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
      <p className="mt-1 text-xs text-muted-foreground max-w-[240px]">{description}</p>
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
// Main Dashboard
// =====================================================

export function CaregiverDashboardPage() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { user } = useAuth()
  const patientId = useLinkedPatientId(user?.id ?? null)
  const data = useCaregiverData(patientId)

  // Loading
  if (data.isLoading) {
    return (
      <SidebarLayout>
        <DashboardSkeleton />
      </SidebarLayout>
    )
  }

  // Error
  if (data.error) {
    return (
      <SidebarLayout>
        <div className="px-6 py-6 lg:px-8">
          <ErrorState message={data.error} onRetry={data.refresh} />
        </div>
      </SidebarLayout>
    )
  }

  // Compute summary values
  const completedReminders = data.reminders.filter((r) => r.todayCompleted).length
  const totalReminders = data.reminders.length
  const todayMemorySessions = data.todaySessions.filter((s) => s.gameType === 'memory')
  const todayPatternSessions = data.todaySessions.filter((s) => s.gameType === 'pattern')
  const totalTodaySessions = data.todaySessions.length

  // Chart data
  const chartData = (() => {
    const memoryByDate = new Map<string, number[]>()
    const patternByDate = new Map<string, number[]>()

    data.memorySessions.forEach((s) => {
      const key = s.completedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      if (!memoryByDate.has(key)) memoryByDate.set(key, [])
      memoryByDate.get(key)!.push(s.accuracy)
    })

    data.patternSessions.forEach((s) => {
      const key = s.completedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      if (!patternByDate.has(key)) patternByDate.set(key, [])
      patternByDate.get(key)!.push(s.accuracy)
    })

    const allDates = new Set([...memoryByDate.keys(), ...patternByDate.keys()])
    const sorted = Array.from(allDates).sort((a, b) => {
      const da = new Date(a)
      const db = new Date(b)
      return da.getTime() - db.getTime()
    })

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

  const hasChartData = chartData.length > 0

  return (
    <SidebarLayout>
      <div className="px-6 py-6 lg:px-8 max-w-[1200px]">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-foreground tracking-tight">
            {t('overview')}
          </h1>
          {data.patient && (
            <p className="mt-1 text-sm text-muted-foreground">
              {t('patient_name_label')}: {data.patient.name}
            </p>
          )}
        </div>

        {/* Top metrics — inline */}
        <div className="mb-6 flex flex-wrap items-center gap-6 sm:gap-8 border-b border-border pb-5">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              {t('today_summary')}
            </p>
            <p className="mt-1 text-2xl font-semibold text-foreground tabular-nums">
              {totalTodaySessions > 0
                ? `${totalTodaySessions} ${t('sessions_today')}`
                : t('no_sessions_today')}
            </p>
          </div>
          <div className="h-8 w-px bg-border hidden sm:block" />
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              {t('reminder_completion')}
            </p>
            <p className="mt-1 text-2xl font-semibold text-foreground tabular-nums">
              {totalReminders > 0 ? `${completedReminders}/${totalReminders}` : '\u2014'}
            </p>
          </div>
          <div className="h-8 w-px bg-border hidden sm:block" />
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              {t('memory_performance')}
            </p>
            <p className="mt-1 text-2xl font-semibold text-foreground tabular-nums">
              {todayMemorySessions.length > 0
                ? `${Math.round(todayMemorySessions.reduce((a, s) => a + s.accuracy, 0) / todayMemorySessions.length)}%`
                : '\u2014'}
            </p>
          </div>
          <div className="h-8 w-px bg-border hidden sm:block" />
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              {t('attention_performance')}
            </p>
            <p className="mt-1 text-2xl font-semibold text-foreground tabular-nums">
              {todayPatternSessions.length > 0
                ? `${Math.round(todayPatternSessions.reduce((a, s) => a + s.accuracy, 0) / todayPatternSessions.length)}%`
                : '\u2014'}
            </p>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          {/* Left: Chart + Recent Activity */}
          <div className="space-y-6">
            {/* Performance history chart */}
            <Card className="rounded-xl">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-medium">
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
                  <>
                    <div className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={chartData}
                          margin={{ top: 8, right: 12, left: -20, bottom: 0 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e2e8f0"
                            vertical={false}
                          />
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
                    <p className="mt-2 text-[10px] text-muted-foreground italic">
                      {t('performance_history_desc')}
                    </p>
                  </>
                ) : (
                  <EmptyState
                    icon={Gamepad2}
                    title={t('no_sessions')}
                    description={t('no_sessions_desc')}
                  />
                )}
              </CardContent>
            </Card>

            {/* Activity feed */}
            <Card className="rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('activity_feed')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.activityFeed.length > 0 ? (
                  <div className="space-y-0">
                    {data.activityFeed.map((item, i) => {
                      const Icon = activityIcon[item.icon] || Gamepad2
                      return (
                        <div key={item.id}>
                          {i > 0 && <Separator />}
                          <div className="flex items-start gap-3 py-3">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted mt-0.5">
                              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-foreground leading-tight">
                                {item.title}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {item.subtitle}
                              </p>
                            </div>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap mt-0.5">
                              {formatTimeAgo(item.timestamp, t)}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <EmptyState
                    icon={Gamepad2}
                    title={t('no_activity')}
                    description={t('no_activity_desc')}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right column: Reminders + Quick actions */}
          <div className="space-y-6">
            {data.supportRequests.filter((request) => request.status === 'pending').map((request) => (
              <Card key={request.id} className="rounded-xl border-primary/40">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary"><PhoneCall aria-hidden="true" /></div>
                    <div><CardTitle className="text-sm font-semibold">Contact requested</CardTitle><p className="mt-0.5 text-xs font-medium text-primary">High-priority support</p></div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-base font-semibold text-foreground">{data.patient?.name ?? 'Anita'} requested contact.</p>
                  <p className="mt-2 text-xs text-muted-foreground">{request.requestedAt.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">This is a support request. It is not automatically classified as a medical emergency.</p>
                </CardContent>
              </Card>
            ))}

            {/* Today's reminders */}
            <Card className="rounded-xl">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    {t('reminder_completion')}
                  </CardTitle>
                  {totalReminders > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {completedReminders}/{totalReminders}
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
                          <div className="flex items-center gap-3 py-3">
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

            {/* Quick actions */}
            <Card className="rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('quick_actions')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <button
                    onClick={() => navigate('/caregiver/reminders/new')}
                    className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-border px-4 py-3 text-sm font-medium text-foreground transition-colors duration-150 hover:border-primary/30 hover:bg-muted active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    <span className="flex items-center gap-2.5">
                      <Bell className="h-4 w-4 text-muted-foreground" />
                      {t('add_reminder')}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => navigate('/caregiver/memories/new')}
                    className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-border px-4 py-3 text-sm font-medium text-foreground transition-colors duration-150 hover:border-primary/30 hover:bg-muted active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    <span className="flex items-center gap-2.5">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      {t('add_memory')}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => navigate('/caregiver/patient')}
                    className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-border px-4 py-3 text-sm font-medium text-foreground transition-colors duration-150 hover:border-primary/30 hover:bg-muted active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    <span className="flex items-center gap-2.5">
                      <Gamepad2 className="h-4 w-4 text-muted-foreground" />
                      {t('patient_details')}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </SidebarLayout>
  )
}
