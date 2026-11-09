/**
 * CloseTesters Autonomous Auto-Responder & Ticket Ingestion Engine
 * Standardized Autonomous Email System for Inbound Requests, Audits & Testing Slots
 * 
 * Routing & SLA:
 * - Direct Reply-To: support@closetesters.com
 * - Ticket Format: CTL-REQ-XXXXXX
 * - SLA: <15 Min Autonomous Telemetry | <2 Hr Real OEM Device Allocation
 */

const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const VAULT_FILE = path.join(__dirname, 'closetesters_tickets_vault.json');

// Initialize Transporter with GoDaddy/Brevo Relay
const transporter = nodemailer.createTransport({
  host: 'smtpout.secureserver.net',
  port: 465,
  secure: true,
  auth: {
    user: 'partners@carchuno.com',
    pass: 'Closetesters@11'
  }
});

function loadVault() {
  try {
    if (fs.existsSync(VAULT_FILE)) {
      return JSON.parse(fs.readFileSync(VAULT_FILE, 'utf8'));
    }
  } catch (_) {}
  return [];
}

function saveVault(tickets) {
  try {
    fs.writeFileSync(VAULT_FILE, JSON.stringify(tickets, null, 2));
  } catch (err) {
    console.error('[Ticket Vault] Save error:', err.message);
  }
}

function generateTicketId() {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `CTL-REQ-${num}`;
}

/**
 * Dispatches a standardized, branded auto-reply to client
 * and internal notification to support@closetesters.com
 */
