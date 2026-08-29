import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLanguage } from '@/lib/i18n/language-context'
import { useAuth } from '@/lib/supabase/auth-context'
import { AlertCircle, WifiOff, Loader2 } from 'lucide-react'

export function CaregiverLoginPage() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { login, isOnlineMode } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  const [isLoading, setIsLoading] = useState(false)
  const [touched, setTouched] = useState<{ email: boolean; password: boolean }>({
    email: false,
    password: false,
  })

  const validate = (): boolean => {
    const errors: { email?: string; password?: string } = {}
    if (!email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Enter a valid email address'
    }
    if (!password) {
      errors.password = 'Password is required'
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
    }
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validate()) return

    setIsLoading(true)

    try {
      const result = await login(email.trim(), password)
      if (result.error) {
        setError(result.error)
      } else {
        navigate('/caregiver/dashboard')
      }
    } catch {
      setError(t('login_error_server'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            {t('app_name')}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {t('i_am_caregiver')}
          </p>
        </div>

        <Card className="rounded-xl">
          <CardContent className="pt-6">
            {isOnlineMode ? (
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {/* Global error */}
                {error && (
                  <div className="flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t('email')}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }))
                      if (error) setError('')
                    }}
                    onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
                    placeholder={t('login_email_placeholder')}
                    autoComplete="email"
                    aria-invalid={!!fieldErrors.email}
                    aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                    disabled={isLoading}
                    className="h-10 rounded-lg"
                  />
                  {fieldErrors.email && touched.email && (
                    <p id="email-error" className="text-xs text-destructive">{fieldErrors.email}</p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t('password')}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }))
                      if (error) setError('')
                    }}
                    onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
                    placeholder={t('login_password_placeholder')}
                    autoComplete="current-password"
                    aria-invalid={!!fieldErrors.password}
                    aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                    disabled={isLoading}
                    className="h-10 rounded-lg"
                  />
                  {fieldErrors.password && touched.password && (
                    <p id="password-error" className="text-xs text-destructive">{fieldErrors.password}</p>
                  )}
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  className="w-full h-10 rounded-lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t('loading')}
                    </>
                  ) : (
                    t('login_button')
                  )}
                </Button>
              </form>
            ) : (
              /* Demo / Offline mode */
              <div className="space-y-4">
                <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <WifiOff className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">
                      Demo Mode
                    </p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      {t('login_offline_notice')}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={async () => {
                    await login('demo@demo.com', 'demo')
                    navigate('/caregiver/dashboard')
                  }}
                  className="w-full h-10 rounded-lg"
                >
                  {t('login_continue_offline')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
