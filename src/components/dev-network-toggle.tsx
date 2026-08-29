import { useState } from 'react'
import { WifiOff, Wifi, X } from 'lucide-react'

/**
 * DEV ONLY — Network simulation toggle for offline testing.
 *
 * This component is ONLY rendered when VITE_DEV_MODE is set.
 * It intercepts `navigator.onLine` and fires the browser's
 * online/offline events to simulate connectivity changes.
 *
 * NEVER ship this to production. The build guard (`import.meta.env.DEV`)
 * prevents it from appearing in production bundles.
 */
export function DevNetworkToggle() {
  // Only render in development mode
  if (!import.meta.env.DEV) return null

  const [simulatedOffline, setSimulatedOffline] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const toggleNetwork = () => {
    if (simulatedOffline) {
      setSimulatedOffline(false)
      window.dispatchEvent(new Event('online'))
    } else {
      setSimulatedOffline(true)
      window.dispatchEvent(new Event('offline'))
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      {expanded ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
              DEV ONLY
            </span>
            <button
              onClick={() => setExpanded(false)}
              className="cursor-pointer rounded p-0.5 text-amber-600 transition-colors duration-150 hover:bg-amber-100 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
              aria-label="Close network controls"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="mb-2 text-[10px] text-amber-600">
            Simulate network conditions for offline testing.
          </p>
          <button
            onClick={toggleNetwork}
            className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors duration-150 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 ${
              simulatedOffline
                ? 'bg-amber-600 text-white hover:bg-amber-700'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            {simulatedOffline ? (
              <>
                <Wifi className="h-3.5 w-3.5" />
                Restore Online
              </>
            ) : (
              <>
                <WifiOff className="h-3.5 w-3.5" />
                Go Offline
              </>
            )}
          </button>
          <p className="mt-1.5 text-center text-[10px] text-amber-500">
            Status: {simulatedOffline ? 'OFFLINE (simulated)' : 'Online'}
          </p>
        </div>
      ) : (
        <button
          onClick={() => setExpanded(true)}
          className={`flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider shadow-lg transition-colors duration-150 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 ${
            simulatedOffline
              ? 'bg-amber-500 text-white hover:bg-amber-600'
              : 'bg-amber-100 text-amber-700 hover:bg-amber-200 ring-1 ring-amber-300'
          }`}
          title="DEV ONLY: Network simulation toggle"
        >
          {simulatedOffline ? <WifiOff className="h-3 w-3" /> : <Wifi className="h-3 w-3" />}
          DEV
        </button>
      )}
    </div>
  )
}
