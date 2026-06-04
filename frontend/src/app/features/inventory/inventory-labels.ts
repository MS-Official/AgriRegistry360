import { ReservationStatus } from './inventory.model';

export function reservationStatusLabel(value: ReservationStatus): string {
  const labels: Record<ReservationStatus, string> = {
    RESERVED: 'Reserved',
    CANCELLED: 'Cancelled',
    ISSUED: 'Issued',
  };
  return labels[value];
}

export function reservationStatusClass(value: ReservationStatus): string {
  const classes: Record<ReservationStatus, string> = {
    RESERVED: 'pending',
    CANCELLED: 'rejected',
    ISSUED: 'verified',
  };
  return classes[value];
}

