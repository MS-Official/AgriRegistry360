# AgriRegistry360 — Platform Sync & Gateway Integration Guide

This guide explains how AgriRegistry360 synchronizes registry data with Odoo ERP and OpenG2P, and prepares APIs for exposure through WSO2 API Manager.

## Integration Architecture

```text
       AgriRegistry360 Angular Portal
                    │
                    ▼
       AgriRegistry360 Node.js Backend
                    │
         ┌──────────┴──────────┐
         ▼                     ▼
   MongoDB Registry      Platform Sync Layer
   (Local Storage)             │
         ┌─────────────────────┼─────────────────────┐
         ▼                     ▼                     ▼
      Odoo ERP              OpenG2P            WSO2 Gateway
 (Fulfilment/Stock)   (Beneficiary Welfare)   (Security/Proxy)
```

1. **AgriRegistry360** serves as the system of record for farmers, farms, and crops.
2. **OpenG2P** manages government welfare programs, social registries, and program memberships.
3. **Odoo ERP** manages stock inventory, reservations, and distributions.
4. **WSO2 API Manager** acts as the secure gateway shielding all APIs and providing rate-limiting, analytics, and OAuth2 protection.

---

## Environment Variables

Configure the following variables in the backend `.env` file to enable live sync connections. By default (`*__ENABLED=false`), the system operates in **Demo Mode**, constructing complete payloads and recording mock outcomes without needing live service dependencies.

```env
# Odoo ERP Integration
ODOO_ENABLED=false
ODOO_URL=http://localhost:8069
ODOO_DB=agriregistry360
ODOO_USERNAME=admin
ODOO_PASSWORD=admin
ODOO_FARMER_MODEL=agriregistry.farmer
ODOO_RESERVATION_MODEL=agriregistry.inventory.reservation

# OpenG2P Integration (Odoo-based)
OPENG2P_ENABLED=false
OPENG2P_URL=http://localhost:8069
OPENG2P_DB=openg2p
OPENG2P_USERNAME=admin
OPENG2P_PASSWORD=admin
OPENG2P_REGISTRANT_MODEL=agriregistry.farmer
OPENG2P_PROGRAM_MODEL=g2p.program
OPENG2P_ENROLLMENT_MODEL=agriregistry.enrollment
OPENG2P_FARM_MODEL=agriregistry.farm
OPENG2P_CROP_MODEL=agriregistry.crop
OPENG2P_ELIGIBILITY_MODEL=agriregistry.eligibility
OPENG2P_FALLBACK_MODEL=res.partner

# WSO2 API Manager Gateway
WSO2_ENABLED=false
WSO2_APIM_BASE_URL=https://localhost:9443
WSO2_GATEWAY_BASE_URL=https://localhost:8243
WSO2_USERNAME=admin
WSO2_PASSWORD=admin
WSO2_REGISTRY_API_CONTEXT=/agriregistry360/registry
WSO2_PROGRAM_API_CONTEXT=/agriregistry360/program
WSO2_INVENTORY_API_CONTEXT=/agriregistry360/inventory
```

For Docker Compose, the backend container environment uses `ODOO_USERNAME=admin@example.com` and `OPENG2P_USERNAME=admin@example.com`. When creating the Odoo and OpenG2P databases through the browser UI, the login email used during database creation must match those backend Docker environment values.

For this Docker demo:

| Platform | Database | Login Email | Password |
| --- | --- | --- | --- |
| Odoo ERP | `agriregistry360` | `admin@example.com` | `admin` |
| OpenG2P | `openg2p` | `admin@example.com` | `admin` |

After changing Docker credentials or environment values, recreate the backend container:
```bash
docker compose up -d --force-recreate backend
```

---

## Odoo Sync Mapping

### Farmer Sync
* **Target Model:** `res.partner`
* **Data Mapping:**
  | AgriRegistry360 Field | Odoo `res.partner` Field | Note / Format |
  | --- | --- | --- |
  | `fullName` | `name` | String |
  | `farmerCode` | `ref` | String (e.g., `FARMER-0001`) |
  | `nationalId` | `vat` | String (NIC / VAT ID) |
  | `mobileNumber` | `mobile` | Phone Number |
  | `gnDivision` | `street` | Local village division |
  | `district` | `city` | Administrative District |
  | `farmerType` + `verificationStatus` | `comment` | Internal metadata note |

### Inventory Reservation Sync
* **Target Model:** `product.template` (with linked `product.product` matching inventory items)
* **Data Mapping:**
  | AgriRegistry360 Field | Odoo Field | Note / Format |
  | --- | --- | --- |
  | `reservationCode` | `reference` | Unique identifier (e.g., `RESERVE-0001`) |
  | `enrollmentCode` | `origin` | Source program enrollment reference |
  | `farmerName` | `partner` | Customer Contact name |
  | `itemCode` | `product_sku` | Product SKU (e.g., `FERTILIZER_50KG`) |
  | `reservedQuantity` | `quantity` | Allocation amount |
  | `reservationStatus` | `state` | Allocation state |