async function processInboundInquiry(data) {
  const {
    name = 'Developer / Founder',
    email,
    phone = 'N/A',
    appName = 'Android App / Web Platform',
    targetUrl = '',
    needType = '20 Real OEM Testers / Production Clearance',
    message = '',
    source = 'Website Form'
  } = data;

  if (!email || !email.includes('@')) {
    throw new Error('Valid client email is required for automated confirmation');
  }

  const ticketId = generateTicketId();
  const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'short' });

  // Standardized High-Trust HTML Auto-Responder Email Template
  const emailHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Request Acknowledged: CloseTesters Labs</title>
    <style>
      body { margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0; }
      .container { max-width: 650px; margin: 30px auto; background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5); }
      .header { background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%); padding: 32px 30px; border-bottom: 2px solid #f59e0b; text-align: left; }
      .badge { display: inline-block; background: rgba(245, 158, 11, 0.15); border: 1px solid #f59e0b; color: #fbbf24; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; padding: 4px 12px; border-radius: 20px; margin-bottom: 12px; }
      .title { font-size: 24px; font-weight: 800; color: #ffffff; margin: 0 0 6px 0; letter-spacing: -0.5px; }
      .subtitle { font-size: 13px; color: #94a3b8; margin: 0; }
      .body-content { padding: 30px; }
      .ticket-box { background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 18px 22px; margin-bottom: 24px; }
      .ticket-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
      .ticket-label { color: #94a3b8; font-weight: 600; }
      .ticket-value { color: #f8fafc; font-weight: 700; }
      .section-heading { font-size: 14px; font-weight: 700; color: #f59e0b; text-transform: uppercase; letter-spacing: 1px; margin: 24px 0 12px 0; border-bottom: 1px solid #1e293b; padding-bottom: 6px; }
      .sla-timeline { background: #0b1120; border: 1px solid #1e293b; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
      .sla-step { display: flex; align-items: flex-start; margin-bottom: 14px; }
      .sla-step:last-child { margin-bottom: 0; }
      .sla-icon { width: 24px; height: 24px; background: #3b82f6; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; margin-right: 12px; flex-shrink: 0; }
      .sla-title { font-size: 13px; font-weight: 700; color: #f1f5f9; margin-bottom: 2px; }
      .sla-desc { font-size: 12px; color: #94a3b8; line-height: 1.4; }
      .suite-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 24px; }
      .suite-card { background: #131d31; border: 1px solid #1e293b; border-radius: 6px; padding: 12px; }
      .suite-name { font-size: 12px; font-weight: 700; color: #38bdf8; margin-bottom: 4px; }
      .suite-desc { font-size: 11px; color: #94a3b8; line-height: 1.3; }
      .reply-box { background: rgba(59, 130, 246, 0.08); border-left: 4px solid #3b82f6; padding: 14px 18px; border-radius: 0 8px 8px 0; margin-bottom: 24px; }
      .reply-title { font-size: 13px; font-weight: 700; color: #60a5fa; margin-bottom: 4px; }
      .reply-text { font-size: 12px; color: #cbd5e1; line-height: 1.5; }
      .footer { background: #0b0f19; padding: 22px 30px; border-top: 1px solid #1e293b; font-size: 11px; color: #64748b; line-height: 1.6; text-align: center; }
      .footer a { color: #f59e0b; text-decoration: none; }
      .cta-btn { display: inline-block; background: #f59e0b; color: #0b0f19; font-weight: 700; font-size: 13px; padding: 10px 20px; border-radius: 6px; text-decoration: none; margin-top: 10px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="badge">Official Request Acknowledgment</div>
        <h1 class="title">CloseTesters Labs™</h1>
        <p class="subtitle">Google Play 2026 Production Clearance Authority & Autonomous Engineering Division</p>
      </div>

      <div class="body-content">
        <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1; margin-top: 0;">
          Dear <strong>${name}</strong>,
        </p>
        <p style="font-size: 13px; line-height: 1.6; color: #94a3b8;">
          Thank you for reaching out to CloseTesters Labs. We have successfully registered your inquiry in our autonomous telemetry queue. A certified compliance and QA engineer has been assigned to your project.
        </p>

        <!-- Ticket Summary -->
        <div class="ticket-box">
          <div class="ticket-row">
            <span class="ticket-label">Tracking Reference:</span>
            <span class="ticket-value" style="color: #fbbf24; letter-spacing: 0.5px;">${ticketId}</span>
          </div>
          <div class="ticket-row">
            <span class="ticket-label">Target App / Product:</span>
            <span class="ticket-value">${appName || targetUrl || 'Android Application'}</span>
          </div>
          <div class="ticket-row">
            <span class="ticket-label">Selected Scope / Need:</span>
            <span class="ticket-value">${needType}</span>
          </div>
          <div class="ticket-row">
            <span class="ticket-label">Logged At:</span>
            <span class="ticket-value">${timestamp}</span>
          </div>
          <div class="ticket-row" style="margin-bottom: 0;">
            <span class="ticket-label">Current Pipeline Status:</span>
            <span class="ticket-value" style="color: #34d399;">QUEUED FOR AUTONOMOUS TELEMETRY</span>
          </div>
        </div>

        <!-- SLA Milestones -->
        <div class="section-heading">Verified Production Clearance SLA</div>
        <div class="sla-timeline">
          <div class="sla-step">
            <div class="sla-icon" style="background: #f59e0b;">1</div>
            <div>
              <div class="sla-title">&lt; 15 Minutes: Autonomous Pre-Flight Scan</div>
              <div class="sla-desc">Our Hermes Autonomous Agent performs initial APK manifest, DAST security header, and UI heuristic analysis.</div>
            </div>
          </div>
          <div class="sla-step">
            <div class="sla-icon" style="background: #3b82f6;">2</div>
            <div>
              <div class="sla-title">&lt; 2 Hours: 24 Dedicated OEM Handsets Rack Allocation</div>
              <div class="sla-desc">Reservation of physical hardware (Samsung Galaxy, Google Pixel, OnePlus, Xiaomi) with daily streak scheduling for Google Play 2026 rules.</div>
            </div>
          </div>
          <div class="sla-step">
            <div class="sla-icon" style="background: #10b981;">3</div>
            <div>
              <div class="sla-title">Stage 3: Executive Clearance Dossier Delivery</div>
              <div class="sla-desc">Comprehensive PDF audit with opt-in/opt-out logs, crash traces, and 14-day production clearance certificate ready for Google Play review.</div>
            </div>
          </div>
        </div>

        <!-- 4 Specialized Suites -->
        <div class="section-heading">Integrated 4-Suite Engineering Ecosystem</div>
        <div class="suite-grid">
          <div class="suite-card">
            <div class="suite-name">Suite A: OmniCraft 360°™</div>
            <div class="suite-desc">UX Audit, 120Hz Spring Physics & Speed Lab ($99 / ₹7,999)</div>
          </div>
          <div class="suite-card">
            <div class="suite-name">Suite B: ArchCraft 360°™</div>
            <div class="suite-desc">System Architecture & Interactive Flow Dossier ($149 / ₹11,999)</div>
          </div>
          <div class="suite-card">
            <div class="suite-name">Suite C: CyberShield 360°™</div>
            <div class="suite-desc">Live DAST Security & Gemini 3.8 Flash Privacy Audit ($149 / ₹11,999)</div>
          </div>
          <div class="suite-card">
            <div class="suite-name">Suite D: GeoCraft 360°™</div>
            <div class="suite-desc">Generative Engine Optimization & AI Citations ($99 / ₹7,999)</div>
          </div>
        </div>

        <div style="background: rgba(245, 158, 11, 0.08); border: 1px dashed #f59e0b; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; text-align: center;">
          <span style="font-size: 12px; color: #fbbf24; font-weight: 700;">👑 Sovereign 4-Suite Quad-Stack Bundle Available</span>
          <p style="font-size: 11px; color: #cbd5e1; margin: 4px 0 0 0;">Get complete 14-Day Testing + All 4 Engineering Suites for <strong>$299 / ₹23,999</strong> (Save 50% vs $596 individual pricing).</p>
        </div>

        <!-- Actionable Developer Direct-Reply Note -->
        <div class="reply-box">
          <div class="reply-title">💬 Have APK Builds or Specific Requirements?</div>
          <div class="reply-text">
            You do <strong>not</strong> need to wait. You can simply <strong>reply directly to this email</strong> (<a href="mailto:support@closetesters.com" style="color: #60a5fa; text-decoration: underline;">support@closetesters.com</a>) to attach:
            <ul style="margin: 6px 0 0 16px; padding: 0;">
              <li>Google Play Console Internal Testing Invite link</li>
              <li>APK / AAB download link or release notes</li>
              <li>Custom test accounts or credentials</li>
              <li>Mutual NDA (Non-Disclosure Agreement) requests</li>
            </ul>
          </div>
        </div>

        <p style="font-size: 12px; color: #64748b; line-height: 1.5;">
          <strong>Security Guarantee:</strong> CloseTesters strictly adheres to ISO 27001 zero source-code retention. All build artifacts and telemetry logs are encrypted end-to-end and deleted permanently post-certification.
        </p>
      </div>

      <div class="footer">
        CloseTesters Labs &bull; Dedicated Android OEM Testing & Architecture Division<br>
        Direct Desk: <a href="mailto:support@closetesters.com">support@closetesters.com</a> &bull; Portal: <a href="https://closetesters.com">closetesters.com</a><br>
        Ticket ID: <strong>${ticketId}</strong> &bull; Generated autonomously for ${email}
      </div>
    </div>
  </body>
  </html>
  `;

  // 1. Dispatch to Client with Reply-To set to support@closetesters.com
  const clientMailOptions = {
    from: '"CloseTesters Labs Compliance Desk" <partners@carchuno.com>',
    to: email,
    replyTo: 'support@closetesters.com',
    subject: `[${ticketId}] Request Acknowledged: Autonomous Telemetry & Production Clearance Desk`,
    html: emailHtml
  };

  // 2. Dispatch internal alert copy to support@closetesters.com
  const internalAlertHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px;">
      <h3 style="color: #0f172a; margin-top: 0;">🚨 New CloseTesters Inbound Request Logged</h3>
      <p><strong>Ticket ID:</strong> ${ticketId}</p>
      <p><strong>Client Name:</strong> ${name}</p>
      <p><strong>Client Email:</strong> <a href="mailto:${email}">${email}</a></p>
      <p><strong>Target App/URL:</strong> ${appName || targetUrl || 'N/A'}</p>
      <p><strong>Need / Suite:</strong> ${needType}</p>
      <p><strong>Message / Notes:</strong> ${message || 'None provided'}</p>
      <p><strong>Source:</strong> ${source}</p>
      <p><strong>Logged At:</strong> ${timestamp}</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 16px 0;">
      <p style="font-size: 12px; color: #64748b;">Standard auto-responder email has been delivered to ${email}. Replies will land directly in support@closetesters.com.</p>
    </div>
  `;

  const internalMailOptions = {
    from: '"CloseTesters Sentry Bot" <partners@carchuno.com>',
    to: 'support@closetesters.com',
    subject: `[INBOUND ALERT] [${ticketId}] New Client Request from ${name} (${appName || email})`,
    html: internalAlertHtml
  };

  let clientDelivered = false;
  let internalDelivered = false;

  try {
    const clientRes = await transporter.sendMail(clientMailOptions);
    clientDelivered = true;
    console.log(`✅ [Auto-Responder] Client confirmation delivered to ${email} (MessageId: ${clientRes.messageId})`);
  } catch (err) {
    console.error(`❌ [Auto-Responder] Failed delivering to client ${email}:`, err.message);
  }

  try {
    const internalRes = await transporter.sendMail(internalMailOptions);
    internalDelivered = true;
    console.log(`✅ [Auto-Responder] Internal desk alert delivered to support@closetesters.com`);
  } catch (err) {
    console.error(`⚠️ [Auto-Responder] Failed sending internal alert:`, err.message);
  }

  // Record in Vault
  const ticketRecord = {
    ticketId,
    name,
    email,
    appName,
    targetUrl,
    needType,
    message,
    source,
    clientDelivered,
    internalDelivered,
    createdAt: new Date().toISOString()
  };

  const vault = loadVault();
  vault.unshift(ticketRecord);
  saveVault(vault.slice(0, 200));

  return {
    success: true,
    ticketId,
    clientDelivered,
    internalDelivered,
    timestamp
  };
}

module.exports = {
  processInboundInquiry,
  generateTicketId
};
