import mongoose from 'mongoose';
import http from 'node:http';
import https from 'node:https';
import { config } from '../config/env.js';
import { odooClient } from '../integrations/odoo/odooClient.js';
import { openG2PClient } from '../integrations/openg2p/openG2PClient.js';
import { Crop } from '../models/crop.model.js';
import { Eligibility } from '../models/eligibility.model.js';
import { Enrollment } from '../models/enrollment.model.js';
import { Farm } from '../models/farm.model.js';
import { Farmer } from '../models/farmer.model.js';
import { InventoryItem } from '../models/inventoryItem.model.js';
import { InventoryReservation } from '../models/inventoryReservation.model.js';
import { PlatformSync } from '../models/platformSync.model.js';

/**
 * Helper to log sync attempts and status
 */
export async function createOrUpdateSyncLog({
  entityType,
  entityId,
  entityCode,
  platform,
  targetModel,
  syncStatus,
  requestPayload,
  responsePayload,
  errorMessage = '',
  targetExternalId = '',
}) {
  return await PlatformSync.findOneAndUpdate(
    { entityType, entityId, platform },
    {
      entityCode,
      targetModel,
      targetExternalId,
      syncStatus,
      syncDirection: 'OUTBOUND',
      lastSyncAt: new Date(),
      requestPayload,
      responsePayload,
      errorMessage,
      syncedBy: 'System Sync Service',
    },
    { upsert: true, new: true }
  );
}

const OPENG2P_FALLBACK_MESSAGE =
  'OpenG2P PBMS/agriculture models were not detected in this local container, so AgriRegistry360 writes mapped records into visible OpenG2P/Odoo records for demo verification. In production, these mappings will point to official OpenG2P PBMS models.';

function formatRuleResults(ruleResults = []) {
  return ruleResults.map((rule) => `${rule.rule}: ${rule.passed ? 'PASSED' : 'FAILED'}`).join('; ');
}

function formatOdooDatetime(value) {
  if (!value) return false;
  return new Date(value).toISOString().slice(0, 19).replace('T', ' ');
}

async function syncOpenG2PRecord({
  entityType,
  entityId,
  entityCode,
  targetModel,
  targetPayload,
  targetLookupField = null,
  fallbackPayload,
  fallbackExternalPrefix,
  realResponseKey = 'openG2PId',
}) {
  const demoExternalId = `DEMO-G2P-${entityType}-${entityCode}`;

  if (!config.openG2PEnabled) {
    return await createOrUpdateSyncLog({
      entityType,
      entityId,
      entityCode,
      platform: 'OPENG2P',
      targetModel,
      syncStatus: 'DEMO_MODE',
      requestPayload: targetPayload,
      responsePayload: { success: true, mode: 'demo', simulatedId: demoExternalId },
      targetExternalId: demoExternalId,
    });
  }

  try {
    const targetExists = await openG2PClient.checkModelExists(targetModel);
    if (targetExists) {
      try {
        let action = 'created';
        let recordId;
        if (targetLookupField) {
          const existing = await openG2PClient.searchRead(targetModel, [[targetLookupField, '=', entityCode]], ['id']);
          if (existing.length > 0) {
            await openG2PClient.writeRecord(targetModel, existing[0].id, targetPayload);
            action = 'updated';
            recordId = existing[0].id;
          }
        }

        if (!recordId) {
          recordId = await openG2PClient.createRecord(targetModel, targetPayload);
        }

        return await createOrUpdateSyncLog({
          entityType,
          entityId,
          entityCode,
          platform: 'OPENG2P',
          targetModel,
          syncStatus: 'SYNCED',
          requestPayload: targetPayload,
          responsePayload: { success: true, [realResponseKey]: recordId, action, model: targetModel },
          targetExternalId: String(recordId),
        });
      } catch (targetError) {
        const fallbackModel = config.openG2PFallbackModel;
        const upsertResult = await openG2PClient.upsertVisibleFallbackRecord(fallbackPayload, fallbackModel);
        return await createOrUpdateSyncLog({
          entityType,
          entityId,
          entityCode,
          platform: 'OPENG2P',
          targetModel: fallbackModel,
          syncStatus: 'FALLBACK_SYNCED',
          requestPayload: fallbackPayload,
          responsePayload: {
            success: true,
            mode: 'visible_fallback',
            action: upsertResult.action,
            model: upsertResult.model,
            partnerId: upsertResult.id,
            message: upsertResult.message,
            targetModelWriteError: targetError.message,
          },
          targetExternalId: `${fallbackExternalPrefix}-${upsertResult.id}`,
          errorMessage: `${OPENG2P_FALLBACK_MESSAGE} Target model ${targetModel} exists but could not accept the mapped payload: ${targetError.message}`,
        });
      }
    }

    const fallbackModel = config.openG2PFallbackModel;
    const upsertResult = await openG2PClient.upsertVisibleFallbackRecord(fallbackPayload, fallbackModel);
    return await createOrUpdateSyncLog({
      entityType,
      entityId,
      entityCode,
      platform: 'OPENG2P',
      targetModel: fallbackModel,
      syncStatus: 'FALLBACK_SYNCED',
      requestPayload: fallbackPayload,
      responsePayload: {
        success: true,
        mode: 'visible_fallback',
        action: upsertResult.action,
        model: upsertResult.model,
        partnerId: upsertResult.id,
        message: upsertResult.message,
      },
      targetExternalId: `${fallbackExternalPrefix}-${upsertResult.id}`,
      errorMessage: OPENG2P_FALLBACK_MESSAGE,
    });
  } catch (error) {
    return await createOrUpdateSyncLog({
      entityType,
      entityId,
      entityCode,
      platform: 'OPENG2P',
      targetModel,
      syncStatus: 'FAILED',
      requestPayload: targetPayload,
      responsePayload: null,
      errorMessage: error.message,
    });
  }
}

/**
 * Get count of sync states grouped by platform
 */
