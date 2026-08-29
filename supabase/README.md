# BrainBuddy Supabase Backend

This directory contains the Supabase database schema, seed data, and configuration for the BrainBuddy application.

## Overview

BrainBuddy uses Supabase as its backend, providing:
- **PostgreSQL Database**: Normalized schema with proper relationships
- **Row Level Security (RLS)**: Fine-grained access control
- **Authentication**: Email/password for caregivers, simple access for patients
- **Storage**: Secure photo storage for memory book entries
- **Real-time**: Optional real-time updates for dashboard

## Database Schema

### Tables

| Table | Description |
|-------|-------------|
| `profiles` | User profiles extending Supabase auth.users |
| `patients` | Patient-specific data and preferences |
| `caregiver_patient_links` | Many-to-many relationship between caregivers and patients |
| `reminders` | Medicine, hydration, and activity reminders |
| `reminder_completions` | Tracking reminder status changes |
| `memories` | Memory book entries with photos |
| `game_sessions` | Game performance data (memory and pattern games) |

### Relationships

```
profiles (1) ──< patients (many)
profiles (1) ──< caregiver_patient_links (many) >── patients (1)
patients (1) ──< reminders (many)
patients (1) ──< memories (many)
patients (1) ──< game_sessions (many)
reminders (1) ──< reminder_completions (many)
```

## Security Model

### Row Level Security (RLS)

All tables have RLS enabled with policies that ensure:

1. **Caregivers can only access linked patients**
   - View patient profiles
   - Manage reminders and memories
   - View game session data

2. **Patients can only access their own data**
   - View their profile
   - View their reminders
   - View their memories
   - Create game sessions

3. **Private data is never globally readable**
   - All queries are filtered by user ID
   - No public access to patient data

### Helper Functions

- `get_user_role()`: Returns the current user's role
- `is_caregiver_linked_to_patient(UUID)`: Checks caregiver-patient relationship
- `is_patient_owner(UUID)`: Checks if user owns a patient record

## Setup Instructions

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up
2. Create a new project
3. Note your project URL and anon key

### 2. Run Schema

```bash
# Using Supabase CLI
supabase db push

# Or manually via Supabase Dashboard
# Copy contents of schema.sql into SQL Editor and run
```

### 3. Run Seed Data (Optional)

```bash
# For development/testing
# Copy contents of seed.sql into SQL Editor and run
```

### 4. Create Storage Bucket

1. Go to Storage in Supabase Dashboard
2. Create a new bucket named `memory-photos`
3. Set bucket to **private** (not public)
4. Apply storage policies from schema.sql

### 5. Configure Environment

Create `.env` file in project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Local Development

### Demo Mode

If Supabase environment variables are not configured, the app runs in **DEMO MODE**:
- All data is stored locally in IndexedDB
- No cloud sync occurs
- Clearly labeled as demo mode in the UI
- Perfect for development and testing

### Full Backend Mode

When Supabase is configured:
- Data syncs between IndexedDB and Supabase
- Caregiver dashboard shows real-time data
- Photos are stored securely in Supabase Storage

## Sync Strategy

### Offline-First

1. **Mutations always write to IndexedDB first**
2. **Sync queue tracks pending changes**
3. **When online, queue processes in FIFO order**
4. **Conflicts use `updated_at` timestamp comparison**

### Conflict Resolution

- Simple last-write-wins based on `updated_at`
- **Limitation**: Concurrent edits to same record may lose data
- **Mitigation**: For this prototype, conflicts are rare due to single-user patterns

### Sync Queue

The sync queue in Dexie tracks:
- Operation type (create/update/delete)
- Target table
- Record ID
- Timestamp
- Retry count

## Storage Structure

```
memory-photos/
  └── {patient-id}/
      ├── {memory-id}-{timestamp}.jpg
      └── {memory-id}-{timestamp}.png
```

## API Reference

### Client-Side Data Access

All Supabase queries go through the repository layer:

```typescript
import { patientRepository } from '@/lib/repositories/patient'
import { reminderRepository } from '@/lib/repositories/reminder'

// Get patient profile
const patient = await patientRepository.getById(patientId)

// Create reminder
const reminder = await reminderRepository.create({
  patientId,
  title: 'Morning Medicine',
  reminderType: 'medicine',
  scheduledTime: '08:00:00'
})
```

## Troubleshooting

### "Missing Supabase environment variables"

This means the app is running in demo mode. To enable cloud features:

1. Check `.env` file exists
2. Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
3. Restart the dev server

### "Row level security policy violation"

This usually means:
1. User is not authenticated
2. User doesn't have access to the requested resource
3. RLS policies need updating

### "Storage access denied"

Ensure:
1. Storage bucket `memory-photos` exists
2. Storage policies are applied
3. User has proper role (caregiver linked to patient)

## Next Steps

- [ ] Add real-time subscriptions for live dashboard updates
- [ ] Implement file upload progress tracking
- [ ] Add batch sync for better performance
- [ ] Implement proper conflict resolution UI
