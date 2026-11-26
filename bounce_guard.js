/**
 * CarChuno 24/7 Render Bounce Guard, Pre-Delivery MX Verifier & Dealership-Only Filter
 */
const dns = require('dns').promises;
const tls = require('tls');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'sovereign_data');
const SUPPRESSION_PATH = path.join(DATA_DIR, 'email_suppression_list.json');
const LEDGER_PATH = path.join(DATA_DIR, 'delivery_bounce_ledger.json');
const BREAKER_PATH = path.join(DATA_DIR, 'mail_circuit_breaker.json');

fs.mkdirSync(DATA_DIR, { recursive: true });

const DEAD_OR_DISPOSABLE_DOMAINS = new Set([
  'indiatimes.com', 'sify.com', 'vsnl.com', 'vsnl.net', 'in.com', 'satyam.net.in',
  'test.com', 'example.com', 'sample.com', 'dummy.com', 'fake.com',
  'mailinator.com', 'tempmail.com', 'guerrillamail.com', 'sharklasers.com',
  'yopmail.com', '10minutemail.com', 'dispostable.com', 'throwawaymail.com',
  'getairmail.com', 'mytemp.email', 'trashmail.com', 'account.meta.com', 'facebookmail.com'
]);

// Known bounced dealer/system emails from live IMAP audit
const INITIAL_SUPPRESSED = [
  { email: 'v.prasad@sireeshauto.com', reason: 'Bounce Detected (Bengaluru Mahindra guessed email)', addedAt: '2026-11-26T17:10:00.000Z' },
  { email: 'srinivas.m@preranamotors.com', reason: '550-5.1.1 Mailbox does not exist', addedAt: '2026-11-26T17:05:00.000Z' },
  { email: 'sales@patelmotors.com', reason: 'IMAP DSN Bounce (Delivery Status Notification Failure)', addedAt: '2026-11-26T16:18:00.000Z' },
  { email: 'hameed@zulaikhamotors.com', reason: 'IMAP DSN Bounce (Undeliverable)', addedAt: '2026-11-26T16:23:00.000Z' },
  { email: 'ashok.rao@mandovimotors.com', reason: 'SMTP Bounce / Suppression', addedAt: '2026-11-26T16:23:00.000Z' },
  { email: 'enquiry@rajshreemahindra.com', reason: 'SMTP Bounce / Suppression', addedAt: '2026-11-26T16:23:00.000Z' },
  { email: 'corporate@shreeshivamhyundai.com', reason: 'SMTP Bounce / Suppression', addedAt: '2026-11-26T16:23:00.000Z' },
  { email: 'noreply@account.meta.com', reason: '550 5.1.1 Meta No-Reply', addedAt: '2026-11-26T16:18:00.000Z' }
];

function loadJson(filePath, fallback) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (_) {}
  return fallback;
}

function saveJson(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (_) {}
}

class BounceGuard {
  constructor() {
    this.suppressionList = loadJson(SUPPRESSION_PATH, INITIAL_SUPPRESSED);
    if (!fs.existsSync(SUPPRESSION_PATH)) saveJson(SUPPRESSION_PATH, this.suppressionList);
    this.ledger = loadJson(LEDGER_PATH, []);
    this.breaker = loadJson(BREAKER_PATH, { paused: true, reason: 'Hard-stopped by Admin to protect carchuno.com domain/ID', updatedAt: new Date().toISOString() });
    this.mxCache = new Map();
    this.consecutiveFailures = 0;
    this.isScanning = false;
    this.lastScanAt = null;
  }

  isSendingPaused() {
    return !!this.breaker?.paused;
  }

  pauseSending(reason = 'Paused by Admin / Circuit Breaker') {
    this.breaker = { paused: true, reason, updatedAt: new Date().toISOString() };
    saveJson(BREAKER_PATH, this.breaker);
    return this.breaker;
  }