export async function getSyncStatus() {
  const logs = await PlatformSync.find().lean();
  const status = {
    odoo: { total: 0, synced: 0, failed: 0, pending: 0, demo: 0 },
    openg2p: { total: 0, synced: 0, failed: 0, pending: 0, demo: 0 },
    wso2: { total: 0, synced: 0, failed: 0, pending: 0, demo: 0 },
  };

  logs.forEach((log) => {
    const plat = log.platform.toLowerCase();
    const stat = log.syncStatus.toLowerCase();
    if (status[plat]) {
      status[plat].total++;
      if (stat === 'synced' || stat === 'fallback_synced') status[plat].synced++;
      else if (stat === 'failed') status[plat].failed++;
      else if (stat === 'pending') status[plat].pending++;
      else if (stat === 'demo_mode') status[plat].demo++;
    }
  });

  return status;
}

/**
 * Get sync logs list
 */
export async function getSyncLogs() {
  return await PlatformSync.find().sort({ lastSyncAt: -1 }).lean();
}

/**
 * Sync Farmer to Odoo (res.partner)
 */
export async function syncFarmerToOdoo(farmerId) {
  const farmer = await Farmer.findById(farmerId);
  if (!farmer) {
    throw new Error('Farmer not found');
  }

  const partnerPayload = {
    name: farmer.fullName,
    ref: farmer.farmerCode,
    vat: farmer.nationalId,
    mobile: farmer.mobileNumber,
    street: farmer.gnDivision || '',
    city: farmer.district,
    comment: `Farmer Type: ${farmer.farmerType}, Verification Status: ${farmer.verificationStatus}`,
  };
  const registryPayload = {
    farmer_code: farmer.farmerCode,
    full_name: farmer.fullName,
    national_id: farmer.nationalId,
    mobile_number: farmer.mobileNumber,
    district: farmer.district,
    gn_division: farmer.gnDivision || '',
    farmer_type: farmer.farmerType,
    verification_status: farmer.verificationStatus,
    registered_by: farmer.registeredBy,
    external_mongo_id: farmer._id.toString(),
  };

  const model = config.odooFarmerModel;
  const mode = config.odooEnabled ? 'SYNCED' : 'DEMO_MODE';

  try {
    let externalId = '';
    let response = null;
    let targetModel = model;
    let requestPayload = registryPayload;

    if (config.odooEnabled) {
      const registryModelExists = await odooClient.checkModelExists(model);
      if (registryModelExists) {
        const upsert = await odooClient.upsertByField(model, 'farmer_code', farmer.farmerCode, registryPayload);
        externalId = String(upsert.id);
        response = { success: true, action: upsert.action, odooId: upsert.id, model };
      } else {
        targetModel = 'res.partner';
        requestPayload = partnerPayload;
        const existing = await odooClient.searchRead(targetModel, [['ref', '=', farmer.farmerCode]], ['id']);
        if (existing && existing.length > 0) {
          externalId = String(existing[0].id);
          await odooClient.write(targetModel, existing[0].id, partnerPayload);
          response = { success: true, action: 'updated', odooId: existing[0].id, model: targetModel };
        } else {
          const newId = await odooClient.create(targetModel, partnerPayload);
          externalId = String(newId);
          response = { success: true, action: 'created', odooId: newId, model: targetModel };
        }
      }
    } else {
      externalId = `DEMO-ODOO-FARMER-${farmer.farmerCode}`;
      response = { success: true, mode: 'demo', simulatedId: externalId };
    }

    const log = await createOrUpdateSyncLog({
      entityType: 'FARMER',
      entityId: farmer._id.toString(),
      entityCode: farmer.farmerCode,
      platform: 'ODOO',
      targetModel,
      syncStatus: mode,
      requestPayload,
      responsePayload: response,
      targetExternalId: externalId,
    });

    return log;
  } catch (error) {
    const log = await createOrUpdateSyncLog({
      entityType: 'FARMER',
      entityId: farmer._id.toString(),
      entityCode: farmer.farmerCode,
      platform: 'ODOO',
      targetModel: model,
      syncStatus: 'FAILED',
      requestPayload: registryPayload,
      responsePayload: null,
      errorMessage: error.message,
    });
    return log;
  }
}

/**
 * Sync Farmer to OpenG2P (Registrant / Beneficiary)
 */
