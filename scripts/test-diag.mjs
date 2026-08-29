#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const env = {}
readFileSync('.env', 'utf-8').split('\n').filter(l => l && !l.startsWith('#')).forEach(l => {
  const [k, ...v] = l.split('=')
  env[k.trim()] = v.join('=').trim()
})

const s = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)
await s.auth.signInWithPassword({ email: 'caregiver.demo@example.com', password: 'kt798' })

// 1. Confirm role
const { data: role } = await s.rpc('get_user_role')
console.log('1. get_user_role():', role)

// 2. Confirm profile
const { data: prof } = await s.from('profiles').select('id, role, full_name').single()
console.log('2. Profile:', prof?.full_name, 'role:', prof?.role)

// 3. Try patient insert - get full error detail
const { data, error } = await s.from('patients').insert({ preferred_language: 'en', notes: 'diag test' }).select()
console.log('3. Patient INSERT:', error ? `FAIL (${error.code}: ${error.message})` : 'OK: ' + JSON.stringify(data))

// 4. Try a raw check — can the function see us as caregiver in the RLS context?
//    Maybe the issue is that the function is SECURITY DEFINER and has caching issues
//    Let's try with a direct subquery approach
const { data: d2, error: e2 } = await s.from('patients').select('id').limit(0) // just test read access
console.log('4. Patient SELECT (should work with RLS):', e2 ? `FAIL: ${e2.message}` : `OK (${d2?.length} rows)`)

// 5. Check if there are any old policies that might be interfering
//    We can't query pg_policies with anon key, but we can try to create a helper
console.log('\n--- Manual checks needed in SQL Editor ---')
console.log('Run this to see all policies on patients:')
console.log(`
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'patients'
ORDER BY policyname;
`)
console.log('\nIf you see duplicate INSERT policies, drop them and re-run schema.')
