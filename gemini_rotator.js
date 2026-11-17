/**
 * ==============================================================================
 * Gemini Multi-Key & Full Multi-Model Auto-Rotating AI Engine (v4.0)
 * Zero external HTTP deps — native Node fetch + AbortController.
 *
 * PRIORITY LADDER (All Live Connected Gemini Models):
 *   #1  gemini-4-hydrogen      (thinkingLevel: XHIGH — Primary Sovereign Brain)
 *   #2  gemini-4-carbon        (thinkingLevel: HIGH)
 *   #3  gemini-4-argon         (thinkingLevel: HIGH)
 *   #4  gemini-3.1-pro-preview
 *   #5  gemini-pro-latest
 *   #6  gemini-3.8-flash
 *   #7  gemini-3.7-flash
 *   #8  gemini-3.6-flash
 *   #9  gemini-3.5-flash
 *   #10 gemini-3-flash-preview
 *   #11 gemini-omni-1.2-flash
 *   #12 gemini-omni-1.1-flash
 *   #13 gemini-omni-flash-preview
 *   #14 gemini-flash-latest
 *   #15 gemini-3.5-flash-lite
 *   #16 gemini-3.1-flash-lite-preview
 *   #17 gemini-flash-lite-latest
 *   #18 gemma-4-31b-it
 *   #19 gemma-4-26b-a4b-it
 * ==============================================================================
 */

const decodeB64 = (b64) => Buffer.from(b64, 'base64').toString('utf8');

const DEFAULT_B64_KEYS = [
  'QVEuQWI4Uk42SW1zY1M4bFdGeTNjb2pXS1dTV3lUMnU0SnlxTEJibGhfWXZqNDBQVFI1U0E=',
  'QVEuQWI4Uk42S2p1TEJpLTZjN2FEVGhPYzhMaXVwZmttRUJRS2ZOcDRvVnUtWklkNER6NVE=',
  'QVEuQWI4Uk42S0NDbWlsLVdndWREV2czcmZOVFRXT0VhYWhfaDluYUNaU1UyZkN1MElmaWc=',
  'QVEuQWI4Uk42S2RZeHJHQkttS2c1SnZjN21MbkN2aUJmXzBvOHc0Z3Z6VWk3TUJXZHN3ZEE=',
  'QVEuQWI4Uk42S1liYUc3NFM2ZWRKcDVvVGx2X3lMTzU3N2ZqSlJBVmQzcW0zNDBuTUVQenc=',
  'QVEuQWI4Uk42TFJ3ZlBUZ2ZFb0xKckZmTkFxR2R3UzFQRno2UnlKVGNWSjJrYzFhdF9Ha3c=',
  'QVEuQWI4Uk42TGFzUWNYdGo0VTFuNkhtSnVzaTgxZmpBdktsU1hWdUdNbGZPMVdjZm9zeWc=',
  'QVEuQWI4Uk42S2RndDdsOHk5YlJIdkw5VXhzdmpaOWRVTFZ5UGQ3VVNUQWtyMU5Id3gtVGc=',
  'QVEuQWI4Uk42TF9xZURtM2d4TmJoR2hTdFpqQ2tyU3RKUzNsalcwRW5qYXY0WUtMa0xzbGc=',
  'QVEuQWI4Uk42S2xOc2g3bWJVbTlXUFlsc2d0ZkFtTnZQOU1LcHVzY1lfMWhKM0RFb0FfcWc=',
  'QVEuQWI4Uk42SmduNXhjaG1JdDBqdWFDMjVmOVkwWFFsU3ltNWZIRDhLamVvTFowRy1SSlE=',
  'QVEuQWI4Uk42SWUxaVhmZFNJZ29oRjFfRFNFbkI1WF9MNTZfc085WjJmZmFKQnIzS3R0Wmc=',
  'QVEuQWI4Uk42SXhxaTdBRHlCeHBzZXR3azJUQVliWEY1aVAtY3RFSWxqOVB5MkdiX1oxNUE=',
  'QVEuQWI4Uk42SmRVal93RFM0d1hlZ3hYZnVZNEh2V01hUmlDTGhsZTlqUFAyWXNENlU1eXc=',
  'QVEuQWI4Uk42SjY4SGVTTC1iLXJNTlBPeWJYdlNneWdMNi1QMUh4ZHdBbElQdVV3cjJrRFE=',
  'QVEuQWI4Uk42STdlOGFOWElIMFVEZ0toWW8zOEFwaTFHWEtQeFhweWpNSXpaMUcwMXFZQWc=',
  'QVEuQWI4Uk42SVE2RFNaclFPNlZDdkdva25LdUtPMGZrNnZ3UXNyRk1qS0gtNzFoQnhkWWc='
];

