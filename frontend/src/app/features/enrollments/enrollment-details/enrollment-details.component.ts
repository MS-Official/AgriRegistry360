import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
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
  errorMessage = '';

  readonly enrollmentStatusLabel = enrollmentStatusLabel;
  readonly enrollmentStatusClass = enrollmentStatusClass;
  readonly approvalStatusLabel = approvalStatusLabel;
  readonly approvalStatusClass = approvalStatusClass;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly enrollmentService: EnrollmentService
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
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Unable to load enrollment details.';
      },
    });
  }
}

