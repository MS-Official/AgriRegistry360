import { createApp } from './app.js';
import { connectDb } from './config/db.js';
import { config } from './config/env.js';
import { seedDemoCrop } from './seed/demoCrop.seed.js';
import { seedDemoFarm } from './seed/demoFarm.seed.js';
import { seedDemoFarmer } from './seed/demoFarmer.seed.js';
import { seedDemoInventory } from './seed/demoInventory.seed.js';

async function startServer() {
  try {
    await connectDb(config.mongodbUri);
  } catch (error) {
    console.error('\n================================================================');
    console.error('MongoDB is not running. Start MongoDB using: brew services start mongodb/brew/mongodb-community');
    console.error('Error Details:', error.message);
    console.error('================================================================\n');
    process.exit(1);
  }

  if (config.seedDemoFarmer) {
    await seedDemoFarmer();
  }

  if (config.seedDemoFarm) {
    await seedDemoFarm();
  }

  if (config.seedDemoCrop) {
    await seedDemoCrop();
  }

  await seedDemoInventory();

  const app = createApp();
  app.listen(config.port, () => {
    console.log(`\n================================================================`);
    console.log(`AgriRegistry360 backend running on port ${config.port}`);
    console.log(`Odoo Integration: ${config.odooEnabled ? 'ENABLED' : 'DISABLED'}`);
    console.log(`OpenG2P Integration: ${config.openG2PEnabled ? 'ENABLED' : 'DISABLED'}`);
    console.log(`WSO2 Integration: ${config.wso2Enabled ? 'ENABLED' : 'DISABLED'}`);
    console.log(`================================================================\n`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start backend', error);
  process.exit(1);
});