  resumeSending() {
    this.consecutiveFailures = 0;
    this.breaker = { paused: false, reason: null, updatedAt: new Date().toISOString() };
    saveJson(BREAKER_PATH, this.breaker);
    return this.breaker;
  }

  isSuppressed(email) {
    const clean = String(email || '').trim().toLowerCase();
    return this.suppressionList.some((s) => s.email.toLowerCase() === clean);
  }

  addToSuppressionList(email, reason = 'Delivery Failure') {
    const clean = String(email || '').trim().toLowerCase();
    if (!clean || !clean.includes('@')) return;
    if (!this.isSuppressed(clean)) {
      this.suppressionList.unshift({ email: clean, reason, addedAt: new Date().toISOString() });
      saveJson(SUPPRESSION_PATH, this.suppressionList.slice(0, 1000));
    }
  }

  async verifyBeforeSend(email, options = {}) {
    if (this.isSendingPaused()) {
      return { ok: false, code: 'SENDING_PAUSED', reason: `Mail sending is PAUSED (${this.breaker.reason || 'Safety Hold'})` };
    }

    const clean = String(email || '').trim().toLowerCase();
    if (!clean || !clean.includes('@')) {
      return { ok: false, code: 'INVALID_SYNTAX', reason: 'Invalid or empty email address' };
    }

    // Strict Dealership-Only / No-Junk Filter for CarChuno
    if (options.dealershipOnly) {
      const localPart = clean.split('@')[0];
      if (/^(noreply|no-reply|donotreply|mailer-daemon|postmaster|bounce|notifications?)$/i.test(localPart)) {
        return { ok: false, code: 'NON_DEALERSHIP_BLOCKED', reason: `Blocked automated/noreply address: ${clean}` };
      }
    }

    if (this.isSuppressed(clean)) {
      return { ok: false, code: 'SUPPRESSED', reason: 'Email is on bounce/suppression list' };
    }

    const regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    if (!regex.test(clean)) {
      this.addToSuppressionList(clean, 'Invalid syntax');
      return { ok: false, code: 'INVALID_SYNTAX', reason: 'Invalid email syntax' };
    }

    const domain = clean.split('@')[1];
    if (DEAD_OR_DISPOSABLE_DOMAINS.has(domain)) {
      this.addToSuppressionList(clean, `Blocked dead/disposable domain @${domain}`);
      return { ok: false, code: 'DEAD_DOMAIN', reason: `Blocked dead/disposable domain @${domain}` };
    }

    let mxHost = this.mxCache.get(domain);
    if (mxHost === undefined) {
      try {
        const records = await dns.resolveMx(domain);
        if (records && records.length > 0) {
          records.sort((a, b) => a.priority - b.priority);
          mxHost = records[0].exchange;
        } else {
          mxHost = null;
        }
      } catch (err) {
        if (err.code === 'ENOTFOUND' || err.code === 'ENODATA' || err.code === 'NXDOMAIN') {
          mxHost = null;
        } else {
          mxHost = `transient:${domain}`;
        }
      }
      this.mxCache.set(domain, mxHost);
    }

    if (!mxHost) {
      this.addToSuppressionList(clean, `No DNS MX records for @${domain}`);
      return { ok: false, code: 'NO_MX', reason: `Domain @${domain} has no active mail server (No MX)` };
    }

    return { ok: true, email: clean, domain, mxHost };
  }

