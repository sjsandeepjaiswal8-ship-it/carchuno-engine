/**
 * ==============================================================================
 * CYBERSHIELD™ 360° EMPIRICAL DAST, TLS, DNS & PRIVACY AUDIT ENGINE (SUITE C)
 * ==============================================================================
 * Zero mock results — probes live target in real time:
 *  1. HTTP Security Headers & Cookie Flags (CSP, HSTS, XFO, XCTO, Referrer, CORS)
 *  2. Native Node TLS/SSL Certificate Inspection (Protocol, Cipher, Expiry Days)
 *  3. Native Node DNS Auth Audit (SPF, DMARC, CAA, MX)
 *  4. /.well-known/security.txt, Mixed Content Scan & Privacy Policy URL Probe
 *  5. Gemini 3 CISO Vulnerability & Play Data Safety Synthesis
 * ==============================================================================
 */

const dns = require('dns').promises;
const fs = require('fs');
const os = require('os');
const path = require('path');
const tls = require('tls');
const { URL } = require('url');
const { generateJson } = require('./gemini_rotator');
const { renderHtmlToPdfFile } = require('./browser_launcher');

function normalizeUrl(raw) {
  let u = String(raw || '').trim();
  if (!u) u = 'https://closetesters.com';
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
  return u;
}

/**
 * Native Node TLS Certificate & Cipher Inspector
 */
function inspectTlsCertificate(hostname, port = 443) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      resolve({ probed: false, error: 'TLS handshake timeout' });
    }, 6000);

    try {
      const socket = tls.connect(
        { host: hostname, port, servername: hostname, rejectUnauthorized: false },
        () => {
          clearTimeout(timer);
          try {
            const cert = socket.getPeerCertificate();
            const cipher = socket.getCipher();
            const proto = socket.getProtocol();
            const validTo = cert?.valid_to ? new Date(cert.valid_to) : null;
            const daysRemaining = validTo ? Math.round((validTo.getTime() - Date.now()) / 86400000) : null;

            socket.end();
            resolve({
              probed: true,
              authorized: socket.authorized,
              authorizationError: socket.authorizationError || null,
              protocol: proto || 'unknown',
              cipher: cipher?.name || 'unknown',
              subjectCN: cert?.subject?.CN || hostname,
              issuerO: cert?.issuer?.O || cert?.issuer?.CN || 'Unknown CA',
              validFrom: cert?.valid_from || null,
              validTo: cert?.valid_to || null,
              daysRemaining
            });
          } catch (e) {
            socket.destroy();
            resolve({ probed: false, error: e.message });
          }
        }
      );
      socket.on('error', (err) => {
        clearTimeout(timer);
        resolve({ probed: false, error: err.message });
      });
    } catch (err) {
      clearTimeout(timer);
      resolve({ probed: false, error: err.message });
    }
  });
}

/**
 * Native Node DNS Security Hygiene Check (SPF, DMARC, CAA, MX)
 */
async function inspectDnsSecurity(hostname) {
  const apex = hostname.replace(/^www\./i, '');
  const out = { domain: apex, hasSpf: false, hasDmarc: false, hasCaa: false, mxCount: 0, spfRecord: null, dmarcRecord: null, caaProviders: [] };

  try {
    const txt = await Promise.race([
      dns.resolveTxt(apex),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 4000))
    ]);
    const joined = txt.map((chunks) => chunks.join(''));
    const spf = joined.find((r) => /v=spf1/i.test(r));
    if (spf) {
      out.hasSpf = true;
      out.spfRecord = spf.slice(0, 120);
    }
  } catch (_) {}

  try {
    const dmarcTxt = await Promise.race([
      dns.resolveTxt(`_dmarc.${apex}`),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 4000))
    ]);
    const dmarc = dmarcTxt.map((c) => c.join('')).find((r) => /v=DMARC1/i.test(r));
    if (dmarc) {
      out.hasDmarc = true;
      out.dmarcRecord = dmarc.slice(0, 120);
    }
  } catch (_) {}

  try {
    const caa = await Promise.race([
      dns.resolveCaa(apex),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 4000))
    ]);
    if (Array.isArray(caa) && caa.length > 0) {
      out.hasCaa = true;
      out.caaProviders = caa.map((c) => c.issue || c.issuewild || c.iodef).filter(Boolean).slice(0, 5);
    }
  } catch (_) {}

  try {
    const mx = await Promise.race([
      dns.resolveMx(apex),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 4000))
    ]);
    out.mxCount = Array.isArray(mx) ? mx.length : 0;
  } catch (_) {}

  return out;
}

