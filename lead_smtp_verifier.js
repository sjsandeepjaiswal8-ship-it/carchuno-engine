/**
 * ==============================================================================
 * JARVIS LIVE SMTP CANARY & ZERO-BOUNCE EMAIL VERIFIER
 * ==============================================================================
 * Strictly enforces multi-layer validation so ONLY tried-and-tested ACTIVE
 * email addresses enter Jarvis Lead Collection:
 *   1. RFC syntax + placeholder + disposable domain filter
 *   2. Live DNS MX lookup (ordered by priority)
 *   3. Two-Step SMTP Port-25 Canary Handshake:
 *      - Step A: Probe fake canary address (`zb_canary_...@domain`)
 *        -> Must reject with 5xx (proves server rejects nonexistent users)
 *      - Step B: Probe target email (`RCPT TO:<email>`)
 *        -> Must return 250 OK (proves exact mailbox is active & deliverable)
 *      - Detects IP policy blocks (e.g. Spamhaus PBL) separately from 5.1.1
 * ==============================================================================
 */

const net = require('net');
const dns = require('dns').promises;

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'tempmail.com', '10minutemail.com', 'guerrillamail.com',
  'yopmail.com', 'throwawaymail.com', 'trashmail.com', 'sharklasers.com',
  'getnada.com', 'temp-mail.org', 'fakeinbox.com', 'example.com', 'example.org',
  'example.net', 'test.com', 'invalid.com', 'localhost'
]);

const ROLE_PLACEHOLDER_LOCALS = new Set([
  'noreply', 'no-reply', 'donotreply', 'do-not-reply', 'mailer-daemon',
  'postmaster', 'bounce', 'bounces', 'test', 'testing', 'dummy', 'example'
]);

const TYPO_DOMAINS = new Set([
  'gmal.com', 'gmial.com', 'gamil.com', 'gmai.com', 'gnail.com', 'gmail.co',
  'yaho.com', 'yahooo.com', 'hotmal.com', 'outlok.com'
]);

function checkEmailHygiene(rawEmail) {
  const email = String(rawEmail || '').trim().toLowerCase();
  const match = email.match(/^([a-z0-9._%+-]{1,64})@([a-z0-9.-]+\.[a-z]{2,24})$/i);
  if (!match) {
    return { valid: false, email, reason: 'BAD_SYNTAX' };
  }
  const [, local, domain] = match;
  if (email.includes('..') || domain.startsWith('-') || domain.endsWith('-')) {
    return { valid: false, email, reason: 'BAD_SYNTAX' };
  }
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return { valid: false, email, reason: 'DISPOSABLE_DOMAIN' };
  }
  if (TYPO_DOMAINS.has(domain)) {
    return { valid: false, email, reason: 'TYPO_DOMAIN' };
  }
  if (ROLE_PLACEHOLDER_LOCALS.has(local)) {
    return { valid: false, email, reason: 'NON_ACTIONABLE_LOCAL' };
  }
  return { valid: true, email, local, domain };
}

async function resolveMxSorted(domain, timeoutMs = 3500) {
  try {
    const records = await Promise.race([
      dns.resolveMx(domain),
      new Promise((_, rej) => setTimeout(() => rej(new Error('MX_TIMEOUT')), timeoutMs))
    ]);
    if (!Array.isArray(records) || records.length === 0) return [];
    return records
      .filter((r) => r && r.exchange)
      .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999))
      .map((r) => r.exchange);
  } catch {
    return [];
  }
}

