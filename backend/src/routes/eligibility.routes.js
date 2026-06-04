import express from 'express';
import { getEnrollmentsByEligibilityId } from '../controllers/enrollment.controller.js';
import {
  checkEligibility,
  getEligibilityById,
  getEligibilityChecks,
} from '../controllers/eligibility.controller.js';

export const eligibilityRouter = express.Router();

eligibilityRouter.post('/check', checkEligibility);
eligibilityRouter.get('/', getEligibilityChecks);
eligibilityRouter.get('/:eligibilityId/enrollments', getEnrollmentsByEligibilityId);
eligibilityRouter.get('/:id', getEligibilityById);
