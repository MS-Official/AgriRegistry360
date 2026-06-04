import { EligibilityStatus, ProgramCode } from './eligibility.model';

export const programOptions: Array<{ label: string; value: ProgramCode }> = [
  { label: 'Fertilizer Subsidy Program 2026', value: 'FERTILIZER_SUBSIDY_2026' },
];

export function eligibilityStatusLabel(value: EligibilityStatus): string {
  const labels: Record<EligibilityStatus, string> = {
    ELIGIBLE: 'Eligible',
    NOT_ELIGIBLE: 'Not Eligible',
    INCOMPLETE_DATA: 'Incomplete Data',
  };
  return labels[value];
}

export function eligibilityStatusClass(value: EligibilityStatus): string {
  const classes: Record<EligibilityStatus, string> = {
    ELIGIBLE: 'verified',
    NOT_ELIGIBLE: 'rejected',
    INCOMPLETE_DATA: 'pending',
  };
  return classes[value];
}

