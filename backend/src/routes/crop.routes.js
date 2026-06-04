import express from 'express';
import { getEligibilityByCropId } from '../controllers/eligibility.controller.js';
import { getEnrollmentsByCropId } from '../controllers/enrollment.controller.js';
import { getReservationsByCropId } from '../controllers/inventory.controller.js';
import {
  getCropById,
  getCrops,
  registerCrop,
  updateCrop,
  verifyCrop,
} from '../controllers/crop.controller.js';

export const cropRouter = express.Router();

cropRouter.post('/register', registerCrop);
cropRouter.get('/', getCrops);
cropRouter.get('/:cropId/eligibility', getEligibilityByCropId);
cropRouter.get('/:cropId/enrollments', getEnrollmentsByCropId);
cropRouter.get('/:cropId/reservations', getReservationsByCropId);
cropRouter.get('/:id', getCropById);
cropRouter.put('/:id', updateCrop);
cropRouter.patch('/:id/verify', verifyCrop);