  recordDispatch({ to, subject, provider, status, messageId = null, error = null }) {
    const cleanTo = String(to || '').trim().toLowerCase();
    const entry = {
      id: `dlv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      to: cleanTo,
      subject: String(subject || '').slice(0, 140),
      provider: provider || 'godaddy_smtp',
      status,
      messageId,
      error,
      bouncedAt: null,
      bounceReason: null
    };
    this.ledger.unshift(entry);
    saveJson(LEDGER_PATH, this.ledger.slice(0, 500));

    if (status === 'FAILED') {
      this.consecutiveFailures++;
      if (this.consecutiveFailures >= 3) {
        this.pauseSending(`Auto-paused after ${this.consecutiveFailures} consecutive SMTP failures`);
      }
    } else if (status === 'DELIVERED') {
      this.consecutiveFailures = 0;
    }
    return entry;
  }

  markBounced(bouncedEmail, reason = 'SMTP Bounce / Undeliverable') {
    const clean = String(bouncedEmail || '').trim().toLowerCase();
    if (!clean || !clean.includes('@')) return false;
    this.addToSuppressionList(clean, `Bounce Detected: ${reason}`);

    let updated = false;
    for (const item of this.ledger) {
      if (item.to === clean && item.status === 'DELIVERED') {
        item.status = 'BOUNCED';
        item.bouncedAt = new Date().toISOString();
        item.bounceReason = reason;
        updated = true;
        break;
      }
    }
    if (!updated && !this.ledger.some((i) => i.to === clean && i.status === 'BOUNCED')) {
      this.ledger.unshift({
        id: `bnc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        to: clean,
        subject: 'Inbound Bounce / DSN Notification',
        provider: 'imap_bounce_scanner',
        status: 'BOUNCED',
        messageId: null,
        error: reason,
        bouncedAt: new Date().toISOString(),
        bounceReason: reason
      });
    }
    saveJson(LEDGER_PATH, this.ledger.slice(0, 500));
    return true;
  }

  async scanBouncesFromImap() {
    if (this.isScanning) return { success: true, scanning: true, newlyDetectedCount: 0, newlyDetected: [] };
    this.isScanning = true;
    const newlyDetected = [];
    try {
      const user = process.env.GODADDY_USER || 'partners@carchuno.com';
      const pass = process.env.GODADDY_PASS || Buffer.from('Q2xvc2V0ZXN0ZXJzQDEx', 'base64').toString('utf8');
      const messages = await this._fetchRecentImapMessages(user, pass, 20);
      for (const msg of messages) {
        const subj = (msg.subject || '').toLowerCase();
        const from = (msg.from || '').toLowerCase();
        const isBounce =
          from.includes('mailer-daemon') ||
          from.includes('postmaster') ||
          subj.includes('delivery status notification') ||
          subj.includes('undelivered mail') ||
          subj.includes('message delivery failure') ||
          subj.includes('returned mail') ||
          subj.includes('failure notice') ||
          subj.includes('mail delivery failed');
        if (!isBounce) continue;
        const bodyText = msg.body || '';
        const m =
          bodyText.match(/Final-Recipient:\s*(?:rfc822;)?\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i) ||
          bodyText.match(/Original-Recipient:\s*(?:rfc822;)?\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i) ||
          bodyText.match(/(?:to|for|address)\s*<?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>?/i);
        const failedEmail = m ? m[1].toLowerCase() : null;
        if (failedEmail && failedEmail !== user.toLowerCase() && !failedEmail.includes('secureserver.net')) {
          const diagMatch = bodyText.match(/Diagnostic-Code:\s*([^\r\n]+)/i) || bodyText.match(/(550[^\r\n]+|554[^\r\n]+|User unknown[^\r\n]*)/i);
          const reason = diagMatch ? diagMatch[1].trim().slice(0, 140) : (msg.subject || 'Delivery Failure');
          if (this.markBounced(failedEmail, reason)) {
            newlyDetected.push({ email: failedEmail, reason, date: msg.date });
          }
        }
      }
      this.lastScanAt = new Date().toISOString();
      return { success: true, scannedCount: messages.length, newlyDetectedCount: newlyDetected.length, newlyDetected, lastScanAt: this.lastScanAt };
    } catch (err) {
      return { success: false, error: err.message, newlyDetectedCount: 0, newlyDetected: [] };
    } finally {
      this.isScanning = false;
    }
  }

  _fetchRecentImapMessages(user, pass, maxCount = 20) {
    return new Promise((resolve) => {
      const results = [];
      let socket;
      try {
        socket = tls.connect(993, 'imap.secureserver.net', () => {});
      } catch (_) {
        return resolve(results);
      }
      socket.setEncoding('utf8');
      let buffer = '';
      let stage = 'CONNECT';
      const timer = setTimeout(() => {
        try { socket.destroy(); } catch (_) {}
        resolve(results);
      }, 15000);

      socket.on('data', (chunk) => {
        buffer += chunk;
        if (stage === 'CONNECT' && buffer.includes('* OK')) {
          stage = 'LOGIN';
          buffer = '';
          socket.write(`A1 LOGIN ${user} ${pass}\r\n`);
        } else if (stage === 'LOGIN' && buffer.includes('A1 OK')) {
          stage = 'SELECT';
          buffer = '';
          socket.write('A2 SELECT "INBOX"\r\n');
        } else if (stage === 'LOGIN' && (buffer.includes('A1 NO') || buffer.includes('A1 BAD'))) {
          clearTimeout(timer);
          socket.destroy();
          resolve(results);
        } else if (stage === 'SELECT' && buffer.includes('A2 OK')) {
          stage = 'SEARCH';
          buffer = '';
          socket.write('A3 SEARCH ALL\r\n');
        } else if (stage === 'SEARCH' && buffer.includes('A3 OK')) {
          const match = buffer.match(/\* SEARCH (.*)/);
          const ids = match ? match[1].trim().split(/\s+/).filter(Boolean) : [];
          if (ids.length === 0) {
            socket.write('A5 LOGOUT\r\n');
            clearTimeout(timer);
            resolve(results);
            return;
          }
          stage = 'FETCH';
          buffer = '';
          socket.write(`A4 FETCH ${ids.slice(-maxCount).join(',')} (BODY.PEEK[HEADER.FIELDS (FROM SUBJECT DATE)] BODY.PEEK[TEXT]<0.1200>)\r\n`);
        } else if (stage === 'FETCH' && buffer.includes('A4 OK')) {
          const blocks = buffer.split(/\* \d+ FETCH/g).filter((b) => b.trim().length > 0);
          for (const b of blocks) {
            const fromM = b.match(/from:\s*([^\r\n]+)/i);
            const subjM = b.match(/subject:\s*([^\r\n]+)/i);
            const dateM = b.match(/date:\s*([^\r\n]+)/i);
            results.push({
              from: fromM ? fromM[1].trim() : '',
              subject: subjM ? subjM[1].trim() : '',
              date: dateM ? dateM[1].trim() : '',
              body: b
            });
          }
          socket.write('A5 LOGOUT\r\n');
          clearTimeout(timer);
          resolve(results);
        }
      });

      socket.on('error', () => {
        clearTimeout(timer);
        resolve(results);
      });
    });
  }

  getReport() {
    const total = this.ledger.length;
    const delivered = this.ledger.filter((l) => l.status === 'DELIVERED').length;
    const bounced = this.ledger.filter((l) => l.status === 'BOUNCED').length;
    const failed = this.ledger.filter((l) => l.status === 'FAILED').length;
    const blocked = this.ledger.filter((l) => l.status === 'BLOCKED_PRE_DELIVERY').length;
    const attempted = delivered + bounced + failed;
    const deliveryRate = attempted > 0 ? Math.round((delivered / attempted) * 1000) / 10 : 100;

    return {
      summary: {
        totalEvents: total,
        delivered,
        bounced,
        failed,
        blockedPreDelivery: blocked,
        deliveryRatePercent: deliveryRate,
        suppressedCount: this.suppressionList.length,
        lastBounceScanAt: this.lastScanAt,
        sendingPaused: this.isSendingPaused(),
        pauseReason: this.breaker?.reason || null
      },
      recentLogs: this.ledger.slice(0, 50),
      bouncedEmails: this.suppressionList.slice(0, 50)
    };
  }
}

module.exports = { bounceGuard: new BounceGuard() };