export async function syncFarmerToOpenG2P(farmerId) {
  const farmer = await Farmer.findById(farmerId);
  if (!farmer) {
    throw new Error('Farmer not found');
  }

  const payload = {
    name: farmer.fullName,
    ref: farmer.farmerCode,
    vat: farmer.nationalId,
    mobile: farmer.mobileNumber,
    street: farmer.gnDivision || '',
    city: farmer.district,
    comment: `G2P Registrant. Type: ${farmer.farmerType}`,
  };
  const registryPayload = {
    farmer_code: farmer.farmerCode,
    full_name: farmer.fullName,
    national_id: farmer.nationalId,
    mobile_number: farmer.mobileNumber,
    district: farmer.district,
    gn_division: farmer.gnDivision || '',
    farmer_type: farmer.farmerType,
    verification_status: farmer.verificationStatus,
    registered_by: farmer.registeredBy,
    external_mongo_id: farmer._id.toString(),
  };

  const model = config.openG2PRegistrantModel;
  const mode = config.openG2PEnabled ? 'SYNCED' : 'DEMO_MODE';

  try {
    let externalId = '';
    let response = null;
    let targetModelUsed = model;
    let warning = '';
    let syncStatus = mode;
    let requestPayload = config.openG2PEnabled ? registryPayload : payload;

    if (config.openG2PEnabled) {
      const exists = await openG2PClient.checkModelExists(model);
      if (exists) {
        const lookupField = model === 'res.partner' ? 'ref' : 'farmer_code';
        const writePayload = model === 'res.partner' ? payload : registryPayload;
        requestPayload = writePayload;
        const existing = await openG2PClient.searchRead(model, [[lookupField, '=', farmer.farmerCode]], ['id']);
        if (existing.length > 0) {
          await openG2PClient.writeRecord(model, existing[0].id, writePayload);
          externalId = String(existing[0].id);
          response = { success: true, action: 'updated', openG2PId: existing[0].id };
        } else {
          const newId = await openG2PClient.createRecord(model, writePayload);
          externalId = String(newId);
          response = { success: true, action: 'created', openG2PId: newId };
        }
        targetModelUsed = model;
      } else {
        targetModelUsed = config.openG2PFallbackModel;
        requestPayload = payload;
        const fallback = await openG2PClient.upsertVisibleFallbackRecord(payload, targetModelUsed);
        externalId = `G2P-FALLBACK-PARTNER-${fallback.id}`;
        warning = OPENG2P_FALLBACK_MESSAGE;
        response = { success: true, mode: 'visible_fallback', action: fallback.action, partnerId: fallback.id };
        syncStatus = 'FALLBACK_SYNCED';
      }
    } else {
      externalId = `DEMO-G2P-REGISTRANT-${farmer.farmerCode}`;
      response = { success: true, mode: 'demo', simulatedId: externalId };
    }

    const log = await createOrUpdateSyncLog({
      entityType: 'FARMER',
      entityId: farmer._id.toString(),
      entityCode: farmer.farmerCode,
      platform: 'OPENG2P',
      targetModel: targetModelUsed,
      syncStatus: syncStatus,
      requestPayload,
      responsePayload: response,
      targetExternalId: externalId,
      errorMessage: warning,
    });

    return log;
  } catch (error) {
    const log = await createOrUpdateSyncLog({
      entityType: 'FARMER',
      entityId: farmer._id.toString(),
      entityCode: farmer.farmerCode,
      platform: 'OPENG2P',
      targetModel: model,
      syncStatus: 'FAILED',
      requestPayload: payload,
      responsePayload: null,
      errorMessage: error.message,
    });
    return log;
  }
}

/**
 * Sync Farm to OpenG2P
 */
export async function syncFarmToOpenG2P(farmId) {
  const farm = await Farm.findById(farmId);
  if (!farm) {
    throw new Error('Farm not found');
  }

  const payload = {
    name: `${farm.farmerName} Farm ${farm.farmCode}`,
    ref: farm.farmCode,
    street: farm.gnDivision || '',
    city: farm.district || '',
    comment: `Ownership: ${farm.ownershipType}, Size: ${farm.landSize} ${farm.landSizeUnit}, Farmer Ref: ${farm.farmerCode}`,
  };
  const registryPayload = {
    farm_code: farm.farmCode,
    farmer_code: farm.farmerCode,
    farmer_name: farm.farmerName,
    district: farm.district,
    gn_division: farm.gnDivision,
    ownership_type: farm.ownershipType,
    land_size: farm.landSize,
    land_size_unit: farm.landSizeUnit,
    verification_status: farm.verificationStatus,
    external_mongo_id: farm._id.toString(),
  };

  return await syncOpenG2PRecord({
    entityType: 'FARM',
    entityId: farm._id.toString(),
    entityCode: farm.farmCode,
    targetModel: config.openG2PFarmModel,
    targetPayload: registryPayload,
    targetLookupField: 'farm_code',
    fallbackPayload: {
      ...payload,
      comment: `AgriRegistry Farm\n${payload.comment}\nDistrict: ${farm.district}\nGN Division: ${farm.gnDivision}\nVerification: ${farm.verificationStatus}`,
    },
    fallbackExternalPrefix: 'G2P-FALLBACK-FARM',
    realResponseKey: 'farmId',
  });
}

/**
 * Sync Crop to OpenG2P
 */
export async function syncCropToOpenG2P(cropId) {
  const crop = await Crop.findById(cropId);
  if (!crop) {
    throw new Error('Crop not found');
  }

  const payload = {
    name: `${crop.cropType} ${crop.season} ${crop.seasonYear} - ${crop.cropCode}`,
    ref: crop.cropCode,
    comment: `Season: ${crop.season}, Expected Yield: ${crop.expectedYield} ${crop.expectedYieldUnit}, Farm Ref: ${crop.farmCode}`,
  };
  const registryPayload = {
    crop_code: crop.cropCode,
    farm_code: crop.farmCode,
    farmer_code: crop.farmerCode,
    crop_type: crop.cropType,
    season: crop.season,
    season_year: crop.seasonYear,
    cultivation_area: crop.cultivationArea,
    cultivation_area_unit: crop.cultivationAreaUnit,
    expected_yield: crop.expectedYield,
    verification_status: crop.verificationStatus,
    external_mongo_id: crop._id.toString(),
  };

  return await syncOpenG2PRecord({
    entityType: 'CROP',
    entityId: crop._id.toString(),
    entityCode: crop.cropCode,
    targetModel: config.openG2PCropModel,
    targetPayload: registryPayload,
    targetLookupField: 'crop_code',
    fallbackPayload: {
      ...payload,
      city: '',
      comment: `AgriRegistry Crop\n${payload.comment}\nFarmer: ${crop.farmerName} (${crop.farmerCode})\nArea: ${crop.cultivationArea} ${crop.cultivationAreaUnit}\nStatus: ${crop.cropStatus}\nVerification: ${crop.verificationStatus}`,
    },
    fallbackExternalPrefix: 'G2P-FALLBACK-CROP',
    realResponseKey: 'cropId',
  });
}

/**
 * Sync Program Enrollment to OpenG2P
 */
