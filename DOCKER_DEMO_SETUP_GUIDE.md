# AgriRegistry360 Docker Demo Environment Setup Guide

This guide describes how to run and demonstrate the complete, integrated AgriRegistry360 environment locally using Docker Compose.

---

## 1. Demo Architecture & Services

The Docker environment orchestrates the following services inside a shared bridge network (`agriregistry360-net`):

| Container Name | Service Name | Host Port | Role / Description |
| --- | --- | --- | --- |
| `agriregistry360-frontend` | `frontend` | `4200` | Angular portal for farm/farmer registry and eligibility flows. |
| `agriregistry360-backend` | `backend` | `5001` | Express API server handling Mongo models and sync pings. |
| `agriregistry360-mongo` | `mongo` | `27017` | MongoDB instance storing AgriRegistry360 registry records. |
| `agriregistry360-odoo` | `odoo` | `8069` | Odoo 17 ERP managing simulated fertilizer inventory. |
| `agriregistry360-odoo-db` | `odoo-db` | `5432` (Internal) | PostgreSQL database for Odoo ERP. |
| `agriregistry360-openg2p` | `openg2p` | `8070` | Standard Odoo 17 serving as simulated OpenG2P PBMS extension. |
| `agriregistry360-openg2p-db` | `openg2p-db` | `5432` (Internal) | PostgreSQL database for OpenG2P. |
| `agriregistry360-wso2-apim` | `wso2-apim` | `9443` / `8243` | WSO2 API Manager 4.2.0 for security, gateway, and publishing. |

---

## 2. Dynamic Endpoints & URLs

Use these links to interact with the stack from your local web browser:

