const { crawlAndAudit, generateAiOptimization } = require('./dynamic_seo_engine');
const fs = require('fs');

const sites = [
  { url: 'https://carchuno.com', brand: 'CarChuno', city: 'Indore', region: 'IN-MP', type: 'AutoDealer' },
  { url: 'https://www.doctoreports.com', brand: 'DoctoReports', city: 'Indore', region: 'IN-MP', type: 'MedicalBusiness' },
  { url: 'https://astromasterpiece.com', brand: 'AstroMasterpiece', city: 'Indore', region: 'IN-MP', type: 'AstrologyService' },
  { url: 'https://closetesters.com', brand: 'CloseTesters', city: 'Indore', region: 'IN-MP', type: 'ProfessionalService' }
];

async function main() {
  console.log('🚀 Running Dynamic SEO & GEO Engine on all 4 websites...\n');
  const results = [];

  for (const site of sites) {
    console.log(`\n======================================================`);
    console.log(`🔍 Crawling and Auditing: ${site.url} (${site.brand})`);
    console.log(`======================================================`);

    try {
      const audit = await crawlAndAudit(site.url);
      console.log(`✅ Crawled in ${audit.ttfb}ms | HTTP ${audit.statusCode} | Score: ${audit.score}/100`);
      console.log(`Title: ${audit.meta.title || '(MISSING)'}`);
      console.log(`Description: ${audit.meta.description || '(MISSING)'}`);
      console.log(`H1 Tags: ${JSON.stringify(audit.headings.h1)}`);
      console.log(`Schema Types: ${audit.schema.types.length ? audit.schema.types.join(', ') : 'NONE'}`);
      console.log(`Critical Issues (${audit.audit.criticalIssues.length}):`, audit.audit.criticalIssues.map(c => c.msg));
      console.log(`Warnings (${audit.audit.warnings.length}):`, audit.audit.warnings.map(w => w.msg));

      console.log(`\n🤖 Calling Gemini 3.6 / 3.8 Flash for AI & AEO Generative Synthesis...`);
      const aiOpt = await generateAiOptimization(audit, {
        brandName: site.brand,
        targetCity: site.city,
        targetRegion: site.region,
        businessType: site.type
      });

      console.log(`✅ AI Synthesis complete!`);
      console.log(`Optimized Title: ${aiOpt.optimizedTitle}`);
      console.log(`Optimized Desc: ${aiOpt.optimizedDescription}`);
      console.log(`AEO Score: ${aiOpt.aeoReadinessScore}/100`);
      console.log(`Action Points:`, aiOpt.recommendedActionPoints);

      results.push({ site, audit, aiOpt });
    } catch (err) {
      console.error(`❌ Audit failed for ${site.url}:`, err.message);
      results.push({ site, error: err.message });
    }
  }

  fs.writeFileSync('all_4_audits_report.json', JSON.stringify(results, null, 2), 'utf8');
  console.log(`\n🎉 Saved comprehensive audit data to all_4_audits_report.json`);
}

main();
