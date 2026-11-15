/**
 * ==============================================================================
 * OMNICRAFT 360°™ SIX-SIGMA ARCHITECTURAL, UX, ACCESSIBILITY & MOTION ENGINE
 * Powered by Empirical Playwright + axe-core WCAG + Gemini 3 AI Synthesis
 * ==============================================================================
 */

const { inspectWithPlaywright } = require('./playwright_auditor');
const { generateJson } = require('./gemini_rotator');

const OMNICRAFT_DESIGN_TOKENS = {
  elevations: {
    glassMorphism: 'background: rgba(15, 23, 42, 0.78); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.12);',
    luxuryGlow: 'box-shadow: 0 0 30px -5px rgba(56, 189, 248, 0.25), 0 0 15px -3px rgba(168, 85, 247, 0.2);',
    cardDepth: 'box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);'
  },
  transitions: {
    smoothSpring: 'transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);',
    microBounce: 'transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);',
    fadeSlide: 'animation: omniFadeSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;'
  },
  gsapRecipes: {
    card3DTilt: `document.querySelectorAll('.omni-tilt-card').forEach(c => { c.addEventListener('mousemove', e => { const r = c.getBoundingClientRect(); gsap.to(c, { rotationY: (e.clientX - r.left - r.width/2) * 0.05, rotationX: -(e.clientY - r.top - r.height/2) * 0.05, transformPerspective: 1000, duration: 0.3 }); }); c.addEventListener('mouseleave', () => gsap.to(c, { rotationY: 0, rotationX: 0, duration: 0.5 })); });`,
    counterNumberTick: `gsap.from('.omni-counter', { textContent: 0, duration: 1.6, ease: 'power2.out', snap: { textContent: 1 }, stagger: 0.15 });`
  }
};

/**
 * 1. Extract Authentic Design Tokens from Full HTML + Computed Browser Styles
 */