const MODEL_SPECS = [
  { id: 'gemini-4-hydrogen', tier: 'HYDROGEN_XHIGH', priority: 1, thinkingLevel: 'XHIGH', timeoutMs: 5500, maxKeyTries: 1 },
  { id: 'gemini-4-carbon', tier: 'GEN4_HIGH', priority: 2, thinkingLevel: 'HIGH', timeoutMs: 4000, maxKeyTries: 1 },
  { id: 'gemini-4-argon', tier: 'GEN4_HIGH', priority: 3, thinkingLevel: 'HIGH', timeoutMs: 4000, maxKeyTries: 1 },
  { id: 'gemini-3.1-pro-preview', tier: 'PRO_REASONING', priority: 4, thinkingLevel: 'HIGH', timeoutMs: 4000, maxKeyTries: 1 },
  { id: 'gemini-pro-latest', tier: 'PRO_LATEST', priority: 5, thinkingLevel: 'HIGH', timeoutMs: 4000, maxKeyTries: 1 },
  { id: 'gemini-3.8-flash', tier: 'FLASH_NEXT', priority: 6, timeoutMs: 4000, maxKeyTries: 1 },
  { id: 'gemini-3.7-flash', tier: 'FLASH_NEXT', priority: 7, timeoutMs: 4000, maxKeyTries: 1 },
  { id: 'gemini-3.6-flash', tier: 'FLASH_NEXT', priority: 8, timeoutMs: 4000, maxKeyTries: 1 },
  { id: 'gemini-3.5-flash', tier: 'FLASH_NEXT', priority: 9, timeoutMs: 4000, maxKeyTries: 1 },
  { id: 'gemini-3-flash-preview', tier: 'FLASH_CORE', priority: 10, timeoutMs: 7000, maxKeyTries: 4 },
  { id: 'gemini-omni-1.2-flash', tier: 'OMNI_FLASH', priority: 11, timeoutMs: 4500, maxKeyTries: 1 },
  { id: 'gemini-omni-1.1-flash', tier: 'OMNI_FLASH', priority: 12, timeoutMs: 4500, maxKeyTries: 1 },
  { id: 'gemini-omni-flash-preview', tier: 'OMNI_FLASH', priority: 13, timeoutMs: 4500, maxKeyTries: 1 },
  { id: 'gemini-flash-latest', tier: 'FLASH_LATEST', priority: 14, timeoutMs: 4500, maxKeyTries: 1 },
  { id: 'gemini-3.5-flash-lite', tier: 'LITE_FAST', priority: 15, timeoutMs: 7000, maxKeyTries: 4 },
  { id: 'gemini-3.1-flash-lite-preview', tier: 'LITE_FAST', priority: 16, timeoutMs: 6000, maxKeyTries: 2 },
  { id: 'gemini-flash-lite-latest', tier: 'LITE_LATEST', priority: 17, timeoutMs: 7000, maxKeyTries: 4 },
  { id: 'gemma-4-31b-it', tier: 'OPEN_GEMMA4', priority: 18, timeoutMs: 5500, maxKeyTries: 1 },
  { id: 'gemma-4-26b-a4b-it', tier: 'OPEN_GEMMA4', priority: 19, timeoutMs: 5500, maxKeyTries: 1 }
];

const DEFAULT_MODEL_CASCADE = MODEL_SPECS.map((m) => m.id);

const SPECIALIST_MODELS = {
  deepResearch: 'deep-research-max-preview-04-2026',
  computerUse: 'gemini-2.5-computer-use-preview-10-2025',
  imagePro: 'gemini-3-pro-image-preview',
  imageFast: 'gemini-nano-banana-2.1',
  tts: 'gemini-3.8-flash-tts',
  music: 'lyria-3.5'
};

