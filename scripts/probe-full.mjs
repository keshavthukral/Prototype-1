import { chromium } from 'playwright-core'

const wait = (n) => new Promise((r) => setTimeout(r, n))
const mainBtns = (p) => p.$$eval('main button', (els) => els.map((e) => (e.textContent || '').trim()).filter(Boolean))
const ctrl = /Back|Hint|Submit|Check Order|Skip|Next Round|See Results|Play Again|Back to Activities|Start Activity|Keep Playing|Leave Activity|Activities/i
const clickRe = async (p, re) => {
  const b = p.locator('main button', { hasText: re }).first()
  if (await b.count()) { await b.click(); return true }
  return false
}
const heading = (p) => p.textContent('main h1').catch(() => '').then((x) => x || '')
const txt = async (p) => p.evaluate(() => { const m = document.querySelector('main'); return (m ? m.innerText : '').trim().replace(/\s+/g, ' ').slice(0, 260) })
const timer = (p) => p.evaluate(() => document.querySelector('span.text-3xl')?.textContent || '')

async function runRound(p, roundNum) {
  // wait for a task or countdown
  let h = '', t = await txt(p)
  for (let i = 0; i < 22; i++) {
    h = await heading(p)
    t = await txt(p)
    if (/Which objects did|Where was the|Put the objects|Who is this/.test(t)) break
    if (t.includes('Good effort') || t.includes('Activity Complete')) break
    await wait(1000)
  }
  console.log(`[R${roundNum}] heading="${h}" | "${t.slice(0, 80)}"`)

  if (!t.includes('Remember') && !t.includes('Where was') && !t.includes('Put the') && !t.includes('Who is this') && !t.includes('Which objects')) {
    // maybe still memorise
    if (t.includes('Good effort')) return
    if (t.includes('Activity Complete')) return
  }

  if (t.includes('Which objects did you just see') || t.includes('Which objects did you see earlier')) {
    // recall: click 2 options, submit
    const opts = await p.$$('main button')
    let c = 0
    for (const o of opts) { const x = await o.textContent().catch(() => '') || ''; if (ctrl.test(x)) continue; const d = await o.isDisabled().catch(() => false); if (!d) { await o.click(); c++; if (c >= 2) break } }
    await clickRe(p, /Submit Answer/i); await wait(1300); console.log(`[R${roundNum}] submitted recall`)
  } else if (t.includes('Where was the')) {
    const hh = await heading(p)
    const m = hh.match(/where was the (.+)\?/i)
    const label = m ? m[1].trim() : ''
    console.log(`[R${roundNum}] spatial target=${label}`)
    for (let attempt = 0; attempt < 8; attempt++) {
      const btns = await mainBtns(p)
      const idx = btns.findIndex((b) => b && !ctrl.test(b) && b.toLowerCase().includes(label.toLowerCase()))
      if (idx >= 0) {
        // click the idx-th NON-control button
        const nonCtrl = await p.$$('main button')
        const filtered = []
        for (const b of await p.$$('main button')) { const x = await b.textContent().catch(() => '') || ''; if (!ctrl.test(x)) filtered.push(b) }
        if (filtered[idx]) { await filtered[idx].click(); break }
      }
      await wait(700)
    }
    await wait(1300); console.log(`[R${roundNum}] submitted spatial`)
  } else if (t.includes('Put the objects')) {
    // order: click all distinct options then Check Order
    const opts = await p.$$('main button')
    let clicked = new Set()
    for (const o of opts) {
      const x = await o.textContent().catch(() => '') || ''
      if (ctrl.test(x)) continue
      const d = await o.isDisabled().catch(() => false)
      if (!d) { await o.click(); clicked.add(x); }
    }
    await wait(600); await clickRe(p, /Check Order/i); await wait(1300); console.log(`[R${roundNum}] submitted order`)
  } else if (t.includes('Who is this')) {
    const opts = await p.$$('main button')
    for (const o of opts) { const x = await o.textContent().catch(() => '') || ''; if (!ctrl.test(x)) { await o.click(); break } }
    await wait(500); await clickRe(p, /Submit Answer/i); await wait(1300); console.log(`[R${roundNum}] submitted personal`)
  }
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

  for (let r = 1; r <= 5; r++) {
    await runRound(p, r)
    // next
    await clickRe(p, /Next Round|See Results/i); await wait(1100)
  }

  // final
  for (let i = 0; i < 12; i++) {
    const t = await txt(p)
    if (t.includes('Activity Complete')) break
    if ((await mainBtns(p)).some((b) => /Play Again/.test(b))) break
    await wait(1000)
  }
  console.log('FINAL:', await txt(p))
  console.log('FINAL BTNS:', await mainBtns(p))

  // Play Again -> restart
  await clickRe(p, /Play Again/i); await wait(1500)
  console.log('AFTER PLAY AGAIN:', await txt(p))
  console.log('AFTER PLAY AGAIN BTNS:', await mainBtns(p))

  await b.close()
  console.log('CONSOLE:', logs.join('\n') || '(none)')
  console.log('ERRORS:', errs.join('\n') || '(none)')
}
probe().catch((e) => { console.error('ERR', e.message); process.exit(1) })
