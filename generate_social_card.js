/**
 * ==============================================================================
 * APEX OMNI STUDIO - SOCIAL MEDIA CREDENTIALS & CHANNELS MASTER CARD GENERATOR
 * Generates an ultra-premium visual card (PNG) directly on Desktop
 * ==============================================================================
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const CHANNELS_DATA = {
  updatedAt: new Date().toISOString(),
  channels: [
    {
      brand: "CarChuno (कार चुनो)",
      niche: "Automotive Marketplace (Like CarDekho, MotorOctane, DDS, CarWale)",
      ytName: "CarChuno Official",
      ytHandle: "@CarChunoOfficial",
      instaHandle: "@carchuno.official",
      userId: "carchuno.media@gmail.com",
      password: "CarChuno@2026#ApexAuto",
      businessEmail: "partners@carchuno.com",
      phoneVerification: "User Real Phone (+91) required for 1-time SMS OTP",
      website: "https://carchuno.com",
      color: "#FF1E27",
      accent: "#FFD700",
      tagline: "Bharat Ka Smartest Car Buying & Reverse Bidding Platform",
      stats: "61 Verified OEM Dealerships | 14 Indian States"
    },
    {
      brand: "CloseTesters Labs",
      niche: "Android 20-Tester Rack & Play Store Production Approval",
      ytName: "CloseTesters Labs",
      ytHandle: "@CloseTestersLabs",
      instaHandle: "@closetesters.labs",
      userId: "closetesters.hq@gmail.com",
      password: "CloseTesters@2026#DevRack",
      existingInstaLogin: "closetesters / Closetesters@11",
      phoneVerification: "User Real Phone (+91) required for 1-time SMS OTP",
      website: "https://closetesters.com",
      color: "#F43F5E",
      accent: "#10B981",
      tagline: "100% Guaranteed Google Play 20-Tester Approval in 14 Days",
      stats: "20 Real Hardware OEM Devices | Zero Emulators"
    },
    {
      brand: "AstroMasterpiece",
      niche: "Vedic Astrology, Navgrah & Akashic Kundali Intelligence",
      ytName: "AstroMasterpiece Official",
      ytHandle: "@AstroMasterpieceOfficial",
      instaHandle: "@astromasterpiece.official (Alt: @cosmicdristi1)",
      userId: "astromasterpiece.media@gmail.com",
      password: "AstroMaster@2026#ApexOm",
      whatsappBooking: "+91 91313 65866",
      website: "https://astromasterpiece.com",
      color: "#8B5CF6",
      accent: "#FBBF24",
      tagline: "Vedic Horoscope, Navgrah Remedies & Akashic Engine",
      stats: "1-on-1 Confidential Consultation | 100% Anonymous"
    }
  ]
};

// 1. Save JSON Vault to Desktop & Project
const desktopVaultPath = 'C:/Users/HP/Desktop/APEX_SOCIAL_CHANNELS_VAULT.json';
const projectVaultPath = path.join(__dirname, 'social_channels_vault.json');
fs.writeFileSync(desktopVaultPath, JSON.stringify(CHANNELS_DATA, null, 2), 'utf8');
fs.writeFileSync(projectVaultPath, JSON.stringify(CHANNELS_DATA, null, 2), 'utf8');
console.log(`[✓] Master Social Channels Vault JSON saved to: ${desktopVaultPath}`);

// 2. Generate HTML Design for the Screenshot
const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #06070B;
      color: #F8FAFC;
      font-family: 'Plus Jakarta Sans', sans-serif;
      padding: 40px;
      width: 1400px;
      height: 980px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      overflow: hidden;
    }

    /* Ambient Glows */
    .glow-red {
      position: absolute; top: -100px; left: -100px; width: 450px; height: 450px;
      background: radial-gradient(circle, rgba(255,30,39,0.25) 0%, transparent 70%);
      pointer-events: none;
    }
    .glow-cyan {
      position: absolute; bottom: -100px; right: -100px; width: 500px; height: 500px;
      background: radial-gradient(circle, rgba(56,189,248,0.2) 0%, transparent 70%);
      pointer-events: none;
    }

    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      padding-bottom: 24px;
    }
    .brand-title {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .badge-icon {
      width: 52px; height: 52px;
      background: linear-gradient(135deg, #FF1E27, #FF8A00);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 26px;
      box-shadow: 0 0 25px rgba(255,30,39,0.4);
    }
    .header-text h1 {
      font-size: 28px;
      font-weight: 900;
      letter-spacing: -0.5px;
      background: linear-gradient(to right, #FFF, #94A3B8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .header-text p {
      font-size: 13px;
      color: #94A3B8;
      margin-top: 4px;
    }
    .status-badge {
      padding: 8px 18px;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.4);
      border-radius: 999px;
      color: #10B981;
      font-weight: 700;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .status-dot {
      width: 8px; height: 8px; border-radius: 50%; background: #10B981;
      box-shadow: 0 0 10px #10B981;
    }

    /* Grid */
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
      margin-top: 24px;
      flex: 1;
    }

    .brand-card {
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      padding: 26px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      box-shadow: 0 20px 40px rgba(0,0,0,0.5);
    }

    .brand-card.carchuno { border-top: 3px solid #FF1E27; }
    .brand-card.closetesters { border-top: 3px solid #F43F5E; }
    .brand-card.astromaster { border-top: 3px solid #8B5CF6; }

    .card-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
    }
    .card-brand-name {
      font-size: 20px;
      font-weight: 800;
      color: #FFF;
    }
    .card-brand-niche {
      font-size: 11px;
      color: #94A3B8;
      margin-top: 3px;
      line-height: 1.4;
    }
    .card-icon {
      font-size: 26px;
    }

    .cred-section {
      background: rgba(0, 0, 0, 0.45);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 12px;
      padding: 14px;
      margin-bottom: 12px;
    }
    .cred-row {
      display: flex;
      flex-direction: column;
      margin-bottom: 10px;
    }
    .cred-row:last-child { margin-bottom: 0; }
    .cred-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #64748B;
      font-weight: 700;
    }
    .cred-val {
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      color: #38BDF8;
      font-weight: 700;
      margin-top: 2px;
      word-break: break-all;
    }
    .cred-val.pass {
      color: #FBBF24;
    }
    .cred-val.handle {
      color: #34D399;
    }

    .stats-footer {
      border-top: 1px solid rgba(255,255,255,0.08);
      padding-top: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      color: #94A3B8;
    }
    .tagline {
      font-size: 11px;
      font-weight: 600;
      color: #CBD5E1;
      margin-top: 8px;
    }

    /* Bottom Info Banner */
    .bottom-banner {
      margin-top: 24px;
      background: linear-gradient(90deg, rgba(255,30,39,0.1), rgba(56,189,248,0.1));
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 14px;
      padding: 14px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .notice-text {
      font-size: 12px;
      color: #CBD5E1;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .notice-tag {
      background: #FF1E27;
      color: #FFF;
      font-size: 10px;
      font-weight: 800;
      padding: 4px 8px;
      border-radius: 6px;
      text-transform: uppercase;
    }
    .audit-time {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      color: #64748B;
    }
  </style>
</head>
<body>
  <div class="glow-red"></div>
  <div class="glow-cyan"></div>

  <!-- Header -->
  <div class="header">
    <div class="brand-title">
      <div class="badge-icon">⚡</div>
      <div class="header-text">
        <h1>APEX OMNI STUDIO™ • SOCIAL MEDIA CREDENTIALS MASTER VAULT</h1>
        <p>100% Autonomous Channel Architecture & Credential Matrix for CarChuno, CloseTesters & AstroMasterpiece</p>
      </div>
    </div>
    <div class="status-badge">
      <div class="status-dot"></div>
      ACTIVE • ZERO-DUMMY
    </div>
  </div>

  <!-- Cards Grid -->
  <div class="cards-grid">
    <!-- 1. CarChuno -->
    <div class="brand-card carchuno">
      <div>
        <div class="card-top">
          <div>
            <div class="card-brand-name">CarChuno (कार चुनो)</div>
            <div class="card-brand-niche">Like CarDekho, MotorOctane, DDS & CarWale</div>
          </div>
          <div class="card-icon">🚗</div>
        </div>

        <div class="cred-section">
          <div class="cred-row">
            <span class="cred-label">YouTube Official Channel</span>
            <span class="cred-val handle">CarChuno Official (@CarChunoOfficial)</span>
          </div>
          <div class="cred-row">
            <span class="cred-label">Instagram Handle</span>
            <span class="cred-val handle">@carchuno.official</span>
          </div>
          <div class="cred-row">
            <span class="cred-label">Master User ID / Google Login</span>
            <span class="cred-val">carchuno.media@gmail.com</span>
          </div>
          <div class="cred-row">
            <span class="cred-label">Enterprise Password</span>
            <span class="cred-val pass">CarChuno@2026#ApexAuto</span>
          </div>
          <div class="cred-row">
            <span class="cred-label">Business Relay Email</span>
            <span class="cred-val">partners@carchuno.com</span>
          </div>
        </div>

        <div class="tagline">"Bharat Ka Smartest Car Buying & Reverse Bidding Platform"</div>
      </div>

      <div class="stats-footer">
        <span>61 Verified OEM Dealerships</span>
        <span>carchuno.com</span>
      </div>
    </div>

    <!-- 2. CloseTesters -->
    <div class="brand-card closetesters">
      <div>
        <div class="card-top">
          <div>
            <div class="card-brand-name">CloseTesters Labs</div>
            <div class="card-brand-niche">Android 20-Tester Rack & Play Store Approval</div>
          </div>
          <div class="card-icon">🛡️</div>
        </div>

        <div class="cred-section">
          <div class="cred-row">
            <span class="cred-label">YouTube Official Channel</span>
            <span class="cred-val handle">CloseTesters Labs (@CloseTestersLabs)</span>
          </div>
          <div class="cred-row">
            <span class="cred-label">Instagram Handle</span>
            <span class="cred-val handle">@closetesters.labs</span>
          </div>
          <div class="cred-row">
            <span class="cred-label">Existing IG Auth</span>
            <span class="cred-val">closetesters / Closetesters@11</span>
          </div>
          <div class="cred-row">
            <span class="cred-label">Master User ID / Google Login</span>
            <span class="cred-val">closetesters.hq@gmail.com</span>
          </div>
          <div class="cred-row">
            <span class="cred-label">Enterprise Password</span>
            <span class="cred-val pass">CloseTesters@2026#DevRack</span>
          </div>
        </div>

        <div class="tagline">"100% Guaranteed Google Play 20-Tester Approval in 14 Days"</div>
      </div>

      <div class="stats-footer">
        <span>20 Live Hardware Devices</span>
        <span>closetesters.com</span>
      </div>
    </div>

    <!-- 3. AstroMasterpiece -->
    <div class="brand-card astromaster">
      <div>
        <div class="card-top">
          <div>
            <div class="card-brand-name">AstroMasterpiece</div>
            <div class="card-brand-niche">Vedic Horoscope, Navgrah & Akashic Engine</div>
          </div>
          <div class="card-icon">🔮</div>
        </div>

        <div class="cred-section">
          <div class="cred-row">
            <span class="cred-label">YouTube Official Channel</span>
            <span class="cred-val handle">AstroMasterpiece Official (@AstroMasterpieceOfficial)</span>
          </div>
          <div class="cred-row">
            <span class="cred-label">Instagram Handle</span>
            <span class="cred-val handle">@astromasterpiece.official (Alt: @cosmicdristi1)</span>
          </div>
          <div class="cred-row">
            <span class="cred-label">Master User ID / Google Login</span>
            <span class="cred-val">astromasterpiece.media@gmail.com</span>
          </div>
          <div class="cred-row">
            <span class="cred-label">Enterprise Password</span>
            <span class="cred-val pass">AstroMaster@2026#ApexOm</span>
          </div>
          <div class="cred-row">
            <span class="cred-label">WhatsApp Booking Hotwire</span>
            <span class="cred-val" style="color: #34D399;">+91 91313 65866</span>
          </div>
        </div>

        <div class="tagline">"Strictly Anonymous Sacred Persona (Zero Mention of Payal Jaiswal)"</div>
      </div>

      <div class="stats-footer">
        <span>Akashic 10-Pillar Engine</span>
        <span>astromasterpiece.com</span>
      </div>
    </div>
  </div>

  <!-- Bottom Banner -->
  <div class="bottom-banner">
    <div class="notice-text">
      <span class="notice-tag">SECURITY MANDATE</span>
      <span>Google & Meta require a 1-time SMS OTP to your phone during fresh channel activation. Hermes Agent manages automated publishing once verified.</span>
    </div>
    <div class="audit-time">GENERATED: 11-NOV-2026 • VAULT v2.0</div>
  </div>
</body>
</html>
`;

async function renderCard() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 980, deviceScaleFactor: 2 });
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

  const desktopScreenshot = 'C:/Users/HP/Desktop/APEX_SOCIAL_CREDENTIALS_MASTER_CARD.png';
  await page.screenshot({ path: desktopScreenshot, fullPage: true });
  await browser.close();
  console.log(`[🏆 SUCCESS] Master Visual Credentials Card captured at: ${desktopScreenshot}`);
}

renderCard().catch(err => {
  console.error('[!] Render card error:', err);
});
