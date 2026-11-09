/**
 * ==============================================================================
 * OMNICRAFT 360° AUTONOMOUS ZERO-TOUCH PIPELINE DAEMON
 * Fully Autonomous Orchestration: Playwright + Hermes Agent + OmniCraft + Auto-Dispatch
 * ==============================================================================
 * Workflow:
 * 1. Receives or polls new website lead (URL, Client Email, Brand Name)
 * 2. Launches Playwright in headless Chrome to crawl & audit live DOM
 * 3. Extracts Design Lang tokens & Impeccable UX heuristics
 * 4. Hermes Agent synthesizes bespoke conversion pitch, UI patches & ROI analysis
 * 5. Generates high-converting branded HTML audit dossier
 * 6. Automatically dispatches the audit report to the client via SMTP (Zero Human Touch)
 * 7. Stores telemetry and results in audit_leads_vault.json
 * ==============================================================================
 */

const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const { runOmniCraft360 } = require('./omnicraft_360_engine');

// Dedicated SMTP Transporter for Autonomous Outreach
const transporter = nodemailer.createTransport({
  host: 'smtpout.secureserver.net',
  port: 465,
  secure: true,
  auth: {
    user: 'partners@carchuno.com',
    pass: 'Closetesters@11'
  }
});

const VAULT_FILE = path.join(__dirname, 'audit_leads_vault.json');

function loadVault() {
  try {
    if (fs.existsSync(VAULT_FILE)) {
      return JSON.parse(fs.readFileSync(VAULT_FILE, 'utf8'));
    }
  } catch (_) {}
  return [];
}

function saveVault(data) {
  try {
    fs.writeFileSync(VAULT_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('[OmniCraft Daemon] Vault save error:', err.message);
  }
}

/**
 * 100% Fully Automated Single-Lead Execution Pipeline
 */
async function processAutonomousLead(leadInfo) {
  const { url, clientEmail, clientName = 'Valued Partner', brandName, autoEmail = true } = leadInfo;
  console.log(`\n🤖 [OmniCraft Autonomous Daemon] Starting Zero-Touch Run for: ${url} (${clientEmail})`);

  // Step 1: Real-time Playwright Inspection & Hermes Synthesis
  const auditResult = await runOmniCraft360(url, {
    brandName: brandName || url.replace(/https?:\/\//, '').split('.')[0].toUpperCase(),
    niche: leadInfo.niche || 'Digital Product / Web Experience'
  });

  console.log(`✅ [OmniCraft Daemon] Audit Complete. Score: ${auditResult.scores.overall}/100.`);

  // Step 2: Generate High-Converting Executive Email HTML
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
        .card { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.06); }
        .header { background: linear-gradient(135deg, #070e24 0%, #0f172a 100%); padding: 30px 28px; color: #ffffff; }
        .score-box { background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 12px; padding: 14px 20px; display: inline-block; margin-top: 14px; }
        .content { padding: 28px; line-height: 1.6; }
        .pill { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: bold; background: #e0f2fe; color: #0369a1; margin-right: 6px; }
        .cta-btn { display: inline-block; background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%); color: #ffffff !important; padding: 14px 32px; border-radius: 30px; font-weight: bold; text-decoration: none; margin: 20px 0; box-shadow: 0 4px 14px rgba(2, 132, 199, 0.4); }
        .footer { padding: 20px 28px; background: #f1f5f9; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #38bdf8; font-weight: bold;">
            OmniCraft 360° Autonomous Engineering Sentry
          </div>
          <h2 style="margin: 8px 0 0 0; font-size: 24px; color: #ffffff;">Executive Digital Audit: ${url}</h2>
          <div class="score-box">
            <span style="font-size: 28px; font-weight: 900; color: #38bdf8;">${auditResult.scores.overall}</span>
            <span style="font-size: 14px; color: #94a3b8;">/100 Composite Health Index</span>
          </div>
        </div>

        <div class="content">
          <p>Dear ${clientName},</p>
          <p>Our autonomous quality engineering sentry has executed a comprehensive multi-viewport inspection of <strong>${url}</strong> across physical OEM device viewports.</p>

          <h3 style="color: #0f172a; margin-top: 24px;">Key Diagnostic Findings:</h3>
          <ul style="padding-left: 20px;">
            <li><strong>Mobile Viewport Integrity:</strong> ${auditResult.playwrightInspection.mobile?.hasHorizontalOverflow ? '<span style="color: #ef4444; font-weight: bold;">Horizontal Overflow Detected</span> (Requires CSS fix)' : '<span style="color: #10b981; font-weight: bold;">Flawless 390px Viewport Bounding</span>'}</li>
            <li><strong>Interactive Touch Targets:</strong> ${auditResult.playwrightInspection.desktop?.buttonCount || 0} interactive elements profiled.</li>
            <li><strong>Uncaught Runtime Exceptions:</strong> ${auditResult.playwrightInspection.consoleErrors?.length || 0} console errors logged.</li>
          </ul>

          <div style="background: #f8fafc; border-left: 4px solid #38bdf8; padding: 14px 18px; margin: 20px 0; border-radius: 0 10px 10px 0;">
            <strong style="color: #0284c7;">Hermes Strategic Synthesis:</strong>
            <p style="margin: 6px 0 0 0; font-size: 13px; color: #334155;">
              ${auditResult.hermesSynthesis.executiveSummary}
            </p>
          </div>

          <p><strong>Hermes ROI Recommendation:</strong><br>
          ${auditResult.hermesSynthesis.hermesSalesPitch}</p>

          <div style="text-align: center;">
            <a href="https://closetesters.com" class="cta-btn">View Full Interactive Audit Dossier</a>
          </div>
        </div>

        <div class="footer">
          CloseTesters & CarChuno Autonomous Engineering Division<br>
          Automated Telemetry Dispatch • Powered by OmniCraft 360° & Hermes Agent
        </div>
      </div>
    </body>
    </html>
  `;

  // Step 3: Autonomous Email Dispatch (If email provided)
  let emailDispatched = false;
  if (autoEmail && clientEmail && clientEmail.includes('@')) {
    try {
      console.log(`📨 [OmniCraft Daemon] Auto-dispatching email to ${clientEmail}...`);
      await transporter.sendMail({
        from: '"OmniCraft 360° Autonomous Sentry" <partners@carchuno.com>',
        to: clientEmail,
        replyTo: 'support@closetesters.com',
        subject: `[Audit Dossier] Performance & UX Heuristic Report for ${url} (Score: ${auditResult.scores.overall}/100)`,
        html: emailHtml
      });
      emailDispatched = true;
      console.log(`✅ [OmniCraft Daemon] Successfully delivered autonomous email to: ${clientEmail}`);
    } catch (sendErr) {
      console.warn(`⚠️ [OmniCraft Daemon] Auto-dispatch warning: ${sendErr.message}`);
    }
  }

  // Step 4: Vault Record Storage
  const vault = loadVault();
  const record = {
    id: `OMNI-AUTO-${Date.now()}`,
    url,
    clientName,
    clientEmail,
    scores: auditResult.scores,
    emailDispatched,
    executedAt: new Date().toISOString()
  };
  vault.unshift(record);
  saveVault(vault.slice(0, 100)); // retain last 100 runs

  return {
    success: true,
    record,
    auditResult
  };
}

module.exports = {
  processAutonomousLead
};
