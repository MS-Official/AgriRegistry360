import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { reservationStatusClass, reservationStatusLabel } from '../../inventory/inventory-labels';
import { InventoryReservation } from '../../inventory/inventory.model';
import { InventoryService } from '../../inventory/inventory.service';
import {
  approvalStatusClass,
  approvalStatusLabel,
  enrollmentStatusClass,
  enrollmentStatusLabel,
} from '../enrollment-labels';
import { Enrollment } from '../enrollment.model';
import { EnrollmentService } from '../enrollment.service';

@Component({
  selector: 'app-enrollment-details',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink],
  template: `
    <section class="page-title">
      <div>
        <h1>Enrollment Details</h1>
        <p *ngIf="enrollment">{{ enrollment.enrollmentCode }} · {{ enrollment.programName }}</p>
      </div>
      <div class="actions">
        <a class="button secondary" routerLink="/enrollments">Back to Enrollment List</a>
      </div>
    </section>

    <div *ngIf="errorMessage" class="message error">{{ errorMessage }}</div>

    <section *ngIf="enrollment" class="panel">
      <div class="grid details-grid">
        <div class="detail-item">
          <div class="detail-label">Enrollment Code</div>
          <div class="detail-value">{{ enrollment.enrollmentCode }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Eligibility Code</div>
          <div class="detail-value">{{ enrollment.eligibilityCode }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Farmer</div>
          <div class="detail-value">{{ enrollment.farmerCode }} - {{ enrollment.farmerName }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Farm Code</div>
          <div class="detail-value">{{ enrollment.farmCode }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Crop Code</div>
          <div class="detail-value">{{ enrollment.cropCode }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Program Code</div>
          <div class="detail-value">{{ enrollment.programCode }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Program Name</div>
          <div class="detail-value">{{ enrollment.programName }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Entitlement</div>
          <div class="detail-value">{{ enrollment.entitlement }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Enrollment Status</div>
          <div class="detail-value">
            <span class="badge" [ngClass]="enrollmentStatusClass(enrollment.enrollmentStatus)">
              {{ enrollmentStatusLabel(enrollment.enrollmentStatus) }}
            </span>
          </div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Approval Status</div>
          <div class="detail-value">
            <span class="badge" [ngClass]="approvalStatusClass(enrollment.approvalStatus)">
              {{ approvalStatusLabel(enrollment.approvalStatus) }}
            </span>
          </div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Enrollment Date</div>
          <div class="detail-value">{{ enrollment.enrollmentDate | date: 'medium' }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Enrolled By</div>
          <div class="detail-value">{{ enrollment.enrolledBy }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Notes</div>
          <div class="detail-value">{{ enrollment.notes || '-' }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Created At</div>
          <div class="detail-value">{{ enrollment.createdAt | date: 'medium' }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Updated At</div>
          <div class="detail-value">{{ enrollment.updatedAt | date: 'medium' }}</div>
        </div>
      </div>

      <section style="margin-top: 22px;">
        <div class="page-title" style="margin-bottom: 12px;">
          <div>
            <h1 style="font-size: 20px;">Inventory Reservations</h1>
            <p>Simulated Odoo reservations created for this enrollment.</p>
          </div>
          <a class="button secondary" routerLink="/inventory/reserve">Reserve Inventory</a>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Reservation Code</th>
                <th>Item Name</th>
                <th>Reserved Quantity</th>
                <th>Reservation Status</th>
                <th>Warehouse Name</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let reservation of linkedReservations">
                <td>
                  <a [routerLink]="['/inventory/reservations', reservation._id]">
                    {{ reservation.reservationCode }}
                  </a>
                </td>
                <td>{{ reservation.itemName }}</td>
                <td>{{ reservation.reservedQuantity }} {{ reservation.unit }}</td>
                <td>
                  <span class="badge" [ngClass]="reservationStatusClass(reservation.reservationStatus)">
                    {{ reservationStatusLabel(reservation.reservationStatus) }}
                  </span>
                </td>
                <td>{{ reservation.warehouseName }}</td>
              </tr>
              <tr *ngIf="linkedReservations.length === 0">
                <td colspan="5">No inventory reservation created yet.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div class="grid placeholder-grid">
        <div class="placeholder">
          <strong>Odoo Reservation</strong>
          <span>TODO: Connect inventory reservation after enrollment approval.</span>
        </div>
        <div class="placeholder">
          <strong>Distribution Status</strong>
          <span>TODO: Track fertilizer distribution workflow.</span>
        </div>
        <div class="placeholder">
          <strong>WSO2 Publishing</strong>
          <span>TODO: Publish enrollment APIs through API Manager.</span>
        </div>
        <div class="placeholder">
          <strong>OpenG2P Mapping</strong>
          <span>TODO: Map enrollment to future OpenG2P program layer.</span>
        </div>
      </div>
    </section>
  `,
})
export class EnrollmentDetailsComponent implements OnInit {
  enrollment?: Enrollment;
  linkedReservations: InventoryReservation[] = [];
  errorMessage = '';

  readonly enrollmentStatusLabel = enrollmentStatusLabel;
  readonly enrollmentStatusClass = enrollmentStatusClass;
  readonly approvalStatusLabel = approvalStatusLabel;
  readonly approvalStatusClass = approvalStatusClass;
  readonly reservationStatusLabel = reservationStatusLabel;
  readonly reservationStatusClass = reservationStatusClass;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly enrollmentService: EnrollmentService,
    private readonly inventoryService: InventoryService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.errorMessage = 'Enrollment ID is missing.';
      return;
    }

    this.enrollmentService.getEnrollmentById(id).subscribe({
      next: (enrollment) => {
        this.enrollment = enrollment;
        this.loadLinkedReservations(enrollment._id);
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Unable to load enrollment details.';
      },
    });
  }

  private loadLinkedReservations(enrollmentId: string): void {
    this.inventoryService.getReservationsByEnrollmentId(enrollmentId).subscribe({
      next: (reservations) => {
        this.linkedReservations = reservations;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Unable to load inventory reservations.';
      },
    });
  }
}
