import { useSync } from '@/lib/sync/sync-context'
import { useLanguage } from '@/lib/i18n/language-context'
import { Wifi, WifiOff, Loader2, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Reusable sync/connectivity status indicator.
 *
 * States:
 *  - Online: green dot + "Online"
 *  - Offline: amber icon + "Saved on this device"
 *  - Syncing: spinner + "Syncing…"
 *  - Synced: check + "Synced"
 *  - Error: amber icon + "Sync failed"
 *
 * Use `variant` to switch between a compact pill (default) and a banner style.
 */
export function SyncStatusIndicator({
  variant = 'pill',
  className,
}: {
  variant?: 'pill' | 'banner'
  className?: string
}) {
  const { status, isOnline, pendingCount, mode } = useSync()
  const { t } = useLanguage()

  // Demo mode: no sync needed
  if (mode === 'demo') return null

  let icon: React.ReactNode
  let label: string

  if (status === 'syncing') {
    icon = <Loader2 className="h-3 w-3 animate-spin" />
    label = t('syncing')
  } else if (status === 'complete') {
    icon = <CheckCircle2 className="h-3 w-3" />
    label = t('sync_complete')
  } else if (status === 'error') {
    icon = <WifiOff className="h-3 w-3" />
    label = t('sync_failed')
  } else if (!isOnline) {
    icon = <WifiOff className="h-3 w-3" />
    label = pendingCount > 0
      ? `${pendingCount} ${t('pending_sync')}`
      : t('offline_saved_device')
  } else {
    icon = <Wifi className="h-3 w-3" />
    label = pendingCount > 0
      ? `${pendingCount} ${t('pending_sync')}`
      : t('online')
  }

  if (variant === 'banner') {
    return (
      <div
        role="status"
        aria-live="polite"
        className={cn(
          'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium',
          !isOnline && 'border-amber-200 bg-amber-50 text-amber-700',
          isOnline && status === 'syncing' && 'border-blue-200 bg-blue-50 text-blue-700',
          isOnline && status === 'complete' && 'border-emerald-200 bg-emerald-50 text-emerald-700',
          isOnline && status === 'idle' && 'border-border bg-muted/50 text-muted-foreground',
          className
        )}
      >
        {icon}
        <span>{label}</span>
      </div>
    )
  }

  // Pill variant (compact)
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium',
        !isOnline && 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
        isOnline && status === 'syncing' && 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
        isOnline && status === 'complete' && 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
        isOnline && status === 'idle' && 'bg-muted text-muted-foreground ring-1 ring-border',
        className
      )}
    >
      {icon}
      <span>{label}</span>
    </div>
  )
}
