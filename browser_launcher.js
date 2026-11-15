/**
 * ==============================================================================
 * Cross-Platform Chromium Discovery & Guaranteed PDF Vector Renderer
 * ==============================================================================
 * Resolves Chrome/Chromium executables cleanly on Windows (Dev/Local) & Linux (Render Cloud).
 * Provides:
 *   1. resolveChromiumPath()
 *   2. launchBrowser() -> Unified browser + engine telemetry
 *   3. renderHtmlToPdfBuffer(html, opts) -> Headless Chrome PDF OR pdfkit binary fallback (%PDF-)
 *   4. renderHtmlToPdfFile(html, outputPath, opts)
 * ==============================================================================
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const PDFDocument = require('pdfkit');

let cachedExecutablePath;

async function resolveChromiumPath() {
  if (cachedExecutablePath !== undefined) return cachedExecutablePath;

  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    process.env.CHROME_PATH,
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
  ].filter(Boolean);

  // Puppeteer v25 executablePath() may return a Promise or a string
  try {
    const puppeteer = require('puppeteer');
    if (puppeteer && typeof puppeteer.executablePath === 'function') {
      const pPath = await Promise.resolve(puppeteer.executablePath());
      if (pPath && typeof pPath === 'string') candidates.push(pPath);
    }
  } catch (_) {}

  // Common Windows Chrome / Edge paths
  candidates.push(
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  );

  // Common Linux / Render Chromium paths
  candidates.push(
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/opt/render/project/.render/chrome/opt/google/chrome/chrome'
  );

  // Scan Puppeteer / Playwright default caches safely without deep node_modules walks
  const cacheDirs = [
    path.join(os.homedir(), '.cache', 'puppeteer', 'chrome'),
    path.join(os.homedir(), '.cache', 'ms-playwright'),
    path.join(os.homedir(), 'AppData', 'Local', 'ms-playwright')
  ];
  for (const dir of cacheDirs) {
    try {
      if (fs.existsSync(dir)) {
        const subdirs = fs.readdirSync(dir);
        for (const sub of subdirs) {
          candidates.push(path.join(dir, sub, 'chrome-win64', 'chrome.exe'));
          candidates.push(path.join(dir, sub, 'chrome-linux', 'chrome'));
          candidates.push(path.join(dir, sub, 'chrome-linux64', 'chrome'));
        }
      }
    } catch (_) {}
  }

  for (const candidate of candidates) {
    try {
      if (candidate && typeof candidate === 'string' && fs.existsSync(candidate)) {
        cachedExecutablePath = candidate;
        return candidate;
      }
    } catch (_) {}
  }

  cachedExecutablePath = null;
  return null;
}

const CHROMIUM_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
  '--disable-extensions'
];

async function launchBrowser() {
  const execPath = await resolveChromiumPath();

  // 1. Try Playwright Chromium with explicit executablePath
  try {
    const { chromium } = require('playwright');
    if (execPath) {
      const browser = await chromium.launch({
        executablePath: execPath,
        headless: true,
        args: CHROMIUM_ARGS
      });
      return { browser, engine: 'playwright-chromium', executablePath: execPath };
    }
    const browser = await chromium.launch({
      headless: true,
      args: CHROMIUM_ARGS
    });
    return { browser, engine: 'playwright-bundled', executablePath: execPath };
  } catch (pwErr) {
    // 2. Try Puppeteer launch fallback
    try {
      const puppeteer = require('puppeteer');
      const launchOpts = { headless: 'new', args: CHROMIUM_ARGS };
      if (execPath) launchOpts.executablePath = execPath;
      const browser = await puppeteer.launch(launchOpts);
      return { browser, engine: 'puppeteer-chromium', executablePath: execPath };
    } catch (puppErr) {
      const err = new Error(`Headless Chromium unavailable (Playwright: ${pwErr.message}; Puppeteer: ${puppErr.message})`);
      err.browserUnavailable = true;
      throw err;
    }
  }
}

/**
 * Guaranteed Binary PDF Vector Dossier Generator via PDFKit
 * Produces crisp, multi-page A4 executive PDF whenever Headless Chrome cannot render PDFs (e.g. Render free tier).
 */