function probeSmtpHostPort25(mxHost, email, timeoutMs = 8000, heloHost = 'mail.carchuno.com', mailFrom = 'partners@carchuno.com') {
  return new Promise((resolve) => {
    const [, domain] = email.split('@');
    const canary = `zb_canary_nonexist_982173@${domain}`;
    let step = 'CONNECT';
    let buffer = '';
    let finished = false;
    let canaryCode = null;
    let canaryMsg = '';
    let targetCode = null;
    let targetMsg = '';

    const sock = net.createConnection(25, mxHost);
    const done = (result) => {
      if (finished) return;
      finished = true;
      try { sock.end('QUIT\r\n'); } catch {}
      try { sock.destroy(); } catch {}
      resolve(result);
    };

    sock.setTimeout(timeoutMs);
    sock.on('timeout', () => done({ ok: false, active: false, status: 'PORT25_TIMEOUT', step, mxHost }));
    sock.on('error', (err) => done({ ok: false, active: false, status: 'PORT25_NET_ERR', error: err.message, step, mxHost }));

    const handleLine = (line) => {
      const code = parseInt(line.slice(0, 3), 10);
      if (Number.isNaN(code) || line[3] === '-') return;

      if (step === 'CONNECT' && code === 220) {
        step = 'EHLO';
        sock.write(`EHLO ${heloHost}\r\n`);
      } else if (step === 'EHLO' && (code === 250 || code === 220)) {
        step = 'MAIL';
        sock.write(`MAIL FROM:<${mailFrom}>\r\n`);
      } else if (step === 'MAIL' && code === 250) {
        step = 'CANARY';
        sock.write(`RCPT TO:<${canary}>\r\n`);
      } else if (step === 'CANARY') {
        canaryCode = code;
        canaryMsg = line.trim();
        if (/spamhaus|blocked|policy|reputation|blacklist|access denied|client host/i.test(canaryMsg)) {
          return done({
            ok: false,
            active: false,
            status: 'MX_IP_POLICY_BLOCKED',
            mxHost,
            canaryCode,
            smtpProof: canaryMsg.slice(0, 120)
          });
        }
        step = 'TARGET';
        sock.write(`RCPT TO:<${email}>\r\n`);
      } else if (step === 'TARGET') {
        targetCode = code;
        targetMsg = line.trim();

        if (/spamhaus|blocked|policy|reputation|blacklist|access denied/i.test(targetMsg)) {
          return done({
            ok: false,
            active: false,
            status: 'MX_IP_POLICY_BLOCKED',
            mxHost,
            canaryCode,
            smtpCode: targetCode,
            smtpProof: targetMsg.slice(0, 120)
          });
        }

        const canaryRejected = canaryCode >= 500 && canaryCode < 600;
        const targetAccepted = targetCode >= 250 && targetCode < 260;
        const targetRejected = targetCode >= 500 && targetCode < 600;
        const tempDeferred = targetCode >= 400 && targetCode < 500;

        let status = 'UNKNOWN';
        if (targetRejected) status = 'INACTIVE_REJECTED_5XX';
        else if (tempDeferred) status = 'TEMP_UNAVAILABLE_4XX';
        else if (canaryRejected && targetAccepted) status = 'ACTIVE_EXACT_CONFIRMED';
        else if (!canaryRejected && targetAccepted) status = 'CATCH_ALL_MX';

        done({
          ok: status === 'ACTIVE_EXACT_CONFIRMED',
          active: status === 'ACTIVE_EXACT_CONFIRMED',
          status,
          mxHost,
          canaryCode,
          smtpCode: targetCode,
          smtpProof: targetMsg.slice(0, 120)
        });
      } else if (code >= 400) {
        done({
          ok: false,
          active: false,
          status: `SMTP_ERR_${code}`,
          step,
          mxHost,
          smtpCode: code,
          smtpProof: line.trim().slice(0, 120)
        });
      }
    };

    sock.on('data', (chunk) => {
      buffer += chunk.toString('utf8');
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || '';
      for (const l of lines) {
        if (l.trim()) handleLine(l);
      }
    });
  });
}

async function verifyEmailLive(rawEmail, opts = {}) {
  const hygiene = checkEmailHygiene(rawEmail);
  if (!hygiene.valid) {
    return {
      ok: false,
      active: false,
      email: hygiene.email,
      domain: '',
      status: hygiene.reason,
      verifiedAt: new Date().toISOString()
    };
  }

  const mxHosts = await resolveMxSorted(hygiene.domain, opts.mxTimeoutMs || 3500);
  if (mxHosts.length === 0) {
    return {
      ok: false,
      active: false,
      email: hygiene.email,
      domain: hygiene.domain,
      status: 'NO_MX_RECORD',
      verifiedAt: new Date().toISOString()
    };
  }

  if (opts.skipSmtp) {
    return {
      ok: false,
      active: false,
      email: hygiene.email,
      domain: hygiene.domain,
      mxHost: mxHosts[0],
      status: 'MX_ONLY_UNPROBED',
      verifiedAt: new Date().toISOString()
    };
  }

  const probe = await probeSmtpHostPort25(mxHosts[0], hygiene.email, opts.smtpTimeoutMs || 8000);
  return {
    email: hygiene.email,
    domain: hygiene.domain,
    ...probe,
    verifiedAt: new Date().toISOString()
  };
}

async function verifyBatch(emails, { concurrency = 5, strictExactOnly = true } = {}) {
  const results = new Array(emails.length);
  let cursor = 0;

  async function worker() {
    while (cursor < emails.length) {
      const i = cursor++;
      const res = await verifyEmailLive(emails[i]);
      if (strictExactOnly) {
        res.accepted = res.status === 'ACTIVE_EXACT_CONFIRMED';
      } else {
        res.accepted = res.status === 'ACTIVE_EXACT_CONFIRMED' || res.status === 'CATCH_ALL_MX';
      }
      results[i] = res;
    }
  }

  await Promise.all(Array.from({ length: Math.max(1, concurrency) }, worker));
  return results;
}

module.exports = {
  checkEmailHygiene,
  resolveMxSorted,
  probeSmtpHostPort25,
  verifyEmailLive,
  verifyBatch
};
