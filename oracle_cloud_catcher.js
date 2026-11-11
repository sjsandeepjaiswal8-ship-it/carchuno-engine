/**
 * ==============================================================================
 * ORACLE CLOUD INFRASTRUCTURE (OCI) 24/7 AUTONOMOUS CAPACITY CATCHER
 * ==============================================================================
 * Deployed on Render.com Cloud Container for True 24/7 Non-Stop Pitching.
 * Bypasses local sleep/power-off. Runs continuously in cloud background.
 *
 * Target: 4 OCPUs | 24 GB RAM | 150 GB Storage (Canonical Ubuntu 24.04 ARM64)
 * Region: ap-hyderabad-1 | AD: PGML:AP-HYDERABAD-1-AD-1 (Always Free)
 * ==============================================================================
 */

const fs = require('fs');
const path = require('path');
const common = require('oci-common');
const core = require('oci-core');

// OCI Tenancy & Account Credentials
const TENANCY_ID = 'ocid1.tenancy.oc1..aaaaaaaatpyuzzldor3qnuzdswm4bdwxrkmzwl2rfuq3dszvuyw666fz2exq';
const USER_ID = 'ocid1.user.oc1..aaaaaaaa37hzn5uzvat3qe5ajf2zajvr7dl4y3jfe6gbdixaixavghehyomq';
const FINGERPRINT = '44:ff:b8:87:a4:ef:7e:b9:c8:cb:dc:8b:3e:60:92:f1';
const AD = 'PGML:AP-HYDERABAD-1-AD-1';
const SUBNET_ID = 'ocid1.subnet.oc1.ap-hyderabad-1.aaaaaaaagf3nml2d3vs2kqmn5qcn7spswhu6tkje2pacyce7zjjhbj2rwgqq';
const IMAGE_ID = 'ocid1.image.oc1.ap-hyderabad-1.aaaaaaaa5l2u7polcipozbzt4fgwhbikoxpai3fccaudd7dutyln33vnpzwq';
const SSH_PUBLIC_KEY = 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC9A5jRwKQp2a4mMuKgr0ZpXVd8ej+5OjBS9wilG15bzmIYPsE49hQ7IPDsVZGWuzylT8I9oPoFanz/rtIUPOSO/oVHe5B+IHMTlNRxyBIWsAz2O3CIBdXhhe+IzfbYd5g85ljsoGBmE0194JoGeFi+K5L/82N/vnqVHMdLXaEoP/06b9VTeWEZsmbP5zV33dnOzXy0c8H0VYxENjDFPaSrLgrc7lGoV7hD9itnC2+GJBlet30xEBU5Lq8Tn2iRrH2izou58mGvKS+2d/DuCP1lcZG90Q+HwYhjodspgDfhicCHUzMmwhhkZ3lbI8pV/BZJDoiltEdGBhCvBdI81PCJ ssh-key-2026-11-09';

