import express from 'express';
import {
  cancelReservation,
  getInventoryItemById,
  getInventoryItems,
  getReservationById,
  getReservations,
  issueReservation,
  reserveInventory,
} from '../controllers/inventory.controller.js';

export const inventoryRouter = express.Router();

inventoryRouter.get('/items', getInventoryItems);
inventoryRouter.get('/items/:id', getInventoryItemById);
inventoryRouter.post('/reserve', reserveInventory);
inventoryRouter.get('/reservations', getReservations);
inventoryRouter.get('/reservations/:id', getReservationById);
inventoryRouter.patch('/reservations/:id/cancel', cancelReservation);
inventoryRouter.patch('/reservations/:id/issue', issueReservation);

