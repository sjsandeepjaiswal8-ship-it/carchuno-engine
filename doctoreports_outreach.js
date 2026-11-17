/**
 * ==============================================================================
 * DOCTOREPORTS AUTONOMOUS B2B LEAD HARVESTER & OUTREACH ENGINE
 * ==============================================================================
 * Targets genuine Indian NABL Diagnostic Labs, Hospital Networks & Digital Clinics.
 * Pitches DoctoReports (https://www.doctoreports.com) AI Prescription OCR,
 * Plain-Language 5-Card Clinical Dossiers & NABL Price Transparency Engine.
 * ==============================================================================
 */

const fs = require('fs');
const path = require('path');
const dns = require('dns').promises;
const unifiedHub = require('./unified_activity_hub');

const LEADS_FILE = path.join(__dirname, 'doctoreports_leads.json');

const HEALTHCARE_PARTNER_SEEDS = [
  { company: 'Dr Lal PathLabs Ltd', domain: 'lalpathlabs.com', city: 'Delhi NCR', type: 'Diagnostic Network', prefixes: ['customercare', 'partnerships', 'info'] },
  { company: 'Thyrocare Technologies', domain: 'thyrocare.com', city: 'Navi Mumbai', type: 'NABL Diagnostic Chain', prefixes: ['support', 'wellness', 'b2b'] },
  { company: 'Metropolis Healthcare', domain: 'metropolisindia.com', city: 'Mumbai', type: 'Pathology Network', prefixes: ['support', 'corporate', 'partners'] },
  { company: 'Apollo Diagnostics', domain: 'apollodiagnostics.in', city: 'Hyderabad', type: 'Diagnostic Chain', prefixes: ['customercare', 'info', 'partnerships'] },
  { company: 'Redcliffe Labs', domain: 'redcliffelabs.com', city: 'Noida', type: 'Digital Diagnostics', prefixes: ['care', 'partners', 'support'] },
  { company: 'Healthians Diagnostics', domain: 'healthians.com', city: 'Gurugram', type: 'Preventive Health Lab', prefixes: ['care', 'partnerships', 'cs'] },
  { company: 'Agilus Diagnostics', domain: 'agilusdiagnostics.com', city: 'Gurugram', type: 'Reference Pathology', prefixes: ['care', 'partnerships', 'info'] },
  { company: 'Suburban Diagnostics', domain: 'suburbandiagnostics.com', city: 'Mumbai', type: 'NABL Diagnostics', prefixes: ['care', 'corporate', 'info'] },
  { company: 'Practo Health', domain: 'practo.com', city: 'Bengaluru', type: 'Digital Clinics & EMR', prefixes: ['support', 'partners', 'doctors'] },
  { company: 'Tata 1mg Labs', domain: '1mg.com', city: 'Gurugram', type: 'Digital Health & Labs', prefixes: ['care', 'partnerships', 'labs'] },
  { company: 'PharmEasy Diagnostics', domain: 'pharmeasy.in', city: 'Mumbai', type: 'Healthcare Platform', prefixes: ['care', 'partners', 'diagnostics'] },
  { company: 'Max Healthcare', domain: 'maxhealthcare.in', city: 'New Delhi', type: 'Hospital Network', prefixes: ['corporate', 'patientcare', 'partnerships'] },
  { company: 'Fortis Healthcare', domain: 'fortishealthcare.com', city: 'Gurugram', type: 'Hospital Network', prefixes: ['reachus', 'partnerships', 'corporate'] },
  { company: 'Manipal Hospitals', domain: 'manipalhospitals.com', city: 'Bengaluru', type: 'Multi-Specialty Network', prefixes: ['info', 'partnerships', 'corporate'] },
  { company: 'Narayana Health', domain: 'narayanahealth.org', city: 'Bengaluru', type: 'Healthcare Group', prefixes: ['care', 'partnerships', 'info'] },
  { company: 'Medanta The Medicity', domain: 'medanta.org', city: 'Gurugram', type: 'Super-Specialty', prefixes: ['info', 'corporate', 'partners'] },
  { company: 'Aster DM Healthcare India', domain: 'asterhospitals.in', city: 'Kochi', type: 'Hospital Network', prefixes: ['info', 'corporate', 'care'] },
  { company: 'Orange Health Labs', domain: 'orangehealth.in', city: 'Bengaluru', type: 'On-Demand NABL Lab', prefixes: ['care', 'partners', 'hello'] }
];

