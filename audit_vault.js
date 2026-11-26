/**
 * ==============================================================================
 * CloseTesters Audit Vault & Multi-Provider Failover Email Dispatcher
 * ==============================================================================
 * Persists real HTML + binary %PDF- dossiers in sovereign_data/audit_reports/
 * Indexes per-client audit history in sovereign_data/client_audit_vault.json
 * Dispatches emails with automatic failover across Brevo 587, Brevo 2525, GoDaddy 465.
 * ==============================================================================
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const { renderHtmlToPdfBuffer } = require('./browser_launcher');
const { bounceGuard } = require('./bounce_guard');

const DATA_DIR = path.join(__dirname, 'sovereign_data');
const REPORTS_DIR = path.join(DATA_DIR, 'audit_reports');
const VAULT_INDEX_FILE = path.join(DATA_DIR, 'client_audit_vault.json');

fs.mkdirSync(REPORTS_DIR, { recursive: true });

const decodeB64 = (b64) => Buffer.from(b64, 'base64').toString('utf8');
const getBrevoPass = () =>
  process.env.BREVO_PASS ||
  decodeB64('eHNtdHBzaWItMDgzYzJlMDRiMWI0ZjI1YTY4NmQ3ZDk5ZGZkZjQzYWFjMTVlZWE5MWQ1YWQ3ZmIxODIwMmMwM2IyYWQwYjA4ZS1HaHR2NWNXZmsxa1hndmk0');
const getGodaddyPass = () =>
  process.env.GODADDY_PASS ||
  decodeB64('Q2xvc2V0ZXN0ZXJzQDEx');

function getSmtpProvidersChain() {
  return [
    {
      id: 'godaddy-465',
      name: 'GoDaddy SecureServer (465)',
      host: 'smtpout.secureserver.net',
      port: 465,
      secure: true,
      auth: {
        user: process.env.GODADDY_USER || 'partners@carchuno.com',
        pass: getGodaddyPass()
      },
      tls: { rejectUnauthorized: false }
    },
    {
      id: 'brevo-587',
      name: 'Brevo Cloud Relay (587)',
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.BREVO_USER || 'c0ee43001@smtp-brevo.com',
        pass: getBrevoPass()
      },
      tls: { rejectUnauthorized: false }
    },
    {
      id: 'brevo-2525',
      name: 'Brevo Alt Relay (2525)',
      host: 'smtp-relay.brevo.com',
      port: 2525,
      secure: false,
      auth: {
        user: process.env.BREVO_USER || 'c0ee43001@smtp-brevo.com',
        pass: getBrevoPass()
      },
      tls: { rejectUnauthorized: false }
    }
  ];
}

function readIndex() {
  try {
    if (fs.existsSync(VAULT_INDEX_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(VAULT_INDEX_FILE, 'utf8'));
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (_) {}
  return [];
}

function writeIndex(entries) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(VAULT_INDEX_FILE, JSON.stringify(entries.slice(0, 300), null, 2), 'utf8');
  } catch (err) {
    console.error('[AuditVault] Index write error:', err.message);
  }
}

function generateAuditId(prefix = 'CT-AUDIT') {
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${rand}`;
}

async function saveAuditReport(opts = {}) {
  const auditId = opts.auditId || generateAuditId(opts.prefix || 'CT-AUDIT');
  const htmlContent = String(opts.htmlContent || `<html><body><h1>${opts.title || 'CloseTesters Audit'}</h1></body></html>`);

  let pdfBuffer = opts.pdfBuffer ? Buffer.from(opts.pdfBuffer) : null;
  let pdfRenderer = opts.pdfRenderer || 'direct';
  let chromeWarning = null;

  if (!pdfBuffer) {
    const rendered = await renderHtmlToPdfBuffer(htmlContent, {
      title: opts.title || 'CloseTesters Official Engineering Dossier',
      subtitle: opts.subtitle || opts.target || opts.packageName || 'CloseTesters QA Labs',
      structuredData: opts.structuredData
    });
    pdfBuffer = rendered.buffer;
    pdfRenderer = rendered.renderer;
    chromeWarning = rendered.chromeWarning || null;
  }

  const safeId = auditId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const htmlFile = `${safeId}.html`;
  const pdfFile = `${safeId}.pdf`;
  const jsonFile = `${safeId}.json`;

  fs.writeFileSync(path.join(REPORTS_DIR, htmlFile), htmlContent, 'utf8');
  fs.writeFileSync(path.join(REPORTS_DIR, pdfFile), pdfBuffer);

  const sha256 = crypto.createHash('sha256').update(pdfBuffer).digest('hex');

  const record = {
    auditId,
    reportType: opts.reportType || 'web-quad-audit',
    title: opts.title || 'CloseTesters 360° Engineering Audit Dossier',
    target: opts.target || opts.url || opts.packageName || '',
    appName: opts.appName || '',
    packageName: opts.packageName || '',
    clientName: opts.clientName || 'Valued Partner',
    clientEmail: (opts.clientEmail || '').trim().toLowerCase(),
    score: Number.isFinite(Number(opts.score)) ? Number(opts.score) : 0,
    grade: opts.grade || null,
    summary: opts.summary || '',
    suitesExecuted: opts.suitesExecuted || [],
    engineStatus: opts.engineStatus || 'REAL_EMPIRICAL_OK',
    degraded: Boolean(opts.degraded),
    pdfRenderer,
    chromeWarning,
    pdfBytes: pdfBuffer.length,
    sha256,
    htmlFile,
    pdfFile,
    jsonFile,
    downloadPdfUrl: `/api/audit/download/${auditId}?format=pdf`,
    downloadHtmlUrl: `/api/audit/download/${auditId}?format=html`,
    emailSent: false,
    emailProvider: null,
    emailError: null,
    emailedAt: null,
    createdAt: new Date().toISOString()
  };

  if (opts.fullPayload) {
    try {
      fs.writeFileSync(path.join(REPORTS_DIR, jsonFile), JSON.stringify(opts.fullPayload, null, 2), 'utf8');
    } catch (_) {}
  }

  const index = readIndex().filter((r) => r.auditId !== auditId);
  index.unshift(record);
  writeIndex(index);

  return record;
}

function updateVaultRecord(auditId, patch = {}) {
  const index = readIndex();
  const idx = index.findIndex((r) => r.auditId === auditId);
  if (idx === -1) return null;
  index[idx] = { ...index[idx], ...patch, updatedAt: new Date().toISOString() };
  writeIndex(index);
  return index[idx];
}

function listReportsByEmail(email, opts = {}) {
  const index = readIndex();
  const normalized = String(email || '').trim().toLowerCase();
  let items = index;
  if (!opts.includeAll && normalized && normalized !== '*') {
    items = index.filter((r) => r.clientEmail === normalized || (opts.packageName && r.packageName === opts.packageName));
  }
  const limit = Math.min(Number(opts.limit) || 50, 200);
  return items.slice(0, limit);
}

function getReportById(auditId) {
  const index = readIndex();
  const entry = index.find((r) => r.auditId === auditId) || null;
  if (!entry) return null;
  let fullPayload = null;
  try {
    const jPath = path.join(REPORTS_DIR, entry.jsonFile);
    if (fs.existsSync(jPath)) {
      fullPayload = JSON.parse(fs.readFileSync(jPath, 'utf8'));
    }
  } catch (_) {}
  return { ...entry, fullPayload };
}

function getReportFile(auditId, format = 'pdf') {
  const entry = readIndex().find((r) => r.auditId === auditId);
  const safeId = String(auditId || '').replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = format === 'html' ? (entry?.htmlFile || `${safeId}.html`) : (entry?.pdfFile || `${safeId}.pdf`);
  const filePath = path.join(REPORTS_DIR, fileName);
  if (!fs.existsSync(filePath)) return null;
  return {
    entry,
    fileName,
    filePath,
    contentType: format === 'html' ? 'text/html; charset=utf-8' : 'application/pdf',
    buffer: fs.readFileSync(filePath)
  };
}

async function sendEmailWithFailover(mailOptions) {
  // Block CloseTesters / non-dealership emails from using partners@carchuno.com unless explicitly allowed
  const targetTo = mailOptions?.to;
  const preCheck = await bounceGuard.verifyBeforeSend(targetTo, { dealershipOnly: false });
  if (!preCheck.ok) {
    return { delivered: false, provider: 'bounce_guard', error: preCheck.reason, attempts: [] };
  }

  const providers = getSmtpProvidersChain().filter((cfg) => {
    // Prevent CloseTesters non-dealership mails from being sent via partners@carchuno.com
    const isCloseTestersMail = !mailOptions?.from || String(mailOptions.from).toLowerCase().includes('closetesters');
    if (isCloseTestersMail && cfg.auth?.user === 'partners@carchuno.com' && process.env.ALLOW_CROSS_BRAND_MAIL !== 'true') {
      return false;
    }
    return true;
  });

  if (providers.length === 0) {
    return {
      delivered: false,
      provider: null,
      error: 'Blocked cross-brand send: CloseTesters emails cannot use partners@carchuno.com',
      attempts: []
    };
  }

  const attempts = [];

  for (const cfg of providers) {
    try {
      const transporter = nodemailer.createTransport({
        host: cfg.host,
        port: cfg.port,
        secure: cfg.secure,
        auth: cfg.auth,
        tls: cfg.tls,
        connectionTimeout: 10000,
        greetingTimeout: 8000,
        socketTimeout: 15000
      });

      const fromAddress = cfg.id.startsWith('brevo')
        ? (process.env.BREVO_FROM || '"CloseTesters Engineering Labs" <partners@closetesters.com>')
        : (process.env.GODADDY_FROM || '"CloseTesters Engineering Labs" <partners@carchuno.com>');

      const info = await transporter.sendMail({
        from: fromAddress,
        replyTo: 'support@closetesters.com',
        ...mailOptions
      });

      return {
        delivered: true,
        provider: cfg.id,
        providerName: cfg.name,
        messageId: info.messageId,
        attempts
      };
    } catch (err) {
      attempts.push({ provider: cfg.id, error: err.message });
    }
  }

  return {
    delivered: false,
    provider: null,
    error: attempts.map((a) => `${a.provider}: ${a.error}`).join(' | '),
    attempts
  };
}

async function sendReportEmail(auditIdOrRecord, recipientEmail, opts = {}) {
  const record = typeof auditIdOrRecord === 'string' ? getReportById(auditIdOrRecord) : auditIdOrRecord;
  if (!record) throw new Error('Audit report not found in vault');

  const toEmail = String(recipientEmail || record.clientEmail || '').trim();
  if (!toEmail || !toEmail.includes('@')) {
    return { delivered: false, skipped: true, reason: 'No valid recipient email provided' };
  }

  const pdfFileObj = getReportFile(record.auditId, 'pdf');
  const htmlFileObj = getReportFile(record.auditId, 'html');
  const cleanTitle = (record.appName || record.target || record.auditId).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 48);

  const summaryHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #0f172a; color: #f8fafc; border-radius: 14px; border: 1px solid #334155; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #064e3b, #0f172a); padding: 24px 28px; border-bottom: 2px solid #10b981;">
        <div style="font-size: 11px; color: #34d399; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase;">CloseTesters™ Verified Official Dossier</div>
        <h2 style="margin: 6px 0 4px 0; font-size: 20px; color: #ffffff;">${record.title}</h2>
        <div style="font-size: 13px; color: #cbd5e1;">Target: <strong style="color: #38bdf8;">${record.target || record.packageName}</strong> &bull; Audit ID: <code>${record.auditId}</code></div>
      </div>
      <div style="padding: 24px 28px; line-height: 1.6; font-size: 14px; color: #cbd5e1;">
        <p style="margin-top: 0;">Hello <strong>${record.clientName || 'Partner'}</strong>,</p>
        <p>Your empirical engineering & compliance audit report is complete. The official signed PDF dossier is attached to this email and permanently archived in your CloseTesters Customer Portal Vault.</p>
        <div style="background: #1e293b; border-radius: 10px; padding: 14px 18px; margin: 16px 0; border-left: 4px solid #10b981;">
          <div><strong>Overall Score:</strong> <span style="color: #34d399; font-size: 18px; font-weight: 900;">${record.score}/100</span></div>
          <div><strong>SHA-256 Seal:</strong> <code style="font-size: 11px; color: #94a3b8;">${record.sha256}</code></div>
          <div><strong>PDF Size:</strong> ${Math.round((record.pdfBytes || 0) / 1024)} KB (${record.pdfRenderer})</div>
        </div>
        <p style="font-size: 13px; color: #94a3b8;">Need technical assistance with any finding? Simply reply to this email — it routes directly to our senior QA engineering desk at <a href="mailto:support@closetesters.com" style="color: #38bdf8;">support@closetesters.com</a>.</p>
      </div>
    </div>
  `;

  const attachments = [];
  if (pdfFileObj) {
    attachments.push({
      filename: `${cleanTitle}_${record.auditId}.pdf`,
      content: pdfFileObj.buffer,
      contentType: 'application/pdf'
    });
  }
  if (htmlFileObj && opts.attachHtml) {
    attachments.push({
      filename: `${cleanTitle}_${record.auditId}.html`,
      content: htmlFileObj.buffer,
      contentType: 'text/html'
    });
  }

  const mailResult = await sendEmailWithFailover({
    to: toEmail,
    subject: `[CloseTesters Audit] ${record.target || record.title} — Score ${record.score}/100 (${record.auditId})`,
    html: summaryHtml,
    attachments
  });

  updateVaultRecord(record.auditId, {
    clientEmail: toEmail.toLowerCase(),
    emailSent: mailResult.delivered,
    emailProvider: mailResult.provider,
    emailError: mailResult.delivered ? null : mailResult.error,
    emailedAt: mailResult.delivered ? new Date().toISOString() : null
  });

  return mailResult;
}

module.exports = {
  REPORTS_DIR,
  VAULT_INDEX_FILE,
  generateAuditId,
  saveAuditReport,
  updateVaultRecord,
  listReportsByEmail,
  getReportById,
  getReportFile,
  sendEmailWithFailover,
  sendReportEmail
};
