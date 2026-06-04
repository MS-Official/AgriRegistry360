import mongoose from 'mongoose';
import { Eligibility } from '../models/eligibility.model.js';
import { APPROVAL_STATUSES, Enrollment } from '../models/enrollment.model.js';
import { Crop } from '../models/crop.model.js';
import { Farm } from '../models/farm.model.js';
import { Farmer } from '../models/farmer.model.js';
import { generateEnrollmentCode } from '../utils/generateEnrollmentCode.js';

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
      { enrollmentCode: searchRegex },
      { eligibilityCode: searchRegex },
      { farmerCode: searchRegex },
      { farmerName: searchRegex },
      { farmCode: searchRegex },
      { cropCode: searchRegex },
      { programCode: searchRegex },
      { programName: searchRegex },
      { enrollmentStatus: searchRegex },
      { approvalStatus: searchRegex },
    ],
  };
}

async function validateReferences(eligibility) {
  const [farmer, farm, crop] = await Promise.all([
    Farmer.findById(eligibility.farmer).lean(),
    Farm.findById(eligibility.farm).lean(),
    Crop.findById(eligibility.crop).lean(),
  ]);

  if (!farmer || !farm || !crop) {
    const error = new Error('Eligibility references are invalid');
    error.statusCode = 400;
    throw error;
  }
}

function appendNote(existingNotes, newNote) {
  if (!newNote?.trim()) {
    return existingNotes || '';
  }

  return existingNotes ? `${existingNotes}\n${newNote.trim()}` : newNote.trim();
}

export async function createEnrollment(payload) {
  const { eligibilityId, enrolledBy, notes = '' } = payload;

  if (!eligibilityId || !enrolledBy) {
    const error = new Error('Missing required fields');
    error.statusCode = 400;
    throw error;
  }

  assertValidObjectId(eligibilityId, 'Invalid eligibility ID');

  const eligibility = await Eligibility.findById(eligibilityId).lean();
  if (!eligibility) {
    const error = new Error('Eligibility not found');
    error.statusCode = 404;
    throw error;
  }

  if (eligibility.eligibilityStatus !== 'ELIGIBLE') {
    const error = new Error('Only eligible farmers can be enrolled into this program.');
    error.statusCode = 400;
    throw error;
  }

  if (eligibility.programCode !== 'FERTILIZER_SUBSIDY_2026') {
    const error = new Error('Unsupported program code');
    error.statusCode = 400;
    throw error;
  }

  await validateReferences(eligibility);

  const duplicateEnrollment = await Enrollment.findOne({
    farmer: eligibility.farmer,
    farm: eligibility.farm,
    crop: eligibility.crop,
    programCode: eligibility.programCode,
    enrollmentStatus: { $ne: 'CANCELLED' },
  }).lean();

  if (duplicateEnrollment) {
    const error = new Error('Duplicate active enrollment exists');
    error.statusCode = 409;
    throw error;
  }

  const enrollmentCode = await generateEnrollmentCode(Enrollment);

  return Enrollment.create({
    enrollmentCode,
    eligibility: eligibility._id,
    eligibilityCode: eligibility.eligibilityCode,
    farmer: eligibility.farmer,
    farmerCode: eligibility.farmerCode,
    farmerName: eligibility.farmerName,
    farm: eligibility.farm,
    farmCode: eligibility.farmCode,
    crop: eligibility.crop,
    cropCode: eligibility.cropCode,
    programCode: eligibility.programCode,
    programName: eligibility.programName,
    entitlement: eligibility.recommendedEntitlement,
    enrolledBy,
    notes,
  });
}

export async function getEnrollments(search) {
  return Enrollment.find(buildSearchQuery(search)).sort({ enrollmentDate: -1 }).lean();
}

export async function getEnrollmentById(id) {
  assertValidObjectId(id, 'Invalid enrollment ID');
  return Enrollment.findById(id).lean();
}

export async function getEnrollmentsByFarmer(farmerId) {
  assertValidObjectId(farmerId, 'Invalid farmer ID');
  return Enrollment.find({ farmer: farmerId }).sort({ enrollmentDate: -1 }).lean();
}

export async function getEnrollmentsByFarm(farmId) {
  assertValidObjectId(farmId, 'Invalid farm ID');
  return Enrollment.find({ farm: farmId }).sort({ enrollmentDate: -1 }).lean();
}

export async function getEnrollmentsByCrop(cropId) {
  assertValidObjectId(cropId, 'Invalid crop ID');
  return Enrollment.find({ crop: cropId }).sort({ enrollmentDate: -1 }).lean();
}

export async function getEnrollmentsByEligibility(eligibilityId) {
  assertValidObjectId(eligibilityId, 'Invalid eligibility ID');
  return Enrollment.find({ eligibility: eligibilityId }).sort({ enrollmentDate: -1 }).lean();
}

export async function updateEnrollmentApproval(id, approvalStatus, notes = '') {
  assertValidObjectId(id, 'Invalid enrollment ID');

  if (!APPROVAL_STATUSES.includes(approvalStatus)) {
    const error = new Error('Invalid approval status');
    error.statusCode = 400;
    throw error;
  }

  const enrollment = await Enrollment.findById(id);
  if (!enrollment) {
    return null;
  }

  enrollment.approvalStatus = approvalStatus;
  enrollment.notes = appendNote(enrollment.notes, notes);
  return enrollment.save();
}

export async function cancelEnrollment(id, notes = '') {
  assertValidObjectId(id, 'Invalid enrollment ID');

  const enrollment = await Enrollment.findById(id);
  if (!enrollment) {
    return null;
  }

  enrollment.enrollmentStatus = 'CANCELLED';
  enrollment.notes = appendNote(enrollment.notes, notes);
  return enrollment.save();
}