export async function syncEnrollmentToOpenG2P(enrollmentId) {
  const enrollment = await Enrollment.findById(enrollmentId);
  if (!enrollment) {
    throw new Error('Enrollment not found');
  }

  const payload = {
    enrollment_code: enrollment.enrollmentCode,
    eligibility_code: enrollment.eligibilityCode,
    farmer_code: enrollment.farmerCode,
    program_code: enrollment.programCode,
    program_name: enrollment.programName,
    entitlement: enrollment.entitlement,
    enrollment_status: enrollment.enrollmentStatus,
    approval_status: enrollment.approvalStatus,
    enrolled_by: enrollment.enrolledBy,
    external_mongo_id: enrollment._id.toString(),
  };

  return await syncOpenG2PRecord({
    entityType: 'ENROLLMENT',
    entityId: enrollment._id.toString(),
    entityCode: enrollment.enrollmentCode,
    targetModel: config.openG2PEnrollmentModel,
    targetPayload: payload,
    targetLookupField: 'enrollment_code',
    fallbackPayload: {
      name: `${enrollment.enrollmentCode} - ${enrollment.farmerName} - ${enrollment.programName}`,
      ref: enrollment.enrollmentCode,
      city: '',
      comment: `AgriRegistry Enrollment\nProgram: ${enrollment.programName} (${enrollment.programCode})\nFarmer: ${enrollment.farmerName} (${enrollment.farmerCode})\nFarm: ${enrollment.farmCode}\nCrop: ${enrollment.cropCode}\nEligibility: ${enrollment.eligibilityCode}\nEntitlement: ${enrollment.entitlement}\nEnrollment Status: ${enrollment.enrollmentStatus}\nApproval Status: ${enrollment.approvalStatus}`,
    },
    fallbackExternalPrefix: 'G2P-FALLBACK-ENROLL',
    realResponseKey: 'openG2PEnrollmentId',
  });
}

/**
 * Sync Eligibility to OpenG2P
 */
export async function syncEligibilityToOpenG2P(eligibilityId) {
  const eligibility = await Eligibility.findById(eligibilityId);
  if (!eligibility) {
    throw new Error('Eligibility check not found');
  }

  const payload = {
    eligibility_code: eligibility.eligibilityCode,
    farmer_code: eligibility.farmerCode,
    farm_code: eligibility.farmCode,
    crop_code: eligibility.cropCode,
    program_code: eligibility.programCode,
    program_name: eligibility.programName,
    eligibility_status: eligibility.eligibilityStatus,
    recommended_entitlement: eligibility.recommendedEntitlement,
    checked_by: eligibility.checkedBy,
    external_mongo_id: eligibility._id.toString(),
  };

  return await syncOpenG2PRecord({
    entityType: 'ELIGIBILITY',
    entityId: eligibility._id.toString(),
    entityCode: eligibility.eligibilityCode,
    targetModel: config.openG2PEligibilityModel,
    targetPayload: payload,
    targetLookupField: 'eligibility_code',
    fallbackPayload: {
      name: `${eligibility.eligibilityCode} - ${eligibility.programName} - ${eligibility.eligibilityStatus}`,
      ref: eligibility.eligibilityCode,
      city: '',
      comment: `AgriRegistry Eligibility\nProgram: ${eligibility.programName} (${eligibility.programCode})\nFarmer: ${eligibility.farmerName} (${eligibility.farmerCode})\nFarm: ${eligibility.farmCode}\nCrop: ${eligibility.cropCode}\nStatus: ${eligibility.eligibilityStatus}\nRecommended Entitlement: ${eligibility.recommendedEntitlement}\nRules: ${formatRuleResults(eligibility.ruleResults) || 'N/A'}\nFailure Reasons: ${eligibility.failureReasons?.join('; ') || 'N/A'}`,
    },
    fallbackExternalPrefix: 'G2P-FALLBACK-ELIG',
    realResponseKey: 'openG2PEligibilityId',
  });
}

/**
 * Sync Inventory Reservation to Odoo
 */
