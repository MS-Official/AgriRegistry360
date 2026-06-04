import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { reservationStatusClass, reservationStatusLabel } from '../inventory-labels';
import { InventoryReservation } from '../inventory.model';
import { InventoryService } from '../inventory.service';

@Component({
  selector: 'app-inventory-reservation-list',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, RouterLink],
  template: `
    <section class="page-title">
      <div>
        <h1>Reservation List</h1>
        <p>Search simulated Odoo inventory reservations and update distribution state.</p>
      </div>
      <a class="button" routerLink="/inventory/reserve">Reserve Inventory</a>
    </section>

    <div *ngIf="successMessage" class="message success">{{ successMessage }}</div>
    <div *ngIf="errorMessage" class="message error">{{ errorMessage }}</div>

    <section class="panel">
      <div class="field" style="margin-bottom: 16px;">
        <label for="search">Search by reservation, farmer, program, item, entitlement, or status</label>
        <input
          id="search"
          type="search"
          [(ngModel)]="search"
          (keyup.enter)="loadReservations()"
          placeholder="Example: RESERVE-0001, Mohamed, FERTILIZER_50KG, RESERVED"
        >
      </div>
      <div class="actions" style="margin-bottom: 16px;">
        <button class="button" type="button" (click)="loadReservations()">Search</button>
        <button class="button secondary" type="button" (click)="clearSearch()">Clear</button>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Reservation Code</th>
              <th>Enrollment Code</th>
              <th>Farmer Code</th>
              <th>Farmer Name</th>
              <th>Program Name</th>
              <th>Entitlement</th>
              <th>Item Name</th>
              <th>Reserved Quantity</th>
              <th>Warehouse</th>
              <th>Status</th>
              <th>Reserved By</th>
              <th>Reserved At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let reservation of reservations">
              <td>{{ reservation.reservationCode }}</td>
              <td>{{ reservation.enrollmentCode }}</td>
              <td>{{ reservation.farmerCode }}</td>
              <td>{{ reservation.farmerName }}</td>
              <td>{{ reservation.programName }}</td>
              <td>{{ reservation.entitlement }}</td>
              <td>{{ reservation.itemName }}</td>
              <td>{{ reservation.reservedQuantity }} {{ reservation.unit }}</td>
              <td>{{ reservation.warehouseName }}</td>
              <td>
                <span class="badge" [ngClass]="reservationStatusClass(reservation.reservationStatus)">
                  {{ reservationStatusLabel(reservation.reservationStatus) }}
                </span>
              </td>
              <td>{{ reservation.reservedBy }}</td>
              <td>{{ reservation.reservedAt | date: 'medium' }}</td>
              <td>
                <div class="action-buttons">
                  <a class="icon-btn icon-btn-neutral" [routerLink]="['/inventory/reservations', reservation._id]" title="View reservation" aria-label="View reservation">
                    <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                  </a>
                  <button class="icon-btn icon-btn-info" type="button" (click)="issue(reservation)" title="Issue reservation" aria-label="Issue reservation">
                    <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
                  </button>
                  <button class="icon-btn icon-btn-warning" type="button" (click)="cancel(reservation)" title="Cancel reservation" aria-label="Cancel reservation">
                    <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 14.14 14.14"/></svg>
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="!isLoading && reservations.length === 0">
              <td colspan="13">No inventory reservations found.</td>
            </tr>
            <tr *ngIf="isLoading">
              <td colspan="13">Loading inventory reservations...</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `,
})
export class InventoryReservationListComponent implements OnInit {
  reservations: InventoryReservation[] = [];
  search = '';
  errorMessage = '';
  successMessage = '';
  isLoading = false;

  readonly reservationStatusLabel = reservationStatusLabel;
  readonly reservationStatusClass = reservationStatusClass;

  constructor(private readonly inventoryService: InventoryService) {}

  ngOnInit(): void {
    this.loadReservations();
  }

  loadReservations(): void {
    this.errorMessage = '';
    this.isLoading = true;
    this.inventoryService.getReservations(this.search).subscribe({
      next: (reservations) => {
        this.reservations = reservations;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Unable to load reservations.';
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }

  clearSearch(): void {
    this.search = '';
    this.loadReservations();
  }

  issue(reservation: InventoryReservation): void {
    this.successMessage = '';
    this.errorMessage = '';
    this.inventoryService.issueReservation(reservation._id, 'Fertilizer issued to farmer').subscribe({
      next: () => {
        this.successMessage = `${reservation.reservationCode} issued.`;
        this.loadReservations();
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Unable to issue reservation.';
      },
    });
  }

  cancel(reservation: InventoryReservation): void {
    this.successMessage = '';
    this.errorMessage = '';
    this.inventoryService.cancelReservation(reservation._id, 'Cancelled from reservation list').subscribe({
      next: () => {
        this.successMessage = `${reservation.reservationCode} cancelled.`;
        this.loadReservations();
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Unable to cancel reservation.';
      },
    });
  }
}
