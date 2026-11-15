const { chromium } = require('playwright');
const path = require('path');

async function captureScreens() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  console.log('Capturing CloseTesters live screenshot...');
  await page.goto('https://closetesters-hub-2026.web.app', { waitUntil: 'networkidle', timeout: 30000 });
  await page.screenshot({ path: path.join(__dirname, 'live_closetesters.png'), fullPage: false });

  console.log('Capturing CarChuno live screenshot...');
  await page.goto('https://carchuno-app.web.app', { waitUntil: 'networkidle', timeout: 30000 });
  await page.screenshot({ path: path.join(__dirname, 'live_carchuno.png'), fullPage: false });

  console.log('Capturing DoctoReports live screenshot...');
  await page.goto('https://doctoreports-9d56e.web.app', { waitUntil: 'networkidle', timeout: 30000 });
  await page.screenshot({ path: path.join(__dirname, 'live_doctoreports.png'), fullPage: false });

  await browser.close();
  console.log('All 3 screenshots saved successfully!');
}

captureScreens().catch(console.error);
