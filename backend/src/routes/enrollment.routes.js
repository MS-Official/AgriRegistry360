import express from 'express';
import {
  cancelEnrollment,
  enrollFarmer,
  getEnrollmentById,
  getEnrollments,
  updateEnrollmentApproval,
} from '../controllers/enrollment.controller.js';

export const enrollmentRouter = express.Router();

enrollmentRouter.post('/', enrollFarmer);
enrollmentRouter.get('/', getEnrollments);
enrollmentRouter.get('/:id', getEnrollmentById);
enrollmentRouter.patch('/:id/approval', updateEnrollmentApproval);
enrollmentRouter.patch('/:id/cancel', cancelEnrollment);

