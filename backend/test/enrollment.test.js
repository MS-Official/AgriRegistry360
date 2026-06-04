import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createApp } from '../src/app.js';

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
  gpsLatitude: 8.3432,
  gpsLongitude: 80.3736,
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

async function createEligibility({ verified = true } = {}) {
  const farmerResponse = await request(app)
    .post('/api/farmers/register')
    .send(farmerPayload)
    .expect(201);
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

  if (verified) {
    await request(app)
      .patch(`/api/farmers/${farmer._id}/verify`)
      .send({ verificationStatus: 'VERIFIED' })
      .expect(200);
    await request(app)
      .patch(`/api/farms/${farm._id}/verify`)
      .send({ verificationStatus: 'VERIFIED' })
      .expect(200);
    await request(app)
      .patch(`/api/crops/${crop._id}/verify`)
      .send({ verificationStatus: 'VERIFIED' })
      .expect(200);
  }

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

  return {
    farmer,
    farm,
    crop,
    eligibility: eligibilityResponse.body.data,
  };
}

function enrollmentPayload(eligibility) {
  return {
    eligibilityId: eligibility._id,
    enrolledBy: 'Field Officer',
    notes: 'Demo enrollment for fertilizer subsidy',
  };
}

describe('Program Enrollment API', () => {
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

  it('creates enrollment from an eligible eligibility check', async () => {
    const { eligibility } = await createEligibility({ verified: true });

    const response = await request(app)
      .post('/api/enrollments')
      .send(enrollmentPayload(eligibility))
      .expect(201);

    assert.equal(response.body.data.enrollmentCode, 'ENROLL-0001');
    assert.equal(response.body.data.eligibilityCode, eligibility.eligibilityCode);
    assert.equal(response.body.data.enrollmentStatus, 'ENROLLED');
    assert.equal(response.body.data.approvalStatus, 'PENDING_APPROVAL');
    assert.equal(response.body.data.entitlement, '50KG_FERTILIZER');
  });

  it('rejects enrollment when eligibility is not eligible', async () => {
    const { eligibility } = await createEligibility({ verified: false });

    const response = await request(app)
      .post('/api/enrollments')
      .send(enrollmentPayload(eligibility))
      .expect(400);

    assert.equal(response.body.message, 'Only eligible farmers can be enrolled into this program.');
  });

  it('prevents duplicate active enrollment', async () => {
    const { eligibility } = await createEligibility({ verified: true });
    await request(app).post('/api/enrollments').send(enrollmentPayload(eligibility)).expect(201);

    const response = await request(app)
      .post('/api/enrollments')
      .send(enrollmentPayload(eligibility))
      .expect(409);

    assert.equal(response.body.message, 'Duplicate active enrollment exists');
  });

  it('searches enrollments and returns nested lookups', async () => {
    const { farmer, farm, crop, eligibility } = await createEligibility({ verified: true });
    await request(app).post('/api/enrollments').send(enrollmentPayload(eligibility)).expect(201);

    const searchResponse = await request(app).get('/api/enrollments?search=Mohamed').expect(200);
    assert.equal(searchResponse.body.data.length, 1);

    const farmerResponse = await request(app)
      .get(`/api/farmers/${farmer._id}/enrollments`)
      .expect(200);
    assert.equal(farmerResponse.body.data.length, 1);

    const farmResponse = await request(app).get(`/api/farms/${farm._id}/enrollments`).expect(200);
    assert.equal(farmResponse.body.data.length, 1);

    const cropResponse = await request(app).get(`/api/crops/${crop._id}/enrollments`).expect(200);
    assert.equal(cropResponse.body.data.length, 1);

    const eligibilityResponse = await request(app)
      .get(`/api/eligibility/${eligibility._id}/enrollments`)
      .expect(200);
    assert.equal(eligibilityResponse.body.data.length, 1);
  });

  it('updates approval status', async () => {
    const { eligibility } = await createEligibility({ verified: true });
    const enrollResponse = await request(app)
      .post('/api/enrollments')
      .send(enrollmentPayload(eligibility))
      .expect(201);

    const response = await request(app)
      .patch(`/api/enrollments/${enrollResponse.body.data._id}/approval`)
      .send({ approvalStatus: 'APPROVED' })
      .expect(200);

    assert.equal(response.body.data.approvalStatus, 'APPROVED');
  });

  it('cancels enrollment', async () => {
    const { eligibility } = await createEligibility({ verified: true });
    const enrollResponse = await request(app)
      .post('/api/enrollments')
      .send(enrollmentPayload(eligibility))
      .expect(201);

    const response = await request(app)
      .patch(`/api/enrollments/${enrollResponse.body.data._id}/cancel`)
      .send({ notes: 'Cancelled due to incorrect enrollment' })
      .expect(200);

    assert.equal(response.body.data.enrollmentStatus, 'CANCELLED');
    assert.match(response.body.data.notes, /Cancelled due to incorrect enrollment/);
  });
});

