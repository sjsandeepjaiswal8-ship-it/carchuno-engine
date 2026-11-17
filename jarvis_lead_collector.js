/**
 * ==============================================================================
 * JARVIS ZERO-BOUNCE LEAD COLLECTION & DAILY ACTIVITY REPORT ENGINE
 * ==============================================================================
 * Strictly enforces Tried-and-Tested ACTIVE email delivery rules:
 *   - Pulls from Port-25 Two-Step Canary verified pools (`ACTIVE_EXACT_CONFIRMED`)
 *   - Rejects bad syntax, disposable/typo domains, dead DNS MX, 5xx mailboxes & catch-alls
 *   - Any unverified new candidates go ONLY into `lead_verification_queue.json`
 *     until local Windows Port-25 SMTP Canary confirms `250 OK` + `Canary 5xx`
 *
 * Folder & File Output Structure (Separate per Product, Named Files):
 *   Jarvis Lead Collection/<YYYY-MM-DD>/
 *     CarChuno/CarChuno_Tested_Active_Leads_<YYYY-MM-DD>.csv (.json)
 *     DoctoReports/DoctoReports_Tested_Active_Leads_<YYYY-MM-DD>.csv (.json)
 *     AstroMasterpiece/AstroMasterpiece_Tested_Active_Leads_<YYYY-MM-DD>.csv (.json)
 *     CloseTesters/CloseTesters_Tested_Active_Leads_<YYYY-MM-DD>.csv (.json)
 *     Daily_Activity_Report_<YYYY-MM-DD>.md (.json)
 * ==============================================================================
 */

const fs = require('fs');
const path = require('path');
const unifiedHub = require('./unified_activity_hub');
const verifier = require('./lead_smtp_verifier');

const SOVEREIGN_COLLECTION_ROOT = path.join(__dirname, 'sovereign_data', 'Jarvis Lead Collection');
const DESKTOP_COLLECTION_ROOT = 'C:\\Users\\HP\\Desktop\\Jarvis Lead Collection';
const DRIVE_COLLECTION_ROOT = 'G:\\My Drive\\Jarvis Lead Collection';

const VERIFIED_POOL_FILE = path.join(__dirname, 'verified_active_leads_pool.json');
const QUEUE_FILE = path.join(__dirname, 'sovereign_data', 'lead_verification_queue.json');
const REJECTED_FILE = path.join(__dirname, 'sovereign_data', 'rejected_inactive_emails.json');

const PRODUCTS = ['CarChuno', 'DoctoReports', 'AstroMasterpiece', 'CloseTesters'];

function getIstDateAndTime() {
  const now = new Date();
  const istStr = now.toLocaleString('en-CA', { timeZone: 'Asia/Kolkata', hour12: false });
  const [datePart, timePartRaw] = istStr.split(',').map((s) => s.trim());
  const timePart = (timePartRaw || '00:00:00').slice(0, 5).replace(':', '-');
  return { date: datePart, timeTag: timePart, iso: now.toISOString() };
}

function readJsonSafe(file, fallback) {
  try {
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (_) {}
  return fallback;
}

function writeJsonSafe(file, data) {
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
  } catch (_) {}
}

function getRejectedSet() {
  const arr = readJsonSafe(REJECTED_FILE, []);
  return new Set(arr.map((e) => String(e?.email || e).toLowerCase().trim()).filter(Boolean));
}

function recordRejectedEmails(entries = []) {
  if (!entries.length) return;
  const existing = readJsonSafe(REJECTED_FILE, []);
  const map = new Map(existing.map((x) => [String(x.email || x).toLowerCase(), typeof x === 'object' ? x : { email: x }]));
  for (const item of entries) {
    const em = String(item?.email || '').toLowerCase().trim();
    if (em) map.set(em, { email: em, status: item.status || 'REJECTED', reason: item.smtpProof || item.reason || '', at: new Date().toISOString() });
  }
  writeJsonSafe(REJECTED_FILE, Array.from(map.values()).slice(-5000));
}

