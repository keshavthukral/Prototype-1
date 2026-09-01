import { chromium } from 'playwright-core'
import fs from 'fs'

async function probe(url, outPng) {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
  const page = await browser.newPage({ viewport: { width: 1280, height: 980 } })
  const logs = [], errors = []
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(`[${m.type()}] ${m.text()}`) })
  page.on('pageerror', (e) => errors.push(`PAGEERROR: ${e.message}`))
  page.on('requestfailed', (r) => logs.push(`REQFAIL ${r.url()} ${r.failure()?.errorText}`))

  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 }).catch((e) => console.log('NAV ERR:', e.message))
  await page.waitForTimeout(2500)

  const shot = await page.screenshot({ fullPage: true })
  fs.writeFileSync(outPng, shot)

  const data = await page.evaluate(() => {
    const root = document.getElementById('root')
    return {
      title: document.title,
      bodyText: document.body.innerText.slice(0, 3000),
      rootHTMLLen: root ? root.innerHTML.length : 0,
      rootChildren: root ? root.children.length : 0,
      overlay: !!document.querySelector('.vite-error-overlay, .overlayBack'),
      mainCount: document.querySelectorAll('main').length,
      patientUi: !!document.querySelector('.patient-ui'),
      bodyBg: getComputedStyle(document.body).backgroundColor,
      rootHTML: root ? root.innerHTML.slice(0, 1500) : '',
    }
  })
  await browser.close()
  console.log('URL:', url)
  console.log('TITLE:', data.title)
  console.log('ROOT children:', data.rootChildren, 'len:', data.rootHTMLLen)
  console.log('overlay present:', data.overlay)
  console.log('main count:', data.mainCount, 'patient-ui:', data.patientUi)
  console.log('bodyBg:', data.bodyBg)
  console.log('=== BODY TEXT ===')
  console.log(data.bodyText || '(empty body text)')
  console.log('=== ROOT HTML (first 1500) ===')
  console.log(data.rootHTML || '(empty root html)')
  console.log('=== CONSOLE ===')
  console.log(logs.join('\n') || '(none)')
  console.log('=== ERRORS ===')
  console.log(errors.join('\n') || '(none)')
}
probe(process.argv[2], process.argv[3]).catch((e) => { console.error(e); process.exit(1) })
