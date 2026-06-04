import './setupEnv.js';
import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { Farmer } from '../src/models/farmer.model.js';
import { Farm } from '../src/models/farm.model.js';
import { Crop } from '../src/models/crop.model.js';
import { Eligibility } from '../src/models/eligibility.model.js';
import { Enrollment } from '../src/models/enrollment.model.js';
import { InventoryItem } from '../src/models/inventoryItem.model.js';
import { InventoryReservation } from '../src/models/inventoryReservation.model.js';
import { PlatformSync } from '../src/models/platformSync.model.js';
import { config } from '../src/config/env.js';
import { odooClient } from '../src/integrations/odoo/odooClient.js';
import { openG2PClient } from '../src/integrations/openg2p/openG2PClient.js';

let mongoServer;
let app;

// Seed payload
const farmerPayload = {
  farmerCode: 'FARMER-0001',
  fullName: 'Mohamed Ameen',
  nationalId: '901234567V',
  mobileNumber: '0771234567',
  district: 'Anuradhapura',
  gnDivision: 'Nochchiyagama',
  farmerType: 'SMALLHOLDER',
  verificationStatus: 'VERIFIED',
  registeredBy: 'Field Officer',
};

const farmPayload = {
  farmCode: 'FARM-LAND-0001',
  farmName: 'Ameen Paddy Field',
  farmerCode: 'FARMER-0001',
  farmerName: 'Mohamed Ameen',
  landSize: 2.5,
  landSizeUnit: 'ACRES',
  ownershipType: 'OWNED',
  district: 'Anuradhapura',
  gnDivision: 'Nochchiyagama',
  soilType: 'LOAM',
  irrigationType: 'CANAL',
  verificationStatus: 'VERIFIED',
  registeredBy: 'Field Officer',
};

const cropPayload = {
  cropCode: 'CROP-0001',
  farmCode: 'FARM-LAND-0001',
  farmerCode: 'FARMER-0001',
  farmerName: 'Mohamed Ameen',
  cropType: 'PADDY',
  cropVariety: 'BG358',
  season: 'MAHA',
  seasonYear: 2026,
  cultivationArea: 2,
  cultivationAreaUnit: 'ACRES',
  plantingDate: new Date('2026-06-01'),
  expectedHarvestDate: new Date('2026-09-20'),
  expectedYield: 4500,
  expectedYieldUnit: 'KG',
  cropStatus: 'GROWING',
  verificationStatus: 'VERIFIED',
  registeredBy: 'Field Officer',
};

const eligibilityPayload = {
  eligibilityCode: 'ELIG-0001',
  farmerCode: 'FARMER-0001',
  farmerName: 'Mohamed Ameen',
  farmCode: 'FARM-LAND-0001',
  cropCode: 'CROP-0001',
  programCode: 'FERTILIZER_SUBSIDY_2026',
  programName: 'Fertilizer Subsidy Program 2026',
  eligibilityStatus: 'ELIGIBLE',
  recommendedEntitlement: '50KG_FERTILIZER',
  checkedBy: 'Field Officer',
};

const enrollmentPayload = {
  enrollmentCode: 'ENROLL-0001',
  eligibilityCode: 'ELIG-0001',
  farmerCode: 'FARMER-0001',
  farmerName: 'Mohamed Ameen',
  farmCode: 'FARM-LAND-0001',
  cropCode: 'CROP-0001',
  programCode: 'FERTILIZER_SUBSIDY_2026',
  programName: 'Fertilizer Subsidy Program 2026',
  entitlement: '50KG_FERTILIZER',
  enrollmentStatus: 'ENROLLED',
  approvalStatus: 'APPROVED',
  enrolledBy: 'Field Officer',
  notes: 'Demo enrollment',
};

const reservationPayload = {
  reservationCode: 'RESERVE-0001',
  enrollmentCode: 'ENROLL-0001',
  farmerCode: 'FARMER-0001',
  farmerName: 'Mohamed Ameen',
  farmCode: 'FARM-LAND-0001',
  cropCode: 'CROP-0001',
  programCode: 'FERTILIZER_SUBSIDY_2026',
  programName: 'Fertilizer Subsidy Program 2026',
  entitlement: '50KG_FERTILIZER',
  itemCode: 'FERTILIZER_50KG',
  itemName: 'NPK Fertilizer 50KG Bag',
  reservedQuantity: 1,
  unit: 'BAGS',
  warehouseName: 'Anuradhapura Storage',
  reservationStatus: 'RESERVED',
  reservedBy: 'Field Officer',
};

