import express from 'express';
import {
  cancelEnrollment,
  enrollFarmer,
  getEnrollmentById,
  getEnrollments,
  updateEnrollmentApproval,
} from '../controllers/enrollment.controller.js';
import { getReservationsByEnrollmentId } from '../controllers/inventory.controller.js';

export const enrollmentRouter = express.Router();

enrollmentRouter.post('/', enrollFarmer);
enrollmentRouter.get('/', getEnrollments);
enrollmentRouter.get('/:enrollmentId/reservations', getReservationsByEnrollmentId);
enrollmentRouter.get('/:id', getEnrollmentById);
enrollmentRouter.patch('/:id/approval', updateEnrollmentApproval);
enrollmentRouter.patch('/:id/cancel', cancelEnrollment);
