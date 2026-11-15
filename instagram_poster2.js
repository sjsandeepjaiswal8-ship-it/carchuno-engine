const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const CREDENTIALS = {
  username: 'closetesters', // or closetesters.labs
  password: 'Closetesters@11'
};

const SCREENSHOTS_DIR = 'C:/Users/HP/Desktop/Diwali_Greetings_2026/automation_logs';

async function runInstagramAutomation() {
  console.log('[Instagram Engine] Launching Chromium browser with human emulation...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: [
      '--start-maximized',
      '--disable-notifications',
      '--no-sandbox'
    ]
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36');

  try {
    console.log('[Instagram Engine] Navigating to Instagram Login...');
    await page.goto('https://www.instagram.com/accounts/login/', { waitUntil: 'networkidle2', timeout: 60000 });
    
    await new Promise(r => setTimeout(r, 4000));

    console.log('[Instagram Engine] Locating username & password inputs...');
    
    // In current Instagram UI, inputs are located via aria-label or input type
    const usernameInput = await page.$('input[aria-label*="username" i], input[aria-label*="Phone" i], input[name="username"], input[type="text"]');
    const passwordInput = await page.$('input[aria-label*="password" i], input[name="password"], input[type="password"]');

    if (!usernameInput || !passwordInput) {
      throw new Error('Could not find Instagram login input fields on page.');
    }

    console.log('[Instagram Engine] Typing username: ' + CREDENTIALS.username);
    await usernameInput.click();
    await usernameInput.type(CREDENTIALS.username, { delay: 100 });
    await new Promise(r => setTimeout(r, 800));

    console.log('[Instagram Engine] Typing password...');
    await passwordInput.click();
    await passwordInput.type(CREDENTIALS.password, { delay: 100 });
    await new Promise(r => setTimeout(r, 1000));

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02_credentials_typed.png') });

    // Click Login Button
    console.log('[Instagram Engine] Submitting Login...');
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) {
      await submitBtn.click();
    } else {
      await page.keyboard.press('Enter');
    }

    console.log('[Instagram Engine] Waiting 10 seconds for Instagram response / 2FA check...');
    await new Promise(r => setTimeout(r, 10000));
    
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03_after_login_submit.png') });

    const currentUrl = page.url();
    console.log('[Instagram Engine] Current URL:', currentUrl);
    
    const pageContent = await page.evaluate(() => document.body.innerText);
    fs.writeFileSync(path.join(SCREENSHOTS_DIR, 'page_text.txt'), pageContent, 'utf8');

    if (pageContent.includes('incorrect') || pageContent.includes('Sorry, your password was incorrect')) {
      console.log('❌ [RESULT] Instagram rejected the password or username.');
    } else if (pageContent.includes('security code') || pageContent.includes('two_factor') || currentUrl.includes('challenge')) {
      console.log('🚨 [RESULT] 2FA / Security Code screen detected! OTP is required.');
    } else {
      console.log('✅ [RESULT] Login proceeded smoothly!');
    }

  } catch (err) {
    console.error('[Instagram Engine Error]:', err.message);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'error_state2.png') }).catch(() => {});
  }
}

runInstagramAutomation();
