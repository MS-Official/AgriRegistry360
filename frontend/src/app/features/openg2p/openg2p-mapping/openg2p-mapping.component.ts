import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

interface MappingCard {
  module: string;
  concept: string;
  status: string;
}

@Component({
  selector: 'app-openg2p-mapping',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="page-title">
      <div>
        <h1>OpenG2P Mapping Preparation</h1>
        <p>How AgriRegistry360 maps to OpenG2P registry, program, eligibility, entitlement, and enrollment concepts.</p>
      </div>
      <div class="actions">
        <a class="button secondary" href="http://localhost:5001/api/openg2p/mapping" target="_blank" rel="noreferrer">View Mapping JSON</a>
      </div>
    </section>

    <section class="grid details-grid">
      <article *ngFor="let mapping of mappings" class="panel">
        <h2 style="font-size: 20px; margin-top: 0;">{{ mapping.module }}</h2>
        <div class="detail-item">
          <div class="detail-label">OpenG2P Concept</div>
          <div class="detail-value">{{ mapping.concept }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Status</div>
          <div class="detail-value">
            <span class="badge" [ngClass]="mapping.status === 'EXTERNAL_SYSTEM' ? 'pending' : 'verified'">
              {{ mapping.status }}
            </span>
          </div>
        </div>
      </article>
    </section>

    <section class="panel" style="margin-top: 20px;">
      <div class="grid details-grid">
        <div class="detail-item">
          <div class="detail-label">OpenG2P</div>
          <div class="detail-value">Registry + Eligibility + Program Enrollment</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Odoo ERP</div>
          <div class="detail-value">Inventory + Distribution + Accounting</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">WSO2 API Manager</div>
          <div class="detail-value">Secure API Gateway</div>
        </div>
      </div>
    </section>

    <section class="panel" style="margin-top: 20px;">
      <div class="grid placeholder-grid">
        <div class="placeholder">
          <strong>Registry Sync</strong>
          <span>TODO: Real OpenG2P beneficiary registry import and sync.</span>
        </div>
        <div class="placeholder">
          <strong>Program Rules</strong>
          <span>TODO: Configure subsidy program rules in OpenG2P PBMS.</span>
        </div>
        <div class="placeholder">
          <strong>Entitlement Sync</strong>
          <span>TODO: Sync benefit packages and entitlement references.</span>
        </div>
        <div class="placeholder">
          <strong>Odoo Callback</strong>
          <span>TODO: Connect Odoo fulfilment status back to program records.</span>
        </div>
        <div class="placeholder">
          <strong>WSO2 Security</strong>
          <span>TODO: Route integration APIs through WSO2-secured endpoints.</span>
        </div>
      </div>
    </section>
  `,
})
export class OpenG2PMappingComponent {
  readonly mappings: MappingCard[] = [
    {
      module: 'Farmer Registry',
      concept: 'Registrant / Beneficiary',
      status: 'MAPPED',
    },
    {
      module: 'Farm / Land Registry',
      concept: 'Agriculture registry extension',
      status: 'MAPPED',
    },
    {
      module: 'Crop Registry',
      concept: 'Agriculture activity extension',
      status: 'MAPPED',
    },
    {
      module: 'Eligibility Check',
      concept: 'Program eligibility rules',
      status: 'MAPPED',
    },
    {
      module: 'Program Enrollment',
      concept: 'Program enrollment / entitlement',
      status: 'MAPPED',
    },
    {
      module: 'Odoo Inventory Reservation',
      concept: 'External benefit fulfilment reference',
      status: 'EXTERNAL_SYSTEM',
    },
  ];
}