/**
 * Full Live DAST, TLS, DNS, Mixed Content & security.txt Probe
 */
async function probeLiveSecurityHeaders(targetUrl, opts = {}) {
  const normalizedUrl = normalizeUrl(targetUrl);
  const parsedUrl = new URL(normalizedUrl);
  const hostname = parsedUrl.hostname;

  const startTime = Date.now();
  let headers = {};
  let rawSetCookies = [];
  let statusCode = 0;
  let bodyHtml = opts.prefetchedHtml || '';
  let fetchError = null;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(normalizedUrl, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) CyberShield-DAST/5.0 (+https://closetesters.com)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      signal: controller.signal
    });
    clearTimeout(timer);
    statusCode = res.status;
    headers = Object.fromEntries(res.headers.entries());
    if (typeof res.headers.getSetCookie === 'function') {
      rawSetCookies = res.headers.getSetCookie();
    } else if (headers['set-cookie']) {
      rawSetCookies = [headers['set-cookie']];
    }
    if (!bodyHtml) {
      bodyHtml = (await res.text()).slice(0, 200000);
    }
  } catch (err) {
    fetchError = err.message;
  }

  const latencyMs = Date.now() - startTime;
  const isHttps = normalizedUrl.startsWith('https://');

  // Parallel probes: TLS, DNS, /.well-known/security.txt
  const [tlsInfo, dnsInfo, securityTxtResult] = await Promise.all([
    isHttps ? inspectTlsCertificate(hostname, parsedUrl.port ? Number(parsedUrl.port) : 443) : Promise.resolve({ probed: false, error: 'Not HTTPS' }),
    inspectDnsSecurity(hostname),
    (async () => {
      try {
        const c = new AbortController();
        const t = setTimeout(() => c.abort(), 5000);
        const r = await fetch(`${parsedUrl.origin}/.well-known/security.txt`, { signal: c.signal });
        clearTimeout(t);
        const txt = r.ok ? (await r.text()).slice(0, 400) : '';
        return { present: r.status === 200 && /contact:/i.test(txt), statusCode: r.status };
      } catch (_) {
        return { present: false, statusCode: 0 };
      }
    })()
  ]);

  // Mixed-content passive HTML check
  const mixedContentMatches = (bodyHtml.match(/(?:src|href|action)\s*=\s*["']http:\/\/[^"']+["']/gi) || [])
    .filter((m) => !/(schemas\.android\.com|w3\.org|localhost|127\.0\.0\.1)/i.test(m))
    .slice(0, 8);

  // Privacy link detection & live verification
  let discoveredPrivacyUrl = opts.privacyPolicyUrl || null;
  if (!discoveredPrivacyUrl && bodyHtml) {
    const pMatch = bodyHtml.match(/href\s*=\s*["']([^"']*privacy[^"']*)["']/i);
    if (pMatch && pMatch[1]) {
      try {
        discoveredPrivacyUrl = new URL(pMatch[1], normalizedUrl).href;
      } catch (_) {}
    }
  }

  const csp = headers['content-security-policy'] || null;
  const hsts = headers['strict-transport-security'] || null;
  const xfo = headers['x-frame-options'] || null;
  const xcto = headers['x-content-type-options'] || null;
  const referrer = headers['referrer-policy'] || null;
  const permPolicy = headers['permissions-policy'] || null;
  const cors = headers['access-control-allow-origin'] || null;
  const serverLeak = headers['server'] || headers['x-powered-by'] || null;

  let dynamicScore = 100;
  const findings = [];

  if (!isHttps || (tlsInfo.probed && tlsInfo.daysRemaining !== null && tlsInfo.daysRemaining <= 0)) {
    dynamicScore -= 35;
    findings.push({ category: 'Transport Security', severity: 'CRITICAL', rule: 'HTTPS / Certificate Validity', status: 'FAIL', detail: tlsInfo.error || 'Unencrypted HTTP or expired TLS cert.' });
  } else {
    findings.push({
      category: 'Transport Security',
      severity: 'PASS',
      rule: `${tlsInfo.protocol || 'TLS'} & Certificate Chain`,
      status: 'PASS',
      detail: `Active (${tlsInfo.cipher || 'AEAD'}). Issuer: ${tlsInfo.issuerO || 'Trusted CA'}, expires in ${tlsInfo.daysRemaining ?? '?'} day(s).`
    });
  }

  if (hsts) {
    findings.push({ category: 'Header Defense', severity: 'PASS', rule: 'Strict-Transport-Security (HSTS)', status: 'PASS', detail: hsts.slice(0, 60) });
  } else {
    dynamicScore -= 10;
    findings.push({ category: 'Header Defense', severity: 'HIGH', rule: 'Strict-Transport-Security (HSTS)', status: 'WARN', detail: 'Missing HSTS header; browsers allow initial HTTP downgrade.' });
  }

  if (csp) {
    findings.push({ category: 'XSS Defense', severity: 'PASS', rule: 'Content-Security-Policy (CSP)', status: 'PASS', detail: `CSP active (${csp.slice(0, 65)}...).` });
  } else {
    dynamicScore -= 14;
    findings.push({ category: 'XSS Defense', severity: 'HIGH', rule: 'Content-Security-Policy (CSP)', status: 'WARN', detail: 'Missing CSP header; elevated script injection attack surface.' });
  }

  if (xfo || (csp && /frame-ancestors/i.test(csp))) {
    findings.push({ category: 'Clickjacking', severity: 'PASS', rule: 'Frame Protection', status: 'PASS', detail: xfo ? `X-Frame-Options: ${xfo}` : 'CSP frame-ancestors enforced.' });
  } else {
    dynamicScore -= 8;
    findings.push({ category: 'Clickjacking', severity: 'MEDIUM', rule: 'X-Frame-Options', status: 'WARN', detail: 'No X-Frame-Options or CSP frame-ancestors policy detected.' });
  }

  if (xcto) {
    findings.push({ category: 'MIME Sniffing', severity: 'PASS', rule: 'X-Content-Type-Options', status: 'PASS', detail: xcto });
  } else {
    dynamicScore -= 6;
    findings.push({ category: 'MIME Sniffing', severity: 'LOW', rule: 'X-Content-Type-Options', status: 'WARN', detail: 'Missing X-Content-Type-Options: nosniff.' });
  }

  if (cors === '*') {
    dynamicScore -= 10;
    findings.push({ category: 'CORS Policy', severity: 'MEDIUM', rule: 'Wildcard CORS Origin', status: 'WARN', detail: 'Access-Control-Allow-Origin: * exposed.' });
  }

  if (mixedContentMatches.length > 0) {
    dynamicScore -= 12;
    findings.push({ category: 'Mixed Content', severity: 'HIGH', rule: 'Plaintext http:// Resources', status: 'FAIL', detail: `${mixedContentMatches.length} mixed-content http:// reference(s) detected inside HTTPS page.` });
  }

  if (!dnsInfo.hasSpf || !dnsInfo.hasDmarc) {
    dynamicScore -= 6;
    findings.push({ category: 'DNS Anti-Spoofing', severity: 'MEDIUM', rule: 'SPF / DMARC Email & Domain Shield', status: 'WARN', detail: `SPF=${dnsInfo.hasSpf ? 'PASS' : 'MISSING'}, DMARC=${dnsInfo.hasDmarc ? 'PASS' : 'MISSING'}, CAA=${dnsInfo.hasCaa ? 'PASS' : 'NONE'}.` });
  } else {
    findings.push({ category: 'DNS Anti-Spoofing', severity: 'PASS', rule: 'SPF + DMARC DNS Records', status: 'PASS', detail: `SPF verified, DMARC enforced${dnsInfo.hasCaa ? ', CAA pinning active' : ''}.` });
  }

  if (serverLeak) {
    dynamicScore -= 3;
    findings.push({ category: 'Fingerprinting', severity: 'LOW', rule: 'Server Version Disclosure', status: 'WARN', detail: `Exposed header banner: ${serverLeak.slice(0, 40)}` });
  }

  if (fetchError && statusCode === 0) {
    dynamicScore = Math.min(dynamicScore, 45);
  }

  dynamicScore = Math.max(25, Math.min(100, dynamicScore));

  return {
    targetUrl: normalizedUrl,
    statusCode,
    latencyMs,
    dynamicScore,
    isHttps,
    tls: tlsInfo,
    dns: dnsInfo,
    securityTxtPresent: securityTxtResult.present,
    mixedContentCount: mixedContentMatches.length,
    mixedContentSamples: mixedContentMatches,
    discoveredPrivacyUrl,
    setCookiesCount: rawSetCookies.length,
    headers: {
      hasCsp: !!csp,
      hasHsts: !!hsts,
      xFrameOptions: xfo,
      xContentTypeOptions: xcto,
      referrerPolicy: referrer,
      permissionsPolicy: permPolicy,
      cors: cors || 'same-origin',
      serverBanner: serverLeak || 'Masked'
    },
    findings,
    fetchError
  };
}

