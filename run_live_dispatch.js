const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'dealers_database.json');
const DEALERS = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

const transporter = nodemailer.createTransport({
  host: 'smtpout.secureserver.net',
  port: 465,
  secure: true,
  auth: {
    user: 'partners@carchuno.com',
    pass: 'Closetesters@11'
  }
});

async function runBatchDispatch(count = 5) {
  console.log(`[OmniSales] Starting live direct dispatch for ${count} verified dealerships...`);
  
  let sent = 0;
  for (let i = 0; i < DEALERS.length && sent < count; i++) {
    const dealer = DEALERS[i];
    if (dealer.dispatchedCount && dealer.dispatchedCount > 0) continue;

    console.log(`\n--> Dispatching to ${dealer.name} (${dealer.email}) - ${dealer.city}...`);

    const stateStr = dealer.state ? `, ${dealer.state}` : '';
    const zoneBadge = dealer.zone ? `[${dealer.zone} Zone]` : '';

    const mailOptions = {
      from: '"CarChuno National Dealer Network" <partners@carchuno.com>',
      to: dealer.email,
      replyTo: 'partners@carchuno.com',
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
      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ DISPATCHED SUCCESS: ${dealer.name} | MsgId: ${info.messageId}`);
      dealer.dispatchedCount = (dealer.dispatchedCount || 0) + 1;
      dealer.lastDispatched = new Date().toISOString();
      dealer.status = 'dispatched';
      sent++;
      fs.writeFileSync(dbPath, JSON.stringify(DEALERS, null, 2), 'utf8');

      // 3 seconds pause between dispatches to maintain server health
      await new Promise(r => setTimeout(r, 3000));
    } catch (err) {
      console.error(`❌ FAILED for ${dealer.email}:`, err.message);
    }
  }

  console.log(`\n🎉 Batch completed! Total dispatched: ${sent}`);
}

runBatchDispatch(10);
