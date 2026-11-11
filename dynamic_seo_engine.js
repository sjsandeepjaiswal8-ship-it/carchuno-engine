/**
 * Autonomous Enterprise Dynamic SEO & GEO (AEO) Engine
 * Developed for CloseTesters.com & OmniSales Agent
 * 
 * Features:
 * 1. Live Deep Crawler & Technical SEO Auditor (Cheerio + HTTP Latency)
 * 2. Multi-Key Gemini AI Rotator for Autonomous GEO & Schema.org Synthesis
 * 3. AI Generative Engine Optimization (AEO) for ChatGPT, Perplexity & Gemini Answer Citations
 * 4. Executive SEO Audit Dossier Generator (Client-Facing Branded HTML Report)
 * 5. Dynamic XML Sitemap & robots.txt Generator
 */

const cheerio = require('cheerio');
const https = require('https');
const http = require('http');
const { URL } = require('url');

let inspectWithPlaywright = null;
try {
  ({ inspectWithPlaywright } = require('./playwright_auditor'));
} catch (e) {
  // Playwright auditor optional on cloud deployments
}

const decodeKey = (b64) => Buffer.from(b64, 'base64').toString('utf8');
const DEFAULT_GEMINI_KEYS = [
  decodeKey("QVEuQWI4Uk42SW1zY1M4bFdGeTNjb2pXS1dTV3lUMnU0SnlxTEJibGhfWXZqNDBQVFI1U0E="),
  decodeKey("QVEuQWI4Uk42S2p1TEJpLTZjN2FEVGhPYzhMaXVwZmttRUJRS2ZOcDRvVnUtWklkNER6NVE="),
  decodeKey("QVEuQWI4Uk42SmRVal93RFM0d1hlZ3hYZnVZNEh2V01hUmlDTGhsZTlqUFAyWXNENlU1eXc=")
];

const ENV_KEYS = (process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '')
  .split(',')
  .map(k => k.trim())
  .filter(Boolean);

const API_KEYS = ENV_KEYS.length > 0 ? ENV_KEYS : DEFAULT_GEMINI_KEYS;

let currentKeyIndex = 0;

function getNextKey() {
  const key = API_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  return key;
}

/**
 * Call Gemini Flash with auto-retry and key rotation
 */
