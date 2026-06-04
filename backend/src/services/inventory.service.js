import mongoose from 'mongoose';
import { Enrollment } from '../models/enrollment.model.js';
import { InventoryItem } from '../models/inventoryItem.model.js';
import { InventoryReservation } from '../models/inventoryReservation.model.js';
import { generateReservationCode } from '../utils/generateReservationCode.js';

const ENTITLEMENT_MAPPING = {
  '50KG_FERTILIZER': { itemCode: 'FERTILIZER_50KG', quantity: 1 },
  '100KG_FERTILIZER': { itemCode: 'FERTILIZER_50KG', quantity: 2 },
  '150KG_FERTILIZER': { itemCode: 'FERTILIZER_50KG', quantity: 3 },
};

function assertValidObjectId(id, message = 'Invalid ObjectId') {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error(message);
    error.statusCode = 400;
    throw error;
  }
}

function appendNote(existingNotes, newNote) {
  if (!newNote?.trim()) {
    return existingNotes || '';
  }

  return existingNotes ? `${existingNotes}\n${newNote.trim()}` : newNote.trim();
}

function buildReservationSearchQuery(search) {
  if (!search) {
    return {};
  }

  const searchRegex = new RegExp(search.trim(), 'i');
  return {
    $or: [
      { reservationCode: searchRegex },
      { enrollmentCode: searchRegex },
      { farmerCode: searchRegex },
      { farmerName: searchRegex },
      { farmCode: searchRegex },
      { cropCode: searchRegex },
      { programCode: searchRegex },
      { programName: searchRegex },
      { entitlement: searchRegex },
      { itemCode: searchRegex },
      { itemName: searchRegex },
      { reservationStatus: searchRegex },
    ],
  };
}

export async function getInventoryItems() {
  return InventoryItem.find().sort({ itemCode: 1 }).lean();
}

export async function getInventoryItemById(id) {
  assertValidObjectId(id, 'Invalid inventory item ID');
  return InventoryItem.findById(id).lean();
}

export async function createReservation(payload) {
  const { enrollmentId, reservedBy, notes = '' } = payload;

  if (!enrollmentId || !reservedBy) {
    const error = new Error('Missing required fields');
    error.statusCode = 400;
    throw error;
  }

  assertValidObjectId(enrollmentId, 'Invalid enrollment ID');

  const enrollment = await Enrollment.findById(enrollmentId).lean();
  if (!enrollment) {
    const error = new Error('Enrollment not found');
    error.statusCode = 404;
    throw error;
  }

  if (enrollment.enrollmentStatus !== 'ENROLLED' || enrollment.approvalStatus !== 'APPROVED') {
    const error = new Error('Only approved enrollments can reserve inventory.');
    error.statusCode = 400;
    throw error;
  }

  const mapping = ENTITLEMENT_MAPPING[enrollment.entitlement];
  if (!mapping) {
    const error = new Error('Unsupported entitlement');
    error.statusCode = 400;
    throw error;
  }

  const duplicateReservation = await InventoryReservation.findOne({
    enrollment: enrollment._id,
    reservationStatus: 'RESERVED',
  }).lean();

  if (duplicateReservation) {
    const error = new Error('Duplicate active reservation exists');
    error.statusCode = 409;
    throw error;
  }

  const inventoryItem = await InventoryItem.findOne({
    itemCode: mapping.itemCode,
    status: 'ACTIVE',
  });

  if (!inventoryItem) {
    const error = new Error('Inventory item not found');
    error.statusCode = 404;
    throw error;
  }

  if (inventoryItem.availableQuantity - inventoryItem.reservedQuantity < mapping.quantity) {
    const error = new Error('Insufficient inventory stock for this entitlement.');
    error.statusCode = 400;
    throw error;
  }

  const reservationCode = await generateReservationCode(InventoryReservation);
  const reservation = await InventoryReservation.create({
    reservationCode,
    enrollment: enrollment._id,
    enrollmentCode: enrollment.enrollmentCode,
    farmer: enrollment.farmer,
    farmerCode: enrollment.farmerCode,
    farmerName: enrollment.farmerName,
    farm: enrollment.farm,
    farmCode: enrollment.farmCode,
    crop: enrollment.crop,
    cropCode: enrollment.cropCode,
    programCode: enrollment.programCode,
    programName: enrollment.programName,
    entitlement: enrollment.entitlement,
    itemCode: inventoryItem.itemCode,
    itemName: inventoryItem.itemName,
    reservedQuantity: mapping.quantity,
    unit: inventoryItem.unit,
    warehouseName: inventoryItem.warehouseName,
    reservedBy,
    notes,
  });

  inventoryItem.reservedQuantity += mapping.quantity;
  await inventoryItem.save();

  return reservation;
}

