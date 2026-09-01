import { chromium } from 'playwright-core'
import fs from 'fs'

function btnTexts(page) {
  return page.evaluate(() => {
    return Array.from(document.querySelectorAll('button')).map((b) => (b.textContent || '').trim()).filter(Boolean)
  })
}
function mainText(page) {
  return page.evaluate(() => {
    const m = document.querySelector('main')
    return m ? m.innerText.trim().slice(0, 600) : document.body.innerText.trim().slice(0, 600)
  })
}

async function snapshot(page, label, logs, errors) {
  const t = await mainText(page)
  const btns = await btnTexts(page)
  console.log(`\n===== ${label} =====`)
  console.log('TEXT:', t.replace(/\n+/g, ' | '))
  console.log('BUTTONS:', btns.join(' | '))
}

async function probe() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
  const page = await browser.newPage({ viewport: { width: 480, height: 900 } }) // mobile
  const logs = [], errors = []
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(`[${m.type()}] ${m.text()}`) })
  page.on('pageerror', (e) => errors.push(`PAGEERROR: ${e.message}`))
  page.on('requestfailed', (r) => logs.push(`REQFAIL ${r.url()} ${r.failure()?.errorText}`))

  await page.goto('http://localhost:5173/patient/game/memory?mode=practice', { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(800)
  await snapshot(page, 'INTRO', logs, errors)

  // Click Start Activity
  const startBtn = page.locator('button', { hasText: 'Start Activity' })
  const count = await startBtn.count()
  console.log('Start Activity button count:', count)
  if (count === 0) {
    // try by text anywhere
    const all = await btnTexts(page)
    console.log('ALL BUTTONS:', all)
  } else {
    await startBtn.first().click()
  }
  await page.waitForTimeout(1000)
  await snapshot(page, 'AFTER START (delayed-preview)', logs, errors)

  // Walk through phases, waiting and printing. Delayed-preview 8s -> memorise 8s -> task
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(2500)
    const t = await mainText(page)
    const btns = await btnTexts(page)
    const num = await page.evaluate(() => {
      const el = document.querySelector('span.text-3xl') || document.querySelector('span.text-4xl')
      return el ? el.textContent : ''
    })
    console.log(`\n--- tick ${i} (${num}) ---`)
    console.log('TEXT:', t.replace(/\n+/g, ' | '))
    console.log('BUTTONS:', btns.join(' | '))
    // If we see selectable options (object recall) or Submit, try to finish
    if (btns.some((b) => /submit|check|done|next/i.test(b))) {
      // click first submit/next
      const target = btns.find((b) => /submit|check|done|next|see results/i.test(b))
      console.log('CLICKING:', target)
      await page.getByRole('button', { name: new RegExp(target, 'i') }).first().click({ trial: false }).catch(() => {})
    }
    if (btns.some((b) => /start game|play again|back to activities|return home|back home/i.test(b))) {
      console.log('REACHED END STATE')
      break
    }
  }

  await browser.close()
  console.log('\n=== CONSOLE ===')
  console.log(logs.join('\n') || '(none)')
  console.log('=== ERRORS ===')
  console.log(errors.join('\n') || '(none)')
  fs.writeFileSync('/tmp/game-logs.txt', logs.join('\n'))
}
probe().catch((e) => { console.error(e); process.exit(1) })
