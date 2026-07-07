import { chromium } from 'playwright'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()

// Capture ALL console output
const consoleLogs = []
page.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`))
page.on('pageerror', err => consoleLogs.push(`[PAGE_ERROR] ${err.message}`))
page.on('requestfailed', req => consoleLogs.push(`[REQUEST_FAILED] ${req.url()} ${req.failure()?.errorText}`))
page.on('response', resp => {
  if (resp.status() >= 400) {
    consoleLogs.push(`[HTTP ${resp.status()}] ${resp.url()}`)
  }
})

await page.goto('http://localhost:3000/demo/nayan-ai', { waitUntil: 'load', timeout: 30000 })
await page.waitForTimeout(5000)

// Try to extract getModelStatus() — it's a module-level export bundled by Next
// We can check by looking for the status variable via __NEXT_RSC or other means.
// Fallback: check DOM text for any status indicators
const pageText = await page.textContent('body')
const statusMatch = pageText.match(/getModelStatus.*?(unloaded|loading|ready|unsupported|missing)/i)

consoleLogs.push(`[PAGE_TEXT_SAMPLE] ${pageText.substring(0, 500).replace(/\s+/g, ' ')}`)

// Check network requests for model.json
const modelRequests = consoleLogs.filter(l => l.includes('model.json'))
if (modelRequests.length === 0) {
  consoleLogs.push('[MODEL] No requests to model.json detected')
}

console.log('=== BROWSER CONSOLE OUTPUT ===')
consoleLogs.forEach(l => console.log(l))
console.log('=== END ===')

await browser.close()
