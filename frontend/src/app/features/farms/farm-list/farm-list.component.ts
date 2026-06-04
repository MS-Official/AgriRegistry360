import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { VerificationStatus } from '../../farmers/farmer.model';
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
  selector: 'app-farm-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="page-title">
      <div>
        <h1>Farm / Land List</h1>
        <p>Search registered land records and manage farm verification.</p>
      </div>
      <a class="button" routerLink="/farms/register">Register Farm / Land</a>
    </section>

    <div *ngIf="successMessage" class="message success">{{ successMessage }}</div>
    <div *ngIf="errorMessage" class="message error">{{ errorMessage }}</div>

    <section class="panel">
      <div class="field" style="margin-bottom: 16px;">
        <label for="search">Search by farm code, farmer, district, GN division, ownership, soil, or irrigation</label>
        <input
          id="search"
          type="search"
          [(ngModel)]="search"
          (keyup.enter)="loadFarms()"
          placeholder="Example: FARM-LAND-0001, Mohamed, Anuradhapura, LOAM"
        >
      </div>
      <div class="actions" style="margin-bottom: 16px;">
        <button class="button" type="button" (click)="loadFarms()">Search</button>
        <button class="button secondary" type="button" (click)="clearSearch()">Clear</button>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Farm Code</th>
              <th>Farmer Code</th>
              <th>Farmer Name</th>
              <th>Land Size</th>
              <th>Unit</th>
              <th>Ownership</th>
              <th>District</th>
              <th>GN Division</th>
              <th>Soil</th>
              <th>Irrigation</th>
              <th>Farm Status</th>
              <th>Verification</th>
              <th>Registered By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let farm of farms">
              <td>{{ farm.farmCode }}</td>
              <td>{{ farm.farmerCode }}</td>
              <td>{{ farm.farmerName }}</td>
              <td>{{ farm.landSize }}</td>
              <td>{{ landSizeUnitLabel(farm.landSizeUnit) }}</td>
              <td>{{ ownershipTypeLabel(farm.ownershipType) }}</td>
              <td>{{ farm.district }}</td>
              <td>{{ farm.gnDivision }}</td>
              <td>{{ soilTypeLabel(farm.soilType) }}</td>
              <td>{{ irrigationTypeLabel(farm.irrigationType) }}</td>
              <td>{{ farmStatusLabel(farm.farmStatus) }}</td>
              <td>
                <span class="badge" [ngClass]="verificationStatusClass(farm.verificationStatus)">
                  {{ verificationStatusLabel(farm.verificationStatus) }}
                </span>
              </td>
              <td>{{ farm.registeredBy }}</td>
              <td>
                <div class="action-buttons">
                  <a class="icon-btn icon-btn-neutral" [routerLink]="['/farms', farm._id]" title="View farm / land" aria-label="View farm / land">
                    <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                  </a>
                  <button class="icon-btn icon-btn-success" type="button" (click)="setStatus(farm, 'VERIFIED')" title="Verify farm / land" aria-label="Verify farm / land">
                    <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
                  </button>
                  <button class="icon-btn icon-btn-danger" type="button" (click)="setStatus(farm, 'REJECTED')" title="Reject farm / land" aria-label="Reject farm / land">
                    <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="!isLoading && farms.length === 0">
              <td colspan="14">No farm/land records found.</td>
            </tr>
            <tr *ngIf="isLoading">
              <td colspan="14">Loading farm/land records...</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `,
})
export class FarmListComponent implements OnInit {
  farms: Farm[] = [];
  search = '';
  errorMessage = '';
  successMessage = '';
  isLoading = false;

  readonly ownershipTypeLabel = ownershipTypeLabel;
  readonly landSizeUnitLabel = landSizeUnitLabel;
  readonly soilTypeLabel = soilTypeLabel;
  readonly irrigationTypeLabel = irrigationTypeLabel;
  readonly farmStatusLabel = farmStatusLabel;
  readonly verificationStatusLabel = verificationStatusLabel;
  readonly verificationStatusClass = verificationStatusClass;

  constructor(private readonly farmService: FarmService) {}

  ngOnInit(): void {
    this.loadFarms();
  }

  loadFarms(): void {
    this.errorMessage = '';
    this.isLoading = true;

    this.farmService.getFarms(this.search).subscribe({
      next: (farms) => {
        this.farms = farms;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Unable to load farm/land records.';
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }

  clearSearch(): void {
    this.search = '';
    this.loadFarms();
  }

  setStatus(farm: Farm, verificationStatus: VerificationStatus): void {
    this.successMessage = '';
    this.errorMessage = '';

    this.farmService.verifyFarm(farm._id, verificationStatus).subscribe({
      next: () => {
        this.successMessage = `${farm.farmCode} marked as ${verificationStatusLabel(verificationStatus)}.`;
        this.loadFarms();
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Unable to update farm verification status.';
      },
    });
  }
}