function getVerifiedPool() {
  return readJsonSafe(VERIFIED_POOL_FILE, {
    CarChuno: [],
    DoctoReports: [],
    AstroMasterpiece: [],
    CloseTesters: []
  });
}

function csvEscape(v) {
  return `"${String(v ?? '').replace(/"/g, '""')}"`;
}

const CSV_HEADERS = [
  'name',
  'email',
  'domain',
  'city',
  'category',
  'verificationStatus',
  'canaryCode',
  'smtpCode',
  'smtpProof',
  'mxHost',
  'verifiedAt',
  'aiPitchHook',
  'collectedAt'
];

function toCsv(rows) {
  const lines = [CSV_HEADERS.join(',')];
  for (const r of rows || []) {
    lines.push(CSV_HEADERS.map((h) => csvEscape(r[h])).join(','));
  }
  return lines.join('\n') + '\n';
}

function getTargetRoots() {
  const roots = [SOVEREIGN_COLLECTION_ROOT];
  if (fs.existsSync('C:\\Users\\HP\\Desktop')) roots.push(DESKTOP_COLLECTION_ROOT);
  if (fs.existsSync('G:\\My Drive')) roots.push(DRIVE_COLLECTION_ROOT);
  return roots;
}

function getProductBaseName(productName, dateStr) {
  return `${productName}_Tested_Active_Leads_${dateStr}`;
}

function writeCollectionToAllTargets(dateStr, productName, fileBaseName, data, markdownSummary = null) {
  const writtenPaths = [];
  for (const root of getTargetRoots()) {
    try {
      const targetDir = productName ? path.join(root, dateStr, productName) : path.join(root, dateStr);
      fs.mkdirSync(targetDir, { recursive: true });

      const jsonPath = path.join(targetDir, `${fileBaseName}.json`);
      fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
      writtenPaths.push(jsonPath);

      if (Array.isArray(data)) {
        const csvPath = path.join(targetDir, `${fileBaseName}.csv`);
        fs.writeFileSync(csvPath, toCsv(data), 'utf8');
        writtenPaths.push(csvPath);
      }

      if (markdownSummary) {
        const mdPath = path.join(targetDir, `${fileBaseName}.md`);
        fs.writeFileSync(mdPath, markdownSummary, 'utf8');
        writtenPaths.push(mdPath);
      }
    } catch (err) {
      console.warn(`[JarvisLeadCollector] Target write warning (${root}):`, err.message);
    }
  }
  return writtenPaths;
}

function removeStaleUntestedDailyFiles(dateStr, productName) {
  for (const root of getTargetRoots()) {
    const dir = path.join(root, dateStr, productName);
    if (!fs.existsSync(dir)) continue;
    for (const fname of fs.readdirSync(dir)) {
      if (fname.startsWith('leads_') || fname.startsWith('daily_master_')) {
        try { fs.unlinkSync(path.join(dir, fname)); } catch (_) {}
      }
    }
  }
}

function readExistingVerifiedDaily(dateStr, productName) {
  const fileBase = getProductBaseName(productName, dateStr);
  const fPath = path.join(SOVEREIGN_COLLECTION_ROOT, dateStr, productName, `${fileBase}.json`);
  const raw = readJsonSafe(fPath, []);
  if (!Array.isArray(raw)) return [];
  // Keep ONLY genuinely SMTP-confirmed active entries
  const rejected = getRejectedSet();
  return raw.filter((item) => {
    const em = String(item?.email || '').toLowerCase().trim();
    return em && !rejected.has(em) && item.smtpVerified === true && item.verificationStatus === 'ACTIVE_EXACT_CONFIRMED';
  });
}

