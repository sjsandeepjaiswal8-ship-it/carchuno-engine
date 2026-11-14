/**
 * ==============================================================================
 * ARCHCRAFT 360°™ REAL-TOPOLOGY ARCHITECTURE & MERMAID RENDER ENGINE (SUITE B)
 * ==============================================================================
 * Synthesizes authentic Mermaid.js diagrams & C4 Architecture from:
 *  - Empirically discovered Playwright routes, forms, and API XHR endpoints
 *  - Gemini 3 Technical Architect JSON synthesis
 *  - Real browser Mermaid v10 SVG rendering via browser_launcher (with PDFKit fallback)
 * ==============================================================================
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { generateJson } = require('./gemini_rotator');
const { inspectWithPlaywright } = require('./playwright_auditor');
const { renderHtmlToPdfFile } = require('./browser_launcher');

function sanitizeMermaidBlock(raw, fallbackGraph) {
  let code = String(raw || '').trim();
  if (!code || code.length < 15) return fallbackGraph;
  code = code.replace(/^```mermaid\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim();
  return code;
}

function buildFallbackDiagrams(appMetadata, discovered = {}) {
  const name = (appMetadata.appName || appMetadata.url || 'Platform').replace(/["`<>]/g, '');
  const routes = discovered.routes || ['/'];
  const apis = discovered.apis || [];
  const routeNodes = routes.slice(0, 5).map((r, i) => `R${i}["Route: ${String(r).replace(/["`<>]/g, '')}"]`);

  const mermaidScreenFlow = [
    'flowchart TD',
    `  Entry["Visitor Entry: ${name}"] --> Nav["Primary Shell / Header Navigation"]`,
    ...(routeNodes.length
      ? routeNodes.map((n, idx) => `  Nav --> ${n}`)
      : ['  Nav --> Main["Core Landing & Conversion Views"]']),
    discovered.formsCount > 0
      ? '  Nav --> FormFlow["Interactive Form / Checkout Submission"]\n  FormFlow --> Valid{"Input & API Validation"}\n  Valid -->|200 OK| Success["Confirmed State & Receipt"]\n  Valid -->|Error| Retry["Inline Error & Recovery"]'
      : '  Nav --> Explore["Content & Tool Exploration"]'
  ].join('\n');

  const firstApi = (apis[0] || 'POST /api/audit/run').replace(/["`<>]/g, '');
  const mermaidSequenceDiagram = [
    'sequenceDiagram',
    '  actor Client as Browser / Android Client',
    '  participant Edge as CDN / Firewall Edge',
    '  participant API as Application Backend',
    '  participant Engine as Data & AI Layer',
    '  Client->>Edge: HTTPS GET Initial Bundle',
    '  Edge-->>Client: Compressed HTML/JS/CSS',
    `  Client->>API: ${firstApi}`,
    '  API->>Engine: Query Persistence / Gemini 3 Inference',
    '  Engine-->>API: Empirical Structured Payload',
    '  API-->>Client: JSON + PDF Vault Artifact'
  ].join('\n');

  return { mermaidScreenFlow, mermaidSequenceDiagram };
}

async function hermesArchitectureSynthesizer(appMetadata = {}) {
  const pw = appMetadata.prefetchedPlaywright || (appMetadata.url ? await inspectWithPlaywright(appMetadata.url, { skipScreenshots: true }).catch(() => null) : null);

  const routes = pw?.discoveredRoutes || appMetadata.routes || [];
  const forms = pw?.discoveredForms || [];
  const apis = pw?.discoveredApiRequests || appMetadata.apiEndpoints || [];
  const name = appMetadata.appName || pw?.desktop?.title?.split(/[-|]/)[0]?.trim() || appMetadata.url || 'Target System';

  const fallbackDiagrams = buildFallbackDiagrams(
    { ...appMetadata, appName: name },
    { routes, formsCount: forms.length, apis }
  );

  const prompt = `You are Hermes Principal Systems Architect for ArchCraft 360°™.
Design a genuine C4 architecture specification based STRICTLY on these live crawled observations for "${name}" (${appMetadata.url || 'custom app'}):
- Discovered URL Paths (${routes.length}): ${JSON.stringify(routes.slice(0, 12))}
- Discovered HTML Forms (${forms.length}): ${JSON.stringify(forms.slice(0, 6))}
- Live Network/API XHR Calls (${apis.length}): ${JSON.stringify(apis.slice(0, 8))}
- Title & Tech Clues: Title="${pw?.desktop?.title || ''}", Fonts=${JSON.stringify(pw?.desktop?.computedDesign?.headingFont || '')}
- Additional Context: ${appMetadata.description || 'Production Web/Mobile Application'}

Return ONLY valid JSON:
{
  "executiveSummary": "3-sentence architecture analysis grounded in discovered routes, form flows, and API boundaries.",
  "mermaidScreenFlow": "Valid Mermaid 'flowchart TD' diagram using only alphanumeric node IDs and double-quoted labels mapping discovered paths & form transitions",
  "mermaidSequenceDiagram": "Valid Mermaid 'sequenceDiagram' showing real client -> edge -> backend API -> datastore interaction",
  "c4SystemTopology": {
    "clientLayer": "Client presentation architecture details",
    "apiGatewayLayer": "Edge CDN, TLS & API routing boundary",
    "serviceLayer": ["Microservice 1", "Microservice 2", "Microservice 3"],
    "dataLayer": ["Database", "Cache", "Artifact Storage"],
    "thirdPartyServices": ["External providers inferred"]
  },
  "stateMachineMatrix": [
    { "state": "Initial Load", "event": "Hydration", "nextState": "Interactive", "fallback": "Graceful Offline/Skeleton" },
    { "state": "Form/Action Submit", "event": "API Dispatch", "nextState": "Persisted", "fallback": "Retry + Explicit Error Banner" }
  ],
  "developerHandoffChecklist": [
    "5 specific technical improvements derived from discovered architecture"
  ]
}`;

  try {
    const aiRes = await generateJson(prompt, { temperature: 0.25, maxOutputTokens: 1800 });
    const spec = aiRes.data;
    spec.mermaidScreenFlow = sanitizeMermaidBlock(spec.mermaidScreenFlow, fallbackDiagrams.mermaidScreenFlow);
    spec.mermaidSequenceDiagram = sanitizeMermaidBlock(spec.mermaidSequenceDiagram, fallbackDiagrams.mermaidSequenceDiagram);
    spec.aiPowered = true;
    spec.modelUsed = aiRes.modelUsed;
    spec.discoveredEvidence = { routesCount: routes.length, formsCount: forms.length, apisCount: apis.length, routes: routes.slice(0, 12), apis: apis.slice(0, 10) };
    return spec;
  } catch (err) {
    return {
      aiPowered: false,
      fallbackReason: err.message,
      executiveSummary: `${name} exposes ${routes.length} internal route(s), ${forms.length} interactive form workflow(s), and ${apis.length} runtime API call(s). Architecture follows decoupled client-to-API separation.`,
      mermaidScreenFlow: fallbackDiagrams.mermaidScreenFlow,
      mermaidSequenceDiagram: fallbackDiagrams.mermaidSequenceDiagram,
      c4SystemTopology: {
        clientLayer: `Browser / Mobile Viewport (${pw?.desktop?.buttonCount || 0} interactive triggers)`,
        apiGatewayLayer: 'HTTPS Reverse Proxy + CORS Governance',
        serviceLayer: apis.length ? apis.slice(0, 4) : ['Core REST API Controller', 'Session & Auth Middleware'],
        dataLayer: ['Primary Persistent Database', 'Client Cache / LocalStorage'],
        thirdPartyServices: ['CDN / Hosting Edge', 'Payment / Email Relay']
      },
      stateMachineMatrix: [
        { state: 'Boot', event: 'DOM Content Loaded', nextState: 'Active Shell', fallback: 'Static Shell Error Boundary' },
        { state: 'Submission', event: 'Form/API Request', nextState: 'Verified Receipt', fallback: 'Surface Non-200 HTTP Error' }
      ],
      developerHandoffChecklist: [
        'Validate all API endpoints enforce strict schema validation and idempotency.',
        'Add graceful empty & error states for failed XHR calls instead of silent timeouts.',
        'Enforce Content-Security-Policy and strict transport encryption across API origins.'
      ],
      discoveredEvidence: { routesCount: routes.length, formsCount: forms.length, apisCount: apis.length, routes: routes.slice(0, 12), apis: apis.slice(0, 10) }
    };
  }
}

function escapeHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function generateBlueprintHtml(appMetadata, spec) {
  const name = appMetadata.appName || appMetadata.url || 'Enterprise Platform';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(name)} — ArchCraft 360°™ System Architecture & Mermaid Flow Dossier</title>
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #090d16; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #f8fafc; line-height: 1.5; padding: 14px; }
    .card { background: #0f172a; border: 1px solid #334155; border-radius: 10px; padding: 14px 16px; margin-bottom: 14px; page-break-inside: avoid; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 99px; background: rgba(56,189,248,0.16); color: #38bdf8; font-size: 11px; font-weight: 800; }
    h1 { font-size: 20px; margin: 6px 0; color: #fff; }
    h2 { font-size: 13px; color: #38bdf8; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.4px; }
    .mermaid { background: #020617; border: 1px solid #1e293b; border-radius: 8px; padding: 12px; overflow-x: auto; text-align: center; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 6px; }
    th, td { border: 1px solid #334155; padding: 6px 8px; text-align: left; }
    th { background: #1e293b; color: #38bdf8; }
    ul { padding-left: 18px; font-size: 12px; color: #cbd5e1; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">CLOSETESTERS™ ARCHCRAFT 360° EMPIRICAL ARCHITECTURE BLUEPRINT</span>
    <h1>${escapeHtml(name)}</h1>
    <p style="font-size:12px;color:#cbd5e1;">${escapeHtml(spec.executiveSummary)}</p>
    <p style="font-size:11px;color:#94a3b8;margin-top:6px;">
      Discovered Evidence: <strong>${spec.discoveredEvidence?.routesCount || 0}</strong> routes &bull;
      <strong>${spec.discoveredEvidence?.formsCount || 0}</strong> forms &bull;
      <strong>${spec.discoveredEvidence?.apisCount || 0}</strong> XHR/API endpoints
    </p>
  </div>

  <div class="card">
    <h2>1. Rendered User Navigation & Screen Flow Diagram</h2>
    <div class="mermaid">${escapeHtml(spec.mermaidScreenFlow)}</div>
  </div>

  <div class="card">
    <h2>2. Client-to-API Execution Sequence Diagram</h2>
    <div class="mermaid">${escapeHtml(spec.mermaidSequenceDiagram)}</div>
  </div>

  <div class="card">
    <h2>3. C4 Container Topology & State Machine</h2>
    <p style="font-size:12px;color:#cbd5e1;margin-bottom:8px;">
      <strong>Client Layer:</strong> ${escapeHtml(spec.c4SystemTopology?.clientLayer)}<br>
      <strong>API Gateway:</strong> ${escapeHtml(spec.c4SystemTopology?.apiGatewayLayer)}<br>
      <strong>Services:</strong> ${escapeHtml((spec.c4SystemTopology?.serviceLayer || []).join(' • '))}<br>
      <strong>Data Stores:</strong> ${escapeHtml((spec.c4SystemTopology?.dataLayer || []).join(' • '))}
    </p>
    <table>
      <thead><tr><th>State</th><th>Trigger</th><th>Next State</th><th>Resilience Fallback</th></tr></thead>
      <tbody>
        ${(spec.stateMachineMatrix || []).map((r) => `<tr><td><strong>${escapeHtml(r.state)}</strong></td><td>${escapeHtml(r.event)}</td><td>${escapeHtml(r.nextState)}</td><td>${escapeHtml(r.fallback)}</td></tr>`).join('')}
      </tbody>
    </table>
  </div>

  <div class="card">
    <h2>4. Engineering Handoff Mandates</h2>
    <ul>${(spec.developerHandoffChecklist || []).map((c) => `<li>${escapeHtml(c)}</li>`).join('')}</ul>
  </div>

  <script>
    (async () => {
      window.__MERMAID_DONE__ = false;
      try {
        if (window.mermaid) {
          mermaid.initialize({ startOnLoad: false, theme: 'dark', securityLevel: 'loose' });
          await mermaid.run({ querySelector: '.mermaid' });
        }
      } catch (e) { console.warn('Mermaid fallback:', e); }
      window.__MERMAID_DONE__ = true;
    })();
    setTimeout(() => { window.__MERMAID_DONE__ = true; }, 3200);
  </script>
</body>
</html>`;
}

async function runArchCraft360(appMetadata = {}, outputDir = null) {
  const safeOutDir = outputDir || os.tmpdir();
  const architectureSpec = await hermesArchitectureSynthesizer(appMetadata);
  const htmlContent = generateBlueprintHtml(appMetadata, architectureSpec);

  const cleanName = (appMetadata.appName || appMetadata.url || 'Platform').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 48);
  const htmlPath = path.join(safeOutDir, `${cleanName}_ArchCraft_360_Blueprint.html`);
  const pdfPath = path.join(safeOutDir, `${cleanName}_ArchCraft_360_Blueprint.pdf`);

  let pdfMeta = { bytes: 0, renderer: 'deferred' };
  if (appMetadata.writeLocalFiles) {
    fs.mkdirSync(safeOutDir, { recursive: true });
    fs.writeFileSync(htmlPath, htmlContent, 'utf8');
    pdfMeta = await renderHtmlToPdfFile(htmlContent, pdfPath, {
      title: `ArchCraft 360° Architecture Dossier — ${appMetadata.appName || appMetadata.url}`,
      structuredData: {
        title: `ArchCraft 360° Architecture — ${appMetadata.appName || appMetadata.url}`,
        metrics: [
          { label: 'Discovered Routes', value: architectureSpec.discoveredEvidence?.routesCount ?? 0 },
          { label: 'Discovered Forms', value: architectureSpec.discoveredEvidence?.formsCount ?? 0 },
          { label: 'Live XHR/APIs', value: architectureSpec.discoveredEvidence?.apisCount ?? 0 }
        ],
        sections: [
          { heading: 'Architecture Briefing', summary: architectureSpec.executiveSummary },
          { heading: 'Mermaid Screen Flow Spec', summary: architectureSpec.mermaidScreenFlow },
          { heading: 'Developer Handoff Mandates', items: architectureSpec.developerHandoffChecklist || [] }
        ]
      }
    });
  }

  return {
    engine: 'ArchCraft 360°™ Empirical Topology & Mermaid Engine',
    version: '2.0.0-EMPIRICAL',
    aiPowered: Boolean(architectureSpec.aiPowered),
    appMetadata: { appName: appMetadata.appName, url: appMetadata.url },
    architectureSpec,
    htmlContent,
    htmlPath: appMetadata.writeLocalFiles ? htmlPath : null,
    pdfPath: appMetadata.writeLocalFiles ? pdfPath : null,
    pdfRenderer: pdfMeta.renderer
  };
}

module.exports = {
  runArchCraft360,
  hermesArchitectureSynthesizer,
  generateBlueprintHtml
};
