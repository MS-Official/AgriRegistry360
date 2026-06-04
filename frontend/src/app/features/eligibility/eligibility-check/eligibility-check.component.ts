import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { cropTypeLabel, seasonLabel } from '../../crops/crop-labels';
import { Crop } from '../../crops/crop.model';
import { CropService } from '../../crops/crop.service';
import { Farmer } from '../../farmers/farmer.model';
import { FarmerService } from '../../farmers/farmer.service';
import { Farm } from '../../farms/farm.model';
import { FarmService } from '../../farms/farm.service';
import {
  eligibilityStatusClass,
  eligibilityStatusLabel,
  programOptions,
} from '../eligibility-labels';
import { Eligibility, EligibilityPayload } from '../eligibility.model';
import { EligibilityService } from '../eligibility.service';

@Component({
  selector: 'app-eligibility-check',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="page-title">
      <div>
        <h1>Eligibility Check</h1>
        <p>Evaluate Farmer + Farm + Crop records for the Fertilizer Subsidy Program 2026.</p>
      </div>
      <a class="button secondary" routerLink="/eligibility">View Checks</a>
    </section>

    <div *ngIf="successMessage" class="message success">{{ successMessage }}</div>
    <div *ngIf="errorMessage" class="message error">{{ errorMessage }}</div>

    <form class="panel grid form-grid" [formGroup]="form" (ngSubmit)="submit()">
      <div class="field">
        <label for="farmerId">Farmer</label>
        <select id="farmerId" formControlName="farmerId">
          <option value="">Select farmer</option>
          <option *ngFor="let farmer of farmers" [value]="farmer._id">
            {{ farmer.farmerCode }} - {{ farmer.fullName }}
          </option>
        </select>
        <span *ngIf="showError('farmerId')" class="error">Farmer is required.</span>
      </div>

      <div class="field">
        <label for="farmId">Farm / Land</label>
        <select id="farmId" formControlName="farmId">
          <option value="">Select farm / land</option>
          <option *ngFor="let farm of farms" [value]="farm._id">
            {{ farm.farmCode }} - {{ farm.farmerName }} - {{ farm.district }}
          </option>
        </select>
        <span *ngIf="showError('farmId')" class="error">Farm / land is required.</span>
      </div>

      <div class="field">
        <label for="cropId">Crop</label>
        <select id="cropId" formControlName="cropId">
          <option value="">Select crop</option>
          <option *ngFor="let crop of crops" [value]="crop._id">
            {{ crop.cropCode }} - {{ cropTypeLabel(crop.cropType) }} - {{ seasonLabel(crop.season) }} {{ crop.seasonYear }}
          </option>
        </select>
        <span *ngIf="showError('cropId')" class="error">Crop is required.</span>
      </div>

      <div class="field">
        <label for="programCode">Program</label>
        <select id="programCode" formControlName="programCode">
          <option *ngFor="let option of programOptions" [value]="option.value">{{ option.label }}</option>
        </select>
      </div>

      <div class="field">
        <label for="checkedBy">Checked By</label>
        <input id="checkedBy" type="text" formControlName="checkedBy">
        <span *ngIf="showError('checkedBy')" class="error">Checked by is required.</span>
      </div>

      <div class="actions">
        <button class="button" type="submit" [disabled]="isSubmitting">
          {{ isSubmitting ? 'Checking...' : 'Check Eligibility' }}
        </button>
        <button class="button secondary" type="button" (click)="fillDemoData()" [disabled]="isSubmitting">Use Demo Data</button>
      </div>
    </form>

    <section *ngIf="result" class="panel" style="margin-top: 20px;">
      <div class="page-title">
        <div>
          <h1 style="font-size: 22px;">{{ result.eligibilityCode }}</h1>
          <p>{{ result.programName }}</p>
        </div>
        <span class="badge" [ngClass]="eligibilityStatusClass(result.eligibilityStatus)">
          {{ eligibilityStatusLabel(result.eligibilityStatus) }}
        </span>
      </div>

      <div class="grid details-grid">
        <div class="detail-item">
          <div class="detail-label">Farmer</div>
          <div class="detail-value">{{ result.farmerCode }} - {{ result.farmerName }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Farm</div>
          <div class="detail-value">{{ result.farmCode }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Crop</div>
          <div class="detail-value">{{ result.cropCode }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Recommended Entitlement</div>
          <div class="detail-value">{{ result.recommendedEntitlement }}</div>
        </div>
      </div>

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
            <tr *ngFor="let ruleResult of result.ruleResults">
              <td>{{ ruleResult.rule }}</td>
              <td>{{ ruleResult.passed ? 'Passed' : 'Failed' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 style="font-size: 18px;">Failure Reasons</h2>
      <p *ngIf="result.failureReasons.length === 0">No failure reasons.</p>
      <ul *ngIf="result.failureReasons.length > 0">
        <li *ngFor="let reason of result.failureReasons">{{ reason }}</li>
      </ul>
    </section>
  `,
})
export class EligibilityCheckComponent implements OnInit {
  readonly programOptions = programOptions;
  readonly cropTypeLabel = cropTypeLabel;
  readonly seasonLabel = seasonLabel;
  readonly eligibilityStatusLabel = eligibilityStatusLabel;
  readonly eligibilityStatusClass = eligibilityStatusClass;

  farmers: Farmer[] = [];
  farms: Farm[] = [];
  crops: Crop[] = [];
  result?: Eligibility;
  errorMessage = '';
  successMessage = '';
  isSubmitting = false;

  readonly form = this.fb.nonNullable.group({
    farmerId: ['', Validators.required],
    farmId: ['', Validators.required],
    cropId: ['', Validators.required],
    programCode: ['FERTILIZER_SUBSIDY_2026', Validators.required],
    checkedBy: ['', Validators.required],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly farmerService: FarmerService,
    private readonly farmService: FarmService,
    private readonly cropService: CropService,
    private readonly eligibilityService: EligibilityService
  ) {}

  ngOnInit(): void {
    this.loadDropdowns();
  }

  loadDropdowns(): void {
    this.farmerService.getFarmers().subscribe({
      next: (farmers) => (this.farmers = farmers),
      error: (error) => (this.errorMessage = error.error?.message || 'Unable to load farmers.'),
    });
    this.farmService.getFarms().subscribe({
      next: (farms) => (this.farms = farms),
      error: (error) => (this.errorMessage = error.error?.message || 'Unable to load farms.'),
    });
    this.cropService.getCrops().subscribe({
      next: (crops) => (this.crops = crops),
      error: (error) => (this.errorMessage = error.error?.message || 'Unable to load crops.'),
    });
  }

  fillDemoData(): void {
    const demoFarmer = this.farmers.find((farmer) => farmer.farmerCode === 'FARMER-0001');
    const demoFarm = this.farms.find((farm) => farm.farmCode === 'FARM-LAND-0001');
    const demoCrop = this.crops.find((crop) => crop.cropCode === 'CROP-0001');

    this.form.patchValue({
      farmerId: demoFarmer?._id || this.form.controls.farmerId.value,
      farmId: demoFarm?._id || this.form.controls.farmId.value,
      cropId: demoCrop?._id || this.form.controls.cropId.value,
      programCode: 'FERTILIZER_SUBSIDY_2026',
      checkedBy: 'Field Officer',
    });
  }

  showError(controlName: string): boolean {
    const control = this.form.get(controlName);
    return Boolean(control && control.invalid && (control.dirty || control.touched));
  }

  submit(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.result = undefined;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.eligibilityService.checkEligibility(this.form.getRawValue() as EligibilityPayload).subscribe({
      next: (eligibility) => {
        this.result = eligibility;
        this.successMessage = 'Eligibility check completed.';
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Unable to check eligibility.';
        this.isSubmitting = false;
      },
      complete: () => {
        this.isSubmitting = false;
      },
    });
  }
}