export async function getReservations(search) {
  return InventoryReservation.find(buildReservationSearchQuery(search)).sort({ reservedAt: -1 }).lean();
}

export async function getReservationById(id) {
  assertValidObjectId(id, 'Invalid reservation ID');
  return InventoryReservation.findById(id).lean();
}

export async function getReservationsByEnrollment(enrollmentId) {
  assertValidObjectId(enrollmentId, 'Invalid enrollment ID');
  return InventoryReservation.find({ enrollment: enrollmentId }).sort({ reservedAt: -1 }).lean();
}

export async function getReservationsByFarmer(farmerId) {
  assertValidObjectId(farmerId, 'Invalid farmer ID');
  return InventoryReservation.find({ farmer: farmerId }).sort({ reservedAt: -1 }).lean();
}

export async function getReservationsByFarm(farmId) {
  assertValidObjectId(farmId, 'Invalid farm ID');
  return InventoryReservation.find({ farm: farmId }).sort({ reservedAt: -1 }).lean();
}

export async function getReservationsByCrop(cropId) {
  assertValidObjectId(cropId, 'Invalid crop ID');
  return InventoryReservation.find({ crop: cropId }).sort({ reservedAt: -1 }).lean();
}

export async function cancelReservation(id, notes = '') {
  assertValidObjectId(id, 'Invalid reservation ID');

  const reservation = await InventoryReservation.findById(id);
  if (!reservation) {
    return null;
  }

  if (reservation.reservationStatus === 'ISSUED') {
    const error = new Error('Cannot cancel issued reservation');
    error.statusCode = 400;
    throw error;
  }

  if (reservation.reservationStatus !== 'CANCELLED') {
    const inventoryItem = await InventoryItem.findOne({ itemCode: reservation.itemCode });
    if (inventoryItem) {
      inventoryItem.reservedQuantity = Math.max(
        0,
        inventoryItem.reservedQuantity - reservation.reservedQuantity
      );
      await inventoryItem.save();
    }
  }

  reservation.reservationStatus = 'CANCELLED';
  reservation.notes = appendNote(reservation.notes, notes);
  return reservation.save();
}

export async function issueReservation(id, notes = '') {
  assertValidObjectId(id, 'Invalid reservation ID');

  const reservation = await InventoryReservation.findById(id);
  if (!reservation) {
    return null;
  }

  if (reservation.reservationStatus === 'CANCELLED') {
    const error = new Error('Cannot issue cancelled reservation');
    error.statusCode = 400;
    throw error;
  }

  if (reservation.reservationStatus !== 'ISSUED') {
    const inventoryItem = await InventoryItem.findOne({ itemCode: reservation.itemCode });
    if (!inventoryItem) {
      const error = new Error('Inventory item not found');
      error.statusCode = 404;
      throw error;
    }

    inventoryItem.reservedQuantity = Math.max(
      0,
      inventoryItem.reservedQuantity - reservation.reservedQuantity
    );
    inventoryItem.distributedQuantity += reservation.reservedQuantity;
    await inventoryItem.save();
  }

  reservation.reservationStatus = 'ISSUED';
  reservation.notes = appendNote(reservation.notes, notes);
  return reservation.save();
}

