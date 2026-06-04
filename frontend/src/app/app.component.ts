import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="shell">
      <header class="topbar">
        <div class="brand">AgriRegistry360</div>
        <nav class="nav" aria-label="Main navigation">
          <a routerLink="/dashboard" routerLinkActive="active">Dashboard</a>
          <a routerLink="/farmers/register" routerLinkActive="active">Register Farmer</a>
          <a routerLink="/farmers" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Farmer List</a>
          <a routerLink="/farms/register" routerLinkActive="active">Register Farm / Land</a>
          <a routerLink="/farms" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Farm / Land List</a>
          <a routerLink="/crops/register" routerLinkActive="active">Register Crop</a>
          <a routerLink="/crops" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Crop List</a>
          <a routerLink="/eligibility/check" routerLinkActive="active">Eligibility Check</a>
          <a routerLink="/eligibility" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Eligibility List</a>
          <a routerLink="/enrollments/create" routerLinkActive="active">Program Enrollment</a>
          <a routerLink="/enrollments" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Enrollment List</a>
          <a routerLink="/inventory/items" routerLinkActive="active">Inventory Items</a>
          <a routerLink="/inventory/reserve" routerLinkActive="active">Reserve Inventory</a>
          <a routerLink="/inventory/reservations" routerLinkActive="active">Reservation List</a>
          <a routerLink="/wso2/api-catalog" routerLinkActive="active">WSO2 API Catalog</a>
          <a routerLink="/openg2p/mapping" routerLinkActive="active">OpenG2P Mapping</a>
        </nav>
      </header>
      <main class="content">
        <router-outlet />
      </main>
    </div>
  `,
})
export class AppComponent {}
