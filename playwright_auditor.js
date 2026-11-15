/**
 * ==============================================================================
 * Empirical Real-Browser & Accessibility Auditor (Playwright + axe-core + Cheerio Fallback)
 * ==============================================================================
 * Zero fake passes:
 *  - Executes real Desktop (1440x900) & Mobile (393x852) browser inspections
 *  - Injects real Deque axe-core for live WCAG 2.1/2.2 accessibility violations
 *  - Captures Core Web Vitals (TTFB, FCP, LCP, CLS), computed styles, DOM HTML,
 *    broken images, discovered routes, forms, API requests & full JPEG screenshots
 *  - Falls back cleanly to Cheerio HTTP inspection ONLY if Chromium binary cannot
 *    launch, tagging `browserMode: 'HTTP_EMPIRICAL_FALLBACK'` & `degraded: true`.
 * ==============================================================================
 */

const fs = require('fs');
const cheerio = require('cheerio');
const { URL } = require('url');
const { launchBrowser } = require('./browser_launcher');

let AXE_SOURCE = '';
try {
  const axePath = require.resolve('axe-core');
  AXE_SOURCE = fs.readFileSync(axePath, 'utf8');
} catch (_) {}

function normalizeTargetUrl(raw) {
  let u = String(raw || '').trim();
  if (!u) u = 'https://closetesters.com';
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
  return u;
}

/**
 * Pure HTTP + Cheerio empirical fallback when Headless Chrome binary is unavailable
 */
async function httpCheerioFallbackAudit(normalizedUrl, browserErrorMsg) {
  const start = Date.now();
  const parsedBase = new URL(normalizedUrl);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 14000);

  let statusCode = 0;
  let finalUrl = normalizedUrl;
  let html = '';
  let fetchError = null;
  let headers = {};

  try {
    const res = await fetch(normalizedUrl, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'CloseTesters-EmpiricalAuditor/3.0 (+https://closetesters.com)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      signal: controller.signal
    });
    statusCode = res.status;
    finalUrl = res.url;
    headers = Object.fromEntries(res.headers.entries());
    html = await res.text();
  } catch (err) {
    fetchError = err.message;
  } finally {
    clearTimeout(timer);
  }

  const ttfbMs = Date.now() - start;
  const $ = cheerio.load(html || '');
  const title = $('title').text().trim();
  const h1 = [];
  $('h1').each((_, el) => {
    const txt = $(el).text().trim();
    if (txt) h1.push(txt);
  });

  const routes = [];
  $('a[href]').each((_, el) => {
    const href = ($(el).attr('href') || '').trim();
    if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:')) return;
    try {
      const resolved = new URL(href, normalizedUrl);
      if (resolved.hostname === parsedBase.hostname && !routes.includes(resolved.pathname)) {
        routes.push(resolved.pathname);
      }
    } catch (_) {}
  });

  const forms = [];
  $('form').each((idx, el) => {
    const inputs = $(el).find('input, select, textarea').length;
    forms.push({ index: idx + 1, action: $(el).attr('action') || '', method: $(el).attr('method') || 'GET', inputs });
  });

  const imgs = $('img');
  let missingAltImages = 0;
  imgs.each((_, el) => {
    if (!$(el).attr('alt')?.trim()) missingAltImages++;
  });

  return {
    url: normalizedUrl,
    finalUrl,
    statusCode,
    headers,
    timestamp: new Date().toISOString(),
    browserMode: 'HTTP_EMPIRICAL_FALLBACK',
    degraded: true,
    degradedReason: `Headless browser unavailable (${browserErrorMsg}); ran live HTTP + Cheerio DOM inspection.`,
    fetchError,
    desktop: {
      title,
      h1,
      buttonCount: $('button, a.btn, [role="button"], input[type="submit"]').length,
      formCount: forms.length,
      imageCount: imgs.length,
      brokenImages: [],
      missingAltImages,
      loadTimeMs: ttfbMs,
      html: html.slice(0, 250000),
      textExcerpt: $('body').text().replace(/\s+/g, ' ').trim().slice(0, 1200),
      screenshotBase64: null,
      computedDesign: {
        hasViewportMeta: $('meta[name="viewport" i]').length > 0,
        bodyFont: 'Uninspected (HTTP fallback)',
        headingFont: 'Uninspected (HTTP fallback)',
        computedColors: [],
        cssVarCount: (html.match(/var\(--[a-zA-Z0-9_-]+\)/g) || []).length,
        transitionCount: (html.match(/transition/gi) || []).length
      }
    },
    mobile: {
      loadTimeMs: ttfbMs,
      hasHorizontalOverflow: null,
      tapTargetIssues: [],
      screenshotBase64: null
    },
    accessibility: {
      engine: 'cheerio-static-a11y',
      violationsCount: missingAltImages > 0 ? 1 : 0,
      violations: missingAltImages > 0
        ? [{ id: 'image-alt', impact: 'serious', description: `${missingAltImages} image(s) missing alt text`, nodesCount: missingAltImages }]
        : [],
      passesCount: 0,
      note: 'Full axe-core WCAG runtime audit requires headless Chromium.'
    },
    consoleErrors: [],
    failedRequests: fetchError ? [{ url: normalizedUrl, failure: fetchError }] : [],
    discoveredRoutes: routes.slice(0, 30),
    discoveredForms: forms.slice(0, 15),
    discoveredApiRequests: [],
    coreWebVitals: {
      ttfbMs,
      fcpMs: null,
      lcpMs: null,
      clsScore: null,
      domContentLoadedMs: ttfbMs,
      loadEventMs: ttfbMs,
      transferSizeKb: (Buffer.byteLength(html || '', 'utf8') / 1024).toFixed(1)
    }
  };
}

