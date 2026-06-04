import { Crop } from '../models/crop.model.js';
import { Farm } from '../models/farm.model.js';
import { Farmer } from '../models/farmer.model.js';
import { createCrop } from '../services/crop.service.js';

const demoCrop = {
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
  verificationStatus: 'PENDING_VERIFICATION',
  registeredBy: 'Field Officer',
};

export async function seedDemoCrop() {
  const farmer = await Farmer.findOne({ nationalId: '901234567V' }).lean();

  if (!farmer) {
    return null;
  }

  const farm =
    (await Farm.findOne({ farmCode: 'FARM-LAND-0001', farmer: farmer._id }).lean()) ||
    (await Farm.findOne({ farmer: farmer._id }).sort({ createdAt: 1 }).lean());

  if (!farm) {
    return null;
  }

  const existingCrop = await Crop.findOne({
    farm: farm._id,
    cropType: demoCrop.cropType,
    season: demoCrop.season,
    seasonYear: demoCrop.seasonYear,
  }).lean();

  if (existingCrop) {
    return existingCrop;
  }

  return createCrop({
    ...demoCrop,
    farmId: farm._id.toString(),
  });
}

