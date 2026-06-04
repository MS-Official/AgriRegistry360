import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { reservationStatusClass, reservationStatusLabel } from '../inventory-labels';
import { InventoryReservation } from '../inventory.model';
import { InventoryService } from '../inventory.service';

@Component({
  selector: 'app-inventory-reservation-details',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink],
  template: `
    <section class="page-title">
      <div>
        <h1>Reservation Details</h1>
        <p *ngIf="reservation">{{ reservation.reservationCode }} · {{ reservation.itemName }}</p>
      </div>
      <a class="button secondary" routerLink="/inventory/reservations">Back to Reservations</a>
    </section>

    <div *ngIf="errorMessage" class="message error">{{ errorMessage }}</div>

    <section *ngIf="reservation" class="panel">
      <div class="grid details-grid">
        <div class="detail-item"><div class="detail-label">Reservation Code</div><div class="detail-value">{{ reservation.reservationCode }}</div></div>
        <div class="detail-item"><div class="detail-label">Enrollment Code</div><div class="detail-value">{{ reservation.enrollmentCode }}</div></div>
        <div class="detail-item"><div class="detail-label">Farmer</div><div class="detail-value">{{ reservation.farmerCode }} - {{ reservation.farmerName }}</div></div>
        <div class="detail-item"><div class="detail-label">Farm Code</div><div class="detail-value">{{ reservation.farmCode }}</div></div>
        <div class="detail-item"><div class="detail-label">Crop Code</div><div class="detail-value">{{ reservation.cropCode }}</div></div>
        <div class="detail-item"><div class="detail-label">Program Code</div><div class="detail-value">{{ reservation.programCode }}</div></div>
        <div class="detail-item"><div class="detail-label">Program Name</div><div class="detail-value">{{ reservation.programName }}</div></div>
        <div class="detail-item"><div class="detail-label">Entitlement</div><div class="detail-value">{{ reservation.entitlement }}</div></div>
        <div class="detail-item"><div class="detail-label">Item Code</div><div class="detail-value">{{ reservation.itemCode }}</div></div>
        <div class="detail-item"><div class="detail-label">Item Name</div><div class="detail-value">{{ reservation.itemName }}</div></div>
        <div class="detail-item"><div class="detail-label">Reserved Quantity</div><div class="detail-value">{{ reservation.reservedQuantity }} {{ reservation.unit }}</div></div>
        <div class="detail-item"><div class="detail-label">Warehouse</div><div class="detail-value">{{ reservation.warehouseName }}</div></div>
        <div class="detail-item">
          <div class="detail-label">Reservation Status</div>
          <div class="detail-value">
            <span class="badge" [ngClass]="reservationStatusClass(reservation.reservationStatus)">
              {{ reservationStatusLabel(reservation.reservationStatus) }}
            </span>
          </div>
        </div>
        <div class="detail-item"><div class="detail-label">Reserved By</div><div class="detail-value">{{ reservation.reservedBy }}</div></div>
        <div class="detail-item"><div class="detail-label">Reserved At</div><div class="detail-value">{{ reservation.reservedAt | date: 'medium' }}</div></div>
        <div class="detail-item"><div class="detail-label">Notes</div><div class="detail-value">{{ reservation.notes || '-' }}</div></div>
        <div class="detail-item"><div class="detail-label">Created At</div><div class="detail-value">{{ reservation.createdAt | date: 'medium' }}</div></div>
        <div class="detail-item"><div class="detail-label">Updated At</div><div class="detail-value">{{ reservation.updatedAt | date: 'medium' }}</div></div>
      </div>

      <div class="grid placeholder-grid">
        <div class="placeholder">
          <strong>Distribution Confirmation</strong>
          <span>TODO: Capture final farmer handover confirmation.</span>
        </div>
        <div class="placeholder">
          <strong>WSO2 Publishing</strong>
          <span>TODO: Publish inventory APIs through API Manager.</span>
        </div>
        <div class="placeholder">
          <strong>Odoo Real API Sync</strong>
          <span>TODO: Sync reservation with real Odoo stock moves.</span>
        </div>
      </div>
    </section>
  `,
})
export class InventoryReservationDetailsComponent implements OnInit {
  reservation?: InventoryReservation;
  errorMessage = '';

  readonly reservationStatusLabel = reservationStatusLabel;
  readonly reservationStatusClass = reservationStatusClass;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly inventoryService: InventoryService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.errorMessage = 'Reservation ID is missing.';
      return;
    }

    this.inventoryService.getReservationById(id).subscribe({
      next: (reservation) => {
        this.reservation = reservation;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Unable to load reservation details.';
      },
    });
  }
}