export async function syncReservationToOdoo(reservationId) {
  const reservation = await InventoryReservation.findById(reservationId);
  if (!reservation) {
    throw new Error('Inventory Reservation not found');
  }

  const fallbackPayload = {
    name: `Reservation: ${reservation.reservationCode} - ${reservation.itemName}`,
    ref: reservation.reservationCode,
    comment: [
      `AgriRegistry Inventory Reservation`,
      `Reservation: ${reservation.reservationCode}`,
      `Enrollment: ${reservation.enrollmentCode}`,
      `Farmer: ${reservation.farmerName} (${reservation.farmerCode})`,
      `Farm: ${reservation.farmCode}`,
      `Crop: ${reservation.cropCode}`,
      `Program: ${reservation.programName}`,
      `Entitlement: ${reservation.entitlement}`,
      `Item: ${reservation.itemName} (${reservation.itemCode})`,
      `Quantity: ${reservation.reservedQuantity} ${reservation.unit}`,
      `Warehouse: ${reservation.warehouseName}`,
      `Status: ${reservation.reservationStatus}`,
    ].join('\n'),
  };
  const registryPayload = {
    name: reservation.reservationCode,
    reservation_code: reservation.reservationCode,
    enrollment_code: reservation.enrollmentCode,
    farmer_code: reservation.farmerCode,
    farmer_name: reservation.farmerName,
    farm_code: reservation.farmCode,
    crop_code: reservation.cropCode,
    program_name: reservation.programName,
    entitlement: reservation.entitlement,
    item_code: reservation.itemCode,
    item_name: reservation.itemName,
    reserved_quantity: reservation.reservedQuantity,
    quantity_unit: reservation.unit,
    warehouse_name: reservation.warehouseName,
    reservation_status: reservation.reservationStatus,
    reserved_by: reservation.reservedBy,
    notes: reservation.notes || '',
    reserved_at: formatOdooDatetime(reservation.reservedAt),
    issued_at: reservation.reservationStatus === 'ISSUED' ? formatOdooDatetime(reservation.updatedAt) : false,
    external_mongo_id: reservation._id.toString(),
  };

  const model = config.odooReservationModel;
  const mode = config.odooEnabled ? 'SYNCED' : 'DEMO_MODE';

  try {
    let externalId = '';
    let response = null;
    let warning = '';
    let syncStatus = mode;
    let targetModel = model;
    let requestPayload = registryPayload;

    if (config.odooEnabled) {
      const registryModelExists = await odooClient.checkModelExists(model);
      if (registryModelExists) {
        try {
          const upsert = await odooClient.upsertByField(model, 'reservation_code', reservation.reservationCode, registryPayload);
          externalId = `ODOO-RESERVE-${upsert.id}`;
          response = { success: true, action: upsert.action, odooId: upsert.id, model };
        } catch (targetError) {
          targetModel = 'res.partner';
          requestPayload = fallbackPayload;
          const upsert = await odooClient.upsertByField(targetModel, 'ref', reservation.reservationCode, fallbackPayload);
          externalId = `ODOO-RESERVE-FALLBACK-${upsert.id}`;
          response = {
            success: true,
            mode: 'visible_fallback',
            action: upsert.action,
            odooId: upsert.id,
            model: targetModel,
            targetModelWriteError: targetError.message,
          };
          warning = `Odoo reservation custom model ${model} exists but could not accept the mapped payload, so a visible fallback res.partner record was upserted: ${targetError.message}`;
          syncStatus = 'FALLBACK_SYNCED';
        }
      } else {
        targetModel = 'res.partner';
        requestPayload = fallbackPayload;
        const upsert = await odooClient.upsertByField(targetModel, 'ref', reservation.reservationCode, fallbackPayload);
        externalId = `ODOO-RESERVE-FALLBACK-${upsert.id}`;
        response = { success: true, mode: 'visible_fallback', action: upsert.action, odooId: upsert.id, model: targetModel };
        warning = `Odoo reservation custom model ${model} was not detected, so a visible fallback res.partner record was upserted.`;
        syncStatus = 'FALLBACK_SYNCED';
      }
    } else {
      externalId = `DEMO-ODOO-RESERVE-${reservation.reservationCode}`;
      response = { success: true, mode: 'demo', simulatedId: externalId };
    }

    const log = await createOrUpdateSyncLog({
      entityType: 'INVENTORY_RESERVATION',
      entityId: reservation._id.toString(),
      entityCode: reservation.reservationCode,
      platform: 'ODOO',
      targetModel,
      syncStatus: syncStatus,
      requestPayload,
      responsePayload: response,
      targetExternalId: externalId,
      errorMessage: warning,
    });

    return log;
  } catch (error) {
    const log = await createOrUpdateSyncLog({
      entityType: 'INVENTORY_RESERVATION',
      entityId: reservation._id.toString(),
      entityCode: reservation.reservationCode,
      platform: 'ODOO',
      targetModel: model,
      syncStatus: 'FAILED',
      requestPayload: registryPayload,
      responsePayload: null,
      errorMessage: error.message,
    });
    return log;
  }
}

/**
 * Sync Inventory Items to Odoo custom module.
 */
export async function syncInventoryItemsToOdoo() {
  const items = await InventoryItem.find().sort({ itemCode: 1 });
  const results = [];

  for (const item of items) {
    const model = config.odooInventoryItemModel;
    const registryPayload = {
      name: item.itemCode,
      item_code: item.itemCode,
      item_name: item.itemName,
      category: item.category,
      available_quantity: item.availableQuantity,
      reserved_quantity: item.reservedQuantity,
      distributed_quantity: item.distributedQuantity,
      quantity_unit: item.unit,
      warehouse_name: item.warehouseName,
      status: item.status,
      external_mongo_id: item._id.toString(),
    };
    const fallbackPayload = {
      name: `Inventory Item: ${item.itemCode} - ${item.itemName}`,
      ref: item.itemCode,
      comment: [
        'AgriRegistry Inventory Item',
        `Item: ${item.itemName} (${item.itemCode})`,
        `Category: ${item.category}`,
        `Available: ${item.availableQuantity} ${item.unit}`,
        `Reserved: ${item.reservedQuantity} ${item.unit}`,
        `Distributed: ${item.distributedQuantity} ${item.unit}`,
        `Warehouse: ${item.warehouseName}`,
        `Status: ${item.status}`,
      ].join('\n'),
    };

    let targetModel = model;
    let requestPayload = registryPayload;
    let response = null;
    let externalId = '';
    let syncStatus = config.odooEnabled ? 'SYNCED' : 'DEMO_MODE';
    let warning = '';

    try {
      if (config.odooEnabled) {
        const modelExists = await odooClient.checkModelExists(model);
        if (modelExists) {
          try {
            const upsert = await odooClient.upsertByField(model, 'item_code', item.itemCode, registryPayload);
            externalId = `ODOO-ITEM-${upsert.id}`;
            response = { success: true, action: upsert.action, odooId: upsert.id, model };
          } catch (targetError) {
            targetModel = 'res.partner';
            requestPayload = fallbackPayload;
            const upsert = await odooClient.upsertByField(targetModel, 'ref', item.itemCode, fallbackPayload);
            externalId = `ODOO-ITEM-FALLBACK-${upsert.id}`;
            response = {
              success: true,
              mode: 'visible_fallback',
              action: upsert.action,
              odooId: upsert.id,
              model: targetModel,
              targetModelWriteError: targetError.message,
            };
            warning = `Odoo inventory item custom model ${model} exists but could not accept the mapped payload, so a visible fallback res.partner record was upserted: ${targetError.message}`;
            syncStatus = 'FALLBACK_SYNCED';
          }
        } else {
          targetModel = 'res.partner';
          requestPayload = fallbackPayload;
          const upsert = await odooClient.upsertByField(targetModel, 'ref', item.itemCode, fallbackPayload);
          externalId = `ODOO-ITEM-FALLBACK-${upsert.id}`;
          response = { success: true, mode: 'visible_fallback', action: upsert.action, odooId: upsert.id, model: targetModel };
          warning = `Odoo inventory item custom model ${model} was not detected, so a visible fallback res.partner record was upserted.`;
          syncStatus = 'FALLBACK_SYNCED';
        }
      } else {
        externalId = `DEMO-ODOO-ITEM-${item.itemCode}`;
        response = { success: true, mode: 'demo', simulatedId: externalId };
      }

      results.push(await createOrUpdateSyncLog({
        entityType: 'INVENTORY_ITEM',
        entityId: item._id.toString(),
        entityCode: item.itemCode,
        platform: 'ODOO',
        targetModel,
        syncStatus,
        requestPayload,
        responsePayload: response,
        targetExternalId: externalId,
        errorMessage: warning,
      }));
    } catch (error) {
      results.push(await createOrUpdateSyncLog({
        entityType: 'INVENTORY_ITEM',
        entityId: item._id.toString(),
        entityCode: item.itemCode,
        platform: 'ODOO',
        targetModel: model,
        syncStatus: 'FAILED',
        requestPayload: registryPayload,
        responsePayload: null,
        errorMessage: error.message,
      }));
    }
  }

  return results;
}

