# Architecture

## Project Structure

```
src/
  components/
    ui/                    # shadcn/ui components (tailored to product)
    patient/               # Patient-specific components
    caregiver/             # Caregiver-specific components
    games/                 # Game components
    reminders/             # Reminder components
    memories/              # Memory book components
  features/
    patient/               # Patient feature logic
    caregiver/             # Caregiver feature logic
    games/                 # Game logic (memory, pattern)
    reminders/             # Reminder management
    memories/              # Memory book management
  pages/
    patient/               # Patient pages/routes
    caregiver/             # Caregiver pages/routes
    shared/                # Shared pages (login, language)
  lib/
    supabase/              # Supabase client, queries, types
    db/                    # Dexie.js database, schemas, migrations
    sync/                  # Sync queue, conflict resolution
    i18n/                  # Internationalization (English, Assamese)
    adaptive/              # Adaptive difficulty engine
    voice/                 # Speech synthesis helpers
  hooks/                   # Custom React hooks
  types/                   # TypeScript type definitions
  data/                    # Static data (strings, constants)
public/
  manifest.json            # PWA manifest
  sw.js                    # Service worker (or vite-plugin-pwa)
```

## Routing

**Patient Routes:**
- `/` - Language selection (first visit) or redirect to home
- `/patient/home` - Patient home with greeting and navigation
- `/patient/games/memory` - Memory game
- `/patient/games/pattern` - Pattern/attention game
- `/patient/reminders` - Reminders list
- `/patient/memories` - Memory book browser

**Caregiver Routes:**
- `/caregiver/login` - Authentication
- `/caregiver/dashboard` - Main dashboard
- `/caregiver/patient` - Patient details
- `/caregiver/reminders` - Reminder management
- `/caregiver/memories` - Memory book management

**Shared Routes:**
- `/login` - Unified login page (redirects based on role)
- `/settings` - Language/settings

## Supabase Schema

**Tables:**

```sql
-- Patients
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  preferred_language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Caregivers
CREATE TABLE caregivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Patient-Caregiver relationship
CREATE TABLE patient_caregiver (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  caregiver_id UUID REFERENCES caregivers(id) ON DELETE CASCADE,
  relationship TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(patient_id, caregiver_id)
);

-- Game Results
CREATE TABLE game_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL, -- 'memory' or 'pattern'
  score DECIMAL(5,2),
  accuracy DECIMAL(5,2),
  response_time_ms INTEGER,
  hints_used INTEGER DEFAULT 0,
  difficulty_level INTEGER DEFAULT 1,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  synced BOOLEAN DEFAULT FALSE
);

-- Reminders
CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  caregiver_id UUID REFERENCES caregivers(id),
  title TEXT NOT NULL,
  description TEXT,
  reminder_type TEXT NOT NULL, -- 'medicine', 'hydration', 'activity'
  frequency TEXT, -- 'daily', 'weekly', 'custom'
  time_of_day TIME,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reminder Completions
CREATE TABLE reminder_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reminder_id UUID REFERENCES reminders(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  status TEXT NOT NULL, -- 'taken', 'done', 'skipped', 'remind_later'
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  synced BOOLEAN DEFAULT FALSE
);

-- Memory Book Entries
CREATE TABLE memory_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  caregiver_id UUID REFERENCES caregivers(id),
  name TEXT NOT NULL,
  relationship TEXT,
  description TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity Logs (for caregiver dashboard)
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  activity_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  synced BOOLEAN DEFAULT FALSE
);
```

**Row Level Security:**
- Patients can only read/write their own data
- Caregivers can only access data for their linked patients
- Service role used for admin operations

## Dexie.js Schema (Offline Database)

```typescript
// Database schema for IndexedDB
const db = new Dexie('BrainBuddyOffline');

db.version(1).stores({
  // Local patient profile
  patientProfile: 'id, name, preferredLanguage',
  
  // Cached game results (pending sync)
  gameResults: '++localId, patientId, gameType, [patientId+gameType], syncedAt',
  
  // Cached reminders
  reminders: 'id, patientId, reminderType, isActive, syncedAt',
  
  // Reminder completions (pending sync)
  reminderCompletions: '++localId, reminderId, patientId, status, syncedAt',
  
  // Cached memory entries
  memoryEntries: 'id, patientId, name, syncedAt',
  
  // Sync queue for pending updates
  syncQueue: '++queueId, operation, table, recordId, timestamp, retryCount',
  
  // App settings and preferences
  settings: 'key, value',
  
  // Cached language strings
  languageStrings: 'key, language, value'
});
```

## Sync Strategy

**Offline-First Approach:**
1. All patient interactions write to IndexedDB first
2. Queue sync operations in syncQueue table
3. When online, process queue in FIFO order
4. Use Supabase real-time for caregiver dashboard updates

**Sync Queue Operations:**
```typescript
interface SyncQueueItem {
  queueId?: number;
  operation: 'create' | 'update' | 'delete';
  table: string;
  recordId: string;
  data?: any;
  timestamp: Date;
  retryCount: number;
  lastError?: string;
}
```

**Conflict Resolution:**
- Last-write-wins for simple updates
- Merge strategy for game results (keep highest accuracy)
- Caregiver data takes precedence for reminders/memories
- Patient can always create new records

