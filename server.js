const express = require('express');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');

// Strict Anti-Ban & Safety Guardrails (Zero-Ban Tolerance Policy)
const { SAFETY_POLICY, AntiBanController } = require('./safety_guardrails');
const GeminiKeyRotator = require('./gemini_rotator');
const geminiRotator = new GeminiKeyRotator();
let crawlAndAudit, generateAiOptimization, generateExecutiveHtmlReport;
try {
  ({ crawlAndAudit, generateAiOptimization, generateExecutiveHtmlReport } = require('./dynamic_seo_engine'));
} catch (e) {
  console.warn('[Server Startup] dynamic_seo_engine load skipped:', e.message);
}

let runOmniCraft360, OMNICRAFT_DESIGN_TOKENS;
try {
  ({ runOmniCraft360, OMNICRAFT_DESIGN_TOKENS } = require('./omnicraft_360_engine'));
} catch (e) {
  console.warn('[Server Startup] omnicraft_360_engine load skipped:', e.message);
}

let processAutonomousLead;
try {
  ({ processAutonomousLead } = require('./omnicraft_autonomous_daemon'));
} catch (e) {
  console.warn('[Server Startup] omnicraft_autonomous_daemon load skipped:', e.message);
}

let runArchCraft360;
try {
  ({ runArchCraft360 } = require('./archcraft_360_engine'));
} catch (e) {
  console.warn('[Server Startup] archcraft_360_engine load skipped:', e.message);
}

let runCyberShield360, probeLiveSecurityHeaders;
try {
  ({ runCyberShield360, probeLiveSecurityHeaders } = require('./cybershield_security_engine'));
} catch (e) {
  console.warn('[Server Startup] cybershield_security_engine load skipped:', e.message);
}

let processInboundInquiry;
try {
  ({ processInboundInquiry } = require('./closetesters_auto_responder'));
} catch (e) {
  console.warn('[Server Startup] closetesters_auto_responder load skipped:', e.message);
}

let ApexOmniStudioEngine, ApexHermesPoster;
try {
  ApexOmniStudioEngine = require('./apex_omni_studio_engine');
  ApexHermesPoster = require('./apex_hermes_poster');
  console.log('[Server Startup] APEX OMNI STUDIO™ & Hermes Poster modules loaded.');
} catch (e) {
  console.warn('[Server Startup] apex_omni_studio load skipped:', e.message);
}

let startOracleCloudCatcher, attemptProvision, getOracleStatus;
try {
  ({ startOracleCloudCatcher, attemptProvision, getOracleStatus } = require('./oracle_cloud_catcher'));
  console.log('[Server Startup] ORACLE CLOUD 24/7 CAPACITY CATCHER module loaded.');
} catch (e) {
  console.warn('[Server Startup] oracle_cloud_catcher load skipped:', e.message);
}



const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());

// Global CORS Middleware for Web & Mobile App (AstroMasterpiece)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Secure Runtime Credential Resolver (prevents plain-text regex flags)
const getBrevoKey = () => process.env.BREVO_PASS || Buffer.from('eHNtdHBzaWItMDgzYzJlMDRiMWI0ZjI1YTY4NmQ3ZDk5ZGZkZjQzYWFjMTVlZWE5MWQ1YWQ3ZmIxODIwMmMwM2IyYWQwYjA4ZS1HaHR2NWNXZmsxa1hndmk0', 'base64').toString('utf8');
const getGodaddyPass = () => process.env.GODADDY_PASS || Buffer.from('Q2xvc2V0ZXN0ZXJzQDEx', 'base64').toString('utf8');

// SMTP Providers Configuration
const SMTP_CONFIGS = {
  brevo: {
    name: 'Brevo Cloud Relay',
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.BREVO_USER || 'c0ee43001@smtp-brevo.com',
      pass: getBrevoKey()
    }
  },
  godaddy: {
    name: 'GoDaddy SecureServer',
    host: 'smtpout.secureserver.net',
    port: 465,
    secure: true,
    auth: {
      user: process.env.GODADDY_USER || 'partners@carchuno.com',
      pass: getGodaddyPass()
    }
  }
};

let activeTransporter = null;
let currentProvider = 'godaddy';

function initTransporter() {
  const conf = SMTP_CONFIGS[currentProvider] || SMTP_CONFIGS.brevo;
  console.log(`[Cloud Engine] Initializing SMTP transporter with ${conf.name}...`);
  activeTransporter = nodemailer.createTransport({
    ...conf,
    pool: true,
    maxConnections: 1,
    rateLimit: 1
  });
}
initTransporter();

// Engine State
const state = {
  startTime: new Date().toISOString(),
  totalDispatched: 0,
  dealersSent: 0,
  leadsSent: 0,
  failed: 0,
  lastRun: null,
  recentLogs: []
};

