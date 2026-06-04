import mongoose from 'mongoose';

export const ENROLLMENT_PROGRAM_CODES = ['FERTILIZER_SUBSIDY_2026'];
export const ENROLLMENT_STATUSES = ['ENROLLED', 'CANCELLED', 'COMPLETED'];
export const APPROVAL_STATUSES = ['PENDING_APPROVAL', 'APPROVED', 'REJECTED'];

const enrollmentSchema = new mongoose.Schema(
  {
    enrollmentCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    eligibility: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Eligibility',
      required: [true, 'Eligibility is required'],
    },
    eligibilityCode: {
      type: String,
      required: [true, 'Eligibility code is required'],
      trim: true,
    },
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Farmer',
      required: [true, 'Farmer is required'],
    },
    farmerCode: {
      type: String,
      required: [true, 'Farmer code is required'],
      trim: true,
    },
    farmerName: {
      type: String,
      required: [true, 'Farmer name is required'],
      trim: true,
    },
    farm: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Farm',
      required: [true, 'Farm is required'],
    },
    farmCode: {
      type: String,
      required: [true, 'Farm code is required'],
      trim: true,
    },
    crop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Crop',
      required: [true, 'Crop is required'],
    },
    cropCode: {
      type: String,
      required: [true, 'Crop code is required'],
      trim: true,
    },
    programCode: {
      type: String,
      required: [true, 'Program code is required'],
      enum: { values: ENROLLMENT_PROGRAM_CODES, message: 'Invalid program code' },
    },
    programName: {
      type: String,
      required: [true, 'Program name is required'],
      trim: true,
    },
    entitlement: {
      type: String,
      required: [true, 'Entitlement is required'],
      trim: true,
    },
    enrollmentStatus: {
      type: String,
      enum: { values: ENROLLMENT_STATUSES, message: 'Invalid enrollment status' },
      default: 'ENROLLED',
    },
    approvalStatus: {
      type: String,
      enum: { values: APPROVAL_STATUSES, message: 'Invalid approval status' },
      default: 'PENDING_APPROVAL',
    },
    enrollmentDate: {
      type: Date,
      default: Date.now,
    },
    enrolledBy: {
      type: String,
      required: [true, 'Enrolled by is required'],
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const Enrollment = mongoose.model('Enrollment', enrollmentSchema);

