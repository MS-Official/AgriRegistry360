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
  syncDirection: string;
  lastSyncAt: string;
  requestPayload: any;
  responsePayload: any;
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

interface DemoReadiness {
  backend: string;
  mongodb: string;
  odoo: string;
  openG2P: string;
  wso2: string;
  fullDemoFlow: string;
  clientDemoMessage: string;
}

@Component({
  selector: 'app-platform-sync',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="page-title">
      <div>
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 6px;">
          <h1 style="margin: 0;">Platform Sync Center</h1>
          <span class="badge" [ngClass]="{
            'verified': globalMode === 'LIVE_SYNC_ENABLED',
            'pending': globalMode === 'PARTIAL_SYNC' || globalMode === 'DEMO_MODE',
            'rejected': globalMode === 'FAILED'
          }" style="font-size: 13px; padding: 5px 12px;">
            Mode: {{ globalMode.replace('_', ' ') }}
          </span>
        </div>
        <p>Sync AgriRegistry360 registry data to Odoo/OpenG2P and expose APIs through WSO2 API Manager.</p>
      </div>
    </section>

    <!-- Demo Readiness Banner -->
    <article class="panel" style="margin-bottom: 24px; background: var(--surface-strong); border-color: var(--border);">
      <h3 style="margin-top: 0; margin-bottom: 8px;">Demo Readiness Status</h3>
      <div class="readiness-grid">
        <div class="readiness-item">
          <span>Backend Server:</span>
          <strong [style.color]="readiness?.backend === 'READY' ? 'var(--success)' : 'var(--danger)'">
            {{ readiness?.backend || 'LOADING' }}
          </strong>
        </div>
        <div class="readiness-item">
          <span>MongoDB:</span>
          <strong [style.color]="readiness?.mongodb === 'READY' ? 'var(--success)' : 'var(--danger)'">
            {{ readiness?.mongodb || 'LOADING' }}
          </strong>
        </div>
        <div class="readiness-item">
          <span>Odoo ERP:</span>
          <strong [ngStyle]="{ 'color': getReadinessColor(readiness?.odoo) }">
            {{ readiness?.odoo || 'LOADING' }}
          </strong>
        </div>
        <div class="readiness-item">
          <span>OpenG2P:</span>
          <strong [ngStyle]="{ 'color': getReadinessColor(readiness?.openG2P) }">
            {{ readiness?.openG2P || 'LOADING' }}
          </strong>
        </div>
        <div class="readiness-item">
          <span>WSO2 APIM:</span>
          <strong [ngStyle]="{ 'color': getReadinessColor(readiness?.wso2) }">
            {{ readiness?.wso2 || 'LOADING' }}
          </strong>
        </div>
        <div class="readiness-item">
          <span>Cascade Flow:</span>
          <strong [style.color]="readiness?.fullDemoFlow === 'READY' ? 'var(--success)' : 'var(--danger)'">
            {{ readiness?.fullDemoFlow || 'LOADING' }}
          </strong>
        </div>
      </div>
      <p style="margin: 10px 0 0 0; font-size: 13px; color: var(--muted); italic: true;">
        "{{ readiness?.clientDemoMessage }}"
      </p>
    </article>

    <!-- Platform Connection Status Cards -->
    <section class="grid details-grid" style="margin-bottom: 24px; grid-template-columns: repeat(3, 1fr);">
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
        <div class="stat-row"><strong>Base URL:</strong> <a href="http://localhost:8069" target="_blank">http://localhost:8069</a></div>
        <div class="stat-row"><strong>Database:</strong> <span>agriregistry360</span></div>
        <div class="stat-row"><strong>Role:</strong> <span>Inventory, Fulfilment</span></div>
        <div class="stat-row"><strong>Synced:</strong> <span>{{ syncStatusData.odoo.synced + syncStatusData.odoo.demo }} records</span></div>
        
        <!-- Connection Checker -->
        <div class="connection-checker">
          <button class="button secondary" [disabled]="checkingConnection.odoo" (click)="checkConnection('odoo')" style="width: 100%; min-height: 32px; padding: 4px;">
            {{ checkingConnection.odoo ? 'Checking...' : 'Check Odoo Connection' }}
          </button>
          <div *ngIf="connectionStatus.odoo" class="check-result-badge" [ngClass]="{
            'connected': connectionStatus.odoo === 'CONNECTED',
            'failed': connectionStatus.odoo === 'FAILED',
            'disabled': connectionStatus.odoo === 'DISABLED'
          }">
            Status: {{ connectionStatus.odoo }}
          </div>
          <p *ngIf="connectionMessage.odoo" class="connection-desc">{{ connectionMessage.odoo }}</p>
        </div>
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
        <div class="stat-row"><strong>Base URL:</strong> <a href="http://localhost:8069" target="_blank">http://localhost:8069</a></div>
        <div class="stat-row"><strong>Database:</strong> <span>openg2p</span></div>
        <div class="stat-row"><strong>Role:</strong> <span>Registry, G2P Welfare</span></div>
        <div class="stat-row"><strong>Synced:</strong> <span>{{ syncStatusData.openg2p.synced + syncStatusData.openg2p.demo }} records</span></div>
        
        <!-- Connection Checker -->
        <div class="connection-checker">
          <button class="button secondary" [disabled]="checkingConnection.openg2p" (click)="checkConnection('openg2p')" style="width: 100%; min-height: 32px; padding: 4px;">
            {{ checkingConnection.openg2p ? 'Checking...' : 'Check OpenG2P Connection' }}
          </button>
          <div *ngIf="connectionStatus.openg2p" class="check-result-badge" [ngClass]="{
            'connected': connectionStatus.openg2p === 'CONNECTED',
            'failed': connectionStatus.openg2p === 'FAILED',
            'disabled': connectionStatus.openg2p === 'DISABLED'
          }">
            Status: {{ connectionStatus.openg2p }}
          </div>
          <p *ngIf="connectionMessage.openg2p" class="connection-desc">{{ connectionMessage.openg2p }}</p>
        </div>
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
        <div class="stat-row"><strong>Publisher URL:</strong> <a href="https://localhost:9443/publisher" target="_blank">https://localhost:9443/publisher</a></div>
        <div class="stat-row"><strong>Gateway URL:</strong> <a href="https://localhost:8243" target="_blank">https://localhost:8243</a></div>
        <div class="stat-row"><strong>Role:</strong> <span>Security & API Gateway</span></div>
        <div class="stat-row"><strong>Status:</strong> <span>{{ wso2Status?.publishingStatus || 'Ready for Publishing' }}</span></div>
        
        <!-- Connection Checker -->
        <div class="connection-checker">
          <button class="button secondary" [disabled]="checkingConnection.wso2" (click)="checkConnection('wso2')" style="width: 100%; min-height: 32px; padding: 4px;">
            {{ checkingConnection.wso2 ? 'Checking...' : 'Check WSO2 Connection' }}
          </button>
          <div *ngIf="connectionStatus.wso2" class="check-result-badge" [ngClass]="{
            'connected': connectionStatus.wso2 === 'CONNECTED',
            'failed': connectionStatus.wso2 === 'FAILED',
            'disabled': connectionStatus.wso2 === 'DISABLED'
          }">
            Status: {{ connectionStatus.wso2 }}
          </div>
          <p *ngIf="connectionMessage.wso2" class="connection-desc">{{ connectionMessage.wso2 }}</p>
        </div>
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
              <span class="client-msg" *ngIf="step.syncStatus === 'SYNCED' || step.syncStatus === 'DEMO_MODE'">
                {{ getClientFriendlySyncMsg(step) }}
              </span>
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

    <!-- WSO2 Gateway / Publishing Checklist Card -->
    <section class="grid details-grid" style="grid-template-columns: 2fr 1.5fr; gap: 20px; margin-bottom: 24px;">
      <!-- WSO2 Gateway Details -->
      <article class="panel" *ngIf="wso2Status">
        <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h2 style="margin: 0;">WSO2 Gateway Config</h2>
          <span class="badge verified">Gateway Configured</span>
        </header>

        <div class="grid details-grid" style="grid-template-columns: repeat(2, 1fr); gap: 12px;">
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
        </div>

        <div style="margin-top: 20px; display: flex; flex-wrap: wrap; gap: 8px;">
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
      </article>

      <!-- WSO2 Publishing Checklist -->
      <article class="panel">
        <h2 style="margin-top: 0; margin-bottom: 14px;">WSO2 API Publishing Checklist</h2>
        <ul class="checklist-items">
          <li>
            <input type="checkbox" id="check1" checked disabled />
            <label for="check1">Review OpenAPI Schema Docs</label>
          </li>
          <li>
            <input type="checkbox" id="check2" />
            <label for="check2">Download OpenAPI Spec JSON</label>
          </li>
          <li>
            <input type="checkbox" id="check3" />
            <label for="check3">Import into WSO2 Publisher Portal</label>
          </li>
          <li>
            <input type="checkbox" id="check4" />
            <label for="check4">Set endpoint to <code>http://localhost:5001/api</code></label>
          </li>
          <li>
            <input type="checkbox" id="check5" />
            <label for="check5">Deploy and Publish APIs</label>
          </li>
          <li>
            <input type="checkbox" id="check6" />
            <label for="check6">Subscribe via WSO2 Developer Portal</label>
          </li>
          <li>
            <input type="checkbox" id="check7" />
            <label for="check7">Generate Subscription Key Token</label>
          </li>
          <li>
            <input type="checkbox" id="check8" />
            <label for="check8">Toggle Frontend API to WSO2 Gateway URL</label>
          </li>
        </ul>
      </article>
    </section>

    <!-- Quick Links & Resources -->
    <section class="panel" style="margin-bottom: 24px;">
      <h2 style="margin-top: 0; margin-bottom: 12px;">Integration Quick Links & Resources</h2>
      <div class="grid" style="grid-template-columns: repeat(4, 1fr); gap: 12px;">
        <a class="button secondary link-card" href="http://localhost:5001/api/docs" target="_blank">
          <strong>Open Swagger API Docs</strong>
          <span>http://localhost:5001/api/docs</span>
        </a>
        <a class="button secondary link-card" href="http://localhost:5001/api/docs.json" target="_blank">
          <strong>OpenAPI JSON Specification</strong>
          <span>http://localhost:5001/api/docs.json</span>
        </a>
        <a class="button secondary link-card" href="http://localhost:5001/api/catalog" target="_blank">
          <strong>API Catalog Metadata</strong>
          <span>http://localhost:5001/api/catalog</span>
        </a>
        <a class="button secondary link-card" href="http://localhost:5001/api/platform-sync/logs" target="_blank">
          <strong>Platform Sync Logs API</strong>
          <span>/api/platform-sync/logs</span>
        </a>
        <a class="button secondary link-card" href="http://localhost:8069" target="_blank">
          <strong>Local Odoo / OpenG2P UI</strong>
          <span>http://localhost:8069</span>
        </a>
        <a class="button secondary link-card" href="https://localhost:9443/publisher" target="_blank">
          <strong>WSO2 APIM Publisher UI</strong>
          <span>https://localhost:9443/publisher</span>
        </a>
        <a class="button secondary link-card" href="https://localhost:9443/devportal" target="_blank">
          <strong>WSO2 APIM DevPortal UI</strong>
          <span>https://localhost:9443/devportal</span>
        </a>
        <a class="button secondary link-card" href="http://localhost:5001/api/platform-sync/demo-readiness" target="_blank">
          <strong>Readiness Endpoint API</strong>
          <span>/platform-sync/demo-readiness</span>
        </a>
      </div>
    </section>

    <!-- Sync Logs Table -->
    <section class="panel">
      <h2 style="margin-top: 0; margin-bottom: 16px;">Platform Sync History</h2>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Entity Code</th>
              <th>Platform</th>
              <th>Target Model</th>
              <th>Sync Status</th>
              <th>Mode</th>
              <th>Last Synced At</th>
              <th>Error Message</th>
              <th>Payload Details</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngIf="logs.length === 0">
              <td colspan="8" style="text-align: center; color: var(--muted); padding: 24px;">
                No sync logs recorded yet. Execute a sync to populate logs.
              </td>
            </tr>
            <ng-container *ngFor="let log of logs">
              <tr>
                <td><strong>{{ log.entityCode }}</strong><br/><small style="color: var(--muted);">{{ log.entityType }}</small></td>
                <td><span class="badge" style="background: var(--surface-strong); color: var(--text);">{{ log.platform }}</span></td>
                <td><code>{{ log.targetModel || 'N/A' }}</code></td>
                <td>
                  <span class="badge" [class.verified]="log.syncStatus === 'SYNCED' || log.syncStatus === 'DEMO_MODE'" [class.rejected]="log.syncStatus === 'FAILED'">
                    {{ log.syncStatus }}
                  </span>
                </td>
                <td>
                  <span class="badge" [ngClass]="{
                    'verified': log.syncStatus === 'SYNCED',
                    'pending': log.syncStatus === 'DEMO_MODE',
                    'rejected': log.syncStatus === 'FAILED'
                  }">
                    {{ log.syncStatus === 'DEMO_MODE' ? 'DEMO' : 'LIVE' }}
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
                  <button class="button secondary" style="min-height: 28px; padding: 2px 8px; font-size: 12px;" (click)="togglePayload(log._id)">
                    {{ expandedLogId === log._id ? 'Hide JSON' : 'View JSON' }}
                  </button>
                </td>
              </tr>
              <!-- Expandable Row -->
              <tr *ngIf="expandedLogId === log._id">
                <td colspan="8" style="background: #fafbfa; border-bottom: 2px solid var(--border); padding: 16px;">
                  <div class="payload-box">
                    <div>
                      <strong>Request Payload sent to Platform:</strong>
                      <pre><code>{{ log.requestPayload ? (log.requestPayload | json) : 'No request payload' }}</code></pre>
                    </div>
                    <div>
                      <strong>Response Payload received:</strong>
                      <pre><code>{{ log.responsePayload ? (log.responsePayload | json) : 'No response payload' }}</code></pre>
                    </div>
                  </div>
                </td>
              </tr>
            </ng-container>
          </tbody>
        </table>
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
      .client-msg {
        color: var(--success) !important;
        font-weight: bold;
        margin-top: 3px;
      }
      .connection-checker {
        margin-top: 14px;
        border-top: 1px dashed var(--border);
        padding-top: 12px;
      }
      .check-result-badge {
        font-size: 12px;
        font-weight: bold;
        border-radius: 4px;
        text-align: center;
        padding: 4px;
        margin-top: 6px;
      }
      .check-result-badge.connected {
        background: #e7f5ea;
        color: var(--success);
      }
      .check-result-badge.failed {
        background: #fdebea;
        color: var(--danger);
      }
      .check-result-badge.disabled {
        background: #eee;
        color: #777;
      }
      .connection-desc {
        font-size: 11px;
        color: var(--muted);
        margin: 4px 0 0 0;
      }
      .payload-box {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }
      .payload-box pre {
        background: #111;
        color: #00ff00;
        border-radius: 6px;
        padding: 10px;
        font-size: 11px;
        overflow-x: auto;
        max-height: 250px;
        margin: 6px 0 0 0;
      }
      .checklist-items {
        list-style: none;
        padding: 0;
        margin: 0;
      }
      .checklist-items li {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        font-size: 14px;
      }
      .link-card {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: center;
        text-align: left;
        padding: 10px;
        height: 70px;
      }
      .link-card strong {
        font-size: 13px;
        color: var(--primary-strong);
      }
      .link-card span {
        font-size: 11px;
        color: var(--muted);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        width: 100%;
      }
      .readiness-grid {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 12px;
      }
      .readiness-item {
        display: flex;
        flex-direction: column;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 6px;
        padding: 8px;
        text-align: center;
        font-size: 12px;
      }
      .readiness-item span {
        color: var(--muted);
        font-weight: bold;
        margin-bottom: 4px;
      }
      @media (max-width: 980px) {
        .readiness-grid {
          grid-template-columns: repeat(3, 1fr);
        }
        .details-grid {
          grid-template-columns: 1fr !important;
        }
        .payload-box {
          grid-template-columns: 1fr;
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
  expandedLogId: string | null = null;
  readiness: DemoReadiness | null = null;

  // Connection flags
  odooEnabled = false;
  openG2PEnabled = false;
  wso2Enabled = false;

  connectionStatus = {
    odoo: '',
    openg2p: '',
    wso2: '',
  };

  connectionMessage = {
    odoo: '',
    openg2p: '',
    wso2: '',
  };

  checkingConnection = {
    odoo: false,
    openg2p: false,
    wso2: false,
  };

  syncStatusData: SyncStatusResponse = {
    odoo: { total: 0, synced: 0, failed: 0, pending: 0, demo: 0 },
    openg2p: { total: 0, synced: 0, failed: 0, pending: 0, demo: 0 },
  };

  constructor(private readonly http: HttpClient) {}

  ngOnInit(): void {
    this.loadAllData();
    this.loadReadiness();
  }

  get globalMode(): string {
    const odoo = this.connectionStatus.odoo;
    const openg2p = this.connectionStatus.openg2p;
    const wso2 = this.connectionStatus.wso2;

    if (odoo === 'FAILED' || openg2p === 'FAILED' || wso2 === 'FAILED') {
      return 'FAILED';
    }

    const enabledCount =
      (this.odooEnabled ? 1 : 0) +
      (this.openG2PEnabled ? 1 : 0) +
      (this.wso2Enabled ? 1 : 0);

    if (enabledCount === 3) return 'LIVE_SYNC_ENABLED';
    if (enabledCount > 0) return 'PARTIAL_SYNC';
    return 'DEMO_MODE';
  }

  getReadinessColor(status: string | undefined): string {
    if (!status) return 'var(--muted)';
    if (status === 'CONNECTED' || status === 'PUBLISHED') return 'var(--success)';
    if (status === 'FAILED') return 'var(--danger)';
    if (status === 'DEMO_MODE' || status === 'READY_FOR_PUBLISHING') return 'var(--warning)';
    return 'var(--muted)';
  }

  loadReadiness(): void {
    this.http.get<{ success: boolean; data: DemoReadiness }>(`${environment.apiUrl}/platform-sync/demo-readiness`)
      .subscribe({
        next: (res) => {
          this.readiness = res.data;
          this.odooEnabled = res.data.odoo !== 'DEMO_MODE' && res.data.odoo !== 'DISABLED';
          this.openG2PEnabled = res.data.openG2P !== 'DEMO_MODE' && res.data.openG2P !== 'DISABLED';
          this.wso2Enabled = res.data.wso2 !== 'READY_FOR_PUBLISHING' && res.data.wso2 !== 'DISABLED';
        },
      });
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
        },
      });
  }

  checkConnection(platform: 'odoo' | 'openg2p' | 'wso2'): void {
    this.checkingConnection[platform] = true;
    this.http.get<{ success: boolean; status: string; message: string }>(`${environment.apiUrl}/platform-sync/${platform}/connection-check`)
      .subscribe({
        next: (res) => {
          this.checkingConnection[platform] = false;
          this.connectionStatus[platform] = res.status;
          this.connectionMessage[platform] = res.message;
          this.loadReadiness();
        },
        error: (err) => {
          this.checkingConnection[platform] = false;
          this.connectionStatus[platform] = 'FAILED';
          this.connectionMessage[platform] = err.error?.message || err.message;
          this.loadReadiness();
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
          this.loadReadiness();
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
          this.loadReadiness();
        },
        error: (err) => {
          alert('Failed to mark published: ' + err.message);
        },
      });
  }

  togglePayload(logId: string): void {
    this.expandedLogId = this.expandedLogId === logId ? null : logId;
  }

  getClientFriendlySyncMsg(step: SyncStepResult): string {
    if (step.step === 'Sync farmer to Odoo') {
      return 'Farmer synced to Odoo contact/partner';
    }
    if (step.step === 'Sync farmer to OpenG2P') {
      return 'Farmer mapped to OpenG2P registrant/beneficiary';
    }
    if (step.step === 'Sync farm to OpenG2P') {
      return 'Farm mapped to OpenG2P registrant record';
    }
    if (step.step === 'Sync crop to OpenG2P') {
      return 'Crop logged under OpenG2P registrant';
    }
    if (step.step === 'Sync enrollment to OpenG2P') {
      return 'Enrollment mapped to OpenG2P program enrollment';
    }
    if (step.step === 'Sync inventory reservation to Odoo') {
      return 'Inventory reservation mapped to Odoo fulfilment';
    }
    if (step.step === 'APIs WSO2 Ready') {
      return 'APIs ready for WSO2 Gateway publishing';
    }
    return '';
  }
}
