/**
 * PatientLayout — responsive shell for all patient pages.
 *
 * Desktop (≥1024px): left sidebar navigation + main content area
 * Tablet/Mobile: bottom navigation + full-width content
 */

import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useLanguage } from '@/lib/i18n/language-context'
import { Home, Brain, Bell, BookOpen, Heart } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { path: '/patient', icon: Home, labelKey: 'home' },
  { path: '/patient/games', icon: Brain, labelKey: 'games' },
  { path: '/patient/reminders', icon: Bell, labelKey: 'reminders' },
  { path: '/patient/memories', icon: BookOpen, labelKey: 'memories' },
]

export function PatientLayout() {
  return (
    <div className="patient-ui flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <DesktopSidebar />

      {/* Main content area — fills remaining width after sidebar */}
      <div className="flex min-h-screen flex-1 flex-col pb-20 lg:ml-[260px] lg:pb-0">
        <Outlet />
      </div>

      {/* Mobile bottom nav */}
      <MobileBottomNav />
    </div>
  )
}

/* ── Desktop Sidebar ────────────────────────────────────────── */

function DesktopSidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useLanguage()

  return (
    <aside
      className="fixed inset-y-0 left-0 z-40 hidden w-[260px] flex-col border-r border-border bg-white lg:flex"
      role="navigation"
      aria-label={t('main_navigation')}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 py-5">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Heart className="size-5" aria-hidden="true" />
        </div>
        <span className="text-lg font-bold text-foreground">{t('app_name')}</span>
      </div>

      {/* Nav items */}
      <nav className="flex flex-1 flex-col gap-1 px-3 py-2" aria-label={t('main_navigation')}>
        {navItems.map(({ path, icon: Icon, labelKey }) => {
          const isActive = location.pathname === path ||
            (path !== '/patient' && location.pathname.startsWith(path))

          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={cn(
                'group flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors duration-150',
                'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring',
                isActive
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground font-medium'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Active indicator bar */}
              {isActive && (
                <span
                  className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-primary"
                  aria-hidden="true"
                />
              )}
              <Icon
                className={cn(
                  'size-5 shrink-0 transition-colors duration-150',
                  isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className="text-sm">{t(labelKey)}</span>
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border px-6 py-4">
        <p className="text-xs text-muted-foreground">Monor Xathi</p>
      </div>
    </aside>
  )
}

/* ── Mobile Bottom Nav ──────────────────────────────────────── */

function MobileBottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useLanguage()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-white/95 backdrop-blur-sm lg:hidden"
      role="navigation"
      aria-label={t('main_navigation')}
    >
      <div className="mx-auto flex max-w-lg items-stretch">
        {navItems.map(({ path, icon: Icon, labelKey }) => {
          const isActive = location.pathname === path ||
            (path !== '/patient' && location.pathname.startsWith(path))

          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={cn(
                'relative flex flex-1 cursor-pointer flex-col items-center justify-center gap-1 px-2 py-2.5',
                'min-h-[68px] transition-colors duration-150',
                'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              {isActive && (
                <span
                  className="absolute top-1.5 left-1/2 h-[3px] w-6 -translate-x-1/2 rounded-full bg-primary"
                  aria-hidden="true"
                />
              )}
              <Icon
                className={cn(
                  'h-6 w-6 transition-all duration-150',
                  isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'
                )}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <span className={cn(
                'text-xs leading-tight',
                isActive ? 'font-semibold' : 'font-medium'
              )}>
                {t(labelKey)}
              </span>
            </button>
          )
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  )
}
