const common = require('oci-common');
const core = require('oci-core');
const provider = new common.ConfigFileAuthenticationDetailsProvider('C:\\Users\\HP\\.oci\\config', 'DEFAULT');
const computeClient = new core.ComputeClient({ authenticationDetailsProvider: provider });
const TENANCY_ID = 'ocid1.tenancy.oc1..aaaaaaaatpyuzzldor3qnuzdswm4bdwxrkmzwl2rfuq3dszvuyw666fz2exq';

async function main() {
  try {
    const res = await computeClient.listInstances({ compartmentId: TENANCY_ID });
    console.log('Instances count:', res.items ? res.items.length : 0);
    if (res.items && res.items.length > 0) {
      res.items.forEach(i => console.log(`- ${i.displayName} (${i.shape}): ${i.lifecycleState}`));
    } else {
      console.log('No instances provisioned yet in Hyderabad.');
    }
  } catch (err) {
    console.error('Error listing instances:', err.message);
  }
}

main();
