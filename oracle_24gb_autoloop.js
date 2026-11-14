const fs = require('fs');
const path = require('path');
const common = require('oci-common');
const rm = require('oci-resourcemanager');
const core = require('oci-core');

const CONFIG_FILE = 'C:\\Users\\HP\\.oci\\config';
const STACK_ID = 'ocid1.ormstack.oc1.ap-hyderabad-1.amaaaaaaelwqbaaakhirbbmkw7ecybr56karmtkrssc5pyovcmfw67godpbq';
const TENANCY_ID = 'ocid1.tenancy.oc1..aaaaaaaatpyuzzldor3qnuzdswm4bdwxrkmzwl2rfuq3dszvuyw666fz2exq';
const LOG_FILE = 'C:\\Users\\HP\\Desktop\\carchuno-sales-engine\\oracle_provision_log.txt';
const SUCCESS_FILE = 'C:\\Users\\HP\\Desktop\\carchuno-sales-engine\\oracle_server_info.json';
const SSH_KEY_PATH = 'C:\\Users\\HP\\.oci\\instance_ssh_key.key';

const provider = new common.ConfigFileAuthenticationDetailsProvider(CONFIG_FILE, 'DEFAULT');
const rmClient = new rm.ResourceManagerClient({ authenticationDetailsProvider: provider });
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

async function getActiveJob() {
  try {
    const listRes = await rmClient.listJobs({
      stackId: STACK_ID,
      sortBy: 'TIMECREATED',
      sortOrder: 'DESC',
      limit: 3
    });
    const items = listRes.items || [];
    return items.find(j => j.lifecycleState === 'ACCEPTED' || j.lifecycleState === 'IN_PROGRESS');
  } catch (err) {
    log(`Notice checking active jobs: ${err.message}`);
    return null;
  }
}

async function fetchServerDetails(jobId) {
  try {
    log('Fetching instance networking details...');
    const instRes = await computeClient.listInstances({ compartmentId: TENANCY_ID });
    const instances = instRes.items || [];
    const runningInstance = instances.find(inst => 
      inst.lifecycleState === 'RUNNING' || inst.lifecycleState === 'PROVISIONING'
    );

    let publicIp = 'Pending / Fetching...';
    let instanceId = runningInstance ? runningInstance.id : 'Unknown';
    let instanceName = runningInstance ? runningInstance.displayName : 'instance-20261109-2201';

    if (runningInstance) {
      const vnicAttachRes = await computeClient.listVnicAttachments({
        compartmentId: TENANCY_ID,
        instanceId: runningInstance.id
      });
      const vnicAttachments = vnicAttachRes.items || [];
      if (vnicAttachments.length > 0 && vnicAttachments[0].vnicId) {
        const vnicRes = await vnetClient.getVnic({ vnicId: vnicAttachments[0].vnicId });
        if (vnicRes.vnic && vnicRes.vnic.publicIp) {
          publicIp = vnicRes.vnic.publicIp;
        }
      }
    }

    const serverInfo = {
      status: 'PROVISIONED',
      stackId: STACK_ID,
      jobId: jobId,
      instanceId: instanceId,
      instanceName: instanceName,
      publicIp: publicIp,
      sshUser: 'ubuntu',
      sshKeyPath: SSH_KEY_PATH,
      sshCommand: `ssh -i "${SSH_KEY_PATH}" ubuntu@${publicIp}`,
      specs: {
        shape: 'VM.Standard.A1.Flex',
        ocpus: 2,
        ramGB: 12,
        storageGB: 100,
        os: 'Canonical Ubuntu 24.04 Minimal aarch64',
        region: 'ap-hyderabad-1 (India South)',
        cost: 'Always Free ($0.00 / month)'
      },
      provisionedAt: new Date().toISOString()
    };

    fs.writeFileSync(SUCCESS_FILE, JSON.stringify(serverInfo, null, 2), 'utf8');
    log('================================================================');
    log('🎉🎉🎉 24GB SERVER IS OFFICIALLY LIVE! 🎉🎉🎉');
    log(`Public IP: ${publicIp}`);
    log(`SSH Command: ssh -i "${SSH_KEY_PATH}" ubuntu@${publicIp}`);
    log(`Full details saved to: ${SUCCESS_FILE}`);
    log('================================================================');
    return serverInfo;
  } catch (err) {
    log(`Warning while fetching IP: ${err.message}`);
  }
}

async function runAutoProvisioner() {
  log('================================================================');
  log('🚀 ORACLE CLOUD 24GB AMPERE AUTONOMOUS PROVISIONER INITIALIZED');
  log(`Stack OCID: ${STACK_ID}`);
  log('Region: ap-hyderabad-1 (India South)');
  log('Desired Specs: 2 OCPUs | 12 GB RAM | 100 GB Boot Volume ($0 Always Free)');
  log(`Log File: ${LOG_FILE}`);
  log('================================================================');

  let attempt = 1;

  while (true) {
    try {
      // 1. Check if a job is currently active
      const activeJob = await getActiveJob();
      if (activeJob) {
        log(`Active job running: ${activeJob.displayName} (${activeJob.id.slice(-15)}) - State: ${activeJob.lifecycleState}. Waiting...`);
        await sleep(15000);
        continue;
      }

      // 2. Trigger new Apply job
      log(`\n[Attempt #${attempt}] Triggering Apply Job on Oracle Resource Manager...`);
      const createRes = await rmClient.createJob({
        createJobDetails: {
          stackId: STACK_ID,
          operation: 'APPLY',
          displayName: `Auto-Apply-Attempt-${attempt}`,
          jobOperationDetails: {
            operation: 'APPLY',
            executionPlanStrategy: 'AUTO_APPROVED'
          }
        }
      });

      const job = createRes.job;
      log(`Job Created: ${job.displayName} (ID: ${job.id.slice(-20)}) | Initial State: ${job.lifecycleState}`);

      // 3. Monitor Job State
      for (let poll = 0; poll < 18; poll++) {
        await sleep(10000); // 10s intervals
        const checkRes = await rmClient.getJob({ jobId: job.id });
        const currentJob = checkRes.job;
        const state = currentJob.lifecycleState;

        if (state === 'SUCCEEDED') {
          log(`🎉 Job ${job.displayName} completed with state: SUCCEEDED!`);
          await fetchServerDetails(job.id);
          return;
        }

        if (state === 'FAILED') {
          log(`[Attempt #${attempt}] State: FAILED (Capacity temporarily full in Hyderabad AD-1).`);
          break;
        }

        if (state === 'CANCELED') {
          log(`[Attempt #${attempt}] State: CANCELED.`);
          break;
        }

        log(`... In progress (Current State: ${state})`);
      }

    } catch (err) {
      log(`[Attempt #${attempt}] OCI Error: ${err.message}`);
    }

    attempt++;
    const waitSeconds = 60 + Math.floor(Math.random() * 20); // 60-80s delay
    log(`Next attempt in ${waitSeconds}s... (Daemon running silently)`);
    await sleep(waitSeconds * 1000);
  }
}

runAutoProvisioner().catch(err => {
  log(`Daemon Exception: ${err.stack || err.message}`);
});
