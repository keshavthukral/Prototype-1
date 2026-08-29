import { useNavigate, useLocation } from 'react-router-dom'
import { useLanguage } from '@/lib/i18n/language-context'
import { Home, Gamepad2, Bell, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { path: '/patient', icon: Home, labelKey: 'home', labelFallback: 'Home' },
  { path: '/patient/games', icon: Gamepad2, labelKey: 'start_activity', labelFallback: 'Games' },
  { path: '/patient/reminders', icon: Bell, labelKey: 'my_reminders', labelFallback: 'Reminders' },
  { path: '/patient/memories', icon: BookOpen, labelKey: 'my_memories', labelFallback: 'Memories' },
]

export function PatientBottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useLanguage()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex max-w-lg items-stretch">
        {navItems.map(({ path, icon: Icon, labelKey, labelFallback }) => {
          const isActive = location.pathname === path ||
            (path !== '/patient' && location.pathname.startsWith(path))

          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-3 px-2',
                'min-h-[64px] justify-center',
                'transition-colors duration-150',
                'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="h-6 w-6" strokeWidth={isActive ? 2.5 : 2} />
              <span className={cn(
                'text-sm font-medium leading-tight',
                isActive && 'font-semibold'
              )}>
                {t(labelKey) || labelFallback}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
