import mongoose from 'mongoose';
import { Crop } from '../models/crop.model.js';
import { Eligibility, PROGRAM_NAMES } from '../models/eligibility.model.js';
import { Farm } from '../models/farm.model.js';
import { Farmer } from '../models/farmer.model.js';
import { generateEligibilityCode } from '../utils/generateEligibilityCode.js';

const SUPPORTED_PROGRAM_CODE = 'FERTILIZER_SUBSIDY_2026';

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
      { eligibilityCode: searchRegex },
      { farmerCode: searchRegex },
      { farmerName: searchRegex },
      { farmCode: searchRegex },
      { cropCode: searchRegex },
      { programCode: searchRegex },
      { programName: searchRegex },
      { eligibilityStatus: searchRegex },
    ],
  };
}

function addRule(ruleResults, failureReasons, rule, passed, failureReason) {
  ruleResults.push({ rule, passed });
  if (!passed) {
    failureReasons.push(failureReason);
  }
}

function getRecommendedEntitlement(cultivationArea) {
  if (cultivationArea <= 2) {
    return '50KG_FERTILIZER';
  }

  if (cultivationArea <= 5) {
    return '100KG_FERTILIZER';
  }

  return '150KG_FERTILIZER';
}

function evaluateFertilizerSubsidy({ farmer, farm, crop }) {
  const ruleResults = [];
  const failureReasons = [];

  addRule(
    ruleResults,
    failureReasons,
    'Farmer must be verified',
    farmer.verificationStatus === 'VERIFIED',
    'Farmer is not verified'
  );
  addRule(
    ruleResults,
    failureReasons,
    'Farm must be verified',
    farm.verificationStatus === 'VERIFIED',
    'Farm is not verified'
  );
  addRule(
    ruleResults,
    failureReasons,
    'Crop must be verified',
    crop.verificationStatus === 'VERIFIED',
    'Crop is not verified'
  );
  addRule(
    ruleResults,
    failureReasons,
    'Crop must be PADDY',
    crop.cropType === 'PADDY',
    'Crop is not PADDY'
  );
  addRule(
    ruleResults,
    failureReasons,
    'Season must be MAHA or YALA',
    ['MAHA', 'YALA'].includes(crop.season),
    'Season is not MAHA or YALA'
  );
  addRule(
    ruleResults,
    failureReasons,
    'Crop status must be PLANTED or GROWING',
    ['PLANTED', 'GROWING'].includes(crop.cropStatus),
    'Crop status is not PLANTED or GROWING'
  );
  addRule(
    ruleResults,
    failureReasons,
    'Farm status must be ACTIVE',
    farm.farmStatus === 'ACTIVE',
    'Farm status is not ACTIVE'
  );
  addRule(
    ruleResults,
    failureReasons,
    'Cultivation area must be greater than 0',
    crop.cultivationArea > 0,
    'Cultivation area is not greater than 0'
  );

  const eligibilityStatus = failureReasons.length === 0 ? 'ELIGIBLE' : 'NOT_ELIGIBLE';
  return {
    eligibilityStatus,
    ruleResults,
    failureReasons,
    recommendedEntitlement:
      eligibilityStatus === 'ELIGIBLE' ? getRecommendedEntitlement(crop.cultivationArea) : 'NONE',
  };
}

export async function checkEligibility(payload) {
  const { farmerId, farmId, cropId, programCode, checkedBy } = payload;

  if (!farmerId || !farmId || !cropId || !programCode || !checkedBy) {
    const error = new Error('Missing required fields');
    error.statusCode = 400;
    throw error;
  }

  assertValidObjectId(farmerId, 'Invalid farmer ID');
  assertValidObjectId(farmId, 'Invalid farm ID');
  assertValidObjectId(cropId, 'Invalid crop ID');

  if (programCode !== SUPPORTED_PROGRAM_CODE) {
    const error = new Error('Unsupported program code');
    error.statusCode = 400;
    throw error;
  }

  const [farmer, farm, crop] = await Promise.all([
    Farmer.findById(farmerId).lean(),
    Farm.findById(farmId).lean(),
    Crop.findById(cropId).lean(),
  ]);

  if (!farmer) {
    const error = new Error('Farmer not found');
    error.statusCode = 404;
    throw error;
  }

  if (!farm) {
    const error = new Error('Farm not found');
    error.statusCode = 404;
    throw error;
  }

  if (!crop) {
    const error = new Error('Crop not found');
    error.statusCode = 404;
    throw error;
  }

  if (farm.farmer.toString() !== farmer._id.toString()) {
    const error = new Error('Farmer/Farm mismatch');
    error.statusCode = 400;
    throw error;
  }

  if (crop.farm.toString() !== farm._id.toString()) {
    const error = new Error('Farm/Crop mismatch');
    error.statusCode = 400;
    throw error;
  }

  if (crop.farmer.toString() !== farmer._id.toString()) {
    const error = new Error('Farmer/Crop mismatch');
    error.statusCode = 400;
    throw error;
  }

  const eligibilityCode = await generateEligibilityCode(Eligibility);
  const evaluation = evaluateFertilizerSubsidy({ farmer, farm, crop });

  return Eligibility.create({
    eligibilityCode,
    farmer: farmer._id,
    farmerCode: farmer.farmerCode,
    farmerName: farmer.fullName,
    farm: farm._id,
    farmCode: farm.farmCode,
    crop: crop._id,
    cropCode: crop.cropCode,
    programCode,
    programName: PROGRAM_NAMES[programCode],
    checkedBy,
    checkedAt: new Date(),
    ...evaluation,
  });
}

export async function getEligibilityChecks(search) {
  return Eligibility.find(buildSearchQuery(search)).sort({ checkedAt: -1 }).lean();
}

export async function getEligibilityById(id) {
  assertValidObjectId(id, 'Invalid eligibility ID');
  return Eligibility.findById(id).lean();
}

export async function getEligibilityByFarmer(farmerId) {
  assertValidObjectId(farmerId, 'Invalid farmer ID');
  return Eligibility.find({ farmer: farmerId }).sort({ checkedAt: -1 }).lean();
}

export async function getEligibilityByFarm(farmId) {
  assertValidObjectId(farmId, 'Invalid farm ID');
  return Eligibility.find({ farm: farmId }).sort({ checkedAt: -1 }).lean();
}

export async function getEligibilityByCrop(cropId) {
  assertValidObjectId(cropId, 'Invalid crop ID');
  return Eligibility.find({ crop: cropId }).sort({ checkedAt: -1 }).lean();
}

