import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { environment } from '../../../environments/environment';

interface PlatformStatus {
  total: number;
  synced: number;
  failed: number;
  pending: number;
  demo: number;
}

interface SyncStatusResponse {
  odoo: PlatformStatus;
  openg2p: PlatformStatus;
  wso2?: PlatformStatus;
}

interface Wso2GatewayStatus {
  wso2Enabled: boolean;
  apiDocsUrl: string;
  apiCatalogUrl: string;
  registryApiContext: string;
  programApiContext: string;
  inventoryApiContext: string;
  gatewayBaseUrl: string;
  publishingStatus: string;
}

interface SyncLog {
  _id: string;
  entityType: string;
  entityId: string;
  entityCode: string;
  platform: string;
  targetModel: string;
  targetExternalId: string;
  syncStatus: string;
  lastSyncAt: string;
  errorMessage: string;
}

interface SyncStepResult {
  step: string;
  entityCode: string;
  platform: string;
  syncStatus: string;
  errorMessage?: string;
}

interface FullSyncResponse {
  mode: string;
  steps: SyncStepResult[];
}

@Component({
  selector: 'app-platform-sync',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="page-title">
      <div>
        <h1>Platform Sync Center</h1>
        <p>Sync AgriRegistry360 registry data to Odoo/OpenG2P and expose APIs through WSO2 API Manager.</p>
      </div>
    </section>

    <!-- Platform Connection Status Cards -->
    <section class="grid details-grid" style="margin-bottom: 24px;">
      <!-- Odoo ERP -->
      <article class="panel platform-card">
        <header class="card-header">
          <h3>Odoo ERP</h3>
          <span class="badge" [class.verified]="syncStatusData.odoo.total > 0" [class.pending]="syncStatusData.odoo.total === 0">
            {{ odooEnabled ? 'LIVE' : 'DEMO MODE' }}
          </span>
        </header>
        <p class="description">Handles inventory, fertilizer and seed stock management, procurement, and reservation fulfilment.</p>
        <hr class="divider" />
        <div class="stat-row"><strong>Base URL:</strong> <span>http://localhost:8069</span></div>
        <div class="stat-row"><strong>Database:</strong> <span>agriregistry360</span></div>
        <div class="stat-row"><strong>Role:</strong> <span>Inventory, Fulfilment</span></div>
        <div class="stat-row"><strong>Synced:</strong> <span>{{ syncStatusData.odoo.synced + syncStatusData.odoo.demo }} records</span></div>
        <div class="stat-row" *ngIf="syncStatusData.odoo.failed > 0"><strong class="error-text">Failed:</strong> <span class="error-text">{{ syncStatusData.odoo.failed }} records</span></div>
      </article>

      <!-- OpenG2P -->
      <article class="panel platform-card">
        <header class="card-header">
          <h3>OpenG2P</h3>
          <span class="badge" [class.verified]="syncStatusData.openg2p.total > 0" [class.pending]="syncStatusData.openg2p.total === 0">
            {{ openG2PEnabled ? 'LIVE' : 'DEMO MODE' }}
          </span>
        </header>
        <p class="description">Handles registrant registries, eligibility checks, program enrollments, and entitlement calculations.</p>
        <hr class="divider" />
        <div class="stat-row"><strong>Base URL:</strong> <span>http://localhost:8069</span></div>
        <div class="stat-row"><strong>Database:</strong> <span>openg2p</span></div>
        <div class="stat-row"><strong>Role:</strong> <span>Registry, G2P Welfare</span></div>
        <div class="stat-row"><strong>Synced:</strong> <span>{{ syncStatusData.openg2p.synced + syncStatusData.openg2p.demo }} records</span></div>
        <div class="stat-row" *ngIf="syncStatusData.openg2p.failed > 0"><strong class="error-text">Failed:</strong> <span class="error-text">{{ syncStatusData.openg2p.failed }} records</span></div>
      </article>

      <!-- WSO2 API Manager -->
      <article class="panel platform-card">
        <header class="card-header">
          <h3>WSO2 API Manager</h3>
          <span class="badge" [class.verified]="wso2Status?.publishingStatus === 'PUBLISHED'" [class.pending]="wso2Status?.publishingStatus !== 'PUBLISHED'">
            {{ wso2Enabled ? 'LIVE' : 'READY' }}
          </span>
        </header>
        <p class="description">Manages API gateway execution, authentication, subscriber access, rate-limiting, and security governance.</p>
        <hr class="divider" />
        <div class="stat-row"><strong>Publisher URL:</strong> <span>https://localhost:9443</span></div>
        <div class="stat-row"><strong>Gateway URL:</strong> <span>https://localhost:8243</span></div>
        <div class="stat-row"><strong>Role:</strong> <span>Security & API Gateway</span></div>
        <div class="stat-row"><strong>Status:</strong> <span>{{ wso2Status?.publishingStatus || 'Ready for Publishing' }}</span></div>
      </article>
    </section>

    <!-- Sync Action Panel -->
    <section class="panel" style="margin-bottom: 24px;">
      <div class="sync-action-wrapper">
        <div>
          <h2 style="margin-top: 0;">Execute Demonstration Sync</h2>
          <p style="color: var(--muted); max-width: 800px; margin-bottom: 0;">
            Triggering the demo sync will gather the seeded Mohomad Ameen farmer registry records, farm layout, crops, subsidy eligibility, program enrollment, and Odoo reservation details, and sync them sequentially to Odoo and OpenG2P.
          </p>
        </div>
        <button class="button" [disabled]="syncInProgress" (click)="triggerDemoSync()" style="min-height: 46px; font-weight: 700;">
          {{ syncInProgress ? 'Syncing...' : 'Sync Full Demo Flow' }}
        </button>
      </div>

      <!-- Sync Progress Step View -->
      <div *ngIf="stepResults.length > 0" class="step-progress-container">
        <h4>Sync Results (Mode: {{ syncMode }})</h4>
        <div class="step-list">
          <div *ngFor="let step of stepResults" class="step-item">
            <span class="step-indicator" [class.success]="step.syncStatus === 'SYNCED' || step.syncStatus === 'DEMO_MODE'" [class.failed]="step.syncStatus === 'FAILED'">
              ✓
            </span>
            <div class="step-details">
              <strong>{{ step.step }}</strong>
              <span>Entity: {{ step.entityCode }} | Platform: {{ step.platform }}</span>
            </div>
            <div class="step-status">
              <span class="badge" [class.verified]="step.syncStatus === 'SYNCED' || step.syncStatus === 'DEMO_MODE'" [class.rejected]="step.syncStatus === 'FAILED'">
                {{ step.syncStatus }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- WSO2 Gateway Card -->
    <section class="panel" style="margin-bottom: 24px;" *ngIf="wso2Status">
      <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h2 style="margin: 0;">WSO2 Gateway Readiness Status</h2>
        <span class="badge verified">Gateway Configured</span>
      </header>

      <div class="grid details-grid">
        <div class="detail-item">
          <div class="detail-label">Registry API Context</div>
          <div class="detail-value"><code>{{ wso2Status.registryApiContext }}</code></div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Program API Context</div>
          <div class="detail-value"><code>{{ wso2Status.programApiContext }}</code></div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Inventory API Context</div>
          <div class="detail-value"><code>{{ wso2Status.inventoryApiContext }}</code></div>
        </div>
        <div class="detail-item">
          <div class="detail-label">WSO2 Gateway Base URL</div>
          <div class="detail-value"><code>{{ wso2Status.gatewayBaseUrl }}</code></div>
        </div>
        <div class="detail-item">
          <div class="detail-label">API OpenAPI JSON Spec</div>
          <div class="detail-value"><a [href]="wso2Status.apiDocsUrl" target="_blank">{{ wso2Status.apiDocsUrl }}</a></div>
        </div>
        <div class="detail-item">
          <div class="detail-label">API Catalog URL</div>
          <div class="detail-value"><a [href]="wso2Status.apiCatalogUrl" target="_blank">{{ wso2Status.apiCatalogUrl }}</a></div>
        </div>
      </div>

      <div style="margin-top: 20px; display: flex; gap: 10px;">
        <button class="button secondary" (click)="markPublished('AgriRegistry360 Registry API', wso2Status.registryApiContext)">
          Mark Registry API as Published
        </button>
        <button class="button secondary" (click)="markPublished('AgriRegistry360 Program API', wso2Status.programApiContext)">
          Mark Program API as Published
        </button>
        <button class="button secondary" (click)="markPublished('AgriRegistry360 Inventory API', wso2Status.inventoryApiContext)">
          Mark Inventory API as Published
        </button>
      </div>
      <div *ngIf="publishedSuccessMessage" class="message success" style="margin-top: 14px; margin-bottom: 0;">
        {{ publishedSuccessMessage }}
      </div>
    </section>

    <!-- Sync Logs Table -->
    <section class="panel">
      <h2 style="margin-top: 0; margin-bottom: 16px;">Platform Sync History</h2>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Entity Type</th>
              <th>Entity Code</th>
              <th>Platform</th>
              <th>Target Model</th>
              <th>Target External ID</th>
              <th>Sync Status</th>
              <th>Last Synced At</th>
              <th>Error Message</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngIf="logs.length === 0">
              <td colspan="9" style="text-align: center; color: var(--muted); padding: 24px;">
                No sync logs recorded yet. Execute a sync to populate logs.
              </td>
            </tr>
            <tr *ngFor="let log of logs">
              <td><strong>{{ log.entityType }}</strong></td>
              <td>{{ log.entityCode }}</td>
              <td><span class="badge" style="background: var(--surface-strong); color: var(--text);">{{ log.platform }}</span></td>
              <td><code>{{ log.targetModel || 'N/A' }}</code></td>
              <td><small>{{ log.targetExternalId || 'N/A' }}</small></td>
              <td>
                <span class="badge" [class.verified]="log.syncStatus === 'SYNCED' || log.syncStatus === 'DEMO_MODE'" [class.rejected]="log.syncStatus === 'FAILED'">
                  {{ log.syncStatus }}
                </span>
              </td>
              <td>{{ log.lastSyncAt | date:'medium' }}</td>
              <td>
                <span *ngIf="log.errorMessage" class="error-text" [title]="log.errorMessage">
                  {{ log.errorMessage.length > 50 ? (log.errorMessage | slice:0:50) + '...' : log.errorMessage }}
                </span>
                <span *ngIf="!log.errorMessage" style="color: var(--muted);">—</span>
              </td>
              <td>
                <button class="button secondary" style="min-height: 28px; padding: 2px 8px; font-size: 12px;" (click)="reSyncEntity(log)">
                  Re-Sync
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Client Explanation Cards -->
    <section class="panel" style="margin-top: 24px;">
      <h2 style="margin-top: 0;">AgriRegistry360 Integration Architecture</h2>
      <div class="grid placeholder-grid" style="grid-template-columns: repeat(3, minmax(0, 1fr));">
        <div class="placeholder">
          <strong>OpenG2P Integration</strong>
          <span>Synchronizes smallholder registries, lands, and subsidy program enrollments directly into OpenG2P, matching national beneficiary structures.</span>
        </div>
        <div class="placeholder">
          <strong>Odoo ERP Integration</strong>
          <span>Exposes inventory reservations to Odoo ERP to ensure fertilizer stocks are decremented, allocated, and prepared for local warehouse distribution.</span>
        </div>
        <div class="placeholder">
          <strong>WSO2 Gateway Security</strong>
          <span>Enforces secure gateway endpoints. By publishing Swagger schemas to WSO2, the client achieves API throttle controls, rate limits, and full usage analytics.</span>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .platform-card {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }
      .card-header h3 {
        margin: 0;
        font-size: 18px;
      }
      .description {
        color: var(--muted);
        font-size: 14px;
        line-height: 1.4;
        margin: 0 0 16px 0;
        flex-grow: 1;
      }
      .divider {
        border: 0;
        border-top: 1px solid var(--border);
        margin: 0 0 12px 0;
      }
      .stat-row {
        display: flex;
        justify-content: space-between;
        font-size: 13px;
        margin-bottom: 8px;
      }
      .stat-row strong {
        color: var(--muted);
      }
      .error-text {
        color: var(--danger);
      }
      .sync-action-wrapper {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 20px;
      }
      .step-progress-container {
        margin-top: 20px;
        border-top: 1px solid var(--border);
        padding-top: 20px;
      }
      .step-progress-container h4 {
        margin-top: 0;
        margin-bottom: 14px;
      }
      .step-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .step-item {
        display: flex;
        align-items: center;
        gap: 12px;
        background: var(--surface-strong);
        border: 1px solid var(--border);
        border-radius: 6px;
        padding: 10px 14px;
      }
      .step-indicator {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        border-radius: 999px;
        font-weight: bold;
        color: white;
      }
      .step-indicator.success {
        background: var(--success);
      }
      .step-indicator.failed {
        background: var(--danger);
      }
      .step-details {
        flex-grow: 1;
        display: flex;
        flex-direction: column;
      }
      .step-details strong {
        font-size: 14px;
      }
      .step-details span {
        font-size: 12px;
        color: var(--muted);
      }
      @media (max-width: 768px) {
        .sync-action-wrapper {
          flex-direction: column;
          align-items: stretch;
        }
      }
    `,
  ],
})
export class PlatformSyncComponent implements OnInit {
  logs: SyncLog[] = [];
  wso2Status: Wso2GatewayStatus | null = null;
  syncInProgress = false;
  stepResults: SyncStepResult[] = [];
  syncMode = '';
  publishedSuccessMessage = '';

  // Connection flags
  odooEnabled = false;
  openG2PEnabled = false;
  wso2Enabled = false;

  syncStatusData: SyncStatusResponse = {
    odoo: { total: 0, synced: 0, failed: 0, pending: 0, demo: 0 },
    openg2p: { total: 0, synced: 0, failed: 0, pending: 0, demo: 0 },
  };

  constructor(private readonly http: HttpClient) {}

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData(): void {
    this.http.get<{ success: boolean; data: SyncStatusResponse }>(`${environment.apiUrl}/platform-sync/status`)
      .subscribe({
        next: (res) => {
          this.syncStatusData = res.data;
        },
      });

    this.http.get<{ success: boolean; data: SyncLog[] }>(`${environment.apiUrl}/platform-sync/logs`)
      .subscribe({
        next: (res) => {
          this.logs = res.data;
        },
      });

    this.http.get<{ success: boolean; data: Wso2GatewayStatus }>(`${environment.apiUrl}/platform-sync/wso2/gateway-status`)
      .subscribe({
        next: (res) => {
          this.wso2Status = res.data;
          this.wso2Enabled = res.data.wso2Enabled;
        },
      });
  }

  triggerDemoSync(): void {
    this.syncInProgress = true;
    this.stepResults = [];
    this.http.post<{ success: boolean; data: FullSyncResponse }>(`${environment.apiUrl}/platform-sync/full-demo`, {})
      .subscribe({
        next: (res) => {
          this.syncInProgress = false;
          this.stepResults = res.data.steps;
          this.syncMode = res.data.mode;
          this.loadAllData();
        },
        error: (err) => {
          this.syncInProgress = false;
          alert('Full demo sync failed: ' + (err.error?.message || err.message));
        },
      });
  }

  markPublished(apiName: string, context: string): void {
    const payload = {
      apiName,
      context,
      gatewayUrl: `${this.wso2Status?.gatewayBaseUrl || 'https://localhost:8243'}${context}/1.0.0`,
    };

    this.http.post(`${environment.apiUrl}/platform-sync/wso2/mark-published`, payload)
      .subscribe({
        next: () => {
          this.publishedSuccessMessage = `${apiName} successfully marked as published.`;
          setTimeout(() => (this.publishedSuccessMessage = ''), 5000);
          this.loadAllData();
        },
        error: (err) => {
          alert('Failed to mark published: ' + err.message);
        },
      });
  }

  reSyncEntity(log: SyncLog): void {
    let endpoint = '';
    if (log.platform === 'ODOO') {
      if (log.entityType === 'FARMER') endpoint = `/platform-sync/farmers/${log.entityId}/odoo`;
      else if (log.entityType === 'INVENTORY_RESERVATION') endpoint = `/platform-sync/reservations/${log.entityId}/odoo`;
    } else if (log.platform === 'OPENG2P') {
      if (log.entityType === 'FARMER') endpoint = `/platform-sync/farmers/${log.entityId}/openg2p`;
      else if (log.entityType === 'FARM') endpoint = `/platform-sync/farms/${log.entityId}/openg2p`;
      else if (log.entityType === 'CROP') endpoint = `/platform-sync/crops/${log.entityId}/openg2p`;
      else if (log.entityType === 'ENROLLMENT') endpoint = `/platform-sync/enrollments/${log.entityId}/openg2p`;
    }

    if (!endpoint) {
      alert('Resync for this entity and platform is not supported directly.');
      return;
    }

    this.http.post(`${environment.apiUrl}${endpoint}`, {}).subscribe({
      next: () => {
        alert('Sync complete!');
        this.loadAllData();
      },
      error: (err) => {
        alert('Sync failed: ' + err.message);
        this.loadAllData();
      },
    });
  }
}