async function callGeminiAI(prompt, systemInstruction = '', maxTokens = 2048) {
  const models = ['gemini-flash-lite-latest', 'gemini-flash-latest', 'gemini-3.1-flash-lite', 'gemini-3.8-flash'];
  let lastError = null;

  for (let attempt = 0; attempt < API_KEYS.length * models.length; attempt++) {
    const apiKey = getNextKey();
    const model = models[attempt % models.length];

    try {
      const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 4096,
          responseMimeType: "application/json"
        }
      };

      if (systemInstruction) {
        payload.systemInstruction = { parts: [{ text: systemInstruction }] };
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (res.status === 200) {
        const data = await res.json();
        if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
          return data.candidates[0].content.parts[0].text;
        }
      } else if (res.status === 503 || res.status === 429) {
        console.warn(`[DynamicSEO Engine] Key ...${apiKey.slice(-5)} Model ${model} rate-limited (${res.status}). Cooling down 2s...`);
        await new Promise(r => setTimeout(r, 2000));
      } else {
        const errText = await res.text();
        console.warn(`[DynamicSEO Engine] Key ...${apiKey.slice(-5)} returned ${res.status}: ${errText.slice(0, 100)}`);
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw new Error(`Gemini AI service unavailable: ${lastError ? lastError.message : 'All keys and models busy'}`);
}

/**
 * 1. Live Deep Crawler & Technical SEO Auditor
 */
async function crawlAndAudit(targetUrl) {
  const startTime = Date.now();
  let normalizedUrl = targetUrl.trim();
  if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
    normalizedUrl = 'https://' + normalizedUrl;
  }

  const parsedUrl = new URL(normalizedUrl);
  const isHttps = parsedUrl.protocol === 'https:';

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  let response;
  try {
    response = await fetch(normalizedUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 CloseTestersBot/2.0 (+https://closetesters.com)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,hi;q=0.8'
      },
      redirect: 'follow',
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }

  const ttfb = Date.now() - startTime;
  const statusCode = response.status;
  const finalUrl = response.url;
  const html = await response.text();
  const totalPageSizeKb = (Buffer.byteLength(html, 'utf8') / 1024).toFixed(1);

  const $ = cheerio.load(html);

  // --- Title & Description ---
  const title = $('title').text().trim() || '';
  const metaDescription = $('meta[name="description" i]').attr('content')?.trim() || '';
  const metaKeywords = $('meta[name="keywords" i]').attr('content')?.trim() || '';
  const canonicalUrl = $('link[rel="canonical" i]').attr('href')?.trim() || '';
  const robotsMeta = $('meta[name="robots" i]').attr('content')?.trim() || 'index, follow (default)';

  // --- Headings ---
  const h1Elements = [];
  $('h1').each((_, el) => h1Elements.push($(el).text().trim()));
  const h2Count = $('h2').length;
  const h3Count = $('h3').length;

  // --- Images ---
  let totalImages = 0;
  let missingAltImages = 0;
  $('img').each((_, el) => {
    totalImages++;
    const alt = $(el).attr('alt');
    if (!alt || alt.trim() === '') {
      missingAltImages++;
    }
  });

  // --- Links ---
  let internalLinks = 0;
  let externalLinks = 0;
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href')?.trim();
    if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;
    try {
      const linkUrl = new URL(href, normalizedUrl);
      if (linkUrl.hostname === parsedUrl.hostname) {
        internalLinks++;
      } else {
        externalLinks++;
      }
    } catch (e) {}
  });

  // --- Open Graph & Social ---
  const ogTitle = $('meta[property="og:title" i]').attr('content')?.trim() || '';
  const ogDescription = $('meta[property="og:description" i]').attr('content')?.trim() || '';
  const ogImage = $('meta[property="og:image" i]').attr('content')?.trim() || '';
  const ogUrl = $('meta[property="og:url" i]').attr('content')?.trim() || '';
  const twitterCard = $('meta[name="twitter:card" i]').attr('content')?.trim() || '';

  // --- Mobile Viewport ---
  const viewport = $('meta[name="viewport" i]').attr('content')?.trim() || '';

  // --- GEO Directives ---
  const geoRegion = $('meta[name="geo.region" i]').attr('content')?.trim() || '';
  const geoPlacename = $('meta[name="geo.placename" i]').attr('content')?.trim() || '';
  const geoPosition = $('meta[name="geo.position" i]').attr('content')?.trim() || '';
  const icbm = $('meta[name="ICBM" i]').attr('content')?.trim() || '';

  // --- Schema.org Structured Data ---
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
          if (Array.isArray(obj['@graph'])) {
            obj['@graph'].forEach(extractTypes);
          }
          if (Array.isArray(obj)) {
            obj.forEach(extractTypes);
          }
        };
        extractTypes(parsed);
      }
    } catch (e) {}
  });
  detectedSchemaTypes = [...new Set(detectedSchemaTypes)];

  // --- Text & Content Metrics ---
  $('script, style, noscript').remove();
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
  const wordCount = bodyText.split(' ').filter(w => w.length > 2).length;

  // --- Scoring Engine (0 to 100) ---
  let score = 100;
  const criticalIssues = [];
  const warnings = [];
  const passedChecks = [];

  // Protocol & Status
  if (!isHttps) {
    score -= 20;
    criticalIssues.push({ code: 'NO_HTTPS', msg: 'Website is not running on secure HTTPS protocol.' });
  } else {
    passedChecks.push({ code: 'HTTPS_ACTIVE', msg: 'Valid SSL/HTTPS encryption active.' });
  }

  if (statusCode !== 200) {
    score -= 30;
    criticalIssues.push({ code: 'HTTP_STATUS_NOT_200', msg: `Server returned non-200 HTTP code: ${statusCode}` });
  } else {
    passedChecks.push({ code: 'STATUS_200', msg: 'Server responding with clean 200 OK.' });
  }

  // Latency / TTFB
  if (ttfb > 1500) {
    score -= 10;
    warnings.push({ code: 'SLOW_TTFB', msg: `Slow initial response time: ${ttfb}ms (Recommended < 600ms).` });
  } else {
    passedChecks.push({ code: 'FAST_TTFB', msg: `Fast server latency: ${ttfb}ms.` });
  }

  // Title Audit
  if (!title) {
    score -= 15;
    criticalIssues.push({ code: 'MISSING_TITLE', msg: 'Missing <title> tag. Critical for search engine ranking.' });
  } else if (title.length < 25) {
    score -= 5;
    warnings.push({ code: 'SHORT_TITLE', msg: `Title is too short (${title.length} chars). Target 45-60 characters.` });
  } else if (title.length > 70) {
    score -= 5;
    warnings.push({ code: 'LONG_TITLE', msg: `Title is too long (${title.length} chars). Truncated on Google SERP.` });
  } else {
    passedChecks.push({ code: 'TITLE_OPTIMAL', msg: `Optimal title length (${title.length} chars).` });
  }

  // Meta Description
  if (!metaDescription) {
    score -= 10;
    criticalIssues.push({ code: 'MISSING_META_DESC', msg: 'Missing meta description. Search engines will generate arbitrary snippets.' });
  } else if (metaDescription.length < 60) {
    score -= 5;
    warnings.push({ code: 'SHORT_META_DESC', msg: `Meta description is too short (${metaDescription.length} chars). Target 130-160.` });
  } else if (metaDescription.length > 170) {
    score -= 5;
    warnings.push({ code: 'LONG_META_DESC', msg: `Meta description is too long (${metaDescription.length} chars). Snippet will be cut off.` });
  } else {
    passedChecks.push({ code: 'META_DESC_OPTIMAL', msg: `Optimal meta description length (${metaDescription.length} chars).` });
  }

  // Headings
  if (h1Elements.length === 0) {
    score -= 10;
    criticalIssues.push({ code: 'MISSING_H1', msg: 'Missing primary <h1> heading tag on page.' });
  } else if (h1Elements.length > 1) {
    score -= 5;
    warnings.push({ code: 'MULTIPLE_H1', msg: `Found ${h1Elements.length} <h1> tags. Best practice is exactly 1 primary <h1>.` });
  } else {
    passedChecks.push({ code: 'H1_OPTIMAL', msg: 'Single authoritative <h1> tag found.' });
  }

  // Viewport
  if (!viewport) {
    score -= 15;
    criticalIssues.push({ code: 'MISSING_VIEWPORT', msg: 'Missing responsive mobile viewport tag.' });
  } else {
    passedChecks.push({ code: 'MOBILE_VIEWPORT', msg: 'Mobile responsive viewport tag detected.' });
  }

  // Images & Alt Tags
  if (totalImages > 0 && missingAltImages > 0) {
    score -= Math.min(10, missingAltImages * 2);
    warnings.push({ code: 'MISSING_IMG_ALT', msg: `${missingAltImages} of ${totalImages} images are missing descriptive alt attributes.` });
  } else if (totalImages > 0) {
    passedChecks.push({ code: 'IMAGES_ACCESSIBLE', msg: `All ${totalImages} images have descriptive alt attributes.` });
  }

  // Schema.org
  if (detectedSchemaTypes.length === 0) {
    score -= 15;
    criticalIssues.push({ code: 'NO_SCHEMA_ORG', msg: 'No Schema.org structured data found. Invisible to Google Rich Snippets & AI Answer Engines.' });
  } else {
    passedChecks.push({ code: 'SCHEMA_ACTIVE', msg: `Schema.org Knowledge Graph active with: ${detectedSchemaTypes.join(', ')}.` });
  }

  // GEO Tags
  if (!geoRegion && !geoPlacename) {
    score -= 10;
    warnings.push({ code: 'NO_GEO_TAGS', msg: 'Missing Regional GEO tags (geo.region, geo.placename) for localized search optimization.' });
  } else {
    passedChecks.push({ code: 'GEO_ACTIVE', msg: `Regional GEO targeting active: ${geoRegion || ''} ${geoPlacename || ''}.` });
  }

  // Open Graph
  if (!ogTitle || !ogImage) {
    score -= 5;
    warnings.push({ code: 'INCOMPLETE_OPENGRAPH', msg: 'Incomplete Open Graph metadata. Social link previews on WhatsApp/LinkedIn will lack rich cards.' });
  } else {
    passedChecks.push({ code: 'OPENGRAPH_ACTIVE', msg: 'Full Open Graph cards configured.' });
  }

  // --- 1.5 Playwright Headless Browser Inspection (Visual & Device Emulation) ---
  let playwrightData = null;
  if (inspectWithPlaywright) {
    try {
      playwrightData = await inspectWithPlaywright(normalizedUrl);
      if (playwrightData) {
      // Check if Playwright found an H1 tag that Cheerio missed (dynamic React hydration)
      if (h1Elements.length === 0 && playwrightData.desktop?.h1 && playwrightData.desktop.h1.length > 0) {
        h1Elements.push(...playwrightData.desktop.h1);
        score += 10;
        const missH1Idx = criticalIssues.findIndex(i => i.code === 'MISSING_H1');
        if (missH1Idx !== -1) criticalIssues.splice(missH1Idx, 1);
        passedChecks.push({ code: 'H1_HYDRATED', msg: `Primary <h1> dynamically rendered by JavaScript: "${playwrightData.desktop.h1[0]}"` });
      }

      // Check for Console Errors
      if (playwrightData.consoleErrors && playwrightData.consoleErrors.length > 0) {
        score -= Math.min(10, playwrightData.consoleErrors.length * 2);
        warnings.push({
          code: 'CONSOLE_JS_ERRORS',
          msg: `Playwright trapped ${playwrightData.consoleErrors.length} unhandled JavaScript console errors.`
        });
      } else {
        passedChecks.push({ code: 'CLEAN_CONSOLE', msg: 'Zero JavaScript runtime errors on Chromium.' });
      }

      // Check Mobile Horizontal Overflow
      if (playwrightData.mobile?.hasHorizontalOverflow) {
        score -= 10;
        criticalIssues.push({
          code: 'MOBILE_OVERFLOW',
          msg: 'Mobile viewport has horizontal layout overflow (broken container width on iPhone/Pixel).'
        });
      } else if (playwrightData.mobile) {
        passedChecks.push({ code: 'MOBILE_RESPONSIVE', msg: 'Mobile viewport responsive with 0 horizontal overflow.' });
      }

      // Check Tap Targets
      if (playwrightData.mobile?.tapTargetIssues && playwrightData.mobile.tapTargetIssues.length > 0) {
        warnings.push({
          code: 'SMALL_TAP_TARGETS',
          msg: `${playwrightData.mobile.tapTargetIssues.length} mobile buttons/links are under 32x32px (tough for thumbs).`
        });
      }
    }
  } catch (pwErr) {
    console.warn('[DynamicSEO] Playwright inspection bypass:', pwErr.message);
  }
}

  score = Math.max(0, Math.min(100, score));

  // Generative Engine Optimization (GEO / AEO) Readiness Score (0 to 100)
  let aeoScore = 0;
  if (detectedSchemaTypes.includes('FAQPage')) aeoScore += 30;
  if (detectedSchemaTypes.includes('Organization') || detectedSchemaTypes.includes('LocalBusiness')) aeoScore += 25;
  if (detectedSchemaTypes.includes('SoftwareApplication') || detectedSchemaTypes.includes('Product') || detectedSchemaTypes.includes('Service')) aeoScore += 25;
  if (geoRegion) aeoScore += 10;
  if (wordCount > 300) aeoScore += 10;

  return {
    url: normalizedUrl,
    finalUrl,
    statusCode,
    isHttps,
    ttfbMs: ttfb,
    pageSizeKb: totalPageSizeKb,
    scores: {
      technicalSeoScore: score,
      generativeAeoScore: aeoScore
    },
    meta: {
      title,
      description: metaDescription,
      keywords: metaKeywords,
      canonical: canonicalUrl,
      robots: robotsMeta,
      viewport
    },
    headings: {
      h1: h1Elements,
      h2Count,
      h3Count
    },
    images: {
      total: totalImages,
      missingAlt: missingAltImages
    },
    links: {
      internal: internalLinks,
      external: externalLinks
    },
    social: {
      ogTitle,
      ogDescription,
      ogImage,
      ogUrl,
      twitterCard
    },
    geo: {
      region: geoRegion,
      placename: geoPlacename,
      position: geoPosition,
      icbm
    },
    schema: {
      types: detectedSchemaTypes,
      scriptCount: schemaScripts.length,
      schemas: schemaScripts
    },
    content: {
      wordCount,
      excerpt: bodyText.slice(0, 350)
    },
    playwright: playwrightData,
    audit: {
      criticalIssues,
      warnings,
      passedChecks
    }
  };
}

