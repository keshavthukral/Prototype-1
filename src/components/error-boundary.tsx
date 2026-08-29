import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  private handleReload = () => {
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <div className="w-full max-w-md text-center">
            <div className="mb-6 text-6xl">⚠️</div>
            <h1 className="mb-4 text-2xl font-bold text-foreground">
              Something went wrong
            </h1>
            <p className="mb-6 text-muted-foreground">
              We encountered an unexpected error. Please try again.
            </p>
            {this.state.error && (
              <div className="mb-6 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-left">
                <p className="text-sm font-medium text-destructive">
                  Error details:
                </p>
                <p className="mt-1 text-sm text-destructive/80">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <div className="flex justify-center gap-4">
              <Button variant="outline" className="h-10 rounded-lg" onClick={this.handleRetry}>
                Try Again
              </Button>
              <Button className="h-10 rounded-lg" onClick={this.handleReload}>
                Reload Page
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
