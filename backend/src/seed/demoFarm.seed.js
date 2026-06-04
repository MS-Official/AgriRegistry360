import { Farm } from '../models/farm.model.js';
import { Farmer } from '../models/farmer.model.js';
import { createFarm } from '../services/farm.service.js';

const demoFarm = {
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
  verificationStatus: 'PENDING_VERIFICATION',
  registeredBy: 'Field Officer',
};

export async function seedDemoFarm() {
  const farmer = await Farmer.findOne({ nationalId: '901234567V' }).lean();

  if (!farmer) {
    return null;
  }

  const existingFarm = await Farm.findOne({
    farmer: farmer._id,
    landSize: demoFarm.landSize,
    landSizeUnit: demoFarm.landSizeUnit,
    ownershipType: demoFarm.ownershipType,
    district: demoFarm.district,
    gnDivision: demoFarm.gnDivision,
  }).lean();

  if (existingFarm) {
    return existingFarm;
  }

  return createFarm({
    ...demoFarm,
    farmerId: farmer._id.toString(),
  });
}

