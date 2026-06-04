import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 5001,
  mongodbUri:
    process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/agriregistry360',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:4200',
  seedDemoFarmer: process.env.SEED_DEMO_FARMER !== 'false',
  seedDemoFarm: process.env.SEED_DEMO_FARM !== 'false',
  seedDemoCrop: process.env.SEED_DEMO_CROP !== 'false',

  // Odoo Config
  odooEnabled: process.env.ODOO_ENABLED === 'true',
  odooUrl: process.env.ODOO_URL || 'http://localhost:8069',
  odooDb: process.env.ODOO_DB || 'agriregistry360',
  odooUsername: process.env.ODOO_USERNAME || 'admin',
  odooPassword: process.env.ODOO_PASSWORD || 'admin',

  // OpenG2P Config
  openG2PEnabled: process.env.OPENG2P_ENABLED === 'true',
  openG2PUrl: process.env.OPENG2P_URL || 'http://localhost:8069',
  openG2PDb: process.env.OPENG2P_DB || 'openg2p',
  openG2PUsername: process.env.OPENG2P_USERNAME || 'admin',
  openG2PPassword: process.env.OPENG2P_PASSWORD || 'admin',
  openG2PRegistrantModel: process.env.OPENG2P_REGISTRANT_MODEL || 'res.partner',
  openG2PProgramModel: process.env.OPENG2P_PROGRAM_MODEL || 'g2p.program',
  openG2PEnrollmentModel: process.env.OPENG2P_ENROLLMENT_MODEL || 'g2p.program.membership',
  openG2PFarmModel: process.env.OPENG2P_FARM_MODEL || 'g2p.agriculture.farm',
  openG2PCropModel: process.env.OPENG2P_CROP_MODEL || 'g2p.agriculture.crop',
  openG2PEligibilityModel: process.env.OPENG2P_ELIGIBILITY_MODEL || 'g2p.eligibility.check',
  openG2PFallbackModel: process.env.OPENG2P_FALLBACK_MODEL || 'res.partner',

  // WSO2 Config
  wso2Enabled: process.env.WSO2_ENABLED === 'true',
  wso2ApimBaseUrl: process.env.WSO2_APIM_BASE_URL || 'https://localhost:9443',
  wso2GatewayBaseUrl: process.env.WSO2_GATEWAY_BASE_URL || 'https://localhost:8243',
  wso2Username: process.env.WSO2_USERNAME || 'admin',
  wso2Password: process.env.WSO2_PASSWORD || 'admin',
  wso2RegistryApiContext: process.env.WSO2_REGISTRY_API_CONTEXT || '/agriregistry360/registry',
  wso2ProgramApiContext: process.env.WSO2_PROGRAM_API_CONTEXT || '/agriregistry360/program',
  wso2InventoryApiContext: process.env.WSO2_INVENTORY_API_CONTEXT || '/agriregistry360/inventory',
};