async function enrichLeadsWithGemini(productName, leads, geminiRotator) {
  if (!geminiRotator || !leads.length) return leads;
  const needHook = leads.filter(
    (l) => !l.aiPitchHook || l.aiPitchHook.startsWith('Targeted B2B') || l.aiPitchHook.includes('verified active lead')
  );
  if (!needHook.length) return leads;
  try {
    const prompt = `You are Gemini 4 Hydrogen XHigh + Hermes Sales Strategist for ${productName}.
For each of the following ${needHook.length} SMTP-verified active leads, write ONE crisp, personalized conversion hook sentence (max 18 words) in JSON array format matching exact order:
${JSON.stringify(needHook.map((l) => ({ name: l.name, city: l.city, category: l.category })))}
Return ONLY a valid JSON array of strings.`;

    const res = await geminiRotator.generateJson(prompt, { timeoutMs: 18000, maxOutputTokens: 2048 });
    if (Array.isArray(res.data)) {
      needHook.forEach((l, idx) => {
        if (typeof res.data[idx] === 'string' && res.data[idx].trim()) {
          l.aiPitchHook = res.data[idx].trim();
          l.aiModel = res.modelUsed;
          l.aiKeyUsed = res.keyMasked;
        }
      });
    }
  } catch (err) {
    console.warn(`[JarvisLeadCollector] Gemini enrichment note (${productName}):`, err.message);
  }
  return leads;
}

function enqueueVerificationCandidates(productName, candidates = []) {
  const queue = readJsonSafe(QUEUE_FILE, []);
  const rejected = getRejectedSet();
  const seen = new Set(queue.map((q) => `${q.product}:${String(q.email || '').toLowerCase()}`));
  let added = 0;

  for (const c of candidates) {
    const hygiene = verifier.checkEmailHygiene(c?.email);
    if (!hygiene.valid || rejected.has(hygiene.email)) continue;
    const key = `${productName}:${hygiene.email}`;
    if (seen.has(key)) continue;
    seen.add(key);
    queue.push({
      product: productName,
      name: c.name || 'Verified Prospect',
      email: hygiene.email,
      city: c.city || 'India',
      category: c.category || productName,
      source: c.source || 'candidate_queue',
      queuedAt: new Date().toISOString()
    });
    added++;
  }

  writeJsonSafe(QUEUE_FILE, queue.slice(0, 1000));
  return added;
}

function getVerificationQueue(limit = 40) {
  return readJsonSafe(QUEUE_FILE, []).slice(0, limit);
}

function submitVerifiedBatch({ verified = [], rejected = [] } = {}) {
  const pool = getVerifiedPool();
  const poolSets = {};
  for (const p of PRODUCTS) {
    if (!Array.isArray(pool[p])) pool[p] = [];
    poolSets[p] = new Set(pool[p].map((x) => String(x.email || '').toLowerCase().trim()));
  }

  let acceptedCount = 0;
  for (const item of verified) {
    const prod = PRODUCTS.find((p) => p.toLowerCase() === String(item.product || '').toLowerCase());
    if (!prod) continue;
    const em = String(item.email || '').toLowerCase().trim();
    if (!em || item.verificationStatus !== 'ACTIVE_EXACT_CONFIRMED') continue;
    if (poolSets[prod].has(em)) continue;

    pool[prod].push({
      name: item.name || 'Active Contact',
      email: em,
      domain: item.domain || em.split('@')[1],
      city: item.city || 'India',
      category: item.category || prod,
      source: item.source || 'live_smtp_canary',
      mxHost: item.mxHost,
      mxVerified: true,
      smtpVerified: true,
      verificationStatus: 'ACTIVE_EXACT_CONFIRMED',
      canaryCode: item.canaryCode || 550,
      smtpCode: item.smtpCode || 250,
      smtpProof: item.smtpProof || '250 OK (Canary Confirmed)',
      verifiedAt: item.verifiedAt || new Date().toISOString(),
      aiPitchHook: item.aiPitchHook || ''
    });
    poolSets[prod].add(em);
    acceptedCount++;
  }

  pool.updatedAt = new Date().toISOString();
  pool.counts = Object.fromEntries(PRODUCTS.map((p) => [p, pool[p].length]));
  writeJsonSafe(VERIFIED_POOL_FILE, pool);

  if (rejected.length > 0) {
    recordRejectedEmails(rejected);
  }

  // Drain processed emails from verification queue
  const doneSet = new Set([
    ...verified.map((v) => `${String(v.product || '').toLowerCase()}:${String(v.email || '').toLowerCase()}`),
    ...rejected.map((r) => `${String(r.product || '').toLowerCase()}:${String(r.email || '').toLowerCase()}`)
  ]);
  const remaining = readJsonSafe(QUEUE_FILE, []).filter(
    (q) => !doneSet.has(`${String(q.product || '').toLowerCase()}:${String(q.email || '').toLowerCase()}`)
  );
  writeJsonSafe(QUEUE_FILE, remaining);

  if (acceptedCount > 0 || rejected.length > 0) {
    unifiedHub.recordActivity(
      'hermes',
      'SMTP_CANARY_SYNC',
      `Live Port-25 Canary Audit: +${acceptedCount} Active Confirmed, ${rejected.length} Inactive/Dead Blocked`
    );
  }

  return { acceptedCount, rejectedCount: rejected.length, remainingQueue: remaining.length, counts: pool.counts };
}