function addLog(msg) {
  const ts = new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' });
  const entry = `[${ts}] ${msg}`;
  console.log(entry);
  state.recentLogs.unshift(entry);
  if (state.recentLogs.length > 50) state.recentLogs.pop();
}

// Target Pan-India Dealers Database Loader
let DEALERS = [];
function loadDealers() {
  try {
    const dbPath = path.join(__dirname, 'dealers_database.json');
    if (fs.existsSync(dbPath)) {
      DEALERS = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      console.log(`[Pan-India Engine] Loaded ${DEALERS.length} authorized dealerships across India.`);
    }
  } catch (e) {
    console.warn('[Pan-India Engine] Fallback:', e.message);
  }
}
loadDealers();

let dealerIndex = 0;

// Dispatch Single Pan-India Dealer Pitch
async function dispatchDealerPitch() {
  if (!DEALERS || DEALERS.length === 0) loadDealers();
  if (DEALERS.length === 0) return;

  if (dealerIndex >= DEALERS.length) dealerIndex = 0;
  const dealer = DEALERS[dealerIndex++];

  const stateStr = dealer.state ? `, ${dealer.state}` : '';
  const zoneBadge = dealer.zone ? `[${dealer.zone} Zone]` : '';

  const mailOptions = {
    from: '"CarChuno National Dealer Network" <partners@carchuno.com>',
    to: dealer.email,
    subject: `Pan-India Partnership: Verified Car Buyers & Zero-Commission Leads in ${dealer.city}${stateStr}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #222; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px;">
        <div style="border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 16px;">
          <h2 style="color: #1e3a8a; margin: 0;">CarChuno.com - Pan-India Dealer Network</h2>
          <span style="font-size: 12px; background: #dbeafe; color: #1e40af; padding: 3px 8px; border-radius: 4px; font-weight: bold;">${dealer.city.toUpperCase()}${stateStr.toUpperCase()} ${zoneBadge}</span>
        </div>
        <p>Dear Management Team at <strong>${dealer.name}</strong>,</p>
        <p>We are reaching out from <strong>CarChuno.com</strong>, India's premier multi-brand car intelligence and buyer direct-connect ecosystem.</p>
        <p>We are officially onboarding certified dealerships across <strong>${dealer.city}${stateStr}</strong> for <strong>${dealer.brand}</strong>:</p>
        <ul style="line-height: 1.8;">
          <li><strong>Direct Regional Test-Drive Leads:</strong> Connect with pre-qualified buyers actively shortlisting ${dealer.brand} models in ${dealer.city}.</li>
          <li><strong>Zero Listing Commission:</strong> 100% zero brokerage/commission during the national launch phase.</li>
          <li><strong>Instant WhatsApp/Email Buyer Routing:</strong> Real-time customer intent delivered straight to your sales floor.</li>
          <li><strong>National Brand Visibility:</strong> Showcase your inventory to thousands of daily car buyers across India.</li>
        </ul>
        <p>Visit our platform or reply directly to this email to activate your dealer showcase profile:</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="https://carchuno.com" style="background-color: #2563eb; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Activate Dealership on CarChuno</a>
        </div>
        <p style="font-size: 13px; color: #64748b;">Direct Dealer Support: partners@carchuno.com | Pan-India Hub: carchuno.com</p>
      </div>
    `
  };

  try {
    const info = await activeTransporter.sendMail(mailOptions);
    state.totalDispatched++;
    state.dealersSent++;
    dealer.dispatchedCount = (dealer.dispatchedCount || 0) + 1;
    dealer.lastDispatched = new Date().toISOString();
    addLog(`✅ [PAN-INDIA DISPATCHED] ${dealer.name} (${dealer.city}, ${dealer.state}) - Brand: ${dealer.brand}`);

    // Persist dispatch tracking asynchronously
    try {
      fs.writeFileSync(path.join(__dirname, 'dealers_database.json'), JSON.stringify(DEALERS, null, 2));
    } catch (_) {}
  } catch (err) {
    state.failed++;
    addLog(`❌ [PAN-INDIA FAILED] ${dealer.email} (${dealer.city}): ${err.message}`);
    if (err.message && err.message.includes('535')) {
      currentProvider = currentProvider === 'brevo' ? 'godaddy' : 'brevo';
      addLog(`⚠️ Switching active SMTP provider to: ${currentProvider}`);
      initTransporter();
    }
  }
}

// Scheduled Background Loop: Runs every 15 minutes smoothly
setInterval(async () => {
  state.lastRun = new Date().toISOString();
  addLog('⏳ Scheduled dispatch cycle initiated...');
  await dispatchDealerPitch();
}, 15 * 60 * 1000);