const HYBRID_BRAIN_LOCK = {
  primaryPersona: 'Gemini 4 Hydrogen (XHigh) + Full 19-Model Cascade + Hermes Agent',
  primaryModelId: 'gemini-4-hydrogen',
  reasoningEffort: 'XHIGH',
  totalConnectedGeminiModels: MODEL_SPECS.length,
  architecture: 'OPENJARVIS_HYDROGEN_XHIGH_HYBRID_24_7',
  connectedBrands: ['CarChuno', 'CloseTesters', 'AstroMasterpiece', 'DoctoReports'],
  lockedAt: '2026-11-17T15:30:00Z'
};

const RETIRED_MODELS = new Set([
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-2.0-flash',
  'gemini-2.5-pro',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite'
]);

function getDefaultKeys() {
  const envKeys = (process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '')
    .split(',')
    .map((k) => k.trim())
    .filter((k) => k.length > 12);

  const builtIn = DEFAULT_B64_KEYS.map(decodeB64).filter((k) => k.length > 12);
  return [...new Set([...envKeys, ...builtIn])];
}

function stripJsonFences(text) {
  let cleaned = String(text || '').trim();
  if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
  else if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
  if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
  cleaned = cleaned.trim();

  const firstObj = cleaned.indexOf('{');
  const firstArr = cleaned.indexOf('[');
  const lastObj = cleaned.lastIndexOf('}');
  const lastArr = cleaned.lastIndexOf(']');

  if (firstObj !== -1 && (firstArr === -1 || firstObj < firstArr) && lastObj > firstObj) {
    return cleaned.slice(firstObj, lastObj + 1);
  }
  if (firstArr !== -1 && lastArr > firstArr) {
    return cleaned.slice(firstArr, lastArr + 1);
  }
  return cleaned;
}

class GeminiKeyRotator {
  constructor(keys = []) {
    const seedKeys = Array.isArray(keys) && keys.length > 0 ? keys : getDefaultKeys();
    this.keys = [];
    this.currentIndex = 0;
    this.keyHealth = {};
    this.modelHealth = {};
    this.lastSuccess = null;
    MODEL_SPECS.forEach((m) => {
      this.modelHealth[m.id] = {
        ...m,
        status: 'READY_PRIORITY',
        cooldownUntil: 0,
        lastStatus: null,
        lastUsed: null,
        successes: 0,
        lastError: null
      };
    });
    this.setKeys(seedKeys);
  }

  setKeys(keys = []) {
    const normalized = (Array.isArray(keys) ? keys : getDefaultKeys())
      .map((k) => String(k || '').trim())
      .filter((k) => k.length > 12);
    this.keys = normalized.length > 0 ? [...new Set(normalized)] : getDefaultKeys();
    this.currentIndex = 0;
    this.keys.forEach((k) => {
      if (!this.keyHealth[k]) {
        this.keyHealth[k] = { failures: 0, successes: 0, lastUsed: null, cooldownUntil: 0, status: 'healthy', lastError: null };
      }
    });
  }

  getActiveKey() {
    if (this.keys.length === 0) return null;
    const now = Date.now();
    for (let i = 0; i < this.keys.length; i++) {
      const idx = (this.currentIndex + i) % this.keys.length;
      const candidate = this.keys[idx];
      const health = this.keyHealth[candidate];
      if (!health || !health.cooldownUntil || health.cooldownUntil <= now) {
        this.currentIndex = (idx + 1) % this.keys.length;
        return candidate;
      }
    }
    const key = this.keys[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.keys.length;
    return key;
  }

  async _callOnce(apiKey, modelSpec, prompt, opts = {}) {
    const model = typeof modelSpec === 'string' ? modelSpec : modelSpec.id;
    const controller = new AbortController();
    const timeoutMs = opts.timeoutMs || modelSpec.timeoutMs || 10000;
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const generationConfig = {
        temperature: opts.temperature ?? 0.35,
        maxOutputTokens: opts.maxOutputTokens ?? 2048
      };
      if (modelSpec.thinkingLevel && !opts.disableThinking) {
        generationConfig.thinkingConfig = { thinkingLevel: opts.thinkingLevel };
      }
      if (opts.responseMimeType) {
        generationConfig.responseMimeType = opts.responseMimeType;
      }

      const payload = {
        contents: [{ role: 'user', parts: [{ text: String(prompt) }] }],
        generationConfig
      };
      if (opts.systemInstruction) {
        payload.systemInstruction = { parts: [{ text: String(opts.systemInstruction) }] };
      }

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      const rawBody = await res.text();
      if (!res.ok) {
        // Retry once cleanly without thinkingConfig if a model rejects thinkingConfig with HTTP 400
        if (res.status === 400 && generationConfig.thinkingConfig && !opts.disableThinking) {
          return this._callOnce(apiKey, modelSpec, prompt, { ...opts, disableThinking: true });
        }
        const err = new Error(`HTTP ${res.status}: ${rawBody.slice(0, 160)}`);
        err.status = res.status;
        throw err;
      }

      const parsed = JSON.parse(rawBody);
      const text = parsed?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('').trim();
      if (!text) {
        throw new Error('Empty candidate content returned from Gemini');
      }
      return text;
    } finally {
      clearTimeout(timer);
    }
  }

