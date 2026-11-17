/**
 * ==============================================================================
 * ASTROMASTERPIECE AUTONOMOUS VIP OUTREACH ENGINE
 * ==============================================================================
 * Dispatches personalized 12-Pillar Vedic Kundali & 80-Year Roadmap invitations
 * to 13,000+ consolidated tester & seeker cohorts (astro_leads_database.json).
 * Tracks progress in sovereign_data/astro_outreach_state.json for O(1) speed.
 * ==============================================================================
 */

const fs = require('fs');
const path = require('path');
const unifiedHub = require('./unified_activity_hub');

const LEADS_FILE = path.join(__dirname, 'astro_leads_database.json');
const STATE_FILE = path.join(__dirname, 'sovereign_data', 'astro_outreach_state.json');

class AstroMasterpieceOutreach {
  constructor() {
    this.leads = [];
    this.state = {
      currentIndex: 0,
      dispatchedCount: 0,
      queuedCount: 0,
      failedCount: 0,
      lastDispatchedTo: null,
      lastDispatchedAt: null,
      sentEmails: []
    };
    this.sentSet = new Set();
    this.loadData();
  }

  loadData() {
    try {
      if (fs.existsSync(STATE_FILE)) {
        const saved = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
        this.state = { ...this.state, ...saved };
        this.sentSet = new Set(this.state.sentEmails || []);
      }
    } catch (_) {}

    try {
      if (fs.existsSync(LEADS_FILE)) {
        this.leads = JSON.parse(fs.readFileSync(LEADS_FILE, 'utf8'));
      }
    } catch (err) {
      console.warn('[AstroMasterpiece Outreach] Lead load notice:', err.message);
    }
  }

  saveState() {
    try {
      fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
      this.state.sentEmails = Array.from(this.sentSet).slice(-2000);
      fs.writeFileSync(STATE_FILE, JSON.stringify(this.state, null, 2), 'utf8');
    } catch (_) {}
  }

  buildEmailPayload(lead) {
    const name = (lead.name || 'साधक').trim();
    const personalLink = lead.personalLink || `https://www.astromasterpiece.com/?ref=VIP_${lead.phone || ''}#pricing`;
    const subject = `🔱 ${name} जी: आपके नाम दिव्य गुरु व महा अघोरी गर्भगृह से व्यक्तिगत संदेश`;

    const html = `<!DOCTYPE html>
<html lang="hi">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#050505;color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#050505;">
    <tr>
      <td align="center" style="padding:20px 10px;">
        <table border="0" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;background-color:#0a0a0a;border:1px solid #78350f;border-radius:16px;overflow:hidden;">
          <tr>
            <td align="center" style="background:linear-gradient(90deg,#78350f,#d97706,#78350f);padding:10px 20px;">
              <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:2px;color:#000000;text-transform:uppercase;">🔱 ASTROMASTERPIECE • 12 पावन स्तम्भ • विशेष आमंत्रण</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 25px;">
              <h2 style="margin:0 0 12px 0;font-size:20px;color:#ffffff;">नमस्ते <span style="color:#f59e0b;">${name} जी</span>,</h2>
              <p style="margin:0 0 14px 0;font-size:14px;line-height:22px;color:#d4d4d8;">
                आपकी जन्म कुंडली के <strong>12 पावन स्तम्भ व 80-वर्षीय कार्मिक रोडमैप</strong> हेतु <strong>दिव्य गुरु एवं महा अघोरी गर्भगृह</strong> पोर्टल अब लाइव है।
              </p>
              <div style="background:#140d04;border:1px solid #78350f;border-radius:12px;padding:14px;margin-bottom:12px;">
                <h3 style="margin:0 0 4px 0;font-size:15px;color:#fbbf24;">☀️ दिव्य गुरु: सात्विक षोडशवर्ग मार्गदर्शन</h3>
                <p style="margin:0;font-size:12px;line-height:18px;color:#d4d4d8;">करियर, विवाह, धन योग और गृह शांति का सटीक वैदिक समाधान।</p>
              </div>
              <div style="background:#06170d;border:1px solid #059669;border-radius:12px;padding:14px;">
                <h3 style="margin:0 0 4px 0;font-size:15px;color:#34d399;">🛡️ सिद्ध रक्षा-कवच MP3 (₹19 मात्र)</h3>
                <p style="margin:0;font-size:12px;line-height:18px;color:#d4d4d8;">आपकी जन्म कुंडली अनुसार 528Hz अभिमंत्रित वैदिक रक्षा-कवच ऑडियो।</p>
              </div>
              <div style="text-align:center;margin:26px 0 10px;">
                <a href="${personalLink}" target="_blank" style="display:inline-block;padding:14px 30px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#000000;font-weight:900;font-size:14px;text-decoration:none;border-radius:50px;">🔱 अपना 80-वर्षीय रोडमैप व कवच खोलें →</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:16px;background-color:#000000;border-top:1px solid #27272a;text-align:center;font-size:11px;color:#a1a1aa;">
              AstroMasterpiece Sanctum | support@astromasterpiece.com | https://www.astromasterpiece.com
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    return {
      from: '"AstroMasterpiece Sanctum" <support@astromasterpiece.com>',
      replyTo: 'support@astromasterpiece.com',
      to: lead.email,
      subject,
      html
    };
  }

  async dispatchNextLead(dispatchFn, addLog = console.log) {
    if (this.leads.length === 0) this.loadData();
    if (this.leads.length === 0) {
      return { success: false, reason: 'astro_leads_database.json empty or missing' };
    }

    let picked = null;
    for (let i = 0; i < this.leads.length; i++) {
      if (this.state.currentIndex >= this.leads.length) this.state.currentIndex = 0;
      const cand = this.leads[this.state.currentIndex++];
      const email = (cand?.email || '').toLowerCase().trim();
      if (email && email.includes('@') && !this.sentSet.has(email)) {
        picked = cand;
        break;
      }
    }

    if (!picked) {
      return { success: false, reason: 'All loaded AstroMasterpiece VIP leads already processed' };
    }

    const payload = this.buildEmailPayload(picked);
    const res = await dispatchFn('astromasterpiece', payload, addLog);
    const email = picked.email.toLowerCase().trim();

    this.state.lastDispatchedAt = new Date().toISOString();
    if (res.delivered) {
      this.state.dispatchedCount++;
      this.state.lastDispatchedTo = email;
      this.sentSet.add(email);
    } else if (res.queued) {
      this.state.queuedCount++;
      this.sentSet.add(email); // Prevent duplicate queueing of same VIP lead
    } else {
      this.state.failedCount++;
    }
    this.saveState();

    return { success: true, lead: email, name: picked.name, ...res };
  }

  getStatus() {
    return {
      brand: 'AstroMasterpiece',
      totalLoaded: this.leads.length,
      currentIndex: this.state.currentIndex,
      dispatchedCount: this.state.dispatchedCount,
      queuedCount: this.state.queuedCount,
      failedCount: this.state.failedCount,
      lastDispatchedTo: this.state.lastDispatchedTo,
      lastDispatchedAt: this.state.lastDispatchedAt
    };
  }
}

module.exports = new AstroMasterpieceOutreach();