function extractDesignTokens(htmlContent, computedDesign = {}) {
  const html = String(htmlContent || '');
  const tokens = {
    detectedFonts: [],
    colors: [],
    hasCustomVars: false,
    hasFlexOrGrid: false,
    hasViewportMeta: Boolean(computedDesign.hasViewportMeta),
    hasSmoothTransitions: false,
    computedBodyFont: computedDesign.bodyFont || null,
    computedHeadingFont: computedDesign.headingFont || null,
    h1FontSize: computedDesign.h1FontSize || null,
    bodyBg: computedDesign.bodyBg || null
  };

  if (html) {
    if (!tokens.hasViewportMeta) tokens.hasViewportMeta = /<meta[^>]*viewport[^>]*>/i.test(html);
    const fontMatches = html.match(/fonts\.googleapis\.com\/css2?\?family=([^"&'\s]+)/gi) || [];
    const gf = fontMatches.map((f) =>
      f.replace(/fonts\.googleapis\.com\/css2?\?family=/i, '').replace(/\+/g, ' ').split(':')[0].split('&')[0]
    );
    const computedFonts = [computedDesign.headingFont, computedDesign.bodyFont]
      .filter((f) => f && !f.startsWith('Uninspected'))
      .map((f) => f.split(',')[0].replace(/['"]/g, '').trim());
    tokens.detectedFonts = [...new Set([...gf, ...computedFonts])];

    const hexColors = (html.match(/#[0-9a-fA-F]{6}\b/g) || []).slice(0, 12);
    tokens.colors = [...new Set([...(computedDesign.computedColors || []), ...hexColors])].slice(0, 16);
    tokens.hasCustomVars = /var\(--[a-zA-Z0-9_-]+\)|--[a-zA-Z0-9_-]+\s*:/.test(html) || (computedDesign.cssVarCount || 0) > 0;
    tokens.hasFlexOrGrid = /(display:\s*(flex|grid)|class="[^"]*\b(flex|grid)\b)/.test(html);
    tokens.hasSmoothTransitions = /transition:|transition-/i.test(html) || (computedDesign.transitionCount || 0) > 0;
  } else {
    tokens.colors = computedDesign.computedColors || [];
    tokens.hasSmoothTransitions = (computedDesign.transitionCount || 0) > 0;
    tokens.hasCustomVars = (computedDesign.cssVarCount || 0) > 0;
  }

  return tokens;
}

/**
 * 2. Empirical Taste, Impeccable UX & axe-core Scoring Matrix
 */
function evaluateTasteAndImpeccable(pw, tokens) {
  let tasteScore = 76;
  let impeccableScore = 78;
  const recommendations = [];
  const praise = [];

  // Mobile Overflow
  if (pw.mobile?.hasHorizontalOverflow === true) {
    impeccableScore -= 20;
    recommendations.push({
      pillar: 'Impeccable Mobile UX',
      severity: 'CRITICAL',
      issue: `Horizontal overflow detected at 393px viewport (scrollWidth=${pw.mobile.scrollWidth}px vs innerWidth=${pw.mobile.innerWidth}px).`,
      fix: 'Constrain fixed-width sections with max-width: 100%; overflow-x: clip; and responsive CSS Grid wrap.'
    });
  } else if (pw.mobile?.hasHorizontalOverflow === false) {
    impeccableScore += 10;
    praise.push('Zero mobile horizontal overflow on 393px viewport.');
  }

  // Mobile Tap Targets
  const tapCount = pw.mobile?.tapTargetIssues?.length || 0;
  if (tapCount > 0) {
    impeccableScore -= Math.min(12, tapCount * 3);
    recommendations.push({
      pillar: 'Touch Ergonomics',
      severity: 'MEDIUM',
      issue: `${tapCount} interactive tap target(s) below 32x32px (${pw.mobile.tapTargetIssues.map((t) => `"${t.text}" ${t.w}x${t.h}`).slice(0, 3).join(', ')}).`,
      fix: 'Enforce minimum 44x44px clickable bounding box via padding or min-height.'
    });
  } else if (!pw.degraded) {
    impeccableScore += 5;
    praise.push('All sampled interactive controls meet comfortable mobile tap-target bounds.');
  }

  // H1 Semantics
  if (!pw.desktop?.h1 || pw.desktop.h1.length === 0) {
    impeccableScore -= 14;
    recommendations.push({
      pillar: 'Semantic Structure',
      severity: 'HIGH',
      issue: 'Rendered page lacks an authoritative <h1> headline element.',
      fix: 'Add one clear <h1> above the fold summarizing the value proposition.'
    });
  } else {
    impeccableScore += 8;
    praise.push(`Clear primary <h1> detected: "${pw.desktop.h1[0].slice(0, 90)}"`);
  }

  // Console Errors & Failed Network Requests
  const errCount = pw.consoleErrors?.length || 0;
  if (errCount > 0) {
    impeccableScore -= Math.min(18, errCount * 5);
    recommendations.push({
      pillar: 'Runtime Reliability',
      severity: 'HIGH',
      issue: `${errCount} JavaScript console error(s) trapped: ${pw.consoleErrors[0]?.text?.slice(0, 120)}`,
      fix: 'Resolve runtime uncaught exceptions and missing asset promises in production build.'
    });
  } else if (!pw.degraded) {
    impeccableScore += 8;
    praise.push('Zero runtime JavaScript console errors observed during page hydration.');
  }

  // Broken Images & Alt Text
  const brokenCount = pw.desktop?.brokenImages?.length || 0;
  if (brokenCount > 0) {
    tasteScore -= Math.min(15, brokenCount * 5);
    recommendations.push({
      pillar: 'Visual Asset Integrity',
      severity: 'HIGH',
      issue: `${brokenCount} image(s) failed to decode (naturalWidth=0): ${pw.desktop.brokenImages.slice(0, 2).join(', ')}`,
      fix: 'Verify image CDN URLs, MIME headers, and fallback handling.'
    });
  }

  // axe-core WCAG Violations
  const axeViolations = pw.accessibility?.violations || [];
  if (axeViolations.length > 0) {
    const deduction = Math.min(20, axeViolations.length * 4);
    impeccableScore -= deduction;
    for (const v of axeViolations.slice(0, 4)) {
      recommendations.push({
        pillar: `WCAG (${v.impact || 'moderate'})`,
        severity: v.impact === 'critical' || v.impact === 'serious' ? 'HIGH' : 'MEDIUM',
        issue: `[axe-core: ${v.id}] ${v.help} (${v.nodesCount} element(s))`,
        fix: v.description
      });
    }
  } else if (!pw.degraded && pw.accessibility?.passesCount > 0) {
    impeccableScore += 6;
    praise.push(`Passed ${pw.accessibility.passesCount} Deque axe-core WCAG accessibility checks with 0 violations.`);
  }

  // Core Web Vitals (FCP / LCP / CLS)
  const lcp = pw.coreWebVitals?.lcpMs || pw.coreWebVitals?.fcpMs;
  if (lcp && lcp > 2800) {
    impeccableScore -= 10;
    recommendations.push({
      pillar: 'Core Web Vitals',
      severity: 'MEDIUM',
      issue: `Slow initial paint/LCP measured at ${lcp}ms (target < 2200ms).`,
      fix: 'Preload hero assets, split vendor chunks, and defer non-critical third-party scripts.'
    });
  } else if (lcp) {
    impeccableScore += 6;
    praise.push(`Fast paint speed measured: ${lcp}ms.`);
  }

  // Taste: Fonts, Tokens, Transitions
  if (tokens.detectedFonts.length > 0) {
    tasteScore += 8;
    praise.push(`Typography active: ${tokens.detectedFonts.slice(0, 3).join(', ')}.`);
  } else {
    tasteScore -= 8;
    recommendations.push({
      pillar: 'Typography Pairing',
      severity: 'LOW',
      issue: 'Only generic fallback system fonts detected.',
      fix: 'Load intentional display + UI type pairing (e.g. Plus Jakarta Sans + Inter).'
    });
  }

  if (tokens.hasSmoothTransitions) {
    tasteScore += 8;
    praise.push('Interactive CSS transitions detected across controls.');
  } else {
    tasteScore -= 8;
    recommendations.push({
      pillar: 'Micro-Interactions',
      severity: 'LOW',
      issue: 'Minimal interactive transition rules detected on UI controls.',
      fix: 'Apply spring cubic-bezier(0.16, 1, 0.3, 1) hover/active states.'
    });
  }

  if (tokens.hasCustomVars) {
    tasteScore += 6;
    praise.push('CSS custom property design tokens present.');
  }

  tasteScore = Math.max(40, Math.min(99, tasteScore));
  impeccableScore = Math.max(35, Math.min(99, impeccableScore));
  const compositeOmniScore = Math.round(tasteScore * 0.45 + impeccableScore * 0.55);

  return { compositeOmniScore, tasteScore, impeccableScore, recommendations, praise };
}

/**
 * 3. Gemini 3 UI/UX & Conversion Architecture Synthesis
 */
async function hermesAutonomousSynthesizer(url, pw, auditMetrics, tokens, options = {}) {
  const brandName = options.brandName || pw.desktop?.title?.split(/[-|]/)[0]?.trim() || 'Target Platform';
  const prompt = `You are Hermes Principal Design & UX Architect for CloseTesters OmniCraft 360°.
Base your JSON analysis STRICTLY on these live empirical browser metrics from ${url}:
- Page Title: "${pw.desktop?.title || 'None'}"
- Browser Engine: ${pw.browserMode} (Degraded: ${pw.degraded})
- Primary H1: ${JSON.stringify(pw.desktop?.h1 || [])}
- Buttons/CTAs: ${pw.desktop?.buttonCount || 0}, Forms: ${pw.desktop?.formCount || 0}, Images: ${pw.desktop?.imageCount || 0} (Missing alt: ${pw.desktop?.missingAltImages || 0})
- Fonts Detected: ${JSON.stringify(tokens.detectedFonts)}
- Palette Samples: ${JSON.stringify(tokens.colors.slice(0, 8))}
- Web Vitals: TTFB=${pw.coreWebVitals?.ttfbMs ?? 'n/a'}ms, FCP=${pw.coreWebVitals?.fcpMs ?? 'n/a'}ms, LCP=${pw.coreWebVitals?.lcpMs ?? 'n/a'}ms, CLS=${pw.coreWebVitals?.clsScore ?? 'n/a'}
- Mobile 393px Overflow: ${pw.mobile?.hasHorizontalOverflow}
- axe-core WCAG Violations (${pw.accessibility?.violationsCount || 0}): ${JSON.stringify((pw.accessibility?.violations || []).slice(0, 4).map((v) => v.id + ': ' + v.help))}
- Top Issues Detected: ${JSON.stringify(auditMetrics.recommendations.slice(0, 4).map((r) => r.issue))}
- Visible Text Excerpt: "${(pw.desktop?.textExcerpt || '').slice(0, 400)}"

Return ONLY valid JSON:
{
  "executiveSummary": "2 crisp empirical sentences referencing real numbers and observed UI issues/strengths on ${brandName}.",
  "designLanguagePrescription": {
    "suggestedPalette": ["#hex1", "#hex2", "#hex3", "#hex4"],
    "typographyPairing": { "headlineFont": "Font", "bodyFont": "Font" },
    "glassMorphismStyle": "CSS rule string"
  },
  "recommendedReactBitsComponents": [
    { "name": "ComponentName", "purpose": "Specific fix or uplift for observed DOM gap", "snippet": "<div class=\"...\">...</div>" }
  ],
  "gsapMotionBlueprint": {
    "heroAnimation": "GSAP snippet referencing actual section structure",
    "scrollTriggerEffect": "GSAP ScrollTrigger snippet"
  },
  "hermesSalesPitch": "2-3 sentence business ROI recommendation grounded in the observed metrics."
}`;

  try {
    const aiRes = await generateJson(prompt, { temperature: 0.3, maxOutputTokens: 1600 });
    return {
      ...aiRes.data,
      aiPowered: true,
      modelUsed: aiRes.modelUsed
    };
  } catch (err) {
    return {
      aiPowered: false,
      fallbackReason: err.message,
      executiveSummary: `${brandName} achieved a Taste Score of ${auditMetrics.tasteScore}/100 and Impeccable UX Score of ${auditMetrics.impeccableScore}/100 across live DOM profiling (${pw.desktop?.buttonCount || 0} interactive triggers, TTFB ${pw.coreWebVitals?.ttfbMs ?? 'N/A'}ms).`,
      designLanguagePrescription: {
        suggestedPalette: tokens.colors.length >= 3 ? tokens.colors.slice(0, 4) : ['#0f172a', '#1e293b', '#38bdf8', '#10b981'],
        typographyPairing: { headlineFont: tokens.detectedFonts[0] || 'Plus Jakarta Sans', bodyFont: tokens.detectedFonts[1] || 'Inter' },
        glassMorphismStyle: OMNICRAFT_DESIGN_TOKENS.elevations.glassMorphism
      },
      recommendedReactBitsComponents: [
        {
          name: 'AccessibleActionCard',
          purpose: auditMetrics.recommendations[0]?.issue || 'Elevate contrast and interactive card affordance.',
          snippet: '<div style="border-radius:16px;border:1px solid rgba(56,189,248,0.3);padding:20px;">...</div>'
        }
      ],
      gsapMotionBlueprint: {
        heroAnimation: OMNICRAFT_DESIGN_TOKENS.gsapRecipes.card3DTilt,
        scrollTriggerEffect: OMNICRAFT_DESIGN_TOKENS.gsapRecipes.counterNumberTick
      },
      hermesSalesPitch: `Resolving the ${auditMetrics.recommendations.length} empirical UX/accessibility finding(s) on ${url} improves mobile engagement and first-pass conversion readiness.`
    };
  }
}

async function runOmniCraft360(targetUrl, options = {}) {
  const pw = options.prefetchedPlaywright || await inspectWithPlaywright(targetUrl, options);
  const tokens = extractDesignTokens(pw.desktop?.html || '', pw.desktop?.computedDesign || {});
  const evalMetrics = evaluateTasteAndImpeccable(pw, tokens);
  const hermesSynthesis = await hermesAutonomousSynthesizer(targetUrl, pw, evalMetrics, tokens, options);

  return {
    engine: 'OmniCraft 360° Empirical Design, WCAG & Motion Intelligence',
    version: '4.0.0-EMPIRICAL',
    targetUrl: pw.url,
    executedAt: new Date().toISOString(),
    browserMode: pw.browserMode,
    degraded: pw.degraded,
    degradedReason: pw.degradedReason,
    aiPowered: Boolean(hermesSynthesis.aiPowered),
    scores: {
      overall: evalMetrics.compositeOmniScore,
      tasteScore: evalMetrics.tasteScore,
      impeccableScore: evalMetrics.impeccableScore
    },
    tokens,
    playwrightInspection: {
      desktop: {
        title: pw.desktop?.title,
        h1: pw.desktop?.h1,
        buttonCount: pw.desktop?.buttonCount,
        formCount: pw.desktop?.formCount,
        imageCount: pw.desktop?.imageCount,
        brokenImages: pw.desktop?.brokenImages,
        missingAltImages: pw.desktop?.missingAltImages,
        loadTimeMs: pw.desktop?.loadTimeMs,
        computedDesign: pw.desktop?.computedDesign,
        screenshotBase64: pw.desktop?.screenshotBase64 || null
      },
      mobile: pw.mobile,
      accessibility: pw.accessibility,
      coreWebVitals: pw.coreWebVitals,
      consoleErrors: pw.consoleErrors,
      failedRequests: pw.failedRequests
    },
    impeccableRecommendations: evalMetrics.recommendations,
    impeccablePraise: evalMetrics.praise,
    hermesSynthesis,
    presets: OMNICRAFT_DESIGN_TOKENS
  };
}

module.exports = {
  runOmniCraft360,
  extractDesignTokens,
  evaluateTasteAndImpeccable,
  OMNICRAFT_DESIGN_TOKENS
};
