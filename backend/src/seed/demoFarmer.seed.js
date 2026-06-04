import { Farmer } from '../models/farmer.model.js';
import { registerFarmer } from '../services/farmer.service.js';

const demoFarmer = {
  fullName: 'Mohamed Ameen',
  nationalId: '901234567V',
  mobileNumber: '0771234567',
  district: 'Anuradhapura',
  gnDivision: 'Nochchiyagama',
  farmerType: 'SMALLHOLDER',
  verificationStatus: 'PENDING_VERIFICATION',
  registeredBy: 'Field Officer',
};

export async function seedDemoFarmer() {
  const existingFarmer = await Farmer.findOne({
    nationalId: demoFarmer.nationalId,
  }).lean();

  if (existingFarmer) {
    return existingFarmer;
  }

  return registerFarmer(demoFarmer);
}

