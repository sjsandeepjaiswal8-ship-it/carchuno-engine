const { chromium } = require('playwright');
const path = require('path');

(async () => {
  console.log('--- Launching Headless Chrome to verify Tata Safari 360 Live ---');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  console.log('Navigating to https://carchuno-app.web.app ...');
  await page.goto('https://carchuno-app.web.app', { waitUntil: 'networkidle', timeout: 45000 });

  console.log('Page title:', await page.title());

  // Search or select Tata Safari
  // Look for Safari in the car selector or carousel or select dropdown
  console.log('Locating Tata Safari ...');

  // Let's check if there is an input or button for Safari
  const safariButton = page.locator('button:has-text("Safari"), div:has-text("Safari")').first();
  if (await safariButton.count() > 0) {
    console.log('Found Safari element, clicking it...');
    await safariButton.click({ timeout: 5000 }).catch(() => console.log('Click on button was handled'));
  }

  // Look for the 360 button: "360° स्पिन में देखें"
  console.log('Looking for 360 modal trigger button...');
  const spinBtn = page.locator('button:has-text("360° स्पिन में देखें")').first();
  await spinBtn.waitFor({ state: 'visible', timeout: 10000 });
  console.log('Clicking 360 spin button...');
  await spinBtn.click();

  // Wait for 360 modal to appear
  await page.waitForTimeout(2000);

  // Take screenshot of Exterior 360 Modal
  const extShotPath = path.join('C:', 'Users', 'HP', 'Desktop', 'carchuno-sales-engine', 'live_safari_360_exterior.png');
  await page.screenshot({ path: extShotPath, fullPage: false });
  console.log('Saved Exterior screenshot to:', extShotPath);

  // Look for the "🛋️ इंटीरियर पैनोरमा" tab in the 360 modal
  console.log('Switching to Interior 360 view...');
  const interiorTab = page.locator('button:has-text("इंटीरियर पैनोरमा")').first();
  await interiorTab.evaluate(el => el.click());
  await page.waitForTimeout(3000);

  const intShotPath = path.join('C:', 'Users', 'HP', 'Desktop', 'carchuno-sales-engine', 'live_safari_360_interior.png');
  await page.screenshot({ path: intShotPath, fullPage: false });
  console.log('Saved Interior screenshot to:', intShotPath);

  await browser.close();
  console.log('Verification finished successfully!');
})();
