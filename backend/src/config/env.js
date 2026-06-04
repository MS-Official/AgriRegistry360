import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 5001,
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/agriregistry360',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:4200',
  seedDemoFarmer: process.env.SEED_DEMO_FARMER !== 'false',
};

