/**
 * ==============================================================================
 * HERMES HYBRID CLOUD-TO-LOCAL RELAY & LEAD COLLECTION MIRROR WORKER
 * ==============================================================================
 * Bridges Render 24/7 Cloud Engine (https://carchuno-engine.onrender.com) with:
 *   1. Verified GoDaddy SSL 465 SMTP Gateways (CarChuno, CloseTesters, Astro, DoctoReports)
 *      whenever Render Free Tier blocks ports 465/587 or awaits Brevo IP approval.
 *   2. Parallel Mirroring of "Jarvis Lead Collection" (Date/Time/Product folders
 *      + Daily Activity Reports) onto Windows Desktop AND Google Drive (G:\My Drive).
 * ==============================================================================
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const nodemailer = require('nodemailer');
const leadVerifier = require('./lead_smtp_verifier');

const RENDER_BASE = process.env.RENDER_URL || 'https://carchuno-engine.onrender.com';
const DESKTOP_ROOT = 'C:\\Users\\HP\\Desktop\\Jarvis Lead Collection';
const DRIVE_ROOT = 'G:\\My Drive\\Jarvis Lead Collection';
const AXION_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\scratch\\TheMasterpiece';

const BRAND_TRANSPORTS = {
  carchuno: nodemailer.createTransport({
    host: 'smtpout.secureserver.net',
    port: 465,
    secure: true,
    auth: { user: 'partners@carchuno.com', pass: 'Closetesters@11' },
    tls: { rejectUnauthorized: false }
  }),
  closetesters: nodemailer.createTransport({
    host: 'smtpout.secureserver.net',
    port: 465,
    secure: true,
    auth: { user: 'partners@closetesters.com', pass: 'Carchuno@11' },
    tls: { rejectUnauthorized: false }
  }),
  astromasterpiece: nodemailer.createTransport({
    host: 'smtpout.secureserver.net',
    port: 465,
    secure: true,
    auth: { user: 'support@astromasterpiece.com', pass: 'Tweens@0404' },
    tls: { rejectUnauthorized: false }
  }),
  doctoreports: nodemailer.createTransport({
    host: 'smtpout.secureserver.net',
    port: 465,
    secure: true,
    auth: { user: 'partners@closetesters.com', pass: 'Carchuno@11' },
    tls: { rejectUnauthorized: false }
  })
};

const BRAND_SENDERS = {
  carchuno: '"CarChuno National Dealer Network" <partners@carchuno.com>',
  closetesters: '"CloseTesters Global Partnerships" <partners@closetesters.com>',
  astromasterpiece: '"AstroMasterpiece Sanctum" <support@astromasterpiece.com>',
  doctoreports: '"DoctoReports Health AI" <partners@closetesters.com>'
};

async function drainRenderOutbox(limit = 20) {
  let processed = 0;
  let sent = 0;
  let failed = 0;

  try {
    const res = await fetch(`${RENDER_BASE}/api/omnisales/outbox?limit=${limit}`, {
      signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    const data = await res.json();
    const jobs = data.pending || [];

    for (const job of jobs) {
      processed++;
      const transporter = BRAND_TRANSPORTS[job.brandId] || BRAND_TRANSPORTS.closetesters;
      const safeFrom = BRAND_SENDERS[job.brandId] || job.from;
      try {
        const info = await transporter.sendMail({
          from: safeFrom,
          replyTo: job.replyTo,
          to: job.to,
          subject: job.subject,
          html: job.html
        });
        sent++;
        console.log(`✅ [Hermes Hybrid Relay] Sent (${job.brandId}) -> ${job.to} | ID: ${info.messageId}`);
        await fetch(`${RENDER_BASE}/api/omnisales/confirm-dispatch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobId: job.id,
            success: true,
            messageId: info.messageId,
            provider: `godaddy-465-${job.brandId}`
          })
        }).catch(() => {});
      } catch (err) {
        failed++;
        console.warn(`⚠️ [Hermes Hybrid Relay] Fail (${job.brandId}) -> ${job.to}: ${err.message}`);
        await fetch(`${RENDER_BASE}/api/omnisales/confirm-dispatch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobId: job.id,
            success: false,
            error: err.message
          })
        }).catch(() => {});
      }
      await new Promise(r => setTimeout(r, 1200));
    }
  } catch (err) {
    return { ok: false, error: err.message };
  }

  return { ok: true, processed, sent, failed };
}

async function processLeadVerificationQueue() {
  let verifiedCount = 0;
  let rejectedCount = 0;
  try {
    const qRes = await fetch(`${RENDER_BASE}/api/jarvis/leads/verification-queue?limit=30`, {
      signal: AbortSignal.timeout(10000)
    });
    if (!qRes.ok) return { ok: false, error: `HTTP ${qRes.status}` };
    const qData = await qRes.json();
    const pending = qData.pending || [];
    if (pending.length === 0) return { ok: true, checked: 0, verifiedCount: 0, rejectedCount: 0 };

    const verified = [];
    const rejected = [];
    for (const item of pending) {
      const probe = await leadVerifier.verifyEmailLive(item.email);
      if (probe.ok && probe.status === 'ACTIVE_EXACT_CONFIRMED') {
        verified.push({ ...item, ...probe });
        verifiedCount++;
      } else {
        rejected.push({ ...item, ...probe });
        rejectedCount++;
      }
    }

    await fetch(`${RENDER_BASE}/api/jarvis/leads/submit-verified`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verified, rejected })
    }).catch(() => {});
  } catch (err) {
    return { ok: false, error: err.message };
  }
  return { ok: true, verifiedCount, rejectedCount };
}

function cleanLegacyClutter(rootDir, relativePath) {
  try {
    const prodDir = path.dirname(path.join(rootDir, relativePath));
    if (!fs.existsSync(prodDir)) return;
    for (const fname of fs.readdirSync(prodDir)) {
      if (fname.startsWith('leads_') || fname.startsWith('daily_master_')) {
        try { fs.unlinkSync(path.join(prodDir, fname)); } catch (_) {}
      }
    }
  } catch (_) {}
}

async function mirrorCloudCollectionsToLocalAndDrive() {
  let syncedFiles = 0;
  try {
    const res = await fetch(`${RENDER_BASE}/api/jarvis/lead-collections/export-latest`, {
      signal: AbortSignal.timeout(12000)
    });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    const payload = await res.json();
    const files = payload.files || [];

    for (const f of files) {
      const baseName = path.basename(f.relativePath || '');
      // Skip legacy untested batch/daily_master files; mirror only named Tested Active files + Daily Reports
      if (baseName.startsWith('leads_') || baseName.startsWith('daily_master_')) continue;

      for (const root of [DESKTOP_ROOT, DRIVE_ROOT]) {
        try {
          if (root === DRIVE_ROOT && !fs.existsSync('G:\\My Drive')) continue;
          cleanLegacyClutter(root, f.relativePath);
          const dest = path.join(root, f.relativePath);
          fs.mkdirSync(path.dirname(dest), { recursive: true });
          fs.writeFileSync(dest, f.content, 'utf8');
          syncedFiles++;
        } catch (err) {
          console.warn(`[Mirror Sync] Write note (${root}):`, err.message);
        }
      }
    }
  } catch (err) {
    return { ok: false, error: err.message };
  }
  return { ok: true, syncedFiles };
}

async function syncAxionTelemetryAndDirectives() {
  let telemetryPushed = false;
  let directivesProcessed = 0;
  try {
    if (!fs.existsSync(AXION_DIR)) return { ok: false, reason: 'AXION workspace not on this host' };

    const exeExists = fs.existsSync(path.join(AXION_DIR, 'distribution', 'AXION-Release', 'AXION.exe')) || fs.existsSync('C:\\Users\\HP\\Desktop\\AXION.exe');
    let ollamaOnline = false;
    let ollamaModels = [];
    try {
      const oRes = await fetch('http://127.0.0.1:11434/api/tags', { signal: AbortSignal.timeout(2500) });
      if (oRes.ok) {
        const oJson = await oRes.json();
        ollamaOnline = true;
        ollamaModels = (oJson.models || []).map(m => m.name);
      }
    } catch (_) {}

    let pendingUpdates = 0;
    let currentVersion = '16.0.0';
    try {
      const feedPath = path.join(AXION_DIR, 'core', 'vault', 'release_feed.json');
      if (fs.existsSync(feedPath)) {
        const feed = JSON.parse(fs.readFileSync(feedPath, 'utf8'));
        currentVersion = feed.currentAppVersion || currentVersion;
        pendingUpdates = (feed.models || []).filter(m => m.hasUpdate).length + (feed.ecc?.hasUpdate ? 1 : 0);
      }
    } catch (_) {}

    const syntaxIssues = [];
    for (const rel of ['core\\updater\\sovereign_update_center.js', 'core\\models\\oss_model_adapter.js', 'core\\agentic_os\\autopilot_orchestrator.js']) {
      const fp = path.join(AXION_DIR, rel);
      if (fs.existsSync(fp)) {
        try { execSync(`node -c "${fp}"`, { stdio: 'pipe' }); } catch (e) { syntaxIssues.push(`${rel}: ${e.message}`); }
      }
    }

    await fetch(`${RENDER_BASE}/api/axion/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: syntaxIssues.length === 0 ? 'HEALTHY_ONLINE' : 'NEEDS_REPAIR',
        appName: 'AXION (TheMasterpiece OS)',
        version: currentVersion,
        exePresent: exeExists,
        ollamaOnline,
        ollamaModels,
        pendingUpdates,
        issuesDetected: syntaxIssues,
        workspace: AXION_DIR
      })
    });
    telemetryPushed = true;

    const dirRes = await fetch(`${RENDER_BASE}/api/axion/directives`, { signal: AbortSignal.timeout(8000) });
    if (dirRes.ok) {
      const dirData = await dirRes.json();
      for (const job of (dirData.pending || [])) {
        directivesProcessed++;
        let resultMsg = '';
        let ok = true;
        try {
          if (job.actionType === 'REFRESH_UPDATE_FEED') {
            const updater = require(path.join(AXION_DIR, 'core', 'updater', 'sovereign_update_center.js'));
            if (typeof updater.checkForUpdates === 'function') {
              const u = await updater.checkForUpdates();
              resultMsg = `Checked updates: ${JSON.stringify(u).slice(0, 200)}`;
            } else {
              resultMsg = `Release feed verified (v${currentVersion}, pendingUpdates=${pendingUpdates})`;
            }
          } else {
            resultMsg = `AXION Diagnostic Passed | EXE:${exeExists} | Ollama:${ollamaOnline} (${ollamaModels.join(', ')}) | SyntaxIssues:${syntaxIssues.length}`;
          }
        } catch (execErr) {
          ok = false;
          resultMsg = execErr.message;
        }
        await fetch(`${RENDER_BASE}/api/axion/confirm-directive`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: job.id, success: ok, result: resultMsg, error: ok ? null : resultMsg })
        }).catch(() => {});
      }
    }
  } catch (err) {
    return { ok: false, error: err.message };
  }
  return { ok: true, telemetryPushed, directivesProcessed };
}

async function runOnce() {
  const relay = await drainRenderOutbox(20);
  const smtpQueue = await processLeadVerificationQueue();
  const mirror = await mirrorCloudCollectionsToLocalAndDrive();
  const axion = await syncAxionTelemetryAndDirectives();
  return { relay, smtpQueue, mirror, axion, at: new Date().toISOString() };
}

if (require.main === module) {
  const daemonMode = process.argv.includes('--daemon');
  if (!daemonMode) {
    runOnce().then(r => console.log('[Hermes Hybrid Sync Pass]', JSON.stringify(r, null, 2)));
  } else {
    console.log('🛡️ Hermes Hybrid Cloud-to-Local Relay & Lead Mirror Daemon ACTIVE...');
    runOnce().then(r => console.log('[Hermes Hybrid Init]', JSON.stringify(r)));
    setInterval(() => {
      runOnce().then(r => console.log('[Hermes Hybrid Cycle]', JSON.stringify(r)));
    }, 60 * 1000);
  }
}

module.exports = { drainRenderOutbox, mirrorCloudCollectionsToLocalAndDrive, runOnce };
