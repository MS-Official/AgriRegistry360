import mongoose from 'mongoose';
import { FARM_VERIFICATION_STATUSES, Farm } from '../models/farm.model.js';
import { Farmer } from '../models/farmer.model.js';
import { generateFarmCode } from '../utils/generateFarmCode.js';

function assertValidObjectId(id, message = 'Invalid ObjectId') {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error(message);
    error.statusCode = 400;
    throw error;
  }
}

function buildSearchQuery(search) {
  if (!search) {
    return {};
  }

  const searchRegex = new RegExp(search.trim(), 'i');
  return {
    $or: [
      { farmCode: searchRegex },
      { farmerCode: searchRegex },
      { farmerName: searchRegex },
      { district: searchRegex },
      { gnDivision: searchRegex },
      { ownershipType: searchRegex },
      { soilType: searchRegex },
      { irrigationType: searchRegex },
    ],
  };
}

export async function createFarm(payload) {
  assertValidObjectId(payload.farmerId, 'Invalid farmer ID');

  const farmer = await Farmer.findById(payload.farmerId).lean();
  if (!farmer) {
    const error = new Error('Farmer not found');
    error.statusCode = 404;
    throw error;
  }

  const farmCode = await generateFarmCode(Farm);
  return Farm.create({
    ...payload,
    farmCode,
    farmer: farmer._id,
    farmerCode: farmer.farmerCode,
    farmerName: farmer.fullName,
    verificationStatus: payload.verificationStatus || 'PENDING_VERIFICATION',
  });
}

export async function getFarms(search) {
  return Farm.find(buildSearchQuery(search)).sort({ createdAt: -1 }).lean();
}

export async function getFarmById(id) {
  assertValidObjectId(id, 'Invalid farm ID');
  return Farm.findById(id).lean();
}

export async function getFarmsByFarmer(farmerId) {
  assertValidObjectId(farmerId, 'Invalid farmer ID');
  return Farm.find({ farmer: farmerId }).sort({ createdAt: -1 }).lean();
}

export async function updateFarm(id, payload) {
  assertValidObjectId(id, 'Invalid farm ID');

  const blockedFields = [
    '_id',
    'farmCode',
    'farmer',
    'farmerId',
    'farmerCode',
    'farmerName',
    'createdAt',
    'updatedAt',
  ];
  const update = { ...payload };
  blockedFields.forEach((field) => delete update[field]);

  return Farm.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
  }).lean();
}

export async function verifyFarm(id, verificationStatus) {
  assertValidObjectId(id, 'Invalid farm ID');

  if (!FARM_VERIFICATION_STATUSES.includes(verificationStatus)) {
    const error = new Error('Invalid verification status');
    error.statusCode = 400;
    throw error;
  }

  return Farm.findByIdAndUpdate(
    id,
    { verificationStatus },
    { new: true, runValidators: true }
  ).lean();
}

