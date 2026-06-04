import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Farm } from '../../farms/farm.model';
import { FarmService } from '../../farms/farm.service';
import {
  cropStatusOptions,
  cropTypeOptions,
  cultivationAreaUnitOptions,
  expectedYieldUnitOptions,
  seasonOptions,
} from '../crop-labels';
import { CropPayload } from '../crop.model';
import { CropService } from '../crop.service';

@Component({
  selector: 'app-crop-registration',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="page-title">
      <div>
        <h1>Crop Registration</h1>
        <p>Register crop records under an existing farm or land record.</p>
      </div>
      <div class="actions">
        <button class="button secondary" type="button" (click)="fillDemoData()">Use Demo Crop Data</button>
        <a class="button secondary" routerLink="/crops">View Crops</a>
      </div>
    </section>

    <div *ngIf="successMessage" class="message success">{{ successMessage }}</div>
    <div *ngIf="errorMessage" class="message error">{{ errorMessage }}</div>

    <form class="panel grid form-grid" [formGroup]="form" (ngSubmit)="submit()">
      <div class="field">
        <label for="farmId">Farm / Land</label>
        <select id="farmId" formControlName="farmId">
          <option value="">Select farm / land</option>
          <option *ngFor="let farm of farms" [value]="farm._id">
            {{ farm.farmCode }} - {{ farm.farmerName }} - {{ farm.district }}
          </option>
        </select>
        <span *ngIf="showError('farmId')" class="error">Farm / land record is required.</span>
      </div>

      <div class="field">
        <label for="cropType">Crop Type</label>
        <select id="cropType" formControlName="cropType">
          <option *ngFor="let option of cropTypeOptions" [value]="option.value">{{ option.label }}</option>
        </select>
      </div>

      <div class="field">
        <label for="season">Season</label>
        <select id="season" formControlName="season">
          <option *ngFor="let option of seasonOptions" [value]="option.value">{{ option.label }}</option>
        </select>
      </div>

      <div class="field">
        <label for="seasonYear">Season Year</label>
        <input id="seasonYear" type="number" min="1900" step="1" formControlName="seasonYear">
        <span *ngIf="showError('seasonYear')" class="error">Season year is required.</span>
      </div>

      <div class="field">
        <label for="cultivationArea">Cultivation Area</label>
        <input id="cultivationArea" type="number" min="0.0001" step="0.01" formControlName="cultivationArea">
        <span *ngIf="showError('cultivationArea')" class="error">Cultivation area must be greater than 0.</span>
      </div>

      <div class="field">
        <label for="cultivationAreaUnit">Cultivation Area Unit</label>
        <select id="cultivationAreaUnit" formControlName="cultivationAreaUnit">
          <option *ngFor="let option of cultivationAreaUnitOptions" [value]="option.value">{{ option.label }}</option>
        </select>
      </div>

      <div class="field">
        <label for="plantingDate">Planting Date</label>
        <input id="plantingDate" type="date" formControlName="plantingDate">
        <span *ngIf="showError('plantingDate')" class="error">Planting date is required.</span>
      </div>

      <div class="field">
        <label for="expectedHarvestDate">Expected Harvest Date</label>
        <input id="expectedHarvestDate" type="date" formControlName="expectedHarvestDate">
        <span *ngIf="showError('expectedHarvestDate')" class="error">Expected harvest date is required.</span>
      </div>

      <div class="field">
        <label for="expectedYield">Expected Yield</label>
        <input id="expectedYield" type="number" min="0.0001" step="0.01" formControlName="expectedYield">
        <span *ngIf="showError('expectedYield')" class="error">Expected yield must be greater than 0.</span>
      </div>

      <div class="field">
        <label for="expectedYieldUnit">Expected Yield Unit</label>
        <select id="expectedYieldUnit" formControlName="expectedYieldUnit">
          <option *ngFor="let option of expectedYieldUnitOptions" [value]="option.value">{{ option.label }}</option>
        </select>
      </div>

      <div class="field">
        <label for="cropStatus">Crop Status</label>
        <select id="cropStatus" formControlName="cropStatus">
          <option *ngFor="let option of cropStatusOptions" [value]="option.value">{{ option.label }}</option>
        </select>
      </div>

      <div class="field">
        <label for="registeredBy">Registered By</label>
        <input id="registeredBy" type="text" formControlName="registeredBy">
        <span *ngIf="showError('registeredBy')" class="error">Registered by is required.</span>
      </div>

      <div class="actions">
        <button class="button" type="submit" [disabled]="isSubmitting">
          {{ isSubmitting ? 'Registering...' : 'Register Crop' }}
        </button>
        <button class="button secondary" type="button" (click)="form.reset(defaultValues)" [disabled]="isSubmitting">Clear</button>
      </div>
    </form>
  `,
})
export class CropRegistrationComponent implements OnInit {
  readonly cropTypeOptions = cropTypeOptions;
  readonly seasonOptions = seasonOptions;
  readonly cultivationAreaUnitOptions = cultivationAreaUnitOptions;
  readonly expectedYieldUnitOptions = expectedYieldUnitOptions;
  readonly cropStatusOptions = cropStatusOptions;
  readonly defaultValues = {
    farmId: '',
    cropType: 'PADDY',
    season: 'MAHA',
    seasonYear: 2026,
    cultivationArea: 0,
    cultivationAreaUnit: 'ACRES',
    plantingDate: '',
    expectedHarvestDate: '',
    expectedYield: 0,
    expectedYieldUnit: 'KG',
    cropStatus: 'PLANNED',
    registeredBy: '',
  };

  farms: Farm[] = [];
  errorMessage = '';
  successMessage = '';
  isSubmitting = false;

  readonly form = this.fb.nonNullable.group({
    farmId: ['', Validators.required],
    cropType: ['PADDY', Validators.required],
    season: ['MAHA', Validators.required],
    seasonYear: [2026, [Validators.required, Validators.min(1900)]],
    cultivationArea: [0, [Validators.required, Validators.min(0.0001)]],
    cultivationAreaUnit: ['ACRES', Validators.required],
    plantingDate: ['', Validators.required],
    expectedHarvestDate: ['', Validators.required],
    expectedYield: [0, [Validators.required, Validators.min(0.0001)]],
    expectedYieldUnit: ['KG', Validators.required],
    cropStatus: ['PLANNED', Validators.required],
    registeredBy: ['', Validators.required],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly cropService: CropService,
    private readonly farmService: FarmService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadFarms();
  }

  loadFarms(): void {
    this.farmService.getFarms().subscribe({
      next: (farms) => {
        this.farms = farms;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Unable to load farms.';
      },
    });
  }

  fillDemoData(): void {
    const demoFarm = this.farms.find(
      (farm) => farm.farmCode === 'FARM-LAND-0001' || farm.farmerCode === 'FARMER-0001'
    );

    this.form.patchValue({
      farmId: demoFarm?._id || this.form.controls.farmId.value,
      cropType: 'PADDY',
      season: 'MAHA',
      seasonYear: 2026,
      cultivationArea: 2,
      cultivationAreaUnit: 'ACRES',
      plantingDate: '2026-06-01',
      expectedHarvestDate: '2026-09-20',
      expectedYield: 4500,
      expectedYieldUnit: 'KG',
      cropStatus: 'GROWING',
      registeredBy: 'Field Officer',
    });
  }

  showError(controlName: string): boolean {
    const control = this.form.get(controlName);
    return Boolean(control && control.invalid && (control.dirty || control.touched));
  }

  submit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.cropService.registerCrop(this.form.getRawValue() as CropPayload).subscribe({
      next: (crop) => {
        this.successMessage = `Crop ${crop.cropCode} registered successfully.`;
        this.form.reset(this.defaultValues);
        this.router.navigate(['/crops']);
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Unable to register crop.';
        this.isSubmitting = false;
      },
      complete: () => {
        this.isSubmitting = false;
      },
    });
  }
}

