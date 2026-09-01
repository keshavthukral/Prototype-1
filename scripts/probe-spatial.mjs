import { chromium } from 'playwright-core'

const wait = (n) => new Promise((r) => setTimeout(r, n))
const state = async (page) => page.evaluate(() => {
  const m = document.querySelector('main')
  const txt = (m ? m.innerText : '').trim().replace(/\s+/g, ' ').slice(0, 420)
  const btns = Array.from(document.querySelectorAll('main button')).map((b) => (b.textContent || '').trim()).filter(Boolean)
  const timer = document.querySelector('span.text-3xl')?.textContent || ''
  return { txt, btns, timer }
})
const clickRe = async (page, re, opts = {}) => {
  const btn = page.locator('main button', { hasText: re }).first()
  if (await btn.count()) { await btn.click(opts); return true }
  return false
}

async function probe() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
  const page = await browser.newPage({ viewport: { width: 430, height: 980 } })
  const logs = [], errors = []
  page.on('console', (m) => { if (['error','warning'].includes(m.type())) logs.push(`[${m.type()}] ${m.text()}`) })
  page.on('pageerror', (e) => errors.push(`PAGEERROR: ${e.message}`))
  page.on('requestfailed', (r) => logs.push(`REQFAIL ${r.url()} ${r.failure()?.errorText}`))
  await page.goto('http://localhost:5173/patient/game/memory?mode=practice', { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(500)

  const dump = async (label) => { const s = await state(page); console.log(`[${label}] T=${s.timer} | ${s.txt.slice(0,200)} | BTNS=${s.btns.join(',')}`) }

  // 1. Start
  await clickRe(page, /Start Activity/i); await wait(800); await dump('started-delayed-preview')

  // 2. Wait through delayed-preview (8s) + round1 memorise (8s) -> task
  for (let i = 0; i < 18; i++) {
    const s = await state(page)
    if (s.btns.some((b) => /Submit Answer/.test(b))) { console.log('reached round1 task at tick', i); break }
    await wait(1000)
  }
  await dump('round1-task')

  // 3. Submit round 1: click 2 non-control option buttons then Submit
  const opts = await page.$$('main button')
  let c = 0
  for (const b of opts) {
    const t = await b.textContent().catch(() => '') || ''
    if (/Back|Hint|Submit/.test(t)) continue
    const dis = await b.isDisabled().catch(() => false)
    if (!dis) { await b.click(); c++; if (c >= 2) break }
  }
  console.log('round1 clicked options:', c)
  await clickRe(page, /Submit Answer/i); await wait(1500); await dump('round1-result')
  await clickRe(page, /Next Round|See Results/i); await wait(900); await dump('after-round1-next')

  // 4. Round 2 spatial: wait for "Where was" task
  for (let i = 0; i < 14; i++) {
    const s = await state(page)
    if (s.txt.toLowerCase().includes('where was')) { console.log('reached spatial task at tick', i); break }
    await wait(1000)
  }
  await dump('spatial-memorise->task')

  // 5. Capture grid cells and click correct one
  const cells = await page.$$('main button')
  const cellTexts = await Promise.all(cells.map((b) => b.textContent().catch(() => '')))
  console.log('SPATIAL CELLS:', cellTexts.map((t, i) => `${i}:"${(t||'').trim()}"`).join(' | '))
  const h1 = (await page.textContent('main h1').catch(() => '')) || ''
  const m = h1.match(/where was the (.+)\?/i)
  const label = m ? m[1].trim().toLowerCase() : ''
  console.log('spatial question object label:', label)

  // find cell whose text contains the label (and is not a control nav button)
  let clickedCell = -1
  for (let i = 0; i < cellTexts.length; i++) {
    const t = (cellTexts[i] || '').trim().toLowerCase()
    if (t && !/back|hint|submit|check order/i.test(t) && t.includes(label)) clickedCell = i
  }
  console.log('target cell index:', clickedCell)
  if (clickedCell >= 0) {
    // click by evaluating the grid button directly
    await page.$$eval('main button', (buttons, idx) => {
      const nonControl = buttons.filter((b) => !/Back|Hint|Submit|Check Order/i.test((b.textContent||'').trim()))
      nonControl[idx].click()
    }, clickedCell - 0).catch(() => {})
    // fallback: click the nth non-control button
    await wait(400)
  }
  await dump('spatial-after-click')
  await wait(2000)
  await dump('spatial-2s-after-click')

  await browser.close()
  console.log('\n=== CONSOLE ==='); console.log(logs.join('\n') || '(none)')
  console.log('=== ERRORS ==='); console.log(errors.join('\n') || '(none)')
}
probe().catch((e) => { console.error('PROBE ERR:', e.message); process.exit(1) })
