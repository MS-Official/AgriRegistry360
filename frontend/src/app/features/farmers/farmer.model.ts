export type FarmerType = 'SMALLHOLDER' | 'COMMERCIAL' | 'TENANT' | 'COOPERATIVE_MEMBER';

export type VerificationStatus = 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED';

export interface Farmer {
  _id: string;
  farmerCode: string;
  fullName: string;
  nationalId: string;
  mobileNumber: string;
  district: string;
  gnDivision: string;
  farmerType: FarmerType;
  verificationStatus: VerificationStatus;
  registeredBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface FarmerPayload {
  fullName: string;
  nationalId: string;
  mobileNumber: string;
  district: string;
  gnDivision?: string;
  farmerType: FarmerType;
  registeredBy: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

