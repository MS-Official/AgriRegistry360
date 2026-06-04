import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { verificationStatusClass, verificationStatusLabel } from '../../farmers/farmer-labels';
import { VerificationStatus } from '../../farmers/farmer.model';
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
  selector: 'app-crop-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="page-title">
      <div>
        <h1>Crop List</h1>
        <p>Search registered crops and manage crop verification.</p>
      </div>
      <a class="button" routerLink="/crops/register">Register Crop</a>
    </section>

    <div *ngIf="successMessage" class="message success">{{ successMessage }}</div>
    <div *ngIf="errorMessage" class="message error">{{ errorMessage }}</div>

    <section class="panel">
      <div class="field" style="margin-bottom: 16px;">
        <label for="search">Search by crop code, farm, farmer, crop type, season, or status</label>
        <input
          id="search"
          type="search"
          [(ngModel)]="search"
          (keyup.enter)="loadCrops()"
          placeholder="Example: CROP-0001, FARM-LAND-0001, Mohamed, PADDY, MAHA"
        >
      </div>
      <div class="actions" style="margin-bottom: 16px;">
        <button class="button" type="button" (click)="loadCrops()">Search</button>
        <button class="button secondary" type="button" (click)="clearSearch()">Clear</button>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Crop Code</th>
              <th>Farm Code</th>
              <th>Farmer Code</th>
              <th>Farmer Name</th>
              <th>Crop Type</th>
              <th>Season</th>
              <th>Season Year</th>
              <th>Cultivation Area</th>
              <th>Expected Yield</th>
              <th>Crop Status</th>
              <th>Verification</th>
              <th>Registered By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let crop of crops">
              <td>{{ crop.cropCode }}</td>
              <td>{{ crop.farmCode }}</td>
              <td>{{ crop.farmerCode }}</td>
              <td>{{ crop.farmerName }}</td>
              <td>{{ cropTypeLabel(crop.cropType) }}</td>
              <td>{{ seasonLabel(crop.season) }}</td>
              <td>{{ crop.seasonYear }}</td>
              <td>{{ crop.cultivationArea }} {{ cultivationAreaUnitLabel(crop.cultivationAreaUnit) }}</td>
              <td>{{ crop.expectedYield }} {{ expectedYieldUnitLabel(crop.expectedYieldUnit) }}</td>
              <td>{{ cropStatusLabel(crop.cropStatus) }}</td>
              <td>
                <span class="badge" [ngClass]="verificationStatusClass(crop.verificationStatus)">
                  {{ verificationStatusLabel(crop.verificationStatus) }}
                </span>
              </td>
              <td>{{ crop.registeredBy }}</td>
              <td>
                <div class="actions">
                  <a class="button secondary" [routerLink]="['/crops', crop._id]">View</a>
                  <button class="button secondary" type="button" (click)="setStatus(crop, 'VERIFIED')">Verify</button>
                  <button class="button danger" type="button" (click)="setStatus(crop, 'REJECTED')">Reject</button>
                </div>
              </td>
            </tr>
            <tr *ngIf="!isLoading && crops.length === 0">
              <td colspan="13">No crop records found.</td>
            </tr>
            <tr *ngIf="isLoading">
              <td colspan="13">Loading crop records...</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `,
})
export class CropListComponent implements OnInit {
  crops: Crop[] = [];
  search = '';
  errorMessage = '';
  successMessage = '';
  isLoading = false;

  readonly cropTypeLabel = cropTypeLabel;
  readonly seasonLabel = seasonLabel;
  readonly cultivationAreaUnitLabel = cultivationAreaUnitLabel;
  readonly expectedYieldUnitLabel = expectedYieldUnitLabel;
  readonly cropStatusLabel = cropStatusLabel;
  readonly verificationStatusLabel = verificationStatusLabel;
  readonly verificationStatusClass = verificationStatusClass;

  constructor(private readonly cropService: CropService) {}

  ngOnInit(): void {
    this.loadCrops();
  }

  loadCrops(): void {
    this.errorMessage = '';
    this.isLoading = true;

    this.cropService.getCrops(this.search).subscribe({
      next: (crops) => {
        this.crops = crops;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Unable to load crop records.';
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }

  clearSearch(): void {
    this.search = '';
    this.loadCrops();
  }

  setStatus(crop: Crop, verificationStatus: VerificationStatus): void {
    this.successMessage = '';
    this.errorMessage = '';

    this.cropService.verifyCrop(crop._id, verificationStatus).subscribe({
      next: () => {
        this.successMessage = `${crop.cropCode} marked as ${verificationStatusLabel(verificationStatus)}.`;
        this.loadCrops();
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Unable to update crop verification status.';
      },
    });
  }
}