---

## OpenG2P Sync Mapping

### Farmer Registry
* **Target Model:** `agriregistry.farmer` when the demo addon is installed, otherwise fallback to `res.partner`.
* **Mapping:** Matches AgriRegistry360 farmer fields for client-visible verification in OpenG2P-compatible Odoo.

### Farm & Crop registries
* **Target Models:** `agriregistry.farm` and `agriregistry.crop` when the demo addon is installed, otherwise fallback to `res.partner`.
* **Mapping:** Writes farm/land and crop activity details into proper AgriRegistry360 demo menus.

### Program Enrollment
* **Target Model:** `agriregistry.enrollment` when the demo addon is installed, otherwise fallback to `res.partner`.
* **Data Mapping:**
  - `programCode` ➔ `program_code`
  - `programName` ➔ `program_name`
  - `farmerCode` ➔ `farmer_code`
  - `enrollmentCode` ➔ `enrollment_code`
  - `enrollmentStatus` ➔ `enrollment_status`
  - `approvalStatus` ➔ `approval_status`

### OpenG2P Fallback vs Real PBMS Model Mode

AgriRegistry360 dynamically checks whether the configured OpenG2P/PBMS models exist before writing farm, crop, eligibility, and enrollment records.

- Real OpenG2P PBMS models are used when installed and configured through `OPENG2P_*_MODEL` environment variables.
- If those models are missing, AgriRegistry360 writes visible fallback records into the OpenG2P/Odoo UI, currently using `res.partner`.
- Fallback records use clear names, `ref` entity codes, and detailed comments so the client can verify that data was pushed into the OpenG2P-compatible platform.
- This proves the integration pathway without requiring the local demo container to include every official PBMS agriculture module.
- Production setup should install/configure official OpenG2P modules and update the model env variables.

Model discovery endpoint:
```bash
curl http://localhost:5001/api/platform-sync/openg2p/models
```

Configured Docker model variables:
```env
OPENG2P_REGISTRANT_MODEL=agriregistry.farmer
OPENG2P_PROGRAM_MODEL=g2p.program
OPENG2P_ENROLLMENT_MODEL=agriregistry.enrollment
OPENG2P_FARM_MODEL=agriregistry.farm
OPENG2P_CROP_MODEL=agriregistry.crop
OPENG2P_ELIGIBILITY_MODEL=agriregistry.eligibility
OPENG2P_FALLBACK_MODEL=res.partner
ODOO_FARMER_MODEL=agriregistry.farmer
ODOO_RESERVATION_MODEL=agriregistry.inventory.reservation
```

Fallback status meanings:
- `SYNCED`: data was written to a detected configured OpenG2P model.
- `FALLBACK_SYNCED`: data was written to a visible fallback record in OpenG2P/Odoo.
- `DEMO_MODE`: OpenG2P integration is disabled.
- `FAILED`: authentication, discovery, or write failed.

OpenG2P UI verification:
1. Open `http://localhost:8070`.
2. Go to **Contacts**.
3. Search for `Mohamed Ameen`, `FARM-LAND-0001`, `CROP-0001`, `ELIG`, or `ENROLL`.
4. Open the matching records and review the `ref`, `name`, and internal notes/comments.

### Installing the AgriRegistry360 Odoo Addon

The repository includes a lightweight demo addon at `odoo-addons/agriregistry360_base`. Docker Compose mounts `./odoo-addons` into both Odoo containers at `/mnt/extra-addons`.

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

When installed, Platform Sync writes to:
- `agriregistry.farmer`
- `agriregistry.farm`
- `agriregistry.crop`
- `agriregistry.eligibility`
- `agriregistry.enrollment`
- `agriregistry.inventory.reservation`

If the addon is not installed, fallback sync remains available through visible `res.partner` records.

---

## WSO2 Gateway Readiness

AgriRegistry360 provides built-in metadata catalog configuration so WSO2 API Manager can easily proxy API categories.

1. **Registry API:** Serves Farmer, Farm, and Crop endpoints (`/agriregistry360/registry`).
2. **Program API:** Serves Eligibility Checks and Subsidy Program Enrollments (`/agriregistry360/program`).
3. **Inventory API:** Serves Odoo-style Inventory Reservations and Fulfilment (`/agriregistry360/inventory`).

### How to Publish to WSO2
1. Download the OpenAPI spec from `http://localhost:5001/api/docs.json`.
2. Open the WSO2 API Publisher Portal at `https://localhost:9443/publisher`.
3. Choose **Create API ➔ Import OpenAPI Definition**.
4. Upload `docs.json`, select the target context (e.g. `/agriregistry360/registry`), and set endpoint target to `http://localhost:5001/api`.
5. Deploy and publish! Once published, mark the API status as published on the Platform Sync Center page.

---

## Demo Mode vs Live Sync Mode

