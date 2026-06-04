import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { approvalStatusLabel } from '../../enrollments/enrollment-labels';
import { Enrollment } from '../../enrollments/enrollment.model';
import { EnrollmentService } from '../../enrollments/enrollment.service';
import { reservationStatusClass, reservationStatusLabel } from '../inventory-labels';
import { InventoryReservation, InventoryReservationPayload } from '../inventory.model';
import { InventoryService } from '../inventory.service';

@Component({
  selector: 'app-inventory-reserve',
  standalone: true,
  imports: [CommonModule, DatePipe, ReactiveFormsModule, RouterLink],
  template: `
    <section class="page-title">
      <div>
        <h1>Reserve Inventory</h1>
        <p>Reserve fertilizer stock for an approved program enrollment.</p>
      </div>
      <a class="button secondary" routerLink="/inventory/reservations">View Reservations</a>
    </section>

    <div *ngIf="successMessage" class="message success">{{ successMessage }}</div>
    <div *ngIf="errorMessage" class="message error">{{ errorMessage }}</div>

    <form class="panel grid form-grid" [formGroup]="form" (ngSubmit)="submit()">
      <div class="field">
        <label for="enrollmentId">Approved Enrollment</label>
        <select id="enrollmentId" formControlName="enrollmentId">
          <option value="">Select approved enrollment</option>
          <option *ngFor="let enrollment of approvedEnrollments" [value]="enrollment._id">
            {{ enrollment.enrollmentCode }} - {{ enrollment.farmerName }} - {{ enrollment.entitlement }} -
            {{ approvalStatusLabel(enrollment.approvalStatus) }}
          </option>
        </select>
        <span *ngIf="showError('enrollmentId')" class="error">Approved enrollment is required.</span>
        <span *ngIf="!isLoading && approvedEnrollments.length === 0" class="error">
          No approved enrollments found. Please approve a Program Enrollment first.
        </span>
      </div>

      <div class="field">
        <label for="reservedBy">Reserved By</label>
        <input id="reservedBy" type="text" formControlName="reservedBy">
        <span *ngIf="showError('reservedBy')" class="error">Reserved by is required.</span>
      </div>

      <div class="field">
        <label for="notes">Notes</label>
        <input id="notes" type="text" formControlName="notes">
      </div>

      <div class="actions">
        <button class="button" type="submit" [disabled]="isSubmitting || approvedEnrollments.length === 0">
          {{ isSubmitting ? 'Reserving...' : 'Reserve Inventory' }}
        </button>
        <button class="button secondary" type="button" (click)="fillDemoData()" [disabled]="isSubmitting">
          Use Demo Data
        </button>
      </div>
    </form>

    <section *ngIf="createdReservation" class="panel" style="margin-top: 20px;">
      <div class="page-title">
        <div>
          <h1 style="font-size: 22px;">{{ createdReservation.reservationCode }}</h1>
          <p>{{ createdReservation.itemName }} · {{ createdReservation.warehouseName }}</p>
        </div>
        <span class="badge" [ngClass]="reservationStatusClass(createdReservation.reservationStatus)">
          {{ reservationStatusLabel(createdReservation.reservationStatus) }}
        </span>
      </div>

      <div class="grid details-grid">
        <div class="detail-item">
          <div class="detail-label">Enrollment</div>
          <div class="detail-value">{{ createdReservation.enrollmentCode }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Farmer</div>
          <div class="detail-value">{{ createdReservation.farmerCode }} - {{ createdReservation.farmerName }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Reserved Quantity</div>
          <div class="detail-value">{{ createdReservation.reservedQuantity }} {{ createdReservation.unit }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Reserved At</div>
          <div class="detail-value">{{ createdReservation.reservedAt | date: 'medium' }}</div>
        </div>
      </div>
    </section>
  `,
})
export class InventoryReserveComponent implements OnInit {
  enrollments: Enrollment[] = [];
  createdReservation?: InventoryReservation;
  errorMessage = '';
  successMessage = '';
  isLoading = false;
  isSubmitting = false;

  readonly approvalStatusLabel = approvalStatusLabel;
  readonly reservationStatusLabel = reservationStatusLabel;
  readonly reservationStatusClass = reservationStatusClass;

  readonly form = this.fb.nonNullable.group({
    enrollmentId: ['', Validators.required],
    reservedBy: ['', Validators.required],
    notes: [''],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly enrollmentService: EnrollmentService,
    private readonly inventoryService: InventoryService
  ) {}

  get approvedEnrollments(): Enrollment[] {
    return this.enrollments.filter(
      (enrollment) =>
        enrollment.enrollmentStatus === 'ENROLLED' && enrollment.approvalStatus === 'APPROVED'
    );
  }

  ngOnInit(): void {
    this.loadEnrollments();
  }

  loadEnrollments(): void {
    this.isLoading = true;
    this.enrollmentService.getEnrollments().subscribe({
      next: (enrollments) => {
        this.enrollments = enrollments;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Unable to load enrollments.';
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }

  fillDemoData(): void {
    const demoEnrollment = this.approvedEnrollments[0];
    this.form.patchValue({
      enrollmentId: demoEnrollment?._id || this.form.controls.enrollmentId.value,
      reservedBy: 'Field Officer',
      notes: 'Reserve fertilizer for approved enrollment',
    });
  }

  showError(controlName: string): boolean {
    const control = this.form.get(controlName);
    return Boolean(control && control.invalid && (control.dirty || control.touched));
  }

  submit(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.createdReservation = undefined;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.inventoryService.reserveInventory(this.form.getRawValue() as InventoryReservationPayload).subscribe({
      next: (reservation) => {
        this.createdReservation = reservation;
        this.successMessage = 'Inventory reserved successfully.';
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Unable to reserve inventory.';
        this.isSubmitting = false;
      },
      complete: () => {
        this.isSubmitting = false;
      },
    });
  }
}

