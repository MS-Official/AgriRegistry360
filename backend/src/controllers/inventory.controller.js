import * as inventoryService from '../services/inventory.service.js';

export async function getInventoryItems(req, res, next) {
  try {
    const items = await inventoryService.getInventoryItems();
    res.json({ success: true, message: 'Inventory items retrieved successfully', data: items });
  } catch (error) {
    next(error);
  }
}

export async function getInventoryItemById(req, res, next) {
  try {
    const item = await inventoryService.getInventoryItemById(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Inventory item not found' });
    }

    return res.json({ success: true, message: 'Inventory item retrieved successfully', data: item });
  } catch (error) {
    return next(error);
  }
}

export async function reserveInventory(req, res, next) {
  try {
    const reservation = await inventoryService.createReservation(req.body);
    res.status(201).json({
      success: true,
      message: 'Inventory reserved successfully',
      data: reservation,
    });
  } catch (error) {
    next(error);
  }
}

export async function getReservations(req, res, next) {
  try {
    const reservations = await inventoryService.getReservations(req.query.search);
    res.json({ success: true, message: 'Reservations retrieved successfully', data: reservations });
  } catch (error) {
    next(error);
  }
}

export async function getReservationById(req, res, next) {
  try {
    const reservation = await inventoryService.getReservationById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }

    return res.json({ success: true, message: 'Reservation retrieved successfully', data: reservation });
  } catch (error) {
    return next(error);
  }
}

export async function getReservationsByEnrollmentId(req, res, next) {
  try {
    const reservations = await inventoryService.getReservationsByEnrollment(req.params.enrollmentId);
    res.json({
      success: true,
      message: 'Enrollment reservations retrieved successfully',
      data: reservations,
    });
  } catch (error) {
    next(error);
  }
}

export async function getReservationsByFarmerId(req, res, next) {
  try {
    const reservations = await inventoryService.getReservationsByFarmer(req.params.farmerId);
    res.json({ success: true, message: 'Farmer reservations retrieved successfully', data: reservations });
  } catch (error) {
    next(error);
  }
}

export async function getReservationsByFarmId(req, res, next) {
  try {
    const reservations = await inventoryService.getReservationsByFarm(req.params.farmId);
    res.json({ success: true, message: 'Farm reservations retrieved successfully', data: reservations });
  } catch (error) {
    next(error);
  }
}

export async function getReservationsByCropId(req, res, next) {
  try {
    const reservations = await inventoryService.getReservationsByCrop(req.params.cropId);
    res.json({ success: true, message: 'Crop reservations retrieved successfully', data: reservations });
  } catch (error) {
    next(error);
  }
}

export async function cancelReservation(req, res, next) {
  try {
    const reservation = await inventoryService.cancelReservation(req.params.id, req.body.notes);

    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }

    return res.json({ success: true, message: 'Reservation cancelled successfully', data: reservation });
  } catch (error) {
    return next(error);
  }
}

export async function issueReservation(req, res, next) {
  try {
    const reservation = await inventoryService.issueReservation(req.params.id, req.body.notes);

    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }

    return res.json({ success: true, message: 'Reservation issued successfully', data: reservation });
  } catch (error) {
    return next(error);
  }
}

