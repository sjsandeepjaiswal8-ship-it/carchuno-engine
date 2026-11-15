/**
 * ==============================================================================
 * VAULT MIRROR SYNC ENGINE - 20,000 GB GOOGLE DRIVE CONTINUOUS REPLICATION
 * Automatically synchronizes Oracle Cloud & Local Project Codebases & DBs
 * Into: G:\My Drive\Antigravity_Cloud_Vault\Oracle_24GB_Production_Server\
 * ==============================================================================
 */

const fs = require('fs');
const path = require('path');

const VAULT_ROOT = 'G:\\My Drive\\Antigravity_Cloud_Vault\\Oracle_24GB_Production_Server';
const REGISTRY_FILE = path.join(VAULT_ROOT, 'SERVER_SYNC_REGISTRY.json');

const PROJECTS_MAP = [
  {
    name: 'OmniSales_Engine',
    source: 'C:\\Users\\HP\\Desktop\\carchuno-sales-engine',
    dest: path.join(VAULT_ROOT, 'OmniSales_Engine')
  },
  {
    name: 'CarChuno',
    source: 'C:\\Users\\HP\\.gemini\\antigravity\\scratch\\carchuno',
    dest: path.join(VAULT_ROOT, 'CarChuno')
  },
  {
    name: 'CloseTesters',
    source: 'C:\\Users\\HP\\Desktop\\04-11-2026 - सारी फाइल्स\\closetesters.com',
    dest: path.join(VAULT_ROOT, 'CloseTesters')
  },
  {
    name: 'AstroMasterpiece',
    source: 'C:\\Users\\HP\\Desktop\\04-11-2026 - सारी फाइल्स\\AstroFix 12pillar version 3.0 09-10-2026',
    dest: path.join(VAULT_ROOT, 'AstroMasterpiece')
  },
  {
    name: 'Doctoreports',
    source: 'C:\\Users\\HP\\Desktop\\04-11-2026 - सारी फाइल्स\\Doctoreports_Website_V87',
    dest: path.join(VAULT_ROOT, 'Doctoreports')
  }
];

const IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  '.cache',
  'temp',
  'tmp',
  '.user_uploaded'
];

function shouldIgnore(itemPath) {
  const normalized = itemPath.toLowerCase();
  return IGNORE_PATTERNS.some(pat => normalized.includes(path.sep + pat.toLowerCase()) || normalized.endsWith(path.sep + pat.toLowerCase()));
}

function copyRecursiveSync(src, dest, stats = { copied: 0, bytes: 0 }) {
  if (!fs.existsSync(src)) return stats;
  if (shouldIgnore(src)) return stats;

  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src);
    for (const entry of entries) {
      copyRecursiveSync(path.join(src, entry), path.join(dest, entry), stats);
    }
  } else {
    // Only copy if file doesn't exist or is modified
    let needCopy = true;
    if (fs.existsSync(dest)) {
      const destStat = fs.statSync(dest);
      if (destStat.mtimeMs >= stat.mtimeMs && destStat.size === stat.size) {
        needCopy = false;
      }
    }
    if (needCopy) {
      fs.copyFileSync(src, dest);
      stats.copied++;
      stats.bytes += stat.size;
    }
  }
  return stats;
}

async function runVaultSync() {
  console.log('================================================================');
  console.log('🔄 VAULT MIRROR SYNC: CONTINUOUS 20,000 GB DRIVE REPLICATION');
  console.log(`Destination: ${VAULT_ROOT}`);
  console.log(`Timestamp: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
  console.log('================================================================\n');

  const now = new Date();
  const timestampStr = now.toISOString().replace(/[:.]/g, '-');
  const results = [];

  for (const proj of PROJECTS_MAP) {
    if (fs.existsSync(proj.source)) {
      console.log(`Syncing [${proj.name}]...`);
      const stats = copyRecursiveSync(proj.source, proj.dest);
      console.log(`  ✓ Synced ${stats.copied} updated files (${(stats.bytes / (1024 * 1024)).toFixed(2)} MB)\n`);
      results.push({
        project: proj.name,
        source: proj.source,
        destination: proj.dest,
        filesCopiedOrUpdated: stats.copied,
        dataTransferredMB: (stats.bytes / (1024 * 1024)).toFixed(2),
        status: 'SYNCED',
        lastSync: now.toISOString()
      });
    } else {
      console.log(`  ⚠ Source path not found for [${proj.name}]: ${proj.source}`);
    }
  }

  // Save Snapshot Meta
  const registryData = {
    vaultStorageCapacity: '20,000 GB (20 TB)',
    lastSyncTimestamp: now.toISOString(),
    humanSyncTime: now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    totalProjectsTracked: results.length,
    projects: results
  };

  fs.writeFileSync(REGISTRY_FILE, JSON.stringify(registryData, null, 2), 'utf8');
  console.log(`\n✅ Registry metadata updated: ${REGISTRY_FILE}`);
  console.log('================================================================');
}

if (require.main === module) {
  runVaultSync();
}

module.exports = { runVaultSync };