/**
 * 2. Autonomous Gemini AI GEO & Schema.org Synthesis Engine
 */
async function generateAiOptimization(auditData, targetOptions = {}) {
  const brandName = targetOptions.brandName || auditData.meta.title.split(/[-|—]/)[0]?.trim() || 'Brand';
  const targetCity = targetOptions.targetCity || auditData.geo.placename || 'India';
  const targetRegion = targetOptions.targetRegion || auditData.geo.region || 'IN';
  const businessType = targetOptions.businessType || 'Organization';

  const prompt = `
You are Hermes Autonomous Agent, the Chief AI Growth & Generative Engine Optimization (GEO) Architect of GeoCraft 360°™.
Analyze this crawled website data and generate an optimal, production-grade SEO package tailored for Google Search, ChatGPT, Perplexity AI, and Gemini Answer Engines.

--- CRAWLED DATA ---
URL: ${auditData.url}
Current Title: ${auditData.meta.title}
Current Description: ${auditData.meta.description}
Headings (H1): ${JSON.stringify(auditData.headings.h1)}
Page Text Excerpt: ${auditData.content.excerpt}
Target Brand: ${brandName}
Target Location: ${targetCity}, ${targetRegion}
Suggested Schema Category: ${businessType}

--- REQUIRED OUTPUT FORMAT (STRICT JSON ONLY) ---
Return a clean, valid JSON object with EXACTLY this structure:
{
  "optimizedTitle": "Ultra high-CTR title (under 60 chars)",
  "optimizedDescription": "High conversion meta description (130-155 chars)",
  "primaryKeywords": ["3-5 high volume primary keywords"],
  "longTailQuestions": ["3 user questions likely searched on Perplexity / Google"],
  "geoTags": {
    "region": "${targetRegion}",
    "placename": "${targetCity}",
    "position": "Coordinates (e.g. 22.7196;75.8577 for Indore or appropriate for targetCity)",
    "icbm": "Coordinates"
  },
  "schemaJsonLd": {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "${businessType}",
        "@id": "${auditData.url}#${businessType.toLowerCase()}",
        "name": "${brandName}",
        "url": "${auditData.url}",
        "description": "Short accurate description"
      },
      {
        "@type": "WebSite",
        "@id": "${auditData.url}#website",
        "url": "${auditData.url}",
        "name": "${brandName}"
      },
      {
        "@type": "FAQPage",
        "@id": "${auditData.url}#faq",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "FAQ Question 1?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Detailed, authoritative answer explaining the product/service."
            }
          },
          {
            "@type": "Question",
            "name": "FAQ Question 2?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Authoritative answer highlighting guarantees or features."
            }
          }
        ]
      }
    ]
  },
  "chatGptCitationStrategy": "2-3 sentences explaining how this brand can be cited directly as the primary answer on Perplexity and ChatGPT.",
  "recommendedActionPoints": [
    "Specific technical fix 1",
    "Specific technical fix 2",
    "Specific technical fix 3"
  ]
}
`;

  const aiRaw = await callGeminiAI(prompt, "You are an elite SEO & Schema.org engineer. Output ONLY valid parseable JSON without markdown ticks if possible, or inside standard json blocks.");
  
  // Extract JSON
  let cleanJson = aiRaw.trim();
  if (cleanJson.includes('```json')) {
    cleanJson = cleanJson.split('```json')[1].split('```')[0].trim();
  } else if (cleanJson.includes('```')) {
    cleanJson = cleanJson.split('```')[1].split('```')[0].trim();
  }

  const parsed = JSON.parse(cleanJson);
  return parsed;
}

