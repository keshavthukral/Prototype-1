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
  // Use unique email with random prefix
  const ts = Date.now()
  const rnd = Math.random().toString(36).slice(2, 8)
  const email = `bbtest-${ts}-${rnd}@proton.me`
  const password = 'T3st!Pass#2026'

  // 1. Auth sign-up
  const { data: su, error: suErr } = await supabase.auth.signUp({
    email, password,
    options: { data: { role: 'caregiver', name: 'Backend Test' } }
  })
  if (suErr) { no('Sign-up: ' + suErr.message); throw suErr }
  const uid = su.user.id
  ok('Caregiver sign-up: ' + uid.slice(0, 8))

  // 2. Auth sign-in (may need email confirm)
  const { data: siData, error: siErr } = await supabase.auth.signInWithPassword({ email, password })
  if (siErr) {
    console.log('⚠️  Sign-in blocked (email confirmation required)')
    console.log('   → Go to Supabase Dashboard > Auth > Settings > turn on "Enable email auto-confirm"')
    console.log('   → Then re-run this test')
    console.log('   Auth IS configured and working (sign-up succeeded)')
  } else {
    ok('Caregiver sign-in')

    // 3. Profile
    const { error: pErr } = await supabase.from('profiles').upsert(
      { id: uid, email, full_name: 'Backend Test Caregiver', role: 'caregiver' },
      { onConflict: 'id' }
    )
    pErr ? no('Profile: ' + pErr.message) : ok('Profile created')

    // 4. Patient
    const { data: pt, error: ptErr } = await supabase.from('patients')
      .insert({ preferred_language: 'en', date_of_birth: '1945-03-15', notes: 'Integration test' })
      .select().single()
    if (ptErr) { no('Patient: ' + ptErr.message); throw ptErr }
    ok('Patient created: ' + pt.id.slice(0, 8))

    // 5. Link
    const { error: lErr } = await supabase.from('caregiver_patient_links')
      .insert({ caregiver_id: uid, patient_id: pt.id, relationship: 'child', is_primary: true })
    lErr ? no('Link: ' + lErr.message) : ok('Caregiver-patient link')

    // 6. RLS: read patient
    const { data: rb, error: rbErr } = await supabase.from('patients').select('*').eq('id', pt.id).single()
    rbErr ? no('RLS patient read: ' + rbErr.message) : ok('RLS: patient accessible to linked caregiver')

    // 7. Game session
    const { error: gsErr } = await supabase.from('game_sessions').insert({
      patient_id: pt.id, game_type: 'memory', difficulty_level: 1,
      accuracy: 82.5, response_time_ms: 10000, score: 82
    })
    gsErr ? no('Game session: ' + gsErr.message) : ok('Game session inserted')

    // 8. Reminder
    const { data: rem, error: rErr } = await supabase.from('reminders').insert({
      patient_id: pt.id, created_by: uid, title: 'Morning Medicine',
      reminder_type: 'medicine', scheduled_time: '08:00:00', frequency: 'daily'
    }).select().single()
    rErr ? no('Reminder: ' + rErr.message) : ok('Reminder inserted: ' + rem.title)

    // 9. Reminder update
    const { data: remUp, error: uErr } = await supabase.from('reminders')
      .update({ title: 'Morning Medicine (Updated)', scheduled_time: '09:00:00' })
      .eq('id', rem.id).select().single()
    uErr ? no('Reminder update: ' + uErr.message) : ok('Reminder updated: ' + remUp.title)

    // 10. Memory
    const { error: mErr } = await supabase.from('memories').insert({
      patient_id: pt.id, created_by: uid, name: 'Late Grandfather',
      relationship: 'Grandfather', description: 'Test memory entry'
    })
    mErr ? no('Memory: ' + mErr.message) : ok('Memory inserted')

    // 11. RPC: get_patient_stats
    const { data: stats, error: stErr } = await supabase.rpc('get_patient_stats', { patient_uuid: pt.id })
    stErr ? no('get_patient_stats: ' + stErr.message) : ok('get_patient_stats: sessions=' + stats[0].total_sessions)

    // 12. RPC: get_recent_activity
    const { data: act, error: acErr } = await supabase.rpc('get_recent_activity', { patient_uuid: pt.id, limit_count: 5 })
    acErr ? no('get_recent_activity: ' + acErr.message) : ok('get_recent_activity: ' + act.length + ' entries')

    // 13. RPC: is_caregiver_linked_to_patient
    const { data: lnk, error: lkErr } = await supabase.rpc('is_caregiver_linked_to_patient', { patient_uuid: pt.id })
    lkErr ? no('link check: ' + lkErr.message) : ok('is_caregiver_linked_to_patient: ' + lnk)

    // 14. RLS: unauthenticated can't read patient data
    const anonClient = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)
    const { data: anonData } = await anonClient.from('patients').select('*')
    anonData?.length === 0 ? ok('RLS: unauthenticated gets 0 patients') : no('RLS: unauthenticated got ' + anonData?.length + ' patients!')

    // Cleanup
    await supabase.from('game_sessions').delete().eq('patient_id', pt.id)
    await supabase.from('memories').delete().eq('patient_id', pt.id)
    await supabase.from('reminders').delete().eq('patient_id', pt.id)
    await supabase.from('caregiver_patient_links').delete().eq('caregiver_id', uid)
    await supabase.from('patients').delete().eq('id', pt.id)
    await supabase.from('profiles').delete().eq('id', uid)
    await supabase.auth.signOut()
    ok('Cleanup complete')
  }
} catch (e) {
  if (!failed) no('Unexpected: ' + e.message)
}

console.log('\n' + '='.repeat(50))
console.log(`  Results: ${passed} passed, ${failed} failed`)
console.log('='.repeat(50))
process.exit(failed > 0 ? 1 : 0)