class DoctoReportsOutreach {
  constructor() {
    this.leads = [];
    this.currentIndex = 0;
    this.stats = {
      brand: 'DoctoReports',
      totalLoaded: 0,
      dispatchedCount: 0,
      queuedCount: 0,
      failedCount: 0,
      lastDispatchedTo: null,
      lastDispatchedAt: null
    };
    this.loadLeads();
  }

  loadLeads() {
    try {
      if (fs.existsSync(LEADS_FILE)) {
        this.leads = JSON.parse(fs.readFileSync(LEADS_FILE, 'utf8'));
        this.stats.totalLoaded = this.leads.length;
      }
    } catch (err) {
      console.warn('[DoctoReports Outreach] Lead load notice:', err.message);
    }
  }

  saveLeads() {
    try {
      fs.writeFileSync(LEADS_FILE, JSON.stringify(this.leads, null, 2), 'utf8');
      this.stats.totalLoaded = this.leads.length;
    } catch (err) {
      console.warn('[DoctoReports Outreach] Lead save notice:', err.message);
    }
  }

  async verifyMx(domain) {
    try {
      const mx = await Promise.race([
        dns.resolveMx(domain),
        new Promise((_, rej) => setTimeout(() => rej(new Error('MX timeout')), 3000))
      ]);
      return Array.isArray(mx) && mx.length > 0;
    } catch {
      return false;
    }
  }

  async harvestLeads(limit = 12) {
    this.loadLeads();
    const existing = new Set(this.leads.map(l => (l.email || '').toLowerCase().trim()));
    const added = [];

    for (const seed of HEALTHCARE_PARTNER_SEEDS) {
      if (added.length >= limit) break;
      const mxOk = await this.verifyMx(seed.domain);
      if (!mxOk) continue;

      for (const prefix of seed.prefixes) {
        const email = `${prefix}@${seed.domain}`.toLowerCase();
        if (existing.has(email)) continue;

        const lead = {
          company: seed.company,
          domain: seed.domain,
          city: seed.city,
          type: seed.type,
          email,
          mxVerified: true,
          dispatchedCount: 0,
          discoveredAt: new Date().toISOString()
        };
        this.leads.push(lead);
        added.push(lead);
        existing.add(email);
        break;
      }
    }

    if (added.length > 0) {
      this.saveLeads();
      unifiedHub.recordActivity('doctoreports', 'LEADS_HARVESTED', `DNS MX-verified ${added.length} healthcare & diagnostic lab partners (Total: ${this.leads.length})`, {
        sample: added.slice(0, 3).map(l => l.email)
      });
    }

    return {
      success: true,
      addedCount: added.length,
      totalLeads: this.leads.length,
      sample: added.slice(0, 5)
    };
  }

