import { chromium } from 'playwright-core'
import fs from 'fs'

const getState = async (page) => {
  return page.evaluate(() => {
    const m = document.querySelector('main')
    const txt = (m ? m.innerText : document.body.innerText).trim().replace(/\s+/g, ' ').slice(0, 500)
    const btns = Array.from(document.querySelectorAll('main button')).map((b) => (b.textContent || '').trim()).filter(Boolean)
    const timer = document.querySelector('span.text-3xl')?.textContent || ''
    return { txt, btns, timer }
  })
}
const wait = (n) => new Promise((r) => setTimeout(r, n))

// find a button by regex, within main
const clickBtn = async (page, re) => {
  const btn = page.locator('main button', { hasText: re }).first()
  const n = await btn.count()
  if (n) { await btn.click(); return true }
  return false
}

async function probe() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
  const page = await browser.newPage({ viewport: { width: 480, height: 980 } })
  const logs = [], errors = []
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(`[${m.type()}] ${m.text()}`) })
  page.on('pageerror', (e) => errors.push(`PAGEERROR: ${e.message}`))
  page.on('requestfailed', (r) => logs.push(`REQFAIL ${r.url()} ${r.failure()?.errorText}`))

  await page.goto('http://localhost:5173/patient/game/memory?mode=practice', { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(800)

  const log = (label) => getState(page).then((s) => console.log(`[${label}] timer=${s.timer} | ${s.txt.slice(0, 180)} | BTNS: ${s.btns.join(' | ')}`))

  // Play N rounds autonomously
  let round = 0
  try {
    while (round < 6) {
      const s = await getState(page)
      // Start
      if (await clickBtn(page, /Start Activity/i)) { await log('START'); await wait(800); continue }

      // Round result / next
      if (s.btns.some((b) => /Next Round|See Results/i.test(b))) {
        console.log(`[round-result] ${s.txt.slice(0,120)}`)
        await clickBtn(page, /Next Round|See Results/i)
        await wait(800); continue
      }

      // Final result
      if (s.txt.includes('Activity Complete') || s.btns.some((b) => /Play Again|Back to Activities/i.test(b))) {
        console.log('=== FINAL RESULT reached ===')
        await log('FINAL')
        await clickBtn(page, /Play Again/i)
        await wait(1200); continue
      }

      // Task phase
      if (s.btns.some((b) => /Submit Answer|Check Order|Submit/i.test(b))) {
        // Determine task type by heading text
        const isSpatial = s.txt.toLowerCase().includes('where was')
        const isOrder = s.txt.toLowerCase().includes('order') || s.btns.includes('Check Order')
        const isPersonal = s.txt.toLowerCase().includes('who is this')
        console.log(`[TASK type=${isSpatial?'spatial':isOrder?'order':isPersonal?'personal':'recall'}] ${s.txt.slice(0,120)}`)
        if (isSpatial) {
          // click cells until correct: pick the question object and find its cell
          const q = await page.textContent('main h1').catch(() => '')
          const objMatch = q && q.match(/where was the (.+)\?/i)
          let label = objMatch ? objMatch[1].trim().toLowerCase() : ''
          // grid cells text content
          const cells = await page.$$eval('main button', (els) => els.map((e) => (e.textContent || '').trim().toLowerCase()))
          let clicked = false
          for (let i = 0; i < cells.length; i++) {
            if (cells[i] && cells[i].includes(label)) {
              const btns = await page.$$('main button')
              if (btns[i]) { await btns[i].click(); clicked = true; break }
            }
          }
          if (!clicked) { const btns = await page.$$('main button'); if (btns[0]) await btns[0].click() }
        } else if (isOrder) {
          // click all available options (those not yet selected) then Check Order
          const opts = await page.$$('main button')
          for (const b of opts) {
            const t = await b.textContent().catch(() => '')
            if (/Check Order/i.test(t)) break
          }
          // click each option that is enabled (text contains an object label, not numbered)
          const opts2 = await page.$$eval('main button', (els) => els.map((e,i) => ({i, t:(e.textContent||'').trim()})))
          // find options before the ordered list; simplest: click first N enabled
          for (const o of opts2) {
            const btns = await page.$$('main button')
            if (o.i < btns.length && btns[o.i]) {
              const disabled = await btns[o.i].isDisabled()
              const txt = await btns[o.i].textContent().catch(()=>'')
              if (!disabled && !/Check Order/i.test(txt || '')) {
                await btns[o.i].click()
              }
            }
          }
        } else {
          // recall or personal: click first 2 selectable options
          const opts = await page.$$('main button')
          let clicked = 0
          for (const b of opts) {
            const txt = await b.textContent().catch(() => '')
            if (/Submit/i.test(txt || '') || /Hint/i.test(txt || '') || /Skip/i.test(txt || '')) continue
            const disabled = await b.isDisabled()
            if (!disabled) { await b.click(); clicked++; if (clicked >= 2) break }
          }
        }
        await wait(900)
        // submit
        if (isOrder) {
          await clickBtn(page, /Check Order/i)
        } else {
          await clickBtn(page, /Submit Answer|Submit/i)
        }
        await wait(2000); continue
      }

      // Memorise / delayed-preview: just waiting for countdown to finish
      if (s.timer && s.timer !== '0') {
        await log('WAITING-COUNTDOWN')
        await wait(2500); continue
      }

      // Unknown state
      console.log('UNKNOWN STATE, waiting...')
      await log('UNKNOWN')
      await wait(2000); round++
      if (++round > 6) break
      continue
    }
  } catch (e) {
    console.log('LOOP ERROR:', e.message, e.stack)
  }

  await browser.close()
  console.log('\n=== CONSOLE ===')
  console.log(logs.join('\n') || '(none)')
  console.log('=== ERRORS ===')
  console.log(errors.join('\n') || '(none)')
  fs.writeFileSync('/tmp/game-logs.txt', logs.join('\n'))
}
probe().catch((e) => { console.error(e); process.exit(1) })
