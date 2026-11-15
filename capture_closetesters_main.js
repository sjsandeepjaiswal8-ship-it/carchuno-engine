const { chromium } = require('playwright');
const path = require('path');

async function captureCloseTestersMain() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });

  await page.goto('https://closetesters-hub-2026.web.app', { waitUntil: 'networkidle' });
  
  // Click Continue to Website button to dismiss Diwali modal
  const btn = await page.$('button:has-text("Continue to Website")');
  if (btn) {
    await btn.click();
    await page.waitForTimeout(1000);
  }

  await page.screenshot({ path: path.join(__dirname, 'live_closetesters_main.png'), fullPage: false });
  await browser.close();
  console.log('CloseTesters main page screenshot captured!');
}

captureCloseTestersMain().catch(console.error);
