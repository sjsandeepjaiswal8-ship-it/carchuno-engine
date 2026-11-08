/**
 * OmniSales Anti-Ban & Strict Safety Guardrails
 * Governs all social automation, email dispatches, and AI agent actions.
 * Zero-Tolerance Policy for account bans, spam flags, or automated over-activity.
 */

const SAFETY_POLICY = {
  version: "1.0.0-PROD-STRICT",
  mode: "ULTRA_CONSERVATIVE",
  
  // Hard limits for Social Outreach (Instagram / Threads / Meta)
  socialLimits: {
    maxDirectMessagesPerDay: 15,        // STRICT: Never exceed 15 DMs/day
    maxCommentsPerDay: 20,              // STRICT: Max 20 contextual comments/day
    minDelayBetweenActionsSeconds: 120, // Min 2 minutes wait between any 2 actions
    maxDelayBetweenActionsSeconds: 300, // Natural human variance: 2 to 5 minutes
    dailyCooldownHours: 8,              // Sleep cycle: 11 PM to 7 AM IST (Zero automation)
    dryRunDefault: true                 // Default to DRY-RUN mode until explicit approval
  },

  // Safe Email Guidelines (CarChuno Dealer Network)
  emailLimits: {
    maxDispatchesPerHour: 4,            // Safe rate: 1 pitch every 15 minutes
    rateLimitPerConnection: 1,
    retryDelayMinutes: 30,
    stopOnConsecutiveFailures: 3        // Immediately halt if 3 bounces/auth errors occur
  },

  // Content & AI Tone Filters (Enforced by Gemini 3.8 Flash High)
  contentGuardrails: {
    disallowedKeywords: [
      "cheap", "guaranteed money", "earn fast", "100% discount", 
      "click here immediately", "free free free", "urgent investment"
    ],
    mandatoryTone: "Courteous, helpful, professional, consultative, non-pushy",
    requireOptOutOption: true
  }
};

class AntiBanController {
  constructor() {
    this.dailyCounters = {
      socialActions: 0,
      emailsSent: 0,
      lastActionTimestamp: 0,
      consecutiveFailures: 0,
      isEmergencyHalted: false,
      haltReason: null
    };
  }

  isWithinActiveHours() {
    // Check IST time: Pause between 23:00 and 07:00
    const now = new Date();
    const istHours = (now.getUTCHours() + 5 + Math.floor((now.getUTCMinutes() + 30) / 60)) % 24;
    return istHours >= 7 && istHours < 23;
  }

  canExecuteSocialAction() {
    if (this.dailyCounters.isEmergencyHalted) {
      return { allowed: false, reason: `Emergency Halted: ${this.dailyCounters.haltReason}` };
    }

    if (!this.isWithinActiveHours()) {
      return { allowed: false, reason: "Outside human active hours (Sleeping hours: 11 PM to 7 AM IST)." };
    }

    if (this.dailyCounters.socialActions >= (SAFETY_POLICY.socialLimits.maxDirectMessagesPerDay + SAFETY_POLICY.socialLimits.maxCommentsPerDay)) {
      return { allowed: false, reason: "Daily social action limit reached. Hard safety cap preserved." };
    }

    const elapsedSeconds = (Date.now() - this.dailyCounters.lastActionTimestamp) / 1000;
    if (elapsedSeconds < SAFETY_POLICY.socialLimits.minDelayBetweenActionsSeconds) {
      const waitRemaining = Math.ceil(SAFETY_POLICY.socialLimits.minDelayBetweenActionsSeconds - elapsedSeconds);
      return { allowed: false, reason: `Throttling active. Need to wait ${waitRemaining}s to maintain human-like behavior.` };
    }

    return { allowed: true };
  }

  recordAction(type, success = true, meta = {}) {
    this.dailyCounters.lastActionTimestamp = Date.now();
    if (success) {
      this.dailyCounters.consecutiveFailures = 0;
      if (type === 'social') this.dailyCounters.socialActions++;
      if (type === 'email') this.dailyCounters.emailsSent++;
    } else {
      this.dailyCounters.consecutiveFailures++;
      if (this.dailyCounters.consecutiveFailures >= SAFETY_POLICY.emailLimits.stopOnConsecutiveFailures) {
        this.dailyCounters.isEmergencyHalted = true;
        this.dailyCounters.haltReason = `Automatic circuit breaker triggered: ${this.dailyCounters.consecutiveFailures} consecutive failures.`;
        console.error(`🚨 [CIRCUIT BREAKER] ${this.dailyCounters.haltReason}`);
      }
    }
  }

  getRandomHumanDelayMs() {
    const min = SAFETY_POLICY.socialLimits.minDelayBetweenActionsSeconds * 1000;
    const max = SAFETY_POLICY.socialLimits.maxDelayBetweenActionsSeconds * 1000;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

module.exports = {
  SAFETY_POLICY,
  AntiBanController: new AntiBanController()
};
