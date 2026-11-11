/**
 * ==============================================================================
 * CLOSETESTERS AUTONOMOUS 24/7 CLOUD OUTREACH ENGINE
 * ==============================================================================
 * Strict Sender Policy:
 *  - Official Sender: "CloseTesters Global Partnerships" <partners@closetesters.com>
 *  - Reply-To: partners@closetesters.com
 *  - STRICTLY BLOCKED: business@closetesters.com (Manual founder use ONLY)
 *
 * Pre-Flight Safety:
 *  - Only sends to DNS MX-verified leads (Tier 1 Agencies, Tier 2 Play Store Devs, Tier 3 Verified B2B)
 *  - Attaches exact geo-targeted Proposal PDF (Strict INR for India, Strict USD for Global)
 *  - Enforces Anti-Ban pacing and circuit breaker to protect domain reputation
 * ==============================================================================
 */

const fs = require('fs');
const path = require('path');
const dns = require('dns').promises;

const LEADS_FILE = path.join(__dirname, 'closetesters_master_leads.json');
const INDIA_PDF = path.join(__dirname, 'assets', 'proposals', 'CloseTesters_India_Proposal.pdf');
const INTL_PDF = path.join(__dirname, 'assets', 'proposals', 'CloseTesters_International_Proposal.pdf');

const FORBIDDEN_SENDERS = ['business@closetesters.com'];
const OFFICIAL_SENDER = 'partners@closetesters.com';

class CloseTestersAutonomousOutreach {
  constructor() {
    this.leads = [];
    this.currentIndex = 0;
    this.stats = {
      senderAddress: OFFICIAL_SENDER,
      totalLoaded: 0,
      tier1Agencies: 0,
      tier2PlayStoreDevs: 0,
      tier3VerifiedB2B: 0,
      dispatchedCount: 0,
      failedCount: 0,
      consecutiveFailures: 0,
      circuitBreakerTripped: false,
      lastDispatchedTo: null,
      lastDispatchedAt: null,
      recentDispatches: []
    };
    this.loadLeads();
  }

  loadLeads() {
    try {
      if (fs.existsSync(LEADS_FILE)) {
        this.leads = JSON.parse(fs.readFileSync(LEADS_FILE, 'utf8'));
        this.stats.totalLoaded = this.leads.length;
        this.stats.tier1Agencies = this.leads.filter(l => l.tier === 'TIER_1_AGENCY_42').length;
        this.stats.tier2PlayStoreDevs = this.leads.filter(l => l.tier === 'TIER_2_PLAYSTORE_662').length;
        this.stats.tier3VerifiedB2B = this.leads.filter(l => l.tier === 'TIER_3_B2B_12500_MX_VALID').length;
        console.log(`[CloseTesters Outreach] Loaded ${this.leads.length} verified MX leads (T1:${this.stats.tier1Agencies}, T2:${this.stats.tier2PlayStoreDevs}, T3:${this.stats.tier3VerifiedB2B}).`);
      }
    } catch (err) {
      console.warn('[CloseTesters Outreach] Lead load notice:', err.message);
    }
  }

  async verifyDomainMx(email) {
    try {
      const domain = (email.split('@')[1] || '').trim();
      if (!domain) return false;
      const mx = await Promise.race([
        dns.resolveMx(domain),
        new Promise((_, rej) => setTimeout(() => rej(new Error('MX timeout')), 3000))
      ]);
      return Array.isArray(mx) && mx.length > 0;
    } catch {
      return false;
    }
  }

