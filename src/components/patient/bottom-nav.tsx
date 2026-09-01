import { useNavigate, useLocation } from 'react-router-dom'
import { useLanguage } from '@/lib/i18n/language-context'
import { Home, Brain, Bell, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { path: '/patient', icon: Home, labelKey: 'home' },
  { path: '/patient/games', icon: Brain, labelKey: 'games' },
  { path: '/patient/reminders', icon: Bell, labelKey: 'reminders' },
  { path: '/patient/memories', icon: BookOpen, labelKey: 'memories' },
]

export function PatientBottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useLanguage()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-white/95 backdrop-blur-sm"
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
              {/* Active indicator dot */}
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
      {/* Safe area padding for iOS */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  )
}
