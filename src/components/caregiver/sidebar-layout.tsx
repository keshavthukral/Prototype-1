import { ReactNode, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useLanguage } from '@/lib/i18n/language-context'
import { useAuth } from '@/lib/supabase/auth-context'
import { SyncStatusIndicator } from '@/components/ui/sync-status'
import {
  LayoutDashboard,
  User,
  Bell,
  BookOpen,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarLayoutProps {
  children: ReactNode
}

const navItems = [
  { key: 'dashboard', path: '/caregiver/dashboard', icon: LayoutDashboard },
  { key: 'patient_details', path: '/caregiver/patient', icon: User },
  { key: 'add_reminder', path: '/caregiver/reminders/new', icon: Bell },
  { key: 'add_memory', path: '/caregiver/memories/new', icon: BookOpen },
] as const

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useLanguage()
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const sidebarContent = (
    <>
      {/* Brand */}
      <div className="px-5 pt-5 pb-4">
        <h1 className="text-base font-semibold text-foreground tracking-tight">
          {t('app_name')}
        </h1>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {t('caregiver_portal')}
        </p>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3">
        <ul className="space-y-0.5">
          {navItems.map(({ key, path, icon: Icon }) => {
            const isActive = location.pathname === path
            return (
              <li key={path}>
                <button
                  onClick={() => {
                    navigate(path)
                    setMobileOpen(false)
                  }}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {t(key)}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Sync status */}
      <div className="mx-4 mb-2">
        <SyncStatusIndicator />
      </div>

      {/* User section */}
      <div className="border-t border-border px-4 py-4">
        <div className="mb-3">
          <p className="text-sm font-medium text-foreground leading-tight">
            {user?.name || 'User'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {user?.email || ''}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-foreground h-8 px-2 rounded-lg"
          onClick={() => {
            logout()
            navigate('/')
          }}
        >
          <LogOut className="mr-2 h-3.5 w-3.5" />
          {t('logout')}
        </Button>
      </div>
    </>
  )

  return (
    <div className="flex min-h-screen bg-background caregiver-ui">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 flex-col border-r border-border bg-card">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-border bg-card transition-transform duration-200 lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="absolute right-3 top-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        {sidebarContent}
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-auto">
        {/* Mobile header */}
        <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>
          <h1 className="text-sm font-semibold text-foreground">
            {t('app_name')}
          </h1>
        </header>

        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}
