import { chromium } from 'playwright-core'
import fs from 'fs'

const getState = async (page) => {
  return page.evaluate(() => {
    const m = document.querySelector('main')
    const txt = (m ? m.innerText : document.body.innerText).trim().replace(/\s+/g, ' ').slice(0, 400)
    const btns = Array.from(document.querySelectorAll('button')).map((b) => (b.textContent || '').trim()).filter((b) => b && b.toLowerCase() !== 'dev')
    const timer = document.querySelector('span.text-3xl, span.text-4xl, span.font-bold.tabular-nums')?.textContent || ''
    return { txt, btns, timer }
  })
}

async function probe() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
  const page = await browser.newPage({ viewport: { width: 480, height: 900 } })
  const logs = [], errors = []
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(`[${m.type()}] ${m.text()}`) })
  page.on('pageerror', (e) => errors.push(`PAGEERROR: ${e.message}`))
  page.on('requestfailed', (r) => logs.push(`REQFAIL ${r.url()} ${r.failure()?.errorText}`))

  await page.goto('http://localhost:5173/patient/game/memory?mode=practice', { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(800)

  const log = (label, s) => console.log(`[${label}] timer=${s.timer} | ${s.txt.slice(0, 200)} | BTNS: ${s.btns.join(' | ')}`)

  let s = await getState(page)
  log('INTRO', s)
  await page.getByRole('button', { name: /Start Activity/i }).first().click()
  await page.waitForTimeout(1200)

  // Poll until we reach the task phase (object recall) or timeout
  let reachedTask = false
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(1000)
    s = await getState(page)
    log(`tick-${i}`, s)
    if (s.btns.some((b) => /submit answer/i.test(b))) { reachedTask = true; break }
    if (s.txt.includes('Good effort') || s.btns.some((b) => /Next Round/i.test(b))) break
  }
  console.log('REACHED TASK:', reachedTask)

  if (reachedTask) {
    // Click first selectable option, then Submit
    const optionBtns = await page.$$('button[aria-pressed]').catch(() => [])
    console.log('option buttons (aria-pressed):', optionBtns.length)
    // try clicking the first grid option
    const opts = await page.$$eval('section button[aria-pressed]', (els) => els.map((e, i) => i))
    console.log('selectable count:', opts.length)
    if (opts.length > 0) {
      await page.$$eval('section button[aria-pressed]', (els) => { els[0].click() })
      await page.waitForTimeout(400)
    }
    await page.getByRole('button', { name: /Submit Answer/i }).first().click().catch((e) => console.log('submit click err:', e.message))
    await page.waitForTimeout(1500)
    s = await getState(page)
    log('AFTER SUBMIT', s)
    const next = await page.getByRole('button', { name: /Next Round|See Results/i }).first().count()
    console.log('next/see-results button count:', next)
    if (next > 0) await page.getByRole('button', { name: /Next Round|See Results/i }).first().click().catch(() => {})
    await page.waitForTimeout(1500)
    s = await getState(page)
    log('AFTER NEXT', s)
  }

  await browser.close()
  console.log('\n=== CONSOLE ===')
  console.log(logs.join('\n') || '(none)')
  console.log('=== ERRORS ===')
  console.log(errors.join('\n') || '(none)')
}
probe().catch((e) => { console.error(e); process.exit(1) })
