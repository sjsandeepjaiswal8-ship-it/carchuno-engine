/**
 * ==============================================================================
 * GEOCRAFT 360° / AUTONOMOUS ENTERPRISE DYNAMIC SEO & GEO (AEO) ENGINE (SUITE D)
 * ==============================================================================
 * Features:
 *  1. Live Technical Crawler (Cheerio + shared Playwright result if supplied)
 *  2. Live Crawlability & AI Bot Readiness Probe (/robots.txt, /sitemap.xml, /llms.txt)
 *  3. Gemini 3 Rotator AI Synthesis for Schema.org JSON-LD, GEO Tags & llms.txt
 *  4. Executive Client-Facing HTML Dossier Generator
 * ==============================================================================
 */

const cheerio = require('cheerio');
const { URL } = require('url');
const { getSharedRotator, generateContent, generateJson } = require('./gemini_rotator');

let inspectWithPlaywright = null;
try {
  ({ inspectWithPlaywright } = require('./playwright_auditor'));
} catch (_) {}

/**
 * Legacy-compatible Gemini text generator backed by shared Gemini 3 Rotator
 */
async function callGeminiAI(prompt, systemInstruction = '', maxTokens = 2048) {
  return generateContent(prompt, {
    systemInstruction,
    maxOutputTokens: Math.max(1024, maxTokens),
    temperature: 0.3,
    responseMimeType: 'application/json'
  });
}

async function probeAiDiscoveryFiles(origin) {
  const check = async (filePath) => {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch(`${origin}${filePath}`, { signal: controller.signal, redirect: 'follow' });
      const text = res.ok ? await res.text() : '';
      return { ok: res.status === 200 && text.trim().length > 0, statusCode: res.status, size: text.length, preview: text.slice(0, 600) };
    } catch (e) {
      return { ok: false, statusCode: 0, error: e.message, preview: '' };
    } finally {
      clearTimeout(t);
    }
  };

  const [robots, sitemap, llms] = await Promise.all([
    check('/robots.txt'),
    check('/sitemap.xml'),
    check('/llms.txt')
  ]);

  const robotsLower = (robots.preview || '').toLowerCase();
  const blocksAiBots = /user-agent:\s*(gptbot|perplexitybot|claudebot|google-extended|oai-searchbot)[\s\S]{0,80}disallow:\s*\//i.test(robotsLower);
  const sitemapUrlsCount = sitemap.ok ? (sitemap.preview.match(/<loc>/gi) || []).length : 0;

  return {
    robotsTxtPresent: robots.ok,
    robotsStatus: robots.statusCode,
    blocksAiCrawlers: blocksAiBots,
    sitemapPresent: sitemap.ok,
    sitemapStatus: sitemap.statusCode,
    sitemapLocSampleCount: sitemapUrlsCount,
    llmsTxtPresent: llms.ok,
    llmsStatus: llms.statusCode
  };
}

/**
 * 1. Live Deep Crawler & Technical SEO + GEO Auditor
 */
