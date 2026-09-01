import { chromium } from 'playwright-core'
import fs from 'fs'

async function main() {
  const url = process.argv[2] || 'http://localhost:5173/patient/game/memory?mode=practice'
  const screenshotPath = process.argv[3] || '/tmp/game.png'
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
  const page = await browser.newPage()
  const logs = []
  const errors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') logs.push(`[${msg.type()}] ${msg.text()}`)
  })
  page.on('pageerror', (err) => errors.push(`PAGEERROR: ${err.message}`))
  page.on('requestfailed', (req) => logs.push(`REQFAIL ${req.url()} ${req.failure()?.errorText}`))

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
  } catch (e) {
    console.log(`NAVIGATION ERROR: ${e.message}`)
  }
  await page.waitForTimeout(1500)

  const screenshot = await page.screenshot({ fullPage: true })
  await browser.close()

  fs.writeFileSync(screenshotPath, screenshot)
  fs.writeFileSync('/tmp/game-logs.txt', logs.join('\n'))

  const title = await page.title().catch(() => '')
  console.log('TITLE:', title)
  console.log('=== CONSOLE/REQUEST LOGS ===')
  console.log(logs.join('\n') || '(none)')
  console.log('=== PAGE ERRORS ===')
  console.log(errors.join('\n') || '(none)')

  const heading = await page.textContent('h1').catch(() => '')
  console.log('=== FIRST H1 TEXT ===')
  console.log(heading || '(no h1)')
  const bodyText = await page.evaluate(() => {
    const main = document.querySelector('main')
    return main ? main.innerText.slice(0, 1200) : document.body.innerText.slice(0, 1200)
  }).catch(() => '')
  console.log('=== MAIN INNER TEXT (first 1200 chars) ===')
  console.log(bodyText || '(no main text)')
}

main().catch((e) => {
  console.error('SCRIPT ERROR:', e)
  process.exit(1)
})
