import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Farmer } from '../../farmers/farmer.model';
import { FarmerService } from '../../farmers/farmer.service';
import {
  farmStatusOptions,
  irrigationTypeOptions,
  landSizeUnitOptions,
  ownershipTypeOptions,
  soilTypeOptions,
} from '../farm-labels';
import { FarmPayload } from '../farm.model';
import { FarmService } from '../farm.service';

@Component({
  selector: 'app-farm-registration',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="page-title">
      <div>
        <h1>Farm / Land Registration</h1>
        <p>Register land records under an existing farmer.</p>
      </div>
      <div class="actions">
        <button class="button secondary" type="button" (click)="fillDemoData()">Use Demo Farm Data</button>
        <a class="button secondary" routerLink="/farms">View Farms</a>
      </div>
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
        <label for="landSize">Land Size</label>
        <input id="landSize" type="number" min="0.0001" step="0.01" formControlName="landSize">
        <span *ngIf="showError('landSize')" class="error">Land size must be greater than 0.</span>
      </div>

      <div class="field">
        <label for="landSizeUnit">Land Size Unit</label>
        <select id="landSizeUnit" formControlName="landSizeUnit">
          <option *ngFor="let option of landSizeUnitOptions" [value]="option.value">{{ option.label }}</option>
        </select>
      </div>

      <div class="field">
        <label for="ownershipType">Ownership Type</label>
        <select id="ownershipType" formControlName="ownershipType">
          <option *ngFor="let option of ownershipTypeOptions" [value]="option.value">{{ option.label }}</option>
        </select>
      </div>

      <div class="field">
        <label for="district">District</label>
        <input id="district" type="text" formControlName="district">
        <span *ngIf="showError('district')" class="error">District is required.</span>
      </div>

      <div class="field">
        <label for="gnDivision">GN Division</label>
        <input id="gnDivision" type="text" formControlName="gnDivision">
        <span *ngIf="showError('gnDivision')" class="error">GN Division is required.</span>
      </div>

      <div class="field">
        <label for="gpsLatitude">GPS Latitude</label>
        <input id="gpsLatitude" type="number" step="0.0001" formControlName="gpsLatitude">
      </div>

      <div class="field">
        <label for="gpsLongitude">GPS Longitude</label>
        <input id="gpsLongitude" type="number" step="0.0001" formControlName="gpsLongitude">
      </div>

      <div class="field">
        <label for="soilType">Soil Type</label>
        <select id="soilType" formControlName="soilType">
          <option *ngFor="let option of soilTypeOptions" [value]="option.value">{{ option.label }}</option>
        </select>
      </div>

      <div class="field">
        <label for="irrigationType">Irrigation Type</label>
        <select id="irrigationType" formControlName="irrigationType">
          <option *ngFor="let option of irrigationTypeOptions" [value]="option.value">{{ option.label }}</option>
        </select>
      </div>

      <div class="field">
        <label for="farmStatus">Farm Status</label>
        <select id="farmStatus" formControlName="farmStatus">
          <option *ngFor="let option of farmStatusOptions" [value]="option.value">{{ option.label }}</option>
        </select>
      </div>

      <div class="field">
        <label for="registeredBy">Registered By</label>
        <input id="registeredBy" type="text" formControlName="registeredBy">
        <span *ngIf="showError('registeredBy')" class="error">Registered by is required.</span>
      </div>

      <div class="actions">
        <button class="button" type="submit" [disabled]="isSubmitting">
          {{ isSubmitting ? 'Registering...' : 'Register Farm / Land' }}
        </button>
        <button class="button secondary" type="button" (click)="form.reset(defaultValues)" [disabled]="isSubmitting">Clear</button>
      </div>
    </form>
  `,
})
export class FarmRegistrationComponent implements OnInit {
  readonly ownershipTypeOptions = ownershipTypeOptions;
  readonly landSizeUnitOptions = landSizeUnitOptions;
  readonly soilTypeOptions = soilTypeOptions;
  readonly irrigationTypeOptions = irrigationTypeOptions;
  readonly farmStatusOptions = farmStatusOptions;
  readonly defaultValues = {
    farmerId: '',
    landSize: 0,
    landSizeUnit: 'ACRES',
    ownershipType: 'OWNED',
    district: '',
    gnDivision: '',
    gpsLatitude: null,
    gpsLongitude: null,
    soilType: 'UNKNOWN',
    irrigationType: 'UNKNOWN',
    farmStatus: 'ACTIVE',
    registeredBy: '',
  };

  farmers: Farmer[] = [];
  errorMessage = '';
  successMessage = '';
  isSubmitting = false;

  readonly form = this.fb.nonNullable.group({
    farmerId: ['', Validators.required],
    landSize: [0, [Validators.required, Validators.min(0.0001)]],
    landSizeUnit: ['ACRES', Validators.required],
    ownershipType: ['OWNED', Validators.required],
    district: ['', Validators.required],
    gnDivision: ['', Validators.required],
    gpsLatitude: this.fb.control<number | null>(null),
    gpsLongitude: this.fb.control<number | null>(null),
    soilType: ['UNKNOWN', Validators.required],
    irrigationType: ['UNKNOWN', Validators.required],
    farmStatus: ['ACTIVE', Validators.required],
    registeredBy: ['', Validators.required],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly farmService: FarmService,
    private readonly farmerService: FarmerService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadFarmers();
  }

  loadFarmers(): void {
    this.farmerService.getFarmers().subscribe({
      next: (farmers) => {
        this.farmers = farmers;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Unable to load farmers.';
      },
    });
  }

  fillDemoData(): void {
    const demoFarmer = this.farmers.find(
      (farmer) => farmer.farmerCode === 'FARMER-0001' || farmer.nationalId === '901234567V'
    );

    this.form.patchValue({
      farmerId: demoFarmer?._id || this.form.controls.farmerId.value,
      landSize: 2.5,
      landSizeUnit: 'ACRES',
      ownershipType: 'OWNED',
      district: 'Anuradhapura',
      gnDivision: 'Nochchiyagama',
      gpsLatitude: 8.3432,
      gpsLongitude: 80.3736,
      soilType: 'LOAM',
      irrigationType: 'CANAL',
      farmStatus: 'ACTIVE',
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
    const rawValue = this.form.getRawValue();
    const payload = {
      ...rawValue,
      gpsLatitude: rawValue.gpsLatitude ?? undefined,
      gpsLongitude: rawValue.gpsLongitude ?? undefined,
    } as FarmPayload;

    this.farmService.registerFarm(payload).subscribe({
      next: (farm) => {
        this.successMessage = `Farm/Land ${farm.farmCode} registered successfully.`;
        this.form.reset(this.defaultValues);
        this.router.navigate(['/farms']);
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Unable to register farm/land.';
        this.isSubmitting = false;
      },
      complete: () => {
        this.isSubmitting = false;
      },
    });
  }
}

