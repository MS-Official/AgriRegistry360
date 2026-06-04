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

# OpenG2P Integration (Odoo-based)
OPENG2P_ENABLED=false
OPENG2P_URL=http://localhost:8069
OPENG2P_DB=openg2p
OPENG2P_USERNAME=admin
OPENG2P_PASSWORD=admin
OPENG2P_REGISTRANT_MODEL=res.partner
OPENG2P_PROGRAM_MODEL=g2p.program
OPENG2P_ENROLLMENT_MODEL=g2p.program.membership

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
* **Target Model:** `res.partner` (mapped as OpenG2P registrant)
* **Mapping:** Matches Odoo Farmer Sync, classifying the partner as a Welfare Registrant.

### Farm & Crop registries
* **Target Model:** `res.partner` (farm/crop notes details)
* **Mapping:** Extends the parent registrant contact details or logs registry boundaries under the registrant.

### Program Enrollment
* **Target Model:** `g2p.program.membership`
* **Data Mapping:**
  - `programCode` ➔ `program_id` (OpenG2P Welfare Program ID)
  - `farmerCode` ➔ `partner_id` (Registrant Partner Reference)
  - `enrollmentCode` ➔ `membership_ref` (Unique membership identifier)
  - `enrollmentStatus` ➔ `state` (Status mapping)

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

