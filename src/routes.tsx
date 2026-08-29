import { Routes, Route, Navigate } from 'react-router-dom'
import { RoleSelectionPage } from '@/pages/shared/role-selection'
import { LanguageSelectPage } from '@/pages/patient/language-select'
import { PatientHomePage } from '@/pages/patient/home'
import { ActivityPage } from '@/pages/patient/activity'
import { GameSelection } from '@/features/games/GameSelection'
import { MemoryGame } from '@/features/games/memory/MemoryGame'
import { PatternGame } from '@/features/games/pattern/PatternGame'
import { RemindersPage } from '@/pages/patient/reminders'
import { MemoriesPage } from '@/pages/patient/memories'
import { ProgressPage } from '@/pages/patient/progress'
import { CheckInPage } from '@/pages/patient/check-in'
import { HelpPage } from '@/pages/patient/help'
import { CaregiverLoginPage } from '@/pages/caregiver/login'
import { CaregiverDashboardPage } from '@/pages/caregiver/dashboard'
import { PatientDetailsPage } from '@/pages/caregiver/patient'
import { AddReminderPage } from '@/pages/caregiver/add-reminder'
import { CaregiverRemindersPage } from '@/pages/caregiver/reminders'
import { AddMemoryPage } from '@/pages/caregiver/add-memory'
import { CaregiverReportsPage } from '@/pages/caregiver/reports'

export function AppRoutes() {
  return (
    <Routes>
      {/* Root - Role Selection */}
      <Route path="/" element={<RoleSelectionPage />} />

      {/* Patient Routes */}
      <Route path="/patient/language" element={<LanguageSelectPage />} />
      <Route path="/patient" element={<PatientHomePage />} />
      <Route path="/patient/games" element={<GameSelection />} />
      <Route path="/patient/game/memory" element={<MemoryGame />} />
      <Route path="/patient/game/pattern" element={<PatternGame />} />

      {/* Legacy — daily mode flow */}
      <Route path="/patient/activity" element={<ActivityPage />} />

      <Route path="/patient/reminders" element={<RemindersPage />} />
      <Route path="/patient/memories" element={<MemoriesPage />} />
      <Route path="/patient/progress" element={<ProgressPage />} />
      <Route path="/patient/check-in" element={<CheckInPage />} />
      <Route path="/patient/help" element={<HelpPage />} />

      {/* Caregiver Routes */}
      <Route path="/caregiver/login" element={<CaregiverLoginPage />} />
      <Route path="/caregiver/dashboard" element={<CaregiverDashboardPage />} />
      <Route path="/caregiver/reports" element={<CaregiverReportsPage />} />
      <Route path="/caregiver/patient" element={<PatientDetailsPage />} />
      <Route path="/caregiver/reminders/new" element={<AddReminderPage />} />
      <Route path="/caregiver/reminders" element={<CaregiverRemindersPage />} />
      <Route path="/caregiver/reminders/:reminderId/edit" element={<AddReminderPage />} />
      <Route path="/caregiver/memories/new" element={<AddMemoryPage />} />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
