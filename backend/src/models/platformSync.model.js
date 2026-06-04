import mongoose from 'mongoose';

export const ENTITY_TYPES = [
  'FARMER',
  'FARM',
  'CROP',
  'ELIGIBILITY',
  'ENROLLMENT',
  'INVENTORY_RESERVATION',
];

export const PLATFORMS = ['ODOO', 'OPENG2P', 'WSO2'];

export const SYNC_STATUSES = ['PENDING', 'SYNCED', 'FALLBACK_SYNCED', 'FAILED', 'SKIPPED', 'DEMO_MODE'];

export const SYNC_DIRECTIONS = ['OUTBOUND', 'INBOUND'];

const platformSyncSchema = new mongoose.Schema(
  {
    entityType: {
      type: String,
      required: true,
      enum: ENTITY_TYPES,
    },
    entityId: {
      type: String,
      required: true,
    },
    entityCode: {
      type: String,
      required: true,
      trim: true,
    },
    platform: {
      type: String,
      required: true,
      enum: PLATFORMS,
    },
    targetModel: {
      type: String,
      trim: true,
      default: '',
    },
    targetExternalId: {
      type: String,
      trim: true,
      default: '',
    },
    syncStatus: {
      type: String,
      required: true,
      enum: SYNC_STATUSES,
      default: 'PENDING',
    },
    syncDirection: {
      type: String,
      required: true,
      enum: SYNC_DIRECTIONS,
      default: 'OUTBOUND',
    },
    lastSyncAt: {
      type: Date,
      default: Date.now,
    },
    requestPayload: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    responsePayload: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    errorMessage: {
      type: String,
      trim: true,
      default: '',
    },
    syncedBy: {
      type: String,
      trim: true,
      default: 'System Sync Service',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const PlatformSync = mongoose.model('PlatformSync', platformSyncSchema);
