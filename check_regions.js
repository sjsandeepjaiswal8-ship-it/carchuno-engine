const common = require('oci-common');
const identity = require('oci-identity');

const provider = new common.ConfigFileAuthenticationDetailsProvider('C:\\Users\\HP\\.oci\\config', 'DEFAULT');
const identityClient = new identity.IdentityClient({ authenticationDetailsProvider: provider });
const tenancyId = 'ocid1.tenancy.oc1..aaaaaaaatpyuzzldor3qnuzdswm4bdwxrkmzwl2rfuq3dszvuyw666fz2exq';

async function main() {
  try {
    const res = await identityClient.listRegionSubscriptions({ tenancyId });
    console.log('Subscribed Regions:');
    res.items.forEach(r => {
      console.log(`- ${r.regionName} (Key: ${r.regionKey}, isHome: ${r.isHomeRegion}, Status: ${r.status})`);
    });
  } catch (err) {
    console.error('Error fetching regions:', err);
  }
}

main();
