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

async function createFarmer() {
  const response = await request(app)
    .post('/api/farmers/register')
    .send(farmerPayload)
    .expect(201);

  return response.body.data;
}

describe('Farm / Land Registry API', () => {
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

  it('registers a farm under an existing farmer', async () => {
    const farmer = await createFarmer();

    const response = await request(app)
      .post('/api/farms/register')
      .send({ ...farmPayload, farmerId: farmer._id })
      .expect(201);

    assert.equal(response.body.success, true);
    assert.equal(response.body.data.farmCode, 'FARM-LAND-0001');
    assert.equal(response.body.data.farmerCode, 'FARMER-0001');
    assert.equal(response.body.data.farmerName, 'Mohamed Ameen');
    assert.equal(response.body.data.verificationStatus, 'PENDING_VERIFICATION');
  });

  it('returns farmer not found for an unknown farmer ID', async () => {
    const unknownFarmerId = new mongoose.Types.ObjectId().toString();

    const response = await request(app)
      .post('/api/farms/register')
      .send({ ...farmPayload, farmerId: unknownFarmerId })
      .expect(404);

    assert.equal(response.body.message, 'Farmer not found');
  });

  it('searches farms and returns farms by farmer', async () => {
    const farmer = await createFarmer();
    await request(app)
      .post('/api/farms/register')
      .send({ ...farmPayload, farmerId: farmer._id })
      .expect(201);

    const searchResponse = await request(app).get('/api/farms?search=Nochchiyagama').expect(200);
    assert.equal(searchResponse.body.data.length, 1);

    const nestedResponse = await request(app).get(`/api/farmers/${farmer._id}/farms`).expect(200);
    assert.equal(nestedResponse.body.data.length, 1);
    assert.equal(nestedResponse.body.data[0].farmCode, 'FARM-LAND-0001');
  });

  it('updates farm verification status', async () => {
    const farmer = await createFarmer();
    const registerResponse = await request(app)
      .post('/api/farms/register')
      .send({ ...farmPayload, farmerId: farmer._id })
      .expect(201);

    const response = await request(app)
      .patch(`/api/farms/${registerResponse.body.data._id}/verify`)
      .send({ verificationStatus: 'VERIFIED' })
      .expect(200);

    assert.equal(response.body.data.verificationStatus, 'VERIFIED');
  });
});

