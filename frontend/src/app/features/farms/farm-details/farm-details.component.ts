import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { verificationStatusClass, verificationStatusLabel } from '../../farmers/farmer-labels';
import {
  farmStatusLabel,
  irrigationTypeLabel,
  landSizeUnitLabel,
  ownershipTypeLabel,
  soilTypeLabel,
} from '../farm-labels';
import { Farm } from '../farm.model';
import { FarmService } from '../farm.service';

@Component({
  selector: 'app-farm-details',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink],
  template: `
    <section class="page-title">
      <div>
        <h1>Farm / Land Details</h1>
        <p *ngIf="farm">{{ farm.farmCode }} · {{ farm.farmerName }}</p>
      </div>
      <div class="actions">
        <a class="button secondary" routerLink="/farms">Back to Farm List</a>
      </div>
    </section>

    <div *ngIf="errorMessage" class="message error">{{ errorMessage }}</div>

    <section *ngIf="farm" class="panel">
      <div class="grid details-grid">
        <div class="detail-item">
          <div class="detail-label">Farm Code</div>
          <div class="detail-value">{{ farm.farmCode }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Farmer Code</div>
          <div class="detail-value">{{ farm.farmerCode }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Farmer Name</div>
          <div class="detail-value">{{ farm.farmerName }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Land Size</div>
          <div class="detail-value">{{ farm.landSize }} {{ landSizeUnitLabel(farm.landSizeUnit) }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Ownership Type</div>
          <div class="detail-value">{{ ownershipTypeLabel(farm.ownershipType) }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">District</div>
          <div class="detail-value">{{ farm.district }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">GN Division</div>
          <div class="detail-value">{{ farm.gnDivision }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">GPS Latitude</div>
          <div class="detail-value">{{ farm.gpsLatitude ?? '-' }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">GPS Longitude</div>
          <div class="detail-value">{{ farm.gpsLongitude ?? '-' }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Soil Type</div>
          <div class="detail-value">{{ soilTypeLabel(farm.soilType) }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Irrigation Type</div>
          <div class="detail-value">{{ irrigationTypeLabel(farm.irrigationType) }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Farm Status</div>
          <div class="detail-value">{{ farmStatusLabel(farm.farmStatus) }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Verification Status</div>
          <div class="detail-value">
            <span class="badge" [ngClass]="verificationStatusClass(farm.verificationStatus)">
              {{ verificationStatusLabel(farm.verificationStatus) }}
            </span>
          </div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Registered By</div>
          <div class="detail-value">{{ farm.registeredBy }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Created At</div>
          <div class="detail-value">{{ farm.createdAt | date: 'medium' }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Updated At</div>
          <div class="detail-value">{{ farm.updatedAt | date: 'medium' }}</div>
        </div>
      </div>

      <div class="grid placeholder-grid">
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
          <span>TODO: Connect inventory distribution status.</span>
        </div>
      </div>
    </section>
  `,
})
export class FarmDetailsComponent implements OnInit {
  farm?: Farm;
  errorMessage = '';

  readonly ownershipTypeLabel = ownershipTypeLabel;
  readonly landSizeUnitLabel = landSizeUnitLabel;
  readonly soilTypeLabel = soilTypeLabel;
  readonly irrigationTypeLabel = irrigationTypeLabel;
  readonly farmStatusLabel = farmStatusLabel;
  readonly verificationStatusLabel = verificationStatusLabel;
  readonly verificationStatusClass = verificationStatusClass;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly farmService: FarmService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.errorMessage = 'Farm ID is missing.';
      return;
    }

    this.farmService.getFarmById(id).subscribe({
      next: (farm) => {
        this.farm = farm;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Unable to load farm/land details.';
      },
    });
  }
}