async function crawlAndAudit(targetUrl, options = {}) {
  const startTime = Date.now();
  let normalizedUrl = String(targetUrl || '').trim();
  if (!normalizedUrl) normalizedUrl = 'https://closetesters.com';
  if (!/^https?:\/\//i.test(normalizedUrl)) normalizedUrl = 'https://' + normalizedUrl;

  const parsedUrl = new URL(normalizedUrl);
  const isHttps = parsedUrl.protocol === 'https:';

  // Use prefetched playwright result if available to avoid double launching browser
  const pw = options.prefetchedPlaywright || null;
  let html = pw?.desktop?.html || '';
  let statusCode = pw?.statusCode || 0;
  let finalUrl = pw?.finalUrl || normalizedUrl;
  let ttfb = pw?.coreWebVitals?.ttfbMs || 0;

  if (!html) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 14000);
    try {
      const response = await fetch(normalizedUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 CloseTestersGeoBot/3.0 (+https://closetesters.com)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        redirect: 'follow',
        signal: controller.signal
      });
      ttfb = Date.now() - startTime;
      statusCode = response.status;
      finalUrl = response.url;
      html = await response.text();
    } finally {
      clearTimeout(timeout);
    }
  }

  const totalPageSizeKb = (Buffer.byteLength(html || '', 'utf8') / 1024).toFixed(1);
  const $ = cheerio.load(html || '');

  const title = $('title').text().trim() || pw?.desktop?.title || '';
  const metaDescription = $('meta[name="description" i]').attr('content')?.trim() || '';
  const metaKeywords = $('meta[name="keywords" i]').attr('content')?.trim() || '';
  const canonicalUrl = $('link[rel="canonical" i]').attr('href')?.trim() || '';
  const robotsMeta = $('meta[name="robots" i]').attr('content')?.trim() || 'index, follow (default)';

  const h1Elements = [];
  $('h1').each((_, el) => {
    const t = $(el).text().trim();
    if (t) h1Elements.push(t);
  });
  if (h1Elements.length === 0 && pw?.desktop?.h1?.length) h1Elements.push(...pw.desktop.h1);

  const h2Count = $('h2').length;
  const h3Count = $('h3').length;

  let totalImages = 0;
  let missingAltImages = 0;
  $('img').each((_, el) => {
    totalImages++;
    if (!$(el).attr('alt')?.trim()) missingAltImages++;
  });

  let internalLinks = 0;
  let externalLinks = 0;
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href')?.trim();
    if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;
    try {
      const linkUrl = new URL(href, normalizedUrl);
      if (linkUrl.hostname === parsedUrl.hostname) internalLinks++;
      else externalLinks++;
    } catch (_) {}
  });

  const ogTitle = $('meta[property="og:title" i]').attr('content')?.trim() || '';
  const ogDescription = $('meta[property="og:description" i]').attr('content')?.trim() || '';
  const ogImage = $('meta[property="og:image" i]').attr('content')?.trim() || '';
  const ogUrl = $('meta[property="og:url" i]').attr('content')?.trim() || '';
  const twitterCard = $('meta[name="twitter:card" i]').attr('content')?.trim() || '';
  const viewport = $('meta[name="viewport" i]').attr('content')?.trim() || '';

  const geoRegion = $('meta[name="geo.region" i]').attr('content')?.trim() || '';
  const geoPlacename = $('meta[name="geo.placename" i]').attr('content')?.trim() || '';
  const geoPosition = $('meta[name="geo.position" i]').attr('content')?.trim() || '';
  const icbm = $('meta[name="ICBM" i]').attr('content')?.trim() || '';

  const schemaScripts = [];
  let detectedSchemaTypes = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const rawJson = $(el).html()?.trim();
      if (rawJson) {
        const parsed = JSON.parse(rawJson);
        schemaScripts.push(parsed);
        const extractTypes = (obj) => {
          if (!obj) return;
          if (obj['@type']) detectedSchemaTypes.push(obj['@type']);
          if (Array.isArray(obj['@graph'])) obj['@graph'].forEach(extractTypes);
          if (Array.isArray(obj)) obj.forEach(extractTypes);
        };
        extractTypes(parsed);
      }
    } catch (_) {}
  });
  detectedSchemaTypes = [...new Set(detectedSchemaTypes)];

  $('script, style, noscript').remove();
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
  const wordCount = bodyText.split(' ').filter((w) => w.length > 2).length;

  // Probe robots.txt, sitemap.xml, llms.txt in parallel
  const aiDiscovery = await probeAiDiscoveryFiles(parsedUrl.origin);

  // Run Playwright if not provided and not explicitly skipped
  let playwrightData = pw;
  if (!playwrightData && inspectWithPlaywright && !options.skipPlaywright) {
    playwrightData = await inspectWithPlaywright(normalizedUrl, { skipScreenshots: true }).catch(() => null);
  }

  let score = 100;
  const criticalIssues = [];
  const warnings = [];
  const passedChecks = [];

  if (!isHttps) { score -= 20; criticalIssues.push({ code: 'NO_HTTPS', msg: 'Site lacks HTTPS encryption.' }); }
  else passedChecks.push({ code: 'HTTPS_ACTIVE', msg: 'Valid HTTPS active.' });

  if (statusCode !== 200) { score -= 25; criticalIssues.push({ code: 'NON_200', msg: `HTTP status returned ${statusCode}.` }); }
  else passedChecks.push({ code: 'STATUS_200', msg: 'HTTP 200 OK.' });

  if (!title) { score -= 15; criticalIssues.push({ code: 'MISSING_TITLE', msg: 'Missing <title> tag.' }); }
  else if (title.length < 20 || title.length > 70) { score -= 5; warnings.push({ code: 'TITLE_LEN', msg: `Title is ${title.length} chars (optimal: 45-60).` }); }
  else passedChecks.push({ code: 'TITLE_OPTIMAL', msg: `Optimal title (${title.length} chars).` });

  if (!metaDescription) { score -= 10; criticalIssues.push({ code: 'MISSING_META_DESC', msg: 'Missing meta description.' }); }
  else if (metaDescription.length < 60 || metaDescription.length > 170) { score -= 4; warnings.push({ code: 'DESC_LEN', msg: `Meta description is ${metaDescription.length} chars (optimal: 120-160).` }); }
  else passedChecks.push({ code: 'DESC_OPTIMAL', msg: `Meta description active (${metaDescription.length} chars).` });

  if (h1Elements.length === 0) { score -= 10; criticalIssues.push({ code: 'MISSING_H1', msg: 'No <h1> heading found.' }); }
  else passedChecks.push({ code: 'H1_FOUND', msg: `Primary H1 present: "${h1Elements[0].slice(0, 70)}"` });

  if (!viewport) { score -= 10; criticalIssues.push({ code: 'MISSING_VIEWPORT', msg: 'Missing responsive mobile viewport meta tag.' }); }
  else passedChecks.push({ code: 'VIEWPORT_OK', msg: 'Mobile viewport configured.' });

  if (detectedSchemaTypes.length === 0) { score -= 12; criticalIssues.push({ code: 'NO_SCHEMA', msg: 'No Schema.org JSON-LD found (critical for AI search).' }); }
  else passedChecks.push({ code: 'SCHEMA_ACTIVE', msg: `Schema types active: ${detectedSchemaTypes.join(', ')}` });

  if (!aiDiscovery.robotsTxtPresent) { score -= 4; warnings.push({ code: 'NO_ROBOTS', msg: 'robots.txt missing at root.' }); }
  else if (aiDiscovery.blocksAiCrawlers) { score -= 8; warnings.push({ code: 'AI_BOT_BLOCKED', msg: 'robots.txt blocks AI crawlers (GPTBot / PerplexityBot).' }); }
  else passedChecks.push({ code: 'ROBOTS_OK', msg: 'robots.txt allows search & AI discovery.' });

  if (!aiDiscovery.sitemapPresent) { score -= 5; warnings.push({ code: 'NO_SITEMAP', msg: '/sitemap.xml not found at origin.' }); }
  else passedChecks.push({ code: 'SITEMAP_OK', msg: '/sitemap.xml detected.' });

  if (!aiDiscovery.llmsTxtPresent) { warnings.push({ code: 'NO_LLMS_TXT', msg: '/llms.txt missing — recommended for Perplexity/ChatGPT entity indexing.' }); }
  else passedChecks.push({ code: 'LLMS_TXT_OK', msg: '/llms.txt active for LLM crawler grounding.' });

  if (!ogTitle || !ogImage) { score -= 4; warnings.push({ code: 'OG_INCOMPLETE', msg: 'Incomplete OpenGraph social tags (og:title / og:image).' }); }
  else passedChecks.push({ code: 'OG_ACTIVE', msg: 'OpenGraph preview tags configured.' });

  if (!canonicalUrl) { score -= 4; warnings.push({ code: 'NO_CANONICAL', msg: 'Missing rel="canonical" link tag.' }); }

  score = Math.max(0, Math.min(100, score));

  // Real GEO / AEO Readiness Score
  let aeoScore = 10;
  if (detectedSchemaTypes.includes('FAQPage')) aeoScore += 25;
  if (detectedSchemaTypes.includes('Organization') || detectedSchemaTypes.includes('LocalBusiness')) aeoScore += 20;
  if (detectedSchemaTypes.includes('SoftwareApplication') || detectedSchemaTypes.includes('Product') || detectedSchemaTypes.includes('Service')) aeoScore += 15;
  if (aiDiscovery.llmsTxtPresent) aeoScore += 15;
  if (aiDiscovery.sitemapPresent && !aiDiscovery.blocksAiCrawlers) aeoScore += 10;
  if (wordCount > 250) aeoScore += 5;
  aeoScore = Math.min(100, aeoScore);

  return {
    url: normalizedUrl,
    finalUrl,
    statusCode,
    isHttps,
    ttfbMs: ttfb,
    pageSizeKb: totalPageSizeKb,
    scores: { technicalSeoScore: score, generativeAeoScore: aeoScore },
    aiDiscovery,
    meta: { title, description: metaDescription, keywords: metaKeywords, canonical: canonicalUrl, robots: robotsMeta, viewport },
    headings: { h1: h1Elements, h2Count, h3Count },
    images: { total: totalImages, missingAlt: missingAltImages },
    links: { internal: internalLinks, external: externalLinks },
    social: { ogTitle, ogDescription, ogImage, ogUrl, twitterCard },
    geo: { region: geoRegion, placename: geoPlacename, position: geoPosition, icbm },
    schema: { types: detectedSchemaTypes, scriptCount: schemaScripts.length, schemas: schemaScripts },
    content: { wordCount, excerpt: bodyText.slice(0, 450) },
    playwright: playwrightData,
    audit: { criticalIssues, warnings, passedChecks }
  };
}

