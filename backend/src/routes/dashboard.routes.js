import express from 'express';
import { getDashboardSummary } from '../controllers/dashboard.controller.js';

export const dashboardRouter = express.Router();

dashboardRouter.get('/summary', getDashboardSummary);
