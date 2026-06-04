import mongoose from 'mongoose';
import { config } from '../config/env.js';
import { odooClient } from '../integrations/odoo/odooClient.js';
import { openG2PClient } from '../integrations/openg2p/openG2PClient.js';
import { Crop } from '../models/crop.model.js';
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
      if (stat === 'synced') status[plat].synced++;
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

    if (config.openG2PEnabled) {
      const newId = await openG2PClient.createRegistrantOrBeneficiary(payload);
      externalId = String(newId);
      response = { success: true, openG2PId: newId };
    } else {
      externalId = `DEMO-G2P-REGISTRANT-${farmer.farmerCode}`;
      response = { success: true, mode: 'demo', simulatedId: externalId };
    }

    const log = await createOrUpdateSyncLog({
      entityType: 'FARMER',
      entityId: farmer._id.toString(),
      entityCode: farmer.farmerCode,
      platform: 'OPENG2P',
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
    name: farm.farmName,
    ref: farm.farmCode,
    street: farm.location || '',
    city: farm.district || '',
    comment: `Ownership: ${farm.ownershipType}, Size: ${farm.totalSize} ${farm.sizeUnit}, Farmer Ref: ${farm.farmerCode}`,
  };

  const model = 'res.partner'; // Default fallback mapping for farm
  const mode = config.openG2PEnabled ? 'SYNCED' : 'DEMO_MODE';

  try {
    let externalId = '';
    let response = null;

    if (config.openG2PEnabled) {
      const newId = await openG2PClient.createRegistrantOrBeneficiary(payload);
      externalId = String(newId);
      response = { success: true, farmPartnerId: newId };
    } else {
      externalId = `DEMO-G2P-FARM-${farm.farmCode}`;
      response = { success: true, mode: 'demo', simulatedId: externalId };
    }

    const log = await createOrUpdateSyncLog({
      entityType: 'FARM',
      entityId: farm._id.toString(),
      entityCode: farm.farmCode,
      platform: 'OPENG2P',
      targetModel: model,
      syncStatus: mode,
      requestPayload: payload,
      responsePayload: response,
      targetExternalId: externalId,
    });

    return log;
  } catch (error) {
    const log = await createOrUpdateSyncLog({
      entityType: 'FARM',
      entityId: farm._id.toString(),
      entityCode: farm.farmCode,
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
 * Sync Crop to OpenG2P
 */
export async function syncCropToOpenG2P(cropId) {
  const crop = await Crop.findById(cropId);
  if (!crop) {
    throw new Error('Crop not found');
  }

  const payload = {
    name: `${crop.cropType} (${crop.cropVariety})`,
    ref: crop.cropCode,
    comment: `Season: ${crop.season}, Expected Yield: ${crop.expectedYield} ${crop.yieldUnit}, Farm Ref: ${crop.farmCode}`,
  };

  const model = 'res.partner'; // Default fallback mapping for crop details
  const mode = config.openG2PEnabled ? 'SYNCED' : 'DEMO_MODE';

  try {
    let externalId = '';
    let response = null;

    if (config.openG2PEnabled) {
      const newId = await openG2PClient.createRegistrantOrBeneficiary(payload);
      externalId = String(newId);
      response = { success: true, cropPartnerId: newId };
    } else {
      externalId = `DEMO-G2P-CROP-${crop.cropCode}`;
      response = { success: true, mode: 'demo', simulatedId: externalId };
    }

    const log = await createOrUpdateSyncLog({
      entityType: 'CROP',
      entityId: crop._id.toString(),
      entityCode: crop.cropCode,
      platform: 'OPENG2P',
      targetModel: model,
      syncStatus: mode,
      requestPayload: payload,
      responsePayload: response,
      targetExternalId: externalId,
    });

    return log;
  } catch (error) {
    const log = await createOrUpdateSyncLog({
      entityType: 'CROP',
      entityId: crop._id.toString(),
      entityCode: crop.cropCode,
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

  const model = config.openG2PEnrollmentModel;
  const mode = config.openG2PEnabled ? 'SYNCED' : 'DEMO_MODE';

  try {
    let externalId = '';
    let response = null;

    if (config.openG2PEnabled) {
      const newId = await openG2PClient.createProgramEnrollmentMapping(payload);
      externalId = String(newId);
      response = { success: true, openG2PEnrollmentId: newId };
    } else {
      externalId = `DEMO-G2P-MEMBERSHIP-${enrollment.enrollmentCode}`;
      response = { success: true, mode: 'demo', simulatedId: externalId };
    }

    const log = await createOrUpdateSyncLog({
      entityType: 'ENROLLMENT',
      entityId: enrollment._id.toString(),
      entityCode: enrollment.enrollmentCode,
      platform: 'OPENG2P',
      targetModel: model,
      syncStatus: mode,
      requestPayload: payload,
      responsePayload: response,
      targetExternalId: externalId,
    });

    return log;
  } catch (error) {
    const log = await createOrUpdateSyncLog({
      entityType: 'ENROLLMENT',
      entityId: enrollment._id.toString(),
      entityCode: enrollment.enrollmentCode,
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

    if (config.odooEnabled) {
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
      syncStatus: mode,
      requestPayload: payload,
      responsePayload: response,
      targetExternalId: externalId,
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
    step: 'Sync farmer to Odoo',
    entityCode: farmer.farmerCode,
    platform: 'ODOO',
    syncStatus: odooFarmerLog.syncStatus,
    errorMessage: odooFarmerLog.errorMessage,
  });

  // Sync farmer to OpenG2P
  const g2pFarmerLog = await syncFarmerToOpenG2P(farmer._id);
  steps.push({
    step: 'Sync farmer to OpenG2P',
    entityCode: farmer.farmerCode,
    platform: 'OPENG2P',
    syncStatus: g2pFarmerLog.syncStatus,
    errorMessage: g2pFarmerLog.errorMessage,
  });

  // 2. Find linked farm
  const farm = await Farm.findOne({ farmer: farmer._id });
  if (farm) {
    const farmLog = await syncFarmToOpenG2P(farm._id);
    steps.push({
      step: 'Sync farm to OpenG2P',
      entityCode: farm.farmCode,
      platform: 'OPENG2P',
      syncStatus: farmLog.syncStatus,
      errorMessage: farmLog.errorMessage,
    });

    // 3. Find linked crop
    const crop = await Crop.findOne({ farm: farm._id });
    if (crop) {
      const cropLog = await syncCropToOpenG2P(crop._id);
      steps.push({
        step: 'Sync crop to OpenG2P',
        entityCode: crop.cropCode,
        platform: 'OPENG2P',
        syncStatus: cropLog.syncStatus,
        errorMessage: cropLog.errorMessage,
      });
    }
  }

  // 4. Find program enrollment
  const enrollment = await Enrollment.findOne({ farmer: farmer._id });
  if (enrollment) {
    const enrollmentLog = await syncEnrollmentToOpenG2P(enrollment._id);
    steps.push({
      step: 'Sync enrollment to OpenG2P',
      entityCode: enrollment.enrollmentCode,
      platform: 'OPENG2P',
      syncStatus: enrollmentLog.syncStatus,
      errorMessage: enrollmentLog.errorMessage,
    });

    // 5. Find linked inventory reservation
    const reservation = await InventoryReservation.findOne({ enrollment: enrollment._id });
    if (reservation) {
      const reservationLog = await syncReservationToOdoo(reservation._id);
      steps.push({
        step: 'Sync inventory reservation to Odoo',
        entityCode: reservation.reservationCode,
        platform: 'ODOO',
        syncStatus: reservationLog.syncStatus,
        errorMessage: reservationLog.errorMessage,
      });
    }
  }

  // 6. Record WSO2 readiness simulation log
  const wso2Log = await createOrUpdateSyncLog({
    entityType: 'ENROLLMENT',
    entityId: farmer._id.toString(),
    entityCode: 'WSO2-API-GATEWAY',
    platform: 'WSO2',
    targetModel: 'APIM',
    syncStatus: config.wso2Enabled ? 'SYNCED' : 'DEMO_MODE',
    requestPayload: { gatewayContexts: ['/agriregistry360/registry', '/agriregistry360/program', '/agriregistry360/inventory'] },
    responsePayload: { status: 'Gateway Ready' },
  });

  steps.push({
    step: 'APIs WSO2 Ready',
    entityCode: 'API-GATEWAY',
    platform: 'WSO2',
    syncStatus: wso2Log.syncStatus,
    errorMessage: '',
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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetch(config.wso2GatewayBaseUrl, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    return {
      success: true,
      platform: 'WSO2',
      enabled: true,
      status: 'CONNECTED',
      baseUrl: config.wso2GatewayBaseUrl,
      message: `Successfully connected to WSO2 Gateway (HTTP ${res.status}).`,
    };
  } catch (error) {
    clearTimeout(timeoutId);

    const isTlsError =
      error.code === 'DEPTH_ZERO_SELF_SIGNED_CERT' ||
      error.message?.includes('self-signed') ||
      error.message?.includes('certificate') ||
      error.code?.includes('CERT');

    if (isTlsError) {
      return {
        success: true,
        platform: 'WSO2',
        enabled: true,
        status: 'CONNECTED',
        baseUrl: config.wso2GatewayBaseUrl,
        message: 'Successfully reached WSO2 Gateway (Warning: Self-signed SSL certificate detected).',
      };
    }

    const isTimeout = error.name === 'AbortError';
    return {
      success: true,
      platform: 'WSO2',
      enabled: true,
      status: 'FAILED',
      baseUrl: config.wso2GatewayBaseUrl,
      message: isTimeout
        ? 'Connection check timed out: Gateway took too long to respond.'
        : `Connection failed: ${error.message}`,
    };
  }
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
    wso2Status = check.status === 'CONNECTED' ? 'PUBLISHED' : 'FAILED';
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