/**
 * Run a full demo sync:
 * Syncs the demo farmer Mohamed Ameen (or FARMER-0001) and all related entities.
 */
export async function syncFullDemoFlow() {
  const mode = (config.odooEnabled || config.openG2PEnabled) ? 'LIVE' : 'DEMO_MODE';
  const steps = [];

  // 1. Find demo farmer
  let farmer = await Farmer.findOne({ farmerCode: 'FARMER-0001' });
  if (!farmer) {
    farmer = await Farmer.findOne({ fullName: /Mohamed Ameen/i });
  }
  if (!farmer) {
    farmer = await Farmer.findOne();
  }

  if (!farmer) {
    throw new Error('No demo farmer found. Please register or seed a farmer first.');
  }

  // Sync farmer to Odoo
  const odooFarmerLog = await syncFarmerToOdoo(farmer._id);
  steps.push({
    step: 'Farmer → Odoo Contact/Partner',
    entityCode: farmer.farmerCode,
    platform: 'ODOO',
    targetModel: odooFarmerLog.targetModel || 'res.partner',
    syncMode: config.odooEnabled ? 'LIVE' : 'DEMO_MODE',
    syncStatus: odooFarmerLog.syncStatus,
    errorMessage: odooFarmerLog.errorMessage,
    requestPayload: odooFarmerLog.requestPayload,
    responsePayload: odooFarmerLog.responsePayload,
  });

  // Sync farmer to OpenG2P
  const g2pFarmerLog = await syncFarmerToOpenG2P(farmer._id);
  steps.push({
    step: 'Farmer → OpenG2P Registrant/Beneficiary',
    entityCode: farmer.farmerCode,
    platform: 'OPENG2P',
    targetModel: g2pFarmerLog.targetModel || config.openG2PRegistrantModel,
    syncMode: config.openG2PEnabled ? 'LIVE' : 'DEMO_MODE',
    syncStatus: g2pFarmerLog.syncStatus,
    errorMessage: g2pFarmerLog.errorMessage,
    requestPayload: g2pFarmerLog.requestPayload,
    responsePayload: g2pFarmerLog.responsePayload,
  });

  // 2. Find linked farm
  const farm = await Farm.findOne({ farmer: farmer._id });
  if (farm) {
    const farmLog = await syncFarmToOpenG2P(farm._id);
    steps.push({
      step: farmLog.syncStatus === 'FALLBACK_SYNCED'
        ? 'Farm → OpenG2P visible fallback record'
        : 'Farm → OpenG2P Agriculture Registry Extension',
      entityCode: farm.farmCode,
      platform: 'OPENG2P',
      targetModel: farmLog.targetModel || config.openG2PFarmModel,
      syncMode: config.openG2PEnabled ? 'LIVE' : 'DEMO_MODE',
      syncStatus: farmLog.syncStatus,
      errorMessage: farmLog.errorMessage,
      requestPayload: farmLog.requestPayload,
      responsePayload: farmLog.responsePayload,
    });

    // 3. Find linked crop
    const crop = await Crop.findOne({ farm: farm._id });
    if (crop) {
      const cropLog = await syncCropToOpenG2P(crop._id);
      steps.push({
        step: cropLog.syncStatus === 'FALLBACK_SYNCED'
          ? 'Crop → OpenG2P visible fallback record'
          : 'Crop → OpenG2P Agriculture Activity Extension',
        entityCode: crop.cropCode,
        platform: 'OPENG2P',
        targetModel: cropLog.targetModel || config.openG2PCropModel,
        syncMode: config.openG2PEnabled ? 'LIVE' : 'DEMO_MODE',
        syncStatus: cropLog.syncStatus,
        errorMessage: cropLog.errorMessage,
        requestPayload: cropLog.requestPayload,
        responsePayload: cropLog.responsePayload,
      });
    } else {
      steps.push({
        step: 'Crop → OpenG2P Agriculture Activity Extension',
        entityCode: 'N/A',
        platform: 'OPENG2P',
        targetModel: config.openG2PCropModel,
        syncMode: config.openG2PEnabled ? 'LIVE' : 'DEMO_MODE',
        syncStatus: 'DISABLED',
        errorMessage: 'No crop found for the demo farm.',
      });
    }
  } else {
    steps.push({
      step: 'Farm → OpenG2P Agriculture Registry Extension',
      entityCode: 'N/A',
      platform: 'OPENG2P',
      targetModel: config.openG2PFarmModel,
      syncMode: config.openG2PEnabled ? 'LIVE' : 'DEMO_MODE',
      syncStatus: 'DISABLED',
      errorMessage: 'No farm found for the demo farmer.',
    });
    steps.push({
      step: 'Crop → OpenG2P Agriculture Activity Extension',
      entityCode: 'N/A',
      platform: 'OPENG2P',
      targetModel: config.openG2PCropModel,
      syncMode: config.openG2PEnabled ? 'LIVE' : 'DEMO_MODE',
      syncStatus: 'DISABLED',
      errorMessage: 'No farm or crop found for the demo farmer.',
    });
  }

  // 4. Find latest eligible eligibility check and sync it to OpenG2P
  const eligibility = await Eligibility.findOne({
    farmer: farmer._id,
    eligibilityStatus: 'ELIGIBLE',
  }).sort({ checkedAt: -1, createdAt: -1 });

  if (eligibility) {
    const eligibilityLog = await syncEligibilityToOpenG2P(eligibility._id);
    steps.push({
      step: eligibilityLog.syncStatus === 'FALLBACK_SYNCED'
        ? 'Eligibility → OpenG2P visible fallback record'
        : 'Eligibility → OpenG2P eligibility model',
      entityCode: eligibility.eligibilityCode,
      platform: 'OPENG2P',
      targetModel: eligibilityLog.targetModel || config.openG2PEligibilityModel,
      syncMode: config.openG2PEnabled ? 'LIVE' : 'DEMO_MODE',
      syncStatus: eligibilityLog.syncStatus,
      errorMessage: eligibilityLog.errorMessage,
      requestPayload: eligibilityLog.requestPayload,
      responsePayload: eligibilityLog.responsePayload,
    });
  } else {
    steps.push({
      step: 'Eligibility → OpenG2P visible fallback record',
      entityCode: 'N/A',
      platform: 'OPENG2P',
      targetModel: config.openG2PEligibilityModel,
      syncMode: config.openG2PEnabled ? 'LIVE' : 'DEMO_MODE',
      syncStatus: 'DISABLED',
      errorMessage: 'No eligible eligibility check found for FARMER-0001.',
    });
  }

  // 5. Find program enrollment
  const enrollment = await Enrollment.findOne({ farmer: farmer._id }).sort({ enrollmentDate: -1, createdAt: -1 });
  if (enrollment) {
    const enrollmentLog = await syncEnrollmentToOpenG2P(enrollment._id);
    steps.push({
      step: enrollmentLog.syncStatus === 'FALLBACK_SYNCED'
        ? 'Enrollment → OpenG2P visible fallback record'
        : 'Enrollment → OpenG2P Program Enrollment',
      entityCode: enrollment.enrollmentCode,
      platform: 'OPENG2P',
      targetModel: enrollmentLog.targetModel || config.openG2PEnrollmentModel,
      syncMode: config.openG2PEnabled ? 'LIVE' : 'DEMO_MODE',
      syncStatus: enrollmentLog.syncStatus,
      errorMessage: enrollmentLog.errorMessage,
      requestPayload: enrollmentLog.requestPayload,
      responsePayload: enrollmentLog.responsePayload,
    });

    // 6. Find linked inventory reservation
    const reservation = await InventoryReservation.findOne({ enrollment: enrollment._id });
    if (reservation) {
      const inventoryItem = await InventoryItem.findOne({ itemCode: reservation.itemCode });
      if (inventoryItem) {
        const itemLogs = await syncInventoryItemsToOdoo();
        const itemLog = itemLogs.find((log) => log.entityCode === inventoryItem.itemCode);
        steps.push({
          step: 'Inventory Item → Odoo Inventory Item',
          entityCode: inventoryItem.itemCode,
          platform: 'ODOO',
          targetModel: itemLog?.targetModel || config.odooInventoryItemModel,
          syncMode: config.odooEnabled ? 'LIVE' : 'DEMO_MODE',
          syncStatus: itemLog?.syncStatus || 'DISABLED',
          errorMessage: itemLog?.errorMessage || '',
          requestPayload: itemLog?.requestPayload,
          responsePayload: itemLog?.responsePayload,
        });
      } else {
        steps.push({
          step: 'Inventory Item → Odoo Inventory Item',
          entityCode: reservation.itemCode || 'N/A',
          platform: 'ODOO',
          targetModel: config.odooInventoryItemModel,
          syncMode: config.odooEnabled ? 'LIVE' : 'DEMO_MODE',
          syncStatus: 'DISABLED',
          errorMessage: 'No inventory item found for the reservation item code.',
        });
      }

      const reservationLog = await syncReservationToOdoo(reservation._id);
      steps.push({
        step: 'Reservation → Odoo Inventory Fulfilment',
        entityCode: reservation.reservationCode,
        platform: 'ODOO',
        targetModel: reservationLog.targetModel || config.odooReservationModel,
        syncMode: config.odooEnabled ? 'LIVE' : 'DEMO_MODE',
        syncStatus: reservationLog.syncStatus,
        errorMessage: reservationLog.errorMessage,
        requestPayload: reservationLog.requestPayload,
        responsePayload: reservationLog.responsePayload,
      });
    } else {
      steps.push({
        step: 'Inventory Item → Odoo Inventory Item',
        entityCode: 'N/A',
        platform: 'ODOO',
        targetModel: config.odooInventoryItemModel,
        syncMode: config.odooEnabled ? 'LIVE' : 'DEMO_MODE',
        syncStatus: 'DISABLED',
        errorMessage: 'No reservation found to identify the inventory item.',
      });
      steps.push({
        step: 'Reservation → Odoo Inventory Fulfilment',
        entityCode: 'N/A',
        platform: 'ODOO',
        targetModel: config.odooReservationModel,
        syncMode: config.odooEnabled ? 'LIVE' : 'DEMO_MODE',
        syncStatus: 'DISABLED',
        errorMessage: 'No reservation found for the program enrollment.',
      });
    }
  } else {
    steps.push({
      step: 'Enrollment → OpenG2P visible fallback record',
      entityCode: 'N/A',
      platform: 'OPENG2P',
      targetModel: config.openG2PEnrollmentModel,
      syncMode: config.openG2PEnabled ? 'LIVE' : 'DEMO_MODE',
      syncStatus: 'DISABLED',
      errorMessage: 'No enrollment found. Create or approve Program Enrollment before syncing enrollment.',
    });
    steps.push({
      step: 'Inventory Item → Odoo Inventory Item',
      entityCode: 'N/A',
      platform: 'ODOO',
      targetModel: config.odooInventoryItemModel,
      syncMode: config.odooEnabled ? 'LIVE' : 'DEMO_MODE',
      syncStatus: 'DISABLED',
      errorMessage: 'No enrollment or reservation found.',
    });
    steps.push({
      step: 'Reservation → Odoo Inventory Fulfilment',
      entityCode: 'N/A',
      platform: 'ODOO',
      targetModel: config.odooReservationModel,
      syncMode: config.odooEnabled ? 'LIVE' : 'DEMO_MODE',
      syncStatus: 'DISABLED',
      errorMessage: 'No enrollment or reservation found.',
    });
  }

  // 6. Record WSO2 readiness simulation log
  const wso2Log = await createOrUpdateSyncLog({
    entityType: 'ENROLLMENT',
    entityId: farmer._id.toString(),
    entityCode: 'WSO2-API-GATEWAY',
    platform: 'WSO2',
    targetModel: 'APIM',
    syncStatus: config.wso2Enabled ? 'SYNCED' : 'DEMO_MODE',
    requestPayload: { gatewayContexts: [config.wso2RegistryApiContext, config.wso2ProgramApiContext, config.wso2InventoryApiContext] },
    responsePayload: { status: 'Gateway Ready' },
  });

  steps.push({
    step: 'APIs → WSO2 Gateway Publishing Readiness',
    entityCode: 'API-GATEWAY',
    platform: 'WSO2',
    targetModel: 'APIM',
    syncMode: config.wso2Enabled ? 'LIVE' : 'DEMO_MODE',
    syncStatus: wso2Log.syncStatus,
    errorMessage: '',
    requestPayload: wso2Log.requestPayload,
    responsePayload: wso2Log.responsePayload,
  });

  return {
    mode,
    steps,
  };
}