  buildEmailPayload(lead, aiHook = null) {
    const subject = `Patient Engagement & NABL Lab Clarity Partnership — DoctoReports AI for ${lead.company}`;
    const customInsight = aiHook
      ? `<p style="background:#ecfeff;border-left:4px solid #0891b2;padding:12px 16px;border-radius:6px;color:#164e63;font-size:13.5px;"><strong>Clinical Integration Brief:</strong> ${aiHook}</p>`
      : '';

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 620px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 12px; overflow: hidden; color: #0f172a;">
        <div style="background: linear-gradient(135deg, #042f2e, #0f766e); color: #ffffff; padding: 24px;">
          <div style="font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: #5eead4; font-weight: 700;">DoctoReports Health AI • Bilingual Patient Intelligence</div>
          <h1 style="margin: 6px 0 0; font-size: 20px; color: #ffffff;">Transform Lab Reports & Prescriptions Into 5-Card Patient Dossiers</h1>
        </div>
        <div style="padding: 24px; background: #ffffff; line-height: 1.65; font-size: 14.5px;">
          <p>Dear Partnerships & Clinical Operations Team at <strong>${lead.company}</strong>,</p>
          <p>Patients across India struggle to understand complex pathology parameters and handwritten prescriptions — leading to missed follow-ups and diagnostic drop-offs.</p>
          ${customInsight}
          <p><strong>DoctoReports.com</strong> pairs seamlessly with your ${lead.type || 'diagnostic & hospital'} workflow to deliver:</p>
          <ul style="padding-left: 20px; color: #334155;">
            <li><strong>High-Resolution Prescription & Lab OCR:</strong> Converts CBC, LFT, KFT, Lipid & handwritten Rx sheets into structured bilingual (Hindi + English) summaries.</li>
            <li><strong>NABL & CGHS Rate Transparency:</strong> Drives higher diagnostic booking trust with clear biomarker breakdowns.</li>
            <li><strong>White-Label & Referral Integration:</strong> Direct booking attribution back to <strong>${lead.company}</strong> (${lead.city}).</li>
          </ul>
          <div style="text-align: center; margin: 26px 0;">
            <a href="https://www.doctoreports.com" style="background: #0d9488; color: #ffffff; padding: 12px 26px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Explore DoctoReports Partner Desk</a>
          </div>
          <p style="font-size: 12.5px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 14px;">
            Official Desk: support@doctoreports.com | Portal: https://www.doctoreports.com
          </p>
        </div>
      </div>
    `;

    return {
      from: '"DoctoReports Health AI" <partners@closetesters.com>',
      replyTo: 'support@doctoreports.com',
      to: lead.email,
      subject,
      html
    };
  }

  async dispatchNextLead(dispatchFn, addLog = console.log, geminiRotator = null) {
    if (this.leads.length === 0) {
      await this.harvestLeads(12);
    }
    if (this.leads.length === 0) {
      return { success: false, reason: 'No MX-verified DoctoReports leads available yet' };
    }

    if (this.currentIndex >= this.leads.length) this.currentIndex = 0;
    const lead = this.leads[this.currentIndex++];

    let aiHook = null;
    if (geminiRotator) {
      try {
        aiHook = await geminiRotator.generateContent(
          `Write 1 concise factual sentence on how ${lead.company} (${lead.city}, ${lead.type}) improves patient report comprehension using bilingual Hindi-English AI summaries.`,
          { timeoutMs: 14000, maxOutputTokens: 1024 }
        );
      } catch (_) {}
    }

    const payload = this.buildEmailPayload(lead, aiHook);
    const res = await dispatchFn('doctoreports', payload, addLog);

    lead.lastDispatchedAt = new Date().toISOString();
    lead.dispatchedCount = (lead.dispatchedCount || 0) + (res.delivered ? 1 : 0);
    lead.lastStatus = res.delivered ? 'DISPATCHED' : (res.queued ? 'QUEUED_HYBRID' : 'FAILED');
    this.saveLeads();

    if (res.delivered) {
      this.stats.dispatchedCount++;
      this.stats.lastDispatchedTo = lead.email;
      this.stats.lastDispatchedAt = lead.lastDispatchedAt;
    } else if (res.queued) {
      this.stats.queuedCount++;
    } else {
      this.stats.failedCount++;
    }

    return { success: true, lead: lead.email, company: lead.company, ...res };
  }

  getStatus() {
    return {
      ...this.stats,
      totalLoaded: this.leads.length,
      currentIndex: this.currentIndex
    };
  }
}

module.exports = new DoctoReportsOutreach();