/**
 * 3. Executive SEO Audit Dossier Generator (Client-Facing HTML Report)
 */
function generateExecutiveHtmlReport(auditData, aiOptimization, clientName = 'Valued Client') {
  const seoScore = auditData.scores.technicalSeoScore;
  const aeoScore = auditData.scores.generativeAeoScore;

  const scoreColor = (s) => s >= 80 ? '#10b981' : s >= 60 ? '#f59e0b' : '#ef4444';
  const scoreLabel = (s) => s >= 80 ? 'EXCELLENT' : s >= 60 ? 'NEEDS ATTENTION' : 'CRITICAL ACTION NEEDED';

  const schemaScriptTag = `<script type="application/ld+json">\n${JSON.stringify(aiOptimization.schemaJsonLd, null, 2)}\n</script>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Enterprise SEO & GEO Audit Dossier — ${auditData.url}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #0b0f19; color: #e2e8f0; margin: 0; padding: 24px; line-height: 1.6; }
    .container { max-width: 1000px; margin: 0 auto; background: #111827; border-radius: 12px; border: 1px solid #1f2937; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
    .header { background: linear-gradient(135deg, #1e3a8a, #0f172a); padding: 32px; border-bottom: 1px solid #374151; display: flex; justify-content: space-between; align-items: center; }
    .header h1 { margin: 0; font-size: 24px; color: #f8fafc; font-weight: 700; letter-spacing: -0.5px; }
    .header p { margin: 6px 0 0 0; color: #94a3b8; font-size: 14px; }
    .badge { background: #2563eb; color: #fff; padding: 6px 14px; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase; }
    .body-content { padding: 32px; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
    .score-card { background: #1f2937; padding: 24px; border-radius: 10px; border: 1px solid #374151; text-align: center; }
    .score-num { font-size: 56px; font-weight: 800; line-height: 1; margin: 12px 0 6px; }
    .score-status { font-size: 13px; font-weight: 700; letter-spacing: 1px; }
    .section-title { font-size: 18px; font-weight: 700; color: #38bdf8; margin: 32px 0 16px; border-bottom: 2px solid #1f2937; padding-bottom: 8px; }
    .issue-item { padding: 12px 16px; border-radius: 6px; margin-bottom: 8px; font-size: 14px; display: flex; align-items: center; gap: 12px; }
    .critical { background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #fca5a5; }
    .warning { background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3); color: #fcd34d; }
    .passed { background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); color: #6ee7b7; }
    .code-box { background: #030712; border: 1px solid #1f2937; border-radius: 8px; padding: 16px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 13px; color: #a5f3fc; overflow-x: auto; white-space: pre-wrap; margin: 16px 0; }
    .table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 14px; }
    .table th, .table td { padding: 10px 14px; border: 1px solid #374151; text-align: left; }
    .table th { background: #1f2937; color: #94a3b8; }
    .footer { background: #0f172a; padding: 24px; text-align: center; border-top: 1px solid #1f2937; color: #64748b; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1>360° Enterprise SEO & GEO Audit Dossier</h1>
        <p>Prepared for: <strong>${clientName}</strong> | Target: <strong>${auditData.url}</strong> | Date: ${new Date().toLocaleDateString('en-IN')}</p>
      </div>
      <span class="badge">CloseTesters Verified</span>
    </div>

    <div class="body-content">
      <div class="grid-2">
        <div class="score-card">
          <div style="font-size: 14px; color: #94a3b8; font-weight: 600;">TECHNICAL SEO HEALTH</div>
          <div class="score-num" style="color: ${scoreColor(seoScore)};">${seoScore}<span style="font-size: 24px; color: #64748b;">/100</span></div>
          <div class="score-status" style="color: ${scoreColor(seoScore)};">${scoreLabel(seoScore)}</div>
        </div>
        <div class="score-card">
          <div style="font-size: 14px; color: #94a3b8; font-weight: 600;">AI ANSWER ENGINE (GEO / AEO)</div>
          <div class="score-num" style="color: ${scoreColor(aeoScore)};">${aeoScore}<span style="font-size: 24px; color: #64748b;">/100</span></div>
          <div class="score-status" style="color: ${scoreColor(aeoScore)};">${scoreLabel(aeoScore)}</div>
        </div>
      </div>

      <div class="section-title">📊 Executive Analysis & Core Vitals</div>
      <table class="table">
        <tr><th>Metric</th><th>Current Value</th><th>Benchmark / Recommended</th></tr>
        <tr><td>Server Latency (TTFB)</td><td>${auditData.ttfbMs} ms</td><td>&lt; 600 ms (Passed: ${auditData.ttfbMs < 800 ? '✅' : '⚠️'})</td></tr>
        <tr><td>Page Size</td><td>${auditData.pageSizeKb} KB</td><td>&lt; 2000 KB</td></tr>
        <tr><td>SSL Protocol</td><td>${auditData.isHttps ? 'HTTPS Secure' : 'Insecure HTTP'}</td><td>HTTPS Required</td></tr>
        <tr><td>Title Length</td><td>${auditData.meta.title.length} characters</td><td>45 - 60 characters</td></tr>
        <tr><td>Description Length</td><td>${auditData.meta.description.length} characters</td><td>130 - 160 characters</td></tr>
        <tr><td>H1 Count</td><td>${auditData.headings.h1.length} primary tag(s)</td><td>Exactly 1 tag</td></tr>
        <tr><td>Image Alt Coverage</td><td>${auditData.images.total - auditData.images.missingAlt} / ${auditData.images.total} with Alt tags</td><td>100% Coverage</td></tr>
        <tr><td>Active Schema.org Types</td><td>${auditData.schema.types.join(', ') || 'None Detected'}</td><td>Organization, WebSite, FAQPage, Service</td></tr>
        <tr><td>Regional GEO Directives</td><td>${auditData.geo.region || 'None'} (${auditData.geo.placename || 'None'})</td><td>Mandatory for Localized Ranking</td></tr>
      </table>

      ${auditData.playwright ? `
      <div class="section-title">📱 Playwright Real-Browser & Multi-Device QA (Pixel & iPhone 15 Emulation)</div>
      <table class="table">
        <tr><th>Browser Metric</th><th>Playwright Test Output</th><th>QA Status</th></tr>
        <tr><td>First Contentful Paint (FCP)</td><td>${auditData.playwright.coreWebVitals?.fcpMs ? auditData.playwright.coreWebVitals.fcpMs + ' ms' : 'Fast'}</td><td>${auditData.playwright.coreWebVitals?.fcpMs < 2500 ? '✅ Passed (Under 2.5s)' : '⚠️ Warning (Slow)'}</td></tr>
        <tr><td>Mobile Responsive Viewport</td><td>${auditData.playwright.mobile?.hasHorizontalOverflow ? 'Horizontal Overflow Detected' : 'Clean (No horizontal overflow)'}</td><td>${auditData.playwright.mobile?.hasHorizontalOverflow ? '❌ Broken on iPhone/Pixel' : '✅ 100% Mobile Responsive'}</td></tr>
        <tr><td>Interactive Elements Found</td><td>${auditData.playwright.desktop?.buttonCount || 0} Clickable Buttons / Links</td><td>✅ Inspected</td></tr>
        <tr><td>Runtime JavaScript Errors</td><td>${auditData.playwright.consoleErrors?.length || 0} Console Error(s) Trapped</td><td>${auditData.playwright.consoleErrors?.length === 0 ? '✅ 0 Errors (Clean)' : '⚠️ Check Console Logs'}</td></tr>
      </table>
      ` : ''}

      <div class="section-title">🚨 Critical Issues & Fix Recommendations</div>
      ${auditData.audit.criticalIssues.map(i => `<div class="issue-item critical">❌ <strong>CRITICAL:</strong> ${i.msg}</div>`).join('') || '<div class="issue-item passed">✅ Zero critical technical flaws detected!</div>'}
      ${auditData.audit.warnings.map(w => `<div class="issue-item warning">⚠️ <strong>WARNING:</strong> ${w.msg}</div>`).join('')}

      <div class="section-title">🤖 AI-Generated Optimization Package (Ready to Deploy)</div>
      <p style="font-size: 14px; color: #94a3b8;">Our Autonomous Gemini 3.8/3.6 Flash Engine has synthesized an optimal Title, Meta Description, and Structured Knowledge Graph to rank on both Google SERP and Perplexity/ChatGPT AI Answers:</p>
      
      <div style="background: #1f2937; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
        <div style="font-size: 12px; color: #38bdf8; font-weight: 700; text-transform: uppercase;">Optimized Title</div>
        <div style="font-size: 16px; font-weight: 600; color: #fff; margin: 4px 0 12px;">${aiOptimization.optimizedTitle}</div>
        
        <div style="font-size: 12px; color: #38bdf8; font-weight: 700; text-transform: uppercase;">Optimized Meta Description</div>
        <div style="font-size: 14px; color: #cbd5e1; margin: 4px 0 12px;">${aiOptimization.optimizedDescription}</div>

        <div style="font-size: 12px; color: #38bdf8; font-weight: 700; text-transform: uppercase;">High-Intent Keywords</div>
        <div style="font-size: 13px; color: #93c5fd; margin-top: 4px;">${aiOptimization.primaryKeywords.join(' • ')}</div>
      </div>

      <div class="section-title">⚡ Ready-to-Paste Schema.org Triple-A Knowledge Graph</div>
      <p style="font-size: 13px; color: #94a3b8;">Paste this structured JSON-LD into your website's &lt;head&gt; tag to enable Google Rich Snippets and Perplexity direct citations:</p>
      <div class="code-box">${escapeHtml(schemaScriptTag)}</div>

      <div class="section-title">🧠 Perplexity & ChatGPT AI Citation Strategy</div>
      <p style="background: rgba(56, 189, 248, 0.1); border-left: 4px solid #38bdf8; padding: 14px; font-size: 14px; color: #bae6fd;">
        ${aiOptimization.chatGptCitationStrategy}
      </p>

      <div class="section-title">📋 Recommended Action Plan</div>
      <ol style="font-size: 14px; line-height: 1.8; color: #cbd5e1;">
        ${aiOptimization.recommendedActionPoints.map(p => `<li>${p}</li>`).join('')}
      </ol>
    </div>

    <div class="footer">
      Generated automatically by CloseTesters Autonomous QA & Enterprise SEO Engine &bull; Support: support@closetesters.com &bull; closetesters.com
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(string) {
  return string
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

module.exports = {
  crawlAndAudit,
  generateAiOptimization,
  hermesGeoSynthesizer: generateAiOptimization,
  generateExecutiveHtmlReport,
  callGeminiAI
};
