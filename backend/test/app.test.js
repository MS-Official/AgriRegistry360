import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

describe('App configuration', () => {
  it('returns API health status', async () => {
    const response = await request(app).get('/api/health').expect(200);

    assert.deepEqual(response.body, {
      success: true,
      message: 'AgriRegistry360 API is running',
    });
  });

  it('handles CORS preflight requests from the Angular frontend', async () => {
    const response = await request(app)
      .options('/api/farms')
      .set('Origin', 'http://localhost:4200')
      .set('Access-Control-Request-Method', 'GET')
      .set('Access-Control-Request-Headers', 'Content-Type, Authorization')
      .expect(204);

    assert.equal(response.headers['access-control-allow-origin'], 'http://localhost:4200');
    assert.match(response.headers['access-control-allow-methods'], /GET/);
    assert.match(response.headers['access-control-allow-methods'], /PATCH/);
    assert.match(response.headers['access-control-allow-headers'], /Content-Type/);
    assert.match(response.headers['access-control-allow-headers'], /Authorization/);
    assert.equal(response.headers['access-control-allow-credentials'], 'true');
  });

  it('returns WSO2-ready API catalog metadata', async () => {
    const response = await request(app).get('/api/catalog').expect(200);

    assert.equal(response.body.success, true);
    assert.equal(response.body.data.length, 4);
    assert.equal(response.body.data[0].name, 'AgriRegistry360 Registry API');
    assert.equal(response.body.data[0].status, 'READY_FOR_WSO2_PUBLISHING');
    assert.equal(response.body.data[3].name, 'AgriRegistry360 OpenG2P Mapping API');
    assert.equal(response.body.data[3].status, 'READY_FOR_OPENG2P_MAPPING');
  });

  it('returns OpenAPI JSON spec', async () => {
    const response = await request(app).get('/api/docs.json').expect(200);

    assert.equal(response.body.openapi, '3.0.3');
    assert.equal(response.body.info.title, 'AgriRegistry360 Farm Registry API');
    assert.ok(response.body.paths['/api/farmers/register']);
    assert.ok(response.body.paths['/api/odoo/inventory/reservations']);
    assert.ok(response.body.paths['/api/openg2p/mapping']);
  });

  it('registers Swagger UI docs route', async () => {
    const response = await request(app).get('/api/docs/').expect(200);

    assert.match(response.text, /Swagger UI/);
  });

  it('returns OpenG2P mapping metadata', async () => {
    const response = await request(app).get('/api/openg2p/mapping').expect(200);

    assert.equal(response.body.success, true);
    assert.equal(response.body.data.status, 'READY_FOR_OPENG2P_MAPPING');
    assert.equal(response.body.data.modules.length, 6);
    assert.equal(response.body.data.modules[0].agriregistryModule, 'Farmer Registry');
    assert.equal(response.body.data.modules[0].openG2PConcept, 'Registrant / Beneficiary');
  });
});
