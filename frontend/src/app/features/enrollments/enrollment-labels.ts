import { ApprovalStatus, EnrollmentStatus } from './enrollment.model';

export function enrollmentStatusLabel(value: EnrollmentStatus): string {
  const labels: Record<EnrollmentStatus, string> = {
    ENROLLED: 'Enrolled',
    CANCELLED: 'Cancelled',
    COMPLETED: 'Completed',
  };
  return labels[value];
}

export function approvalStatusLabel(value: ApprovalStatus): string {
  const labels: Record<ApprovalStatus, string> = {
    PENDING_APPROVAL: 'Pending Approval',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
  };
  return labels[value];
}

export function enrollmentStatusClass(value: EnrollmentStatus): string {
  const classes: Record<EnrollmentStatus, string> = {
    ENROLLED: 'verified',
    CANCELLED: 'rejected',
    COMPLETED: 'verified',
  };
  return classes[value];
}

export function approvalStatusClass(value: ApprovalStatus): string {
  const classes: Record<ApprovalStatus, string> = {
    PENDING_APPROVAL: 'pending',
    APPROVED: 'verified',
    REJECTED: 'rejected',
  };
  return classes[value];
}

