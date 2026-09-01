import { chromium } from 'playwright-core'

const wait = (n) => new Promise((r) => setTimeout(r, n))
const state = async (p) => p.evaluate(() => {
  const m = document.querySelector('main')
  return { mT: (m ? m.innerText : '').trim().replace(/\s+/g, ' ').slice(0, 400) }
})
const clickRe = async (p, re) => {
  const b = p.locator('main button', { hasText: re }).first()
  if (await b.count()) { await b.click(); return true }
  return false
}

async function probe() {
  const logs = [], errs = []
  const b = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
  const p = await b.newPage({ viewport: { width: 430, height: 980 } })
  p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(`[${m.type()}] ${m.text()}`) })
  p.on('pageerror', (e) => errs.push(`PAGEERROR: ${e.message}`))
  await p.goto('http://localhost:5173/patient/game/memory?mode=practice', { waitUntil: 'networkidle', timeout: 30000 })
  await p.waitForTimeout(500)

  await clickRe(p, /Start Activity/i); await wait(800)

  // wait for round 1 task
  for (let i = 0; i < 18; i++) {
    const btns = await p.$$eval('main button', (els) => els.map((e) => e.textContent || '').filter(Boolean))
    if (btns.some((x) => /Submit Answer/.test(x))) break
    await wait(1000)
  }
  // round 1: click 2 options then submit
  const opts = await p.$$('main button'); let c = 0
  for (const o of opts) {
    const t = await o.textContent().catch(() => '') || ''
    if (/Back|Hint|Submit/.test(t)) continue
    const d = await o.isDisabled().catch(() => false)
    if (!d) { await o.click(); c++; if (c >= 2) break }
  }
  await clickRe(p, /Submit Answer/i); await wait(1200)
  await clickRe(p, /Next Round|See Results/i); await wait(700)

  // wait for spatial task
  for (let i = 0; i < 14; i++) {
    const s = await state(p)
    if (s.mT.toLowerCase().includes('where was')) break
    await wait(1000)
  }
  const cells = await p.$$eval('main button', (els) => els.map((e) => e.textContent || '').filter(Boolean))
  console.log('SPATIAL CELLS:', cells.join(' | '))
  const h1 = (await p.textContent('main h1').catch(() => '') || '')
  const m = h1.match(/where was the (.+)\?/i)
  const label = m ? m[1].trim() : ''
  console.log('heading:', h1, '| target label:', label)
  const ok = await clickRe(p, new RegExp('^' + label + '$', 'i'))
  console.log('clicked exact-name cell:', ok)
  await wait(1500)
  console.log('AFTER spatial:', (await state(p)).mT.slice(0, 280))
  await clickRe(p, /Next Round|See Results/i); await wait(700)
  console.log('AFTER next:', (await state(p)).mT.slice(0, 280))

  await b.close()
  console.log('CONSOLE:', logs.join('\n') || '(none)')
  console.log('ERRORS:', errs.join('\n') || '(none)')
}
probe().catch((e) => { console.error('ERR', e.message); process.exit(1) })
