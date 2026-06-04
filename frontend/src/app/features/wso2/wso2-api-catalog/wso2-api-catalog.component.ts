import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

interface ApiCatalogCard {
  name: string;
  description: string;
  context: string;
  version: string;
  backendBasePath: string;
  security: string;
  status: string;
}

@Component({
  selector: 'app-wso2-api-catalog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="page-title">
      <div>
        <h1>WSO2 API Manager Publishing Preparation</h1>
        <p>API grouping and metadata prepared for future WSO2 API Manager publishing.</p>
      </div>
      <div class="actions">
        <a class="button secondary" href="http://localhost:5001/api/docs" target="_blank" rel="noreferrer">Open API Docs</a>
        <a class="button secondary" href="http://localhost:5001/api/catalog" target="_blank" rel="noreferrer">View API Catalog JSON</a>
      </div>
    </section>

    <section class="grid details-grid">
      <article *ngFor="let api of apiCatalog" class="panel">
        <h2 style="font-size: 20px; margin-top: 0;">{{ api.name }}</h2>
        <p style="color: var(--muted);">{{ api.description }}</p>
        <div class="detail-item">
          <div class="detail-label">Context</div>
          <div class="detail-value">{{ api.context }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Version</div>
          <div class="detail-value">{{ api.version }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Backend Base Path</div>
          <div class="detail-value">{{ api.backendBasePath }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Security</div>
          <div class="detail-value">{{ api.security }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Status</div>
          <div class="detail-value">
            <span class="badge verified">{{ api.status }}</span>
          </div>
        </div>
      </article>
    </section>

    <section class="panel" style="margin-top: 20px;">
      <div class="grid placeholder-grid">
        <div class="placeholder">
          <strong>Real WSO2 Import</strong>
          <span>TODO: Import the OpenAPI spec into WSO2 API Publisher.</span>
        </div>
        <div class="placeholder">
          <strong>OAuth2 / JWT</strong>
          <span>TODO: Enforce gateway security and scopes.</span>
        </div>
        <div class="placeholder">
          <strong>Subscription Plans</strong>
          <span>TODO: Configure application subscriptions and throttling tiers.</span>
        </div>
        <div class="placeholder">
          <strong>API Analytics</strong>
          <span>TODO: Monitor usage, latency, and errors through WSO2 analytics.</span>
        </div>
        <div class="placeholder">
          <strong>Gateway Deployment</strong>
          <span>TODO: Deploy gateway endpoint for client and integration access.</span>
        </div>
      </div>
    </section>
  `,
})
export class Wso2ApiCatalogComponent {
  readonly apiCatalog: ApiCatalogCard[] = [
    {
      name: 'AgriRegistry360 Registry API',
      description: 'Farmer, Farm/Land, and Crop Registry APIs',
      context: '/agriregistry360/registry',
      version: '1.0.0',
      backendBasePath: 'http://localhost:5001/api',
      security: 'OAuth2/JWT',
      status: 'Ready for WSO2 Publishing',
    },
    {
      name: 'AgriRegistry360 Program API',
      description: 'Eligibility and Program Enrollment APIs',
      context: '/agriregistry360/program',
      version: '1.0.0',
      backendBasePath: 'http://localhost:5001/api',
      security: 'OAuth2/JWT',
      status: 'Ready for WSO2 Publishing',
    },
    {
      name: 'AgriRegistry360 Inventory API',
      description: 'Odoo-style Inventory and Reservation APIs',
      context: '/agriregistry360/inventory',
      version: '1.0.0',
      backendBasePath: 'http://localhost:5001/api',
      security: 'OAuth2/JWT',
      status: 'Ready for WSO2 Publishing',
    },
  ];
}

