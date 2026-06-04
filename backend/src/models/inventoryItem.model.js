import mongoose from 'mongoose';

export const INVENTORY_CATEGORIES = ['FERTILIZER', 'SEED', 'EQUIPMENT', 'OTHER'];
export const INVENTORY_STATUSES = ['ACTIVE', 'INACTIVE'];

const inventoryItemSchema = new mongoose.Schema(
  {
    itemCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    itemName: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: { values: INVENTORY_CATEGORIES, message: 'Invalid inventory category' },
    },
    availableQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Available quantity cannot be negative'],
    },
    reservedQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Reserved quantity cannot be negative'],
    },
    distributedQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Distributed quantity cannot be negative'],
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
    status: {
      type: String,
      enum: { values: INVENTORY_STATUSES, message: 'Invalid inventory status' },
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const InventoryItem = mongoose.model('InventoryItem', inventoryItemSchema);

