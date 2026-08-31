/**
 * GameErrorBoundary — Catches runtime errors during game sessions.
 *
 * Development: shows diagnostic details.
 * Production: shows a friendly "Something went wrong" message.
 * Never shows a blank screen.
 */

import { Component, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/language-context'

interface Props {
  children: ReactNode
  /** Where to go on "Return Home" */
  homePath?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

// Inner component that uses hooks
function ErrorFallback({
  error,
  homePath,
  onRetry,
}: {
  error: Error | null
  homePath: string
  onRetry: () => void
}) {
  const navigate = useNavigate()
  const { t } = useLanguage()

  return (
    <div className="patient-ui flex min-h-screen items-center justify-center bg-background">
      <div className="flex max-w-md flex-col items-center px-6 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="size-8 text-destructive" />
        </div>

        <h1 className="mt-6 text-2xl font-bold text-foreground">
          Something went wrong with this activity.
        </h1>

        <p className="mt-3 text-base text-muted-foreground">
          Do not worry. Your progress is saved. You can try again.
        </p>

        {import.meta.env.DEV && error && (
          <pre className="mt-4 max-w-full overflow-auto rounded-lg border border-border bg-card p-4 text-left text-xs text-muted-foreground">
            {error.message}
            {error.stack && `\n\n${error.stack}`}
          </pre>
        )}

        <div className="mt-8 flex w-full flex-col gap-3">
          <Button size="lg" className="text-lg" onClick={onRetry}>
            Retry Activity
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="text-lg"
            onClick={() => navigate(homePath)}
          >
            {t('back_home')}
          </Button>
        </div>
      </div>
    </div>
  )
}

export class GameErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log for development diagnostics
    if (import.meta.env.DEV) {
      console.error('[GameErrorBoundary]', error, errorInfo)
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          homePath={this.props.homePath ?? '/patient'}
          onRetry={this.handleRetry}
        />
      )
    }
    return this.props.children
  }
}
