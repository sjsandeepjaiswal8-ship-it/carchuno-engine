const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const CREDENTIALS = {
  username: 'closetesters', // or closetesters.labs
  password: 'Closetesters@11'
};

const SCREENSHOTS_DIR = 'C:/Users/HP/Desktop/Diwali_Greetings_2026/automation_logs';
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function runInstagramAutomation() {
  console.log('[Instagram Engine] Launching Chromium browser with human emulation...');
  
  const browser = await puppeteer.launch({
    headless: false, // Visible so user can see or solve captcha/OTP if prompted
    defaultViewport: null,
    args: [
      '--start-maximized',
      '--disable-notifications',
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

  const page = await browser.newPage();
  
  // Set realistic User-Agent
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36');

  try {
    console.log('[Instagram Engine] Navigating to Instagram Login...');
    await page.goto('https://www.instagram.com/accounts/login/', { waitUntil: 'networkidle2', timeout: 60000 });
    
    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01_login_page.png') });

    // Handle cookie banners if present
    const cookieButtons = await page.$$('button');
    for (const btn of cookieButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && (text.includes('Allow all') || text.includes('Accept') || text.includes('Only essential'))) {
        await btn.click();
        await new Promise(r => setTimeout(r, 1500));
        break;
      }
    }

    console.log('[Instagram Engine] Entering credentials for ClosTesters...');
    await page.waitForSelector('input[name="username"]', { timeout: 15000 });
    
    // Type slowly like a human
    await page.type('input[name="username"]', CREDENTIALS.username, { delay: 120 });
    await new Promise(r => setTimeout(r, 800));
    await page.type('input[name="password"]', CREDENTIALS.password, { delay: 100 });
    await new Promise(r => setTimeout(r, 1200));

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02_credentials_typed.png') });

    // Click Login
    console.log('[Instagram Engine] Submitting login form...');
    const loginBtn = await page.$('button[type="submit"]');
    if (loginBtn) {
      await loginBtn.click();
    }

    // Wait for response / navigation
    console.log('[Instagram Engine] Waiting for Instagram response...');
    await new Promise(r => setTimeout(r, 8000));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03_after_login_submit.png') });

    const currentUrl = page.url();
    console.log('[Instagram Engine] Current URL after login:', currentUrl);

    // Check if OTP / 2FA screen appeared
    const bodyText = await page.evaluate(() => document.body.innerText);
    if (bodyText.includes('security code') || bodyText.includes('confirmation code') || bodyText.includes('Enter the code') || currentUrl.includes('two_factor') || currentUrl.includes('challenge')) {
      console.log('🚨 [ACTION REQUIRED] Instagram triggered Security Verification / OTP screen.');
      console.log('Please check your phone/email for the OTP and supply it.');
    } else if (bodyText.includes('incorrect') || bodyText.includes('Sorry, your password was incorrect')) {
      console.log('❌ [AUTH ERROR] Password or Username rejected by Instagram.');
    } else {
      console.log('✅ [SUCCESS] Logged in or proceeded to next screen.');
    }

  } catch (err) {
    console.error('[Instagram Engine Error]:', err.message);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'error_state.png') }).catch(() => {});
  }
}

runInstagramAutomation();
