import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  eligibilityStatusClass,
  eligibilityStatusLabel,
} from '../eligibility-labels';
import { Eligibility } from '../eligibility.model';
import { EligibilityService } from '../eligibility.service';

@Component({
  selector: 'app-eligibility-details',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink],
  template: `
    <section class="page-title">
      <div>
        <h1>Eligibility Details</h1>
        <p *ngIf="eligibility">{{ eligibility.eligibilityCode }} · {{ eligibility.programName }}</p>
      </div>
      <div class="actions">
        <a class="button secondary" routerLink="/eligibility">Back to Eligibility List</a>
      </div>
    </section>

    <div *ngIf="errorMessage" class="message error">{{ errorMessage }}</div>

    <section *ngIf="eligibility" class="panel">
      <div class="grid details-grid">
        <div class="detail-item">
          <div class="detail-label">Eligibility Code</div>
          <div class="detail-value">{{ eligibility.eligibilityCode }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Farmer</div>
          <div class="detail-value">{{ eligibility.farmerCode }} - {{ eligibility.farmerName }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Farm Code</div>
          <div class="detail-value">{{ eligibility.farmCode }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Crop Code</div>
          <div class="detail-value">{{ eligibility.cropCode }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Program Code</div>
          <div class="detail-value">{{ eligibility.programCode }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Program Name</div>
          <div class="detail-value">{{ eligibility.programName }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Eligibility Status</div>
          <div class="detail-value">
            <span class="badge" [ngClass]="eligibilityStatusClass(eligibility.eligibilityStatus)">
              {{ eligibilityStatusLabel(eligibility.eligibilityStatus) }}
            </span>
          </div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Recommended Entitlement</div>
          <div class="detail-value">{{ eligibility.recommendedEntitlement }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Checked By</div>
          <div class="detail-value">{{ eligibility.checkedBy }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Checked At</div>
          <div class="detail-value">{{ eligibility.checkedAt | date: 'medium' }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Created At</div>
          <div class="detail-value">{{ eligibility.createdAt | date: 'medium' }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Updated At</div>
          <div class="detail-value">{{ eligibility.updatedAt | date: 'medium' }}</div>
        </div>
      </div>

      <section style="margin-top: 22px;">
        <h2 style="font-size: 18px;">Rule Results</h2>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Rule</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let ruleResult of eligibility.ruleResults">
                <td>{{ ruleResult.rule }}</td>
                <td>{{ ruleResult.passed ? 'Passed' : 'Failed' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section style="margin-top: 22px;">
        <h2 style="font-size: 18px;">Failure Reasons</h2>
        <p *ngIf="eligibility.failureReasons.length === 0">No failure reasons.</p>
        <ul *ngIf="eligibility.failureReasons.length > 0">
          <li *ngFor="let reason of eligibility.failureReasons">{{ reason }}</li>
        </ul>
      </section>

      <div class="grid placeholder-grid">
        <div class="placeholder">
          <strong>Program Enrollment</strong>
          <span>TODO: Connect future enrollment workflow.</span>
        </div>
        <div class="placeholder">
          <strong>Odoo Reservation</strong>
          <span>TODO: Connect inventory reservation.</span>
        </div>
        <div class="placeholder">
          <strong>WSO2 Publishing</strong>
          <span>TODO: Publish eligibility APIs through API Manager.</span>
        </div>
        <div class="placeholder">
          <strong>OpenG2P Mapping</strong>
          <span>TODO: Map checks to future OpenG2P program logic.</span>
        </div>
      </div>
    </section>
  `,
})
export class EligibilityDetailsComponent implements OnInit {
  eligibility?: Eligibility;
  errorMessage = '';

  readonly eligibilityStatusLabel = eligibilityStatusLabel;
  readonly eligibilityStatusClass = eligibilityStatusClass;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly eligibilityService: EligibilityService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.errorMessage = 'Eligibility check ID is missing.';
      return;
    }

    this.eligibilityService.getEligibilityById(id).subscribe({
      next: (eligibility) => {
        this.eligibility = eligibility;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Unable to load eligibility details.';
      },
    });
  }
}

