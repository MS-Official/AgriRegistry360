import mongoose from 'mongoose';

export const CROP_TYPES = [
  'PADDY',
  'MAIZE',
  'VEGETABLES',
  'FRUITS',
  'TEA',
  'COCONUT',
  'RUBBER',
  'OTHER',
];
export const SEASONS = ['MAHA', 'YALA', 'INTER_SEASON', 'YEAR_ROUND'];
export const CULTIVATION_AREA_UNITS = ['ACRES', 'HECTARES', 'PERCHES'];
export const EXPECTED_YIELD_UNITS = ['KG', 'MT', 'BAGS', 'UNITS'];
export const CROP_STATUSES = ['PLANNED', 'PLANTED', 'GROWING', 'HARVESTED', 'DAMAGED', 'FAILED'];
export const CROP_VERIFICATION_STATUSES = ['PENDING_VERIFICATION', 'VERIFIED', 'REJECTED'];

const cropSchema = new mongoose.Schema(
  {
    cropCode: {
      type: String,
      required: true,
      unique: true,
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
    cropType: {
      type: String,
      required: [true, 'Crop type is required'],
      enum: { values: CROP_TYPES, message: 'Invalid crop type' },
    },
    season: {
      type: String,
      required: [true, 'Season is required'],
      enum: { values: SEASONS, message: 'Invalid season' },
    },
    seasonYear: {
      type: Number,
      required: [true, 'Season year is required'],
      min: [1900, 'Season year is invalid'],
    },
    cultivationArea: {
      type: Number,
      required: [true, 'Cultivation area is required'],
      min: [0.0001, 'Cultivation area must be greater than 0'],
    },
    cultivationAreaUnit: {
      type: String,
      required: [true, 'Cultivation area unit is required'],
      enum: { values: CULTIVATION_AREA_UNITS, message: 'Invalid cultivation area unit' },
    },
    plantingDate: {
      type: Date,
      required: [true, 'Planting date is required'],
    },
    expectedHarvestDate: {
      type: Date,
      required: [true, 'Expected harvest date is required'],
    },
    expectedYield: {
      type: Number,
      required: [true, 'Expected yield is required'],
      min: [0.0001, 'Expected yield must be greater than 0'],
    },
    expectedYieldUnit: {
      type: String,
      required: [true, 'Expected yield unit is required'],
      enum: { values: EXPECTED_YIELD_UNITS, message: 'Invalid expected yield unit' },
    },
    cropStatus: {
      type: String,
      enum: { values: CROP_STATUSES, message: 'Invalid crop status' },
      default: 'PLANNED',
    },
    verificationStatus: {
      type: String,
      enum: { values: CROP_VERIFICATION_STATUSES, message: 'Invalid verification status' },
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

cropSchema.pre('validate', function validateCropDates(next) {
  if (
    this.plantingDate &&
    this.expectedHarvestDate &&
    this.expectedHarvestDate <= this.plantingDate
  ) {
    this.invalidate('expectedHarvestDate', 'Expected harvest date must be after planting date');
  }

  next();
});

export const Crop = mongoose.model('Crop', cropSchema);

