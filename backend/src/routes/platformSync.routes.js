import express from 'express';
import * as platformSyncController from '../controllers/platformSync.controller.js';

export const platformSyncRouter = express.Router();

// Metadata & Logs
platformSyncRouter.get('/status', platformSyncController.getSyncStatus);
platformSyncRouter.get('/logs', platformSyncController.getSyncLogs);

// Individual Sync APIs
platformSyncRouter.post('/farmers/:farmerId/odoo', platformSyncController.syncFarmerToOdoo);
platformSyncRouter.post('/farmers/:farmerId/openg2p', platformSyncController.syncFarmerToOpenG2P);
platformSyncRouter.post('/farms/:farmId/openg2p', platformSyncController.syncFarmToOpenG2P);
platformSyncRouter.post('/crops/:cropId/openg2p', platformSyncController.syncCropToOpenG2P);
platformSyncRouter.post('/enrollments/:enrollmentId/openg2p', platformSyncController.syncEnrollmentToOpenG2P);
platformSyncRouter.post('/reservations/:reservationId/odoo', platformSyncController.syncReservationToOdoo);

// Full Flow Sync API
platformSyncRouter.post('/full-demo', platformSyncController.syncFullDemo);

// WSO2 APIs
platformSyncRouter.get('/wso2/gateway-status', platformSyncController.getWso2GatewayStatus);
platformSyncRouter.post('/wso2/mark-published', platformSyncController.markWso2Published);

// Connection Checks
platformSyncRouter.get('/odoo/connection-check', platformSyncController.checkOdooConnection);
platformSyncRouter.get('/openg2p/connection-check', platformSyncController.checkOpenG2pConnection);
platformSyncRouter.get('/wso2/connection-check', platformSyncController.checkWso2Connection);
platformSyncRouter.get('/demo-readiness', platformSyncController.getDemoReadiness);
