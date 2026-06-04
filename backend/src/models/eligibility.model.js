import mongoose from 'mongoose';

export const PROGRAM_CODES = [
  'FERTILIZER_SUBSIDY_2026',
  'SEED_DISTRIBUTION_2026',
  'DROUGHT_RELIEF_2026',
  'CROP_INSURANCE_2026',
];

export const PROGRAM_NAMES = {
  FERTILIZER_SUBSIDY_2026: 'Fertilizer Subsidy Program 2026',
  SEED_DISTRIBUTION_2026: 'Seed Distribution Program 2026',
  DROUGHT_RELIEF_2026: 'Drought Relief Program 2026',
  CROP_INSURANCE_2026: 'Crop Insurance Program 2026',
};

export const ELIGIBILITY_STATUSES = ['ELIGIBLE', 'NOT_ELIGIBLE', 'INCOMPLETE_DATA'];

const ruleResultSchema = new mongoose.Schema(
  {
    rule: {
      type: String,
      required: true,
      trim: true,
    },
    passed: {
      type: Boolean,
      required: true,
    },
  },
  { _id: false }
);

const eligibilitySchema = new mongoose.Schema(
  {
    eligibilityCode: {
      type: String,
      required: true,
      unique: true,
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
      enum: { values: PROGRAM_CODES, message: 'Invalid program code' },
    },
    programName: {
      type: String,
      required: [true, 'Program name is required'],
      trim: true,
    },
    eligibilityStatus: {
      type: String,
      required: [true, 'Eligibility status is required'],
      enum: { values: ELIGIBILITY_STATUSES, message: 'Invalid eligibility status' },
    },
    ruleResults: {
      type: [ruleResultSchema],
      default: [],
    },
    failureReasons: {
      type: [String],
      default: [],
    },
    recommendedEntitlement: {
      type: String,
      default: 'NONE',
      trim: true,
    },
    checkedBy: {
      type: String,
      required: [true, 'Checked by is required'],
      trim: true,
    },
    checkedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const Eligibility = mongoose.model('Eligibility', eligibilitySchema);