async function generatePdfKitFallbackBuffer(html, opts = {}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 42,
        info: {
          Title: opts.title || 'CloseTesters Enterprise Engineering Dossier',
          Author: 'CloseTesters Labs — Norocos Industries Pvt Ltd',
          Subject: opts.subtitle || 'Empirical QA, Architecture, Security & SEO Audit Report'
        }
      });

      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const structured = opts.structuredData || {};
      const title = structured.title || opts.title || 'CloseTesters Official Engineering Dossier';
      const subtitle = structured.subtitle || opts.subtitle || `Generated ${new Date().toISOString()}`;

      // Dark Navy Executive Banner Header
      doc.rect(0, 0, doc.page.width, 96).fill('#0f172a');
      doc.fillColor('#38bdf8').fontSize(10).font('Helvetica-Bold')
        .text('CLOSETESTERS LABS  •  NOROCOS INDUSTRIES PRIVATE LIMITED', 42, 24);
      doc.fillColor('#ffffff').fontSize(18).font('Helvetica-Bold')
        .text(String(title).slice(0, 90), 42, 42, { width: 510 });
      doc.fillColor('#94a3b8').fontSize(9).font('Helvetica')
        .text(String(subtitle).slice(0, 120), 42, 72, { width: 510 });

      doc.y = 114;

      // Key Metrics Summary Strip if supplied
      if (Array.isArray(structured.metrics) && structured.metrics.length > 0) {
        doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text('Executive Telemetry Snapshot');
        doc.moveDown(0.35);
        for (const m of structured.metrics) {
          doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e293b')
            .text(`${m.label}: `, { continued: true })
            .font('Helvetica').fillColor('#0284c7').text(String(m.value ?? 'N/A'));
        }
        doc.moveDown(0.8);
      }

      // Structured Sections if supplied
      if (Array.isArray(structured.sections) && structured.sections.length > 0) {
        for (const sec of structured.sections) {
          if (doc.y > 710) doc.addPage();
          doc.fillColor('#0369a1').fontSize(12.5).font('Helvetica-Bold')
            .text(String(sec.heading || 'Audit Findings'));
          doc.moveTo(42, doc.y + 2).lineTo(553, doc.y + 2).strokeColor('#cbd5e1').lineWidth(0.75).stroke();
          doc.moveDown(0.4);

          if (sec.summary) {
            doc.fillColor('#334155').fontSize(9.5).font('Helvetica').text(String(sec.summary), { lineGap: 2 });
            doc.moveDown(0.4);
          }
          if (Array.isArray(sec.items)) {
            for (const item of sec.items) {
              if (doc.y > 740) doc.addPage();
              doc.fillColor('#1e293b').fontSize(9.2).font('Helvetica').text(`• ${String(item)}`, { indent: 8, lineGap: 2 });
            }
          }
          doc.moveDown(0.7);
        }
      } else {
        // Fallback: extract clean readable text lines from HTML
        const plain = String(html || '')
          .replace(/<style[\s\S]*?<\/style>/gi, ' ')
          .replace(/<script[\s\S]*?<\/script>/gi, ' ')
          .replace(/<\/(div|p|li|tr|h1|h2|h3|h4|section)>/gi, '\n')
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<[^>]+>/g, ' ')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/[ \t]+/g, ' ')
          .split('\n')
          .map((l) => l.trim())
          .filter((l) => l.length > 2)
          .slice(0, 180);

        for (const line of plain) {
          if (doc.y > 745) doc.addPage();
          const isHeader = line.length < 70 && (line.toUpperCase() === line || line.endsWith(':'));
          doc.font(isHeader ? 'Helvetica-Bold' : 'Helvetica')
            .fontSize(isHeader ? 10.5 : 9.2)
            .fillColor(isHeader ? '#0369a1' : '#1e293b')
            .text(line, { lineGap: 2 });
        }
      }

      // Footer
      if (doc.y > 740) doc.addPage();
      doc.moveDown(1);
      doc.fontSize(8).fillColor('#64748b')
        .text(`Cryptographic Audit Seal • CloseTesters.com • Support: support@closetesters.com • Rendered via PDFKit Vector Engine`, { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

async function renderHtmlToPdfBuffer(html, opts = {}) {
  let browserObj = null;
  try {
    browserObj = await launchBrowser();
    const { browser, engine } = browserObj;

    let buffer;
    if (engine.startsWith('playwright')) {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForFunction(() => window.__MERMAID_DONE__ === undefined || window.__MERMAID_DONE__ === true, { timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(450);
      buffer = await page.pdf({
        format: opts.format || 'A4',
        printBackground: true,
        preferCSSPageSize: true
      });
      await context.close().catch(() => {});
    } else {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForFunction(() => window.__MERMAID_DONE__ === undefined || window.__MERMAID_DONE__ === true, { timeout: 5000 }).catch(() => {});
      await new Promise((r) => setTimeout(r, 450));
      buffer = await page.pdf({
        format: opts.format || 'A4',
        printBackground: true,
        preferCSSPageSize: true
      });
      await page.close().catch(() => {});
    }

    return {
      buffer: Buffer.from(buffer),
      renderer: engine,
      bytes: buffer.length
    };
  } catch (chromeErr) {
    console.warn('[BrowserLauncher] Headless Chromium PDF fallback to PDFKit:', chromeErr.message);
    const buffer = await generatePdfKitFallbackBuffer(html, opts);
    return {
      buffer,
      renderer: 'pdfkit-vector-fallback',
      chromeWarning: chromeErr.message,
      bytes: buffer.length
    };
  } finally {
    if (browserObj?.browser) {
      await browserObj.browser.close().catch(() => {});
    }
  }
}

async function renderHtmlToPdfFile(html, outputPath, opts = {}) {
  const safePath = outputPath || path.join(os.tmpdir(), `closetesters_report_${Date.now()}.pdf`);
  fs.mkdirSync(path.dirname(safePath), { recursive: true });
  const result = await renderHtmlToPdfBuffer(html, opts);
  fs.writeFileSync(safePath, result.buffer);
  return {
    pdfPath: safePath,
    bytes: result.bytes,
    renderer: result.renderer,
    chromeWarning: result.chromeWarning || null
  };
}

module.exports = {
  resolveChromiumPath,
  launchBrowser,
  renderHtmlToPdfBuffer,
  renderHtmlToPdfFile,
  generatePdfKitFallbackBuffer
};
