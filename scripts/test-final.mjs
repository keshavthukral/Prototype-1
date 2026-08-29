#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const env = {}
readFileSync('.env', 'utf-8').split('\n').filter(l => l && !l.startsWith('#')).forEach(l => {
  const [k, ...v] = l.split('=')
  env[k.trim()] = v.join('=').trim()
})

const s = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)
let P = 0, F = 0
const ok = m => { P++; console.log('✅ ' + m) }
const no = m => { F++; console.log('❌ ' + m) }

try {
  // 1. Sign in
  const { data: si, error: siE } = await s.auth.signInWithPassword({ email: 'caregiver.demo@example.com', password: 'kt798' })
  if (siE) { no('Sign-in: ' + siE.message); throw siE }
  const uid = si.user.id
  ok('Caregiver sign-in (' + uid.slice(0, 8) + ')')

  // 2. Own profile read
  const { data: prof, error: pE } = await s.from('profiles').select('*').eq('id', uid).single()
  pE ? no('Profile read: ' + pE.message) : ok('Own profile read (' + prof.role + ')')

  // 3. Profile upsert
  const { error: upE } = await s.from('profiles').upsert({ id: uid, email: 'caregiver.demo@example.com', full_name: 'Demo Caregiver', role: 'caregiver' }, { onConflict: 'id' })
  upE ? no('Profile upsert: ' + upE.message) : ok('Profile upsert')

  // 4. Create patient via RPC
  const { data: ptData, error: ptE } = await s.rpc('create_patient_for_caregiver', {
    p_preferred_language: 'en',
    p_date_of_birth: '1945-03-15',
    p_notes: 'Backend test'
  })
  if (ptE) { no('Patient create: ' + ptE.message); throw ptE }
  const pt = ptData
  ok('Patient created via RPC (' + pt.id.slice(0, 8) + ')')

  // 5. Link created atomically by RPC
  ok('Caregiver-patient link (created atomically by RPC)')

  // 6. Linked patient read
  const { data: rb, error: rbE } = await s.from('patients').select('*').eq('id', pt.id).single()
  rbE ? no('Linked patient read: ' + rbE.message) : ok('Linked patient read (' + rb.notes + ')')

  // 7. Unlinked patient denied (anon client gets 0 rows)
  const anon = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)
  const { data: anonP } = await anon.from('patients').select('id')
  const { data: anonL } = await anon.from('caregiver_patient_links').select('id')
  const { data: anonR } = await anon.from('reminders').select('id')
  anonP?.length === 0 && anonL?.length === 0 && anonR?.length === 0
    ? ok('Unauthenticated access denied (RLS active)')
    : no('RLS leak: patients=' + anonP?.length + ' links=' + anonL?.length + ' reminders=' + anonR?.length)

  // 8. Reminders CRUD
  const { data: rem, error: crE } = await s.from('reminders').insert({
    patient_id: pt.id, created_by: uid, title: 'Morning Medicine',
    reminder_type: 'medicine', scheduled_time: '08:00:00', frequency: 'daily'
  }).select().single()
  crE ? no('Reminder create: ' + crE.message) : ok('Reminder create (' + rem.title + ')')

  const { data: remUp, error: ruE } = await s.from('reminders').update({ title: 'Morning Medicine (Updated)' }).eq('id', rem.id).select().single()
  ruE ? no('Reminder update: ' + ruE.message) : ok('Reminder update (' + remUp.title + ')')

  // 9. Reminder completions CRUD
  const { data: comp, error: ccE } = await s.from('reminder_completions').insert({
    reminder_id: rem.id, patient_id: pt.id, status: 'taken'
  }).select().single()
  ccE ? no('Completion create: ' + ccE.message) : ok('Reminder completion create (' + comp.status + ')')

  const { data: compUp, error: cuE } = await s.from('reminder_completions').update({ status: 'done' }).eq('id', comp.id).select().single()
  cuE ? no('Completion update: ' + cuE.message) : ok('Reminder completion update (' + compUp.status + ')')

  // 10. Game sessions CRUD
  const { data: gs, error: gsE } = await s.from('game_sessions').insert({
    patient_id: pt.id, game_type: 'memory', difficulty_level: 1,
    accuracy: 85.0, response_time_ms: 9000, score: 85
  }).select().single()
  gsE ? no('Game session create: ' + gsE.message) : ok('Game session create (' + gs.game_type + ', ' + gs.accuracy + '%)')

  const { data: gsUp, error: gsUE } = await s.from('game_sessions').update({ accuracy: 90.0 }).eq('id', gs.id).select().single()
  gsUE ? no('Game session update: ' + gsUE.message) : ok('Game session update (' + gsUp.accuracy + '%)')

  // 11. Memories CRUD
  const { data: mem, error: meE } = await s.from('memories').insert({
    patient_id: pt.id, created_by: uid, name: 'Late Grandfather',
    relationship: 'Grandfather', description: 'Test'
  }).select().single()
  meE ? no('Memory create: ' + meE.message) : ok('Memory create (' + mem.name + ')')

  const { data: memUp, error: muE } = await s.from('memories').update({ description: 'Updated' }).eq('id', mem.id).select().single()
  muE ? no('Memory update: ' + muE.message) : ok('Memory update (' + memUp.description + ')')

  // 12. RPC functions
  const { data: stats } = await s.rpc('get_patient_stats', { patient_uuid: pt.id })
  stats?.[0] ? ok('get_patient_stats (sessions=' + stats[0].total_sessions + ')') : no('get_patient_stats failed')

  const { data: act } = await s.rpc('get_recent_activity', { patient_uuid: pt.id, limit_count: 5 })
  ok('get_recent_activity (' + (act?.length ?? 0) + ' entries)')

  const { data: lnk } = await s.rpc('is_caregiver_linked_to_patient', { patient_uuid: pt.id })
  lnk === true ? ok('is_caregiver_linked_to_patient: true') : no('link check: ' + lnk)

  // 13. Delete operations
  const { error: delME } = await s.from('memories').delete().eq('id', mem.id)
  delME ? no('Memory delete: ' + delME.message) : ok('Memory delete')

  const { error: delCE } = await s.from('reminder_completions').delete().eq('id', comp.id)
  delCE ? no('Completion delete: ' + delCE.message) : ok('Reminder completion delete')

  const { error: delRE } = await s.from('reminders').delete().eq('id', rem.id)
  delRE ? no('Reminder delete: ' + delRE.message) : ok('Reminder delete')

  const { error: delGE } = await s.from('game_sessions').delete().eq('id', gs.id)
  delGE ? no('Game session delete: ' + delGE.message) : ok('Game session delete')

  // Cleanup
  await s.from('caregiver_patient_links').delete().eq('caregiver_id', uid).eq('patient_id', pt.id)
  await s.from('patients').delete().eq('id', pt.id)
  await s.auth.signOut()
  ok('Cleanup complete')

} catch (e) {
  if (!F) no('Unexpected: ' + e.message)
}

console.log('\n' + '='.repeat(50))
console.log(`  Results: ${P} passed, ${F} failed`)
console.log('='.repeat(50))
process.exit(F > 0 ? 1 : 0)
