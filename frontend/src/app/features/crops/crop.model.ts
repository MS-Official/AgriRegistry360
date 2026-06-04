import { VerificationStatus } from '../farmers/farmer.model';
import { LandSizeUnit } from '../farms/farm.model';

export type CropType = 'PADDY' | 'MAIZE' | 'VEGETABLES' | 'FRUITS' | 'TEA' | 'COCONUT' | 'RUBBER' | 'OTHER';
export type Season = 'MAHA' | 'YALA' | 'INTER_SEASON' | 'YEAR_ROUND';
export type CultivationAreaUnit = LandSizeUnit;
export type ExpectedYieldUnit = 'KG' | 'MT' | 'BAGS' | 'UNITS';
export type CropStatus = 'PLANNED' | 'PLANTED' | 'GROWING' | 'HARVESTED' | 'DAMAGED' | 'FAILED';

export interface Crop {
  _id: string;
  cropCode: string;
  farm: string;
  farmCode: string;
  farmer: string;
  farmerCode: string;
  farmerName: string;
  cropType: CropType;
  season: Season;
  seasonYear: number;
  cultivationArea: number;
  cultivationAreaUnit: CultivationAreaUnit;
  plantingDate: string;
  expectedHarvestDate: string;
  expectedYield: number;
  expectedYieldUnit: ExpectedYieldUnit;
  cropStatus: CropStatus;
  verificationStatus: VerificationStatus;
  registeredBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CropPayload {
  farmId: string;
  cropType: CropType;
  season: Season;
  seasonYear: number;
  cultivationArea: number;
  cultivationAreaUnit: CultivationAreaUnit;
  plantingDate: string;
  expectedHarvestDate: string;
  expectedYield: number;
  expectedYieldUnit: ExpectedYieldUnit;
  cropStatus: CropStatus;
  registeredBy: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

