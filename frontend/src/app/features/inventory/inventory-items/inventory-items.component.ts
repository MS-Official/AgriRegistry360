import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { InventoryItem } from '../inventory.model';
import { InventoryService } from '../inventory.service';

@Component({
  selector: 'app-inventory-items',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="page-title">
      <div>
        <h1>Inventory Items</h1>
        <p>Simulated Odoo stock available for agriculture support programs.</p>
      </div>
    </section>

    <div *ngIf="errorMessage" class="message error">{{ errorMessage }}</div>

    <section class="panel">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Item Code</th>
              <th>Item Name</th>
              <th>Category</th>
              <th>Available Quantity</th>
              <th>Reserved Quantity</th>
              <th>Distributed Quantity</th>
              <th>Unit</th>
              <th>Warehouse Name</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of items">
              <td>{{ item.itemCode }}</td>
              <td>{{ item.itemName }}</td>
              <td>{{ item.category }}</td>
              <td>{{ item.availableQuantity }}</td>
              <td>{{ item.reservedQuantity }}</td>
              <td>{{ item.distributedQuantity }}</td>
              <td>{{ item.unit }}</td>
              <td>{{ item.warehouseName }}</td>
              <td>
                <span class="badge" [ngClass]="item.status === 'ACTIVE' ? 'verified' : 'rejected'">
                  {{ item.status }}
                </span>
              </td>
            </tr>
            <tr *ngIf="!isLoading && items.length === 0">
              <td colspan="9">No inventory items found.</td>
            </tr>
            <tr *ngIf="isLoading">
              <td colspan="9">Loading inventory items...</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `,
})
export class InventoryItemsComponent implements OnInit {
  items: InventoryItem[] = [];
  errorMessage = '';
  isLoading = false;

  constructor(private readonly inventoryService: InventoryService) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.inventoryService.getInventoryItems().subscribe({
      next: (items) => {
        this.items = items;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Unable to load inventory items.';
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }
}

