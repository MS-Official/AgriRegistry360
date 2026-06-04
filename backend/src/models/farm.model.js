import mongoose from 'mongoose';

export const OWNERSHIP_TYPES = ['OWNED', 'LEASED', 'SHARED', 'TENANT_OPERATED'];
export const LAND_SIZE_UNITS = ['ACRES', 'HECTARES', 'PERCHES'];
export const SOIL_TYPES = ['CLAY', 'LOAM', 'SANDY', 'SILT', 'MIXED', 'UNKNOWN'];
export const IRRIGATION_TYPES = ['RAINFED', 'CANAL', 'WELL', 'TUBE_WELL', 'DRIP', 'SPRINKLER', 'UNKNOWN'];
export const FARM_STATUSES = ['ACTIVE', 'INACTIVE', 'UNDER_REVIEW'];
export const FARM_VERIFICATION_STATUSES = ['PENDING_VERIFICATION', 'VERIFIED', 'REJECTED'];

const farmSchema = new mongoose.Schema(
  {
    farmCode: {
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
    landSize: {
      type: Number,
      required: [true, 'Land size is required'],
      min: [0.0001, 'Land size must be greater than 0'],
    },
    landSizeUnit: {
      type: String,
      required: [true, 'Land size unit is required'],
      enum: { values: LAND_SIZE_UNITS, message: 'Invalid land size unit' },
    },
    ownershipType: {
      type: String,
      required: [true, 'Ownership type is required'],
      enum: { values: OWNERSHIP_TYPES, message: 'Invalid ownership type' },
    },
    district: {
      type: String,
      required: [true, 'District is required'],
      trim: true,
    },
    gnDivision: {
      type: String,
      required: [true, 'GN Division is required'],
      trim: true,
    },
    gpsLatitude: {
      type: Number,
    },
    gpsLongitude: {
      type: Number,
    },
    soilType: {
      type: String,
      enum: { values: SOIL_TYPES, message: 'Invalid soil type' },
      default: 'UNKNOWN',
    },
    irrigationType: {
      type: String,
      enum: { values: IRRIGATION_TYPES, message: 'Invalid irrigation type' },
      default: 'UNKNOWN',
    },
    farmStatus: {
      type: String,
      enum: { values: FARM_STATUSES, message: 'Invalid farm status' },
      default: 'ACTIVE',
    },
    verificationStatus: {
      type: String,
      enum: { values: FARM_VERIFICATION_STATUSES, message: 'Invalid verification status' },
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

export const Farm = mongoose.model('Farm', farmSchema);

