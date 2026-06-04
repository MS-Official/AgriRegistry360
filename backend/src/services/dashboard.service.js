import { Crop } from '../models/crop.model.js';
import { Eligibility } from '../models/eligibility.model.js';
import { Enrollment } from '../models/enrollment.model.js';
import { Farm } from '../models/farm.model.js';
import { Farmer } from '../models/farmer.model.js';
import { InventoryReservation } from '../models/inventoryReservation.model.js';

export async function getDashboardSummary() {
  const [
    totalFarmers,
    totalFarms,
    totalCrops,
    totalEligibilityChecks,
    eligibleChecks,
    totalEnrollments,
    approvedEnrollments,
    totalReservations,
    issuedReservations,
  ] = await Promise.all([
    Farmer.countDocuments(),
    Farm.countDocuments(),
    Crop.countDocuments(),
    Eligibility.countDocuments(),
    Eligibility.countDocuments({ eligibilityStatus: 'ELIGIBLE' }),
    Enrollment.countDocuments(),
    Enrollment.countDocuments({ approvalStatus: 'APPROVED' }),
    InventoryReservation.countDocuments(),
    InventoryReservation.countDocuments({ reservationStatus: 'ISSUED' }),
  ]);

  return {
    totalFarmers,
    totalFarms,
    totalCrops,
    totalEligibilityChecks,
    eligibleChecks,
    totalEnrollments,
    approvedEnrollments,
    totalReservations,
    issuedReservations,
  };
}
