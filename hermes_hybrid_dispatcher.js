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
const nodemailer = require('nodemailer');

const RENDER_BASE = process.env.RENDER_URL || 'https://carchuno-engine.onrender.com';
const DESKTOP_ROOT = 'C:\\Users\\HP\\Desktop\\Jarvis Lead Collection';
const DRIVE_ROOT = 'G:\\My Drive\\Jarvis Lead Collection';

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
      for (const root of [DESKTOP_ROOT, DRIVE_ROOT]) {
        try {
          if (root === DRIVE_ROOT && !fs.existsSync('G:\\My Drive')) continue;
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

async function runOnce() {
  const relay = await drainRenderOutbox(20);
  const mirror = await mirrorCloudCollectionsToLocalAndDrive();
  return { relay, mirror, at: new Date().toISOString() };
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
