# AgriRegistry360 — Local Platform Setup Guide

This guide describes how to configure, run, and connect Odoo ERP, OpenG2P, and WSO2 API Manager locally to showcase live integration flows.

---

## 1. Start AgriRegistry360 Core

### A. Start MongoDB
Ensure MongoDB is running locally on port `27017`:
```bash
# macOS Brew command
brew services start mongodb-community
```

### B. Start Backend Server
1. Copy the integration environment variables from `.env.local.platform.example` into a new `.env` file in the `backend/` directory:
   ```bash
   cp backend/.env.local.platform.example backend/.env
   ```
2. Launch the backend server:
   ```bash
   npm run backend
   ```
   The backend will run at `http://localhost:5001`.

### C. Start Frontend Angular App
1. Launch the frontend:
   ```bash
   npm run frontend
   ```
   The Angular portal will run at `http://localhost:4200`.

---

## 2. Setting Up Odoo ERP Locally

Expected URL: `http://localhost:8069`

### Setup Steps
1. **Initialize Database:**
   - Open Odoo in your browser.
   - Set database name to `agriregistry360`.
   - Set admin login/password to `admin`/`admin` (matching the `backend/.env` configuration).
2. **Install Required Odoo Apps:**
   - Navigate to the **Apps** panel.
   - Install the **Contacts** module (handles partner/registrant profiles).
   - Install the **Inventory** module (handles stock management and warehouse items).
3. **Seeding Stock / Products (Optional):**
   - If stock is not configured, the AgriRegistry360 sync layer will automatically check for a product with default SKU `FERTILIZER_50KG`. If missing, it will safely create a basic product template entry in Odoo.
4. **Data Sync mapping:**
   - Farmers map directly to Odoo contacts (`res.partner`).
   - Fertilizer items map to product templates (`product.product`).
   - Reservations create logged activities or partner records detailing the entitlement quantity and program source.

---

## 3. Setting Up OpenG2P Welfare Registry

OpenG2P is an open-source, Odoo-based welfare registry framework.

### Setup Steps
1. **Run OpenG2P Instance:**
   - OpenG2P runs on an Odoo backend. Start your OpenG2P server (defaulting to `http://localhost:8069` or custom configured port).
   - Ensure the database name matches `openg2p` (or configure via `OPENG2P_DB` in `.env`).
2. **Install G2P Modules:**
   - Install OpenG2P modules (`g2p_program`, `g2p_program_membership`, `g2p_registry`).
3. **Model Fallback:**
   - If exact OpenG2P program/membership models (`g2p.program.membership`) are not loaded in your local database, the sync service will automatically register the sync records as standard Odoo partner logs (`res.partner`) and flag the results as `DEMO_MODE` or `SYNCED` accordingly without crashing.

---

## 4. Setting Up WSO2 API Manager

WSO2 API Manager manages secure proxy access, subscription tiers, and rate limiting.

### Setup URLs
- **Publisher Console:** `https://localhost:9443/publisher`
- **Developer Portal (DevPortal):** `https://localhost:9443/devportal`
- **API Gateway:** `https://localhost:8243`

### Publishing Steps
1. **Retrieve OpenAPI Spec:**
   - Open `http://localhost:5001/api/docs.json` and save the raw JSON file.
2. **Create APIs in WSO2 Publisher:**
   - Sign in to `https://localhost:9443/publisher` (default credentials: `admin`/`admin`).
   - Click **Create API ➔ Import OpenAPI Definition**.
   - Upload the saved `docs.json` spec.
   - Configure Context Paths matching the API groups:
     - `/agriregistry360/registry/1.0.0`
     - `/agriregistry360/program/1.0.0`
     - `/agriregistry360/inventory/1.0.0`
   - Set the Target Endpoint URL to: `http://localhost:5001/api`.
3. **Deploy & Publish:**
   - Navigate to the **Deploy** section and click **Deploy**.
   - Navigate to the **Lifecycle** section and click **Publish**.
4. **Subscribe and Generate Access Keys:**
   - Navigate to the DevPortal at `https://localhost:9443/devportal`.
   - Create a subscription application, select the published APIs, subscribe, and generate an OAuth2 production token.
5. **Route Frontend Traffic through WSO2 Gateway:**
   - Create `frontend/src/environments/environment.wso2.ts` copying variables from `environment.wso2.example.ts`.
   - Update your Angular configuration to build with this environment file, causing all registry and program REST calls to go through the gateway port `8243`.
