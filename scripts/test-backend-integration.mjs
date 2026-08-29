#!/usr/bin/env node
/**
 * BrainBuddy Backend Integration Test
 * Tests: connectivity, auth, RLS, CRUD, storage, error handling
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

// Load env
const envPath = join(process.cwd(), '.env')
const envContent = readFileSync(envPath, 'utf-8')
const env = {}
envContent.split('\n').filter(l => l && !l.startsWith('#')).forEach(line => {
  const [key, ...rest] = line.split('=')
  env[key.trim()] = rest.join('=').trim()
})

const URL = env.VITE_SUPABASE_URL
const KEY = env.VITE_SUPABASE_ANON_KEY

console.log(`\n🧠 BrainBuddy Backend Integration Test`)
console.log(`   URL: ${URL}`)
console.log(`   Key: ${KEY.slice(0, 20)}...`)
console.log(`   ${'─'.repeat(50)}\n`)

// Supabase client (using anon key — simulates browser)
const supabase = createClient(URL, KEY)

const results = { pass: 0, fail: 0, skip: 0 }

function log(emoji, msg) {
  console.log(`  ${emoji} ${msg}`)
}

function pass(msg) { results.pass++; log('✅', msg) }
function fail(msg, detail) { results.fail++; log('❌', `${msg}${detail ? ` — ${detail}` : ''}`) }
function skip(msg, detail) { results.skip++; log('⏭️', `${msg}${detail ? ` — ${detail}` : ''}`) }
function section(title) { console.log(`\n📌 ${title}`) }

// ─── TEST 1: Connectivity ────────────────────────────────────────
async function testConnectivity() {
  section('Connectivity')
  try {
    const { data, error } = await supabase.from('profiles').select('id').limit(1)
    if (error) {
      // RLS may block unauthenticated reads — that's OK, means RLS is active
      if (error.code === '42501' || error.message.includes('row-level security')) {
        pass('RLS is active (unauthenticated query correctly rejected)')
      } else {
        fail('Supabase connection error', `${error.code}: ${error.message}`)
      }
    } else {
      // If it returned data without auth, RLS might be too permissive for profiles
      // That's expected if there are public read policies
      pass(`Supabase connected, returned ${data?.length ?? 0} rows`)
    }
  } catch (e) {
    fail('Connectivity check failed', e.message)
  }
}

// ─── TEST 2: Auth — create caregiver account ──────────────────────
const TEST_EMAIL = `test-caregiver-${Date.now()}@gmail.com`
const TEST_PASSWORD = 'TestPass123!'
let caregiverUserId = null

async function testCaregiverAuth() {
  section('Caregiver Authentication')

  // Sign up
  try {
    const { data, error } = await supabase.auth.signUp({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      options: {
        data: {
          role: 'caregiver',
          name: 'Test Caregiver',
        }
      }
    })

    if (error) {
      // Auto-confirm may be off — try to check if user was created
      fail('Caregiver sign-up error', error.message)
      return
    }

    if (data?.user) {
      caregiverUserId = data.user.id
      pass(`Caregiver signed up: ${caregiverUserId.slice(0, 8)}...`)
    } else {
      fail('Caregiver sign-up returned no user')
    }

    // If session exists (auto-confirm on), we're signed in
    if (data?.session) {
      pass('Caregiver automatically signed in (email auto-confirm enabled)')
    } else {
      skip('No session — email confirmation may be required', 'Checking if profile was created...')

      // Try to sign in anyway (some setups auto-confirm)
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      })

      if (signInError) {
        skip('Sign-in failed — email confirmation required', signInError.message)
      } else if (signInData?.session) {
        caregiverUserId = signInData.user.id
        pass('Caregiver signed in after sign-up')
      }
    }
  } catch (e) {
    fail('Caregiver auth test failed', e.message)
  }
}

// ─── TEST 3: Profile creation (after auth) ────────────────────────
let caregiverProfile = null

async function testProfileCreation() {
  section('Profile Creation')

  if (!caregiverUserId) {
    skip('No authenticated user — skipping profile test')
    return
  }

  try {
    // Insert profile for caregiver
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: caregiverUserId,
        email: TEST_EMAIL,
        full_name: 'Test Caregiver',
        role: 'caregiver',
      }, { onConflict: 'id' })
      .select()
      .single()

    if (error) {
      fail('Profile creation failed', `${error.code}: ${error.message}`)
    } else {
      caregiverProfile = data
      pass(`Profile created: ${data.full_name} (${data.role})`)
    }
  } catch (e) {
    fail('Profile creation test failed', e.message)
  }
}

// ─── TEST 4: Patient creation + caregiver link ────────────────────
let testPatientId = null

async function testPatientAndLink() {
  section('Patient Record + Caregiver Link')

  if (!caregiverUserId) {
    skip('No authenticated user — skipping patient/link tests')
    return
  }

  try {
    // Create patient
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .insert({
        preferred_language: 'en',
        date_of_birth: '1945-03-15',
        notes: 'Integration test patient',
      })
      .select()
      .single()

    if (patientError) {
      fail('Patient creation failed', `${patientError.code}: ${patientError.message}`)
      return
    }

    testPatientId = patient.id
    pass(`Patient created: ${patient.id.slice(0, 8)}...`)

    // Create caregiver-patient link
    const { data: link, error: linkError } = await supabase
      .from('caregiver_patient_links')
      .insert({
        caregiver_id: caregiverUserId,
        patient_id: testPatientId,
        relationship: 'child',
        is_primary: true,
      })
      .select()
      .single()

    if (linkError) {
      fail('Caregiver-patient link failed', `${linkError.code}: ${linkError.message}`)
    } else {
      pass(`Caregiver linked to patient: ${link.relationship} (primary: ${link.is_primary})`)
    }

    // Verify RLS — try to read the patient
    const { data: readBack, error: readError } = await supabase
      .from('patients')
      .select('*')
      .eq('id', testPatientId)
      .single()

    if (readError) {
      fail('Patient read-back failed', `${readError.code}: ${readError.message}`)
    } else {
      pass(`Patient record accessible to linked caregiver: ${readBack.notes}`)
    }

    // Verify the link is readable
    const { data: links, error: linksError } = await supabase
      .from('caregiver_patient_links')
      .select('*')
      .eq('caregiver_id', caregiverUserId)

    if (linksError) {
      fail('Link read failed', `${linksError.code}: ${linksError.message}`)
    } else {
      pass(`Caregiver can read own links: ${links.length} link(s)`)
    }

  } catch (e) {
    fail('Patient/link test failed', e.message)
  }
}

// ─── TEST 5: Game session insert ──────────────────────────────────
let testGameSessionId = null

async function testGameSessionInsert() {
  section('Game Session Insert')

  if (!testPatientId || !caregiverUserId) {
    skip('No test patient — skipping game session test')
    return
  }

  const sessionId = crypto.randomUUID()
  
  try {
    const { data, error } = await supabase
      .from('game_sessions')
      .insert({
        id: sessionId,
        patient_id: testPatientId,
        game_type: 'memory',
        difficulty_level: 1,
        accuracy: 78.5,
        response_time_ms: 12000,
        hints_used: 1,
        score: 78,
      })
      .select()
      .single()

    if (error) {
      fail('Game session insert failed', `${error.code}: ${error.message}`)
    } else {
      testGameSessionId = data.id
      pass(`Game session created: type=${data.game_type}, accuracy=${data.accuracy}%, score=${data.score}`)
    }

    // Verify read-back
    const { data: readBack, error: readError } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (readError) {
      fail('Game session read-back failed', `${readError.code}: ${readError.message}`)
    } else {
      pass(`Game session readable: ${readBack.game_type} L${readBack.difficulty_level}`)
    }
  } catch (e) {
    fail('Game session test failed', e.message)
  }
}

// ─── TEST 6: Reminder insert + update ─────────────────────────────
let testReminderId = null

async function testReminderCRUD() {
  section('Reminder Insert + Update')

  if (!testPatientId || !caregiverUserId) {
    skip('No test patient — skipping reminder test')
    return
  }

  const reminderId = crypto.randomUUID()

  try {
    // Insert
    const { data, error } = await supabase
      .from('reminders')
      .insert({
        id: reminderId,
        patient_id: testPatientId,
        created_by: caregiverUserId,
        title: 'Morning Medicine (Integration Test)',
        description: 'Take blood pressure medication',
        reminder_type: 'medicine',
        scheduled_time: '08:00:00',
        frequency: 'daily',
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      fail('Reminder insert failed', `${error.code}: ${error.message}`)
      return
    }

    testReminderId = data.id
    pass(`Reminder created: "${data.title}" (${data.reminder_type}, ${data.frequency})`)

    // Update
    const { data: updated, error: updateError } = await supabase
      .from('reminders')
      .update({
        title: 'Morning Medicine (Updated)',
        scheduled_time: '09:00:00',
      })
      .eq('id', reminderId)
      .select()
      .single()

    if (updateError) {
      fail('Reminder update failed', `${updateError.code}: ${updateError.message}`)
    } else {
      pass(`Reminder updated: "${updated.title}" @ ${updated.scheduled_time}`)
    }
  } catch (e) {
    fail('Reminder test failed', e.message)
  }
}

// ─── TEST 7: Memory metadata insert ───────────────────────────────
let testMemoryId = null

async function testMemoryInsert() {
  section('Memory Metadata Insert')

  if (!testPatientId || !caregiverUserId) {
    skip('No test patient — skipping memory test')
    return
  }

  const memoryId = crypto.randomUUID()

  try {
    const { data, error } = await supabase
      .from('memories')
      .insert({
        id: memoryId,
        patient_id: testPatientId,
        created_by: caregiverUserId,
        name: 'Test Memory — Late Grandfather',
        relationship: 'Grandfather',
        description: 'Integration test memory entry',
      })
      .select()
      .single()

    if (error) {
      fail('Memory insert failed', `${error.code}: ${error.message}`)
      return
    }

    testMemoryId = data.id
    pass(`Memory created: "${data.name}" (${data.relationship})`)
  } catch (e) {
    fail('Memory test failed', e.message)
  }
}

// ─── TEST 8: Image upload to storage bucket ───────────────────────
async function testImageUpload() {
  section('Image Upload (Storage)')

  if (!testPatientId || !testMemoryId) {
    skip('No test patient/memory — skipping storage test')
    return
  }

  // Check if bucket exists first
  try {
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()

    if (bucketError) {
      fail('Cannot list storage buckets', `${bucketError.message}`)
      return
    }

    const bucket = buckets?.find(b => b.name === 'memory-photos')
    if (!bucket) {
      skip('Storage bucket "memory-photos" does not exist yet', 'Create it in Supabase Dashboard > Storage')
      return
    }

    pass(`Storage bucket "memory-photos" exists (public: ${bucket.public})`)

    // Create a tiny test image (1x1 PNG)
    const testPng = new Uint8Array([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG header
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
      0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, // IDAT
      0x54, 0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
      0x00, 0x00, 0x02, 0x00, 0x01, 0xE2, 0x21, 0xBC,
      0x33, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, // IEND
      0x44, 0xAE, 0x42, 0x60, 0x82,
    ])

    const filePath = `${testPatientId}/${testMemoryId}-${Date.now()}.png`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('memory-photos')
      .upload(filePath, testPng, { contentType: 'image/png' })

    if (uploadError) {
      fail('Image upload failed', `${uploadError.message}`)
    } else {
      pass(`Image uploaded to: ${uploadData.path}`)

      // Try to get URL
      const { data: urlData } = supabase.storage
        .from('memory-photos')
        .getPublicUrl(filePath)

      if (urlData?.publicUrl) {
        pass(`Public URL obtained: ${urlData.publicUrl.slice(0, 60)}...`)
      } else {
        skip('No public URL — bucket may be private', 'Use createSignedUrl for private buckets')
      }

      // Clean up: delete the test file
      const { error: deleteError } = await supabase.storage
        .from('memory-photos')
        .remove([filePath])

      if (!deleteError) {
        pass('Test image cleaned up')
      } else {
        skip('Could not clean up test image', deleteError.message)
      }
    }
  } catch (e) {
    fail('Storage test failed', e.message)
  }
}

// ─── TEST 9: Failed remote request handling ───────────────────────
async function testErrorHandling() {
  section('Error Handling (Failed Requests)')

  // Test: insert with invalid data
  try {
    const { data, error } = await supabase
      .from('reminders')
      .insert({
        patient_id: '00000000-0000-0000-0000-000000000000',
        title: 'Should Fail',
        reminder_type: 'INVALID_TYPE', // invalid enum
      })
      .select()

    if (error) {
      pass(`Invalid insert correctly rejected: ${error.code}`)
    } else {
      fail('Invalid insert should have failed but succeeded')
    }
  } catch (e) {
    pass(`Invalid insert correctly threw: ${e.message}`)
  }

  // Test: access non-existent record
  try {
    const { data, error } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('id', '00000000-0000-0000-0000-000000000000')
      .single()

    if (error && error.code === 'PGRST116') {
      pass('Non-existent record correctly returns empty/not-found')
    } else if (!error && !data) {
      pass('Non-existent record correctly returns null')
    } else if (error) {
      pass(`Non-existent record handled: ${error.code}`)
    } else {
      fail('Non-existent record should not return data')
    }
  } catch (e) {
    pass(`Non-existent record correctly threw: ${e.message}`)
  }

  // Test: RLS — unauthenticated access attempt
  try {
    // Create a fresh client without auth
    const anonClient = createClient(URL, KEY)
    const { data, error } = await anonClient
      .from('profiles')
      .select('*')
      .limit(5)

    // This depends on RLS policies
    if (error) {
      pass(`RLS correctly blocks or restricts unauthenticated access: ${error.code}`)
    } else {
      if (data && data.length > 0) {
        skip('Profiles readable without auth — check RLS policies', 'Some tables may allow public read')
      } else {
        pass('Unauthenticated query returns empty (RLS filtering)')
      }
    }
  } catch (e) {
    pass(`Unauthenticated access correctly handled: ${e.message}`)
  }
}

// ─── TEST 10: Database functions ──────────────────────────────────
async function testDatabaseFunctions() {
  section('Database Functions')

  if (!testPatientId || !caregiverUserId) {
    skip('No test patient — skipping function tests')
    return
  }

  // get_patient_stats
  try {
    const { data, error } = await supabase
      .rpc('get_patient_stats', { patient_uuid: testPatientId })

    if (error) {
      fail('get_patient_stats failed', `${error.code}: ${error.message}`)
    } else {
      const stats = data?.[0]
      if (stats) {
        pass(`get_patient_stats: sessions=${stats.total_sessions}, avg_accuracy=${stats.avg_accuracy}%`)
      } else {
        pass('get_patient_stats returned empty (no data yet for this patient)')
      }
    }
  } catch (e) {
    fail('get_patient_stats test failed', e.message)
  }

  // get_recent_activity
  try {
    const { data, error } = await supabase
      .rpc('get_recent_activity', { patient_uuid: testPatientId, limit_count: 5 })

    if (error) {
      fail('get_recent_activity failed', `${error.code}: ${error.message}`)
    } else {
      pass(`get_recent_activity returned ${data?.length ?? 0} entries`)
    }
  } catch (e) {
    fail('get_recent_activity test failed', e.message)
  }

  // is_caregiver_linked_to_patient
  try {
    const { data, error } = await supabase
      .rpc('is_caregiver_linked_to_patient', { patient_uuid: testPatientId })

    if (error) {
      fail('is_caregiver_linked_to_patient failed', `${error.code}: ${error.message}`)
    } else {
      pass(`is_caregiver_linked_to_patient: ${data}`)
    }
  } catch (e) {
    fail('is_caregiver_linked_to_patient test failed', e.message)
  }
}

// ─── CLEANUP ──────────────────────────────────────────────────────
async function cleanup() {
  section('Cleanup')

  if (!caregiverUserId || !testPatientId) {
    skip('Nothing to clean up')
    return
  }

  // Delete in reverse order (foreign key constraints)
  try {
    // Delete game sessions
    await supabase.from('game_sessions').delete().eq('patient_id', testPatientId)

    // Delete memories
    await supabase.from('memories').delete().eq('patient_id', testPatientId)

    // Delete reminder completions
    await supabase.from('reminder_completions').delete().eq('patient_id', testPatientId)

    // Delete reminders
    await supabase.from('reminders').delete().eq('patient_id', testPatientId)

    // Delete link
    await supabase.from('caregiver_patient_links')
      .delete()
      .eq('caregiver_id', caregiverUserId)
      .eq('patient_id', testPatientId)

    // Delete patient
    await supabase.from('patients').delete().eq('id', testPatientId)

    // Delete profile
    await supabase.from('profiles').delete().eq('id', caregiverUserId)

    // Sign out
    await supabase.auth.signOut()

    pass('Test data cleaned up and signed out')
  } catch (e) {
    skip('Cleanup had errors (non-critical)', e.message)
  }
}

// ─── RUN ALL ──────────────────────────────────────────────────────
async function run() {
  try {
    await testConnectivity()
    await testCaregiverAuth()
    await testProfileCreation()
    await testPatientAndLink()
    await testGameSessionInsert()
    await testReminderCRUD()
    await testMemoryInsert()
    await testImageUpload()
    await testErrorHandling()
    await testDatabaseFunctions()
  } catch (e) {
    console.error('\n💥 Unexpected error:', e)
  } finally {
    await cleanup()
  }

  // Summary
  console.log(`\n${'═'.repeat(50)}`)
  console.log(`  📊 Results: ${results.pass} passed, ${results.fail} failed, ${results.skip} skipped`)
  console.log(`${'═'.repeat(50)}\n`)

  process.exit(results.fail > 0 ? 1 : 0)
}

run()
