import express from 'express';
import { getCropsByFarmerId } from '../controllers/crop.controller.js';
import { getEligibilityByFarmerId } from '../controllers/eligibility.controller.js';
import {
  getFarmerById,
  getFarmers,
  registerFarmer,
  updateFarmer,
  verifyFarmer,
} from '../controllers/farmer.controller.js';
import { getFarmsByFarmerId } from '../controllers/farm.controller.js';

export const farmerRouter = express.Router();

farmerRouter.post('/register', registerFarmer);
farmerRouter.get('/', getFarmers);
farmerRouter.get('/:farmerId/farms', getFarmsByFarmerId);
farmerRouter.get('/:farmerId/crops', getCropsByFarmerId);
farmerRouter.get('/:farmerId/eligibility', getEligibilityByFarmerId);
farmerRouter.get('/:id', getFarmerById);
farmerRouter.put('/:id', updateFarmer);
farmerRouter.patch('/:id/verify', verifyFarmer);
