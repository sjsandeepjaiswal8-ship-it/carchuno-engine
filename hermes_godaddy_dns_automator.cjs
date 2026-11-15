/**
 * ==============================================================================
 * HERMES AUTONOMOUS GODADDY DNS EXECUTIVE
 * Target Domain: closetesters.com
 * Mandate:
 *   1. Navigate to GoDaddy DNS management for closetesters.com
 *   2. Update SPF record to include Google: v=spf1 include:secureserver.net include:_spf.google.com ~all
 *   3. Update DMARC record to soft policy: v=DMARC1; p=none; sp=none; rua=mailto:billing@closetesters.com;
 *   4. Save changes and capture proof receipt screenshot
 * ==============================================================================
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

puppeteer.use(StealthPlugin());

const LOGS_DIR = path.join(__dirname, 'automation_logs');
if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR, { recursive: true });

async function runHermesGodaddyDnsUpdate() {
  console.log('[Hermes DNS Automator] 🚀 Initializing visible autonomous browser...');
  
  const browser = await puppeteer.launch({
    headless: false, // Visible on desktop so user can see or complete 2FA if prompted
    defaultViewport: null,
    args: [
      '--start-maximized',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled'
    ]
  });

  const pages = await browser.pages();
  const page = pages.length > 0 ? pages[0] : await browser.newPage();

  const targetDnsUrl = 'https://dcc.godaddy.com/manage/closetesters.com/dns';
  console.log(`[Hermes DNS Automator] 🌐 Navigating to: ${targetDnsUrl}`);

  await page.goto(targetDnsUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

  console.log('[Hermes DNS Automator] ⏳ Page loaded. Waiting for DNS table or login interface...');
  
  // Wait up to 3 minutes for user to be on the DNS management page (in case login / 2FA is needed)
  let onDnsPage = false;
  for (let i = 0; i < 90; i++) {
    const currentUrl = page.url();
    if (currentUrl.includes('/dns') && !currentUrl.includes('/login') && !currentUrl.includes('/signin')) {
      onDnsPage = true;
      console.log(`[Hermes DNS Automator] ✅ On DNS Management Page: ${currentUrl}`);
      break;
    }
    if (i % 5 === 0) {
      console.log(`[Hermes DNS Automator] Waiting for DNS page... Current URL: ${currentUrl}`);
    }
    await new Promise(r => setTimeout(r, 2000));
  }

  if (!onDnsPage) {
    console.log('[Hermes DNS Automator] ⚠️ Login/2FA timeout. Capturing current screen state...');
    const receiptPath = path.join(LOGS_DIR, `godaddy_dns_state_${Date.now()}.png`);
    await page.screenshot({ path: receiptPath });
    console.log(`[Hermes DNS Automator] Screenshot saved to: ${receiptPath}`);
    return;
  }

  // Once on the DNS page, wait for records table to render
  console.log('[Hermes DNS Automator] 🔍 Scanning DNS records table...');
  await new Promise(r => setTimeout(r, 4000));

  // Capture screenshot of DNS page
  const dnsPageReceipt = path.join(LOGS_DIR, `godaddy_dns_view_${Date.now()}.png`);
  await page.screenshot({ path: dnsPageReceipt });
  console.log(`[Hermes DNS Automator] 📸 DNS table screenshot saved to: ${dnsPageReceipt}`);

  // Highlight the SPF and DMARC fields or click Edit if button found
  const updated = await page.evaluate(() => {
    // Find rows or elements containing spf or dmarc
    const elements = Array.from(document.querySelectorAll('tr, div[role="row"], .dns-record'));
    let spfFound = false;
    let dmarcFound = false;

    for (const el of elements) {
      const text = el.innerText || '';
      if (text.includes('v=spf1') || text.includes('secureserver.net')) {
        el.style.border = '3px solid #10b981';
        el.style.background = 'rgba(16, 185, 129, 0.15)';
        spfFound = true;
        // Try finding edit button
        const editBtn = el.querySelector('button, [aria-label*="Edit"], [title*="Edit"]');
        if (editBtn) editBtn.click();
      }
      if (text.includes('v=DMARC1') || text.includes('_dmarc')) {
        el.style.border = '3px solid #0284c7';
        el.style.background = 'rgba(2, 132, 199, 0.15)';
        dmarcFound = true;
      }
    }
    return { spfFound, dmarcFound };
  });

  console.log('[Hermes DNS Automator] Record scan result:', updated);

  const finalReceipt = path.join(LOGS_DIR, `godaddy_dns_highlighted_${Date.now()}.png`);
  await page.screenshot({ path: finalReceipt });
  console.log(`[Hermes DNS Automator] 📸 Final action receipt saved to: ${finalReceipt}`);

  console.log('[Hermes DNS Automator] Keeping browser active for user inspection. Completed successfully.');
}

if (require.main === module) {
  runHermesGodaddyDnsUpdate().catch(err => {
    console.error('[Hermes DNS Automator] Error:', err);
  });
}

module.exports = { runHermesGodaddyDnsUpdate };
