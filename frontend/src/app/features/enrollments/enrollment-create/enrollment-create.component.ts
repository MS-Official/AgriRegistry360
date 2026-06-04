import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Eligibility } from '../../eligibility/eligibility.model';
import { EligibilityService } from '../../eligibility/eligibility.service';
import {
  approvalStatusClass,
  approvalStatusLabel,
  enrollmentStatusClass,
  enrollmentStatusLabel,
} from '../enrollment-labels';
import { Enrollment, EnrollmentPayload } from '../enrollment.model';
import { EnrollmentService } from '../enrollment.service';

@Component({
  selector: 'app-enrollment-create',
  standalone: true,
  imports: [CommonModule, DatePipe, ReactiveFormsModule, RouterLink],
  template: `
    <section class="page-title">
      <div>
        <h1>Program Enrollment</h1>
        <p>Enroll eligible farmers into the Fertilizer Subsidy Program 2026.</p>
      </div>
      <a class="button secondary" routerLink="/enrollments">View Enrollments</a>
    </section>

    <div *ngIf="successMessage" class="message success">{{ successMessage }}</div>
    <div *ngIf="errorMessage" class="message error">{{ errorMessage }}</div>

    <form class="panel grid form-grid" [formGroup]="form" (ngSubmit)="submit()">
      <div class="field">
        <label for="eligibilityId">Eligible Record</label>
        <select id="eligibilityId" formControlName="eligibilityId">
          <option value="">Select eligible record</option>
          <option *ngFor="let eligibility of eligibleRecords" [value]="eligibility._id">
            {{ eligibility.eligibilityCode }} - {{ eligibility.farmerName }} - {{ eligibility.programName }} -
            {{ eligibility.recommendedEntitlement }}
          </option>
        </select>
        <span *ngIf="showError('eligibilityId')" class="error">Eligible record is required.</span>
        <span *ngIf="!isLoading && eligibleRecords.length === 0" class="error">
          No eligible records found. Please run an Eligibility Check first.
        </span>
      </div>

      <div class="field">
        <label for="enrolledBy">Enrolled By</label>
        <input id="enrolledBy" type="text" formControlName="enrolledBy">
        <span *ngIf="showError('enrolledBy')" class="error">Enrolled by is required.</span>
      </div>

      <div class="field">
        <label for="notes">Notes</label>
        <input id="notes" type="text" formControlName="notes">
      </div>

      <div class="actions">
        <button class="button" type="submit" [disabled]="isSubmitting || eligibleRecords.length === 0">
          {{ isSubmitting ? 'Enrolling...' : 'Create Enrollment' }}
        </button>
        <button class="button secondary" type="button" (click)="fillDemoData()" [disabled]="isSubmitting">
          Use Demo Data
        </button>
      </div>
    </form>

    <section *ngIf="createdEnrollment" class="panel" style="margin-top: 20px;">
      <div class="page-title">
        <div>
          <h1 style="font-size: 22px;">{{ createdEnrollment.enrollmentCode }}</h1>
          <p>{{ createdEnrollment.programName }}</p>
        </div>
        <div class="actions">
          <span class="badge" [ngClass]="enrollmentStatusClass(createdEnrollment.enrollmentStatus)">
            {{ enrollmentStatusLabel(createdEnrollment.enrollmentStatus) }}
          </span>
          <span class="badge" [ngClass]="approvalStatusClass(createdEnrollment.approvalStatus)">
            {{ approvalStatusLabel(createdEnrollment.approvalStatus) }}
          </span>
        </div>
      </div>

      <div class="grid details-grid">
        <div class="detail-item">
          <div class="detail-label">Farmer</div>
          <div class="detail-value">{{ createdEnrollment.farmerCode }} - {{ createdEnrollment.farmerName }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Farm</div>
          <div class="detail-value">{{ createdEnrollment.farmCode }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Crop</div>
          <div class="detail-value">{{ createdEnrollment.cropCode }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Entitlement</div>
          <div class="detail-value">{{ createdEnrollment.entitlement }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Enrollment Date</div>
          <div class="detail-value">{{ createdEnrollment.enrollmentDate | date: 'medium' }}</div>
        </div>
      </div>
    </section>
  `,
})
export class EnrollmentCreateComponent implements OnInit {
  eligibilityChecks: Eligibility[] = [];
  createdEnrollment?: Enrollment;
  errorMessage = '';
  successMessage = '';
  isSubmitting = false;
  isLoading = false;

  readonly enrollmentStatusLabel = enrollmentStatusLabel;
  readonly enrollmentStatusClass = enrollmentStatusClass;
  readonly approvalStatusLabel = approvalStatusLabel;
  readonly approvalStatusClass = approvalStatusClass;

  readonly form = this.fb.nonNullable.group({
    eligibilityId: ['', Validators.required],
    enrolledBy: ['', Validators.required],
    notes: [''],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly eligibilityService: EligibilityService,
    private readonly enrollmentService: EnrollmentService
  ) {}

  get eligibleRecords(): Eligibility[] {
    return this.eligibilityChecks.filter((eligibility) => eligibility.eligibilityStatus === 'ELIGIBLE');
  }

  ngOnInit(): void {
    this.loadEligibilityChecks();
  }

  loadEligibilityChecks(): void {
    this.isLoading = true;
    this.eligibilityService.getEligibilityChecks().subscribe({
      next: (eligibilityChecks) => {
        this.eligibilityChecks = eligibilityChecks;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Unable to load eligibility checks.';
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }

  fillDemoData(): void {
    const demoEligibility =
      this.eligibleRecords.find((eligibility) => eligibility.eligibilityCode.startsWith('ELIG-')) ||
      this.eligibleRecords[0];

    this.form.patchValue({
      eligibilityId: demoEligibility?._id || this.form.controls.eligibilityId.value,
      enrolledBy: 'Field Officer',
      notes: 'Demo enrollment for fertilizer subsidy',
    });
  }

  showError(controlName: string): boolean {
    const control = this.form.get(controlName);
    return Boolean(control && control.invalid && (control.dirty || control.touched));
  }

  submit(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.createdEnrollment = undefined;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.enrollmentService.createEnrollment(this.form.getRawValue() as EnrollmentPayload).subscribe({
      next: (enrollment) => {
        this.createdEnrollment = enrollment;
        this.successMessage = 'Farmer enrolled successfully.';
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Unable to create enrollment.';
        this.isSubmitting = false;
      },
      complete: () => {
        this.isSubmitting = false;
      },
    });
  }
}

