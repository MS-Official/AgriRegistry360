import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  eligibilityStatusClass,
  eligibilityStatusLabel,
} from '../../eligibility/eligibility-labels';
import { Eligibility } from '../../eligibility/eligibility.model';
import { EligibilityService } from '../../eligibility/eligibility.service';
import { verificationStatusClass, verificationStatusLabel } from '../../farmers/farmer-labels';
import {
  cropStatusLabel,
  cropTypeLabel,
  cultivationAreaUnitLabel,
  expectedYieldUnitLabel,
  seasonLabel,
} from '../crop-labels';
import { Crop } from '../crop.model';
import { CropService } from '../crop.service';

@Component({
  selector: 'app-crop-details',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink],
  template: `
    <section class="page-title">
      <div>
        <h1>Crop Details</h1>
        <p *ngIf="crop">{{ crop.cropCode }} · {{ cropTypeLabel(crop.cropType) }} · {{ crop.farmerName }}</p>
      </div>
      <div class="actions">
        <a class="button secondary" routerLink="/crops">Back to Crop List</a>
      </div>
    </section>

    <div *ngIf="errorMessage" class="message error">{{ errorMessage }}</div>

    <section *ngIf="crop" class="panel">
      <div class="grid details-grid">
        <div class="detail-item">
          <div class="detail-label">Crop Code</div>
          <div class="detail-value">{{ crop.cropCode }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Farm Code</div>
          <div class="detail-value">{{ crop.farmCode }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Farmer Code</div>
          <div class="detail-value">{{ crop.farmerCode }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Farmer Name</div>
          <div class="detail-value">{{ crop.farmerName }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Crop Type</div>
          <div class="detail-value">{{ cropTypeLabel(crop.cropType) }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Season</div>
          <div class="detail-value">{{ seasonLabel(crop.season) }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Season Year</div>
          <div class="detail-value">{{ crop.seasonYear }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Cultivation Area</div>
          <div class="detail-value">
            {{ crop.cultivationArea }} {{ cultivationAreaUnitLabel(crop.cultivationAreaUnit) }}
          </div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Planting Date</div>
          <div class="detail-value">{{ crop.plantingDate | date: 'mediumDate' }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Expected Harvest Date</div>
          <div class="detail-value">{{ crop.expectedHarvestDate | date: 'mediumDate' }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Expected Yield</div>
          <div class="detail-value">{{ crop.expectedYield }} {{ expectedYieldUnitLabel(crop.expectedYieldUnit) }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Crop Status</div>
          <div class="detail-value">{{ cropStatusLabel(crop.cropStatus) }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Verification Status</div>
          <div class="detail-value">
            <span class="badge" [ngClass]="verificationStatusClass(crop.verificationStatus)">
              {{ verificationStatusLabel(crop.verificationStatus) }}
            </span>
          </div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Registered By</div>
          <div class="detail-value">{{ crop.registeredBy }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Created At</div>
          <div class="detail-value">{{ crop.createdAt | date: 'medium' }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Updated At</div>
          <div class="detail-value">{{ crop.updatedAt | date: 'medium' }}</div>
        </div>
      </div>

      <section style="margin-top: 22px;">
        <div class="page-title" style="margin-bottom: 12px;">
          <div>
            <h1 style="font-size: 20px;">Eligibility Summary</h1>
            <p>Latest eligibility outcome for this crop.</p>
          </div>
          <a class="button secondary" routerLink="/eligibility/check">Run Eligibility Check</a>
        </div>

        <div class="grid details-grid">
          <div class="detail-item">
            <div class="detail-label">Total Eligibility Checks</div>
            <div class="detail-value">{{ eligibilityChecks.length }}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Latest Eligibility Status</div>
            <div class="detail-value">
              <span *ngIf="latestEligibility" class="badge" [ngClass]="eligibilityStatusClass(latestEligibility.eligibilityStatus)">
                {{ eligibilityStatusLabel(latestEligibility.eligibilityStatus) }}
              </span>
              <span *ngIf="!latestEligibility">-</span>
            </div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Latest Program</div>
            <div class="detail-value">{{ latestEligibility?.programName || '-' }}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Latest Entitlement</div>
            <div class="detail-value">{{ latestEligibility?.recommendedEntitlement || '-' }}</div>
          </div>
        </div>
      </section>

      <div class="grid placeholder-grid">
        <div class="placeholder">
          <strong>Eligibility Status</strong>
          <span>TODO: Connect Farmer + Farm + Crop eligibility checks.</span>
        </div>
        <div class="placeholder">
          <strong>Program Enrollment</strong>
          <span>TODO: Connect future subsidy enrollment workflow.</span>
        </div>
        <div class="placeholder">
          <strong>Odoo Distribution</strong>
          <span>TODO: Connect inventory reservation and distribution status.</span>
        </div>
        <div class="placeholder">
          <strong>WSO2 Publishing</strong>
          <span>TODO: Expose Crop Registry APIs through API Manager.</span>
        </div>
        <div class="placeholder">
          <strong>OpenG2P Mapping</strong>
          <span>TODO: Map crop records into future registry workflows.</span>
        </div>
      </div>
    </section>
  `,
})
export class CropDetailsComponent implements OnInit {
  crop?: Crop;
  eligibilityChecks: Eligibility[] = [];
  errorMessage = '';

  readonly cropTypeLabel = cropTypeLabel;
  readonly seasonLabel = seasonLabel;
  readonly cultivationAreaUnitLabel = cultivationAreaUnitLabel;
  readonly expectedYieldUnitLabel = expectedYieldUnitLabel;
  readonly cropStatusLabel = cropStatusLabel;
  readonly verificationStatusLabel = verificationStatusLabel;
  readonly verificationStatusClass = verificationStatusClass;
  readonly eligibilityStatusLabel = eligibilityStatusLabel;
  readonly eligibilityStatusClass = eligibilityStatusClass;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly cropService: CropService,
    private readonly eligibilityService: EligibilityService
  ) {}

  get latestEligibility(): Eligibility | undefined {
    return this.eligibilityChecks[0];
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.errorMessage = 'Crop ID is missing.';
      return;
    }

    this.cropService.getCropById(id).subscribe({
      next: (crop) => {
        this.crop = crop;
        this.loadEligibilityChecks(crop._id);
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Unable to load crop details.';
      },
    });
  }

  private loadEligibilityChecks(cropId: string): void {
    this.eligibilityService.getEligibilityByCropId(cropId).subscribe({
      next: (eligibilityChecks) => {
        this.eligibilityChecks = eligibilityChecks;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Unable to load eligibility checks.';
      },
    });
  }
}
