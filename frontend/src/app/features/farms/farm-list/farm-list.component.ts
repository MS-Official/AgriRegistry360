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
                <div class="actions">
                  <a class="button secondary" [routerLink]="['/farms', farm._id]">View</a>
                  <button class="button secondary" type="button" (click)="setStatus(farm, 'VERIFIED')">Verify</button>
                  <button class="button danger" type="button" (click)="setStatus(farm, 'REJECTED')">Reject</button>
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

