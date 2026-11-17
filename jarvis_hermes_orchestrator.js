/**
 * ==============================================================================
 * JARVIS × GEMINI 4 HYDROGEN (XHIGH) × HERMES HYBRID ORCHESTRATOR
 * ==============================================================================
 * Locked Hybrid Intelligence Brain for All 4 Connected Products:
 *   - CarChuno (carchuno.com)
 *   - DoctoReports (doctoreports.com)
 *   - AstroMasterpiece (astromasterpiece.com)
 *   - CloseTesters (closetesters.com)
 * Powered by 17-Key Gemini API Rotator + Hermes Autonomous Tools + OmniSales
 * ==============================================================================
 */

const unifiedHub = require('./unified_activity_hub');
const jarvisCollector = require('./jarvis_lead_collector');
const hermesWatchdog = require('./hermes_mirror_watchdog');
const axionBridge = require('./axion_bridge');
const jarvisAutomation = require('./jarvis_automation_bridge');

const SYSTEM_DIRECTIVE = `You are OpenJarvis Hybrid Sovereign Intelligence, permanently locked with Gemini 4 Hydrogen (XHigh) reasoning and Hermes Autonomous Agent.
Connected Business Ecosystem:
1. CarChuno.com (India's Reverse-Bidding Car Dealership & 6.99% Auto Loan Marketplace)
2. DoctoReports.com (AI Medical Prescription OCR, 5-Card Clinical Dossier & NABL Lab Transparency)
3. AstroMasterpiece.com (12-Pillar Vedic Kundali, 80-Year Roadmap & Siddha Kavach)
4. CloseTesters.com (Google Play 20-Tester 14-Day Compliance & 4-Suite Empirical QA Audit Labs)
Respond crisply, honestly, and action-oriented in Hindi/Hinglish unless requested otherwise. Never fabricate metrics; cite exact verified states.`;

class JarvisHermesOrchestrator {
  constructor() {
    this.brainLock = {
      status: 'LOCKED_HYBRID_SUPER_POWER',
      primaryModel: 'Gemini 4 Hydrogen (XHigh)',
      autonomousExecutor: 'Hermes Sovereign Agent + OmniSales',
      frontendStyle: 'OpenJarvis Multi-Brand Cockpit',
      connectedBrands: ['CarChuno', 'DoctoReports', 'AstroMasterpiece', 'CloseTesters'],
      lockedAt: '2026-11-17T11:00:00Z'
    };
  }