**Sync Process:**
1. Check network status
2. Process queue items oldest first
3. Retry failed items with exponential backoff (max 5 retries)
4. Update local records with server timestamps
5. Clear successfully synced items from queue

**Background Sync:**
- Use Service Worker background sync when available
- Fallback to periodic sync when online
- Show sync status in UI (online/offline/syncing/complete)

## Authentication Strategy

**Supabase Auth:**
- Email/password for caregivers
- Magic link optional for patients
- Session persistence in localStorage
- Automatic token refresh

**Role-Based Access:**
- Caregivers: Full dashboard access, manage patients
- Patients: Limited to own data, no dashboard access
- Anonymous: Can view public pages only

**Patient Authentication:**
- Simple PIN or pattern for patient access
- Optional: Device-based authentication
- No complex passwords required

## Offline Strategy

**Service Worker:**
- Cache app shell (HTML, CSS, JS)
- Cache static assets
- Network-first for API calls
- Cache-first for static resources
- Background sync for pending updates

**IndexedDB Data Management:**
- Auto-cleanup of old synced records (keep 30 days)
- Compression of large text fields
- Image caching for memory book photos
- Indexed queries for performance

**PWA Configuration:**
- Installable on home screen
- Offline loading capability
- Push notifications (future)
- App-like experience

## Adaptive Difficulty Logic

**Rule-Based Engine:**
```typescript
interface AdaptiveInput {
  accuracy: number;        // 0-100%
  responseTimeMs: number;  // milliseconds
  hintsUsed: number;       // 0-3
  recentPerformance: number[]; // last 5 scores
}

interface AdaptiveOutput {
  difficulty: 'easier' | 'same' | 'harder';
  reasoning: string;
}

function calculateDifficulty(input: AdaptiveInput): AdaptiveOutput {
  const avgPerformance = input.recentPerformance.reduce((a, b) => a + b, 0) / 
                        Math.max(input.recentPerformance.length, 1);
  
  // Simple rule-based system
  if (input.accuracy < 50 || input.hintsUsed >= 2) {
    return { difficulty: 'easier', reasoning: 'Low accuracy or high hints used' };
  }
  
  if (input.accuracy > 80 && input.hintsUsed === 0 && avgPerformance > 75) {
    return { difficulty: 'harder', reasoning: 'Consistent high performance' };
  }
  
  return { difficulty: 'same', reasoning: 'Performance within expected range' };
}
```

**Difficulty Levels:**
- Level 1: 3 objects, 4-second display, no time limit
- Level 2: 4 objects, 3-second display, generous time limit
- Level 3: 5 objects, 2.5-second display, moderate time limit
- Level 4: 6 objects, 2-second display, strict time limit

**Non-Diagnostic Disclaimer:**
- Never present difficulty as dementia severity
- Frame as "practicing memory skills"
- No medical interpretation of results
- Results for engagement only, not assessment

## Internationalization (i18n)

**Structure:**
```typescript
// lib/i18n/strings.ts
export const strings = {
  en: {
    welcome: 'Welcome',
    startActivity: "Start Today's Activity",
    myMemories: 'My Memories',
    myReminders: 'My Reminders',
    // ... more strings
  },
  as: {
    welcome: 'স্বাগতম',
    startActivity: 'আজিৰ কাৰ্য আৰম্ভ কৰক',
    myMemories: 'মোৰ সম্ঝোৱা',
    myReminders: 'মোৰ সোমৱানি',
    // ... Assamese strings
  }
};
```

**Usage:**
- Context provider for language state
- Hook for accessing translated strings
- Local storage for language preference
- Future BHASHINI integration compatible

## Voice Support

**Speech Synthesis:**
```typescript
// lib/voice/speech.ts
export function speakText(text: string, language: string): Promise<void> {
  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'as' ? 'as-IN' : 'en-US';
    utterance.rate = 0.8; // Slower for elderly users
    utterance.onend = () => resolve();
    utterance.onerror = () => {
      // Fallback to text display
      resolve();
    };
    speechSynthesis.speak(utterance);
  });
}
```

**Fallback Strategy:**
- Check if Assamese voice available
- Fall back to text display if unavailable
- Provide replay button for instructions
- Clear audio indicators

## State Management

**React Context:**
- AuthContext: User authentication state
- LanguageContext: Current language preference
- SyncContext: Online/offline/sync status
- PatientContext: Current patient data

**Local State:**
- Game state in component state
- Form state in component state
- UI state (modals, drawers) in component state

**Data Fetching:**
- Supabase queries with React Query
- Optimistic updates for offline
- Background refetch when online

## Performance Considerations

- Lazy load routes and heavy components
- Image optimization for memory book
- IndexedDB queries with proper indexes
- Debounced sync operations
- Virtual scrolling for long lists
- Minimize re-renders with memoization

## Security

- Row Level Security in Supabase
- Input validation on client and server
- XSS protection with React's built-in escaping
- CSRF protection with Supabase tokens
- No sensitive data in localStorage
- Secure image URLs with expiration

## Testing Strategy

- Unit tests for adaptive difficulty logic
- Integration tests for sync operations
- E2E tests for critical user flows
- Accessibility testing with screen readers
- Offline functionality testing
- Performance testing on low-end devices
