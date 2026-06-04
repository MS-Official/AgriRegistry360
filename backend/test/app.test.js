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
});