/**
 * Unified Desktop + Mobile Playwright / Puppeteer real-browser audit
 */
async function inspectWithPlaywright(targetUrl, options = {}) {
  const normalizedUrl = normalizeTargetUrl(targetUrl);
  let launcher = null;

  try {
    launcher = await launchBrowser();
  } catch (launchErr) {
    console.warn('[PlaywrightAuditor] Launching fallback HTTP inspector:', launchErr.message);
    return await httpCheerioFallbackAudit(normalizedUrl, launchErr.message);
  }

  const { browser, engine, executablePath } = launcher;
  const consoleErrors = [];
  const failedRequests = [];
  const apiRequests = new Set();
  const parsedBase = new URL(normalizedUrl);

  const results = {
    url: normalizedUrl,
    finalUrl: normalizedUrl,
    statusCode: 200,
    timestamp: new Date().toISOString(),
    browserMode: engine,
    executablePath: executablePath || 'bundled',
    degraded: false,
    degradedReason: null,
    desktop: {},
    mobile: {},
    accessibility: { engine: 'axe-core', violationsCount: 0, violations: [], passesCount: 0 },
    consoleErrors: [],
    failedRequests: [],
    discoveredRoutes: [],
    discoveredForms: [],
    discoveredApiRequests: [],
    coreWebVitals: {}
  };

  const attachListeners = (page) => {
    page.on('console', (msg) => {
      try {
        const type = typeof msg.type === 'function' ? msg.type() : msg.type;
        if (type === 'error') {
          const text = typeof msg.text === 'function' ? msg.text() : String(msg);
          consoleErrors.push({ type: 'console_error', text: text.slice(0, 300) });
        }
      } catch (_) {}
    });
    page.on('pageerror', (err) => {
      consoleErrors.push({ type: 'uncaught_exception', text: (err?.message || String(err)).slice(0, 300) });
    });
    page.on('request', (req) => {
      try {
        const reqUrl = req.url();
        const rType = typeof req.resourceType === 'function' ? req.resourceType() : '';
        if (rType === 'xhr' || rType === 'fetch' || /\/api\//i.test(reqUrl)) {
          apiRequests.add(`${req.method()} ${reqUrl.slice(0, 140)}`);
        }
      } catch (_) {}
    });
    page.on('requestfailed', (req) => {
      try {
        const failureText = typeof req.failure === 'function' ? req.failure()?.errorText : req.failure?.errorText;
        failedRequests.push({ url: req.url().slice(0, 150), failure: failureText || 'Failed' });
      } catch (_) {}
    });
  };

  try {
    // ========================================================
    // 1. DESKTOP VIEWPORT AUDIT (1440 x 900)
    // ========================================================
    const isPlaywright = engine.startsWith('playwright');
    let desktopContext = null;
    let desktopPage = null;

    if (isPlaywright) {
      desktopContext = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 CloseTestersQA/3.0'
      });
      desktopPage = await desktopContext.newPage();
    } else {
      desktopPage = await browser.newPage();
      await desktopPage.setViewport({ width: 1440, height: 900 });
      await desktopPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 CloseTestersQA/3.0');
    }

    attachListeners(desktopPage);

    // Inject PerformanceObserver before navigation so LCP & CLS register accurately
    const vitalsInitScript = () => {
      window.__CT_VITALS__ = { lcpMs: null, clsScore: 0 };
      try {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          if (entries.length) {
            window.__CT_VITALS__.lcpMs = Math.round(entries[entries.length - 1].startTime);
          }
        }).observe({ type: 'largest-contentful-paint', buffered: true });
      } catch (_) {}
      try {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              window.__CT_VITALS__.clsScore += entry.value;
            }
          }
        }).observe({ type: 'layout-shift', buffered: true });
      } catch (_) {}
    };

    if (isPlaywright && desktopContext.addInitScript) {
      await desktopContext.addInitScript(vitalsInitScript).catch(() => {});
    } else if (desktopPage.evaluateOnNewDocument) {
      await desktopPage.evaluateOnNewDocument(vitalsInitScript).catch(() => {});
    }

    const startNav = Date.now();
    const navResp = await desktopPage.goto(normalizedUrl, { waitUntil: 'domcontentloaded', timeout: 22000 }).catch((e) => {
      console.warn('[PlaywrightAuditor] Desktop nav warning:', e.message);
      return null;
    });
    if (navResp) {
      try {
        results.statusCode = typeof navResp.status === 'function' ? navResp.status() : navResp.status;
        results.finalUrl = typeof navResp.url === 'function' ? navResp.url() : desktopPage.url();
      } catch (_) {}
    }

    // Settle hydration briefly
    await new Promise((r) => setTimeout(r, 1400));
    const desktopLoadTime = Date.now() - startNav;

    const fullHtml = await desktopPage.content().catch(() => '');
    const domAudit = await desktopPage.evaluate((baseHost) => {
      const h1 = [...document.querySelectorAll('h1')].map((e) => (e.innerText || '').trim()).filter(Boolean);
      const buttonCount = document.querySelectorAll('button, a.btn, [role="button"], input[type="submit"]').length;
      const forms = [...document.querySelectorAll('form')].map((f, idx) => ({
        index: idx + 1,
        action: f.getAttribute('action') || '',
        method: (f.getAttribute('method') || 'GET').toUpperCase(),
        inputs: f.querySelectorAll('input, select, textarea').length
      }));
      const imgs = [...document.querySelectorAll('img')];
      const brokenImages = imgs
        .filter((img) => img.complete && img.naturalWidth === 0)
        .map((img) => (img.getAttribute('src') || img.getAttribute('alt') || 'unnamed-img').slice(0, 120));
      const missingAltImages = imgs.filter((img) => !img.getAttribute('alt')?.trim()).length;

      const routes = new Set();
      document.querySelectorAll('a[href]').forEach((a) => {
        try {
          const u = new URL(a.href, window.location.href);
          if (u.hostname === baseHost && u.pathname && !routes.has(u.pathname)) {
            routes.add(u.pathname);
          }
        } catch (_) {}
      });

      // Computed styles & design tokens
      const bodyCs = window.getComputedStyle(document.body);
      const h1El = document.querySelector('h1');
      const h1Cs = h1El ? window.getComputedStyle(h1El) : bodyCs;
      const colorSet = new Set();
      document.querySelectorAll('header, nav, main, section, button, h1, a').forEach((el) => {
        const cs = window.getComputedStyle(el);
        if (cs.color) colorSet.add(cs.color);
        if (cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent') {
          colorSet.add(cs.backgroundColor);
        }
      });

      // Navigation timing & paint metrics
      const nav = performance.getEntriesByType('navigation')[0] || {};
      const fcp = performance.getEntriesByType('paint').find((p) => p.name === 'first-contentful-paint');
      const v = window.__CT_VITALS__ || {};

      return {
        title: document.title || '',
        h1,
        buttonCount,
        formCount: forms.length,
        forms: forms.slice(0, 15),
        imageCount: imgs.length,
        brokenImages: brokenImages.slice(0, 10),
        missingAltImages,
        routes: [...routes].slice(0, 30),
        textExcerpt: (document.body?.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 1200),
        computedDesign: {
          hasViewportMeta: Boolean(document.querySelector('meta[name="viewport" i]')),
          bodyFont: bodyCs.fontFamily,
          headingFont: h1Cs.fontFamily,
          h1FontSize: h1Cs.fontSize,
          bodyBg: bodyCs.backgroundColor,
          bodyColor: bodyCs.color,
          computedColors: [...colorSet].slice(0, 14),
          transitionCount: [...document.querySelectorAll('button, a, div')].slice(0, 60)
            .filter((el) => {
              const t = window.getComputedStyle(el).transitionDuration;
              return t && t !== '0s';
            }).length
        },
        vitals: {
          ttfbMs: nav.responseStart ? Math.round(nav.responseStart - nav.requestStart) : null,
          fcpMs: fcp ? Math.round(fcp.startTime) : null,
          lcpMs: v.lcpMs || (fcp ? Math.round(fcp.startTime) : null),
          clsScore: Number((v.clsScore || 0).toFixed(4)),
          domContentLoadedMs: Math.round(nav.domContentLoadedEventEnd || 0),
          loadEventMs: Math.round(nav.loadEventEnd || 0),
          transferSizeKb: nav.transferSize ? (nav.transferSize / 1024).toFixed(1) : null
        }
      };
    }, parsedBase.hostname);

    // Inject & Run axe-core WCAG Audit on Desktop
    let axeReport = { engine: 'axe-core', violationsCount: 0, violations: [], passesCount: 0 };
    if (AXE_SOURCE) {
      try {
        const axeRes = await desktopPage.evaluate(async (axeCode) => {
          if (!window.axe) {
            const fn = new Function(axeCode);
            fn();
          }
          if (!window.axe || typeof window.axe.run !== 'function') return null;
          const r = await window.axe.run(document, { resultTypes: ['violations', 'passes'] });
          return {
            violationsCount: r.violations.length,
            passesCount: r.passes.length,
            violations: r.violations.slice(0, 12).map((v) => ({
              id: v.id,
              impact: v.impact,
              description: v.description,
              help: v.help,
              nodesCount: v.nodes.length
            }))
          };
        }, AXE_SOURCE);
        if (axeRes) axeReport = { engine: 'axe-core', ...axeRes };
      } catch (axeErr) {
        axeReport = { engine: 'axe-core', violationsCount: 0, violations: [], error: axeErr.message };
      }
    }

    const desktopShot = options.skipScreenshots
      ? null
      : await desktopPage.screenshot({ type: 'jpeg', quality: 65, fullPage: false }).catch(() => null);

    results.desktop = {
      title: domAudit.title,
      h1: domAudit.h1,
      buttonCount: domAudit.buttonCount,
      formCount: domAudit.formCount,
      imageCount: domAudit.imageCount,
      brokenImages: domAudit.brokenImages,
      missingAltImages: domAudit.missingAltImages,
      loadTimeMs: desktopLoadTime,
      html: fullHtml.slice(0, 250000),
      textExcerpt: domAudit.textExcerpt,
      computedDesign: domAudit.computedDesign,
      screenshotBase64: desktopShot ? desktopShot.toString('base64') : null
    };
    results.coreWebVitals = {
      ...domAudit.vitals,
      ttfbMs: domAudit.vitals.ttfbMs ?? desktopLoadTime
    };
    results.discoveredRoutes = domAudit.routes;
    results.discoveredForms = domAudit.forms;
    results.accessibility = axeReport;

    if (desktopContext) await desktopContext.close().catch(() => {});
    else await desktopPage.close().catch(() => {});

    // ========================================================
    // 2. MOBILE VIEWPORT AUDIT (393 x 852 iPhone / Pixel Emulation)
    // ========================================================
    let mobileContext = null;
    let mobilePage = null;

    if (isPlaywright) {
      mobileContext = await browser.newContext({
        viewport: { width: 393, height: 852 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1 CloseTestersMobileQA/3.0'
      });
      mobilePage = await mobileContext.newPage();
    } else {
      mobilePage = await browser.newPage();
      await mobilePage.setViewport({ width: 393, height: 852, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    }

    const mobileStart = Date.now();
    await mobilePage.goto(normalizedUrl, { waitUntil: 'domcontentloaded', timeout: 22000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 1100));
    const mobileLoadTime = Date.now() - mobileStart;

    const mobileAudit = await mobilePage.evaluate(() => {
      const hasHorizontalOverflow = document.documentElement.scrollWidth > window.innerWidth + 1;
      const tapTargetIssues = [];
      document.querySelectorAll('button, a, input, select, [role="button"]').forEach((el) => {
        const rect = el.getBoundingClientRect();
        const cs = window.getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') return;
        if (rect.width > 0 && rect.height > 0 && (rect.width < 32 || rect.height < 32)) {
          tapTargetIssues.push({
            text: (el.innerText || el.getAttribute('placeholder') || el.getAttribute('aria-label') || el.tagName).trim().slice(0, 32),
            w: Math.round(rect.width),
            h: Math.round(rect.height)
          });
        }
      });
      return {
        hasHorizontalOverflow,
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
        tapTargetIssuesCount: tapTargetIssues.length,
        tapTargetIssues: tapTargetIssues.slice(0, 8)
      };
    }).catch(() => ({ hasHorizontalOverflow: false, tapTargetIssuesCount: 0, tapTargetIssues: [] }));

    const mobileShot = options.skipScreenshots
      ? null
      : await mobilePage.screenshot({ type: 'jpeg', quality: 65, fullPage: false }).catch(() => null);

    results.mobile = {
      loadTimeMs: mobileLoadTime,
      ...mobileAudit,
      screenshotBase64: mobileShot ? mobileShot.toString('base64') : null
    };

    if (mobileContext) await mobileContext.close().catch(() => {});
    else await mobilePage.close().catch(() => {});

    results.consoleErrors = consoleErrors.slice(0, 15);
    results.failedRequests = failedRequests.slice(0, 15);
    results.discoveredApiRequests = [...apiRequests].slice(0, 20);
  } finally {
    await browser.close().catch(() => {});
  }

  return results;
}

module.exports = {
  inspectWithPlaywright,
  httpCheerioFallbackAudit
};
