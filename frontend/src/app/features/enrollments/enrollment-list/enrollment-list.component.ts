import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  approvalStatusClass,
  approvalStatusLabel,
  enrollmentStatusClass,
  enrollmentStatusLabel,
} from '../enrollment-labels';
import { ApprovalStatus, Enrollment } from '../enrollment.model';
import { EnrollmentService } from '../enrollment.service';

@Component({
  selector: 'app-enrollment-list',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, RouterLink],
  template: `
    <section class="page-title">
      <div>
        <h1>Enrollment List</h1>
        <p>Search program enrollments and manage approval or cancellation.</p>
      </div>
      <a class="button" routerLink="/enrollments/create">Create Program Enrollment</a>
    </section>

    <div *ngIf="successMessage" class="message success">{{ successMessage }}</div>
    <div *ngIf="errorMessage" class="message error">{{ errorMessage }}</div>

    <section class="panel">
      <div class="field" style="margin-bottom: 16px;">
        <label for="search">Search by enrollment, eligibility, farmer, farm, crop, program, or status</label>
        <input
          id="search"
          type="search"
          [(ngModel)]="search"
          (keyup.enter)="loadEnrollments()"
          placeholder="Example: ENROLL-0001, Mohamed, APPROVED"
        >
      </div>
      <div class="actions" style="margin-bottom: 16px;">
        <button class="button" type="button" (click)="loadEnrollments()">Search</button>
        <button class="button secondary" type="button" (click)="clearSearch()">Clear</button>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Enrollment Code</th>
              <th>Eligibility Code</th>
              <th>Farmer Code</th>
              <th>Farmer Name</th>
              <th>Farm Code</th>
              <th>Crop Code</th>
              <th>Program Name</th>
              <th>Entitlement</th>
              <th>Enrollment Status</th>
              <th>Approval Status</th>
              <th>Enrolled By</th>
              <th>Enrollment Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let enrollment of enrollments">
              <td>{{ enrollment.enrollmentCode }}</td>
              <td>{{ enrollment.eligibilityCode }}</td>
              <td>{{ enrollment.farmerCode }}</td>
              <td>{{ enrollment.farmerName }}</td>
              <td>{{ enrollment.farmCode }}</td>
              <td>{{ enrollment.cropCode }}</td>
              <td>{{ enrollment.programName }}</td>
              <td>{{ enrollment.entitlement }}</td>
              <td>
                <span class="badge" [ngClass]="enrollmentStatusClass(enrollment.enrollmentStatus)">
                  {{ enrollmentStatusLabel(enrollment.enrollmentStatus) }}
                </span>
              </td>
              <td>
                <span class="badge" [ngClass]="approvalStatusClass(enrollment.approvalStatus)">
                  {{ approvalStatusLabel(enrollment.approvalStatus) }}
                </span>
              </td>
              <td>{{ enrollment.enrolledBy }}</td>
              <td>{{ enrollment.enrollmentDate | date: 'medium' }}</td>
              <td>
                <div class="action-buttons">
                  <a class="icon-btn icon-btn-neutral" [routerLink]="['/enrollments', enrollment._id]" title="View enrollment" aria-label="View enrollment">
                    <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                  </a>
                  <button class="icon-btn icon-btn-success" type="button" (click)="setApproval(enrollment, 'APPROVED')" title="Approve enrollment" aria-label="Approve enrollment">
                    <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
                  </button>
                  <button class="icon-btn icon-btn-danger" type="button" (click)="setApproval(enrollment, 'REJECTED')" title="Reject enrollment" aria-label="Reject enrollment">
                    <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
                  </button>
                  <button class="icon-btn icon-btn-warning" type="button" (click)="cancel(enrollment)" title="Cancel enrollment" aria-label="Cancel enrollment">
                    <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 14.14 14.14"/></svg>
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="!isLoading && enrollments.length === 0">
              <td colspan="13">No enrollments found.</td>
            </tr>
            <tr *ngIf="isLoading">
              <td colspan="13">Loading enrollments...</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `,
})
export class EnrollmentListComponent implements OnInit {
  enrollments: Enrollment[] = [];
  search = '';
  errorMessage = '';
  successMessage = '';
  isLoading = false;

  readonly enrollmentStatusLabel = enrollmentStatusLabel;
  readonly enrollmentStatusClass = enrollmentStatusClass;
  readonly approvalStatusLabel = approvalStatusLabel;
  readonly approvalStatusClass = approvalStatusClass;

  constructor(private readonly enrollmentService: EnrollmentService) {}

  ngOnInit(): void {
    this.loadEnrollments();
  }

  loadEnrollments(): void {
    this.errorMessage = '';
    this.isLoading = true;
    this.enrollmentService.getEnrollments(this.search).subscribe({
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

  clearSearch(): void {
    this.search = '';
    this.loadEnrollments();
  }

  setApproval(enrollment: Enrollment, approvalStatus: ApprovalStatus): void {
    this.successMessage = '';
    this.errorMessage = '';
    this.enrollmentService.updateEnrollmentApproval(enrollment._id, approvalStatus).subscribe({
      next: () => {
        this.successMessage = `${enrollment.enrollmentCode} marked as ${approvalStatusLabel(approvalStatus)}.`;
        this.loadEnrollments();
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Unable to update approval status.';
      },
    });
  }

  cancel(enrollment: Enrollment): void {
    this.successMessage = '';
    this.errorMessage = '';
    this.enrollmentService.cancelEnrollment(enrollment._id, 'Cancelled from enrollment list').subscribe({
      next: () => {
        this.successMessage = `${enrollment.enrollmentCode} cancelled.`;
        this.loadEnrollments();
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Unable to cancel enrollment.';
      },
    });
  }
}
