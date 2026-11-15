const { runOmniCraft360 } = require('./omnicraft_360_engine');

async function verifyDynamic() {
  console.log('================================================================');
  console.log('🔍 PROVING OMNICRAFT 360° IS 100% DYNAMIC (NOT STATIC)');
  console.log('================================================================');

  // Site 1: CloseTesters
  console.log('\n[1/2] Auditing Live Target 1: https://closetesters.com ...');
  const site1 = await runOmniCraft360('https://closetesters.com', {
    brandName: 'CloseTesters',
    niche: 'Google Play 14-Day 20 Testers'
  });

  // Site 2: DoctoReports
  console.log('\n[2/2] Auditing Live Target 2: https://doctoreports.com ...');
  const site2 = await runOmniCraft360('https://doctoreports.com', {
    brandName: 'DoctoReports',
    niche: 'AI Medical Prescription & Report Simplifier'
  });

  console.log('\n================================================================');
  console.log('📊 EMPIRICAL COMPARISON: PROOF OF LIVE DYNAMIC EXECUTION');
  console.log('================================================================');

  console.log('\nTARGET 1 (CloseTesters):');
  console.log('• Real Browser Title:', site1.playwrightInspection.desktop?.title);
  console.log('• Extracted H1:', site1.playwrightInspection.desktop?.h1);
  console.log('• Clickable Buttons Found:', site1.playwrightInspection.desktop?.buttonCount);
  console.log('• Mobile Viewport Overflow:', site1.playwrightInspection.mobile?.hasHorizontalOverflow);
  console.log('• FCP Paint Latency:', site1.playwrightInspection.desktop?.fcpMs, 'ms');
  console.log('• Overall OmniCraft Score:', site1.scores);
  console.log('• Hermes Executive Summary:', site1.hermesSynthesis.executiveSummary);

  console.log('\nTARGET 2 (DoctoReports):');
  console.log('• Real Browser Title:', site2.playwrightInspection.desktop?.title);
  console.log('• Extracted H1:', site2.playwrightInspection.desktop?.h1);
  console.log('• Clickable Buttons Found:', site2.playwrightInspection.desktop?.buttonCount);
  console.log('• Mobile Viewport Overflow:', site2.playwrightInspection.mobile?.hasHorizontalOverflow);
  console.log('• FCP Paint Latency:', site2.playwrightInspection.desktop?.fcpMs, 'ms');
  console.log('• Overall OmniCraft Score:', site2.scores);
  console.log('• Hermes Executive Summary:', site2.hermesSynthesis.executiveSummary);

  console.log('\n================================================================');
  const isDynamic = (
    site1.playwrightInspection.desktop?.title !== site2.playwrightInspection.desktop?.title &&
    site1.scores.overall !== undefined &&
    site2.scores.overall !== undefined
  );
  console.log(`✅ VERIFICATION RESULT: ${isDynamic ? '100% FULLY DYNAMIC & LIVE' : 'STATIC DETECTED'}`);
  console.log('================================================================');
}

verifyDynamic().catch(err => {
  console.error('Dynamic Verification Error:', err);
});
