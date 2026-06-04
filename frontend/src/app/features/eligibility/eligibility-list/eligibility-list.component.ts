import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  eligibilityStatusClass,
  eligibilityStatusLabel,
} from '../eligibility-labels';
import { Eligibility } from '../eligibility.model';
import { EligibilityService } from '../eligibility.service';

@Component({
  selector: 'app-eligibility-list',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, RouterLink],
  template: `
    <section class="page-title">
      <div>
        <h1>Eligibility List</h1>
        <p>Search stored eligibility checks and review outcomes.</p>
      </div>
      <a class="button" routerLink="/eligibility/check">Run Eligibility Check</a>
    </section>

    <div *ngIf="errorMessage" class="message error">{{ errorMessage }}</div>

    <section class="panel">
      <div class="field" style="margin-bottom: 16px;">
        <label for="search">Search by farmer, farm, crop, program, or status</label>
        <input
          id="search"
          type="search"
          [(ngModel)]="search"
          (keyup.enter)="loadEligibilityChecks()"
          placeholder="Example: Mohamed, FARMER-0001, CROP-0001, ELIGIBLE"
        >
      </div>
      <div class="actions" style="margin-bottom: 16px;">
        <button class="button" type="button" (click)="loadEligibilityChecks()">Search</button>
        <button class="button secondary" type="button" (click)="clearSearch()">Clear</button>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Eligibility Code</th>
              <th>Farmer Code</th>
              <th>Farmer Name</th>
              <th>Farm Code</th>
              <th>Crop Code</th>
              <th>Program Name</th>
              <th>Status</th>
              <th>Entitlement</th>
              <th>Checked By</th>
              <th>Checked At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let eligibility of eligibilityChecks">
              <td>{{ eligibility.eligibilityCode }}</td>
              <td>{{ eligibility.farmerCode }}</td>
              <td>{{ eligibility.farmerName }}</td>
              <td>{{ eligibility.farmCode }}</td>
              <td>{{ eligibility.cropCode }}</td>
              <td>{{ eligibility.programName }}</td>
              <td>
                <span class="badge" [ngClass]="eligibilityStatusClass(eligibility.eligibilityStatus)">
                  {{ eligibilityStatusLabel(eligibility.eligibilityStatus) }}
                </span>
              </td>
              <td>{{ eligibility.recommendedEntitlement }}</td>
              <td>{{ eligibility.checkedBy }}</td>
              <td>{{ eligibility.checkedAt | date: 'medium' }}</td>
              <td>
                <div class="action-buttons">
                  <a class="icon-btn icon-btn-neutral" [routerLink]="['/eligibility', eligibility._id]" title="View eligibility check" aria-label="View eligibility check">
                    <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                  </a>
                </div>
              </td>
            </tr>
            <tr *ngIf="!isLoading && eligibilityChecks.length === 0">
              <td colspan="11">No eligibility checks found.</td>
            </tr>
            <tr *ngIf="isLoading">
              <td colspan="11">Loading eligibility checks...</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `,
})
export class EligibilityListComponent implements OnInit {
  eligibilityChecks: Eligibility[] = [];
  search = '';
  errorMessage = '';
  isLoading = false;

  readonly eligibilityStatusLabel = eligibilityStatusLabel;
  readonly eligibilityStatusClass = eligibilityStatusClass;

  constructor(private readonly eligibilityService: EligibilityService) {}

  ngOnInit(): void {
    this.loadEligibilityChecks();
  }

  loadEligibilityChecks(): void {
    this.errorMessage = '';
    this.isLoading = true;

    this.eligibilityService.getEligibilityChecks(this.search).subscribe({
      next: (eligibilityChecks) => {
        this.eligibilityChecks = eligibilityChecks;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Unable to load eligibility checks.';
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }

  clearSearch(): void {
    this.search = '';
    this.loadEligibilityChecks();
  }
}
