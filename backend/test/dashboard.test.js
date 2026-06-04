import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { Crop } from '../src/models/crop.model.js';
import { Eligibility } from '../src/models/eligibility.model.js';
import { Enrollment } from '../src/models/enrollment.model.js';
import { Farm } from '../src/models/farm.model.js';
import { Farmer } from '../src/models/farmer.model.js';
import { InventoryReservation } from '../src/models/inventoryReservation.model.js';

const app = createApp();

describe('Dashboard API', () => {
  let mongoServer;

  before(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  beforeEach(async () => {
    await mongoose.connection.db.dropDatabase();
  });

  after(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('returns success and zero summary counts when no demo data exists', async () => {
    const response = await request(app).get('/api/dashboard/summary').expect(200);

    assert.equal(response.body.success, true);
    assert.equal(response.body.message, 'Dashboard summary retrieved successfully');
    assert.deepEqual(response.body.data, {
      totalFarmers: 0,
      totalFarms: 0,
      totalCrops: 0,
      totalEligibilityChecks: 0,
      eligibleChecks: 0,
      totalEnrollments: 0,
      approvedEnrollments: 0,
      totalReservations: 0,
      issuedReservations: 0,
    });
  });

  it('returns farmer, farm, crop, eligibility, enrollment, and reservation counts', async () => {
    const farmerId = new mongoose.Types.ObjectId();
    const farmId = new mongoose.Types.ObjectId();
    const cropId = new mongoose.Types.ObjectId();
    const eligibilityId = new mongoose.Types.ObjectId();
    const enrollmentId = new mongoose.Types.ObjectId();

    await Farmer.create({
      _id: farmerId,
      farmerCode: 'FARMER-0001',
      fullName: 'Mohamed Ameen',
      nationalId: '901234567V',
      mobileNumber: '0771234567',
      district: 'Anuradhapura',
      farmerType: 'SMALLHOLDER',
      registeredBy: 'Field Officer',
    });

    await Farm.create({
      _id: farmId,
      farmCode: 'FARM-LAND-0001',
      farmer: farmerId,
      farmerCode: 'FARMER-0001',
      farmerName: 'Mohamed Ameen',
      landSize: 2.5,
      landSizeUnit: 'ACRES',
      ownershipType: 'OWNED',
      district: 'Anuradhapura',
      gnDivision: 'Nochchiyagama',
      registeredBy: 'Field Officer',
    });

    await Crop.create({
      _id: cropId,
      cropCode: 'CROP-0001',
      farm: farmId,
      farmCode: 'FARM-LAND-0001',
      farmer: farmerId,
      farmerCode: 'FARMER-0001',
      farmerName: 'Mohamed Ameen',
      cropType: 'PADDY',
      season: 'MAHA',
      seasonYear: 2026,
      cultivationArea: 2,
      cultivationAreaUnit: 'ACRES',
      plantingDate: '2026-06-01',
      expectedHarvestDate: '2026-09-20',
      expectedYield: 4500,
      expectedYieldUnit: 'KG',
      registeredBy: 'Field Officer',
    });

    await Eligibility.create({
      _id: eligibilityId,
      eligibilityCode: 'ELIG-0001',
      farmer: farmerId,
      farmerCode: 'FARMER-0001',
      farmerName: 'Mohamed Ameen',
      farm: farmId,
      farmCode: 'FARM-LAND-0001',
      crop: cropId,
      cropCode: 'CROP-0001',
      programCode: 'FERTILIZER_SUBSIDY_2026',
      programName: 'Fertilizer Subsidy Program 2026',
      eligibilityStatus: 'ELIGIBLE',
      recommendedEntitlement: '50KG_FERTILIZER',
      checkedBy: 'Field Officer',
    });

    await Enrollment.create({
      _id: enrollmentId,
      enrollmentCode: 'ENROLL-0001',
      eligibility: eligibilityId,
      eligibilityCode: 'ELIG-0001',
      farmer: farmerId,
      farmerCode: 'FARMER-0001',
      farmerName: 'Mohamed Ameen',
      farm: farmId,
      farmCode: 'FARM-LAND-0001',
      crop: cropId,
      cropCode: 'CROP-0001',
      programCode: 'FERTILIZER_SUBSIDY_2026',
      programName: 'Fertilizer Subsidy Program 2026',
      entitlement: '50KG_FERTILIZER',
      approvalStatus: 'APPROVED',
      enrolledBy: 'Field Officer',
    });

    await InventoryReservation.create({
      reservationCode: 'RESERVE-0001',
      enrollment: enrollmentId,
      enrollmentCode: 'ENROLL-0001',
      farmer: farmerId,
      farmerCode: 'FARMER-0001',
      farmerName: 'Mohamed Ameen',
      farm: farmId,
      farmCode: 'FARM-LAND-0001',
      crop: cropId,
      cropCode: 'CROP-0001',
      programCode: 'FERTILIZER_SUBSIDY_2026',
      programName: 'Fertilizer Subsidy Program 2026',
      entitlement: '50KG_FERTILIZER',
      itemCode: 'FERT-UREA-50KG',
      itemName: 'Urea Fertilizer 50KG',
      reservedQuantity: 1,
      unit: 'BAG',
      warehouseName: 'Anuradhapura Distribution Warehouse',
      reservationStatus: 'ISSUED',
      reservedBy: 'Field Officer',
    });

    const response = await request(app).get('/api/dashboard/summary').expect(200);

    assert.equal(response.body.success, true);
    assert.equal(response.body.data.totalFarmers, 1);
    assert.equal(response.body.data.totalFarms, 1);
    assert.equal(response.body.data.totalCrops, 1);
    assert.equal(response.body.data.totalEligibilityChecks, 1);
    assert.equal(response.body.data.eligibleChecks, 1);
    assert.equal(response.body.data.totalEnrollments, 1);
    assert.equal(response.body.data.approvedEnrollments, 1);
    assert.equal(response.body.data.totalReservations, 1);
    assert.equal(response.body.data.issuedReservations, 1);
  });
});
