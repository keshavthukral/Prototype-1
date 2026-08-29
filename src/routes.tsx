import { Routes, Route, Navigate } from 'react-router-dom'
import { RoleSelectionPage } from '@/pages/shared/role-selection'
import { PatientHomePage } from '@/pages/patient/home'
import { GameSelectionPage } from '@/pages/patient/game-selection'
import { MemoryGamePage } from '@/pages/patient/memory-game'
import { PatternGamePage } from '@/pages/patient/pattern-game'
import { RemindersPage } from '@/pages/patient/reminders'
import { MemoriesPage } from '@/pages/patient/memories'
import { CaregiverLoginPage } from '@/pages/caregiver/login'
import { CaregiverDashboardPage } from '@/pages/caregiver/dashboard'
import { PatientDetailsPage } from '@/pages/caregiver/patient'
import { AddReminderPage } from '@/pages/caregiver/add-reminder'
import { AddMemoryPage } from '@/pages/caregiver/add-memory'

export function AppRoutes() {
  return (
    <Routes>
      {/* Root - Role Selection */}
      <Route path="/" element={<RoleSelectionPage />} />

      {/* Patient Routes */}
      <Route path="/patient" element={<PatientHomePage />} />
      <Route path="/patient/game" element={<GameSelectionPage />} />
      <Route path="/patient/game/memory" element={<MemoryGamePage />} />
      <Route path="/patient/game/pattern" element={<PatternGamePage />} />
      <Route path="/patient/reminders" element={<RemindersPage />} />
      <Route path="/patient/memories" element={<MemoriesPage />} />

      {/* Caregiver Routes */}
      <Route path="/caregiver/login" element={<CaregiverLoginPage />} />
      <Route path="/caregiver/dashboard" element={<CaregiverDashboardPage />} />
      <Route path="/caregiver/patient" element={<PatientDetailsPage />} />
      <Route path="/caregiver/reminders/new" element={<AddReminderPage />} />
      <Route path="/caregiver/memories/new" element={<AddMemoryPage />} />

      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
