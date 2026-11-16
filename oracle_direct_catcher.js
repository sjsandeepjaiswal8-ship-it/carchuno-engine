const fs = require('fs');
const common = require('oci-common');
const core = require('oci-core');

const CONFIG_FILE = 'C:\\Users\\HP\\.oci\\config';
const TENANCY_ID = 'ocid1.tenancy.oc1..aaaaaaaatpyuzzldor3qnuzdswm4bdwxrkmzwl2rfuq3dszvuyw666fz2exq';
const AD = 'PGML:AP-HYDERABAD-1-AD-1';
const SUBNET_ID = 'ocid1.subnet.oc1.ap-hyderabad-1.aaaaaaaagf3nml2d3vs2kqmn5qcn7spswhu6tkje2pacyce7zjjhbj2rwgqq';
const IMAGE_ID = 'ocid1.image.oc1.ap-hyderabad-1.aaaaaaaa5l2u7polcipozbzt4fgwhbikoxpai3fccaudd7dutyln33vnpzwq';
const SSH_KEY_PATH = 'C:\\Users\\HP\\.oci\\instance_ssh_key.key';
const SSH_PUBLIC_KEY = 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC9A5jRwKQp2a4mMuKgr0ZpXVd8ej+5OjBS9wilG15bzmIYPsE49hQ7IPDsVZGWuzylT8I9oPoFanz/rtIUPOSO/oVHe5B+IHMTlNRxyBIWsAz2O3CIBdXhhe+IzfbYd5g85ljsoGBmE0194JoGeFi+K5L/82N/vnqVHMdLXaEoP/06b9VTeWEZsmbP5zV33dnOzXy0c8H0VYxENjDFPaSrLgrc7lGoV7hD9itnC2+GJBlet30xEBU5Lq8Tn2iRrH2izou58mGvKS+2d/DuCP1lcZG90Q+HwYhjodspgDfhicCHUzMmwhhkZ3lbI8pV/BZJDoiltEdGBhCvBdI81PCJ ssh-key-2026-11-09';

const LOG_FILE = 'C:\\Users\\HP\\Desktop\\carchuno-sales-engine\\oracle_provision_log.txt';
const SUCCESS_FILE = 'C:\\Users\\HP\\Desktop\\carchuno-sales-engine\\oracle_server_info.json';

const provider = new common.ConfigFileAuthenticationDetailsProvider(CONFIG_FILE, 'DEFAULT');
const computeClient = new core.ComputeClient({ authenticationDetailsProvider: provider });
const vnetClient = new core.VirtualNetworkClient({ authenticationDetailsProvider: provider });

