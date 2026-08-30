import { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/lib/supabase/auth-context'
import { LanguageProvider } from '@/lib/i18n/language-context'
import { SyncProvider } from '@/lib/sync/sync-context'
import { AppRoutes } from '@/routes'
import { ErrorBoundary } from '@/components/error-boundary'
import { DevNetworkToggle } from '@/components/dev-network-toggle'
import { seedDemoData } from '@/lib/demo/seed'
import { PageReader } from '@/components/patient/page-reader'

function App() {
  // Seed demo data on first load (idempotent, no-op if already seeded or Supabase configured)
  useEffect(() => {
    seedDemoData()
  }, [])
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <LanguageProvider>
          <AuthProvider>
            <SyncProvider>
              <AppRoutes />
              <PageReader />
              <Toaster position="top-center" richColors />
              <DevNetworkToggle />
            </SyncProvider>
          </AuthProvider>
        </LanguageProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