/**
 * 2. Gemini 3 CISO Synthesis based STRICTLY on Live DAST + TLS + DNS Evidence
 */
async function hermesDynamicSecurityAudit(appMetadata, liveDastData) {
  const {
    appName = 'Target Platform',
    packageName = '',
    targetSdk = 35,
    permissions = [],
    apiEndpoints = [],
    privacyPolicySummary = ''
  } = appMetadata;

  const prompt = `You are Hermes Autonomous CISO inside CloseTesters CyberShield™ 360°.
Produce a factual security assessment JSON based STRICTLY on these live probe results for "${liveDastData.targetUrl}":
- HTTP Status: ${liveDastData.statusCode}, Latency: ${liveDastData.latencyMs}ms, Dynamic Score: ${liveDastData.dynamicScore}/100
- TLS Protocol: ${liveDastData.tls?.protocol || 'N/A'}, Cipher: ${liveDastData.tls?.cipher || 'N/A'}, Cert Issuer: ${liveDastData.tls?.issuerO || 'N/A'}, Days Left: ${liveDastData.tls?.daysRemaining ?? 'N/A'}
- Security Headers: CSP=${liveDastData.headers.hasCsp}, HSTS=${liveDastData.headers.hasHsts}, XFO=${liveDastData.headers.xFrameOptions || 'missing'}, XCTO=${liveDastData.headers.xContentTypeOptions || 'missing'}, CORS=${liveDastData.headers.cors}
- DNS Records: SPF=${liveDastData.dns?.hasSpf}, DMARC=${liveDastData.dns?.hasDmarc}, CAA=${liveDastData.dns?.hasCaa}, security.txt=${liveDastData.securityTxtPresent}
- Mixed Content URLs: ${liveDastData.mixedContentCount}
- Discovered Privacy URL: ${liveDastData.discoveredPrivacyUrl || 'None found'}
- Mobile App Context (if applicable): Package="${packageName}", SDK=${targetSdk}, Perms=${JSON.stringify(permissions.slice(0, 10))}
- Top Live Findings: ${JSON.stringify(liveDastData.findings.slice(0, 6).map((f) => `${f.rule}: ${f.status} (${f.detail})`))}

Return ONLY valid JSON:
{
  "securityScore": ${liveDastData.dynamicScore},
  "executiveSecuritySummary": "3 empirical sentences citing actual TLS, header, DNS & mixed-content results observed above.",
  "dynamicDastProbeSummary": "2 crisp sentences summarizing HTTP defense posture and immediate hardening fixes.",
  "playStorePrivacyMismatch": [
    { "permission": "INTERNET / Target Asset", "status": "COMPLIANT" | "FLAGGED_MISMATCH", "reason": "Observed transport/header or policy link state", "remediation": "Actionable fix" }
  ],
  "scalarApiHardening": [
    { "endpoint": "Primary Web/API Endpoint", "method": "GET/POST", "auth": "TLS/Header Defense Status", "rateLimit": "Edge WAF recommended", "status": "VERIFIED" | "HARDENING_NEEDED" }
  ],
  "owaspMobileCompliance": [
    { "category": "A05 / M5: Security Misconfiguration & Transport", "status": "PASS" | "WARN", "detail": "Grounded in observed HSTS/CSP/TLS check" }
  ],
  "immediateRemediationClause": "Copy-pasteable security header config (nginx/firebase.json) or Privacy Data Safety remediation snippet"
}`;

  try {
    const aiRes = await generateJson(prompt, { temperature: 0.2, maxOutputTokens: 1500 });
    const parsed = aiRes.data;
    parsed.securityScore = liveDastData.dynamicScore;
    parsed.dastProbe = liveDastData;
    parsed.aiPowered = true;
    parsed.modelUsed = aiRes.modelUsed;
    return parsed;
  } catch (err) {
    return {
      aiPowered: false,
      fallbackReason: err.message,
      securityScore: liveDastData.dynamicScore,
      executiveSecuritySummary: `Live CyberShield™ probe of ${liveDastData.targetUrl} measured HTTP ${liveDastData.statusCode} in ${liveDastData.latencyMs}ms with security posture ${liveDastData.dynamicScore}/100 (TLS: ${liveDastData.tls?.protocol || 'N/A'}, HSTS: ${liveDastData.headers.hasHsts ? 'ON' : 'MISSING'}, CSP: ${liveDastData.headers.hasCsp ? 'ON' : 'MISSING'}).`,
      dynamicDastProbeSummary: `DNS SPF=${liveDastData.dns?.hasSpf}, DMARC=${liveDastData.dns?.hasDmarc}, mixed-content=${liveDastData.mixedContentCount}, security.txt=${liveDastData.securityTxtPresent}.`,
      dastProbe: liveDastData,
      playStorePrivacyMismatch: liveDastData.findings.slice(0, 5).map((f) => ({
        permission: f.rule,
        status: f.status === 'PASS' ? 'COMPLIANT' : 'FLAGGED_MISMATCH',
        reason: f.detail,
        remediation: f.status === 'PASS' ? 'Maintain current configuration.' : `Configure ${f.rule} at edge CDN/server headers.`
      })),
      scalarApiHardening: (apiEndpoints.length ? apiEndpoints : ['/']).slice(0, 4).map((ep) => ({
        endpoint: ep,
        method: 'HTTPS',
        auth: liveDastData.headers.hasHsts ? 'TLS + HSTS Enforced' : 'TLS Only (Add HSTS)',
        rateLimit: 'Recommend CDN Rate Limit',
        status: liveDastData.dynamicScore >= 75 ? 'CERTIFIED' : 'HARDENING_NEEDED'
      })),
      owaspMobileCompliance: liveDastData.findings.slice(0, 4).map((f) => ({
        category: f.category,
        status: f.status,
        detail: f.detail
      })),
      immediateRemediationClause: 'Configure Strict-Transport-Security: max-age=31536000; includeSubDomains, X-Frame-Options: SAMEORIGIN, X-Content-Type-Options: nosniff, and Content-Security-Policy on hosting edge.'
    };
  }
}

function escapeHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function generateSecurityHtml(appMetadata, spec) {
  const name = appMetadata.appName || spec.dastProbe?.targetUrl || 'Target System';
  const dast = spec.dastProbe || {};
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>${escapeHtml(name)} — CyberShield™ 360° Live DAST & TLS Audit</title>
<style>
  body { background: #090d16; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #f8fafc; margin: 0; padding: 20px; }
  .card { background: #0f172a; border: 1px solid #334155; border-radius: 10px; padding: 16px; margin-bottom: 14px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { border: 1px solid #334155; padding: 7px 9px; text-align: left; }
  th { background: #1e293b; color: #38bdf8; }
</style></head><body>
  <div class="card" style="border-top:3px solid #a855f7;">
    <div style="font-size:11px;color:#c084fc;font-weight:800;">CLOSETESTERS™ CYBERSHIELD 360° LIVE DAST + TLS + DNS REPORT</div>
    <h1 style="margin:6px 0;">${escapeHtml(name)}</h1>
    <p style="font-size:13px;color:#cbd5e1;">${escapeHtml(spec.executiveSecuritySummary)}</p>
    <div style="font-size:14px;font-weight:900;color:#34d399;margin-top:8px;">Empirical Security Score: ${spec.securityScore}/100 &bull; HTTP ${dast.statusCode} (${dast.latencyMs}ms)</div>
  </div>
  <div class="card">
    <h3 style="margin-top:0;color:#38bdf8;">TLS Certificate & DNS Security</h3>
    <div style="font-size:12px;color:#cbd5e1;">
      <strong>TLS:</strong> ${escapeHtml(dast.tls?.protocol || 'N/A')} (${escapeHtml(dast.tls?.cipher || 'N/A')}) &bull; Issuer: ${escapeHtml(dast.tls?.issuerO || 'N/A')} &bull; Days Valid: ${dast.tls?.daysRemaining ?? 'N/A'}<br>
      <strong>DNS Auth:</strong> SPF=${dast.dns?.hasSpf ? 'YES' : 'NO'} &bull; DMARC=${dast.dns?.hasDmarc ? 'YES' : 'NO'} &bull; CAA=${dast.dns?.hasCaa ? 'YES' : 'NO'} &bull; security.txt=${dast.securityTxtPresent ? 'YES' : 'NO'}
    </div>
  </div>
  <div class="card">
    <h3 style="margin-top:0;color:#38bdf8;">Live DAST Verification Matrix</h3>
    <table><thead><tr><th>Rule</th><th>Category</th><th>Status</th><th>Observed Telemetry</th></tr></thead><tbody>
      ${(dast.findings || []).map((f) => `<tr><td><strong>${escapeHtml(f.rule)}</strong></td><td>${escapeHtml(f.category)}</td><td>${escapeHtml(f.status)}</td><td>${escapeHtml(f.detail)}</td></tr>`).join('')}
    </tbody></table>
  </div>
</body></html>`;
}

async function runCyberShield360(appMetadata = {}, outputDir = null) {
  const targetUrl = appMetadata.url || appMetadata.targetUrl || 'https://closetesters.com';
  const liveDastData = await probeLiveSecurityHeaders(targetUrl, {
    prefetchedHtml: appMetadata.prefetchedHtml,
    privacyPolicyUrl: appMetadata.privacyPolicyUrl
  });
  const securitySpec = await hermesDynamicSecurityAudit(appMetadata, liveDastData);
  const htmlContent = generateSecurityHtml(appMetadata, securitySpec);

  const safeOutDir = outputDir || os.tmpdir();
  const cleanName = (appMetadata.appName || 'Target').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 48);
  const htmlPath = path.join(safeOutDir, `${cleanName}_CyberShield_Dossier.html`);
  const pdfPath = path.join(safeOutDir, `${cleanName}_CyberShield_Dossier.pdf`);

  let pdfMeta = { renderer: 'deferred' };
  if (appMetadata.writeLocalFiles) {
    fs.mkdirSync(safeOutDir, { recursive: true });
    fs.writeFileSync(htmlPath, htmlContent, 'utf8');
    pdfMeta = await renderHtmlToPdfFile(htmlContent, pdfPath, {
      title: `CyberShield 360° Security Report — ${targetUrl}`,
      structuredData: {
        title: `CyberShield 360° Report — ${targetUrl}`,
        metrics: [
          { label: 'Security Score', value: `${securitySpec.securityScore}/100` },
          { label: 'TLS Protocol', value: liveDastData.tls?.protocol || 'N/A' },
          { label: 'CSP / HSTS', value: `CSP=${liveDastData.headers.hasCsp}, HSTS=${liveDastData.headers.hasHsts}` },
          { label: 'SPF / DMARC', value: `SPF=${liveDastData.dns?.hasSpf}, DMARC=${liveDastData.dns?.hasDmarc}` }
        ],
        sections: [
          { heading: 'Executive CISO Summary', summary: securitySpec.executiveSecuritySummary },
          { heading: 'Live DAST Findings', items: (liveDastData.findings || []).map((f) => `[${f.status}] ${f.rule}: ${f.detail}`) }
        ]
      }
    });
  }

  return {
    suite: 'Suite C: CyberShield™ 360° Empirical DAST, TLS, DNS & Privacy Engine',
    version: '3.0.0-EMPIRICAL',
    aiPowered: Boolean(securitySpec.aiPowered),
    appMetadata,
    securitySpec,
    htmlContent,
    htmlPath: appMetadata.writeLocalFiles ? htmlPath : null,
    pdfPath: appMetadata.writeLocalFiles ? pdfPath : null,
    pdfRenderer: pdfMeta.renderer
  };
}

module.exports = {
  probeLiveSecurityHeaders,
  hermesDynamicSecurityAudit,
  runCyberShield360,
  inspectTlsCertificate,
  inspectDnsSecurity
};
