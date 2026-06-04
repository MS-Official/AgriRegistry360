import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { InventoryItem } from '../src/models/inventoryItem.model.js';
import { seedDemoInventory } from '../src/seed/demoInventory.seed.js';

let mongoServer;
let app;

const farmerPayload = {
  fullName: 'Mohamed Ameen',
  nationalId: '901234567V',
  mobileNumber: '0771234567',
  district: 'Anuradhapura',
  gnDivision: 'Nochchiyagama',
  farmerType: 'SMALLHOLDER',
  registeredBy: 'Field Officer',
};

const farmPayload = {
  landSize: 2.5,
  landSizeUnit: 'ACRES',
  ownershipType: 'OWNED',
  district: 'Anuradhapura',
  gnDivision: 'Nochchiyagama',
  soilType: 'LOAM',
  irrigationType: 'CANAL',
  farmStatus: 'ACTIVE',
  registeredBy: 'Field Officer',
};

const cropPayload = {
  cropType: 'PADDY',
  season: 'MAHA',
  seasonYear: 2026,
  cultivationArea: 2,
  cultivationAreaUnit: 'ACRES',
  plantingDate: '2026-06-01',
  expectedHarvestDate: '2026-09-20',
  expectedYield: 4500,
  expectedYieldUnit: 'KG',
  cropStatus: 'GROWING',
  registeredBy: 'Field Officer',
};

async function createApprovedEnrollment({ approved = true } = {}) {
  await seedDemoInventory();

  const farmerResponse = await request(app).post('/api/farmers/register').send(farmerPayload).expect(201);
  const farmer = farmerResponse.body.data;
  const farmResponse = await request(app)
    .post('/api/farms/register')
    .send({ ...farmPayload, farmerId: farmer._id })
    .expect(201);
  const farm = farmResponse.body.data;
  const cropResponse = await request(app)
    .post('/api/crops/register')
    .send({ ...cropPayload, farmId: farm._id })
    .expect(201);
  const crop = cropResponse.body.data;

  await request(app).patch(`/api/farmers/${farmer._id}/verify`).send({ verificationStatus: 'VERIFIED' });
  await request(app).patch(`/api/farms/${farm._id}/verify`).send({ verificationStatus: 'VERIFIED' });
  await request(app).patch(`/api/crops/${crop._id}/verify`).send({ verificationStatus: 'VERIFIED' });

  const eligibilityResponse = await request(app)
    .post('/api/eligibility/check')
    .send({
      farmerId: farmer._id,
      farmId: farm._id,
      cropId: crop._id,
      programCode: 'FERTILIZER_SUBSIDY_2026',
      checkedBy: 'Field Officer',
    })
    .expect(201);
  const eligibility = eligibilityResponse.body.data;

  const enrollmentResponse = await request(app)
    .post('/api/enrollments')
    .send({
      eligibilityId: eligibility._id,
      enrolledBy: 'Field Officer',
      notes: 'Demo enrollment',
    })
    .expect(201);
  const enrollment = enrollmentResponse.body.data;

  if (approved) {
    await request(app)
      .patch(`/api/enrollments/${enrollment._id}/approval`)
      .send({ approvalStatus: 'APPROVED' })
      .expect(200);
  }

  return { farmer, farm, crop, eligibility, enrollment };
}

function reservePayload(enrollment) {
  return {
    enrollmentId: enrollment._id,
    reservedBy: 'Field Officer',
    notes: 'Reserve fertilizer for approved enrollment',
  };
}