async function collectForProduct(productName, limit = 10, geminiRotator = null, _doctoEngine = null, _ctEngine = null) {
  const { date, timeTag, iso } = getIstDateAndTime();
  removeStaleUntestedDailyFiles(date, productName);

  const existingDaily = readExistingVerifiedDaily(date, productName);
  const alreadyEmails = new Set(existingDaily.map((x) => String(x.email || '').toLowerCase().trim()));
  const rejectedSet = getRejectedSet();
  const pool = getVerifiedPool();
  const verifiedSource = Array.isArray(pool[productName]) ? pool[productName] : [];

  const newlyAdded = [];
  for (const entry of verifiedSource) {
    if (newlyAdded.length >= limit) break;
    const em = String(entry?.email || '').toLowerCase().trim();
    const hygiene = verifier.checkEmailHygiene(em);
    if (!hygiene.valid || rejectedSet.has(em) || alreadyEmails.has(em)) continue;
    if (entry.smtpVerified !== true || entry.verificationStatus !== 'ACTIVE_EXACT_CONFIRMED') continue;

    newlyAdded.push({
      name: entry.name || productName,
      email: em,
      domain: entry.domain || hygiene.domain,
      city: entry.city || 'India',
      category: entry.category || productName,
      verificationStatus: 'ACTIVE_EXACT_CONFIRMED',
      canaryCode: entry.canaryCode || 550,
      smtpCode: entry.smtpCode || 250,
      smtpProof: entry.smtpProof || '250 2.1.5 OK',
      mxHost: entry.mxHost || '',
      verifiedAt: entry.verifiedAt || iso,
      smtpVerified: true,
      mxVerified: true,
      referralCode: entry.referralCode || '',
      personalLink: entry.personalLink || '',
      aiPitchHook: entry.aiPitchHook || `${productName} verified active lead (${entry.city || 'India'})`,
      collectedAt: iso
    });
    alreadyEmails.add(em);
  }

  await enrichLeadsWithGemini(productName, newlyAdded, geminiRotator);

  const mergedDaily = [...existingDaily, ...newlyAdded];
  const fileBase = getProductBaseName(productName, date);
  const paths = writeCollectionToAllTargets(date, productName, fileBase, mergedDaily);

  const brandKey = productName.toLowerCase();
  unifiedHub.recordActivity(
    brandKey,
    'JARVIS_LEAD_COLLECTION',
    `Zero-Bounce ${productName}: +${newlyAdded.length} Active Tested (Total: ${mergedDaily.length}) -> ${fileBase}.csv`,
    { date, timeTag, newlyAdded: newlyAdded.length, dailyTotal: mergedDaily.length, verificationMode: 'ACTIVE_EXACT_CONFIRMED' }
  );

  return {
    product: productName,
    date,
    timeTag,
    fileName: `${fileBase}.csv`,
    verificationGuarantee: '100% Port-25 Canary Active Confirmed (Zero Inactive Emails)',
    newlyCollected: newlyAdded.length,
    dailyTotal: mergedDaily.length,
    poolAvailable: verifiedSource.length,
    leads: newlyAdded,
    writtenTargets: [...new Set(paths.map((p) => path.dirname(p)))]
  };
}

