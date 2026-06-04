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

---

## 5. Running All Platforms with Docker Compose

If you prefer a fully automated local environment where MongoDB, Odoo, OpenG2P, and WSO2 are pre-configured in containers, you can use Docker Compose.

Refer to [DOCKER_DEMO_SETUP_GUIDE.md](file:///Users/shurafa28/Desktop/FarmRegistry/DOCKER_DEMO_SETUP_GUIDE.md) for full instructions.

When creating the Odoo and OpenG2P databases through the browser UI for the Docker demo, the login email used during database creation must match the backend Docker environment values.

For this demo:

| Platform | Database | Login Email | Password |
| --- | --- | --- | --- |
| Odoo ERP | `agriregistry360` | `admin@example.com` | `admin` |
| OpenG2P | `openg2p` | `admin@example.com` | `admin` |

After changing Docker credentials or environment values, recreate the backend container:
```bash
docker compose up -d --force-recreate backend
```

### Port Mappings and DNS Configuration
- **Odoo ERP**: Mapped to host port `8069`. Internal service name is `odoo`.
- **OpenG2P**: Mapped to host port `8070` to avoid conflicts on port `8069`. Internal service name is `openg2p`.
- **WSO2 API Manager**: Mapped to host port `9443` (Publisher/DevPortal) and `8243` (Gateway). Internal service name is `wso2-apim`.

### Backend Configuration
Ensure you copy `.env.docker.example` to `.env` if you want to run the backend natively while talking to Docker containers, or let the Docker Compose environment inject it automatically during `docker compose up`.

Docker connection checks and sync commands:
```bash
curl http://localhost:5001/api/platform-sync/odoo/connection-check
curl http://localhost:5001/api/platform-sync/openg2p/connection-check
curl http://localhost:5001/api/platform-sync/wso2/connection-check
curl -X POST http://localhost:5001/api/platform-sync/full-demo
curl http://localhost:5001/api/platform-sync/logs
```
