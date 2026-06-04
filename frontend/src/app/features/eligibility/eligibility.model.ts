export type ProgramCode =
  | 'FERTILIZER_SUBSIDY_2026'
  | 'SEED_DISTRIBUTION_2026'
  | 'DROUGHT_RELIEF_2026'
  | 'CROP_INSURANCE_2026';

export type EligibilityStatus = 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'INCOMPLETE_DATA';

export interface RuleResult {
  rule: string;
  passed: boolean;
}

export interface Eligibility {
  _id: string;
  eligibilityCode: string;
  farmer: string;
  farmerCode: string;
  farmerName: string;
  farm: string;
  farmCode: string;
  crop: string;
  cropCode: string;
  programCode: ProgramCode;
  programName: string;
  eligibilityStatus: EligibilityStatus;
  ruleResults: RuleResult[];
  failureReasons: string[];
  recommendedEntitlement: string;
  checkedBy: string;
  checkedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface EligibilityPayload {
  farmerId: string;
  farmId: string;
  cropId: string;
  programCode: ProgramCode;
  checkedBy: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

