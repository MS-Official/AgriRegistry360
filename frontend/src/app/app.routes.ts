import { Routes } from '@angular/router';
import { FarmerDetailsComponent } from './features/farmers/farmer-details/farmer-details.component';
import { FarmerListComponent } from './features/farmers/farmer-list/farmer-list.component';
import { FarmerRegistrationComponent } from './features/farmers/farmer-registration/farmer-registration.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'farmers' },
  { path: 'farmers', component: FarmerListComponent },
  { path: 'farmers/register', component: FarmerRegistrationComponent },
  { path: 'farmers/:id', component: FarmerDetailsComponent },
];