/**
 * Check connection to Odoo
 */
export async function checkOdooConnection() {
  return await odooClient.checkConnection();
}

/**
 * Check connection to OpenG2P
 */
export async function checkOpenG2PConnection() {
  return await openG2PClient.checkConnection();
}

/**
 * Discover configured OpenG2P model availability.
 */
export async function discoverOpenG2PModels() {
  return await openG2PClient.discoverConfiguredModels();
}

/**
 * Check connection to WSO2 API Gateway base URL
 */
export async function checkWso2Connection() {
  if (!config.wso2Enabled) {
    return {
      success: true,
      platform: 'WSO2',
      enabled: false,
      status: 'DISABLED',
      baseUrl: config.wso2GatewayBaseUrl,
      message: 'WSO2 integration is disabled in configuration',
    };
  }

  const probeUrl = (url) =>
    new Promise((resolve) => {
      const parsed = new URL(url);
      const client = parsed.protocol === 'https:' ? https : http;
      const req = client.request(
        parsed,
        {
          method: 'GET',
          timeout: 4000,
          rejectUnauthorized: false,
        },
        (res) => {
          res.resume();
          res.on('end', () => resolve({ reachable: true, statusCode: res.statusCode }));
        }
      );

      req.on('timeout', () => {
        req.destroy(new Error('Connection check timed out: service took too long to respond.'));
      });
      req.on('error', (error) => resolve({ reachable: false, error }));
      req.end();
    });

  const gatewayCheck = await probeUrl(config.wso2GatewayBaseUrl);
  if (gatewayCheck.reachable) {
    return {
      success: true,
      platform: 'WSO2',
      enabled: true,
      status: 'CONNECTED',
      baseUrl: config.wso2GatewayBaseUrl,
      message: `Successfully reached WSO2 Gateway (HTTP ${gatewayCheck.statusCode}).`,
    };
  }

  const apimCheck = await probeUrl(config.wso2ApimBaseUrl);
  if (apimCheck.reachable) {
    return {
      success: true,
      platform: 'WSO2',
      enabled: true,
      status: 'READY_FOR_PUBLISHING',
      baseUrl: config.wso2GatewayBaseUrl,
      message: `WSO2 API Manager is reachable (HTTP ${apimCheck.statusCode}); gateway APIs may still need to be imported and published.`,
    };
  }

  return {
    success: true,
    platform: 'WSO2',
    enabled: true,
    status: 'FAILED',
    baseUrl: config.wso2GatewayBaseUrl,
    message: `Connection failed: gateway ${gatewayCheck.error?.message || 'unreachable'}; API Manager ${apimCheck.error?.message || 'unreachable'}.`,
  };
}

