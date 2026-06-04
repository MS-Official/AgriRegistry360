import { config } from '../config/env.js';
import * as platformSyncService from '../services/platformSync.service.js';

export async function getSyncStatus(req, res, next) {
  try {
    const status = await platformSyncService.getSyncStatus();
    res.json({ success: true, message: 'Sync status retrieved successfully', data: status });
  } catch (error) {
    next(error);
  }
}

export async function getSyncLogs(req, res, next) {
  try {
    const logs = await platformSyncService.getSyncLogs();
    res.json({ success: true, message: 'Sync logs retrieved successfully', data: logs });
  } catch (error) {
    next(error);
  }
}

export async function syncFarmerToOdoo(req, res, next) {
  try {
    const log = await platformSyncService.syncFarmerToOdoo(req.params.farmerId);
    res.json({ success: true, message: 'Farmer sync completed', data: log });
  } catch (error) {
    next(error);
  }
}

export async function syncFarmerToOpenG2P(req, res, next) {
  try {
    const log = await platformSyncService.syncFarmerToOpenG2P(req.params.farmerId);
    res.json({ success: true, message: 'Farmer OpenG2P sync completed', data: log });
  } catch (error) {
    next(error);
  }
}

export async function syncFarmToOpenG2P(req, res, next) {
  try {
    const log = await platformSyncService.syncFarmToOpenG2P(req.params.farmId);
    res.json({ success: true, message: 'Farm OpenG2P sync completed', data: log });
  } catch (error) {
    next(error);
  }
}

export async function syncCropToOpenG2P(req, res, next) {
  try {
    const log = await platformSyncService.syncCropToOpenG2P(req.params.cropId);
    res.json({ success: true, message: 'Crop OpenG2P sync completed', data: log });
  } catch (error) {
    next(error);
  }
}

export async function syncEnrollmentToOpenG2P(req, res, next) {
  try {
    const log = await platformSyncService.syncEnrollmentToOpenG2P(req.params.enrollmentId);
    res.json({ success: true, message: 'Enrollment OpenG2P sync completed', data: log });
  } catch (error) {
    next(error);
  }
}

export async function syncReservationToOdoo(req, res, next) {
  try {
    const log = await platformSyncService.syncReservationToOdoo(req.params.reservationId);
    res.json({ success: true, message: 'Inventory reservation Odoo sync completed', data: log });
  } catch (error) {
    next(error);
  }
}

export async function syncFullDemo(req, res, next) {
  try {
    const result = await platformSyncService.syncFullDemoFlow();
    res.json({
      success: true,
      message: 'Full demo platform sync completed',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getWso2GatewayStatus(req, res, next) {
  try {
    res.json({
      success: true,
      data: {
        wso2Enabled: config.wso2Enabled,
        apiDocsUrl: `http://localhost:${config.port}/api/docs`,
        apiCatalogUrl: `http://localhost:${config.port}/api/catalog`,
        registryApiContext: config.wso2RegistryApiContext,
        programApiContext: config.wso2ProgramApiContext,
        inventoryApiContext: config.wso2InventoryApiContext,
        gatewayBaseUrl: config.wso2GatewayBaseUrl,
        publishingStatus: config.wso2Enabled ? 'PUBLISHED' : 'READY_FOR_WSO2_PUBLISHING',
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function markWso2Published(req, res, next) {
  try {
    const { apiName, context, gatewayUrl } = req.body;
    const log = await platformSyncService.createOrUpdateSyncLog({
      entityType: 'ENROLLMENT', // Generic tracking entity
      entityId: `WSO2-${apiName.replace(/\s+/g, '-').toUpperCase()}`,
      entityCode: apiName,
      platform: 'WSO2',
      targetModel: 'APIM-PUBLISHED',
      syncStatus: 'SYNCED',
      requestPayload: { apiName, context, gatewayUrl },
      responsePayload: { status: 'Published', publishedAt: new Date() },
    });

    res.json({
      success: true,
      message: `${apiName} successfully marked as published in WSO2 API Manager`,
      data: log,
    });
  } catch (error) {
    next(error);
  }
}
