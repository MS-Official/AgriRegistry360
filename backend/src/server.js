import { createApp } from './app.js';
import { connectDb } from './config/db.js';
import { config } from './config/env.js';
import { seedDemoCrop } from './seed/demoCrop.seed.js';
import { seedDemoFarm } from './seed/demoFarm.seed.js';
import { seedDemoFarmer } from './seed/demoFarmer.seed.js';
import { seedDemoInventory } from './seed/demoInventory.seed.js';

async function startServer() {
  await connectDb(config.mongodbUri);

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
    console.log(`AgriRegistry360 backend listening on port ${config.port}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start backend', error);
  process.exit(1);
});