/**
 * Check demo readiness across all platform modules
 */
export async function getDemoReadiness() {
  const backendStatus = 'READY';
  const mongoStatus = mongoose.connection.readyState === 1 ? 'READY' : 'FAILED';

  let odooStatus = 'DISABLED';
  if (config.odooEnabled) {
    const check = await odooClient.checkConnection();
    odooStatus = check.status;
  } else {
    odooStatus = 'DEMO_MODE';
  }

  let openG2PStatus = 'DISABLED';
  if (config.openG2PEnabled) {
    const check = await openG2PClient.checkConnection();
    openG2PStatus = check.status;
  } else {
    openG2PStatus = 'DEMO_MODE';
  }

  let wso2Status = 'DISABLED';
  if (config.wso2Enabled) {
    const check = await checkWso2Connection();
    wso2Status = check.status === 'CONNECTED' ? 'PUBLISHED' : check.status;
  } else {
    wso2Status = 'READY_FOR_PUBLISHING';
  }

  return {
    backend: backendStatus,
    mongodb: mongoStatus,
    odoo: odooStatus,
    openG2P: openG2PStatus,
    wso2: wso2Status,
    fullDemoFlow: backendStatus === 'READY' && mongoStatus === 'READY' ? 'READY' : 'NOT_READY',
    clientDemoMessage: 'AgriRegistry360 can sync registry data to Odoo/OpenG2P and expose APIs through WSO2 API Manager.',
  };
}
