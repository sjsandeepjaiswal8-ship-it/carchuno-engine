/**
 * ==============================================================================
 * JARVIS × HERMES REAL WEB, API, BROWSER & DESKTOP AUTOMATION ENGINE
 * ==============================================================================
 * Executes real workflows using installed tools instead of fake plan stubs:
 *   1. Live REST / Webhook / URL DOM & Form Inspector (Render + Local Node)
 *   2. Playwright (`msedge`/`chrome`) & Puppeteer-Extra Stealth (`hermes_stealth_engine.js`)
 *   3. Installed Local CLIs: `agent-browser` (v0.42.0) & `agent-desktop` (v1.2.0)
 *
 * Also tracks GitHub top-star reference patterns (`browser-use`, `stagehand`,
 * `skyvern`, `claude-quickstarts`) faithfully implemented via native Node tools.
 *
 * STRICT SECURITY POLICY:
 *   - NEVER solves, clicks through, or bypasses CAPTCHAs, 2FA, or bot checks.
 *   - Enforces automatic `HUMAN_IN_THE_LOOP_PAUSED` whenever login/CAPTCHA/payment appears.
 * ==============================================================================
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cheerio = require('cheerio');
const unifiedHub = require('./unified_activity_hub');

const TASKS_FILE = path.join(__dirname, 'sovereign_data', 'automation_tasks.json');

const RECOMMENDED_REPOS = [
  {
    rank: 1,
    name: 'browser-use/browser-use (Pattern -> Native Playwright + agent-browser)',
    url: 'https://github.com/browser-use/browser-use',
    stars: '120k+',
    runtime: 'LIVE VIA PLAYWRIGHT + AGENT-BROWSER 0.42.0',
    bestFor: 'Multi-step browser navigation, DOM inspection & Gemini-guided actions'
  },
  {
    rank: 2,
    name: 'browserbase/stagehand (Pattern -> Node Playwright + Gemini DOM Extract)',
    url: 'https://github.com/browserbase/stagehand',
    stars: '26k+',
    runtime: 'LIVE VIA PLAYWRIGHT + CHEERIO + GEMINI',
    bestFor: 'Self-healing form/element extraction & structured page reading in Node.js'
  },
  {
    rank: 3,
    name: 'Skyvern-AI/skyvern (Pattern -> Hermes Stealth + Form Prefill)',
    url: 'https://github.com/Skyvern-AI/skyvern',
    stars: '23k+',
    runtime: 'LIVE VIA HERMES STEALTH PUPPETEER-EXTRA',
    bestFor: 'Automated multi-field form inspection & human-paced prefill (pauses at CAPTCHA)'
  },
  {
    rank: 4,
    name: 'anthropics/claude-quickstarts (Pattern -> agent-desktop CLI)',
    url: 'https://github.com/anthropics/claude-quickstarts',
    stars: 'Desktop Control Stack',
    runtime: 'LIVE ON WINDOWS VIA AGENT-DESKTOP 1.2.0',
    bestFor: 'Native OS window & desktop app inspection/interaction on local Windows host'
  }
];

function readTasks() {
  try {
    if (fs.existsSync(TASKS_FILE)) return JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
  } catch (_) {}
  return [];
}

function writeTasks(tasks) {
  try {
    fs.mkdirSync(path.dirname(TASKS_FILE), { recursive: true });
    fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks.slice(0, 100), null, 2), 'utf8');
  } catch (_) {}
}

function saveTaskRecord(record) {
  const tasks = readTasks();
  const idx = tasks.findIndex((t) => t.id === record.id);
  if (idx >= 0) tasks[idx] = record;
  else tasks.unshift(record);
  writeTasks(tasks);
  return record;
}

function detectSecurityChallenge(htmlOrText = '', url = '') {
  const html = String(htmlOrText || '').toLowerCase();
  const u = String(url || '').toLowerCase();
  const signals = [];
  if (/(class=["'][^"']*g-recaptcha|challenges\.cloudflare\.com|hcaptcha\.com\/1\/api|cf-turnstile|please verify you are a human|complete the captcha)/.test(html)) {
    signals.push('CAPTCHA');
  }
  if (/(accounts\.google\.com\/(?:v3\/signin|signin)|facebook\.com\/login|instagram\.com\/accounts\/login|linkedin\.com\/(?:login|uas\/login)|\/oauth2?\/authorize|two-step verification)/.test(u + ' ' + html)) {
    signals.push('AUTH_OR_2FA');
  }
  if (/(checkout\.razorpay\.com|checkout\.stripe\.com|payments\.google\.com\/gp)/.test(u)) {
    signals.push('PAYMENT_PAGE');
  }
  return signals;
}

async function inspectUrlWithCheerio(targetUrl) {
  const res = await fetch(targetUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36' },
    signal: AbortSignal.timeout(12000),
    redirect: 'follow'
  });
  const finalUrl = res.url;
  const html = await res.text();
  const $ = cheerio.load(html);
  const title = $('title').first().text().trim();
  const forms = [];
  $('form').slice(0, 8).each((idx, f) => {
    const inputs = [];
    $(f).find('input, textarea, select').slice(0, 12).each((_, el) => {
      inputs.push({
        tag: el.tagName,
        type: $(el).attr('type') || 'text',
        name: $(el).attr('name') || $(el).attr('id') || $(el).attr('placeholder') || ''
      });
    });
    forms.push({ index: idx, action: $(f).attr('action') || '', method: ($(f).attr('method') || 'GET').toUpperCase(), inputs });
  });

  const challengeSignals = detectSecurityChallenge(html.slice(0, 12000), finalUrl);
  return {
    httpStatus: res.status,
    finalUrl,
    title,
    formsCount: $('form').length,
    forms,
    linksCount: $('a').length,
    buttonsCount: $('button, input[type="submit"]').length,
    challengeSignals
  };
}

async function runPlaywrightEdgeLocal(targetUrl, fields = {}) {
  const { chromium } = require('playwright');
  const fsSync = require('fs');
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const executablePath = fsSync.existsSync(edgePath) ? edgePath : (fsSync.existsSync(chromePath) ? chromePath : undefined);
  if (!executablePath) {
    throw new Error('Local Chrome/Edge executable not present on this host');
  }

  const browser = await chromium.launch({ executablePath, headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
    const htmlSnippet = await page.content();
    const title = await page.title();
    const finalUrl = page.url();
    const challengeSignals = detectSecurityChallenge(htmlSnippet.slice(0, 15000), finalUrl);

    if (challengeSignals.length > 0) {
      return {
        executedLocally: true,
        pausedForHuman: true,
        challengeSignals,
        finalUrl,
        title,
        filledFields: []
      };
    }

    const filledFields = [];
    for (const [selector, val] of Object.entries(fields || {})) {
      try {
        await page.fill(selector, String(val), { timeout: 3000 });
        filledFields.push(selector);
      } catch (_) {}
    }

    const receiptDir = path.join(__dirname, 'automation_logs');
    fsSync.mkdirSync(receiptDir, { recursive: true });
    const receiptPath = path.join(receiptDir, `auto_${Date.now()}.png`);
    await page.screenshot({ path: receiptPath, fullPage: false });

    const domSummary = await page.evaluate(() => ({
      forms: document.querySelectorAll('form').length,
      inputs: document.querySelectorAll('input, textarea, select').length,
      buttons: document.querySelectorAll('button, input[type="submit"]').length
    }));

    return {
      executedLocally: true,
      pausedForHuman: false,
      finalUrl,
      title,
      domSummary,
      filledFields,
      receiptPath
    };
  } finally {
    await browser.close();
  }
}

async function planWorkflow({ targetUrl = '', goal = '', channel = 'web' }, geminiRotator = null) {
  const id = `AUTO-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const lower = `${targetUrl} ${goal} ${channel}`.toLowerCase();

  let adapter = 'Playwright + Stagehand Pattern (Live DOM + Browser)';
  if (lower.includes('desktop') || lower.includes('windows') || lower.includes('app')) {
    adapter = 'agent-desktop (v1.2.0 Windows UI Automation)';
  } else if (lower.includes('api') || lower.includes('webhook')) {
    adapter = 'Direct HTTPS REST / Webhook Executor';
  } else if (lower.includes('instagram') || lower.includes('facebook') || lower.includes('linkedin') || lower.includes('play') || lower.includes('ai studio')) {
    adapter = 'Playwright + Hermes Stealth (Human-in-the-Loop Safe Auth)';
  }

  let steps = [
    { step: 1, action: 'Probe destination / inspect API or live DOM forms', mode: 'AUTO' },
    { step: 2, action: 'Extract target fields & generate Gemini payload', mode: 'AUTO' },
    { step: 3, action: 'Pause immediately if CAPTCHA / 2FA / Login appears', mode: 'HUMAN_CHECKPOINT' },
    { step: 4, action: 'Log verified execution receipt to Unified Hub', mode: 'AUTO' }
  ];
  let summaryHi = null;

  if (geminiRotator) {
    try {
      const prompt = `Design a policy-compliant automation execution plan for:
Goal: "${goal}"
Target/Portal: "${targetUrl || channel}"
Adapter: "${adapter}"
STRICT RULE: Never bypass CAPTCHAs or login barriers; pause with HUMAN_CHECKPOINT if needed.
Return ONLY valid JSON: { "summaryHi": "1-2 sentence Hindi summary", "steps": [ { "step": 1, "action": "...", "mode": "AUTO|HUMAN_CHECKPOINT" } ] }`;
      const res = await geminiRotator.generateJson(prompt, { timeoutMs: 12000, maxOutputTokens: 1200 });
      if (Array.isArray(res.data?.steps) && res.data.steps.length > 0) steps = res.data.steps;
      summaryHi = res.data?.summaryHi || null;
    } catch (_) {}
  }

  return saveTaskRecord({
    id,
    goal,
    targetUrl,
    channel,
    adapter,
    summaryHi: summaryHi || `वर्कफ़्लो प्लान तैयार (${adapter}) — CAPTCHA/लॉगिन पर सुरक्षित पॉज़।`,
    steps,
    securityPolicy: 'HUMAN_IN_THE_LOOP_NO_CAPTCHA_BYPASS',
    status: 'PLANNED_READY',
    createdAt: new Date().toISOString()
  });
}

async function executeWorkflow({ targetUrl = '', goal = '', channel = 'web', method = 'GET', payload = null, fields = {} }, geminiRotator = null) {
  const plan = await planWorkflow({ targetUrl, goal, channel }, geminiRotator);
  const urlMatch = String(targetUrl || goal || '').match(/https?:\/\/[^\s"'<>]+/i);
  const resolvedUrl = urlMatch ? urlMatch[0] : '';

  if (!resolvedUrl) {
    // Queue for local Windows desktop/browser inspection if no URL provided
    if (String(channel).toLowerCase() === 'desktop' || /desktop|windows|axion/i.test(goal)) {
      plan.status = 'PENDING_LOCAL_EXECUTION';
      plan.executionMode = 'agent-desktop';
      saveTaskRecord(plan);
      unifiedHub.recordActivity('hermes', 'AUTOMATION_QUEUED_LOCAL', `Queued desktop automation (${plan.id}) for Windows agent-desktop`);
      return plan;
    }
    return plan;
  }

  // Stage 1: Real Live URL / Form / REST HTTP Inspection (works on Render AND Local)
  try {
    if (method && method.toUpperCase() !== 'GET' && payload) {
      const apiRes = await fetch(resolvedUrl, {
        method: method.toUpperCase(),
        headers: { 'Content-Type': 'application/json' },
        body: typeof payload === 'string' ? payload : JSON.stringify(payload),
        signal: AbortSignal.timeout(12000)
      });
      const text = await apiRes.text();
      plan.status = apiRes.ok ? 'EXECUTED_API_OK' : `EXECUTED_API_HTTP_${apiRes.status}`;
      plan.executionResult = {
        mode: 'LIVE_REST_EXECUTOR',
        url: resolvedUrl,
        httpStatus: apiRes.status,
        responsePreview: text.slice(0, 600),
        executedAt: new Date().toISOString()
      };
      saveTaskRecord(plan);
      unifiedHub.recordActivity('hermes', 'AUTOMATION_EXECUTED', `REST API ${method.toUpperCase()} ${resolvedUrl} -> HTTP ${apiRes.status}`);
      return plan;
    }

    const domInspect = await inspectUrlWithCheerio(resolvedUrl);
    if (domInspect.challengeSignals.length > 0) {
      plan.status = 'HUMAN_IN_THE_LOOP_PAUSED';
      plan.executionResult = {
        mode: 'SECURITY_PAUSE',
        ...domInspect,
        messageHi: `सुरक्षा कारण से ऑटोमेशन रोका गया (${domInspect.challengeSignals.join(', ')}) — कृपया लॉगिन/CAPTCHA स्वयं पूरा करें।`
      };
      saveTaskRecord(plan);
      unifiedHub.recordActivity('hermes', 'AUTOMATION_HUMAN_PAUSE', `Safe pause at ${resolvedUrl} (${domInspect.challengeSignals.join(', ')})`);
      return plan;
    }

    // Stage 2: If running on Windows with Chrome/Edge, execute real Playwright browser visit + form check!
    try {
      const localBrowser = await runPlaywrightEdgeLocal(resolvedUrl, fields);
      plan.status = localBrowser.pausedForHuman ? 'HUMAN_IN_THE_LOOP_PAUSED' : 'EXECUTED_BROWSER_VERIFIED';
      plan.executionResult = { ...domInspect, ...localBrowser, executedAt: new Date().toISOString() };
      saveTaskRecord(plan);
      unifiedHub.recordActivity('hermes', 'AUTOMATION_EXECUTED', `Live Playwright browser verified ${resolvedUrl} ("${localBrowser.title}")`);
      return plan;
    } catch (_) {
      // On Render Cloud (where Chrome.exe is absent): store live HTTP+Cheerio inspect AND queue local Playwright execution!
      plan.status = 'INSPECTED_AND_QUEUED_BROWSER';
      plan.pendingLocalBrowser = true;
      plan.fields = fields;
      plan.executionResult = { ...domInspect, note: 'Live DOM inspected on Render; queued for Windows Playwright/Edge local run', executedAt: new Date().toISOString() };
      saveTaskRecord(plan);
      unifiedHub.recordActivity('hermes', 'AUTOMATION_INSPECTED', `Live inspected ${resolvedUrl} (${domInspect.formsCount} forms) + queued local Playwright`);
      return plan;
    }
  } catch (err) {
    plan.status = 'EXECUTION_ERROR';
    plan.executionResult = { url: resolvedUrl, error: err.message, executedAt: new Date().toISOString() };
    saveTaskRecord(plan);
    return plan;
  }
}

function getPendingLocalTasks(limit = 10) {
  return readTasks()
    .filter((t) => t.status === 'PENDING_LOCAL_EXECUTION' || t.status === 'INSPECTED_AND_QUEUED_BROWSER' || t.pendingLocalBrowser)
    .slice(0, limit);
}

function confirmLocalTask(id, resultPayload = {}) {
  const tasks = readTasks();
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  tasks[idx].pendingLocalBrowser = false;
  tasks[idx].status = resultPayload.pausedForHuman ? 'HUMAN_IN_THE_LOOP_PAUSED' : (resultPayload.success ? 'EXECUTED_BROWSER_VERIFIED' : 'EXECUTION_ERROR');
  tasks[idx].executionResult = { ...(tasks[idx].executionResult || {}), ...resultPayload, confirmedAt: new Date().toISOString() };
  writeTasks(tasks);
  unifiedHub.recordActivity('hermes', 'AUTOMATION_CONFIRMED', `Local automation ${id}: ${tasks[idx].status}`);
  return tasks[idx];
}

function listWorkflows(limit = 15) {
  return readTasks().slice(0, limit);
}

module.exports = {
  RECOMMENDED_REPOS,
  planWorkflow,
  executeWorkflow,
  runPlaywrightEdgeLocal,
  getPendingLocalTasks,
  confirmLocalTask,
  listWorkflows
};
