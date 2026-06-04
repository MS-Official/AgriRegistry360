import express from 'express';
import {
  checkEligibility,
  getEligibilityById,
  getEligibilityChecks,
} from '../controllers/eligibility.controller.js';

export const eligibilityRouter = express.Router();

eligibilityRouter.post('/check', checkEligibility);
eligibilityRouter.get('/', getEligibilityChecks);
eligibilityRouter.get('/:id', getEligibilityById);

