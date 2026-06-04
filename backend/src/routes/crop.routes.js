import express from 'express';
import { getEligibilityByCropId } from '../controllers/eligibility.controller.js';
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
cropRouter.get('/:id', getCropById);
cropRouter.put('/:id', updateCrop);
cropRouter.patch('/:id/verify', verifyCrop);
