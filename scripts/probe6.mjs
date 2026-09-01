import { chromium } from 'playwright-core'
import fs from 'fs'

const getState = async (page) => page.evaluate(() => {
  const m = document.querySelector('main')
  const txt = (m ? m.innerText : document.body.innerText).trim().replace(/\s+/g, ' ').slice(0, 360)
  const btns = Array.from(document.querySelectorAll('main button')).map((b) => (b.textContent || '').trim()).filter(Boolean)
  const timer = document.querySelector('span.text-3xl')?.textContent || ''
  return { txt, btns, timer }
})
const wait = (n) => new Promise((r) => setTimeout(r, n))
const clickByRegex = async (page, re) => {
  const btn = page.locator('main button', { hasText: re }).first()
  if (await btn.count()) { await btn.click(); return true }
  return false
}
// click option-like buttons (exclude controls/nav)
const CONTROL = /Back|Hint|Submit|Check Order|Skip|Keep Playing|Leave Activity|Next Round|See Results|Play Again|Back to Activities|Start Activity|Start|Activities/i

async function probe() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
  const page = await browser.newPage({ viewport: { width: 430, height: 980 } })
  const logs = [], errors = []
  page.on('console', (m) => { if (['error','warning'].includes(m.type())) logs.push(`[${m.type()}] ${m.text()}`) })
  page.on('pageerror', (e) => errors.push(`PAGEERROR: ${e.message}`))
  page.on('requestfailed', (r) => logs.push(`REQFAIL ${r.url()} ${r.failure()?.errorText}`))

  await page.goto('http://localhost:5173/patient/game/memory?mode=practice', { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(600)

  let shot = 0
  const snap = async (label) => {
    const s = await getState(page)
    await page.screenshot({ path: `/tmp/shot-${String(shot).padStart(2,'0')}-${label}.png`, fullPage: true })
    shot++
    console.log(`[${label}] timer=${s.timer} | ${s.txt.slice(0,160)} | BTNS: ${s.btns.filter(b=>!CONTROL.test(b)).join(', ')}`)
  }

  await snap('01-intro')
  await clickByRegex(page, /Start Activity/i)
  await wait(700); await snap('02-delayed-preview')

  // wait through delayed-preview + round1 memorise -> task
  for (let i = 0; i < 12; i++) {
    const s = await getState(page)
    if (s.btns.some((b) => /Submit Answer|Check Order/i.test(b))) break
    await wait(1200)
  }
  await snap('03-round1-task')

  // round 1: recall - click 2 options (avoid control buttons)
  let opts = await page.$$('main button')
  let clicked = 0
  for (const b of opts) {
    const t = await b.textContent().catch(() => '')
    if (CONTROL.test(t || '')) continue
    const dis = await b.isDisabled().catch(() => false)
    if (!dis) { await b.click(); clicked++; if (clicked >= 2) break }
  }
  await wait(600)
  await clickByRegex(page, /Submit Answer/i)
  await wait(1400); await snap('04-round1-result')
  await clickByRegex(page, /Next Round|See Results/i)
  await wait(900); await snap('05-round2-memorise-or-task')

  // round 2: spatial - wait for task (Where was the X)
  for (let i = 0; i < 12; i++) {
    const s = await getState(page)
    if (s.btns.some((b) => /Check Order|Submit Answer/i.test(b)) && !s.btns.includes('Back')) {
      // spatial task has grid buttons, no submit; detect by heading
    }
    if (s.txt.toLowerCase().includes('where was')) break
    if (s.txt.toLowerCase().includes('order') && s.btns.includes('Check Order')) break
    if (s.txt.toLowerCase().includes('who is this')) break
    await wait(1200)
  }
  await snap('05b-round2-task')

  // round 2 spatial: find the question object in heading, click matching grid cell
  const h1 = await page.textContent('main h1').catch(() => '') || ''
  const m = h1.match(/where was the (.+)\?/i)
  if (m) {
    const label = m[1].trim().toLowerCase()
    const cells = await page.$('main button')
    const all = await page.$$('main button')
    let done = false
    for (let attempt = 0; attempt < 6; attempt++) {
      const texts = await Promise.all(all.map((b) => b.textContent().catch(() => '')))
      const idx = texts.findIndex((t) => (t || '').trim().toLowerCase().includes(label) && !CONTROL.test(t || ''))
      if (idx >= 0) { await all[idx].click(); done = true; break }
      await wait(700)
    }
    if (!done) { const btns2 = await page.$$('main button'); for (const b of btns2) { const t = await b.textContent().catch(()=> ''); if (!CONTROL.test(t||'')) { await b.click(); break } } }
  }
  await wait(600); await snap('06-round2-submitted')

  // Keep clicking Next Round / See Results / Play Again through remaining rounds
  for (let i = 0; i < 40; i++) {
    const s = await getState(page)
    if (s.txt.includes('Activity Complete')) break
    if (s.btns.some((b) => /Next Round|See Results|Play Again|Back to Activities/i.test(b))) {
      await clickByRegex(page, /Next Round|See Results|Play Again|Back to Activities/i)
      await wait(700); await snap(`step-${String(i).padStart(2,'0')}`)
      continue
    }
    if (s.btns.some((b) => /Submit Answer|Check Order/i.test(b))) {
      // auto-task: click a couple non-control options then submit
      const all = await page.$$('main button')
      let c = 0
      for (const b of all) {
        const t = await b.textContent().catch(() => '')
        if (CONTROL.test(t || '')) continue
        const dis = await b.isDisabled().catch(() => false)
        if (!dis) { await b.click(); c++; if (c >= 2) break }
      }
      await wait(500)
      if (s.btns.includes('Check Order')) await clickByRegex(page, /Check Order/i)
      else await clickByRegex(page, /Submit Answer/i)
      await wait(1500); await snap(`auto-task-${String(i).padStart(2,'0')}`)
      continue
    }
    await wait(1200)
  }
  await snap('07-final')

  await browser.close()
  console.log('\n=== CONSOLE ==='); console.log(logs.join('\n') || '(none)')
  console.log('=== ERRORS ==='); console.log(errors.join('\n') || '(none)')
  fs.writeFileSync('/tmp/game-logs.txt', logs.join('\n'))
}
probe().catch((e) => { console.error('PROBE ERR:', e.message); process.exit(1) })
