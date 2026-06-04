import cors from 'cors';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { config } from './config/env.js';
import { apiCatalog } from './docs/apiCatalog.js';
import { openApiSpec } from './docs/openapi.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { cropRouter } from './routes/crop.routes.js';
import { dashboardRouter } from './routes/dashboard.routes.js';
import { eligibilityRouter } from './routes/eligibility.routes.js';
import { enrollmentRouter } from './routes/enrollment.routes.js';
import { farmRouter } from './routes/farm.routes.js';
import { farmerRouter } from './routes/farmer.routes.js';
import { inventoryRouter } from './routes/inventory.routes.js';
import { openG2PRouter } from './routes/openg2p.routes.js';

const corsOptions = {
  origin: config.corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

export function createApp() {
  const app = express();

  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));
  app.use(express.json());

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

  app.get('/api/docs.json', (req, res) => {
    res.json(openApiSpec);
  });

  app.get('/api/catalog', (req, res) => {
    res.json({
      success: true,
      data: apiCatalog,
    });
  });

  app.get('/api/health', (req, res) => {
    res.json({
      success: true,
      message: 'AgriRegistry360 API is running',
    });
  });

  app.get('/health', (req, res) => {
    res.json({
      success: true,
      message: 'AgriRegistry360 backend is running',
    });
  });

  app.use('/api/farmers', farmerRouter);
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/farms', farmRouter);
  app.use('/api/crops', cropRouter);
  app.use('/api/eligibility', eligibilityRouter);
  app.use('/api/enrollments', enrollmentRouter);
  app.use('/api/odoo/inventory', inventoryRouter);
  app.use('/api/openg2p', openG2PRouter);

  // TODO: Add future eligibility, program, Odoo, OpenG2P, WSO2, and report routes.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
