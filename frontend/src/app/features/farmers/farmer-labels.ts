import { FarmerType, VerificationStatus } from './farmer.model';

export const farmerTypeOptions: Array<{ label: string; value: FarmerType }> = [
  { label: 'Smallholder', value: 'SMALLHOLDER' },
  { label: 'Commercial', value: 'COMMERCIAL' },
  { label: 'Tenant', value: 'TENANT' },
  { label: 'Cooperative Member', value: 'COOPERATIVE_MEMBER' },
];

export function farmerTypeLabel(value: FarmerType): string {
  return farmerTypeOptions.find((option) => option.value === value)?.label || value;
}

export function verificationStatusLabel(value: VerificationStatus): string {
  const labels: Record<VerificationStatus, string> = {
    PENDING_VERIFICATION: 'Pending Verification',
    VERIFIED: 'Verified',
    REJECTED: 'Rejected',
  };
  return labels[value];
}

export function verificationStatusClass(value: VerificationStatus): string {
  const classes: Record<VerificationStatus, string> = {
    PENDING_VERIFICATION: 'pending',
    VERIFIED: 'verified',
    REJECTED: 'rejected',
  };
  return classes[value];
}

