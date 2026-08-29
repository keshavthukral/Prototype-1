# Implementation Plan

## Phase 1: Project Setup (Day 1)

### 1.1 Initialize Project
- Create Vite React TypeScript project
- Install dependencies: Tailwind CSS, shadcn/ui, Dexie.js, Supabase, Recharts
- Configure Tailwind with design tokens from DESIGN.md
- Set up shadcn/ui with custom theme

### 1.2 Core Infrastructure
- Set up Supabase client and types
- Configure Dexie.js database schema
- Implement i18n system with English/Assamese strings
- Create auth context and hooks
- Set up sync queue system

### 1.3 PWA Configuration
- Add vite-plugin-pwa
- Configure service worker for offline support
- Set up manifest.json
- Test offline app shell loading

## Phase 2: Patient Interface (Days 2-3)

### 2.1 Language Selection
- Simple language picker (English/Assamese)
- Store preference in local storage
- Redirect to home after selection

### 2.2 Patient Home
- Friendly greeting with patient name
- 4 large navigation buttons:
  - Start Today's Activity
  - My Memories
  - My Reminders
  - Voice button
- Online/offline status indicator
- Bottom navigation (3 items max)

### 2.3 Memory Game
- Display objects (3-6 based on difficulty)
- Hide objects after delay
- Selection interface with large touch targets
- Score calculation (accuracy, time, hints)
- Adaptive difficulty feedback

### 2.4 Pattern Game
- Visual sequence display
- Next item selection
- Score calculation
- Difficulty progression

### 2.5 Reminders
- List view with status indicators
- Mark as taken/done
- Remind later option
- Simple, clear interface

### 2.6 Memory Book
- Browse family photos and memories
- Large images with captions
- Simple navigation

## Phase 3: Caregiver Dashboard (Days 3-4)

### 3.1 Authentication
- Login/register forms
- Role-based routing
- Session persistence

### 3.2 Dashboard Layout
- Sidebar navigation
- Main content area
- Patient selector

### 3.3 Dashboard Features
- Today's activities summary
- Game performance charts (Recharts)
- Reminder completion stats
- Recent activity feed
- Patient details section

### 3.4 Management Pages
- Add/edit reminders
- Add/edit memory entries
- Patient settings

## Phase 4: Offline & Sync (Days 4-5)

### 4.1 Offline Operations
- IndexedDB writes for all patient actions
- Queue sync operations
- Service worker caching

### 4.2 Sync System
- Background sync when online
- Conflict resolution
- Retry logic with backoff
- Sync status indicators

### 4.3 Data Management
- Local data cleanup
- Image caching
- Performance optimization

## Phase 5: Polish & Testing (Day 5)

### 5.1 Accessibility
- Keyboard navigation
- Screen reader testing
- High contrast support
- Focus management

### 5.2 Testing
- Manual testing on devices
- Offline functionality
- Sync reliability
- Performance on low-end devices

### 5.3 Documentation
- Update README
- Deployment instructions
- User guide

## Missing Dependencies

**Required:**
- `vite-plugin-pwa` - PWA support
- `@supabase/supabase-js` - Supabase client
- `dexie` - IndexedDB wrapper
- `recharts` - Charts for dashboard
- `react-router-dom` - Routing
- `react-helmet-async` - Meta tags for PWA

**shadcn/ui Components Needed:**
- Button, Card, Input, Label
- Dialog, Sheet, Tabs
- Progress, Badge
- Table, DataGrid
- Form, Select
- Avatar, DropdownMenu
- Toast, Alert

## Implementation Risks

### High Risk
1. **Offline Sync Complexity**: Conflict resolution and retry logic can be complex
2. **Assamese Voice Support**: Browser voice synthesis may have limited Assamese support
3. **PWA Configuration**: Service worker caching strategies need careful testing

### Medium Risk
4. **Adaptive Difficulty**: Getting the algorithm right for meaningful progression
5. **Performance on Low-End Devices**: IndexedDB and React rendering optimization
6. **Supabase RLS Policies**: Correct access control for patient/caregiver data

### Low Risk
7. **i18n Management**: String organization and future BHASHINI compatibility
8. **Design System Consistency**: Maintaining tokens across patient/caregiver interfaces
9. **Image Caching**: Memory book photos offline storage and compression

## Technical Decisions

1. **State Management**: React Context + local state (avoid Redux complexity)
2. **Data Fetching**: Supabase queries with optimistic updates
3. **Styling**: Tailwind CSS with shadcn/ui components
4. **Routing**: React Router v6 with role-based guards
5. **Forms**: React Hook Form with Zod validation
6. **Charts**: Recharts with responsive containers

## Success Criteria

- [ ] Patient can complete games offline
- [ ] Caregiver can see activity when online
- [ ] Sync works reliably
- [ ] Interface is accessible and simple
- [ ] No medical claims or diagnostic functionality
- [ ] Works on low-end Android devices
- [ ] Assamese language support works
- [ ] Voice instructions work (with fallback)
