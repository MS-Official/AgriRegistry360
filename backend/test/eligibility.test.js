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

async function createRegistry({ verified = false, nationalId = '901234567V' } = {}) {
  const farmerResponse = await request(app)
    .post('/api/farmers/register')
    .send({ ...farmerPayload, nationalId })
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

  return { farmer, farm, crop };
}

function eligibilityPayload({ farmer, farm, crop }) {
  return {
    farmerId: farmer._id,
    farmId: farm._id,
    cropId: crop._id,
    programCode: 'FERTILIZER_SUBSIDY_2026',
    checkedBy: 'Field Officer',
  };
}

describe('Eligibility Check API', () => {
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

  it('returns eligible for verified farmer, farm, and crop', async () => {
    const registry = await createRegistry({ verified: true });

    const response = await request(app)
      .post('/api/eligibility/check')
      .send(eligibilityPayload(registry))
      .expect(201);

    assert.equal(response.body.data.eligibilityCode, 'ELIG-0001');
    assert.equal(response.body.data.eligibilityStatus, 'ELIGIBLE');
    assert.equal(response.body.data.recommendedEntitlement, '50KG_FERTILIZER');
    assert.equal(response.body.data.failureReasons.length, 0);
  });

  it('returns not eligible for pending verification records', async () => {
    const registry = await createRegistry();

    const response = await request(app)
      .post('/api/eligibility/check')
      .send(eligibilityPayload(registry))
      .expect(201);

    assert.equal(response.body.data.eligibilityStatus, 'NOT_ELIGIBLE');
    assert.deepEqual(response.body.data.failureReasons, [
      'Farmer is not verified',
      'Farm is not verified',
      'Crop is not verified',
    ]);
    assert.equal(response.body.data.recommendedEntitlement, 'NONE');
  });

  it('returns farmer/farm mismatch error', async () => {
    const firstRegistry = await createRegistry({ nationalId: '901234567V' });
    const secondRegistry = await createRegistry({ nationalId: '801234567V' });

    const response = await request(app)
      .post('/api/eligibility/check')
      .send({
        ...eligibilityPayload(firstRegistry),
        farmId: secondRegistry.farm._id,
      })
      .expect(400);

    assert.equal(response.body.message, 'Farmer/Farm mismatch');
  });

  it('returns farm/crop mismatch error', async () => {
    const firstRegistry = await createRegistry({ nationalId: '901234567V' });
    const secondRegistry = await createRegistry({ nationalId: '801234567V' });

    const response = await request(app)
      .post('/api/eligibility/check')
      .send({
        ...eligibilityPayload(firstRegistry),
        cropId: secondRegistry.crop._id,
      })
      .expect(400);

    assert.equal(response.body.message, 'Farm/Crop mismatch');
  });

  it('returns unsupported program code error', async () => {
    const registry = await createRegistry();

    const response = await request(app)
      .post('/api/eligibility/check')
      .send({
        ...eligibilityPayload(registry),
        programCode: 'SEED_DISTRIBUTION_2026',
      })
      .expect(400);

    assert.equal(response.body.message, 'Unsupported program code');
  });

  it('searches eligibility checks and returns nested lookups', async () => {
    const registry = await createRegistry({ verified: true });
    await request(app).post('/api/eligibility/check').send(eligibilityPayload(registry)).expect(201);

    const searchResponse = await request(app).get('/api/eligibility?search=Mohamed').expect(200);
    assert.equal(searchResponse.body.data.length, 1);

    const farmerResponse = await request(app)
      .get(`/api/farmers/${registry.farmer._id}/eligibility`)
      .expect(200);
    assert.equal(farmerResponse.body.data.length, 1);

    const farmResponse = await request(app)
      .get(`/api/farms/${registry.farm._id}/eligibility`)
      .expect(200);
    assert.equal(farmResponse.body.data.length, 1);

    const cropResponse = await request(app)
      .get(`/api/crops/${registry.crop._id}/eligibility`)
      .expect(200);
    assert.equal(cropResponse.body.data.length, 1);
  });
});

