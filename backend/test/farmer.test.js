import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createApp } from '../src/app.js';

let mongoServer;
let app;

const demoPayload = {
  fullName: 'Mohamed Ameen',
  nationalId: '901234567V',
  mobileNumber: '0771234567',
  district: 'Anuradhapura',
  gnDivision: 'Nochchiyagama',
  farmerType: 'SMALLHOLDER',
  registeredBy: 'Field Officer',
};

describe('Farmer Registry API', () => {
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

  it('registers a farmer with an auto-generated farmer code', async () => {
    const response = await request(app)
      .post('/api/farmers/register')
      .send(demoPayload)
      .expect(201);

    assert.equal(response.body.success, true);
    assert.equal(response.body.data.farmerCode, 'FARMER-0001');
    assert.equal(response.body.data.verificationStatus, 'PENDING_VERIFICATION');
  });

  it('prevents duplicate national IDs', async () => {
    await request(app).post('/api/farmers/register').send(demoPayload).expect(201);

    const response = await request(app)
      .post('/api/farmers/register')
      .send(demoPayload)
      .expect(409);

    assert.equal(response.body.success, false);
    assert.equal(response.body.message, 'National ID / NIC already exists');
  });

  it('searches farmers and updates verification status', async () => {
    const registerResponse = await request(app)
      .post('/api/farmers/register')
      .send(demoPayload)
      .expect(201);

    const listResponse = await request(app).get('/api/farmers?search=ameen').expect(200);
    assert.equal(listResponse.body.data.length, 1);

    const farmerId = registerResponse.body.data._id;
    const verifyResponse = await request(app)
      .patch(`/api/farmers/${farmerId}/verify`)
      .send({ verificationStatus: 'VERIFIED' })
      .expect(200);

    assert.equal(verifyResponse.body.data.verificationStatus, 'VERIFIED');
  });
});

