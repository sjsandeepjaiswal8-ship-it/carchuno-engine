const common = require('oci-common');
const rm = require('oci-resourcemanager');

const CONFIG_FILE = 'C:\\Users\\HP\\.oci\\config';
const STACK_ID = 'ocid1.ormstack.oc1.ap-hyderabad-1.amaaaaaaelwqbaaakhirbbmkw7ecybr56karmtkrssc5pyovcmfw67godpbq';

async function testConnection() {
  console.log('--- Initializing Oracle Cloud SDK Authentication ---');
  const provider = new common.ConfigFileAuthenticationDetailsProvider(CONFIG_FILE, 'DEFAULT');
  const client = new rm.ResourceManagerClient({ authenticationDetailsProvider: provider });

  console.log('Fetching Stack details for Stack OCID:', STACK_ID);
  const stackResponse = await client.getStack({ stackId: STACK_ID });
  console.log('Successfully connected to Oracle Cloud!');
  console.log('Stack Name:', stackResponse.stack.displayName);
  console.log('Lifecycle State:', stackResponse.stack.lifecycleState);
  console.log('Terraform Version:', stackResponse.stack.terraformVersion);
  return { client, stack: stackResponse.stack };
}

testConnection().catch(err => {
  console.error('Connection Failed:', err);
});