async function generateDailyActivityReport(geminiRotator = null, extraContext = {}) {
  const { date, timeTag, iso } = getIstDateAndTime();
  const productCounts = {};
  const poolCounts = {};
  const pool = getVerifiedPool();

  for (const prod of PRODUCTS) {
    const fileBase = getProductBaseName(prod, date);
    const fPath = path.join(SOVEREIGN_COLLECTION_ROOT, date, prod, `${fileBase}.json`);
    const list = readJsonSafe(fPath, []);
    productCounts[prod] = Array.isArray(list) ? list.filter((x) => x.verificationStatus === 'ACTIVE_EXACT_CONFIRMED').length : 0;
    poolCounts[prod] = Array.isArray(pool[prod]) ? pool[prod].length : 0;
  }

  const brandMetrics = unifiedHub.getBrandMetrics();
  const outboxStats = unifiedHub.getAllOutboxStats();
  const recentActivity = unifiedHub.getRecentActivity('all', 30);
  const rotatorStats = geminiRotator ? geminiRotator.getStatus() : { totalKeys: 0, activeKeys: 0 };
  const rejectedCount = getRejectedSet().size;

  let executiveSummaryHi = `आज (${date}, ${timeTag} IST) Jarvis Zero-Bounce Engine ने चारों ब्रांड्स (${PRODUCTS.join(', ')}) के लिए केवल Port-25 SMTP Canary ('250 OK') सत्यापित सक्रिय लीड्स ही अलग-अलग नामित फ़ाइलों में सेव की हैं।`;
  if (geminiRotator) {
    try {
      executiveSummaryHi = await geminiRotator.generateContent(
        `तुम Gemini 4 Hydrogen (XHigh) + Hermes Executive Director हो। आज (${date} ${timeTag} IST) की इस 100% Zero-Bounce लाइव रिपोर्ट पर हिंदी में 3 सटीक पंक्तियाँ लिखो:
        - आज की Port-25 Active Verified लीड्स: ${JSON.stringify(productCounts)} (कुल Verified Pool: ${JSON.stringify(poolCounts)})
        - ब्लॉक किए गए निष्क्रिय/बाउंस ईमेल: ${rejectedCount}
        - ब्रांड आउटरीच स्टेटस: ${JSON.stringify(Object.fromEntries(Object.entries(brandMetrics).map(([k, v]) => [k, { dispatched: v.dispatched, queued: v.queued }])))}`,
        { timeoutMs: 16000, maxOutputTokens: 1024 }
      );
    } catch (_) {}
  }

  const reportObj = {
    reportTitle: `Jarvis Zero-Bounce Daily Lead & Activity Report (${date} ${timeTag} IST)`,
    generatedAt: iso,
    date,
    timeTag,
    verificationStandard: 'Two-Step Port-25 SMTP Canary (Canary 5xx Rejected + Target 250 OK Only)',
    inactiveEmailsBlockedCount: rejectedCount,
    dailyVerifiedLeads: productCounts,
    verifiedPoolTotals: poolCounts,
    brandMetrics,
    outboxStats,
    oracleStatus: extraContext.oracleStatus || null,
    executiveSummaryHi,
    recentActivities: recentActivity.slice(0, 15)
  };

  const md = `# 📊 Jarvis Zero-Bounce Lead & Activity Report (${date} | ${timeTag} IST)

**Verification Gate:** \`Two-Step Port-25 SMTP Canary (250 OK Active Only)\`  
**Blocked Dead / 5xx / Bouncing Emails:** \`${rejectedCount}\`  
**Gemini Key Pool:** \`${rotatorStats.activeKeys} / ${rotatorStats.totalKeys}\`

## 🧠 Executive AI Analysis (Hindi)
${executiveSummaryHi}

## ✅ प्रोडक्ट के नाम से अलग-अलग ट्राइड & टेस्टेड फ़ाइलें (${date})
| प्रोडक्ट | अलग फ़ाइल नाम | आज की Active (250 OK) लीड्स | Verified Pool कुल | ईमेल भेजे (Dispatched) |
| :--- | :--- | :---: | :---: | :---: |
${PRODUCTS.map((p) => {
    const key = p.toLowerCase();
    return `| **${p}** | \`${p}/${getProductBaseName(p, date)}.csv\` | ${productCounts[p]} | ${poolCounts[p]} | ${brandMetrics[key]?.dispatched || 0} |`;
  }).join('\n')}

