import express from 'express';
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
farmerRouter.get('/:id', getFarmerById);
farmerRouter.put('/:id', updateFarmer);
farmerRouter.patch('/:id/verify', verifyFarmer);
