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
          <a routerLink="/farmers/register" routerLinkActive="active">Register Farmer</a>
          <a routerLink="/farmers" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Farmer List</a>
        </nav>
      </header>
      <main class="content">
        <router-outlet />
      </main>
    </div>
  `,
})
export class AppComponent {}