  _buildAttemptOrder(requestedModel) {
    const now = Date.now();
    const specMap = new Map(MODEL_SPECS.map((s) => [s.id, s]));
    const ordered = [];

    if (requestedModel && !RETIRED_MODELS.has(requestedModel)) {
      ordered.push(specMap.get(requestedModel) || { id: requestedModel, tier: 'CUSTOM', timeoutMs: 9000, maxKeyTries: 3 });
    }
    for (const s of MODEL_SPECS) {
      if (s.id === requestedModel) continue;
      const mh = this.modelHealth[s.id];
      if (!mh || !mh.cooldownUntil || mh.cooldownUntil <= now) {
        ordered.push(s);
      }
    }
    // Always append cooled-down fallback models at the tail (with Hydrogen first) in case every active tier fails
    const seen = new Set(ordered.map((x) => x.id));
    for (const s of MODEL_SPECS) {
      if (!seen.has(s.id)) ordered.push(s);
    }
    return ordered;
  }

  async generateContentWithMeta(prompt, optsOrModel = {}) {
    if (this.keys.length === 0) {
      throw new Error('No Gemini API keys configured.');
    }

    const opts = typeof optsOrModel === 'string'
      ? { model: RETIRED_MODELS.has(optsOrModel) ? null : optsOrModel }
      : (optsOrModel || {});

    const models = this._buildAttemptOrder(opts.model);
    const startTime = Date.now();
    const fastJumpMs = opts.fastJumpMs || 9000;
    let lastError = null;

    for (const spec of models) {
      // If high experimental/thinking tiers already took >9s, jump straight to fast guaranteed Flash/Lite responders
      if (Date.now() - startTime > fastJumpMs && !['FLASH_CORE', 'LITE_FAST', 'LITE_LATEST'].includes(spec.tier)) {
        continue;
      }
      const modelId = spec.id;
      const mh = this.modelHealth[modelId] || (this.modelHealth[modelId] = { id: modelId, successes: 0 });
      const maxTries = Math.min(this.keys.length, spec.maxKeyTries || 3);
      let overloadHits = 0;

      for (let kTry = 0; kTry < maxTries; kTry++) {
        const apiKey = this.getActiveKey();
        if (!apiKey) break;
        try {
          const text = await this._callOnce(apiKey, spec, prompt, {
            ...opts,
            timeoutMs: opts.perTryTimeoutMs || spec.timeoutMs || 6000
          });
          const kh = this.keyHealth[apiKey];
          const nowIso = new Date().toISOString();
          kh.status = 'healthy';
          kh.failures = 0;
          kh.successes = (kh.successes || 0) + 1;
          kh.cooldownUntil = 0;
          kh.lastUsed = nowIso;
          kh.lastError = null;

          mh.status = 'ONLINE_ACTIVE';
          mh.cooldownUntil = 0;
          mh.lastStatus = 200;
          mh.lastUsed = nowIso;
          mh.successes = (mh.successes || 0) + 1;
          mh.lastError = null;

          const thinkingTag = spec.thinkingLevel ? ` (${spec.thinkingLevel})` : '';
          this.lastSuccess = { model: `${modelId}${thinkingTag}`, rawModel: modelId, keyMasked: `...${apiKey.slice(-6)}`, at: nowIso };
          return {
            text,
            modelUsed: `${modelId}${thinkingTag}`,
            rawModel: modelId,
            thinkingLevel: spec.thinkingLevel || null,
            keyMasked: `...${apiKey.slice(-6)}`,
            aiPowered: true
          };
        } catch (err) {
          lastError = err;
          const kh = this.keyHealth[apiKey];
          kh.failures = (kh.failures || 0) + 1;
          kh.lastError = err.message;
          mh.lastStatus = err.status || 'TIMEOUT';
          mh.lastError = err.message;

          if (err.status === 503 || !err.status) {
            overloadHits++;
            // Model-wide demand spike (e.g. Hydrogen 503): cooldown 45s so Priority #1 recovers cleanly next wave
            if (overloadHits >= (spec.maxKeyTries || 1)) {
              mh.status = err.status === 503 ? 'HIGH_DEMAND_COOLDOWN' : 'TIMEOUT_COOLDOWN';
              mh.cooldownUntil = Date.now() + 45000;
              break;
            }
          } else if (err.status === 429) {
            kh.cooldownUntil = Date.now() + 20000;
            kh.status = 'cooldown';
            if (overloadHits === 0 && maxTries === 1) {
              mh.status = 'QUOTA_COOLDOWN';
              mh.cooldownUntil = Date.now() + 30000;
            }
          } else if (err.status === 401 || err.status === 403) {
            kh.cooldownUntil = Date.now() + 60000;
            kh.status = 'auth_error';
          } else if (err.status === 404) {
            mh.status = 'NOT_FOUND';
            mh.cooldownUntil = Date.now() + 3600000;
            break;
          }
        }
      }
    }

    throw new Error(`Gemini AI unavailable across ${this.keys.length} keys & ${models.length} models: ${lastError ? lastError.message : 'Unknown error'}`);
  }

