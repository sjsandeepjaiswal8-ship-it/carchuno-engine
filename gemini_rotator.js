/**
 * Gemini 17-Key Auto-Rotating AI Intelligence Engine
 * Handles high-concurrency requests with automatic failover and rate-limit recovery.
 * Fully optimized for Gemini 3.8 Flash (High) & 1.5 Flash.
 */

const axios = require('axios');

class GeminiKeyRotator {
  constructor(keys = []) {
    this.keys = keys.filter(k => k && k.trim().length > 10);
    this.currentIndex = 0;
    this.keyHealth = {};
    this.keys.forEach(k => {
      this.keyHealth[k] = { failures: 0, lastUsed: null, status: 'healthy' };
    });
  }

  setKeys(keys) {
    this.keys = keys.filter(k => k && k.trim().length > 10);
    this.currentIndex = 0;
    this.keys.forEach(k => {
      if (!this.keyHealth[k]) {
        this.keyHealth[k] = { failures: 0, lastUsed: null, status: 'healthy' };
      }
    });
    console.log(`[Gemini Rotator] Loaded ${this.keys.length} API Keys.`);
  }

  getActiveKey() {
    if (this.keys.length === 0) return null;
    const key = this.keys[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.keys.length;
    return key;
  }

  async generateContent(prompt, model = 'gemini-1.5-flash') {
    if (this.keys.length === 0) {
      throw new Error('No Gemini API keys registered in rotator.');
    }

    let attempts = 0;
    const maxAttempts = Math.min(this.keys.length, 5);

    while (attempts < maxAttempts) {
      const apiKey = this.getActiveKey();
      attempts++;

      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await axios.post(
          url,
          {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1024
            }
          },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 15000
          }
        );

        if (response.data && response.data.candidates && response.data.candidates.length > 0) {
          const text = response.data.candidates[0].content.parts[0].text;
          this.keyHealth[apiKey].status = 'healthy';
          this.keyHealth[apiKey].failures = 0;
          this.keyHealth[apiKey].lastUsed = new Date().toISOString();
          return text;
        }
      } catch (err) {
        console.warn(`[Gemini Rotator] Key ...${apiKey.slice(-5)} encountered error: ${err.message}. Rotating to next key...`);
        this.keyHealth[apiKey].failures = (this.keyHealth[apiKey].failures || 0) + 1;
        if (this.keyHealth[apiKey].failures > 3) {
          this.keyHealth[apiKey].status = 'cooldown';
        }
      }
    }

    throw new Error('All active Gemini keys in rotator failed. Please verify API keys.');
  }

  getStatus() {
    return {
      totalKeys: this.keys.length,
      activeKeys: this.keys.filter(k => this.keyHealth[k]?.status === 'healthy').length,
      keysStatus: Object.keys(this.keyHealth).map(k => ({
        keyMasked: `...${k.slice(-6)}`,
        status: this.keyHealth[k].status,
        failures: this.keyHealth[k].failures,
        lastUsed: this.keyHealth[k].lastUsed
      }))
    };
  }
}

module.exports = GeminiKeyRotator;
