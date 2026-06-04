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

async function createFarm() {
  const farmerResponse = await request(app)
    .post('/api/farmers/register')
    .send(farmerPayload)
    .expect(201);

  const farmResponse = await request(app)
    .post('/api/farms/register')
    .send({ ...farmPayload, farmerId: farmerResponse.body.data._id })
    .expect(201);

  return {
    farmer: farmerResponse.body.data,
    farm: farmResponse.body.data,
  };
}

describe('Crop Registry API', () => {
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

  it('registers a crop under an existing farm', async () => {
    const { farm } = await createFarm();

    const response = await request(app)
      .post('/api/crops/register')
      .send({ ...cropPayload, farmId: farm._id })
      .expect(201);

    assert.equal(response.body.success, true);
    assert.equal(response.body.data.cropCode, 'CROP-0001');
    assert.equal(response.body.data.farmCode, 'FARM-LAND-0001');
    assert.equal(response.body.data.farmerCode, 'FARMER-0001');
    assert.equal(response.body.data.farmerName, 'Mohamed Ameen');
    assert.equal(response.body.data.verificationStatus, 'PENDING_VERIFICATION');
  });

  it('returns farm not found for an unknown farm ID', async () => {
    const unknownFarmId = new mongoose.Types.ObjectId().toString();

    const response = await request(app)
      .post('/api/crops/register')
      .send({ ...cropPayload, farmId: unknownFarmId })
      .expect(404);

    assert.equal(response.body.message, 'Farm not found');
  });

  it('searches crops and returns crops by farm and farmer', async () => {
    const { farmer, farm } = await createFarm();
    await request(app)
      .post('/api/crops/register')
      .send({ ...cropPayload, farmId: farm._id })
      .expect(201);

    const searchResponse = await request(app).get('/api/crops?search=paddy').expect(200);
    assert.equal(searchResponse.body.data.length, 1);

    const farmCropsResponse = await request(app).get(`/api/farms/${farm._id}/crops`).expect(200);
    assert.equal(farmCropsResponse.body.data.length, 1);
    assert.equal(farmCropsResponse.body.data[0].cropCode, 'CROP-0001');

    const farmerCropsResponse = await request(app)
      .get(`/api/farmers/${farmer._id}/crops`)
      .expect(200);
    assert.equal(farmerCropsResponse.body.data.length, 1);
  });

  it('updates crop verification status', async () => {
    const { farm } = await createFarm();
    const registerResponse = await request(app)
      .post('/api/crops/register')
      .send({ ...cropPayload, farmId: farm._id })
      .expect(201);

    const response = await request(app)
      .patch(`/api/crops/${registerResponse.body.data._id}/verify`)
      .send({ verificationStatus: 'VERIFIED' })
      .expect(200);

    assert.equal(response.body.data.verificationStatus, 'VERIFIED');
  });

  it('rejects invalid planting and harvest dates', async () => {
    const { farm } = await createFarm();

    const response = await request(app)
      .post('/api/crops/register')
      .send({
        ...cropPayload,
        farmId: farm._id,
        plantingDate: '2026-09-20',
        expectedHarvestDate: '2026-06-01',
      })
      .expect(400);

    assert.equal(response.body.message, 'Expected harvest date must be after planting date');
  });
});