/**
 * 2. Gemini 3 GEO, Schema.org JSON-LD & Ready-to-Deploy llms.txt Synthesizer
 */
async function generateAiOptimization(auditData, targetOptions = {}) {
  const brandName = targetOptions.brandName || auditData.meta.title.split(/[-|—]/)[0]?.trim() || new URL(auditData.url).hostname;
  const targetCity = targetOptions.targetCity || auditData.geo.placename || 'Global';
  const targetRegion = targetOptions.targetRegion || auditData.geo.region || 'IN';
  const businessType = targetOptions.businessType || 'Organization';

  const prompt = `You are GeoCraft 360° AI Search & Technical SEO Architect.
Generate actionable optimizations grounded strictly in this live crawl of ${auditData.url}:
- Current Title (${auditData.meta.title.length} chars): "${auditData.meta.title}"
- Current Meta Description (${auditData.meta.description.length} chars): "${auditData.meta.description}"
- Headings H1: ${JSON.stringify(auditData.headings.h1)}
- Existing Schema Types: ${JSON.stringify(auditData.schema.types)}
- robots.txt=${auditData.aiDiscovery?.robotsTxtPresent}, sitemap.xml=${auditData.aiDiscovery?.sitemapPresent}, llms.txt=${auditData.aiDiscovery?.llmsTxtPresent}, blocksAiBots=${auditData.aiDiscovery?.blocksAiCrawlers}
- Body Excerpt: "${auditData.content.excerpt}"

Return ONLY valid JSON:
{
  "optimizedTitle": "45-60 char high-CTR title tailored to ${brandName}",
  "optimizedDescription": "130-155 char compelling meta description",
  "primaryKeywords": ["keyword 1", "keyword 2", "keyword 3", "keyword 4"],
  "longTailQuestions": ["User query 1", "User query 2", "User query 3"],
  "geoTags": { "region": "${targetRegion}", "placename": "${targetCity}", "position": "22.7196;75.8577", "icbm": "22.7196, 75.8577" },
  "schemaJsonLd": {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "${businessType}", "name": "${brandName}", "url": "${auditData.url}" },
      { "@type": "FAQPage", "mainEntity": [
        { "@type": "Question", "name": "FAQ Question 1?", "acceptedAnswer": { "@type": "Answer", "text": "Concise factual answer." } }
      ] }
    ]
  },
  "generatedLlmsTxt": "# ${brandName}\\n> Summary for AI crawlers\\n\\n## Core Capabilities\\n- Capability 1\\n- Capability 2\\n\\n## Canonical Links\\n- ${auditData.url}",
  "chatGptCitationStrategy": "2-3 sentence strategy grounded in missing Schema/llms.txt/FAQ gaps found above.",
  "recommendedActionPoints": ["Fix 1", "Fix 2", "Fix 3"]
}`;

  try {
    const aiRes = await generateJson(prompt, { temperature: 0.25, maxOutputTokens: 1800 });
    return {
      ...aiRes.data,
      aiPowered: true,
      modelUsed: aiRes.modelUsed
    };
  } catch (err) {
    return {
      aiPowered: false,
      fallbackReason: err.message,
      optimizedTitle: auditData.meta.title || `${brandName} — Official Portal`,
      optimizedDescription: auditData.meta.description || `Explore ${brandName} features, verified services, and live workflows at ${auditData.url}.`,
      primaryKeywords: [brandName, `${brandName} platform`, `${brandName} official`],
      longTailQuestions: [`What does ${brandName} offer?`, `How to verify ${brandName} reliability?`],
      geoTags: { region: targetRegion, placename: targetCity, position: '22.7196;75.8577', icbm: '22.7196, 75.8577' },
      schemaJsonLd: {
        '@context': 'https://schema.org',
        '@graph': [
          { '@type': businessType, name: brandName, url: auditData.url },
          { '@type': 'WebSite', name: brandName, url: auditData.url }
        ]
      },
      generatedLlmsTxt: `# ${brandName}\n> Official platform at ${auditData.url}\n\n## Overview\n${auditData.content.excerpt.slice(0, 220)}`,
      chatGptCitationStrategy: `Deploy /llms.txt and Schema.org FAQPage JSON-LD so Perplexity and ChatGPT crawlers cite ${brandName} accurately.`,
      recommendedActionPoints: (auditData.audit.criticalIssues || []).concat(auditData.audit.warnings || []).slice(0, 4).map((x) => x.msg)
    };
  }
}

