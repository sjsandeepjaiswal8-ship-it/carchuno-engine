/**
 * ==============================================================================
 * UNIFIED 4-BRAND ACTIVITY HUB & HYBRID RELAY QUEUE
 * ==============================================================================
 * Connects: CarChuno, DoctoReports, AstroMasterpiece, CloseTesters, Hermes & Oracle
 * Persists genuine activity timeline + queued hybrid email relay tasks.
 * ==============================================================================
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, 'sovereign_data');
const ACTIVITY_FILE = path.join(DATA_DIR, 'unified_activity_log.json');
const OUTBOX_FILE = path.join(DATA_DIR, 'outbound_email_queue.json');
const BRAND_METRICS_FILE = path.join(DATA_DIR, 'brand_metrics.json');

fs.mkdirSync(DATA_DIR, { recursive: true });

const DEFAULT_BRANDS = {
  carchuno: {
    id: 'carchuno',
    name: 'CarChuno',
    domain: 'https://www.carchuno.com',
    category: 'Pan-India Reverse Bidding Auto Platform',
    sender: 'partners@carchuno.com',
    dispatched: 0,
    queued: 0,
    failed: 0,
    lastActivityAt: null,
    lastAction: 'Standby'
  },
  doctoreports: {
    id: 'doctoreports',
    name: 'DoctoReports',
    domain: 'https://www.doctoreports.com',
    category: 'AI Medical Report & NABL Clinical Simplifier',
    sender: 'partners@closetesters.com',
    replyTo: 'support@doctoreports.com',
    dispatched: 0,
    queued: 0,
    failed: 0,
    lastActivityAt: null,
    lastAction: 'Standby'
  },
  astromasterpiece: {
    id: 'astromasterpiece',
    name: 'AstroMasterpiece',
    domain: 'https://www.astromasterpiece.com',
    category: '12-Pillar Vedic Kundali & Siddha Kavach Ecosystem',
    sender: 'support@astromasterpiece.com',
    dispatched: 0,
    queued: 0,
    failed: 0,
    lastActivityAt: null,
    lastAction: 'Standby'
  },
  closetesters: {
    id: 'closetesters',
    name: 'CloseTesters',
    domain: 'https://closetesters.com',
    category: 'Google Play 20-Tester QA & 4-Suite Audit Lab',
    sender: 'partners@closetesters.com',
    dispatched: 0,
    queued: 0,
    failed: 0,
    lastActivityAt: null,
    lastAction: 'Standby'
  }
};

function readJsonSafe(file, fallback) {
  try {
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    }
  } catch (_) {}
  return fallback;
}

function writeJsonSafe(file, data) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.warn('[UnifiedHub] Write warning:', err.message);
  }
}

function getBrandMetrics() {
  const saved = readJsonSafe(BRAND_METRICS_FILE, {});
  const merged = {};
  for (const [k, def] of Object.entries(DEFAULT_BRANDS)) {
    merged[k] = { ...def, ...(saved[k] || {}) };
  }
  return merged;
}

function recordActivity(brandId, type, summary, details = {}) {
  const normalizedBrand = DEFAULT_BRANDS[brandId] ? brandId : 'hermes';
  const entry = {
    id: `ACT-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
    brand: normalizedBrand,
    type,
    summary,
    details,
    timestamp: new Date().toISOString()
  };

  const log = readJsonSafe(ACTIVITY_FILE, []);
  log.unshift(entry);
  writeJsonSafe(ACTIVITY_FILE, log.slice(0, 250));

  if (DEFAULT_BRANDS[normalizedBrand]) {
    const metrics = getBrandMetrics();
    metrics[normalizedBrand].lastActivityAt = entry.timestamp;
    metrics[normalizedBrand].lastAction = summary;
    if (type === 'EMAIL_DISPATCHED') metrics[normalizedBrand].dispatched++;
    else if (type === 'EMAIL_QUEUED_HYBRID') metrics[normalizedBrand].queued++;
    else if (type === 'EMAIL_FAILED') metrics[normalizedBrand].failed++;
    writeJsonSafe(BRAND_METRICS_FILE, metrics);
  }

  return entry;
}

function getRecentActivity(brandFilter = 'all', limit = 60) {
  const log = readJsonSafe(ACTIVITY_FILE, []);
  const filtered = brandFilter && brandFilter !== 'all'
    ? log.filter(item => item.brand === brandFilter)
    : log;
  return filtered.slice(0, limit);
}

function enqueueHybridEmail(brandId, mailPayload, cloudError = '') {
  const queue = readJsonSafe(OUTBOX_FILE, []);
  const jobId = `MAIL-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  const job = {
    id: jobId,
    brandId: DEFAULT_BRANDS[brandId] ? brandId : 'carchuno',
    to: mailPayload.to,
    from: mailPayload.from,
    replyTo: mailPayload.replyTo,
    subject: mailPayload.subject,
    html: mailPayload.html,
    status: 'PENDING_HYBRID_RELAY',
    cloudError,
    createdAt: new Date().toISOString()
  };

  // Deduplicate pending emails to the same recipient + subject
  const dup = queue.find(q => q.status === 'PENDING_HYBRID_RELAY' && q.to === job.to && q.subject === job.subject);
  if (dup) return dup;

  queue.unshift(job);
  writeJsonSafe(OUTBOX_FILE, queue.slice(0, 500));
  recordActivity(job.brandId, 'EMAIL_QUEUED_HYBRID', `Queued for Local Hermes GoDaddy Relay -> ${job.to}`, { jobId, cloudError });
  return job;
}

function getPendingOutbox(limit = 50) {
  const queue = readJsonSafe(OUTBOX_FILE, []);
  return queue.filter(q => q.status === 'PENDING_HYBRID_RELAY').slice(0, limit);
}

function getAllOutboxStats() {
  const queue = readJsonSafe(OUTBOX_FILE, []);
  return {
    pending: queue.filter(q => q.status === 'PENDING_HYBRID_RELAY').length,
    dispatched: queue.filter(q => q.status === 'DISPATCHED').length,
    failed: queue.filter(q => q.status === 'FAILED').length,
    total: queue.length
  };
}

function confirmOutboxDispatch(jobId, { success, messageId, provider, error } = {}) {
  const queue = readJsonSafe(OUTBOX_FILE, []);
  const idx = queue.findIndex(q => q.id === jobId);
  if (idx === -1) return null;

  queue[idx].status = success ? 'DISPATCHED' : 'FAILED';
  queue[idx].messageId = messageId || null;
  queue[idx].provider = provider || 'local-godaddy-465';
  queue[idx].error = error || null;
  queue[idx].resolvedAt = new Date().toISOString();
  writeJsonSafe(OUTBOX_FILE, queue);

  const job = queue[idx];
  if (success) {
    const metrics = getBrandMetrics();
    if (metrics[job.brandId]) {
      metrics[job.brandId].pending = Math.max(0, (metrics[job.brandId].queued || 1) - 1);
      if (metrics[job.brandId].queued > 0) metrics[job.brandId].queued--;
      metrics[job.brandId].dispatched++;
      metrics[job.brandId].lastActivityAt = job.resolvedAt;
      metrics[job.brandId].lastAction = `Dispatched via ${job.provider} to ${job.to}`;
      writeJsonSafe(BRAND_METRICS_FILE, metrics);
    }
    recordActivity(job.brandId, 'EMAIL_DISPATCHED', `Hybrid Relay Sent -> ${job.to} (${job.provider})`, {
      jobId,
      messageId
    });
  } else {
    recordActivity(job.brandId, 'EMAIL_FAILED', `Relay failed for ${job.to}: ${error}`, { jobId });
  }
  return queue[idx];
}

module.exports = {
  DEFAULT_BRANDS,
  getBrandMetrics,
  recordActivity,
  getRecentActivity,
  enqueueHybridEmail,
  getPendingOutbox,
  getAllOutboxStats,
  confirmOutboxDispatch
};
