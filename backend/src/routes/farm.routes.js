import express from 'express';
import {
  getFarmById,
  getFarms,
  registerFarm,
  updateFarm,
  verifyFarm,
} from '../controllers/farm.controller.js';

export const farmRouter = express.Router();

farmRouter.post('/register', registerFarm);
farmRouter.get('/', getFarms);
farmRouter.get('/:id', getFarmById);
farmRouter.put('/:id', updateFarm);
farmRouter.patch('/:id/verify', verifyFarm);

