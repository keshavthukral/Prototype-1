import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { assertPatientTranslationsComplete } from '@/i18n/check-completeness'

assertPatientTranslationsComplete()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