const inventoryItemPayload = {
  itemCode: 'FERTILIZER_50KG',
  itemName: 'NPK Fertilizer 50KG Bag',
  category: 'FERTILIZER',
  availableQuantity: 100,
  reservedQuantity: 1,
  distributedQuantity: 0,
  unit: 'BAGS',
  warehouseName: 'Anuradhapura Storage',
  status: 'ACTIVE',
};

describe('Platform Sync API', () => {
  before(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    app = createApp();
  });

  beforeEach(async () => {
    await mongoose.connection.db.dropDatabase();
  });

  after(async () => {
    await mongoose.disconnect();
    mongoServer.stop();
  });

  async function seedDatabase() {
    const farmerDoc = await Farmer.create(farmerPayload);
    
    const farmDoc = await Farm.create({
      ...farmPayload,
      farmer: farmerDoc._id,
    });

    const cropDoc = await Crop.create({
      ...cropPayload,
      farm: farmDoc._id,
      farmer: farmerDoc._id,
    });

    const eligibilityDoc = await Eligibility.create({
      ...eligibilityPayload,
      farmer: farmerDoc._id,
      farm: farmDoc._id,
      crop: cropDoc._id,
    });

    const enrollmentDoc = await Enrollment.create({
      ...enrollmentPayload,
      farmer: farmerDoc._id,
      farm: farmDoc._id,
      crop: cropDoc._id,
      eligibility: eligibilityDoc._id,
    });

    await InventoryItem.create(inventoryItemPayload);

    const reservationDoc = await InventoryReservation.create({
      ...reservationPayload,
      farmer: farmerDoc._id,
      farm: farmDoc._id,
      crop: cropDoc._id,
      enrollment: enrollmentDoc._id,
    });

    return { farmerDoc, farmDoc, cropDoc, eligibilityDoc, enrollmentDoc, reservationDoc };
  }

  it('retrieves empty sync status initially', async () => {
    const response = await request(app).get('/api/platform-sync/status').expect(200);
    assert.equal(response.body.success, true);
    assert.deepEqual(response.body.data.odoo, { total: 0, synced: 0, failed: 0, pending: 0, demo: 0 });
    assert.deepEqual(response.body.data.openg2p, { total: 0, synced: 0, failed: 0, pending: 0, demo: 0 });
  });

  it('runs full demo sync and saves logs with DEMO_MODE by default', async () => {
    const { farmerDoc } = await seedDatabase();

    const syncResponse = await request(app).post('/api/platform-sync/full-demo').expect(200);
    assert.equal(syncResponse.body.success, true);
    assert.equal(syncResponse.body.data.mode, 'DEMO_MODE');
    assert.ok(syncResponse.body.data.steps.length > 0);

    const farmerSyncStep = syncResponse.body.data.steps.find((s) => s.step === 'Farmer → Odoo Contact/Partner');
    assert.ok(farmerSyncStep);
    assert.equal(farmerSyncStep.syncStatus, 'DEMO_MODE');
    const inventoryItemStep = syncResponse.body.data.steps.find((s) => s.step === 'Inventory Item → Odoo Inventory Item');
    assert.ok(inventoryItemStep);
    assert.equal(inventoryItemStep.entityCode, 'FERTILIZER_50KG');
    const reservationStep = syncResponse.body.data.steps.find((s) => s.step === 'Reservation → Odoo Inventory Fulfilment');
    assert.ok(reservationStep);
    assert.equal(reservationStep.targetModel, 'agriregistry.inventory.reservation');

    // Retrieve status again
    const statusResponse = await request(app).get('/api/platform-sync/status').expect(200);
    assert.equal(statusResponse.body.data.odoo.total, 3); // Farmer + Inventory Item + Reservation
    assert.equal(statusResponse.body.data.odoo.demo, 3);

    // Retrieve logs
    const logsResponse = await request(app).get('/api/platform-sync/logs').expect(200);
    assert.equal(logsResponse.body.success, true);
    assert.ok(logsResponse.body.data.length >= 2);
  });

  it('syncs farmer to Odoo directly in demo mode', async () => {
    const { farmerDoc } = await seedDatabase();

    const response = await request(app)
      .post(`/api/platform-sync/farmers/${farmerDoc._id}/odoo`)
      .expect(200);

    assert.equal(response.body.success, true);
    assert.equal(response.body.data.syncStatus, 'DEMO_MODE');
    assert.equal(response.body.data.entityCode, 'FARMER-0001');
  });

  it('syncs reservation to Odoo custom reservation model when available', async () => {
    const { reservationDoc } = await seedDatabase();
    const originalEnabled = config.odooEnabled;
    const originalCheckModelExists = odooClient.checkModelExists;
    const originalUpsertByField = odooClient.upsertByField;
    const calls = [];

    config.odooEnabled = true;
    odooClient.checkModelExists = async (model) => model === 'agriregistry.inventory.reservation';
    odooClient.upsertByField = async (model, lookupField, lookupValue, values) => {
      calls.push({ model, lookupField, lookupValue, values });
      return { action: 'created', id: 901, model };
    };

    try {
      const response = await request(app)
        .post(`/api/platform-sync/reservations/${reservationDoc._id}/odoo`)
        .expect(200);

      assert.equal(response.body.success, true);
      assert.equal(response.body.data.syncStatus, 'SYNCED');
      assert.equal(response.body.data.targetModel, 'agriregistry.inventory.reservation');
      assert.equal(response.body.data.requestPayload.reservation_code, 'RESERVE-0001');
      assert.equal(response.body.data.requestPayload.farmer_name, 'Mohamed Ameen');
      assert.equal(response.body.data.requestPayload.farm_code, 'FARM-LAND-0001');
      assert.equal(response.body.data.requestPayload.crop_code, 'CROP-0001');
      assert.equal(response.body.data.requestPayload.quantity_unit, 'BAGS');
      assert.equal(calls[0].lookupField, 'reservation_code');
      assert.equal(calls[0].lookupValue, 'RESERVE-0001');
    } finally {
      config.odooEnabled = originalEnabled;
      odooClient.checkModelExists = originalCheckModelExists;
      odooClient.upsertByField = originalUpsertByField;
    }
  });

  it('falls back reservation sync only when Odoo custom reservation model is unavailable', async () => {
    const { reservationDoc } = await seedDatabase();
    const originalEnabled = config.odooEnabled;
    const originalCheckModelExists = odooClient.checkModelExists;
    const originalUpsertByField = odooClient.upsertByField;

    config.odooEnabled = true;
    odooClient.checkModelExists = async () => false;
    odooClient.upsertByField = async (model, lookupField, lookupValue, values) => ({
      action: 'updated',
      id: 902,
      model,
      lookupField,
      lookupValue,
      values,
    });

    try {
      const response = await request(app)
        .post(`/api/platform-sync/reservations/${reservationDoc._id}/odoo`)
        .expect(200);

      assert.equal(response.body.success, true);
      assert.equal(response.body.data.syncStatus, 'FALLBACK_SYNCED');
      assert.equal(response.body.data.targetModel, 'res.partner');
      assert.equal(response.body.data.requestPayload.ref, 'RESERVE-0001');
      assert.match(response.body.data.errorMessage, /custom model agriregistry.inventory.reservation was not detected/);
    } finally {
      config.odooEnabled = originalEnabled;
      odooClient.checkModelExists = originalCheckModelExists;
      odooClient.upsertByField = originalUpsertByField;
    }
  });

  it('uses reservation upsert logs and does not duplicate sync log records', async () => {
    const { reservationDoc } = await seedDatabase();
    const originalEnabled = config.odooEnabled;
    const originalCheckModelExists = odooClient.checkModelExists;
    const originalUpsertByField = odooClient.upsertByField;
    let callCount = 0;

    config.odooEnabled = true;
    odooClient.checkModelExists = async (model) => model === 'agriregistry.inventory.reservation';
    odooClient.upsertByField = async (model) => {
      callCount += 1;
      return { action: callCount === 1 ? 'created' : 'updated', id: 903, model };
    };

    try {
      await request(app).post(`/api/platform-sync/reservations/${reservationDoc._id}/odoo`).expect(200);
      await request(app).post(`/api/platform-sync/reservations/${reservationDoc._id}/odoo`).expect(200);

      assert.equal(callCount, 2);
      assert.equal(await PlatformSync.countDocuments({ entityType: 'INVENTORY_RESERVATION', platform: 'ODOO' }), 1);
      const log = await PlatformSync.findOne({ entityType: 'INVENTORY_RESERVATION', platform: 'ODOO' });
      assert.equal(log.responsePayload.action, 'updated');
    } finally {
      config.odooEnabled = originalEnabled;
      odooClient.checkModelExists = originalCheckModelExists;
      odooClient.upsertByField = originalUpsertByField;
    }
  });

  it('syncs inventory items to Odoo custom inventory item model', async () => {
    await seedDatabase();
    const originalEnabled = config.odooEnabled;
    const originalCheckModelExists = odooClient.checkModelExists;
    const originalUpsertByField = odooClient.upsertByField;

    config.odooEnabled = true;
    odooClient.checkModelExists = async (model) => model === 'agriregistry.inventory.item';
    odooClient.upsertByField = async (model, lookupField, lookupValue, values) => ({
      action: 'created',
      id: 904,
      model,
      lookupField,
      lookupValue,
      values,
    });

    try {
      const response = await request(app)
        .post('/api/platform-sync/inventory-items/odoo')
        .expect(200);

      assert.equal(response.body.success, true);
      assert.equal(response.body.data.total, 1);
      assert.equal(response.body.data.synced, 1);
      assert.equal(response.body.data.logs[0].targetModel, 'agriregistry.inventory.item');
      assert.equal(response.body.data.logs[0].requestPayload.item_code, 'FERTILIZER_50KG');
      assert.equal(response.body.data.logs[0].requestPayload.quantity_unit, 'BAGS');
    } finally {
      config.odooEnabled = originalEnabled;
      odooClient.checkModelExists = originalCheckModelExists;
      odooClient.upsertByField = originalUpsertByField;
    }
  });

  it('returns OpenG2P configured model discovery when integration is disabled', async () => {
    const response = await request(app).get('/api/platform-sync/openg2p/models').expect(200);

    assert.equal(response.body.success, true);
    assert.equal(response.body.platform, 'OPENG2P');
    assert.equal(response.body.data.enabled, false);
    assert.equal(response.body.data.fallbackModel, 'res.partner');
    assert.ok(response.body.data.models.some((model) => model.modelName === 'agriregistry.farm'));
    assert.ok(response.body.data.models.some((model) => model.modelName === 'agriregistry.eligibility'));
  });

  it('syncs farm to OpenG2P visible fallback when PBMS agriculture model is unavailable', async () => {
    const { farmDoc } = await seedDatabase();
    const originalEnabled = config.openG2PEnabled;
    const originalCheckModelExists = openG2PClient.checkModelExists;
    const originalUpsert = openG2PClient.upsertVisibleFallbackRecord;

    config.openG2PEnabled = true;
    openG2PClient.checkModelExists = async (model) => model === 'res.partner';
    openG2PClient.upsertVisibleFallbackRecord = async (values, fallbackModel) => ({
      action: 'created',
      id: 42,
      model: fallbackModel,
      values,
      message: 'Created new visible OpenG2P fallback record.',
    });

    try {
      const response = await request(app)
        .post(`/api/platform-sync/farms/${farmDoc._id}/openg2p`)
        .expect(200);

      assert.equal(response.body.success, true);
      assert.equal(response.body.data.syncStatus, 'FALLBACK_SYNCED');
      assert.equal(response.body.data.targetModel, 'res.partner');
      assert.equal(response.body.data.responsePayload.action, 'created');
      assert.equal(response.body.data.requestPayload.ref, 'FARM-LAND-0001');
      assert.match(response.body.data.requestPayload.name, /Mohamed Ameen Farm FARM-LAND-0001/);
    } finally {
      config.openG2PEnabled = originalEnabled;
      openG2PClient.checkModelExists = originalCheckModelExists;
      openG2PClient.upsertVisibleFallbackRecord = originalUpsert;
    }
  });

  it('syncs eligibility to OpenG2P visible fallback when PBMS eligibility model is unavailable', async () => {
    const { eligibilityDoc } = await seedDatabase();
    const originalEnabled = config.openG2PEnabled;
    const originalCheckModelExists = openG2PClient.checkModelExists;
    const originalUpsert = openG2PClient.upsertVisibleFallbackRecord;

    config.openG2PEnabled = true;
    openG2PClient.checkModelExists = async (model) => model === 'res.partner';
    openG2PClient.upsertVisibleFallbackRecord = async (values, fallbackModel) => ({
      action: 'updated',
      id: 77,
      model: fallbackModel,
      values,
      message: 'Updated existing visible OpenG2P fallback record.',
    });

    try {
      const response = await request(app)
        .post(`/api/platform-sync/eligibility/${eligibilityDoc._id}/openg2p`)
        .expect(200);

      assert.equal(response.body.success, true);
      assert.equal(response.body.data.syncStatus, 'FALLBACK_SYNCED');
      assert.equal(response.body.data.targetModel, 'res.partner');
      assert.equal(response.body.data.responsePayload.action, 'updated');
      assert.equal(response.body.data.requestPayload.ref, 'ELIG-0001');
      assert.match(response.body.data.requestPayload.name, /Fertilizer Subsidy Program 2026/);
    } finally {
      config.openG2PEnabled = originalEnabled;
      openG2PClient.checkModelExists = originalCheckModelExists;
      openG2PClient.upsertVisibleFallbackRecord = originalUpsert;
    }
  });

  it('retrieves WSO2 gateway status', async () => {
    const response = await request(app).get('/api/platform-sync/wso2/gateway-status').expect(200);
    assert.equal(response.body.success, true);
    assert.equal(response.body.data.wso2Enabled, false);
    assert.equal(response.body.data.publishingStatus, 'READY_FOR_WSO2_PUBLISHING');
  });

  it('marks WSO2 API as published', async () => {
    const payload = {
      apiName: 'AgriRegistry360 Registry API',
      context: '/agriregistry360/registry',
      gatewayUrl: 'https://localhost:8243/agriregistry360/registry/1.0.0',
    };

    const response = await request(app)
      .post('/api/platform-sync/wso2/mark-published')
      .send(payload)
      .expect(200);

    assert.equal(response.body.success, true);
    assert.equal(response.body.data.syncStatus, 'SYNCED');
    assert.equal(response.body.data.entityCode, 'AgriRegistry360 Registry API');
  });

  it('returns DISABLED connection checks when platform integrations are disabled', async () => {
    const odooRes = await request(app).get('/api/platform-sync/odoo/connection-check').expect(200);
    assert.equal(odooRes.body.success, true);
    assert.equal(odooRes.body.enabled, false);
    assert.equal(odooRes.body.status, 'DISABLED');

    const openg2pRes = await request(app).get('/api/platform-sync/openg2p/connection-check').expect(200);
    assert.equal(openg2pRes.body.success, true);
    assert.equal(openg2pRes.body.enabled, false);
    assert.equal(openg2pRes.body.status, 'DISABLED');

    const wso2Res = await request(app).get('/api/platform-sync/wso2/connection-check').expect(200);
    assert.equal(wso2Res.body.success, true);
    assert.equal(wso2Res.body.enabled, false);
    assert.equal(wso2Res.body.status, 'DISABLED');
  });

  it('returns successful status on the demo readiness endpoint', async () => {
    const response = await request(app).get('/api/platform-sync/demo-readiness').expect(200);
    assert.equal(response.body.success, true);
    assert.equal(response.body.data.backend, 'READY');
    assert.equal(response.body.data.mongodb, 'READY');
    assert.equal(response.body.data.odoo, 'DEMO_MODE');
    assert.equal(response.body.data.openG2P, 'DEMO_MODE');
    assert.equal(response.body.data.wso2, 'READY_FOR_PUBLISHING');
  });
});