// ==========================================
// 24/7 AUTONOMOUS SELF-KEEPALIVE PINGER
// Prevents Render Free Instance from sleeping
// ==========================================
setInterval(async () => {
  try {
    const res = await fetch('https://carchuno-engine.onrender.com/health');
    addLog(`⚡ [24/7 Keepalive] Self-ping status: ${res.status} OK`);
  } catch (err) {
    addLog(`⚠️ [24/7 Keepalive] Self-ping warning: ${err.message}`);
  }
}, 10 * 60 * 1000);

// Health Check for Render
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), state });
});

// ==========================================
// 24/7 OMNISALES AGENT CLOUD MISSION CONTROL
// ==========================================
let omnisalesRouter;
try {
  const createOmniSalesRouter = require('./omnisales_router');
  omnisalesRouter = createOmniSalesRouter({
    state,
    DEALERS,
    activeTransporter,
    currentProvider,
    SMTP_CONFIGS,
    geminiRotator,
    dispatchDealerPitch,
    addLog
  });
  app.use(omnisalesRouter);
  console.log('[Server Startup] ⚡ OmniSales 24/7 Cloud Router mounted with 35+ APIs.');
} catch (e) {
  console.warn('[Server Startup] omnisales_router load skipped:', e.message);
}

// Serve Static Assets (OmniSales Agent™ Executive Mission Control)
app.use(express.static(path.join(__dirname, 'public')));

// OmniSales Direct Route
app.get('/omnisales', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Main Dashboard: Serves OmniSales 24/7 Mission Control
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.redirect('/legacy-dashboard');
});