function escapeHtml(string) {
  return String(string || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function generateExecutiveHtmlReport(auditData, aiOptimization, clientName = 'Valued Client') {
  const seoScore = auditData.scores.technicalSeoScore;
  const aeoScore = auditData.scores.generativeAeoScore;
  const schemaScriptTag = `<script type="application/ld+json">\n${JSON.stringify(aiOptimization.schemaJsonLd, null, 2)}\n</script>`;

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>GeoCraft 360° SEO & AI Discovery Dossier — ${escapeHtml(auditData.url)}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; background: #090d16; color: #e2e8f0; margin: 0; padding: 24px; line-height: 1.5; }
  .box { max-width: 860px; margin: 0 auto; background: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 24px; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 12px; }
  th, td { border: 1px solid #334155; padding: 7px 10px; text-align: left; }
  th { background: #1e293b; color: #38bdf8; }
  pre { background: #020617; border: 1px solid #1e293b; padding: 12px; border-radius: 8px; overflow-x: auto; font-size: 11px; color: #a5f3fc; }
</style></head><body><div class="box">
<h1 style="margin-top:0;">GeoCraft 360° Technical SEO & AEO Report</h1>
<p>Client: <strong>${escapeHtml(clientName)}</strong> &bull; Target: <strong>${escapeHtml(auditData.url)}</strong></p>
<p><strong>Technical SEO:</strong> ${seoScore}/100 &bull; <strong>Generative AI Discovery (AEO):</strong> ${aeoScore}/100</p>
<table><thead><tr><th>Signal</th><th>Observed Value</th></tr></thead><tbody>
  <tr><td>robots.txt / AI Bots Allowed</td><td>${auditData.aiDiscovery?.robotsTxtPresent ? 'YES' : 'MISSING'} (AI Blocked: ${auditData.aiDiscovery?.blocksAiCrawlers ? 'YES' : 'NO'})</td></tr>
  <tr><td>/sitemap.xml</td><td>${auditData.aiDiscovery?.sitemapPresent ? `YES (${auditData.aiDiscovery.sitemapLocSampleCount}+ URLs sampled)` : 'MISSING'}</td></tr>
  <tr><td>/llms.txt</td><td>${auditData.aiDiscovery?.llmsTxtPresent ? 'PRESENT' : 'MISSING'}</td></tr>
  <tr><td>Schema.org Types</td><td>${escapeHtml(auditData.schema.types.join(', ') || 'None detected')}</td></tr>
</tbody></table>
<h3>Recommended Schema.org JSON-LD</h3>
<pre>${escapeHtml(schemaScriptTag)}</pre>
<h3>Generated /llms.txt Blueprint</h3>
<pre>${escapeHtml(aiOptimization.generatedLlmsTxt || '')}</pre>
</div></body></html>`;
}

module.exports = {
  crawlAndAudit,
  generateAiOptimization,
  hermesGeoSynthesizer: generateAiOptimization,
  generateExecutiveHtmlReport,
  callGeminiAI,
  getSharedRotator
};
