import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FarmerPayload } from '../farmer.model';
import { FarmerService } from '../farmer.service';
import { farmerTypeOptions } from '../farmer-labels';

@Component({
  selector: 'app-farmer-registration',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="page-title">
      <div>
        <h1>Farmer Registration</h1>
        <p>Register the first Farmer Registry participant for the demo workflow.</p>
      </div>
      <div class="actions">
        <button class="button secondary" type="button" (click)="fillDemoData()">Use Demo Data</button>
        <a class="button secondary" routerLink="/farmers">View Farmers</a>
      </div>
    </section>

    <div *ngIf="successMessage" class="message success">{{ successMessage }}</div>
    <div *ngIf="errorMessage" class="message error">{{ errorMessage }}</div>

    <form class="panel grid form-grid" [formGroup]="form" (ngSubmit)="submit()">
      <div class="field">
        <label for="fullName">Full Name</label>
        <input id="fullName" type="text" formControlName="fullName">
        <span *ngIf="showError('fullName')" class="error">Full name is required.</span>
      </div>

      <div class="field">
        <label for="nationalId">National ID / NIC</label>
        <input id="nationalId" type="text" formControlName="nationalId">
        <span *ngIf="showError('nationalId')" class="error">NIC is required.</span>
      </div>

      <div class="field">
        <label for="mobileNumber">Mobile Number</label>
        <input id="mobileNumber" type="tel" formControlName="mobileNumber">
        <span *ngIf="showError('mobileNumber')" class="error">Mobile number is required.</span>
      </div>

      <div class="field">
        <label for="district">District</label>
        <input id="district" type="text" formControlName="district">
        <span *ngIf="showError('district')" class="error">District is required.</span>
      </div>

      <div class="field">
        <label for="gnDivision">GN Division</label>
        <input id="gnDivision" type="text" formControlName="gnDivision">
      </div>

      <div class="field">
        <label for="farmerType">Farmer Type</label>
        <select id="farmerType" formControlName="farmerType">
          <option value="">Select farmer type</option>
          <option *ngFor="let option of farmerTypeOptions" [value]="option.value">{{ option.label }}</option>
        </select>
        <span *ngIf="showError('farmerType')" class="error">Farmer type is required.</span>
      </div>

      <div class="field">
        <label for="registeredBy">Registered By</label>
        <input id="registeredBy" type="text" formControlName="registeredBy">
        <span *ngIf="showError('registeredBy')" class="error">Registered by is required.</span>
      </div>

      <div class="actions">
        <button class="button" type="submit" [disabled]="isSubmitting">
          {{ isSubmitting ? 'Registering...' : 'Register Farmer' }}
        </button>
        <button class="button secondary" type="button" (click)="form.reset()" [disabled]="isSubmitting">Clear</button>
      </div>
    </form>
  `,
})
export class FarmerRegistrationComponent {
  readonly farmerTypeOptions = farmerTypeOptions;
  errorMessage = '';
  successMessage = '';
  isSubmitting = false;

  readonly form = this.fb.nonNullable.group({
    fullName: ['', Validators.required],
    nationalId: ['', Validators.required],
    mobileNumber: ['', Validators.required],
    district: ['', Validators.required],
    gnDivision: [''],
    farmerType: ['', Validators.required],
    registeredBy: ['', Validators.required],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly farmerService: FarmerService,
    private readonly router: Router
  ) {}

  fillDemoData(): void {
    this.form.patchValue({
      fullName: 'Mohamed Ameen',
      nationalId: '901234567V',
      mobileNumber: '0771234567',
      district: 'Anuradhapura',
      gnDivision: 'Nochchiyagama',
      farmerType: 'SMALLHOLDER',
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
    this.farmerService.registerFarmer(this.form.getRawValue() as FarmerPayload).subscribe({
      next: (farmer) => {
        this.successMessage = `Farmer ${farmer.farmerCode} registered successfully.`;
        this.form.reset();
        this.router.navigate(['/farmers']);
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Unable to register farmer.';
        this.isSubmitting = false;
      },
      complete: () => {
        this.isSubmitting = false;
      },
    });
  }
}