  async generateContent(prompt, optsOrModel = {}) {
    const res = await this.generateContentWithMeta(prompt, optsOrModel);
    return res.text;
  }

  async generateJson(prompt, opts = {}) {
    const meta = await this.generateContentWithMeta(prompt, {
      ...opts,
      responseMimeType: 'application/json'
    });
    const cleaned = stripJsonFences(meta.text);
    const data = JSON.parse(cleaned);
    return {
      data,
      rawText: meta.text,
      modelUsed: meta.modelUsed,
      keyMasked: meta.keyMasked,
      aiPowered: true
    };
  }

  getStatus() {
    const now = Date.now();
    return {
      totalKeys: this.keys.length,
      activeKeys: this.keys.filter((k) => {
        const h = this.keyHealth[k];
        return h && (!h.cooldownUntil || h.cooldownUntil <= now);
      }).length,
      primaryPriorityModel: 'gemini-4-hydrogen (thinkingLevel: XHIGH)',
      modelsCascade: DEFAULT_MODEL_CASCADE,
      modelSpecs: MODEL_SPECS.map((s) => ({
        ...s,
        health: this.modelHealth[s.id]
      })),
      specialistModels: SPECIALIST_MODELS,
      hybridBrainLock: HYBRID_BRAIN_LOCK,
      lastSuccess: this.lastSuccess,
      keysStatus: this.keys.map((k) => ({
        keyMasked: `...${k.slice(-6)}`,
        status: this.keyHealth[k]?.status || 'healthy',
        successes: this.keyHealth[k]?.successes || 0,
        failures: this.keyHealth[k]?.failures || 0,
        lastUsed: this.keyHealth[k]?.lastUsed || null
      }))
    };
  }
}

let sharedRotator = null;
function getSharedRotator() {
  if (!sharedRotator) sharedRotator = new GeminiKeyRotator();
  return sharedRotator;
}

async function generateContent(prompt, optsOrModel = {}) {
  return getSharedRotator().generateContent(prompt, optsOrModel);
}

async function generateJson(prompt, opts = {}) {
  return getSharedRotator().generateJson(prompt, opts);
}

GeminiKeyRotator.GeminiKeyRotator = GeminiKeyRotator;
GeminiKeyRotator.getSharedRotator = getSharedRotator;
GeminiKeyRotator.generateContent = generateContent;
GeminiKeyRotator.generateJson = generateJson;
GeminiKeyRotator.MODEL_SPECS = MODEL_SPECS;
GeminiKeyRotator.DEFAULT_MODEL_CASCADE = DEFAULT_MODEL_CASCADE;
GeminiKeyRotator.SPECIALIST_MODELS = SPECIALIST_MODELS;
GeminiKeyRotator.HYBRID_BRAIN_LOCK = HYBRID_BRAIN_LOCK;
GeminiKeyRotator.stripJsonFences = stripJsonFences;

module.exports = GeminiKeyRotator;
