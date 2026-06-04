import { Farmer, VERIFICATION_STATUSES } from '../models/farmer.model.js';
import { generateFarmerCode } from '../utils/generateFarmerCode.js';

function buildSearchQuery(search) {
  if (!search) {
    return {};
  }

  const searchRegex = new RegExp(search.trim(), 'i');
  return {
    $or: [
      { farmerCode: searchRegex },
      { fullName: searchRegex },
      { nationalId: searchRegex },
      { district: searchRegex },
    ],
  };
}

export async function registerFarmer(payload) {
  const existingFarmer = await Farmer.findOne({
    nationalId: payload.nationalId?.toUpperCase(),
  }).lean();

  if (existingFarmer) {
    const error = new Error('National ID / NIC already exists');
    error.statusCode = 409;
    throw error;
  }

  const farmerCode = await generateFarmerCode(Farmer);

  return Farmer.create({
    ...payload,
    farmerCode,
    verificationStatus: payload.verificationStatus || 'PENDING_VERIFICATION',
  });
}

export async function getFarmers(search) {
  return Farmer.find(buildSearchQuery(search)).sort({ createdAt: -1 }).lean();
}

export async function getFarmerById(id) {
  return Farmer.findById(id).lean();
}

export async function updateFarmer(id, payload) {
  const blockedFields = ['_id', 'farmerCode', 'createdAt', 'updatedAt'];
  const update = { ...payload };
  blockedFields.forEach((field) => delete update[field]);

  return Farmer.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
  }).lean();
}

export async function updateFarmerVerification(id, verificationStatus) {
  if (!VERIFICATION_STATUSES.includes(verificationStatus)) {
    const error = new Error('Invalid verification status');
    error.statusCode = 400;
    throw error;
  }

  return Farmer.findByIdAndUpdate(
    id,
    { verificationStatus },
    { new: true, runValidators: true }
  ).lean();
}