describe('Odoo Inventory Reservation API', () => {
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
    await mongoServer.stop();
  });

  it('seeds demo inventory item', async () => {
    await seedDemoInventory();
    const response = await request(app).get('/api/odoo/inventory/items').expect(200);

    assert.equal(response.body.data.length, 1);
    assert.equal(response.body.data[0].itemCode, 'FERTILIZER_50KG');
  });

  it('creates reservation from approved enrollment', async () => {
    const { enrollment } = await createApprovedEnrollment({ approved: true });

    const response = await request(app)
      .post('/api/odoo/inventory/reserve')
      .send(reservePayload(enrollment))
      .expect(201);

    assert.equal(response.body.data.reservationCode, 'RESERVE-0001');
    assert.equal(response.body.data.reservedQuantity, 1);
    assert.equal(response.body.data.reservationStatus, 'RESERVED');

    const item = await InventoryItem.findOne({ itemCode: 'FERTILIZER_50KG' }).lean();
    assert.equal(item.reservedQuantity, 1);
  });

  it('rejects reservation from non-approved enrollment', async () => {
    const { enrollment } = await createApprovedEnrollment({ approved: false });

    const response = await request(app)
      .post('/api/odoo/inventory/reserve')
      .send(reservePayload(enrollment))
      .expect(400);

    assert.equal(response.body.message, 'Only approved enrollments can reserve inventory.');
  });

  it('prevents duplicate active reservation', async () => {
    const { enrollment } = await createApprovedEnrollment({ approved: true });
    await request(app).post('/api/odoo/inventory/reserve').send(reservePayload(enrollment)).expect(201);

    const response = await request(app)
      .post('/api/odoo/inventory/reserve')
      .send(reservePayload(enrollment))
      .expect(409);

    assert.equal(response.body.message, 'Duplicate active reservation exists');
  });

  it('rejects insufficient stock', async () => {
    const { enrollment } = await createApprovedEnrollment({ approved: true });
    await InventoryItem.updateOne({ itemCode: 'FERTILIZER_50KG' }, { availableQuantity: 0 });

    const response = await request(app)
      .post('/api/odoo/inventory/reserve')
      .send(reservePayload(enrollment))
      .expect(400);

    assert.equal(response.body.message, 'Insufficient inventory stock for this entitlement.');
  });

  it('searches reservations and returns nested lookups', async () => {
    const { farmer, farm, crop, enrollment } = await createApprovedEnrollment({ approved: true });
    await request(app).post('/api/odoo/inventory/reserve').send(reservePayload(enrollment)).expect(201);

    const searchResponse = await request(app)
      .get('/api/odoo/inventory/reservations?search=Mohamed')
      .expect(200);
    assert.equal(searchResponse.body.data.length, 1);

    const enrollmentResponse = await request(app)
      .get(`/api/enrollments/${enrollment._id}/reservations`)
      .expect(200);
    assert.equal(enrollmentResponse.body.data.length, 1);

    const farmerResponse = await request(app).get(`/api/farmers/${farmer._id}/reservations`).expect(200);
    assert.equal(farmerResponse.body.data.length, 1);

    const farmResponse = await request(app).get(`/api/farms/${farm._id}/reservations`).expect(200);
    assert.equal(farmResponse.body.data.length, 1);

    const cropResponse = await request(app).get(`/api/crops/${crop._id}/reservations`).expect(200);
    assert.equal(cropResponse.body.data.length, 1);
  });

  it('issues reservation and updates stock', async () => {
    const { enrollment } = await createApprovedEnrollment({ approved: true });
    const reserveResponse = await request(app)
      .post('/api/odoo/inventory/reserve')
      .send(reservePayload(enrollment))
      .expect(201);

    const response = await request(app)
      .patch(`/api/odoo/inventory/reservations/${reserveResponse.body.data._id}/issue`)
      .send({ notes: 'Fertilizer issued to farmer' })
      .expect(200);

    assert.equal(response.body.data.reservationStatus, 'ISSUED');
    const item = await InventoryItem.findOne({ itemCode: 'FERTILIZER_50KG' }).lean();
    assert.equal(item.reservedQuantity, 0);
    assert.equal(item.distributedQuantity, 1);
  });

  it('cancels reservation and releases stock', async () => {
    const { enrollment } = await createApprovedEnrollment({ approved: true });
    const reserveResponse = await request(app)
      .post('/api/odoo/inventory/reserve')
      .send(reservePayload(enrollment))
      .expect(201);

    const response = await request(app)
      .patch(`/api/odoo/inventory/reservations/${reserveResponse.body.data._id}/cancel`)
      .send({ notes: 'Cancelled due to incorrect reservation' })
      .expect(200);

    assert.equal(response.body.data.reservationStatus, 'CANCELLED');
    const item = await InventoryItem.findOne({ itemCode: 'FERTILIZER_50KG' }).lean();
    assert.equal(item.reservedQuantity, 0);
  });

  it('prevents cancelling issued reservation', async () => {
    const { enrollment } = await createApprovedEnrollment({ approved: true });
    const reserveResponse = await request(app)
      .post('/api/odoo/inventory/reserve')
      .send(reservePayload(enrollment))
      .expect(201);
    await request(app)
      .patch(`/api/odoo/inventory/reservations/${reserveResponse.body.data._id}/issue`)
      .send({})
      .expect(200);

    const response = await request(app)
      .patch(`/api/odoo/inventory/reservations/${reserveResponse.body.data._id}/cancel`)
      .send({})
      .expect(400);

    assert.equal(response.body.message, 'Cannot cancel issued reservation');
  });

  it('prevents issuing cancelled reservation', async () => {
    const { enrollment } = await createApprovedEnrollment({ approved: true });
    const reserveResponse = await request(app)
      .post('/api/odoo/inventory/reserve')
      .send(reservePayload(enrollment))
      .expect(201);
    await request(app)
      .patch(`/api/odoo/inventory/reservations/${reserveResponse.body.data._id}/cancel`)
      .send({})
      .expect(200);

    const response = await request(app)
      .patch(`/api/odoo/inventory/reservations/${reserveResponse.body.data._id}/issue`)
      .send({})
      .expect(400);

    assert.equal(response.body.message, 'Cannot issue cancelled reservation');
  });
});