// Embedded In-Memory Private Key (Decoded at runtime, cloud-safe)
const OCI_KEY_B64 = process.env.OCI_PRIVATE_KEY_B64 || 
  "LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1JSUV2UUlCQURBTkJna3Foa2lHOXcwQkFRRUZBQVNDQktjd2dnU2pBZ0VBQW9JQkFRRE5DWnFCYzZnT0ZKRHQKSjJIcml5MTFRaFhjUlFvL1JpWTZPQjhqSXh5ZmZFSVc1L28wTWNpM0FvRjVsb25Ea3hiOG84Z1RNeTRkMUl0UgpISEJKdUJCdDJrU29JSEh4YjBLNG83b0t0QVhaajdkNlU5ci9HVG5xcUZwSUxsVEk4aC9XamVrdGhwbGZuemdBCjNtanJLSmd4empWQTY3b1R4b2lnczZKQmlQTk5JVERxMk9iZmsxUlhrem5QOUs5bFpnOUdYSGUxNFp6T0hKZ1UKZWVSSVdnRmltS1p1cktVWVVzY0d1Y05VcXIyWCtCT09YWC9oY0xXNFE2bzdIQ1BtRUlxYjltTUplMnEvUGNMLwp2WG10UTUxYWx2Ynp0amxwdzM1V0FvRitqRklDNEVCTjg3VVRhb0RyZFJvcVV0WWh0cnE2RmVySm9GMFVqWjU2Ck9ZVlJFSitKQWdNQkFBRUNnZ0VBSlRXd2RmeTh5MjFkRGNUZlp1VTNwemVLaXhKMmRSd3dkTkZaaVVGbWdPVUcKZzJ5dkFnams0WjJSVExVT3BGRU4wMlNQdXpoSERyL1RWckdBQ1VqZnBtZjluTHRpb2t1c1FxRG44dWhQeFhkbwo5MGkvamhzUVlTOFRUMVVsS3VDUitaaUFjRFFrb205ZE5QOG44RUZLT1lPd00ydDBOZ0dLS3d2ZWp1RWhNbVpYCjlFb3o4eFRZOWFNOHJUQks3b3ZQcHdzbVJTQ200U2kweXRRVlJzYWRWMFRBcTVHZGh1eDdRNnJFTThjTWM2M1gKM2JWWmFvZEdzSFptTVZCM2FqODlESm1RdmYrTmswNzFDNHMyMHBEN2dSQ2I5NkM0WXRYZ0JiN1pYM043WkQxRQpRdE1oSTJCRjFwUm1tN2cwOWpEdXJLUlZ4ZDl2VFN1WWdwRVY1LytkVndLQmdRRHBROVY3djh3Z242eDdLNHNyCmZDUXc3dDZpaHVpczcyUU83MU1DY2JKbzVzcjVGNUR4WjlCa1phSFE1VDhOWVcwWUlhRTl0dUdxeTZPaml1VDQKaTVGZ2VpVkhMUnIwUExaME1QN1p0K2w2aHp1cWpBMThjTysxUytEcXUzOWxWVkhsZDZ1Q21JOTlYamdlTmYvOQpicm9DS09tcVZkck16MW4ySjNRdG9KamRnd0tCZ1FEaEJYZzUzQWpadHUyemVRSks2RWlScjVXUlB5T09HWU5HClZTK3BiOXRPTHh3d1JCdFlQZzJubEZGendLNDBWZUJDdTkxMUJTcXp3WnRVbWhpR1JJOWpOOXIxcWh4dkFEZ24KdUNZejlER29iK1BlcmV2ZlV0dXFrYm9JWEd6cWNnYnNiUVQ4K0dCekZWZW1HaFRSOUJjRUQrczZmd3ZJZFJpQQpLb2R0cEhJdEF3S0JnRFNvM3FuNEs1SDEyZzlZVGl1Nzg4T2tPVmlCa2tkd0o2dURkYjdvZ2ZsU21PSFE0eVRNClpldzBVV3FDUmxDei9OZmt4NnpSKzNIK1ZPdlhzRWMzNHRMZjRFaUlNenlOOURhWTFQKzdtQmJVTHJFYXV2U3IKM2tHVVpxczNOdFJlaFlXREZaSCs5TzI5ZG5mRGd3M29rRTlxZ3cyMEloZjRlM3VwZm4zS2NwZ1hBb0dCQUpCWApTTnFjaVZUV29iMXBWdzRqMkVFVGgzYW5NTEI3THhrVGxjSXpUVkxtcDBkU3VOT3U0bVZubjZRSHFmZEtTdE9qCjNKZXUyOGg0M2FHMFF4MEZwNUMyaUk3ak11QUZIUUJsZ0tQODlVbWRsR2NIMjNEaW5xUFlYS1AyWGFzNXY3VXkKN1dzMEMvSm1jMVhLRHlicVUwVTR6T1EyRUtIaWN2ZnJ6L21GN2ZOdkFvR0FWOTJTbkRDcFlidlp4MEhwVGFzNgpVRTZIeFRVTTBta2puMHJmNk1hb0tuNjZSMEtlR01tOExWNk9MWUtIbTlkd2NtYSsrbHVqOXA0OXY1Z1FyV1k2Ckt2WDhkSEs1dFo4Y1E1M1JCQUIzQXcvNkxVZHl0MWNqZzJGVmhRWTN6K1l6cUFSaEZqYzd5WDU1eGYrVmFFUkcKNVdSMnNLR3J1T20ySFVZSmxHTm4wSDg9Ci0tLS0tRU5EIFBSSVZBVEUgS0VZLS0tLS0K";

