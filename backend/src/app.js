import cors from 'cors';
import express from 'express';
import { config } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { cropRouter } from './routes/crop.routes.js';
import { farmRouter } from './routes/farm.routes.js';
import { farmerRouter } from './routes/farmer.routes.js';

export function createApp() {
  const app = express();

  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json());

  app.get('/health', (req, res) => {
    res.json({
      success: true,
      message: 'AgriRegistry360 backend is running',
    });
  });

  app.use('/api/farmers', farmerRouter);
  app.use('/api/farms', farmRouter);
  app.use('/api/crops', cropRouter);

  // TODO: Add future eligibility, program, Odoo, OpenG2P, WSO2, and report routes.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
