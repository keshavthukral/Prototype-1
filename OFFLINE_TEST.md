# Offline-First Testing Guide

This document describes how to verify that BrainBuddy works fully offline after initial load, and that data syncs when connectivity returns.

## Architecture

BrainBuddy uses an **offline-first** architecture:

- **Dexie (IndexedDB)** — all data lives here first. Reads and writes always succeed, even offline.
- **Sync Queue** — every mutation (game session, reminder completion, memory) is queued in IndexedDB.
- **Sync Service** — when online, the queue is pushed to Supabase. The queue is the source of truth.
- **Service Worker (PWA)** — caches the app shell (HTML, JS, CSS, assets) for offline reload. Does NOT cache API responses.

## Prerequisites

1. Build the production bundle: `npm run build`
2. Serve it locally: `npx serve dist -p 3000`
3. Open `http://localhost:3000` in Chrome
4. Complete one full session online (add a reminder, add a memory, play both games) so data exists in IndexedDB
5. Use the **DEV** button (bottom-right corner) to simulate going offline

## Test Steps

### 1. App shell opens offline

1. Load the app online once so the service worker registers
2. Open Chrome DevTools → Application → Service Workers → verify "activated and is running"
3. Click the **DEV** button → **Go Offline**
4. Press F5 / Cmd+R to reload the page
5. **Expected**: The app loads from cache. No blank screen, no network error.

### 2. Patient Home works offline

1. With DEV set to offline, navigate to Patient Home (`/patient`)
2. **Expected**: Greeting loads, buttons are visible, "Saved on this device" pill appears

### 3. Memory Game works offline

1. From Patient Home, tap "Let's Play Today"
2. Complete the Memory Game (3 rounds)
3. After the final result screen, **Expected**: Toast says "Score saved on this device"
4. Check DevTools → Application → IndexedDB → `BrainBuddyOffline` → `gameSessions` — the session record exists

### 4. Pattern Game works offline

1. From the Memory Game result, tap "Continue to Pattern & Attention"
2. Complete the Pattern Game (5 questions)
3. After the final result screen, **Expected**: Toast says "Score saved on this device"
4. Check IndexedDB → `gameSessions` — a second session record exists

### 5. Existing reminders are readable offline

1. Navigate to `/patient/reminders`
2. **Expected**: Previously created reminders load from IndexedDB
3. If there's a "Viewing cached data" indicator, that's correct behavior

### 6. Cached memories are readable offline

1. Navigate to `/patient/memories`
2. **Expected**: Previously created memories load from IndexedDB with photos (if cached)
3. Prev/Next navigation works

### 7. Completing a game offline writes to IndexedDB

1. Play any game offline
2. After completion, open DevTools → Application → IndexedDB → `BrainBuddyOffline` → `gameSessions`
3. **Expected**: A new row exists with `synced: false`
4. Check `syncQueue` table — a pending item exists for `game_sessions`

### 8. Reminder completion offline writes locally

1. Navigate to `/patient/reminders` (offline)
2. Tap "Done" on a reminder
3. **Expected**: Toast says "Saved on this device"
4. Check IndexedDB → `reminderCompletions` — the completion record exists
5. Check `syncQueue` — a pending item exists for `reminder_completions`

### 9. Offline mutations show "Saved on this device"

1. Complete any offline action (game, reminder)
2. **Expected**: A Sonner toast appears with "Score saved on this device" or "Saved on this device"
3. The toast auto-dismisses after 3 seconds

### 10. Sync flow when connectivity returns

1. With pending items in the sync queue (from steps 7-8), click **DEV** → **Restore Online**
2. **Expected**:
   - The SyncStatusIndicator in the sidebar/patient home changes from "Saved on this device" to "Syncing…"
   - After a few seconds, it changes to "Synced"
   - The sync queue table in IndexedDB is emptied
   - Check Supabase dashboard — the records appear in the remote tables

## SyncStatusIndicator States

The component shows one of four states:

| State | Visual | When |
|-------|--------|------|
| Online | Green dot + "Online" | Connected, no pending items |
| Offline | Amber icon + "Saved on this device" or "N pending" | No connectivity |
| Syncing | Blue spinner + "Syncing…" | Pushing queue to Supabase |
| Synced | Green check + "Synced" | Queue pushed successfully (brief, 3s) |

## DEV Network Toggle

The amber **DEV** button in the bottom-right corner:

- Only appears in development mode (`import.meta.env.DEV`)
- Never appears in production builds
- Simulates offline by dispatching `window.offline` / `window.online` events
- All data operations continue to work — they just don't reach the network

## What Does NOT Work Offline

- Login / authentication (requires Supabase Auth)
- Creating new patients via the Supabase RPC
- Image upload to Supabase Storage (photos queue for later upload)
- Pulling remote changes (requires network)

## Data Flow Diagram

```
User Action
    ↓
Dexie (IndexedDB) ← always succeeds
    ↓
Sync Queue (IndexedDB) ← always succeeds
    ↓ (when online)
Sync Service → Supabase REST API
    ↓
Queue item deleted
```

## Troubleshooting

**"Service Worker not registered"**: Make sure you're serving from `dist/`, not running `vite dev`. The SW only works over HTTPS or localhost.

**"Sync never completes"**: Check DevTools → Network tab. If the Supabase URL is unreachable, the sync service retries with exponential backoff.

**"DEV button not visible"**: You're in production mode. The toggle is gated by `import.meta.env.DEV`.

**"IndexedDB is empty"**: You need to complete at least one session while online first, so data exists to test offline reads.
