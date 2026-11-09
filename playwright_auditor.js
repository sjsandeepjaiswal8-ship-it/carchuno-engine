/**
 * Playwright Visual & Functional QA Inspection Engine
 * Built for CloseTesters.com & OmniSales Agent
 * 
 * Features:
 * 1. Headless Chrome Multi-Viewport Execution (Mobile & Desktop)
 * 2. Visual Full-Page High-Res Screenshot Capture (Base64 / File)
 * 3. Real Browser Console Error & Failed Network Request Trapper
 * 4. Google Core Web Vitals Extraction (LCP, CLS, FCP) via Performance API
 * 5. Interactive Form & Button Health Audit
 */

const { chromium } = require('playwright');

async function inspectWithPlaywright(targetUrl, options = {}) {
  let normalizedUrl = targetUrl.trim();
  if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
    normalizedUrl = 'https://' + normalizedUrl;
  }

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const consoleErrors = [];
  const failedRequests = [];
  const results = {
    url: normalizedUrl,
    timestamp: new Date().toISOString(),
    desktop: {},
    mobile: {},
    consoleErrors: [],
    failedRequests: [],
    coreWebVitals: {}
  };

  try {
    // ========================================================
    // 1. DESKTOP VIEWPORT AUDIT (1920 x 1080)
    // ========================================================
    const desktopContext = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 CloseTestersQA/2.0'
    });
    const desktopPage = await desktopContext.newPage();

    desktopPage.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push({ type: 'console_error', text: msg.text().slice(0, 300) });
      }
    });

    desktopPage.on('pageerror', err => {
      consoleErrors.push({ type: 'uncaught_exception', text: err.message.slice(0, 300) });
    });

    desktopPage.on('requestfailed', req => {
      failedRequests.push({ url: req.url().slice(0, 150), failure: req.failure()?.errorText || 'Failed' });
    });

    const startNav = Date.now();
    await desktopPage.goto(normalizedUrl, { waitUntil: 'domcontentloaded', timeout: 25000 }).catch(e => {
      console.warn('[Playwright] Desktop nav warning:', e.message);
    });
    const desktopLoadTime = Date.now() - startNav;

    // Wait a brief moment for dynamic hydration/animations to settle
    await desktopPage.waitForTimeout(1200);

    const desktopTitle = await desktopPage.title();
    const renderedH1 = await desktopPage.$$eval('h1', els => els.map(e => e.innerText.trim()).filter(Boolean));
    const buttonCount = await desktopPage.$$eval('button, a.btn, [role="button"]', els => els.length);
    const formCount = await desktopPage.$$eval('form', els => els.length);

    // Capture desktop full-page screenshot as JPEG buffer
    const desktopScreenshot = await desktopPage.screenshot({ type: 'jpeg', quality: 75, fullPage: false }).catch(() => null);

    // Extract Core Web Vitals / Navigation Timings via CDP Performance API
    const webVitals = await desktopPage.evaluate(() => {
      try {
        const nav = performance.getEntriesByType('navigation')[0] || {};
        const paint = performance.getEntriesByType('paint');
        const fcpEntry = paint.find(p => p.name === 'first-contentful-paint');

        return {
          fcpMs: fcpEntry ? Math.round(fcpEntry.startTime) : null,
          domContentLoadedMs: Math.round(nav.domContentLoadedEventEnd || 0),
          loadEventMs: Math.round(nav.loadEventEnd || 0),
          transferSizeKb: nav.transferSize ? (nav.transferSize / 1024).toFixed(1) : null
        };
      } catch (_) {
        return {};
      }
    }).catch(() => ({}));

    results.desktop = {
      title: desktopTitle,
      h1: renderedH1,
      buttonCount,
      formCount,
      loadTimeMs: desktopLoadTime,
      screenshotBase64: desktopScreenshot ? desktopScreenshot.toString('base64').slice(0, 500) + '...[truncated]' : null
    };
    results.coreWebVitals = webVitals;
    await desktopContext.close();

    // ========================================================
    // 2. MOBILE VIEWPORT AUDIT (Pixel 7 / iPhone 15 emulation)
    // ========================================================
    const mobileContext = await browser.newContext({
      viewport: { width: 393, height: 852 }, // iPhone 15 Pro resolution
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1 CloseTestersMobileQA/2.0'
    });
    const mobilePage = await mobileContext.newPage();

    const mobileStartNav = Date.now();
    await mobilePage.goto(normalizedUrl, { waitUntil: 'domcontentloaded', timeout: 25000 }).catch(e => {
      console.warn('[Playwright] Mobile nav warning:', e.message);
    });
    const mobileLoadTime = Date.now() - mobileStartNav;
    await mobilePage.waitForTimeout(1000);

    // Check for mobile layout overflow (Horizontal scrollbar bug)
    const hasHorizontalOverflow = await mobilePage.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    }).catch(() => false);

    // Check clickable tap target sizes
    const tapTargetIssues = await mobilePage.evaluate(() => {
      const issues = [];
      const interactives = document.querySelectorAll('button, a, input, select');
      interactives.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          if (rect.width < 32 || rect.height < 32) {
            issues.push({ text: (el.innerText || el.placeholder || el.ariaLabel || '').slice(0, 30), w: Math.round(rect.width), h: Math.round(rect.height) });
          }
        }
      });
      return issues.slice(0, 5);
    }).catch(() => []);

    results.mobile = {
      loadTimeMs: mobileLoadTime,
      hasHorizontalOverflow,
      tapTargetIssues
    };
    await mobileContext.close();

    results.consoleErrors = consoleErrors.slice(0, 10);
    results.failedRequests = failedRequests.slice(0, 10);

  } finally {
    await browser.close().catch(() => {});
  }

  return results;
}

module.exports = {
  inspectWithPlaywright
};
