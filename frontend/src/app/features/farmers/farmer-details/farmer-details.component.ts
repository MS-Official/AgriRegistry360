import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { cropTypeLabel } from '../../crops/crop-labels';
import { Crop } from '../../crops/crop.model';
import { CropService } from '../../crops/crop.service';
import { FarmService } from '../../farms/farm.service';
import { Farm } from '../../farms/farm.model';
import { landSizeUnitLabel, ownershipTypeLabel } from '../../farms/farm-labels';
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

      <section style="margin-top: 22px;">
        <div class="page-title" style="margin-bottom: 12px;">
          <div>
            <h1 style="font-size: 20px;">Linked Farms / Land Records</h1>
            <p>Farm and land records registered under this farmer.</p>
          </div>
          <a class="button secondary" routerLink="/farms/register">Register Farm / Land</a>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Farm Code</th>
                <th>Land Size</th>
                <th>Ownership Type</th>
                <th>District</th>
                <th>GN Division</th>
                <th>Verification Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let linkedFarm of linkedFarms">
                <td>
                  <a [routerLink]="['/farms', linkedFarm._id]">{{ linkedFarm.farmCode }}</a>
                </td>
                <td>{{ linkedFarm.landSize }} {{ landSizeUnitLabel(linkedFarm.landSizeUnit) }}</td>
                <td>{{ ownershipTypeLabel(linkedFarm.ownershipType) }}</td>
                <td>{{ linkedFarm.district }}</td>
                <td>{{ linkedFarm.gnDivision }}</td>
                <td>
                  <span class="badge" [ngClass]="verificationStatusClass(linkedFarm.verificationStatus)">
                    {{ verificationStatusLabel(linkedFarm.verificationStatus) }}
                  </span>
                </td>
              </tr>
              <tr *ngIf="linkedFarms.length === 0">
                <td colspan="6">No farm/land records registered yet.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section style="margin-top: 22px;">
        <div class="page-title" style="margin-bottom: 12px;">
          <div>
            <h1 style="font-size: 20px;">Crop Summary</h1>
            <p>High-level crop status across this farmer's registered farms.</p>
          </div>
        </div>

        <div class="grid details-grid">
          <div class="detail-item">
            <div class="detail-label">Total Registered Crops</div>
            <div class="detail-value">{{ linkedCrops.length }}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Main Crop Types</div>
            <div class="detail-value">{{ cropTypeSummary || '-' }}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Pending Crop Verifications</div>
            <div class="detail-value">{{ pendingCropVerifications }}</div>
          </div>
        </div>
      </section>

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
  linkedFarms: Farm[] = [];
  linkedCrops: Crop[] = [];
  errorMessage = '';

  readonly farmerTypeLabel = farmerTypeLabel;
  readonly verificationStatusLabel = verificationStatusLabel;
  readonly verificationStatusClass = verificationStatusClass;
  readonly ownershipTypeLabel = ownershipTypeLabel;
  readonly landSizeUnitLabel = landSizeUnitLabel;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly farmerService: FarmerService,
    private readonly farmService: FarmService,
    private readonly cropService: CropService
  ) {}

  get cropTypeSummary(): string {
    const cropTypes = Array.from(new Set(this.linkedCrops.map((crop) => cropTypeLabel(crop.cropType))));
    return cropTypes.join(', ');
  }

  get pendingCropVerifications(): number {
    return this.linkedCrops.filter((crop) => crop.verificationStatus === 'PENDING_VERIFICATION').length;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.errorMessage = 'Farmer ID is missing.';
      return;
    }

    this.farmerService.getFarmerById(id).subscribe({
      next: (farmer) => {
        this.farmer = farmer;
        this.loadLinkedFarms(farmer._id);
        this.loadLinkedCrops(farmer._id);
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Unable to load farmer details.';
      },
    });
  }

  private loadLinkedFarms(farmerId: string): void {
    this.farmService.getFarmsByFarmerId(farmerId).subscribe({
      next: (farms) => {
        this.linkedFarms = farms;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Unable to load linked farms.';
      },
    });
  }

  private loadLinkedCrops(farmerId: string): void {
    this.cropService.getCropsByFarmerId(farmerId).subscribe({
      next: (crops) => {
        this.linkedCrops = crops;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Unable to load linked crops.';
      },
    });
  }
}