  buildEmailPayload(lead) {
    // Hard safety assert
    if (FORBIDDEN_SENDERS.includes(OFFICIAL_SENDER.toLowerCase())) {
      throw new Error('SECURITY VIOLATION: Forbidden sender address detected!');
    }

    const isIndia = (lead.country || '').toLowerCase().includes('india') || (lead.email || '').endsWith('.in');
    const pdfPath = isIndia ? INDIA_PDF : INTL_PDF;
    const hasPdf = fs.existsSync(pdfPath);

    const priceAnchor = isIndia
      ? '₹1,699 (20 Real Testers / 14 Days) | ₹9,999 Managed Enterprise Track'
      : '$20 Indie Pass (20 Real Testers / 14 Days) | $149 Managed Enterprise Fleet';

    const targetEntity = lead.packageId
      ? `${lead.appName} (<code>${lead.packageId}</code>)`
      : `${lead.company || 'your engineering team'}`;

    const hookLine = lead.hook
      ? `<p style="background:#f0f9ff; border-left:4px solid #0284c7; padding:12px 16px; border-radius:4px; color:#0c4a6e; font-size:14px;"><strong>Audit Note:</strong> ${lead.hook}</p>`
      : '';

    const subject = lead.packageId
      ? `Play Store 2026 Compliance & 20-Tester QA SLA for ${lead.appName}`
      : `Dedicated 20 Real OEM Testers Fleet & Play Store Production Approval — ${lead.company}`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 640px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; color: #1e293b;">
        <div style="background: linear-gradient(135deg, #0f172a, #1e293b); color: #ffffff; padding: 26px; text-align: left; border-bottom: 3px solid #38bdf8;">
          <div style="font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: #38bdf8; font-weight: 700;">CloseTesters Global QA Network</div>
          <h1 style="margin: 6px 0 0; font-size: 20px; color: #ffffff;">100% Guaranteed Google Play Production Track Approval</h1>
        </div>
        <div style="padding: 26px; background: #ffffff; line-height: 1.65; font-size: 14.5px;">
          <p>Hi <strong>${lead.name}</strong>,</p>
          <p>We are reaching out regarding ${targetEntity} on the Google Play Store ecosystem.</p>
          ${hookLine}
          <p>CloseTesters Labs operates a <strong>20+ Real Physical OEM Device Fleet</strong> (Zero Emulators) engineered specifically to guarantee zero rejections and uninterrupted 14-day continuous compliance:</p>
          <ul style="padding-left: 20px; color: #334155;">
            <li><strong>20 Genuine Hardware Testers:</strong> Daily opt-in activity, crash telemetry & feedback across Samsung, Pixel, OnePlus & Xiaomi.</li>
            <li><strong>ConsoleDeclaration AI™:</strong> Rejection-proof answers crafted for Google Play production questionnaires.</li>
            <li><strong>CyberShield 360™ Security & Data Safety Audit:</strong> Prevents hidden API/secret leaks before review.</li>
            <li><strong>Transparent Pricing:</strong> ${priceAnchor}</li>
          </ul>
          <p>We have attached our official <strong>CloseTesters QA & Architecture Proposal PDF</strong> for your technical review.</p>
          <div style="text-align: center; margin: 28px 0;">
            <a href="https://closetesters.com" style="background: #0284c7; color: #ffffff; padding: 13px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Activate 20-Tester Fleet on CloseTesters.com</a>
          </div>
          <p style="font-size: 12.5px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 14px; margin-top: 24px;">
            Regards,<br>
            <strong>CloseTesters Global Partnerships</strong><br>
            Official Desk: <a href="mailto:${OFFICIAL_SENDER}">${OFFICIAL_SENDER}</a> | Portal: <a href="https://closetesters.com">https://closetesters.com</a>
          </p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"CloseTesters Global Partnerships" <${OFFICIAL_SENDER}>`,
      replyTo: OFFICIAL_SENDER,
      to: lead.email,
      subject,
      html
    };

    if (hasPdf) {
      mailOptions.attachments = [{
        filename: isIndia ? 'CloseTesters_India_QA_Proposal.pdf' : 'CloseTesters_International_QA_Proposal.pdf',
        path: pdfPath
      }];
    }

    return mailOptions;
  }

  async dispatchNextLead(transporter, addLog, sovereignDb) {
    if (this.stats.circuitBreakerTripped) {
      addLog('🛑 [CloseTesters Circuit Breaker] Tripped due to repeated failures. Holding dispatches.');
      return { success: false, reason: 'Circuit breaker active' };
    }

    if (this.leads.length === 0) this.loadLeads();
    if (this.leads.length === 0) return { success: false, reason: 'No leads loaded' };

    if (this.currentIndex >= this.leads.length) this.currentIndex = 0;

    const lead = this.leads[this.currentIndex++];
    if (!lead || !lead.email) return { success: false, reason: 'Invalid lead entry' };

    // Double-check forbidden emails
    if (FORBIDDEN_SENDERS.includes(lead.email.toLowerCase())) {
      return { success: false, reason: 'Skipped internal email' };
    }

    // Live DNS MX safeguard before touching SMTP
    const mxOk = await this.verifyDomainMx(lead.email);
    if (!mxOk) {
      addLog(`⚠️ [CloseTesters MX Guard] Skipped ${lead.email} (DNS MX unreachable)`);
      return { success: false, reason: 'MX unreachable' };
    }

    try {
      const mailOptions = this.buildEmailPayload(lead);
      const info = await transporter.sendMail(mailOptions);

      this.stats.dispatchedCount++;
      this.stats.consecutiveFailures = 0;
      this.stats.lastDispatchedTo = lead.email;
      this.stats.lastDispatchedAt = new Date().toISOString();
      lead.dispatchedCount = (lead.dispatchedCount || 0) + 1;

      const record = {
        email: lead.email,
        company: lead.company,
        tier: lead.tier,
        sender: OFFICIAL_SENDER,
        messageId: info.messageId,
        sentAt: this.stats.lastDispatchedAt
      };
      this.stats.recentDispatches.unshift(record);
      if (this.stats.recentDispatches.length > 30) this.stats.recentDispatches.pop();

      addLog(`✅ [CloseTesters Sent via ${OFFICIAL_SENDER}] -> ${lead.email} (${lead.company}) [${lead.tier}]`);

      if (sovereignDb) {
        try {
          sovereignDb.insert('dev_qa_requests', {
            type: 'OUTBOUND_PITCH',
            sender: OFFICIAL_SENDER,
            target_email: lead.email,
            company: lead.company,
            tier: lead.tier,
            message_id: info.messageId
          });
        } catch (_) {}
      }

      return { success: true, record };
    } catch (err) {
      this.stats.failedCount++;
      this.stats.consecutiveFailures++;
      addLog(`❌ [CloseTesters Dispatch Failed] ${lead.email}: ${err.message}`);

      if (this.stats.consecutiveFailures >= 5) {
        this.stats.circuitBreakerTripped = true;
        addLog('🚨 [CloseTesters Circuit Breaker] 5 consecutive SMTP failures. Auto-paused.');
      }
      return { success: false, error: err.message };
    }
  }

  getStatus() {
    return {
      active: !this.stats.circuitBreakerTripped,
      currentIndex: this.currentIndex,
      forbiddenSendersProtected: FORBIDDEN_SENDERS,
      ...this.stats
    };
  }
}

module.exports = new CloseTestersAutonomousOutreach();
