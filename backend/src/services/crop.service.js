import mongoose from 'mongoose';
import { CROP_VERIFICATION_STATUSES, Crop } from '../models/crop.model.js';
import { Farm } from '../models/farm.model.js';
import { generateCropCode } from '../utils/generateCropCode.js';

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

  const trimmedSearch = search.trim();
  const searchRegex = new RegExp(trimmedSearch, 'i');
  const numericSearch = Number(trimmedSearch);
  const orConditions = [
    { cropCode: searchRegex },
    { farmCode: searchRegex },
    { farmerCode: searchRegex },
    { farmerName: searchRegex },
    { cropType: searchRegex },
    { season: searchRegex },
    { cropStatus: searchRegex },
    { verificationStatus: searchRegex },
  ];

  if (Number.isFinite(numericSearch)) {
    orConditions.push({ seasonYear: numericSearch });
  }

  return { $or: orConditions };
}

export async function createCrop(payload) {
  assertValidObjectId(payload.farmId, 'Invalid farm ID');

  const farm = await Farm.findById(payload.farmId).lean();
  if (!farm) {
    const error = new Error('Farm not found');
    error.statusCode = 404;
    throw error;
  }

  const cropCode = await generateCropCode(Crop);
  return Crop.create({
    ...payload,
    cropCode,
    farm: farm._id,
    farmCode: farm.farmCode,
    farmer: farm.farmer,
    farmerCode: farm.farmerCode,
    farmerName: farm.farmerName,
    verificationStatus: payload.verificationStatus || 'PENDING_VERIFICATION',
  });
}

export async function getCrops(search) {
  return Crop.find(buildSearchQuery(search)).sort({ createdAt: -1 }).lean();
}

export async function getCropById(id) {
  assertValidObjectId(id, 'Invalid crop ID');
  return Crop.findById(id).lean();
}

export async function getCropsByFarm(farmId) {
  assertValidObjectId(farmId, 'Invalid farm ID');
  return Crop.find({ farm: farmId }).sort({ createdAt: -1 }).lean();
}

export async function getCropsByFarmer(farmerId) {
  assertValidObjectId(farmerId, 'Invalid farmer ID');
  return Crop.find({ farmer: farmerId }).sort({ createdAt: -1 }).lean();
}

export async function updateCrop(id, payload) {
  assertValidObjectId(id, 'Invalid crop ID');

  const blockedFields = [
    '_id',
    'cropCode',
    'farm',
    'farmId',
    'farmCode',
    'farmer',
    'farmerCode',
    'farmerName',
    'createdAt',
    'updatedAt',
  ];
  const update = { ...payload };
  blockedFields.forEach((field) => delete update[field]);

  return Crop.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
  }).lean();
}

export async function verifyCrop(id, verificationStatus) {
  assertValidObjectId(id, 'Invalid crop ID');

  if (!CROP_VERIFICATION_STATUSES.includes(verificationStatus)) {
    const error = new Error('Invalid verification status');
    error.statusCode = 400;
    throw error;
  }

  return Crop.findByIdAndUpdate(
    id,
    { verificationStatus },
    { new: true, runValidators: true }
  ).lean();
}

