import { VerificationStatus } from '../farmers/farmer.model';

export type OwnershipType = 'OWNED' | 'LEASED' | 'SHARED' | 'TENANT_OPERATED';
export type LandSizeUnit = 'ACRES' | 'HECTARES' | 'PERCHES';
export type SoilType = 'CLAY' | 'LOAM' | 'SANDY' | 'SILT' | 'MIXED' | 'UNKNOWN';
export type IrrigationType = 'RAINFED' | 'CANAL' | 'WELL' | 'TUBE_WELL' | 'DRIP' | 'SPRINKLER' | 'UNKNOWN';
export type FarmStatus = 'ACTIVE' | 'INACTIVE' | 'UNDER_REVIEW';

export interface Farm {
  _id: string;
  farmCode: string;
  farmer: string;
  farmerCode: string;
  farmerName: string;
  landSize: number;
  landSizeUnit: LandSizeUnit;
  ownershipType: OwnershipType;
  district: string;
  gnDivision: string;
  gpsLatitude?: number;
  gpsLongitude?: number;
  soilType: SoilType;
  irrigationType: IrrigationType;
  farmStatus: FarmStatus;
  verificationStatus: VerificationStatus;
  registeredBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface FarmPayload {
  farmerId: string;
  landSize: number;
  landSizeUnit: LandSizeUnit;
  ownershipType: OwnershipType;
  district: string;
  gnDivision: string;
  gpsLatitude?: number;
  gpsLongitude?: number;
  soilType: SoilType;
  irrigationType: IrrigationType;
  farmStatus: FarmStatus;
  registeredBy: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

