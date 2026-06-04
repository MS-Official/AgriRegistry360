import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Farmer } from '../farmer.model';
import { FarmerService } from '../farmer.service';
import {
  farmerTypeLabel,
  verificationStatusClass,
  verificationStatusLabel,
} from '../farmer-labels';

@Component({
  selector: 'app-farmer-details',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink],
  template: `
    <section class="page-title">
      <div>
        <h1>Farmer Details</h1>
        <p *ngIf="farmer">{{ farmer.farmerCode }} · {{ farmer.fullName }}</p>
      </div>
      <div class="actions">
        <a class="button secondary" routerLink="/farmers">Back to List</a>
      </div>
    </section>

    <div *ngIf="errorMessage" class="message error">{{ errorMessage }}</div>

    <section *ngIf="farmer" class="panel">
      <div class="grid details-grid">
        <div class="detail-item">
          <div class="detail-label">Farmer Code</div>
          <div class="detail-value">{{ farmer.farmerCode }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Full Name</div>
          <div class="detail-value">{{ farmer.fullName }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">NIC</div>
          <div class="detail-value">{{ farmer.nationalId }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Mobile Number</div>
          <div class="detail-value">{{ farmer.mobileNumber }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">District</div>
          <div class="detail-value">{{ farmer.district }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">GN Division</div>
          <div class="detail-value">{{ farmer.gnDivision || '-' }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Farmer Type</div>
          <div class="detail-value">{{ farmerTypeLabel(farmer.farmerType) }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Verification Status</div>
          <div class="detail-value">
            <span class="badge" [ngClass]="verificationStatusClass(farmer.verificationStatus)">
              {{ verificationStatusLabel(farmer.verificationStatus) }}
            </span>
          </div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Registered By</div>
          <div class="detail-value">{{ farmer.registeredBy }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Created At</div>
          <div class="detail-value">{{ farmer.createdAt | date: 'medium' }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Updated At</div>
          <div class="detail-value">{{ farmer.updatedAt | date: 'medium' }}</div>
        </div>
      </div>

      <div class="grid placeholder-grid">
        <div class="placeholder">
          <strong>Linked Farms</strong>
          <span>TODO: Connect Farm / Land Registry.</span>
        </div>
        <div class="placeholder">
          <strong>Registered Crops</strong>
          <span>TODO: Connect Crop Registry.</span>
        </div>
        <div class="placeholder">
          <strong>Eligibility Status</strong>
          <span>TODO: Connect subsidy eligibility checks.</span>
        </div>
        <div class="placeholder">
          <strong>Program Enrollment</strong>
          <span>TODO: Connect OpenG2P enrollment workflow.</span>
        </div>
        <div class="placeholder">
          <strong>Odoo Distribution</strong>
          <span>TODO: Connect inventory reservation status.</span>
        </div>
      </div>
    </section>
  `,
})
export class FarmerDetailsComponent implements OnInit {
  farmer?: Farmer;
  errorMessage = '';

  readonly farmerTypeLabel = farmerTypeLabel;
  readonly verificationStatusLabel = verificationStatusLabel;
  readonly verificationStatusClass = verificationStatusClass;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly farmerService: FarmerService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.errorMessage = 'Farmer ID is missing.';
      return;
    }

    this.farmerService.getFarmerById(id).subscribe({
      next: (farmer) => {
        this.farmer = farmer;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Unable to load farmer details.';
      },
    });
  }
}