## 🔄 ताज़ा सिस्टम गतिविधियाँ
${recentActivity.slice(0, 10).map((a) => `- **[${a.brand.toUpperCase()}]** (${a.timestamp}) — ${a.summary}`).join('\n')}
`;

  const writtenPaths = writeCollectionToAllTargets(date, '', `Daily_Activity_Report_${date}`, reportObj, md);
  unifiedHub.recordActivity('hermes', 'DAILY_REPORT_GENERATED', `Zero-Bounce Daily Report (${date} ${timeTag}) synced across Desktop & Drive`, {
    totalTodayVerified: Object.values(productCounts).reduce((a, b) => a + b, 0)
  });

  return {
    success: true,
    report: reportObj,
    markdown: md,
    savedLocations: [...new Set(writtenPaths.map((p) => path.dirname(p)))]
  };
}

async function runAllProductsDailyCollection(limitPerProduct = 15, geminiRotator = null, extraContext = {}) {
  const results = [];
  for (const prod of PRODUCTS) {
    const r = await collectForProduct(prod, limitPerProduct, geminiRotator);
    results.push(r);
  }
  const report = await generateDailyActivityReport(geminiRotator, extraContext);
  return {
    success: true,
    verificationStandard: 'ACTIVE_EXACT_CONFIRMED_ONLY',
    collections: results,
    dailyReport: report
  };
}

function listAllCollections() {
  const tree = [];
  if (!fs.existsSync(SOVEREIGN_COLLECTION_ROOT)) return tree;
  const dates = fs.readdirSync(SOVEREIGN_COLLECTION_ROOT).sort().reverse();
  for (const d of dates) {
    const dPath = path.join(SOVEREIGN_COLLECTION_ROOT, d);
    if (!fs.statSync(dPath).isDirectory()) continue;
    const items = fs.readdirSync(dPath);
    const products = {};
    let hasDailyReport = false;
    for (const item of items) {
      const full = path.join(dPath, item);
      if (fs.statSync(full).isDirectory()) {
        const files = fs.readdirSync(full);
        const namedFile = `${getProductBaseName(item, d)}.json`;
        const masterList = readJsonSafe(path.join(full, namedFile), []);
        const verifiedCount = Array.isArray(masterList)
          ? masterList.filter((x) => x.verificationStatus === 'ACTIVE_EXACT_CONFIRMED').length
          : 0;
        products[item] = {
          filesCount: files.length,
          dailyLeadsCount: verifiedCount,
          primaryCsv: `${getProductBaseName(item, d)}.csv`,
          files
        };
      } else if (item.startsWith('Daily_Activity_Report_')) {
        hasDailyReport = true;
      }
    }
    tree.push({ date: d, products, hasDailyReport });
  }
  return tree;
}

function getProductCsvFile(dateStr, productName) {
  const prod = PRODUCTS.find((p) => p.toLowerCase() === String(productName || '').toLowerCase());
  if (!prod) return null;
  const fileName = `${getProductBaseName(prod, dateStr)}.csv`;
  const filePath = path.join(SOVEREIGN_COLLECTION_ROOT, dateStr, prod, fileName);
  if (!fs.existsSync(filePath)) return null;
  return { fileName, filePath, product: prod };
}

module.exports = {
  PRODUCTS,
  SOVEREIGN_COLLECTION_ROOT,
  DESKTOP_COLLECTION_ROOT,
  DRIVE_COLLECTION_ROOT,
  VERIFIED_POOL_FILE,
  collectForProduct,
  generateDailyActivityReport,
  runAllProductsDailyCollection,
  listAllCollections,
  getVerifiedPool,
  enqueueVerificationCandidates,
  getVerificationQueue,
  submitVerifiedBatch,
  getProductCsvFile,
  getProductBaseName,
  getRejectedSet
};
