import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="shell">
      <header class="topbar">
        <a class="brand" routerLink="/dashboard" aria-label="AgriRegistry360 dashboard">
          <span class="brand-mark" aria-hidden="true"></span>
          <span>AgriRegistry360</span>
        </a>
        <nav class="nav" aria-label="Main navigation">
          <a routerLink="/dashboard" routerLinkActive="active">Dashboard</a>
          <a routerLink="/farmers" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Farmer List</a>
          <a routerLink="/farms" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Farm / Land List</a>
          <a routerLink="/crops" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Crop List</a>
          <a routerLink="/eligibility" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Eligibility List</a>
          <a routerLink="/enrollments" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Enrollment List</a>
          <a routerLink="/inventory/items" routerLinkActive="active">Inventory Items</a>
          <a routerLink="/inventory/reservations" routerLinkActive="active">Reservation List</a>
          <a routerLink="/wso2/api-catalog" routerLinkActive="active">WSO2 API Catalog</a>
          <a routerLink="/openg2p/mapping" routerLinkActive="active">OpenG2P Mapping</a>
          <a routerLink="/platform-sync" routerLinkActive="active">Platform Sync</a>
        </nav>
      </header>
      <main class="content">
        <router-outlet />
      </main>
    </div>
  `,
})
export class AppComponent {}
