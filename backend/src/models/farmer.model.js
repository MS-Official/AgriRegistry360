import mongoose from 'mongoose';

export const FARMER_TYPES = [
  'SMALLHOLDER',
  'COMMERCIAL',
  'TENANT',
  'COOPERATIVE_MEMBER',
];

export const VERIFICATION_STATUSES = [
  'PENDING_VERIFICATION',
  'VERIFIED',
  'REJECTED',
];

const farmerSchema = new mongoose.Schema(
  {
    farmerCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    nationalId: {
      type: String,
      required: [true, 'National ID / NIC is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    mobileNumber: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true,
    },
    district: {
      type: String,
      required: [true, 'District is required'],
      trim: true,
    },
    gnDivision: {
      type: String,
      trim: true,
      default: '',
    },
    farmerType: {
      type: String,
      required: [true, 'Farmer type is required'],
      enum: {
        values: FARMER_TYPES,
        message: 'Invalid farmer type',
      },
    },
    verificationStatus: {
      type: String,
      enum: {
        values: VERIFICATION_STATUSES,
        message: 'Invalid verification status',
      },
      default: 'PENDING_VERIFICATION',
    },
    registeredBy: {
      type: String,
      required: [true, 'Registered by is required'],
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const Farmer = mongoose.model('Farmer', farmerSchema);
