import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Farmer, VerificationStatus } from '../farmer.model';
import { FarmerService } from '../farmer.service';
import {
  farmerTypeLabel,
  verificationStatusClass,
  verificationStatusLabel,
} from '../farmer-labels';

@Component({
  selector: 'app-farmer-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="page-title">
      <div>
        <h1>Farmer List</h1>
        <p>Search registered farmers and update verification status.</p>
      </div>
      <a class="button" routerLink="/farmers/register">Register Farmer</a>
    </section>

    <div *ngIf="successMessage" class="message success">{{ successMessage }}</div>
    <div *ngIf="errorMessage" class="message error">{{ errorMessage }}</div>

    <section class="panel">
      <div class="field" style="margin-bottom: 16px;">
        <label for="search">Search by code, name, NIC, or district</label>
        <input
          id="search"
          type="search"
          [(ngModel)]="search"
          (keyup.enter)="loadFarmers()"
          placeholder="Example: ameen, 901234567V, Anuradhapura, FARMER-0001"
        >
      </div>
      <div class="actions" style="margin-bottom: 16px;">
        <button class="button" type="button" (click)="loadFarmers()">Search</button>
        <button class="button secondary" type="button" (click)="clearSearch()">Clear</button>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Farmer Code</th>
              <th>Full Name</th>
              <th>NIC</th>
              <th>Mobile Number</th>
              <th>District</th>
              <th>GN Division</th>
              <th>Farmer Type</th>
              <th>Verification Status</th>
              <th>Registered By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let farmer of farmers">
              <td>{{ farmer.farmerCode }}</td>
              <td>{{ farmer.fullName }}</td>
              <td>{{ farmer.nationalId }}</td>
              <td>{{ farmer.mobileNumber }}</td>
              <td>{{ farmer.district }}</td>
              <td>{{ farmer.gnDivision || '-' }}</td>
              <td>{{ farmerTypeLabel(farmer.farmerType) }}</td>
              <td>
                <span class="badge" [ngClass]="verificationStatusClass(farmer.verificationStatus)">
                  {{ verificationStatusLabel(farmer.verificationStatus) }}
                </span>
              </td>
              <td>{{ farmer.registeredBy }}</td>
              <td>
                <div class="actions">
                  <a class="button secondary" [routerLink]="['/farmers', farmer._id]">View</a>
                  <button class="button secondary" type="button" (click)="setStatus(farmer, 'VERIFIED')">Verify</button>
                  <button class="button danger" type="button" (click)="setStatus(farmer, 'REJECTED')">Reject</button>
                </div>
              </td>
            </tr>
            <tr *ngIf="!isLoading && farmers.length === 0">
              <td colspan="10">No farmers found.</td>
            </tr>
            <tr *ngIf="isLoading">
              <td colspan="10">Loading farmers...</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `,
})
export class FarmerListComponent implements OnInit {
  farmers: Farmer[] = [];
  search = '';
  errorMessage = '';
  successMessage = '';
  isLoading = false;

  readonly farmerTypeLabel = farmerTypeLabel;
  readonly verificationStatusLabel = verificationStatusLabel;
  readonly verificationStatusClass = verificationStatusClass;

  constructor(private readonly farmerService: FarmerService) {}

  ngOnInit(): void {
    this.loadFarmers();
  }

  loadFarmers(): void {
    this.errorMessage = '';
    this.isLoading = true;

    this.farmerService.getFarmers(this.search).subscribe({
      next: (farmers) => {
        this.farmers = farmers;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Unable to load farmers.';
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }

  clearSearch(): void {
    this.search = '';
    this.loadFarmers();
  }

  setStatus(farmer: Farmer, verificationStatus: VerificationStatus): void {
    this.successMessage = '';
    this.errorMessage = '';

    this.farmerService.verifyFarmer(farmer._id, verificationStatus).subscribe({
      next: () => {
        this.successMessage = `${farmer.farmerCode} marked as ${verificationStatusLabel(verificationStatus)}.`;
        this.loadFarmers();
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Unable to update farmer verification status.';
      },
    });
  }
}