const PEM_KEY = Buffer.from(OCI_KEY_B64, 'base64').toString('utf8');

// Initialize OCI Provider & Clients
const provider = new common.SimpleAuthenticationDetailsProvider(
  TENANCY_ID,
  USER_ID,
  FINGERPRINT,
  PEM_KEY,
  null,
  common.Region.AP_HYDERABAD_1
);

const computeClient = new core.ComputeClient({ authenticationDetailsProvider: provider });
const vnetClient = new core.VirtualNetworkClient({ authenticationDetailsProvider: provider });

// In-Memory State & Metrics for API Monitoring
const ociState = {
  running: false,
  mode: 'RENDER_CLOUD_24_7',
  region: 'ap-hyderabad-1 (Hyderabad)',
  ad: AD,
  shape: 'VM.Standard.A1.Flex (4 OCPU, 24 GB RAM, 150GB Storage)',
  attempts: 0,
  lastAttemptTime: null,
  lastResult: 'Initialized. Starting 24/7 cloud loop...',
  serverProvisioned: false,
  serverDetails: null,
  recentLogs: []
};

function addOciLog(msg) {
  const line = `[${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}] ${msg}`;
  console.log(`[OCI Catcher] ${line}`);
  ociState.recentLogs.unshift(line);
  if (ociState.recentLogs.length > 60) ociState.recentLogs.pop();
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkExistingInstance() {
  try {
    const listRes = await computeClient.listInstances({ compartmentId: TENANCY_ID });
    const instances = listRes.items || [];
    const active = instances.find(i => i.lifecycleState === 'RUNNING' || i.lifecycleState === 'PROVISIONING');
    return active || null;
  } catch (err) {
    addOciLog(`Instance check notice: ${err.message}`);
    return null;
  }
}

async function getPublicIp(instanceId) {
  try {
    const vnicRes = await computeClient.listVnicAttachments({
      compartmentId: TENANCY_ID,
      instanceId: instanceId
    });
    const vnics = vnicRes.items || [];
    if (vnics.length > 0 && vnics[0].vnicId) {
      const vnicData = await vnetClient.getVnic({ vnicId: vnics[0].vnicId });
      return vnicData.vnic ? vnicData.vnic.publicIp : 'Pending...';
    }
  } catch (e) {
    addOciLog(`IP fetch note: ${e.message}`);
  }
  return 'Pending...';
}

/**
 * Single Provision Attempt
 */
async function attemptProvision() {
  ociState.attempts++;
  ociState.lastAttemptTime = new Date().toISOString();

  // 1. Check if already provisioned
  const existing = await checkExistingInstance();
  if (existing) {
    const ip = await getPublicIp(existing.id);
    ociState.serverProvisioned = true;
    ociState.serverDetails = {
      status: existing.lifecycleState,
      instanceId: existing.id,
      name: existing.displayName,
      publicIp: ip,
      specs: '4 OCPUs | 24 GB RAM | 150 GB Storage (Always Free)',
      sshCommand: `ssh ubuntu@${ip}`
    };
    ociState.lastResult = `SERVER ALREADY ONLINE (${existing.displayName}) at ${ip}!`;
    addOciLog(`🎉 SERVER ACTIVE! ID: ${existing.id} | IP: ${ip}`);
    return true;
  }

  // 2. Direct Compute API Launch Request
  addOciLog(`[Attempt #${ociState.attempts}] Sending direct launch request to Hyderabad AD-1 pool...`);
  try {
    const launchRes = await computeClient.launchInstance({
      launchInstanceDetails: {
        compartmentId: TENANCY_ID,
        availabilityDomain: AD,
        displayName: 'oracle-24gb-ampere-server',
        shape: 'VM.Standard.A1.Flex',
        shapeConfig: {
          ocpus: 4,
          memoryInGBs: 24
        },
        sourceDetails: {
          sourceType: 'image',
          imageId: IMAGE_ID,
          bootVolumeSizeInGBs: 150
        },
        createVnicDetails: {
          subnetId: SUBNET_ID,
          assignPublicIp: true,
          displayName: 'vnic-main'
        },
        metadata: {
          ssh_authorized_keys: SSH_PUBLIC_KEY
        }
      }
    });

    const newInst = launchRes.instance;
    addOciLog('🎉🎉🎉 SUCCESS! 24GB AMPERE SERVER INSTANCE ALLOCATED! 🎉🎉🎉');
    addOciLog(`Instance OCID: ${newInst.id}`);

    // Wait 25 seconds for public IP assignment
    await sleep(25000);
    const publicIp = await getPublicIp(newInst.id);

    const serverInfo = {
      status: 'PROVISIONED',
      instanceId: newInst.id,
      publicIp: publicIp,
      sshUser: 'ubuntu',
      sshCommand: `ssh ubuntu@${publicIp}`,
      specs: {
        shape: 'VM.Standard.A1.Flex',
        ocpus: 4,
        ramGB: 24,
        storageGB: 150,
        os: 'Ubuntu 24.04 Minimal aarch64',
        cost: '$0.00 / month (Always Free)'
      },
      provisionedAt: new Date().toISOString()
    };

    ociState.serverProvisioned = true;
    ociState.serverDetails = serverInfo;
    ociState.lastResult = `ALLOCATED! Public IP: ${publicIp}`;

    try {
      fs.writeFileSync(path.join(__dirname, 'oracle_server_info.json'), JSON.stringify(serverInfo, null, 2), 'utf8');
    } catch (e) {}

    addOciLog(`Public IP: ${publicIp}`);
    addOciLog(`Connect via: ssh ubuntu@${publicIp}`);
    return true;

  } catch (err) {
    if (err.message && err.message.includes('Out of host capacity')) {
      ociState.lastResult = 'Host capacity full in AD-1. Retrying automatically...';
      addOciLog(`[Attempt #${ociState.attempts}] Out of host capacity in AD-1 pool.`);
    } else {
      ociState.lastResult = `API response: ${err.message}`;
      addOciLog(`[Attempt #${ociState.attempts}] Notice: ${err.message}`);
    }
    return false;
  }
}

/**
 * Autonomous 24/7 Background Loop
 */
let isLoopRunning = false;
async function startOracleCloudCatcher() {
  if (isLoopRunning) return;
  isLoopRunning = true;
  ociState.running = true;

  addOciLog('================================================================');
  addOciLog('🚀 ORACLE CLOUD 24/7 CAPACITY CATCHER ACTIVE ON RENDER CLOUD!');
  addOciLog('Specs: 4 OCPUs | 24 GB RAM | 150 GB Boot Volume (Ubuntu 24.04 ARM64)');
  addOciLog('Region: ap-hyderabad-1 | Target AD: PGML:AP-HYDERABAD-1-AD-1');
  addOciLog('================================================================');

  while (true) {
    try {
      const isDone = await attemptProvision();
      if (isDone) {
        addOciLog('Server successfully claimed. Catcher daemon transitioning to monitoring mode.');
        break;
      }
    } catch (err) {
      addOciLog(`Catcher loop exception: ${err.message}`);
    }

    // Cooldown with jitter (80 to 110 seconds)
    const cooldownSec = 80 + Math.floor(Math.random() * 30);
    addOciLog(`Cooling down for ${cooldownSec}s to preserve API quota...`);
    await sleep(cooldownSec * 1000);
  }
}

function getOracleStatus() {
  return ociState;
}

module.exports = {
  startOracleCloudCatcher,
  attemptProvision,
  getOracleStatus
};

// Self test if run directly
if (require.main === module) {
  startOracleCloudCatcher();
}