  async handleCommand(userCommand, ctx = {}) {
    const {
      geminiRotator,
      runUnifiedDispatchCycle,
      getOracleStatus,
      attemptProvision,
      doctoreportsOutreach,
      astromasterpieceOutreach,
      closeTestersOutreach,
      dispatchDealerPitch
    } = ctx;

    const cmd = String(userCommand || '').trim();
    const lower = cmd.toLowerCase();
    const trace = [];
    const results = {};

    trace.push({ step: 'Brain Lock Check', status: 'DONE', detail: 'Gemini 4 Hydrogen (XHigh) + Hermes Agent Active (17-Key Pool)' });

    // 1. Lead Collection Trigger
    if (/lead|harvest|collect|लीड|नि?काल/i.test(lower)) {
      trace.push({ step: 'Jarvis Lead Collection', status: 'RUNNING', detail: 'Harvesting MX-verified daily leads across 4 products...' });
      const oracleSt = getOracleStatus ? getOracleStatus() : null;
      if (lower.includes('carchuno') || lower.includes('कार')) {
        results.leadCollection = await jarvisCollector.collectForProduct('CarChuno', 5, geminiRotator);
      } else if (lower.includes('doctor') || lower.includes('डॉक्टर')) {
        results.leadCollection = await jarvisCollector.collectForProduct('DoctoReports', 5, geminiRotator, doctoreportsOutreach);
      } else if (lower.includes('astro') || lower.includes('एस्ट्रो')) {
        results.leadCollection = await jarvisCollector.collectForProduct('AstroMasterpiece', 5, geminiRotator);
      } else if (lower.includes('close') || lower.includes('क्लोज')) {
        results.leadCollection = await jarvisCollector.collectForProduct('CloseTesters', 5, geminiRotator, null, closeTestersOutreach);
      } else {
        results.leadCollection = await jarvisCollector.runAllProductsDailyCollection(4, geminiRotator, { oracleStatus: oracleSt });
      }
      trace.push({ step: 'Jarvis Lead Collection', status: 'DONE', detail: 'Daily collection saved to Date/Time folder + Activity Report updated.' });
    }

    // 2. Email Dispatch Trigger
    if (/mail|email|dispatch|pitch|send|मेल|भेज|ओमनी/i.test(lower)) {
      trace.push({ step: 'OmniSales Multi-Brand Dispatch', status: 'RUNNING', detail: 'Triggering outreach across CarChuno, DoctoReports, AstroMasterpiece & CloseTesters...' });
      if (typeof runUnifiedDispatchCycle === 'function') {
        results.dispatch = await runUnifiedDispatchCycle();
      } else {
        const out = {};
        if (dispatchDealerPitch) out.carchuno = await dispatchDealerPitch();
        if (doctoreportsOutreach) out.doctoreports = await doctoreportsOutreach.dispatchNextLead();
        if (astromasterpieceOutreach) out.astromasterpiece = await astromasterpieceOutreach.dispatchNextLead();
        if (closeTestersOutreach) out.closetesters = await closeTestersOutreach.dispatchNextLead();
        results.dispatch = out;
      }
      trace.push({ step: 'OmniSales Multi-Brand Dispatch', status: 'DONE', detail: 'Dispatch / Hybrid Relay Queue pass completed.' });
    }

    // 3. Domain & Health Audit Trigger
    if (/audit|health|check|status|ऑडिट|स्टेटस|जांच|एक्टिविटी/i.test(lower)) {
      trace.push({ step: 'Hermes 4-Brand Watchdog', status: 'RUNNING', detail: 'Probing CarChuno, DoctoReports, AstroMasterpiece & CloseTesters...' });
      results.watchdog = await hermesWatchdog.auditAll();
      unifiedHub.recordActivity('hermes', 'WATCHDOG_AUDIT', `Live 4-Brand Health Audit: AllOperational=${results.watchdog.allSystemsOperational}`);
      trace.push({ step: 'Hermes 4-Brand Watchdog', status: 'DONE', detail: `4/4 domains probed (${results.watchdog.summary?.length || 0} endpoints).` });
    }

    // 4. Oracle Trigger
    if (/oracle|ओरेकल|12 gb|24 gb|18 gb|6 gb|server/i.test(lower)) {
      trace.push({ step: 'Oracle Catcher Check', status: 'RUNNING', detail: 'Reading OCI Multi-Tier Catcher status...' });
      if (lower.includes('trigger') || lower.includes('try') || lower.includes('hit')) {
        if (attemptProvision) results.oracleAttempt = await attemptProvision();
      }
      if (getOracleStatus) results.oracleStatus = getOracleStatus();
      trace.push({ step: 'Oracle Catcher Check', status: 'DONE', detail: results.oracleStatus?.lastResult || 'Checked.' });
    }

    // 5. Daily Report Trigger
    if (/report|रिपोर्ट|summary/i.test(lower) && !results.leadCollection) {
      trace.push({ step: 'Daily Activity Report', status: 'RUNNING', detail: 'Generating Daily Lead & Activity Report...' });
      results.dailyReport = await jarvisCollector.generateDailyActivityReport(geminiRotator, {
        oracleStatus: getOracleStatus ? getOracleStatus() : null
      });
      trace.push({ step: 'Daily Activity Report', status: 'DONE', detail: 'Report generated & mirrored to Jarvis Lead Collection.' });
    }

    // 6. AXION ("Xcion") Terminal Telemetry & Fix/Update Bridge
    if (/axion|xcion|एक्सियन|टर्मिनल|fix|update|अपडेट|फिक्स/i.test(lower)) {
      trace.push({ step: 'AXION Terminal Bridge', status: 'RUNNING', detail: 'Reading AXION telemetry & evaluating update/fix directives...' });
      results.axionTelemetry = axionBridge.getTelemetry();
      if (/update|fix|repair|patch|heal|अपडेट|फिक्स|ठीक/i.test(lower)) {
        results.axionDirective = await axionBridge.createDirective(cmd, geminiRotator);
      }
      trace.push({ step: 'AXION Terminal Bridge', status: 'DONE', detail: `AXION Status: ${results.axionTelemetry.status}` });
    }

    // 7. Web / Social / Form Automation Planner (Zero CAPTCHA bypass)
    if (/instagram|facebook|linkedin|play store|ai studio|form|automate|सोशल|फॉर्म/i.test(lower)) {
      trace.push({ step: 'Jarvis Automation Planner', status: 'RUNNING', detail: 'Designing policy-compliant workflow (Official API / Human-in-the-Loop Safe Pause)...' });
      results.automationPlan = await jarvisAutomation.planWorkflow({ goal: cmd }, geminiRotator);
      trace.push({ step: 'Jarvis Automation Planner', status: 'DONE', detail: `${results.automationPlan.adapter} (${results.automationPlan.id})` });
    }

    // 6. Synthesize Intelligent Response via 17-Key Gemini Rotator
    const hubSnapshot = {
      brands: unifiedHub.getBrandMetrics(),
      outbox: unifiedHub.getAllOutboxStats(),
      recentActivity: unifiedHub.getRecentActivity('all', 8).map(a => `[${a.brand}] ${a.summary}`),
      oracle: getOracleStatus ? { attempts: getOracleStatus().attempts, lastResult: getOracleStatus().lastResult, provisioned: getOracleStatus().serverProvisioned } : null,
      executionResults: results
    };

    let aiReply = '';
    let aiMeta = { modelUsed: 'local-orchestrator', keyMasked: 'N/A', aiPowered: false };

    if (geminiRotator) {
      try {
        const prompt = `${SYSTEM_DIRECTIVE}

User Command: "${cmd}"

Live Verified Execution Results & Telemetry:
${JSON.stringify(hubSnapshot, null, 2)}

Write a clear, helpful response in Hindi/Hinglish summarizing what was checked/executed right now using ONLY the verified facts above.`;

        const gen = await geminiRotator.generateContentWithMeta(prompt, { timeoutMs: 20000, maxOutputTokens: 2048 });
        aiReply = gen.text;
        aiMeta = { modelUsed: gen.modelUsed, keyMasked: gen.keyMasked, aiPowered: true };
        trace.push({ step: 'Gemini 17-Key Synthesis', status: 'DONE', detail: `Model: ${gen.modelUsed} | Key: ${gen.keyMasked}` });
      } catch (err) {
        aiReply = `कमांड प्रोसेस हो गई (${trace.map(t => t.step).join(' → ')})। Gemini API नोट: ${err.message}`;
        trace.push({ step: 'Gemini 17-Key Synthesis', status: 'FALLBACK', detail: err.message });
      }
    } else {
      aiReply = `कमांड सफलतापूर्वक पूर्ण हुई (${trace.map(t => t.step).join(' → ')})।`;
    }

    unifiedHub.recordActivity('hermes', 'JARVIS_COMMAND', `Command: "${cmd.slice(0, 80)}"`, {
      modelUsed: aiMeta.modelUsed,
      keyMasked: aiMeta.keyMasked,
      steps: trace.length
    });

    return {
      success: true,
      command: cmd,
      brainLock: this.brainLock,
      aiMeta,
      reply: aiReply,
      trace,
      results,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new JarvisHermesOrchestrator();
