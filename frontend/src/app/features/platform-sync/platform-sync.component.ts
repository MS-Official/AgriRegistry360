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
  publisherUrl?: string;
  devPortalUrl?: string;
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
  targetModel?: string;
  syncMode?: string;
  syncStatus: string;
  errorMessage?: string;
  requestPayload?: any;
  responsePayload?: any;
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
    <article class="panel readiness-panel">
      <h3>Demo Readiness Status</h3>
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
      <p class="readiness-message">
        "{{ readiness?.clientDemoMessage }}"
      </p>
    </article>

    <!-- Platform Connection Status Cards -->
    <section class="grid platform-status-grid">
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
        <div class="stat-row"><strong>Base URL:</strong> <a href="http://localhost:8070" target="_blank">http://localhost:8070</a></div>
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
    <section class="panel sync-panel">
      <div class="sync-action-wrapper">
        <div>
          <h2 style="margin-top: 0;">Execute Demonstration Sync</h2>
          <p style="color: var(--muted); max-width: 800px; margin-bottom: 0;">
            Triggering the demo sync will gather the seeded Mohamed Ameen farmer registry records, farm layout, crops, subsidy eligibility, program enrollment, and Odoo reservation details, and sync them sequentially to Odoo and OpenG2P.
          </p>
        </div>
        <button class="button" [disabled]="syncInProgress" (click)="triggerDemoSync()" style="min-height: 46px; font-weight: 700;">
          {{ syncInProgress ? 'Syncing...' : 'Sync Full Demo Flow' }}
        </button>
      </div>

      <!-- Enriched Sync Progress Step View -->
      <div *ngIf="stepResults.length > 0" class="step-progress-container">
        <h3 style="margin-top: 0; margin-bottom: 14px;">Sync Results (Flow Mode: {{ syncMode }})</h3>
        <div class="step-list">
          <div *ngFor="let step of stepResults; index as idx" style="background: var(--surface-strong); border: 1px solid var(--border); border-radius: 8px; margin-bottom: 12px; padding: 14px;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <span class="step-indicator" [class.success]="isSuccessfulStatus(step.syncStatus)" [class.failed]="step.syncStatus === 'FAILED'" [class.disabled]="step.syncStatus === 'DISABLED'" style="font-weight: bold; width: 24px; height: 24px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; color: white;">
                  {{ step.syncStatus === 'FAILED' ? '✗' : (step.syncStatus === 'DISABLED' ? '—' : '✓') }}
                </span>
                <div>
                  <strong style="font-size: 15px; display: block;">{{ step.step }}</strong>
                  <span style="font-size: 12px; color: var(--muted);">
                    Entity: <strong>{{ step.entityCode }}</strong> | 
                    Platform: <strong>{{ step.platform }}</strong> | 
                    Model: <code>{{ step.targetModel }}</code> | 
                    Mode: <span class="badge" [class.verified]="step.syncMode === 'LIVE'" [class.pending]="step.syncMode === 'DEMO_MODE'">{{ step.syncMode }}</span>
                  </span>
                </div>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="badge" [class.verified]="step.syncStatus === 'SYNCED' || step.syncStatus === 'FALLBACK_SYNCED'" [class.pending]="step.syncStatus === 'DEMO_MODE'" [class.rejected]="step.syncStatus === 'FAILED'" [class.disabled]="step.syncStatus === 'DISABLED'">
                  {{ step.syncStatus }}
                </span>
                <button *ngIf="step.requestPayload || step.responsePayload" class="button secondary" style="min-height: 28px; padding: 2px 8px; font-size: 12px;" (click)="toggleStepPayload(idx)">
                  {{ expandedStepIdx === idx ? 'Hide Payload' : 'View Payload' }}
                </button>
              </div>
            </div>

            <!-- Warning or Error Message -->
            <div *ngIf="step.errorMessage" style="margin-top: 10px; padding: 8px 12px; background: #fff8f8; border-left: 3px solid var(--danger); border-radius: 4px; font-size: 13px; color: var(--danger);">
              <strong>Message:</strong> {{ step.errorMessage }}
            </div>

            <!-- Expandable Payload box -->
            <div *ngIf="expandedStepIdx === idx" style="margin-top: 12px; padding: 12px; background: #111; border-radius: 6px; border: 1px solid var(--border);">
              <div class="payload-box" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div>
                  <strong style="color: #bbb; font-size: 12px; display: block; margin-bottom: 4px;">Request Payload:</strong>
                  <pre style="margin: 0; color: #00ff00; font-family: monospace; font-size: 11px; overflow-x: auto; max-height: 200px;"><code>{{ step.requestPayload ? (step.requestPayload | json) : 'No request payload' }}</code></pre>
                </div>
                <div>
                  <strong style="color: #bbb; font-size: 12px; display: block; margin-bottom: 4px;">Response Payload:</strong>
                  <pre style="margin: 0; color: #00ff00; font-family: monospace; font-size: 11px; overflow-x: auto; max-height: 200px;"><code>{{ step.responsePayload ? (step.responsePayload | json) : 'No response payload' }}</code></pre>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div *ngIf="usesOpenG2PFallback" class="message warning" style="margin-top: 14px; margin-bottom: 0;">
          OpenG2P PBMS/agriculture models were not detected in this local container, so AgriRegistry360 writes mapped records into visible OpenG2P/Odoo records for demo verification. In production, these mappings will point to official OpenG2P PBMS models.
        </div>
      </div>
    </section>

    <!-- OpenG2P UI Verification -->
    <section class="panel accent-panel">
      <h2 style="margin-top: 0; margin-bottom: 12px;">OpenG2P UI Verification</h2>
      <p style="color: var(--muted); font-size: 14px; margin-bottom: 12px;">
        These records prove that AgriRegistry360 data has been pushed into the OpenG2P-compatible platform.
      </p>
      <div class="grid verification-grid">
        <div class="detail-item">
          <div class="detail-label">Open OpenG2P UI</div>
          <div class="detail-value"><a href="http://localhost:8070" target="_blank">http://localhost:8070</a></div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Contacts Search Terms</div>
          <div class="search-chip-row">
            <code>Mohamed Ameen</code>
            <code>FARM-LAND-0001</code>
            <code>CROP-0001</code>
            <code>ELIG</code>
            <code>ENROLL</code>
          </div>
        </div>
      </div>
    </section>

    <!-- Live Instructions and Platform Demo Checklist Section -->
    <section class="grid platform-two-column">
      <!-- Live Platform Sync Instructions -->
      <article class="panel accent-panel">
        <h2 style="margin-top: 0; margin-bottom: 12px; color: var(--primary-strong);">How to Use Live Mode</h2>
        <p style="color: var(--muted); font-size: 14px; margin-bottom: 14px;">
          Follow these sequential steps to connect AgriRegistry360 with your local Odoo ERP, OpenG2P, and WSO2 API Manager instances:
        </p>
        <ol style="color: var(--text); padding-left: 20px; line-height: 1.6; font-size: 13.5px; margin: 0;">
          <li><strong>Start Platforms:</strong> Run Odoo/OpenG2P and WSO2 locally.</li>
          <li><strong>Configure Environment:</strong> Copy <code>backend/.env.local.platform.example</code> to <code>backend/.env</code>.</li>
          <li><strong>Enable Integration Flags:</strong> Set <code>ODOO_ENABLED=true</code>, <code>OPENG2P_ENABLED=true</code>, and <code>WSO2_ENABLED=true</code>.</li>
          <li><strong>Restart Backend:</strong> Stop and start the backend service.</li>
          <li><strong>Check Odoo Connection:</strong> Click the Odoo Connection check button above.</li>
          <li><strong>Check OpenG2P Connection:</strong> Click the OpenG2P Connection check button above.</li>
          <li><strong>Check WSO2 Connection:</strong> Click the WSO2 Connection check button above.</li>
          <li><strong>Trigger Live Sync:</strong> Click the <em>Sync Full Demo Flow</em> button.</li>
          <li><strong>Verify Locally:</strong> Open the respective platform UIs to see created partners and published APIs.</li>
        </ol>
      </article>

      <!-- Live Platform Demo Checklist -->
      <article class="panel success-panel">
        <h2 style="margin-top: 0; margin-bottom: 12px; color: var(--success);">Live Platform Demo Checklist</h2>
        <p style="color: var(--muted); font-size: 14px; margin-bottom: 14px;">
          Ensure the following local endpoints and services are active and reachable:
        </p>
        <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; font-size: 13.5px;">
          <li style="display: flex; align-items: center; gap: 8px;">
            <span style="color: var(--success); font-weight: bold;">✔</span>
            MongoDB running
          </li>
          <li style="display: flex; align-items: center; gap: 8px;">
            <span style="color: var(--success); font-weight: bold;">✔</span>
            Backend reachable at <a href="http://localhost:5001" target="_blank">http://localhost:5001</a>
          </li>
          <li style="display: flex; align-items: center; gap: 8px;">
            <span style="color: var(--success); font-weight: bold;">✔</span>
            Frontend reachable at <a href="http://localhost:4200" target="_blank">http://localhost:4200</a>
          </li>
          <li style="display: flex; align-items: center; gap: 8px;">
            <span style="color: var(--success); font-weight: bold;">✔</span>
            Odoo UI reachable at <a [href]="connectionBaseUrl.odoo" target="_blank">{{ connectionBaseUrl.odoo }}</a>
          </li>
          <li style="display: flex; align-items: center; gap: 8px;">
            <span style="color: var(--success); font-weight: bold;">✔</span>
            OpenG2P UI reachable at <a [href]="connectionBaseUrl.openg2p" target="_blank">{{ connectionBaseUrl.openg2p }}</a>
          </li>
          <li style="display: flex; align-items: center; gap: 8px;">
            <span style="color: var(--success); font-weight: bold;">✔</span>
            WSO2 Publisher reachable at <a [href]="wso2Status?.publisherUrl || 'https://localhost:9443/publisher'" target="_blank">{{ wso2Status?.publisherUrl || 'https://localhost:9443/publisher' }}</a>
          </li>
          <li style="display: flex; align-items: center; gap: 8px;">
            <span style="color: var(--success); font-weight: bold;">✔</span>
            WSO2 DevPortal reachable at <a [href]="wso2Status?.devPortalUrl || 'https://localhost:9443/devportal'" target="_blank">{{ wso2Status?.devPortalUrl || 'https://localhost:9443/devportal' }}</a>
          </li>
          <li style="display: flex; align-items: center; gap: 8px;">
            <span style="color: var(--success); font-weight: bold;">✔</span>
            OpenAPI docs available at <a href="http://localhost:5001/api/docs" target="_blank">http://localhost:5001/api/docs</a>
          </li>
          <li style="display: flex; align-items: center; gap: 8px;">
            <span style="color: var(--success); font-weight: bold;">✔</span>
            OpenAPI JSON available at <a href="http://localhost:5001/api/docs.json" target="_blank">http://localhost:5001/api/docs.json</a>
          </li>
          <li style="display: flex; align-items: center; gap: 8px;">
            <span style="color: var(--success); font-weight: bold;">✔</span>
            API Catalog JSON available at <a href="http://localhost:5001/api/catalog" target="_blank">http://localhost:5001/api/catalog</a>
          </li>
        </ul>
      </article>
    </section>

    <!-- WSO2 Gateway / Publishing Checklist Card -->
    <section class="grid platform-two-column wide-left">
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
    <section class="panel quick-links-panel">
      <h2 style="margin-top: 0; margin-bottom: 12px;">Integration Quick Links & Resources</h2>
      <div class="grid quick-link-grid">
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
          <strong>Local Odoo UI</strong>
          <span>http://localhost:8069</span>
        </a>
        <a class="button secondary link-card" href="http://localhost:8070" target="_blank">
          <strong>Local OpenG2P UI</strong>
          <span>http://localhost:8070</span>
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
                  <span class="badge" [class.verified]="log.syncStatus === 'SYNCED' || log.syncStatus === 'FALLBACK_SYNCED'" [class.pending]="log.syncStatus === 'DEMO_MODE'" [class.rejected]="log.syncStatus === 'FAILED'">
                    {{ log.syncStatus }}
                  </span>
                </td>
                <td>
                  <span class="badge" [ngClass]="{
                    'verified': log.syncStatus === 'SYNCED' || log.syncStatus === 'FALLBACK_SYNCED',
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
        height: 100%;
      }
      .readiness-panel,
      .platform-status-grid,
      .sync-panel,
      .accent-panel,
      .success-panel,
      .platform-two-column,
      .quick-links-panel {
        margin-bottom: 24px;
      }
      .readiness-panel {
        background: var(--surface-strong);
        border-color: #cfe5c8;
      }
      .readiness-panel h3 {
        margin: 0 0 12px;
      }
      .readiness-message {
        color: var(--muted);
        font-size: 13px;
        margin: 12px 0 0;
      }
      .platform-status-grid {
        align-items: stretch;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      }
      .platform-two-column {
        align-items: stretch;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      }
      .platform-two-column.wide-left {
        grid-template-columns: minmax(0, 1.2fr) minmax(340px, 0.8fr);
      }
      .verification-grid {
        grid-template-columns: minmax(240px, 0.7fr) minmax(0, 1.6fr);
      }
      .quick-link-grid {
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 12px;
      }
      .accent-panel {
        border-left: 4px solid var(--primary);
      }
      .success-panel {
        border-left: 4px solid var(--success);
      }
      .card-header {
        gap: 12px;
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
        line-height: 1.5;
        margin: 0 0 16px 0;
      }
      .divider {
        border: 0;
        border-top: 1px solid var(--border);
        margin: 0 0 12px 0;
      }
      .stat-row {
        display: flex;
        gap: 12px;
        justify-content: space-between;
        font-size: 13px;
        margin-bottom: 8px;
      }
      .stat-row span,
      .stat-row a {
        overflow-wrap: anywhere;
        text-align: right;
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
      .step-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
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
      .connection-checker {
        margin-top: auto;
        border-top: 1px dashed var(--border);
        padding-top: 12px;
      }
      .check-result-badge {
        font-size: 12px;
        font-weight: bold;
        border-radius: 999px;
        text-align: center;
        padding: 6px 8px;
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
        align-items: flex-start;
        background: var(--surface-soft);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        gap: 10px;
        margin-bottom: 10px;
        min-height: 42px;
        padding: 10px;
        font-size: 14px;
      }
      .checklist-items input {
        margin-top: 4px;
      }
      .link-card {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: center;
        text-align: left;
        padding: 12px;
        min-height: 78px;
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
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 12px;
      }
      .readiness-item {
        display: flex;
        flex-direction: column;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 6px;
        min-height: 72px;
        justify-content: center;
        padding: 10px;
        text-align: center;
        font-size: 12px;
      }
      .readiness-item span {
        color: var(--muted);
        font-weight: bold;
        margin-bottom: 4px;
      }
      .search-chip-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .search-chip-row code {
        background: var(--surface-strong);
        border: 1px solid var(--border);
        border-radius: 6px;
        padding: 4px 8px;
      }
      @media (max-width: 980px) {
        .platform-two-column,
        .platform-two-column.wide-left,
        .verification-grid {
          grid-template-columns: 1fr;
        }
        .sync-action-wrapper {
          align-items: flex-start;
          flex-direction: column;
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
  expandedStepIdx: number | null = null;
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

  connectionBaseUrl = {
    odoo: 'http://localhost:8069',
    openg2p: 'http://localhost:8070',
    wso2: 'https://localhost:8243',
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
    // Proactively check connections on load to populate URLs and states
    this.checkConnection('odoo');
    this.checkConnection('openg2p');
    this.checkConnection('wso2');
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

  get usesOpenG2PFallback(): boolean {
    return this.stepResults.some((step) => step.syncStatus === 'FALLBACK_SYNCED') ||
      this.logs.some((log) => log.platform === 'OPENG2P' && log.syncStatus === 'FALLBACK_SYNCED');
  }

  isSuccessfulStatus(status: string): boolean {
    return status === 'SYNCED' || status === 'FALLBACK_SYNCED' || status === 'DEMO_MODE';
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
    this.http.get<{ success: boolean; status: string; message: string; baseUrl?: string }>(`${environment.apiUrl}/platform-sync/${platform}/connection-check`)
      .subscribe({
        next: (res) => {
          this.checkingConnection[platform] = false;
          this.connectionStatus[platform] = res.status;
          this.connectionMessage[platform] = res.message;
          this.connectionBaseUrl[platform] = this.hostFacingUrl(platform, res.baseUrl);
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

  hostFacingUrl(platform: 'odoo' | 'openg2p' | 'wso2', baseUrl?: string): string {
    if (platform === 'odoo') return 'http://localhost:8069';
    if (platform === 'openg2p') return 'http://localhost:8070';
    if (platform === 'wso2') return 'https://localhost:8243';
    return baseUrl || '';
  }

  triggerDemoSync(): void {
    this.syncInProgress = true;
    this.stepResults = [];
    this.expandedStepIdx = null;
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

  toggleStepPayload(idx: number): void {
    this.expandedStepIdx = this.expandedStepIdx === idx ? null : idx;
  }

  getClientFriendlySyncMsg(step: SyncStepResult): string {
    if (step.step.includes('Odoo Contact/Partner') || step.step === 'Sync farmer to Odoo') {
      return 'Farmer synced to Odoo contact/partner';
    }
    if (step.step.includes('OpenG2P Registrant/Beneficiary') || step.step === 'Sync farmer to OpenG2P') {
      return 'Farmer mapped to OpenG2P registrant/beneficiary';
    }
    if (step.step.includes('OpenG2P Agriculture Registry Extension') || step.step === 'Sync farm to OpenG2P') {
      return 'Farm mapped to OpenG2P registrant record';
    }
    if (step.step.includes('Farm → OpenG2P visible fallback record')) {
      return 'Farm written to visible OpenG2P/Odoo fallback record';
    }
    if (step.step.includes('OpenG2P Agriculture Activity Extension') || step.step === 'Sync crop to OpenG2P') {
      return 'Crop logged under OpenG2P registrant';
    }
    if (step.step.includes('Crop → OpenG2P visible fallback record')) {
      return 'Crop written to visible OpenG2P/Odoo fallback record';
    }
    if (step.step.includes('Eligibility → OpenG2P visible fallback record')) {
      return 'Eligibility written to visible OpenG2P/Odoo fallback record';
    }
    if (step.step.includes('OpenG2P Program Enrollment') || step.step === 'Sync enrollment to OpenG2P') {
      return 'Enrollment mapped to OpenG2P program enrollment';
    }
    if (step.step.includes('Enrollment → OpenG2P visible fallback record')) {
      return 'Enrollment written to visible OpenG2P/Odoo fallback record';
    }
    if (step.step.includes('Odoo Inventory Fulfilment') || step.step === 'Sync inventory reservation to Odoo') {
      return 'Inventory reservation mapped to Odoo fulfilment';
    }
    if (step.step.includes('WSO2 Gateway Publishing Readiness') || step.step === 'APIs WSO2 Ready') {
      return 'APIs ready for WSO2 Gateway publishing';
    }
    return '';
  }
}
