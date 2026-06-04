import mongoose from 'mongoose';

export const RESERVATION_STATUSES = ['RESERVED', 'CANCELLED', 'ISSUED'];

const inventoryReservationSchema = new mongoose.Schema(
  {
    reservationCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    enrollment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Enrollment',
      required: [true, 'Enrollment is required'],
    },
    enrollmentCode: {
      type: String,
      required: [true, 'Enrollment code is required'],
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
      trim: true,
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
    itemCode: {
      type: String,
      required: [true, 'Item code is required'],
      trim: true,
    },
    itemName: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    reservedQuantity: {
      type: Number,
      required: [true, 'Reserved quantity is required'],
      min: [0.0001, 'Reserved quantity must be greater than 0'],
    },
    unit: {
      type: String,
      required: [true, 'Unit is required'],
      trim: true,
    },
    warehouseName: {
      type: String,
      required: [true, 'Warehouse name is required'],
      trim: true,
    },
    reservationStatus: {
      type: String,
      enum: { values: RESERVATION_STATUSES, message: 'Invalid reservation status' },
      default: 'RESERVED',
    },
    reservedBy: {
      type: String,
      required: [true, 'Reserved by is required'],
      trim: true,
    },
    reservedAt: {
      type: Date,
      default: Date.now,
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

export const InventoryReservation = mongoose.model(
  'InventoryReservation',
  inventoryReservationSchema
);