* **AgriRegistry360 Angular Frontend**: [http://localhost:4200](http://localhost:4200)
* **AgriRegistry360 Backend Swagger**: [http://localhost:5001/api/docs](http://localhost:5001/api/docs)
* **Platform Sync Center UI**: [http://localhost:4200/platform-sync](http://localhost:4200/platform-sync)
* **Odoo ERP UI Portal**: [http://localhost:8069](http://localhost:8069)
* **OpenG2P UI Portal (Simulated)**: [http://localhost:8070](http://localhost:8070)
* **WSO2 Publisher Portal**: [https://localhost:9443/publisher](https://localhost:9443/publisher)
* **WSO2 Developer Portal**: [https://localhost:9443/devportal](https://localhost:9443/devportal)
* **WSO2 Gateway Base Endpoint**: [https://localhost:8243](https://localhost:8243)

---

## 3. How to Operate the Stack

### 3.1 Start Everything
From the root workspace directory, run:
```bash
npm run docker:up
```
This builds the custom backend and frontend Dockerfiles, downloads platform images, and spins them up.

### 3.2 Create Odoo and OpenG2P Databases
When creating the Odoo and OpenG2P databases through the browser UI, the login email used during database creation must match the backend Docker environment values.

For this demo:

| Platform | Database | Login Email | Password |
| --- | --- | --- | --- |
| Odoo ERP | `agriregistry360` | `admin@example.com` | `admin` |
| OpenG2P | `openg2p` | `admin@example.com` | `admin` |

The backend container uses these internal service URLs and credentials:
```env
ODOO_URL=http://odoo:8069
ODOO_DB=agriregistry360
ODOO_USERNAME=admin@example.com
ODOO_PASSWORD=admin
ODOO_INVENTORY_ITEM_MODEL=agriregistry.inventory.item
ODOO_RESERVATION_MODEL=agriregistry.inventory.reservation

OPENG2P_URL=http://openg2p:8069
OPENG2P_DB=openg2p
OPENG2P_USERNAME=admin@example.com
OPENG2P_PASSWORD=admin

WSO2_APIM_BASE_URL=https://wso2-apim:9443
WSO2_GATEWAY_BASE_URL=https://wso2-apim:8243
```

After changing Docker credentials or environment values, recreate the backend container:
```bash
docker compose up -d --force-recreate backend
```

### 3.3 Install AgriRegistry360 Odoo Addon

The Docker stack mounts `./odoo-addons` into both Odoo containers at `/mnt/extra-addons`. Install the lightweight demo addon so AgriRegistry360 records appear as proper Odoo menus/models instead of only fallback Contacts.

Install in Odoo ERP:
1. Open `http://localhost:8069`.
2. Go to **Apps**.
3. Click **Update Apps List**.
4. Search `AgriRegistry360`.
5. Activate **AgriRegistry360 Farm Registry**.

Install in OpenG2P-compatible Odoo:
1. Open `http://localhost:8070`.
2. Go to **Apps**.
3. Click **Update Apps List**.
4. Search `AgriRegistry360`.
5. Activate **AgriRegistry360 Farm Registry**.

After installing the addon, rerun:
```bash
docker compose up -d --force-recreate backend
curl -X POST http://localhost:5001/api/platform-sync/full-demo
```

### 3.4 View Logs
To inspect logs across all containers:
```bash
npm run docker:logs
```
To check logs for a specific service (e.g. backend):
```bash
docker compose logs -f backend
```

### 3.5 Stop/Teardown Everything
To stop all containers:
```bash
npm run docker:down
```
To stop containers and wipe database volumes (clean reset):
```bash
npm run docker:clean
```

---

## 4. Walking Through the Client Demo

1. **Access the Dashboard**: Open [http://localhost:4200](http://localhost:4200) in your browser.
2. **Go to Platform Sync Center**: Navigate to `/platform-sync`.
3. **Verify Connectivity**: Click the "Check Connection" buttons on each platform card.
   - Odoo ERP (`http://odoo:8069`) and OpenG2P (`http://openg2p:8069`) are checked using internal Docker DNS names.
   - WSO2 APIM Gateway check will automatically output connection success or warnings regarding self-signed SSL.
4. **Trigger Demonstration Sync**: Click **Sync Full Demo Flow**. Check the cascade steps and review generated JSON payloads by expanding the view.
5. **Inspect the Target Portals**:
   - Open Odoo UI (`http://localhost:8069`) to see created contacts.
   - Open OpenG2P UI (`http://localhost:8070`) to review registrant fallbacks.
   - Open WSO2 Publisher (`https://localhost:9443/publisher`) to show imported catalog schemas.

### API Verification Commands
Run these from the host terminal:
```bash
curl http://localhost:5001/api/platform-sync/odoo/connection-check
curl http://localhost:5001/api/platform-sync/openg2p/connection-check
curl http://localhost:5001/api/platform-sync/openg2p/models
curl http://localhost:5001/api/platform-sync/wso2/connection-check
curl -X POST http://localhost:5001/api/platform-sync/full-demo
curl http://localhost:5001/api/platform-sync/logs
```

### WSO2 OpenAPI Import

Preferred import method:
1. Open `http://localhost:5001/api/docs/wso2.json` or `http://localhost:5001/api/docs.json` in your browser.
2. Save the JSON file locally.
3. Open WSO2 Publisher at `https://localhost:9443/publisher`.
4. Choose OpenAPI File/Archive upload.
5. Upload the saved JSON file and continue API creation.

WSO2 running inside Docker may not resolve browser `localhost` URLs the same way your host browser does. If URL import fails, use file upload.

### OpenG2P Fallback vs Real PBMS Model Mode

The Docker OpenG2P service is an OpenG2P-compatible Odoo instance. If official PBMS/agriculture models are installed, AgriRegistry360 writes to those configured models. If they are not installed, AgriRegistry360 writes visible fallback records into OpenG2P/Odoo Contacts using `res.partner`.

This fallback mode keeps the demo client-visible:
- Farmer records appear as OpenG2P/Odoo contacts.
- Farm, crop, eligibility, and enrollment records appear as searchable contacts with entity codes in `ref` and detailed AgriRegistry360 mapping notes in comments.
- Sync logs use `FALLBACK_SYNCED` when data was actually written to the fallback model.
- Production deployments should install/configure official OpenG2P PBMS modules and update the `OPENG2P_*_MODEL` variables.

To verify fallback records in the UI:
1. Open `http://localhost:8070`.
2. Go to **Contacts**.
3. Search for `Mohamed Ameen`, `FARM-LAND-0001`, `CROP-0001`, `ELIG`, or `ENROLL`.

### Odoo Inventory Sync Verification

After installing the **AgriRegistry360 Farm Registry** addon in Odoo ERP and recreating the backend container, verify inventory sync:
1. Open the AgriRegistry360 frontend reservation list and confirm `RESERVE-0001` exists.
2. Click **Platform Sync → Sync Full Demo Flow**.
3. Open Odoo ERP at `http://localhost:8069`.
4. Go to **AgriRegistry360 → Inventory Reservations**.
5. Confirm `RESERVE-0001` appears.
6. Go to **AgriRegistry360 → Inventory Items**.
7. Confirm `FERTILIZER_50KG` appears.

Useful sync commands:
```bash
curl http://localhost:5001/api/platform-sync/odoo/connection-check
curl -X POST http://localhost:5001/api/platform-sync/inventory-items/odoo
curl -X POST http://localhost:5001/api/platform-sync/full-demo
curl http://localhost:5001/api/platform-sync/logs
```

---

## 5. Troubleshooting & Limitations

- **Memory Allocation**: WSO2 API Manager requires significant system resources. Ensure that your Docker Desktop limits are configured to allocate at least **4GB RAM** (preferably 8GB) and **4 CPUs** to the Docker virtualization engine.
- **SSL Certificates on Localhost**: WSO2 utilizes self-signed SSL certificates. Your browser may show a "Your connection is not private" warning when visiting `https://localhost:9443` or `https://localhost:8243`. Click **Advanced ➔ Proceed to localhost** to establish browser trust.
- **Service Name Resolution**: The frontend app resolved from the browser must use `localhost` (e.g. `http://localhost:8069`), whereas the Express backend container communicates with other containers using Docker DNS network aliases (e.g. `http://odoo:8069`).
