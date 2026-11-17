/**
 * ==============================================================================
 * AXION TERMINAL <-> OPENJARVIS BIDIRECTIONAL BRIDGE
 * ==============================================================================
 * Connects AXION (C:\Users\HP\.gemini\antigravity\scratch\TheMasterpiece)
 * with OpenJarvis Hybrid Cockpit (https://carchuno-engine.onrender.com):
 *   1. Stores & serves live AXION terminal health, Ollama OSS models, EXE/UI state
 *   2. Queues update / bug-fix directives issued from OpenJarvis + Gemini 4 Hydrogen
 *   3. Local executor inspects real AXION files & executes safe diagnostics/updates
 * ==============================================================================
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const unifiedHub = require('./unified_activity_hub');

const DATA_DIR = path.join(__dirname, 'sovereign_data');
const TELEMETRY_FILE = path.join(DATA_DIR, 'axion_telemetry.json');
const DIRECTIVES_FILE = path.join(DATA_DIR, 'axion_directives.json');

fs.mkdirSync(DATA_DIR, { recursive: true });

function readJson(file, fallback) {
  try {
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (_) {}
  return fallback;
}

function writeJson(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
  } catch (_) {}
}

function recordTelemetry(payload = {}) {
  const current = readJson(TELEMETRY_FILE, {});
  const updated = {
    ...current,
    ...payload,
    lastHeartbeatAt: new Date().toISOString()
  };
  writeJson(TELEMETRY_FILE, updated);
  unifiedHub.recordActivity('hermes', 'AXION_TELEMETRY', `AXION heartbeat: ${updated.status || 'ONLINE'} | Models: ${(updated.ollamaModels || []).length} | PendingUpdates: ${updated.pendingUpdates || 0}`);
  return updated;
}

function getTelemetry() {
  return readJson(TELEMETRY_FILE, {
    status: 'AWAITING_LOCAL_SYNC',
    appName: 'AXION (TheMasterpiece OS)',
    lastHeartbeatAt: null,
    ollamaOnline: false,
    ollamaModels: [],
    pendingUpdates: 0,
    issuesDetected: []
  });
}

async function createDirective(instruction, geminiRotator = null) {
  const directives = readJson(DIRECTIVES_FILE, []);
  const id = `AXION-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

  let actionType = 'RUN_HEALTH_AUDIT';
  const lower = String(instruction || '').toLowerCase();
  if (/update|upgrade|feed|अपडेट/i.test(lower)) actionType = 'REFRESH_UPDATE_FEED';
  else if (/syntax|fix|repair|heal|bug|फिक्स|ठीक/i.test(lower)) actionType = 'RUN_SYNTAX_FIX_CHECK';
  else if (/model|ollama|मॉडल/i.test(lower)) actionType = 'AUDIT_OLLAMA_MODELS';

  let aiPlan = `Directive [${actionType}] queued for AXION Terminal: ${instruction}`;
  if (geminiRotator) {
    try {
      aiPlan = await geminiRotator.generateContent(
        `You are OpenJarvis + Gemini 4 Hydrogen (XHigh) overseeing AXION Terminal (TheMasterpiece OS, local Electron/Node/Ollama OSS workspace).
User requested for AXION: "${instruction}"
Current AXION telemetry: ${JSON.stringify(getTelemetry())}
Give a crisp 3-point engineering action plan (Hindi/Hinglish) for updating/fixing AXION cleanly.`,
        { timeoutMs: 14000, maxOutputTokens: 1024 }
      );
    } catch (_) {}
  }

  const job = {
    id,
    instruction,
    actionType,
    aiPlan,
    status: 'PENDING_AXION_EXECUTION',
    createdAt: new Date().toISOString(),
    result: null,
    resolvedAt: null
  };

  directives.unshift(job);
  writeJson(DIRECTIVES_FILE, directives.slice(0, 100));
  unifiedHub.recordActivity('hermes', 'AXION_DIRECTIVE_QUEUED', `Queued AXION fix/update (${id}): ${instruction.slice(0, 60)}`);
  return job;
}

function getPendingDirectives() {
  const list = readJson(DIRECTIVES_FILE, []);
  return list.filter(d => d.status === 'PENDING_AXION_EXECUTION');
}

function getAllDirectives(limit = 20) {
  return readJson(DIRECTIVES_FILE, []).slice(0, limit);
}

function confirmDirective(id, { success, result, error } = {}) {
  const list = readJson(DIRECTIVES_FILE, []);
  const idx = list.findIndex(d => d.id === id);
  if (idx === -1) return null;

  list[idx].status = success ? 'APPLIED_VERIFIED' : 'FAILED';
  list[idx].result = result || error || 'Completed';
  list[idx].resolvedAt = new Date().toISOString();
  writeJson(DIRECTIVES_FILE, list);

  unifiedHub.recordActivity('hermes', 'AXION_DIRECTIVE_DONE', `AXION ${id}: ${list[idx].status} -> ${String(list[idx].result).slice(0, 70)}`);
  return list[idx];
}

module.exports = {
  recordTelemetry,
  getTelemetry,
  createDirective,
  getPendingDirectives,
  getAllDirectives,
  confirmDirective
};
