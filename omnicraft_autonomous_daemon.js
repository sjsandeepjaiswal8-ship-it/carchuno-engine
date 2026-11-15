/**
 * ==============================================================================
 * OMNICRAFT 360° AUTONOMOUS ZERO-TOUCH PIPELINE DAEMON
 * Fully Autonomous Orchestration: Playwright + Hermes Agent + OmniCraft + Vault PDF + Auto-Dispatch
 * ==============================================================================
 */

const fs = require('fs');
const path = require('path');
const { runOmniCraft360 } = require('./omnicraft_360_engine');
const { saveAuditReport, sendReportEmail } = require('./audit_vault');

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
  console.log(`\n🤖 [OmniCraft Autonomous Daemon] Starting Zero-Touch Run for: ${url} (${clientEmail || 'no-email'})`);

  const auditResult = await runOmniCraft360(url, {
    brandName: brandName || url.replace(/https?:\/\//, '').split('.')[0].toUpperCase(),
    niche: leadInfo.niche || 'Digital Product / Web Experience'
  });

  console.log(`✅ [OmniCraft Daemon] Audit Complete. Score: ${auditResult.scores.overall}/100.`);

  const emailHtml = `<!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #090d16; color: #e2e8f0; margin: 0; padding: 24px; }
      .card { max-width: 680px; margin: 0 auto; background: #0f172a; border-radius: 16px; border: 1px solid #334155; overflow: hidden; }
      .header { background: linear-gradient(135deg, #070e24 0%, #0f172a 100%); padding: 28px; color: #ffffff; border-bottom: 2px solid #38bdf8; }
      .score-box { background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 12px; padding: 12px 18px; display: inline-block; margin-top: 12px; }
      .content { padding: 26px; line-height: 1.6; }
      .footer { padding: 18px 26px; background: #020617; border-top: 1px solid #1e293b; font-size: 12px; color: #64748b; }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="header">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #38bdf8; font-weight: bold;">
          OmniCraft 360° Autonomous Engineering Sentry
        </div>
        <h2 style="margin: 8px 0 0 0; font-size: 22px; color: #ffffff;">Executive Digital Audit: ${url}</h2>
        <div class="score-box">
          <span style="font-size: 26px; font-weight: 900; color: #38bdf8;">${auditResult.scores.overall}</span>
          <span style="font-size: 13px; color: #94a3b8;">/100 Composite Health Index (${auditResult.browserMode})</span>
        </div>
      </div>

      <div class="content">
        <p>Dear ${clientName},</p>
        <p>CloseTesters empirical inspection evaluated <strong>${url}</strong> across Desktop (1440x900) and Mobile (393x852) viewports.</p>

        <h3 style="color: #38bdf8; margin-top: 20px;">Empirical Findings:</h3>
        <ul>
          <li><strong>Mobile Viewport Integrity:</strong> ${auditResult.playwrightInspection.mobile?.hasHorizontalOverflow ? 'Horizontal Overflow Detected' : 'Clean Mobile Viewport Bounding'}</li>
          <li><strong>axe-core WCAG Violations:</strong> ${auditResult.playwrightInspection.accessibility?.violationsCount ?? 0} violation(s)</li>
          <li><strong>Core Web Vitals:</strong> TTFB ${auditResult.playwrightInspection.coreWebVitals?.ttfbMs ?? 'N/A'}ms | LCP ${auditResult.playwrightInspection.coreWebVitals?.lcpMs ?? 'N/A'}ms</li>
          <li><strong>Uncaught Exceptions:</strong> ${auditResult.playwrightInspection.consoleErrors?.length || 0} console errors</li>
        </ul>

        <div style="background: #1e293b; border-left: 4px solid #38bdf8; padding: 14px 18px; margin: 18px 0; border-radius: 0 10px 10px 0;">
          <strong style="color: #38bdf8;">Hermes Strategic Synthesis:</strong>
          <p style="margin: 6px 0 0 0; font-size: 13px; color: #cbd5e1;">${auditResult.hermesSynthesis.executiveSummary}</p>
        </div>

        <p><strong>Recommendation:</strong><br>${auditResult.hermesSynthesis.hermesSalesPitch}</p>
      </div>

      <div class="footer">
        CloseTesters Autonomous Engineering Division &bull; support@closetesters.com &bull; closetesters.com
      </div>
    </div>
  </body>
  </html>`;

  // Save real binary PDF + HTML dossier into Audit Vault
  const vaultRecord = await saveAuditReport({
    prefix: 'CT-AUTO',
    reportType: 'omnicraft-autonomous',
    title: `OmniCraft 360° Audit: ${url}`,
    target: url,
    appName: brandName || url,
    clientName,
    clientEmail: clientEmail || '',
    score: auditResult.scores.overall,
    summary: auditResult.hermesSynthesis.executiveSummary,
    suitesExecuted: ['OmniCraft 360°'],
    degraded: Boolean(auditResult.degraded),
    htmlContent: emailHtml,
    structuredData: {
      title: `OmniCraft 360° Executive Audit — ${url}`,
      subtitle: `Composite Score: ${auditResult.scores.overall}/100 | Taste: ${auditResult.scores.tasteScore} | UX: ${auditResult.scores.impeccableScore}`,
      metrics: [
        { label: 'Target URL', value: url },
        { label: 'Overall Score', value: `${auditResult.scores.overall}/100` },
        { label: 'Taste / Impeccable UX', value: `${auditResult.scores.tasteScore}/${auditResult.scores.impeccableScore}` },
        { label: 'Mobile Overflow', value: auditResult.playwrightInspection.mobile?.hasHorizontalOverflow ? 'DETECTED' : 'NONE' },
        { label: 'WCAG Violations', value: auditResult.playwrightInspection.accessibility?.violationsCount ?? 0 }
      ],
      sections: [
        { heading: 'Hermes Strategic Synthesis', summary: auditResult.hermesSynthesis.executiveSummary },
        { heading: 'ROI Recommendation', summary: auditResult.hermesSynthesis.hermesSalesPitch },
        {
          heading: 'Actionable UI/UX Recommendations',
          items: (auditResult.impeccableRecommendations || []).map((r) => `[${r.severity}] ${r.issue}: ${r.fix}`)
        }
      ]
    }
  });

  // Autonomous PDF Email Dispatch via multi-relay failover
  let emailDispatched = false;
  let emailStatus = null;
  if (autoEmail && clientEmail && clientEmail.includes('@')) {
    emailStatus = await sendReportEmail(vaultRecord, clientEmail);
    emailDispatched = Boolean(emailStatus.delivered);
  }

  const vault = loadVault();
  const record = {
    id: vaultRecord.auditId,
    auditId: vaultRecord.auditId,
    url,
    clientName,
    clientEmail,
    scores: auditResult.scores,
    downloadPdfUrl: vaultRecord.downloadPdfUrl,
    emailDispatched,
    emailStatus,
    executedAt: new Date().toISOString()
  };
  vault.unshift(record);
  saveVault(vault.slice(0, 100));

  return {
    success: true,
    record,
    auditResult
  };
}

module.exports = {
  processAutonomousLead
};