function log(msg) {
  const line = `[${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}] ${msg}`;
  console.log(line);
  try {
    fs.appendFileSync(LOG_FILE, line + '\n', 'utf8');
  } catch (e) {}
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getExistingAmpereInstances() {
  try {
    const listRes = await computeClient.listInstances({ compartmentId: TENANCY_ID });
    const instances = listRes.items || [];
    return instances.filter(
      i =>
        (i.lifecycleState === 'RUNNING' || i.lifecycleState === 'PROVISIONING') &&
        i.shape === 'VM.Standard.A1.Flex'
    );
  } catch (err) {
    return [];
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
    log(`IP fetch note: ${e.message}`);
  }
  return 'Pending...';
}

async function runDirectCatcher() {
  log('================================================================');
  log('🎯 DIRECT OCI MULTI-TIER CAPACITY CATCHER (HIGH PRIORITY) STARTED');
  log(`Region: ap-hyderabad-1 | AD: ${AD}`);
  log('Tiers: 24GB (4 OCPU) -> 18GB (3 OCPU) -> 12GB (2 OCPU) -> 6GB (1 OCPU)');
  log('Mode: Direct Compute API (Bypasses Resource Manager limits)');
  log(`Log File: ${LOG_FILE}`);
  log('================================================================');

  const SHAPE_TIERS = [
    { ocpus: 4, memoryInGBs: 24, label: '4 OCPU / 24 GB RAM' },
    { ocpus: 3, memoryInGBs: 18, label: '3 OCPU / 18 GB RAM' },
    { ocpus: 2, memoryInGBs: 12, label: '2 OCPU / 12 GB RAM' },
    { ocpus: 1, memoryInGBs: 6, label: '1 OCPU / 6 GB RAM' }
  ];

  let attempt = 1;

  while (true) {
    try {
      // 1. Check existing active Ampere instances and calculate remaining Always-Free quota
      const existingList = await getExistingAmpereInstances();
      const usedOcpus = existingList.reduce((sum, i) => sum + (i.shapeConfig?.ocpus || 0), 0);
      const usedRamGB = existingList.reduce((sum, i) => sum + (i.shapeConfig?.memoryInGBs || 0), 0);

      if (usedRamGB >= 18 || usedOcpus >= 4) {
        log(`\n🎉 TARGET QUOTA REACHED! (${usedOcpus} OCPU / ${usedRamGB} GB RAM across ${existingList.length} instance(s))`);
        const details = [];
        for (const inst of existingList) {
          const ip = await getPublicIp(inst.id);
          details.push({
            status: inst.lifecycleState,
            instanceId: inst.id,
            name: inst.displayName,
            publicIp: ip,
            ocpus: inst.shapeConfig?.ocpus,
            ramGB: inst.shapeConfig?.memoryInGBs,
            sshCommand: `ssh -i "${SSH_KEY_PATH}" ubuntu@${ip}`
          });
          log(`SSH Access (${inst.displayName}): ssh -i "${SSH_KEY_PATH}" ubuntu@${ip}`);
        }
        fs.writeFileSync(SUCCESS_FILE, JSON.stringify({ status: 'LIVE', totalOcpus: usedOcpus, totalRamGB: usedRamGB, instances: details, time: new Date().toISOString() }, null, 2), 'utf8');
        return;
      }

      const remainingOcpus = Math.max(0, 4 - usedOcpus);
      const remainingRamGB = Math.max(0, 24 - usedRamGB);
      const eligibleTiers = SHAPE_TIERS.filter(
        t => t.ocpus <= remainingOcpus && t.memoryInGBs <= remainingRamGB
      );
      if (eligibleTiers.length === 0) return;

      // 2. Rotating multi-tier launch request across eligible tiers
      const tier = eligibleTiers[(attempt - 1) % eligibleTiers.length];
      const bootSizeGB = existingList.length === 0 ? 100 : 50;
      const instanceName = `oracle-ampere-${tier.memoryInGBs}gb-${existingList.length + 1}`;
      log(`[Attempt #${attempt}] Active: ${usedRamGB}GB/${usedOcpus}OCPU | Sending direct launch request (${tier.label}, Boot: ${bootSizeGB}GB) to Hyderabad AD-1 pool...`);
      try {
        const launchRes = await computeClient.launchInstance({
          launchInstanceDetails: {
            compartmentId: TENANCY_ID,
            availabilityDomain: AD,
            displayName: instanceName,
            shape: 'VM.Standard.A1.Flex',
            shapeConfig: {
              ocpus: tier.ocpus,
              memoryInGBs: tier.memoryInGBs
            },
            sourceDetails: {
              sourceType: 'image',
              imageId: IMAGE_ID,
              bootVolumeSizeInGBs: bootSizeGB
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
        log(`🎉🎉🎉 SUCCESS! AMPERE SERVER (${tier.label}) LAUNCHED! 🎉🎉🎉`);
        log(`Instance OCID: ${newInst.id}`);
        log(`Initial State: ${newInst.lifecycleState}`);

        // Wait 30 seconds for VNIC and Public IP
        log('Waiting 30 seconds for public IP assignment...');
        await sleep(30000);

        const publicIp = await getPublicIp(newInst.id);
        const newTotalRam = usedRamGB + tier.memoryInGBs;
        const newTotalOcpus = usedOcpus + tier.ocpus;
        const serverInfo = {
          status: 'PROVISIONED',
          instanceId: newInst.id,
          name: instanceName,
          publicIp: publicIp,
          sshUser: 'ubuntu',
          sshKeyPath: SSH_KEY_PATH,
          sshCommand: `ssh -i "${SSH_KEY_PATH}" ubuntu@${publicIp}`,
          specs: {
            shape: 'VM.Standard.A1.Flex',
            ocpus: tier.ocpus,
            ramGB: tier.memoryInGBs,
            storageGB: bootSizeGB,
            os: 'Ubuntu 24.04 Minimal aarch64',
            cost: '$0.00 / month (Always Free)'
          },
          totalQuotaUsed: { ocpus: newTotalOcpus, ramGB: newTotalRam },
          provisionedAt: new Date().toISOString()
        };

        fs.writeFileSync(SUCCESS_FILE, JSON.stringify(serverInfo, null, 2), 'utf8');
        log('================================================================');
        log(`Public IP: ${publicIp}`);
        log(`Connect via: ssh -i "${SSH_KEY_PATH}" ubuntu@${publicIp}`);
        log(`Details saved to: ${SUCCESS_FILE}`);
        log('================================================================');

        // Auto-deploy Anti-Reclamation Guardian Shield
        try {
          const { deployGuardian } = require('./oracle_sovereign_bootstrapper');
          log('🛡️ Auto-triggering Anti-Reclamation Guardian deployment...');
          deployGuardian(serverInfo);
        } catch (ge) {
          log(`Guardian trigger note: ${ge.message}`);
        }

        if (newTotalRam >= 18 || newTotalOcpus >= 4) {
          log(`🎉 Target quota reached (${newTotalOcpus} OCPU / ${newTotalRam} GB RAM)!`);
          return;
        }
        log(`🔄 ${newTotalRam} GB allocated so far (< 18 GB). Continuing hunt for remaining ${24 - newTotalRam} GB!`);
      } catch (tierErr) {
        const msg = tierErr.message || '';
        if (msg.includes('Out of host capacity')) {
          log(`[Attempt #${attempt}] ${tier.label}: Host capacity full in AD-1.`);
        } else {
          log(`[Attempt #${attempt}] ${tier.label} Notice: ${msg}`);
        }
      }

    } catch (err) {
      log(`[Attempt #${attempt}] Notice: ${err.message}`);
    }

    attempt++;
    const waitSec = 90 + Math.floor(Math.random() * 30); // 90-120 seconds sweet spot (prevents 429 throttling)
    log(`Cooling down for ${waitSec}s to keep API limits clean...`);
    await sleep(waitSec * 1000);
  }
}

runDirectCatcher().catch(err => {
  log(`Fatal Error in Direct Catcher: ${err.message}`);
});
