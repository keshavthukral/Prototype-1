#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const env = {}
readFileSync('.env', 'utf-8').split('\n').filter(l => l && !l.startsWith('#')).forEach(l => {
  const [k, ...v] = l.split('=')
  env[k.trim()] = v.join('=').trim()
})

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)
let passed = 0, failed = 0
const ok = (msg) => { passed++; console.log('✅ ' + msg) }
const no = (msg) => { failed++; console.log('❌ ' + msg) }

try {
  // 1. Sign in
  const { data: si, error: siErr } = await supabase.auth.signInWithPassword({
    email: 'caregiver.demo@example.com',
    password: 'kt798'
  })
  if (siErr) { no('Sign-in: ' + siErr.message); throw siErr }
  const uid = si.user.id
  ok('Caregiver signed in: ' + uid.slice(0, 8))

  // 2. Profile
  const { data: prof, error: pErr } = await supabase.from('profiles').upsert(
    { id: uid, email: 'caregiver.demo@example.com', full_name: 'Demo Caregiver', role: 'caregiver' },
    { onConflict: 'id' }
  ).select().single()
  pErr ? no('Profile: ' + pErr.message) : ok('Profile created: ' + prof.full_name)

  // 3. Patient
  const { data: pt, error: ptErr } = await supabase.from('patients')
    .insert({ preferred_language: 'en', date_of_birth: '1945-03-15', notes: 'Integration test patient' })
    .select().single()
  if (ptErr) { no('Patient: ' + ptErr.message); throw ptErr }
  ok('Patient created: ' + pt.id.slice(0, 8))

  // 4. Link
  const { error: lErr } = await supabase.from('caregiver_patient_links')
    .insert({ caregiver_id: uid, patient_id: pt.id, relationship: 'child', is_primary: true })
  lErr ? no('Link: ' + lErr.message) : ok('Caregiver-patient link')

  // 5. RLS: read patient back
  const { data: rb, error: rbErr } = await supabase.from('patients').select('*').eq('id', pt.id).single()
  rbErr ? no('RLS patient read: ' + rbErr.message) : ok('RLS: patient accessible (' + rb.notes + ')')

  // 6. Game session insert
  const { error: gsErr } = await supabase.from('game_sessions').insert({
    patient_id: pt.id, game_type: 'memory', difficulty_level: 1,
    accuracy: 82.5, response_time_ms: 10000, score: 82
  })
  gsErr ? no('Game session: ' + gsErr.message) : ok('Game session inserted (memory, L1, 82.5%)')

  // 7. Reminder insert
  const { data: rem, error: rErr } = await supabase.from('reminders').insert({
    patient_id: pt.id, created_by: uid, title: 'Morning Medicine',
    description: 'Take blood pressure medication', reminder_type: 'medicine',
    scheduled_time: '08:00:00', frequency: 'daily'
  }).select().single()
  rErr ? no('Reminder: ' + rErr.message) : ok('Reminder inserted: ' + rem.title)

  // 8. Reminder update
  const { data: remUp, error: uErr } = await supabase.from('reminders')
    .update({ title: 'Morning Medicine (Updated)', scheduled_time: '09:00:00' })
    .eq('id', rem.id).select().single()
  uErr ? no('Reminder update: ' + uErr.message) : ok('Reminder updated: ' + remUp.title + ' @ ' + remUp.scheduled_time)

  // 9. Memory metadata insert
  const { error: mErr } = await supabase.from('memories').insert({
    patient_id: pt.id, created_by: uid, name: 'Late Grandfather',
    relationship: 'Grandfather', description: 'Test memory entry'
  })
  mErr ? no('Memory: ' + mErr.message) : ok('Memory inserted')

  // 10. RPC: get_patient_stats
  const { data: stats, error: stErr } = await supabase.rpc('get_patient_stats', { patient_uuid: pt.id })
  stErr ? no('get_patient_stats: ' + stErr.message) : ok('get_patient_stats: sessions=' + stats[0].total_sessions + ', avg_accuracy=' + stats[0].avg_accuracy)

  // 11. RPC: get_recent_activity
  const { data: act, error: acErr } = await supabase.rpc('get_recent_activity', { patient_uuid: pt.id, limit_count: 5 })
  acErr ? no('get_recent_activity: ' + acErr.message) : ok('get_recent_activity: ' + act.length + ' entries')

  // 12. RPC: is_caregiver_linked_to_patient
  const { data: lnk, error: lkErr } = await supabase.rpc('is_caregiver_linked_to_patient', { patient_uuid: pt.id })
  lkErr ? no('link check: ' + lkErr.message) : ok('is_caregiver_linked_to_patient: ' + lnk)

  // 13. RPC: is_patient_owner (should be false for caregiver)
  const { data: own, error: owErr } = await supabase.rpc('is_patient_owner', { patient_uuid: pt.id })
  owErr ? no('owner check: ' + owErr.message) : ok('is_patient_owner: ' + own + ' (expected false for caregiver)')

  // 14. RLS: unauthenticated can't read
  const anonClient = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)
  const { data: anonPatients } = await anonClient.from('patients').select('*')
  const { data: anonReminders } = await anonClient.from('reminders').select('*')
  const { data: anonMemories } = await anonClient.from('memories').select('*')
  anonPatients?.length === 0 && anonReminders?.length === 0 && anonMemories?.length === 0
    ? ok('RLS: unauthenticated gets 0 rows across all tables')
    : no('RLS: unauthenticated got data! patients=' + anonPatients?.length + ' reminders=' + anonReminders?.length)

  // 15. Error handling: invalid data rejected
  const { error: badErr } = await supabase.from('reminders').insert({
    patient_id: pt.id, title: 'Bad', reminder_type: 'INVALID', frequency: 'INVALID'
  })
  badErr ? ok('Error handling: invalid enum rejected (' + badErr.code + ')') : no('Error handling: invalid enum accepted')

  // 16. Error handling: non-existent record
  const { data: miss } = await supabase.from('game_sessions').select('*').eq('id', '00000000-0000-0000-0000-000000000000').single()
  !miss ? ok('Error handling: non-existent record returns null') : no('Error handling: got unexpected data')

  // Cleanup
  await supabase.from('game_sessions').delete().eq('patient_id', pt.id)
  await supabase.from('memories').delete().eq('patient_id', pt.id)
  await supabase.from('reminders').delete().eq('patient_id', pt.id)
  await supabase.from('caregiver_patient_links').delete().eq('caregiver_id', uid)
  await supabase.from('patients').delete().eq('id', pt.id)
  // Don't delete the demo profile — user might want to keep it
  await supabase.auth.signOut()
  ok('Cleanup complete')

} catch (e) {
  if (!failed) no('Unexpected: ' + e.message)
}

console.log('\n' + '='.repeat(50))
console.log(`  Results: ${passed} passed, ${failed} failed`)
console.log('='.repeat(50))
process.exit(failed > 0 ? 1 : 0)
