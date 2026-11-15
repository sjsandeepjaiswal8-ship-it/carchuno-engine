const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Starting Hermes Live Deep Audit of https://astromasterpiece.com ...');
  
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe'
  });
  
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 HermesAuditor/2.0'
  });
  
  const page = await context.newPage();
  
  const consoleLogs = [];
  const consoleErrors = [];
  const networkFailures = [];
  
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push({ type: msg.type(), text });
    if (msg.type() === 'error') {
      consoleErrors.push(text);
    }
  });
  
  page.on('pageerror', err => {
    consoleErrors.push('PAGE_ERROR: ' + err.message);
  });
  
  page.on('requestfailed', req => {
    networkFailures.push({
      url: req.url(),
      failure: req.failure() ? req.failure().errorText : 'Unknown failure'
    });
  });

  console.log('📡 Step 1: Navigating to https://astromasterpiece.com ...');
  const response = await page.goto('https://astromasterpiece.com', { waitUntil: 'networkidle', timeout: 45000 });
  console.log(`HTTP Status: ${response.status()}`);
  console.log(`Page Title: "${await page.title()}"`);

  // Wait a few seconds for audio, splash, and initial widgets to settle
  await page.waitForTimeout(3000);

  // Take screenshot of landing
  await page.screenshot({ path: 'C:/Users/HP/Desktop/carchuno-sales-engine/astro_audit_landing.png', fullPage: false });
  console.log('📸 Landing screenshot captured.');

  // Check Local Storage & Session Storage
  const storageData = await page.evaluate(() => {
    return {
      localStorageKeys: Object.keys(localStorage),
      sessionStorageKeys: Object.keys(sessionStorage),
      unlockedFeatures: Object.keys(localStorage).filter(k => k.startsWith('unlocked_')),
      purchases: localStorage.getItem('astro_purchases')
    };
  });
  console.log('📦 Storage Data:', JSON.stringify(storageData));

  // Check if Razorpay SDK script is loaded
  const razorpayLoaded = await page.evaluate(() => typeof window.Razorpay !== 'undefined');
  console.log('💳 Razorpay SDK present on window:', razorpayLoaded);

  // Check Navigation and key buttons/cards
  const navElements = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button, a')).map(el => el.innerText.trim()).filter(Boolean);
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4')).map(el => el.innerText.trim()).filter(Boolean);
    return {
      buttonCount: buttons.length,
      sampleButtons: buttons.slice(0, 15),
      headings: headings.slice(0, 10)
    };
  });
  console.log('🔍 UI Elements Found:', JSON.stringify(navElements, null, 2));

  // Test Payment Modal trigger if available
  console.log('💳 Testing Payment Gateway integration trigger...');
  const paymentTriggerResult = await page.evaluate(() => {
    try {
      // Check if initializeRazorpayPayment or Razorpay exists
      return {
        hasRazorpayObject: typeof window.Razorpay !== 'undefined',
        envRazorpayKey: window.VITE_RAZORPAY_KEY || 'N/A'
      };
    } catch (e) {
      return { error: e.message };
    }
  });
  console.log('Razorpay Window Check:', paymentTriggerResult);

  // Test JaapMala / Pran Pratishtha / Anushthan buttons
  console.log('🕉️ Checking Sacred Features (JaapMala, Pran Pratishtha, Anushthan, Aarti)...');
  const sacredFeaturesCheck = await page.evaluate(() => {
    const textOnPage = document.body.innerText;
    return {
      hasJaapMala: textOnPage.includes('माला') || textOnPage.includes('Jaap') || textOnPage.includes('जाप'),
      hasPranPratishtha: textOnPage.includes('प्राण प्रतिष्ठा') || textOnPage.includes('Pran'),
      hasAnushthan: textOnPage.includes('अनुष्ठान') || textOnPage.includes('हवन'),
      hasAarti: textOnPage.includes('आरती') || textOnPage.includes('Aarti'),
      hasGuruChat: textOnPage.includes('गुरु') || textOnPage.includes('Guru'),
      hasAghori: textOnPage.includes('अघोरी') || textOnPage.includes('Aghori')
    };
  });
  console.log('Sacred Features Visibility:', sacredFeaturesCheck);

  // Print all Console Errors & Network Failures
  console.log('\n================ AUDIT ISSUES LOG ================');
  console.log(`Total Console Errors: ${consoleErrors.length}`);
  consoleErrors.forEach((err, i) => console.log(`  [Error #${i+1}] ${err}`));

  console.log(`\nTotal Network Failures: ${networkFailures.length}`);
  networkFailures.forEach((net, i) => console.log(`  [NetFail #${i+1}] ${net.url} -> ${net.failure}`));

  await browser.close();
  console.log('🏁 Audit Step 1 Complete.');
})();
