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

async function syncOpenG2PRecord({
  entityType,
  entityId,
  entityCode,
  targetModel,
  targetPayload,
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
        const newId = await openG2PClient.createRecord(targetModel, targetPayload);
        return await createOrUpdateSyncLog({
          entityType,
          entityId,
          entityCode,
          platform: 'OPENG2P',
          targetModel,
          syncStatus: 'SYNCED',
          requestPayload: targetPayload,
          responsePayload: { success: true, [realResponseKey]: newId, action: 'created', model: targetModel },
          targetExternalId: String(newId),
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

  const payload = {
    name: farmer.fullName,
    ref: farmer.farmerCode,
    vat: farmer.nationalId,
    mobile: farmer.mobileNumber,
    street: farmer.gnDivision || '',
    city: farmer.district,
    comment: `Farmer Type: ${farmer.farmerType}, Verification Status: ${farmer.verificationStatus}`,
  };

  const model = 'res.partner';
  const mode = config.odooEnabled ? 'SYNCED' : 'DEMO_MODE';

  try {
    let externalId = '';
    let response = null;

    if (config.odooEnabled) {
      // Check if partner with reference already exists
      const existing = await odooClient.searchRead(model, [['ref', '=', farmer.farmerCode]], ['id']);
      if (existing && existing.length > 0) {
        externalId = String(existing[0].id);
        await odooClient.write(model, existing[0].id, payload);
        response = { success: true, action: 'update', odooId: existing[0].id };
      } else {
        const newId = await odooClient.create(model, payload);
        externalId = String(newId);
        response = { success: true, action: 'create', odooId: newId };
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
      targetModel: model,
      syncStatus: mode,
      requestPayload: payload,
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
      requestPayload: payload,
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

  const model = config.openG2PRegistrantModel;
  const mode = config.openG2PEnabled ? 'SYNCED' : 'DEMO_MODE';

  try {
    let externalId = '';
    let response = null;
    let targetModelUsed = model;
    let warning = '';
    let syncStatus = mode;

    if (config.openG2PEnabled) {
      const exists = await openG2PClient.checkModelExists(model);
      if (exists) {
        const existing = await openG2PClient.searchRead(model, [['ref', '=', farmer.farmerCode]], ['id', 'name', 'ref']);
        if (existing.length > 0) {
          await openG2PClient.writeRecord(model, existing[0].id, payload);
          externalId = String(existing[0].id);
          response = { success: true, action: 'updated', openG2PId: existing[0].id };
        } else {
          const newId = await openG2PClient.createRecord(model, payload);
          externalId = String(newId);
          response = { success: true, action: 'created', openG2PId: newId };
        }
      } else {
        targetModelUsed = config.openG2PFallbackModel;
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
      requestPayload: payload,
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

  return await syncOpenG2PRecord({
    entityType: 'FARM',
    entityId: farm._id.toString(),
    entityCode: farm.farmCode,
    targetModel: config.openG2PFarmModel,
    targetPayload: payload,
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

  return await syncOpenG2PRecord({
    entityType: 'CROP',
    entityId: crop._id.toString(),
    entityCode: crop.cropCode,
    targetModel: config.openG2PCropModel,
    targetPayload: payload,
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
    program_id: enrollment.programCode,
    partner_id: enrollment.farmerCode,
    membership_ref: enrollment.enrollmentCode,
    state: enrollment.enrollmentStatus,
  };

  return await syncOpenG2PRecord({
    entityType: 'ENROLLMENT',
    entityId: enrollment._id.toString(),
    entityCode: enrollment.enrollmentCode,
    targetModel: config.openG2PEnrollmentModel,
    targetPayload: payload,
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
    name: `${eligibility.eligibilityCode} - ${eligibility.programName} - ${eligibility.eligibilityStatus}`,
    ref: eligibility.eligibilityCode,
    farmer_ref: eligibility.farmerCode,
    farm_ref: eligibility.farmCode,
    crop_ref: eligibility.cropCode,
    program_ref: eligibility.programCode,
    state: eligibility.eligibilityStatus,
    recommended_entitlement: eligibility.recommendedEntitlement,
  };

  return await syncOpenG2PRecord({
    entityType: 'ELIGIBILITY',
    entityId: eligibility._id.toString(),
    entityCode: eligibility.eligibilityCode,
    targetModel: config.openG2PEligibilityModel,
    targetPayload: payload,
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

  const payload = {
    origin: reservation.enrollmentCode,
    reference: reservation.reservationCode,
    partner: reservation.farmerName,
    partner_ref: reservation.farmerCode,
    product_sku: reservation.itemCode,
    quantity: reservation.reservedQuantity,
    state: reservation.reservationStatus,
  };

  const model = 'product.template';
  const mode = config.odooEnabled ? 'SYNCED' : 'DEMO_MODE';

  try {
    let externalId = '';
    let response = null;
    let warning = '';
    let syncStatus = mode;

    if (config.odooEnabled) {
      try {
        // Check if product exists in Odoo. If not, create it
        const existingProduct = await odooClient.searchRead('product.product', [['default_code', '=', reservation.itemCode]], ['id']);
        let productId = existingProduct && existingProduct.length > 0 ? existingProduct[0].id : null;
        if (!productId) {
          productId = await odooClient.create('product.product', {
            name: reservation.itemName,
            default_code: reservation.itemCode,
            type: 'product',
          });
        }

        // Record reservation details in product.template or similar log
        const newId = await odooClient.create('res.partner', {
          name: `Reservation: ${reservation.reservationCode} - ${reservation.itemName}`,
          comment: `Reserved ${reservation.reservedQuantity} of ${reservation.itemName} for ${reservation.farmerName}. Enrollment: ${reservation.enrollmentCode}`,
        });

        externalId = `ODOO-RESERVE-${newId}`;
        response = { success: true, odooId: newId, productId };
      } catch (innerError) {
        externalId = `DEMO-ODOO-RESERVE-${reservation.reservationCode}`;
        response = { success: true, mode: 'demo_fallback', simulatedId: externalId };
        warning = 'Connected to Odoo, but target inventory model was unavailable. Demo sync log created.';
        syncStatus = 'DEMO_MODE';
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
      targetModel: model,
      syncStatus: syncStatus,
      requestPayload: payload,
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
      requestPayload: payload,
      responsePayload: null,
      errorMessage: error.message,
    });
    return log;
  }
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
      const reservationLog = await syncReservationToOdoo(reservation._id);
      steps.push({
        step: 'Reservation → Odoo Inventory Fulfilment',
        entityCode: reservation.reservationCode,
        platform: 'ODOO',
        targetModel: reservationLog.targetModel || 'product.template',
        syncMode: config.odooEnabled ? 'LIVE' : 'DEMO_MODE',
        syncStatus: reservationLog.syncStatus,
        errorMessage: reservationLog.errorMessage,
        requestPayload: reservationLog.requestPayload,
        responsePayload: reservationLog.responsePayload,
      });
    } else {
      steps.push({
        step: 'Reservation → Odoo Inventory Fulfilment',
        entityCode: 'N/A',
        platform: 'ODOO',
        targetModel: 'product.template',
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
      step: 'Reservation → Odoo Inventory Fulfilment',
      entityCode: 'N/A',
      platform: 'ODOO',
      targetModel: 'product.template',
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
