/**
 * ==============================================================================
 * JARVIS × HERMES WEB, API & FORM AUTOMATION BRIDGE
 * ==============================================================================
 * Incorporates top-ranked open-source AI automation stack architectures:
 *   - browser-use/browser-use (Native CDP LLM browser execution)
 *   - browserbase/stagehand (Playwright + AI self-healing act/extract)
 *   - Skyvern-AI/skyvern (Vision-guided multi-step form workflows)
 *
 * STRICT SECURITY & COMPLIANCE POLICY:
 *   - Uses official APIs first (Meta Graph API, REST APIs, webhooks).
 *   - Never solves, clicks through, or bypasses CAPTCHAs, 2FA, or bot checks.
 *   - Enforces automatic HUMAN-IN-THE-LOOP PAUSE when a security challenge appears.
 * ==============================================================================
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const unifiedHub = require('./unified_activity_hub');

const TASKS_FILE = path.join(__dirname, 'sovereign_data', 'automation_tasks.json');

const RECOMMENDED_REPOS = [
  {
    rank: 1,
    name: 'browser-use/browser-use',
    url: 'https://github.com/browser-use/browser-use',
    stars: '120k+',
    language: 'Python',
    bestFor: 'Autonomous multi-step web & form workflows using Gemini/Claude/Ollama via native Chrome DevTools Protocol (CDP)'
  },
  {
    rank: 2,
    name: 'browserbase/stagehand',
    url: 'https://github.com/browserbase/stagehand',
    stars: '26k+',
    language: 'TypeScript / Node.js',
    bestFor: 'Playwright-native AI SDK (act, observe, extract) with self-healing selectors — drops straight into Node/OmniSales'
  },
  {
    rank: 3,
    name: 'Skyvern-AI/skyvern',
    url: 'https://github.com/Skyvern-AI/skyvern',
    stars: '23k+',
    language: 'Python',
    bestFor: 'Vision-based legacy portal form filling & document workflows with human-in-the-loop checkpoints'
  },
  {
    rank: 4,
    name: 'anthropics/claude-quickstarts (Computer Use)',
    url: 'https://github.com/anthropics/claude-quickstarts',
    stars: 'Reference Desktop Stack',
    language: 'Python / Docker',
    bestFor: 'Full OS-level mouse, keyboard & desktop application control beyond browser windows'
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

async function planWorkflow({ targetUrl = '', goal = '', channel = 'web' }, geminiRotator = null) {
  const id = `AUTO-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const lower = `${targetUrl} ${goal} ${channel}`.toLowerCase();

  let adapter = 'Playwright + Stagehand Pattern (Visible Browser)';
  if (lower.includes('instagram') || lower.includes('facebook') || lower.includes('meta')) {
    adapter = 'Official Meta Graph API v21.0 + Visible Draft Composer';
  } else if (lower.includes('api') || lower.includes('webhook')) {
    adapter = 'Direct HTTPS REST / Webhook Executor';
  } else if (lower.includes('play') || lower.includes('linkedin') || lower.includes('aistudio') || lower.includes('ai studio')) {
    adapter = 'Browser-Use / Playwright Human-Paced Form Adapter (Human-in-the-Loop Auth Pause)';
  }

  let steps = [
    { step: 1, action: 'Inspect destination / API schema', mode: 'AUTO' },
    { step: 2, action: 'Map verified fields & prepare payload/draft', mode: 'AUTO' },
    { step: 3, action: 'Pause immediately if CAPTCHA / 2FA / Login appears', mode: 'HUMAN_CHECKPOINT' },
    { step: 4, action: 'Verify submission receipt & log to Unified Hub', mode: 'AUTO' }
  ];

  if (geminiRotator) {
    try {
      const prompt = `Design a policy-compliant automation execution plan for:
Goal: "${goal}"
Target/Portal: "${targetUrl || channel}"
Recommended Adapter: "${adapter}"
STRICT RULE: Never solve or bypass CAPTCHAs, 2FA, or security challenges; include a HUMAN_CHECKPOINT step whenever login/CAPTCHA may appear.
Return ONLY valid JSON: { "summaryHi": "1-2 sentence Hindi summary", "steps": [ { "step": 1, "action": "...", "mode": "AUTO|HUMAN_CHECKPOINT" } ] }`;
      const res = await geminiRotator.generateJson(prompt, { timeoutMs: 14000, maxOutputTokens: 1500 });
      if (Array.isArray(res.data?.steps) && res.data.steps.length > 0) {
        steps = res.data.steps;
      }
      var summaryHi = res.data?.summaryHi || null;
    } catch (_) {}
  }

  const record = {
    id,
    goal,
    targetUrl,
    channel,
    adapter,
    summaryHi: summaryHi || `वर्कफ़्लो प्लान तैयार (${adapter}) — सिक्योरिटी/CAPTCHA पर ऑटो-पॉज़ सुरक्षित।`,
    steps,
    securityPolicy: 'HUMAN_IN_THE_LOOP_NO_CAPTCHA_BYPASS',
    status: 'PLANNED_READY',
    createdAt: new Date().toISOString()
  };

  const tasks = readTasks();
  tasks.unshift(record);
  writeTasks(tasks);
  unifiedHub.recordActivity('hermes', 'AUTOMATION_PLANNED', `Planned workflow (${id}) [${adapter}]: ${goal.slice(0, 60)}`);
  return record;
}

function listWorkflows(limit = 15) {
  return readTasks().slice(0, limit);
}

module.exports = {
  RECOMMENDED_REPOS,
  planWorkflow,
  listWorkflows
};
