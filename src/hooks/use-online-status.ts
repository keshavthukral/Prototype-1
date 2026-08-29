import { useState, useEffect } from 'react'

interface OnlineStatus {
  isOnline: boolean
  isOnlineMode: boolean // Whether Supabase is configured
  wasOffline: boolean // True if just came back online
}

export function useOnlineStatus(isSupabaseConfigured: boolean): OnlineStatus {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setWasOffline(true)
      // Reset wasOffline after a short delay
      setTimeout(() => setWasOffline(false), 3000)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setWasOffline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return {
    isOnline,
    isOnlineMode: isSupabaseConfigured,
    wasOffline,
  }
}
