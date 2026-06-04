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
import { InventoryReservation } from '../src/models/inventoryReservation.model.js';
import { PlatformSync } from '../src/models/platformSync.model.js';

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

    const farmerSyncStep = syncResponse.body.data.steps.find((s) => s.step === 'Sync farmer to Odoo');
    assert.ok(farmerSyncStep);
    assert.equal(farmerSyncStep.syncStatus, 'DEMO_MODE');

    // Retrieve status again
    const statusResponse = await request(app).get('/api/platform-sync/status').expect(200);
    assert.equal(statusResponse.body.data.odoo.total, 2); // Farmer + Reservation
    assert.equal(statusResponse.body.data.odoo.demo, 2);

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
});