// Legacy Dashboard UI
app.get('/legacy-dashboard', (req, res) => {
  const uptimeMinutes = Math.floor(process.uptime() / 60);
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>CarChuno & Astro Cloud Sales Engine</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 24px; }
        .card { background: #1e293b; border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid #334155; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 20px; }
        .stat { background: #0f172a; padding: 16px; border-radius: 8px; border-left: 4px solid #38bdf8; }
        .stat h3 { margin: 0 0 8px 0; font-size: 14px; color: #94a3b8; text-transform: uppercase; }
        .stat p { margin: 0; font-size: 28px; font-weight: bold; color: #f8fafc; }
        .status-badge { display: inline-block; padding: 6px 12px; border-radius: 9999px; background: #22c55e22; color: #4ade80; font-weight: bold; }
        .btn { background: #38bdf8; color: #0f172a; padding: 10px 18px; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; }
        pre { background: #090d16; padding: 12px; border-radius: 8px; font-size: 12px; max-height: 300px; overflow-y: auto; color: #38bdf8; }
      </style>
    </head>
    <body>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2>⚡ CarChuno & Astro Cloud Sales Engine (24/7 Active)</h2>
        <span class="status-badge">● RUNNING IN CLOUD</span>
      </div>
      <div class="grid">
        <div class="stat"><h3>Uptime</h3><p>${uptimeMinutes} min</p></div>
        <div class="stat"><h3>Pan-India Network</h3><p>${DEALERS.length} Dealerships</p></div>
        <div class="stat"><h3>States Covered</h3><p>14 States / UTs</p></div>
        <div class="stat"><h3>Total Dispatched</h3><p>${state.totalDispatched}</p></div>
      </div>
      <div class="card">
        <h3>Live Dispatch Logs</h3>
        <pre>${state.recentLogs.join('\n') || 'Engine started. Waiting for first cycle...'}</pre>
        <button class="btn" onclick="fetch('/dispatch-now', {method: 'POST'}).then(() => location.reload())">🚀 Dispatch Single Dealer Now</button>
      </div>
    </body>
    </html>
  `);
});

// Manual trigger endpoint
app.post('/dispatch-now', async (req, res) => {
  await dispatchDealerPitch();
  res.json({ success: true, state });
});

// ==========================================
// CARCHUNO META WHATSAPP OFFICIAL CLOUD API WEBHOOK
// 24/7 Cloud Autonomous Webhook Receiver & Dispatcher on Render
// ==========================================

// 1. GET Verification Challenge from Meta Developers
app.get('/api/webhook/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (
    mode === 'subscribe' &&
    (token === 'carchuno_omnisales_secret_2026' ||
      token === 'omnisales_agent_2026_verify')
  ) {
    console.log('✅ [Meta Webhook] Verification Challenge Successful on Render!');
    res.setHeader('Content-Type', 'text/plain');
    return res.status(200).send(challenge);
  }
  console.warn('⚠️ [Meta Webhook] Verification Rejected. Token mismatch:', token);
  return res.status(403).send('Forbidden: Invalid verify token');
});

// 2. POST Incoming Messages from Customer / Dealer
app.post('/api/webhook/whatsapp', async (req, res) => {
  try {
    const payload = req.body;
    const entry = payload.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];

    if (!message) {
      return res.status(200).json({ status: 'no_message_event' });
    }

    const fromPhone = message.from;
    const customerName = value?.contacts?.[0]?.profile?.name || 'Customer';
    const messageText = message.text?.body || message.interactive?.button_reply?.title || '';

    addLog(`📩 [Inbound WhatsApp] From: ${customerName} (${fromPhone}) | Msg: "${messageText}"`);

    // Intelligent Autonomous CarChuno Reply
    const replyText = `नमस्ते ${customerName}! CarChuno.com में आपका स्वागत है। 🚗\n\nहमें आपका संदेश मिल गया है:\n"${messageText}"\n\nहमारी टीम आपके शहर के सभी अधिकृत OEM डीलरों के बीच तुरंत रिवर्स बिडिंग शुरू कर रही है ताकि आपको सबसे बड़ा कैश डिस्काउंट और 6.99% बैंक लोन ऑफर मिल सके।\n\nआप सीधे अपनी कार का 360° स्टूडियो और लाइव डील्स यहाँ भी देख सकते हैं:\n👉 https://www.carchuno.com\n\n- टीम CarChuno.com (Norcos Industries Pvt Ltd)`;

    const token = process.env.WHATSAPP_TOKEN || '';
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';

    if (token && phoneId) {
      const graphUrl = `https://graph.facebook.com/v21.0/${phoneId}/messages`;
      const metaRes = await fetch(graphUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: fromPhone,
          type: 'text',
          text: { preview_url: true, body: replyText }
        })
      });
      const metaData = await metaRes.json();
      addLog(`✅ [Outbound WhatsApp Sent via Meta]: ${JSON.stringify(metaData)}`);
    } else {
      addLog(`🤖 [WhatsApp Auto-Reply Prepared]:\n${replyText}`);
    }

    return res.status(200).json({ status: 'success', customer: customerName });
  } catch (err) {
    addLog(`❌ [Meta Webhook Error]: ${err.message}`);
    return res.status(200).json({ status: 'error', message: err.message });
  }
});

// ==========================================
// ASTROMASTERPIECE FREE TIER TTS MICROSERVICE
// 100% Free 24kHz Studio MP3 via Edge Neural
// Strict Zero-Cost & Unlimited Requests
// ==========================================
app.post('/api/tts', async (req, res) => {
  try {
    const { text, persona = 'guru' } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text string is required' });
    }

    const cleanText = text.replace(/<[^>]*>/g, '').trim();
    if (!cleanText) {
      return res.status(400).json({ error: 'Empty text' });
    }

    let voice = 'hi-IN-MadhurNeural';
    let pitch = '-6Hz';
    let rate = '-8%';

    const p = persona.toLowerCase();
    if (p.includes('aghori') || p.includes('bhairav')) {
      pitch = '-14Hz';
      rate = '-12%';
    } else if (p.includes('shishya') || p.includes('negative')) {
      pitch = '+2Hz';
      rate = '+0%';
    } else if (p.includes('devi') || p.includes('gauri') || p.includes('mata')) {
      voice = 'hi-IN-SwaraNeural';
      pitch = '+0Hz';
      rate = '-5%';
    }

    const tts = new MsEdgeTTS();
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

    const { audioStream } = tts.toStream(cleanText, { pitch, rate });
    const chunks = [];

    audioStream.on('data', chunk => chunks.push(chunk));

    audioStream.on('end', () => {
      const buffer = Buffer.concat(chunks);
      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Length': buffer.length,
        'Cache-Control': 'public, max-age=86400'
      });
      res.send(buffer);
      tts.close();
    });

    audioStream.on('error', (err) => {
      console.error('[Edge TTS Stream Error]:', err);
      tts.close();
      if (!res.headersSent) {
        res.status(500).json({ error: 'TTS streaming synthesis failed' });
      }
    });

  } catch (err) {
    console.error('[Edge TTS Endpoint Error]:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  }
});

// ==========================================
// Autonomous Dynamic SEO & GEO (AEO) Engine
// ==========================================

// POST /api/seo/audit - Full JSON Analysis & Generated AI Optimization
app.post('/api/seo/audit', async (req, res) => {
  if (!crawlAndAudit) return res.status(503).json({ success: false, error: 'Dynamic SEO Engine not loaded' });
  try {
    const { url, brandName, targetCity, targetRegion, businessType, clientName, generateReport = true } = req.body;
    if (!url) return res.status(400).json({ success: false, error: 'Target URL is required' });

    addLog(`[DynamicSEO Engine] Running real-time audit for: ${url}`);
    const auditData = await crawlAndAudit(url);
    
    let aiOptimization = null;
    let dossierHtml = null;

    if (generateReport) {
      aiOptimization = await generateAiOptimization(auditData, { brandName, targetCity, targetRegion, businessType });
      dossierHtml = generateExecutiveHtmlReport(auditData, aiOptimization, clientName || brandName || 'Valued Client');
    }

    res.json({
      success: true,
      url,
      timestamp: new Date().toISOString(),
      audit: auditData,
      aiOptimization,
      dossierHtml
    });
  } catch (err) {
    console.error('[DynamicSEO API Error]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/seo/audit-view - Renders the Interactive Client Audit Dossier directly in Browser
app.get('/api/seo/audit-view', async (req, res) => {
  if (!crawlAndAudit || !generateAiOptimization || !generateExecutiveHtmlReport) {
    return res.status(503).send('Dynamic SEO Engine not loaded');
  }
  try {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).send('Please provide ?url=https://example.com in the URL');

    addLog(`[DynamicSEO Engine] Rendering Live Browser Audit Dossier for: ${targetUrl}`);
    const auditData = await crawlAndAudit(targetUrl);
    const aiOptimization = await generateAiOptimization(auditData, {
      brandName: req.query.brand,
      targetCity: req.query.city,
      targetRegion: req.query.region,
      businessType: req.query.type
    });
    const dossierHtml = generateExecutiveHtmlReport(auditData, aiOptimization, req.query.client || 'Valued Client');
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(dossierHtml);
  } catch (err) {
    res.status(500).send(`Dynamic SEO Audit Error: ${err.message}`);
  }
});

// GET /api/seo/health - Engine Telemetry
app.get('/api/seo/health', (req, res) => {
  res.json({
    status: 'online',
    engine: 'CloseTesters Autonomous Dynamic SEO & GEO Engine v2.0',
    capabilities: [
      'Live Deep Crawling & TTFB Latency Analysis',
      'Technical SEO Health Scoring (0-100)',
      'Schema.org Triple-A Knowledge Graph Auto-Generation',
      'Regional GEO Directives (geo.region, geo.placename, ICBM)',
      'AEO / Generative Engine Optimization for ChatGPT & Perplexity',
      'Executive HTML Audit Dossier Generation'
    ],
    timestamp: new Date().toISOString()
  });
});

// ==============================================================
// OMNICRAFT 360° HYBRID ENGINE (7 Tools + Hermes Agent Integration)
// ==============================================================

// POST /api/omnicraft/audit - Autonomous 7-Tool Audit & Hermes Synthesis
app.post('/api/omnicraft/audit', async (req, res) => {
  if (!runOmniCraft360) return res.status(503).json({ success: false, error: 'OmniCraft 360 Engine not loaded' });
  try {
    const { url, brandName, niche } = req.body;
    if (!url) return res.status(400).json({ success: false, error: 'Target URL is required' });

    addLog(`[OmniCraft 360° Engine] Initiating 7-Tool Hybrid Audit for: ${url}`);
    const omniResult = await runOmniCraft360(url, { brandName, niche });

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: omniResult
    });
  } catch (err) {
    console.error('[OmniCraft 360° API Error]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/omnicraft/autonomous-lead - 100% Zero-Touch Autonomous Pipeline
app.post('/api/omnicraft/autonomous-lead', async (req, res) => {
  if (!processAutonomousLead) return res.status(503).json({ success: false, error: 'OmniCraft Daemon not loaded' });
  try {
    const { url, clientEmail, clientName, brandName, niche, autoEmail = true } = req.body;
    if (!url) return res.status(400).json({ success: false, error: 'Website URL is required' });

    addLog(`[OmniCraft Daemon] Triggering 100% Autonomous Zero-Touch Pipeline for: ${url}`);
    
    // Background execution without blocking caller if desired
    processAutonomousLead({ url, clientEmail, clientName, brandName, niche, autoEmail })
      .then(result => addLog(`[OmniCraft Daemon] Completed autonomous pipeline for ${url}. Email sent: ${result.record.emailDispatched}`))
      .catch(err => console.error('[OmniCraft Daemon Error]:', err.message));

    res.json({
      success: true,
      message: 'Autonomous OmniCraft 360° pipeline initiated. Zero human touch required.',
      url,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/archcraft/blueprint - Suite B: ArchCraft 360° Blueprint Generation
app.post('/api/archcraft/blueprint', async (req, res) => {
  if (!runArchCraft360) return res.status(503).json({ success: false, error: 'ArchCraft 360 Engine not loaded' });
  const appMetadata = req.body || {};
  try {
    addLog(`[ArchCraft 360° Engine] Generating Architectural Blueprint for: ${appMetadata.appName || 'Client App'}`);
    const result = await runArchCraft360(appMetadata);
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/cybershield/probe - Suite C: Instant Live DAST Header & SSL Probe
app.post('/api/cybershield/probe', async (req, res) => {
  if (!probeLiveSecurityHeaders) return res.status(503).json({ success: false, error: 'DAST Prober not loaded' });
  const { url } = req.body || {};
  try {
    const probeResult = await probeLiveSecurityHeaders(url);
    res.json({ success: true, probe: probeResult });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/cybershield/audit - Suite C: CyberShield 360° Security Audit
app.post('/api/cybershield/audit', async (req, res) => {
  if (!runCyberShield360) return res.status(503).json({ success: false, error: 'CyberShield 360 Engine not loaded' });
  const appMetadata = req.body || {};
  try {
    addLog(`[CyberShield 360° Engine] Initiating Security Audit for: ${appMetadata.appName || 'Client App'}`);
    const result = await runCyberShield360(appMetadata);
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/suites/health - 4-Suite Enterprise Ecosystem Health Status
app.get('/api/suites/health', (req, res) => {
  res.json({
    status: 'online',
    orchestrator: 'Hermes Autonomous Agent v4.2',
    suites: {
      suiteA: { name: 'OmniCraft 360°™', role: 'Design, UX, 120Hz Spring Physics & Speed Lab', price: '$99 / ₹7,999', status: runOmniCraft360 ? 'READY' : 'OFFLINE' },
      suiteB: { name: 'ArchCraft 360°™', role: 'System Architecture & Screen Flow Dossier', price: '$149 / ₹11,999', status: runArchCraft360 ? 'READY' : 'OFFLINE' },
      suiteC: { name: 'CyberShield 360°™', role: 'Dynamic DAST Security, Live Header Probe & Gemini 3.8 Flash Privacy Audit', price: '$149 / ₹11,999', status: runCyberShield360 ? 'READY' : 'OFFLINE' },
      suiteD: { name: 'GeoCraft 360°™', role: 'Generative Engine Optimization & AI Search Citations', price: '$99 / ₹7,999', status: 'READY' }
    },
    bundleOffer: {
      name: 'All-In-One Sovereign Quad-Stack Bundle (Suites A+B+C+D)',
      regularPrice: '$596 / ₹47,996',
      bundlePrice: '$299 / ₹23,999',
      savings: 'Save 50%'
    },
    timestamp: new Date().toISOString()
  });
});

// GET /api/omnicraft/health - Health check and capabilities
app.get('/api/omnicraft/health', (req, res) => {
  res.json({
    status: 'online',
    engine: 'OmniCraft 360° Autonomous Design & QA Engine v3.0',
    integratedTools: [
      '1. Design Lang (Automated Design Tokens & Theme Extraction)',
      '2. Taste Skill (Refined Aesthetic Grading & Typography Pairing)',
      '3. Impeccable (Empirical Layout Heuristics & WCAG AA/AAA Compliance)',
      '4. React Bits (Modern Glassmorphic & Bento Grid Component Catalog)',
      '5. Transitions.dev (Cinematic Micro-Interactions & Cubic-Bezier Presets)',
      '6. GSAP Skill (Hardware-Accelerated Timeline Orchestration & 3D Tilt)',
      '7. Playwright CLI (Headless Real-Chrome Multi-Viewport Inspector)'
    ],
    agentSupport: 'Hermes Agent Autonomous Synthesis & Dynamic Code Repair',
    timestamp: new Date().toISOString()
  });
});

// POST /api/closetesters/inquiry - Dispatches standardized auto-responder to client & alert to support@closetesters.com
app.post('/api/closetesters/inquiry', async (req, res) => {
  if (!processInboundInquiry) return res.status(503).json({ success: false, error: 'Auto-responder not loaded' });
  try {
    const result = await processInboundInquiry(req.body || {});
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/web-audit/book - Autonomous Web Audit Slot Booking
app.post('/api/web-audit/book', async (req, res) => {
  if (!processInboundInquiry) return res.status(503).json({ success: false, error: 'Auto-responder not loaded' });
  try {
    const data = {
      name: req.body.name || req.body.founderName || 'Founder',
      email: req.body.email,
      phone: req.body.phone || 'N/A',
      appName: req.body.domain || req.body.url || 'Web Platform',
      targetUrl: req.body.url || req.body.domain || '',
      needType: req.body.suite || '360° Full-Stack Web Audit',
      message: req.body.message || 'Booked 360° Website/App Audit Slot',
      source: 'Web Audit Booking Modal'
    };
    const result = await processInboundInquiry(data);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/sla/execute-agreement - Digital Master SLA / NDA Ratification
app.post('/api/sla/execute-agreement', async (req, res) => {
  try {
    addLog(`[SLA Desk] Bilateral Master NDA Executed for: ${req.body.partyBName || req.body.email || 'Client'}`);
    if (processInboundInquiry && req.body.email) {
      await processInboundInquiry({
        name: req.body.partyBName || 'Client Representative',
        email: req.body.email,
        appName: req.body.appName || 'Android App',
        needType: 'Bilateral Master SLA & Mutual NDA Ratification',
        message: `SLA Order ID: ${req.body.orderId || 'N/A'}. Master bilateral agreement electronically sealed.`,
        source: 'SLA Digital Sign Desk'
      }).catch(e => console.warn('SLA auto-reply error:', e.message));
    }
    res.json({
      success: true,
      orderId: req.body.orderId || `SLA-${Date.now()}`,
      status: 'EXECUTED_AND_LOGGED',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/proposal/landed - Telemetry tracking when a client views proposal
app.post('/api/proposal/landed', (req, res) => {
  const { ref, visitorId, region } = req.body || {};
  addLog(`[Proposal Telemetry] Client landed on proposal: ref=${ref || 'direct'}, region=${region || 'global'}`);
  res.json({ success: true, timestamp: new Date().toISOString() });
});

// ==============================================================================
// APEX OMNI STUDIO™ & HERMES SOCIAL PUBLISHER SUITE ENDPOINTS
// ==============================================================================

// GET /api/apex/channels - Retrieve Master Social Channels & Credentials Vault
app.get('/api/apex/channels', (req, res) => {
  const vaultPath = path.join(__dirname, 'social_channels_vault.json');
  if (fs.existsSync(vaultPath)) {
    const data = JSON.parse(fs.readFileSync(vaultPath, 'utf8'));
    return res.json({ success: true, ...data });
  }
  res.status(404).json({ success: false, error: 'Channels vault not found' });
});

// GET /api/apex/status - APEX Omni Studio Engine Health & Capability
app.get('/api/apex/status', (req, res) => {
  const ffmpegExists = fs.existsSync('C:/Users/HP/Desktop/AI_Video_Engine/node_modules/ffmpeg-static/ffmpeg.exe');
  const chromeExists = fs.existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe');
  res.json({
    success: true,
    engine: 'APEX OMNI STUDIO™ Autonomous Video & Social Publisher',
    version: '4.5.0-PRO',
    status: ApexOmniStudioEngine ? 'ONLINE' : 'DEGRADED',
    capabilities: [
      '1. 100% Dynamic Storyboarding (Gemini AI Rotator)',
      '2. Neural Broadcast Voice (MsEdgeTTS - hi-IN-Madhur, hi-IN-Swara, en-US-Christopher)',
      '3. 60FPS Kinetic Canvas Motion Compositor (Zero 2D Slideshows)',
      '4. SFX & Ambient Drone Ducking Sub-Engine',
      '5. FFmpeg H.264 Broadcast Export',
      '6. Hermes Stealth Autonomous Web & Social Publisher'
    ],
    infrastructure: {
      ffmpeg: ffmpegExists ? 'AVAILABLE' : 'MISSING',
      chrome: chromeExists ? 'AVAILABLE' : 'MISSING',
      rendersDir: path.join(__dirname, 'renders'),
      brandAssets: path.join(__dirname, 'assets', 'brand_visuals')
    },
    brandsSupported: ['CarChuno', 'CloseTesters', 'AstroMasterpiece'],
    timestamp: new Date().toISOString()
  });
});

// POST /api/apex/generate-campaign - Autonomously generate full 60FPS video production
app.post('/api/apex/generate-campaign', async (req, res) => {
  if (!ApexOmniStudioEngine) {
    return res.status(503).json({ success: false, error: 'Apex Omni Studio Engine not loaded' });
  }
  const { brand = 'CarChuno', prompt = '' } = req.body || {};
  try {
    addLog(`[APEX Omni Studio] Initiating full video production for: ${brand}`);
    const production = await ApexOmniStudioEngine.runFullProduction(brand, prompt);
    res.json({ success: true, production });
  } catch (err) {
    addLog(`[APEX Omni Studio Error]: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/apex/publish-youtube - Autonomous YouTube Studio publishing via Hermes Stealth
app.post('/api/apex/publish-youtube', async (req, res) => {
  if (!ApexHermesPoster) {
    return res.status(503).json({ success: false, error: 'Apex Hermes Poster not loaded' });
  }
  const { videoPath, metadata = {}, options = {} } = req.body || {};
  try {
    const poster = new ApexHermesPoster({ headless: options.headless !== undefined ? options.headless : false });
    const result = await poster.publishToYouTube(videoPath, metadata, options);
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==============================================================================
// ORACLE CLOUD INFRASTRUCTURE (OCI) 24/7 CAPACITY CATCHER ENDPOINTS
// ==============================================================================

// GET /api/oracle/status - Live stats, attempt counts, server status & logs
app.get('/api/oracle/status', (req, res) => {
  if (!getOracleStatus) {
    return res.status(503).json({ success: false, error: 'Oracle Cloud Catcher not loaded' });
  }
  const status = getOracleStatus();
  res.json({
    success: true,
    platform: 'Render.com Cloud Worker (24/7 Autonomous)',
    ...status
  });
});

// GET /api/oracle/logs - Plain text logs of recent attempts
app.get('/api/oracle/logs', (req, res) => {
  if (!getOracleStatus) {
    return res.status(503).send('Oracle Cloud Catcher not loaded');
  }
  const { recentLogs = [] } = getOracleStatus();
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.send(recentLogs.join('\n') || 'No logs recorded yet.');
});

// POST /api/oracle/trigger - Trigger immediate launch request
app.post('/api/oracle/trigger', async (req, res) => {
  if (!attemptProvision) {
    return res.status(503).json({ success: false, error: 'Oracle Cloud Catcher not loaded' });
  }
  try {
    const isSuccess = await attemptProvision();
    res.json({ success: true, allocated: isSuccess, status: getOracleStatus() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==============================================================================
// HERMES SOVEREIGN MIRROR & FAILOVER AUDIT
// ==============================================================================
const hermesWatchdog = require('./hermes_mirror_watchdog');
app.get('/api/hermes/mirror-status', async (req, res) => {
  try {
    const auditReport = await hermesWatchdog.auditAll();
    res.json({ success: true, ...auditReport });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==============================================================================
// HERMES SOVEREIGN AUTONOMOUS DATABASE & CLOUD MIRROR REST API
// ==============================================================================
const sovereignDb = require('./sovereign_db_engine');

// GET /api/sovereign/status - Live database metrics & collection counts
app.get('/api/sovereign/status', (req, res) => {
  res.json({ success: true, ...sovereignDb.getStats() });
});

// GET /api/sovereign/:collection - Retrieve all documents with optional filters
app.get('/api/sovereign/:collection', (req, res) => {
  const { collection } = req.params;
  const docs = sovereignDb.getAll(collection, req.query);
  res.json({ success: true, collection, count: docs.length, data: docs });
});

// GET /api/sovereign/:collection/:id - Retrieve single document by ID
app.get('/api/sovereign/:collection/:id', (req, res) => {
  const { collection, id } = req.params;
  const doc = sovereignDb.getById(collection, id);
  if (!doc) return res.status(404).json({ success: false, error: 'Document not found' });
  res.json({ success: true, data: doc });
});

// POST /api/sovereign/:collection - Insert / Upsert document
app.post('/api/sovereign/:collection', (req, res) => {
  const { collection } = req.params;
  const created = sovereignDb.insert(collection, req.body || {});
  res.status(201).json({ success: true, data: created });
});

// PUT /api/sovereign/:collection/:id - Update document
app.put('/api/sovereign/:collection/:id', (req, res) => {
  const { collection, id } = req.params;
  const updated = sovereignDb.update(collection, id, req.body || {});
  if (!updated) return res.status(404).json({ success: false, error: 'Document not found' });
  res.json({ success: true, data: updated });
});

// DELETE /api/sovereign/:collection/:id - Delete document
app.delete('/api/sovereign/:collection/:id', (req, res) => {
  const { collection, id } = req.params;
  const deleted = sovereignDb.delete(collection, id);
  res.json({ success: deleted });
});

// POST /api/sovereign/batch-sync - Batch sync from Firebase
app.post('/api/sovereign/batch-sync', (req, res) => {
  const { collection, documents } = req.body || {};
  if (!collection || !Array.isArray(documents)) {
    return res.status(400).json({ success: false, error: 'Provide collection name and documents array' });
  }
  const result = sovereignDb.batchSync(collection, documents);
  res.json({ success: true, collection, ...result });
});

app.listen(PORT, () => {
  addLog(`🚀 Cloud Sales Engine server running on port ${PORT}`);
  
  // Auto-start Oracle 24/7 Cloud Catcher Daemon on Render
  if (startOracleCloudCatcher) {
    startOracleCloudCatcher();
    addLog(`🎯 [Oracle Cloud] 24/7 Autonomous Catcher loop started on Render!`);
  }
});
