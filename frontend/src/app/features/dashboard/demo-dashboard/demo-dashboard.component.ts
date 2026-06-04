import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface DashboardSummary {
  totalFarmers: number;
  totalFarms: number;
  totalCrops: number;
  totalEligibilityChecks: number;
  eligibleChecks: number;
  totalEnrollments: number;
  approvedEnrollments: number;
  totalReservations: number;
  issuedReservations: number;
}

interface SummaryCard {
  label: string;
  value: number;
  note: string;
}

interface WorkflowStep {
  name: string;
  description: string;
  linkLabel: string;
  link: string;
}

interface ExternalLink {
  label: string;
  href: string;
}

@Component({
  selector: 'app-demo-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="page-title">
      <div>
        <h1>AgriRegistry360 Demo Dashboard</h1>
        <p>Integrated Farm & Farmer Registry Demo using OpenG2P, Odoo ERP, and WSO2 API Manager</p>
      </div>
      <div class="actions">
        <a class="button secondary" href="http://localhost:5001/api/docs" target="_blank" rel="noreferrer">Swagger Docs</a>
        <a class="button secondary" href="http://localhost:5001/api/catalog" target="_blank" rel="noreferrer">API Catalog JSON</a>
      </div>
    </section>

    <!-- Platform Sync Ribbon -->
    <div *ngIf="readiness" class="panel platform-ribbon">
      <div>
        <strong>Platform Connectivity:</strong>
        <span>
          Odoo ERP: <strong [style.color]="getReadinessColor(readiness.odoo)">{{ readiness.odoo }}</strong> | 
          OpenG2P: <strong [style.color]="getReadinessColor(readiness.openG2P)">{{ readiness.openG2P }}</strong> | 
          WSO2 Gateway: <strong [style.color]="getReadinessColor(readiness.wso2)">{{ readiness.wso2 }}</strong>
        </span>
      </div>
      <a class="inline-link" routerLink="/platform-sync">Manage Platforms</a>
    </div>

    <div *ngIf="errorMessage" class="message error">{{ errorMessage }}</div>

    <section class="grid summary-grid" aria-label="Dashboard summary">
      <article *ngFor="let card of summaryCards" class="panel metric-card">
        <div class="metric-label">{{ card.label }}</div>
        <div class="metric-value">{{ card.value }}</div>
        <div class="metric-note">{{ card.note }}</div>
      </article>
    </section>

    <section class="section">
      <h2>Complete Demo Workflow</h2>
      <div class="grid workflow-grid">
        <article *ngFor="let step of workflowSteps; index as index" class="panel workflow-card">
          <div class="step-number">{{ index + 1 }}</div>
          <div>
            <h3>{{ step.name }}</h3>
            <span class="badge verified">Completed</span>
            <p>{{ step.description }}</p>
            <a class="inline-link" [routerLink]="step.link">{{ step.linkLabel }}</a>
          </div>
        </article>
      </div>
    </section>

    <section class="section">
      <h2>Platform Responsibilities</h2>
      <div class="grid platform-grid">
        <article class="panel">
          <h3>OpenG2P</h3>
          <ul>
            <li>Registry and beneficiary management</li>
            <li>Eligibility and program enrollment</li>
            <li>Entitlement mapping</li>
          </ul>
        </article>
        <article class="panel">
          <h3>Odoo ERP</h3>
          <ul>
            <li>Inventory stock</li>
            <li>Reservation and issue workflow</li>
            <li>Distribution and operational reporting</li>
          </ul>
        </article>
        <article class="panel">
          <h3>WSO2 API Manager</h3>
          <ul>
            <li>API gateway</li>
            <li>API publishing</li>
            <li>OAuth2/JWT security</li>
            <li>Throttling and monitoring</li>
          </ul>
        </article>
      </div>
    </section>

    <section class="section">
      <div class="panel story-panel">
        <div>
          <h2>Demo Story: Mohamed Ameen Fertilizer Subsidy Flow</h2>
          <p>
            This story card explains the planned client walkthrough. It can be presented even if the
            exact demo records have not yet been seeded in the current local database.
          </p>
        </div>
        <div class="grid story-grid">
          <div class="story-item"><span>Farmer</span><strong>FARMER-0001 - Mohamed Ameen</strong></div>
          <div class="story-item"><span>Farm</span><strong>FARM-LAND-0001</strong></div>
          <div class="story-item"><span>Crop</span><strong>CROP-0001 - Paddy - Maha 2026</strong></div>
          <div class="story-item"><span>Eligibility</span><strong>Eligible for Fertilizer Subsidy Program 2026</strong></div>
          <div class="story-item"><span>Entitlement</span><strong>50KG_FERTILIZER</strong></div>
          <div class="story-item"><span>Enrollment</span><strong>ENROLL-0001</strong></div>
          <div class="story-item"><span>Inventory Reservation</span><strong>RESERVE-0001</strong></div>
          <div class="story-item"><span>Reservation Status</span><strong>{{ reservationStoryStatus }}</strong></div>
        </div>
      </div>
    </section>

    <section class="section">
      <h2>Quick Actions</h2>
      <div class="actions quick-actions">
        <a class="button" routerLink="/farmers/register">Register Farmer</a>
        <a class="button" routerLink="/farms/register">Register Farm / Land</a>
        <a class="button" routerLink="/crops/register">Register Crop</a>
        <a class="button" routerLink="/eligibility/check">Run Eligibility Check</a>
        <a class="button" routerLink="/enrollments/create">Create Program Enrollment</a>
        <a class="button" routerLink="/inventory/reserve">Reserve Inventory</a>
        <a class="button secondary" routerLink="/wso2/api-catalog">View WSO2 API Catalog</a>
        <a class="button secondary" routerLink="/openg2p/mapping">View OpenG2P Mapping</a>
        <a class="button secondary" routerLink="/platform-sync">Platform Sync Center</a>
        <a class="button secondary" *ngFor="let link of externalLinks" [href]="link.href" target="_blank" rel="noreferrer">{{ link.label }}</a>
      </div>
    </section>

    <section class="section">
      <h2>Client Demo Checklist</h2>
      <div class="grid checklist-grid">
        <div *ngFor="let item of checklistItems" class="check-item">
          <span aria-hidden="true">OK</span>
          <strong>{{ item }}</strong>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .section {
        margin-top: 28px;
      }

      .section h2 {
        font-size: 21px;
        margin: 0 0 14px;
      }

      .summary-grid {
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      }

      .platform-ribbon {
        align-items: center;
        background: var(--surface-strong);
        border-color: #cfe5c8;
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        justify-content: space-between;
        margin-bottom: 22px;
        padding: 14px 18px;
      }

      .platform-ribbon strong:first-child {
        color: var(--primary-strong);
      }

      .platform-ribbon span {
        color: var(--muted);
        display: inline-block;
        font-size: 13.5px;
        margin-left: 10px;
      }

      .metric-card {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        min-height: 132px;
      }

      .metric-label,
      .metric-note {
        color: var(--muted);
      }

      .metric-label {
        font-size: 13px;
        font-weight: 700;
        text-transform: uppercase;
      }

      .metric-value {
        color: var(--primary-strong);
        font-size: 34px;
        font-weight: 800;
        line-height: 1.1;
        margin: 12px 0 6px;
      }

      .workflow-grid {
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      }

      .workflow-card {
        display: grid;
        gap: 14px;
        grid-template-columns: auto 1fr;
        height: 100%;
      }

      .workflow-card h3,
      .platform-grid h3 {
        font-size: 18px;
        margin: 0 0 8px;
      }

      .workflow-card p {
        color: var(--muted);
        font-size: 14px;
        line-height: 1.45;
      }

      .step-number {
        align-items: center;
        background: var(--surface-strong);
        border: 1px solid var(--border);
        border-radius: 999px;
        color: var(--primary-strong);
        display: inline-flex;
        font-weight: 800;
        height: 34px;
        justify-content: center;
        width: 34px;
      }

      .inline-link {
        color: var(--primary);
        font-weight: 700;
      }

      .platform-grid {
        align-items: stretch;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      }

      .platform-grid .panel {
        height: 100%;
      }

      ul {
        color: var(--muted);
        line-height: 1.7;
        margin: 0;
        padding-left: 18px;
      }

      .story-panel {
        display: grid;
        gap: 18px;
      }

      .story-panel h2 {
        margin-bottom: 8px;
      }

      .story-panel p {
        color: var(--muted);
        margin: 0;
      }

      .story-grid {
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      }

      .story-item {
        background: var(--surface-soft);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        padding: 12px;
      }

      .story-item span {
        color: var(--muted);
        display: block;
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
      }

      .story-item strong {
        display: block;
        margin-top: 5px;
      }

      .quick-actions .button {
        min-height: 42px;
      }

      .checklist-grid {
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      }

      .check-item {
        align-items: center;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        display: flex;
        gap: 10px;
        min-height: 56px;
        padding: 12px 14px;
      }

      .check-item span {
        align-items: center;
        background: #e7f5ea;
        border-radius: 999px;
        color: var(--success);
        display: inline-flex;
        flex: 0 0 auto;
        font-size: 11px;
        font-weight: 800;
        height: 24px;
        justify-content: center;
        width: 24px;
      }

      @media (max-width: 980px) {
        .platform-ribbon {
          align-items: flex-start;
          flex-direction: column;
        }

        .platform-ribbon span {
          display: block;
          margin: 6px 0 0;
        }
      }
    `,
  ],
})
export class DemoDashboardComponent implements OnInit {
  readiness: any = null;
  summary: DashboardSummary = {
    totalFarmers: 0,
    totalFarms: 0,
    totalCrops: 0,
    totalEligibilityChecks: 0,
    eligibleChecks: 0,
    totalEnrollments: 0,
    approvedEnrollments: 0,
    totalReservations: 0,
    issuedReservations: 0,
  };
  errorMessage = '';

  readonly workflowSteps: WorkflowStep[] = [
    {
      name: 'Farmer Registry',
      description: 'Registers and verifies farmers as registry participants.',
      linkLabel: 'View Farmers',
      link: '/farmers',
    },
    {
      name: 'Farm / Land Registry',
      description: 'Records land parcels, ownership, location, and farm verification status.',
      linkLabel: 'View Farms',
      link: '/farms',
    },
    {
      name: 'Crop Registry',
      description: 'Captures crop season, area, expected yield, and farmer/farm linkage.',
      linkLabel: 'View Crops',
      link: '/crops',
    },
    {
      name: 'Eligibility Check',
      description: 'Evaluates farmer, farm, and crop data against subsidy program rules.',
      linkLabel: 'View Eligibility',
      link: '/eligibility',
    },
    {
      name: 'Program Enrollment',
      description: 'Creates a subsidy enrollment and entitlement for eligible farmers.',
      linkLabel: 'View Enrollments',
      link: '/enrollments',
    },
    {
      name: 'Odoo Inventory Reservation',
      description: 'Reserves and issues inventory through the simulated Odoo fulfilment layer.',
      linkLabel: 'View Reservations',
      link: '/inventory/reservations',
    },
    {
      name: 'WSO2 API Publishing Preparation',
      description: 'Groups API metadata for secure publishing through WSO2 API Manager.',
      linkLabel: 'View API Catalog',
      link: '/wso2/api-catalog',
    },
    {
      name: 'OpenG2P Mapping Preparation',
      description: 'Maps demo modules to OpenG2P registry, program, and entitlement concepts.',
      linkLabel: 'View Mapping',
      link: '/openg2p/mapping',
    },
  ];

  readonly externalLinks: ExternalLink[] = [
    { label: 'Open Swagger API Docs', href: 'http://localhost:5001/api/docs' },
    { label: 'API Catalog JSON', href: 'http://localhost:5001/api/catalog' },
    { label: 'OpenG2P Mapping JSON', href: 'http://localhost:5001/api/openg2p/mapping' },
  ];

  readonly checklistItems = [
    'Backend running on port 5001',
    'Frontend running on port 4200',
    'MongoDB running',
    'Demo farmer available',
    'Demo farm available',
    'Demo crop available',
    'Eligibility check completed',
    'Program enrollment created',
    'Inventory reservation created',
    'Swagger API docs available',
    'WSO2 API catalog available',
    'OpenG2P mapping page available',
    'Platform Sync page available',
    'Odoo sync status visible',
    'OpenG2P sync status visible',
    'WSO2 gateway readiness visible',
  ];

  constructor(private readonly http: HttpClient) {}

  ngOnInit(): void {
    this.http
      .get<ApiResponse<DashboardSummary>>(`${environment.apiUrl}/dashboard/summary`)
      .subscribe({
        next: (response) => {
          this.summary = response.data;
          this.errorMessage = '';
        },
        error: () => {
          this.errorMessage = 'Dashboard summary could not be loaded. Confirm the backend is running on port 5001.';
        },
      });

    this.loadDemoReadiness();
  }

  loadDemoReadiness(): void {
    this.http
      .get<ApiResponse<any>>(`${environment.apiUrl}/platform-sync/demo-readiness`)
      .subscribe({
        next: (response) => {
          this.readiness = response.data;
        },
      });
  }

  getReadinessColor(status: string | undefined): string {
    if (!status) return 'var(--muted)';
    if (status === 'CONNECTED' || status === 'PUBLISHED') return 'var(--success)';
    if (status === 'FAILED') return 'var(--danger)';
    if (status === 'DEMO_MODE' || status === 'READY_FOR_PUBLISHING') return 'var(--warning)';
    return 'var(--muted)';
  }

  get summaryCards(): SummaryCard[] {
    return [
      { label: 'Total Farmers', value: this.summary.totalFarmers, note: 'Registered registry participants' },
      { label: 'Registered Farms / Land Records', value: this.summary.totalFarms, note: 'Farm and land records captured' },
      { label: 'Registered Crops', value: this.summary.totalCrops, note: 'Crop records linked to farms' },
      { label: 'Eligibility Checks', value: this.summary.totalEligibilityChecks, note: 'Program rule evaluations completed' },
      { label: 'Eligible Farmers', value: this.summary.eligibleChecks, note: 'Checks that passed subsidy rules' },
      { label: 'Program Enrollments', value: this.summary.totalEnrollments, note: 'Farmers enrolled into programs' },
      { label: 'Approved Enrollments', value: this.summary.approvedEnrollments, note: 'Enrollments approved for fulfilment' },
      { label: 'Inventory Reservations', value: this.summary.totalReservations, note: 'Odoo-style reservation records' },
      { label: 'Issued Reservations', value: this.summary.issuedReservations, note: 'Reservations marked as issued' },
    ];
  }

  get reservationStoryStatus(): string {
    return this.summary.issuedReservations > 0 ? 'Issued' : 'Reserved';
  }
}