AgriRegistry360 supports dual-mode integration:
1. **Demo Mode (Fallback):** Activated when platform environment variables are set to `false`. Payload checks are performed, mock sync ids are returned, and results are safely logged.
2. **Live Sync Mode:** Activated when variables are enabled (`*_ENABLED=true`). Real JSON-RPC requests are dispatched to Odoo ERP or OpenG2P endpoints, and reachability pings are sent to WSO2 API Manager.

---

## Live Platform Verification Steps

### A. Odoo UI Verification
1. Log in to your Odoo portal at `http://localhost:8069`.
2. Open the **Contacts** application.
3. Search for `Mohamed Ameen` or reference ID `FARMER-0001`. Confirm the contact profile matches the synced details.
4. Open the **Inventory / Products** application. Search for SKU `FERTILIZER_50KG` to verify stock allocations.

### B. OpenG2P UI Verification
1. Log in to your OpenG2P Odoo console at `http://localhost:8069` (or configured OpenG2P instance).
2. Go to **Welfare registries ➔ Registrants** (or Contacts if custom models fallback is used).
3. Search for the registrant ID `FARMER-0001` to view the synced farmer details, linked farm layouts, and crop cultivation data.
4. Navigate to **Programs ➔ Memberships** (or program membership lists) to verify enrollment mapping.

### C. WSO2 API Manager Verification
1. Open WSO2 Publisher console at `https://localhost:9443/publisher`.
2. Verify that the imported APIs are published and show in the active list.
3. Open WSO2 Developer Portal at `https://localhost:9443/devportal`. Verify that key subscriptions can be generated and invoked.

---

## Demo Walkthrough & Client Script

When presenting this integration to the client, use the following interactive script:

### 1. Show Platform Connectivity & Demo Readiness
- **What to do:** Open `http://localhost:4200/platform-sync`.
- **What to say:**
  > "Here is our Platform Sync Center. This page shows the connection status of AgriRegistry360 to Odoo ERP, OpenG2P, and WSO2 API Manager. We can click 'Check Connection' for each platform to perform a real-time authentication test. If a service is down, it gracefully defaults to Demo Mode so the demo can run under any circumstances."

### 2. Execute Demo Sync
- **What to do:** Click the **Sync Full Demo Flow** button. Show the progress indicators.
- **What to say:**
  > "I will now trigger a full demo sync. This takes the local database records for farmer Mohamed Ameen, farm layouts, crop variety, eligibility results, enrollments, and reserves inventory. The system maps and uploads them sequentially to Odoo ERP and OpenG2P."

### 3. Review Synced Payload Logs
- **What to do:** Scroll to the **Platform Sync History** table. Click **View JSON** on a synced record to expand the payload.
- **What to say:**
  > "We can view the exact JSON payload structures sent to Odoo or OpenG2P, and the response payloads they returned. This proves that our schema maps directly to Odoo's Contacts/Partner databases and OpenG2P's welfare membership models."

### 4. Verify in Platform UIs
- **What to do:** Click the Odoo/OpenG2P UI link to show the synced contact in Odoo.
- **What to say:**
  > "If we log in to Odoo, we can see that Mohamed Ameen has been automatically registered as a contact, and the inventory reservation is logged and ready for dispatch. All of these platforms now work together seamlessly."

---

## Running All Platforms with Docker Compose

To run the entire suite (AgriRegistry360 Backend, Frontend, MongoDB, Odoo, OpenG2P, and WSO2) in containerized mode, follow the instructions in [DOCKER_DEMO_SETUP_GUIDE.md](file:///Users/shurafa28/Desktop/FarmRegistry/DOCKER_DEMO_SETUP_GUIDE.md).

### Environment Configuration Difference
- **Local (Non-Docker) Environment**: Configured via `.env` pointing to local ports (`localhost:8069`, `localhost:8243`, etc.).
- **Docker Compose Environment**: Configured via `.env.docker.example` / environment variables in `docker-compose.yml` resolving through internal container DNS names:
  - `ODOO_URL=http://odoo:8069`
  - `ODOO_USERNAME=admin@example.com`
  - `OPENG2P_URL=http://openg2p:8069`
  - `OPENG2P_USERNAME=admin@example.com`
  - `WSO2_APIM_BASE_URL=https://wso2-apim:9443`
  - `WSO2_GATEWAY_BASE_URL=https://wso2-apim:8243`
  
*Note: In Docker Compose mode, browser URLs remain host-facing (e.g., Odoo UI is accessible at `http://localhost:8069` and OpenG2P UI is mapped to `http://localhost:8070` on the host machine).*

### Docker Connection Check Commands
```bash
curl http://localhost:5001/api/platform-sync/odoo/connection-check
curl http://localhost:5001/api/platform-sync/openg2p/connection-check
curl http://localhost:5001/api/platform-sync/wso2/connection-check
curl -X POST http://localhost:5001/api/platform-sync/full-demo
curl http://localhost:5001/api/platform-sync/logs
```
