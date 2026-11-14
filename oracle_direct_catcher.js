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

async function checkExistingInstance() {
  try {
    const listRes = await computeClient.listInstances({ compartmentId: TENANCY_ID });
    const instances = listRes.items || [];
    const active = instances.find(i => i.lifecycleState === 'RUNNING' || i.lifecycleState === 'PROVISIONING');
    return active;
  } catch (err) {
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
    log(`IP fetch note: ${e.message}`);
  }
  return 'Pending...';
}

async function runDirectCatcher() {
  log('================================================================');
  log('🎯 DIRECT OCI 24GB CAPACITY CATCHER (HIGH PRIORITY) STARTED');
  log(`Region: ap-hyderabad-1 | AD: ${AD}`);
  log('Specs: 2 OCPUs | 12 GB RAM | 100 GB Boot Volume (Canonical Ubuntu 24.04 ARM64)');
  log('Mode: Direct Compute API (Bypasses Resource Manager limits)');
  log(`Log File: ${LOG_FILE}`);
  log('================================================================');

  let attempt = 1;

  while (true) {
    try {
      // 1. Check if instance already exists
      const existing = await checkExistingInstance();
      if (existing) {
        log(`\n🎉 INSTANCE ALREADY ACTIVE! (${existing.displayName} - ${existing.id.slice(-15)})`);
        let ip = await getPublicIp(existing.id);
        const info = {
          status: 'LIVE',
          instanceId: existing.id,
          name: existing.displayName,
          publicIp: ip,
          specs: '2 OCPUs | 12 GB RAM | 100 GB Storage (Always Free)',
          sshCommand: `ssh -i "${SSH_KEY_PATH}" ubuntu@${ip}`,
          time: new Date().toISOString()
        };
        fs.writeFileSync(SUCCESS_FILE, JSON.stringify(info, null, 2), 'utf8');
        log(`SSH Access Command: ssh -i "${SSH_KEY_PATH}" ubuntu@${ip}`);
        return;
      }

      // 2. Launch instance directly
      log(`[Attempt #${attempt}] Sending direct launch request to Hyderabad AD-1 pool...`);
      const launchRes = await computeClient.launchInstance({
        launchInstanceDetails: {
          compartmentId: TENANCY_ID,
          availabilityDomain: AD,
          displayName: 'oracle-ampere-server',
          shape: 'VM.Standard.A1.Flex',
          shapeConfig: {
            ocpus: 2,
            memoryInGBs: 12
          },
          sourceDetails: {
            sourceType: 'image',
            imageId: IMAGE_ID,
            bootVolumeSizeInGBs: 100
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
      log('🎉🎉🎉 SUCCESS! AMPERE SERVER INSTANCE LAUNCHED! 🎉🎉🎉');
      log(`Instance OCID: ${newInst.id}`);
      log(`Initial State: ${newInst.lifecycleState}`);

      // Wait 30 seconds for VNIC and Public IP
      log('Waiting 30 seconds for public IP assignment...');
      await sleep(30000);

      const publicIp = await getPublicIp(newInst.id);
      const serverInfo = {
        status: 'PROVISIONED',
        instanceId: newInst.id,
        publicIp: publicIp,
        sshUser: 'ubuntu',
        sshKeyPath: SSH_KEY_PATH,
        sshCommand: `ssh -i "${SSH_KEY_PATH}" ubuntu@${publicIp}`,
        specs: {
          shape: 'VM.Standard.A1.Flex',
          ocpus: 2,
          ramGB: 12,
          storageGB: 100,
          os: 'Ubuntu 24.04 Minimal aarch64',
          cost: '$0.00 / month (Always Free)'
        },
        provisionedAt: new Date().toISOString()
      };

      fs.writeFileSync(SUCCESS_FILE, JSON.stringify(serverInfo, null, 2), 'utf8');
      log('================================================================');
      log(`Public IP: ${publicIp}`);
      log(`Connect via: ssh -i "${SSH_KEY_PATH}" ubuntu@${publicIp}`);
      log(`Details saved to: ${SUCCESS_FILE}`);
      log('================================================================');
      return;

    } catch (err) {
      if (err.message && err.message.includes('Out of host capacity')) {
        log(`[Attempt #${attempt}] Result: Host capacity full in AD-1. Retrying in 35s...`);
      } else {
        log(`[Attempt #${attempt}] Notice: ${err.message}`);
      }
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
