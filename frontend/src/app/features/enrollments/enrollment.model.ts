export type EnrollmentStatus = 'ENROLLED' | 'CANCELLED' | 'COMPLETED';
export type ApprovalStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
export type EnrollmentProgramCode = 'FERTILIZER_SUBSIDY_2026';

export interface Enrollment {
  _id: string;
  enrollmentCode: string;
  eligibility: string;
  eligibilityCode: string;
  farmer: string;
  farmerCode: string;
  farmerName: string;
  farm: string;
  farmCode: string;
  crop: string;
  cropCode: string;
  programCode: EnrollmentProgramCode;
  programName: string;
  entitlement: string;
  enrollmentStatus: EnrollmentStatus;
  approvalStatus: ApprovalStatus;
  enrollmentDate: string;
  enrolledBy: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface EnrollmentPayload {
  eligibilityId: string;
  enrolledBy: string;
  notes?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

