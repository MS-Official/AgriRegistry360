# AgriRegistry360 Client Demo Readiness Guide

## Demo Objective

Present AgriRegistry360 as a complete Farm and Farmer Registry demo that shows how a government agriculture authority can register farmers, manage farm and crop records, evaluate subsidy eligibility, enroll eligible farmers into a program, reserve inventory through an Odoo-style fulfilment layer, and expose APIs through WSO2 API Manager.

## Client Requirement

The client needs a practical, end-to-end demonstration of an integrated agriculture registry platform. The demo should show the business flow, platform responsibilities, API readiness, and future integration path without connecting to production OpenG2P, Odoo ERP, or WSO2 environments.

## Demo Architecture

| Layer | Demo Role |
| --- | --- |
| Angular Portal | Officer-facing user interface for registry and program workflows |
| Node.js / Express API | Demo backend API layer |
| MongoDB | Local demo data storage |
| OpenG2P | Target registry, beneficiary, eligibility, enrollment, and entitlement layer |
| Odoo ERP | Target inventory, issue, distribution, and operational fulfilment layer |
| WSO2 API Manager | Target API gateway, publishing, security, throttling, and monitoring layer |

## Platform Roles

### OpenG2P

- Registry and beneficiary management
- Eligibility and program enrollment
- Entitlement mapping

### Odoo ERP

- Inventory stock
- Reservation and issue workflow
- Distribution and operational reporting

### WSO2 API Manager

- API gateway
- API publishing
- OAuth2/JWT security
- Throttling and monitoring

## Demo Flow

```text
Farmer Registry
->
Farm / Land Registry
->
Crop Registry
->
Eligibility Check
->
Program Enrollment
->
Odoo Inventory Reservation
->
WSO2 API Manager Publishing Preparation
->
OpenG2P Mapping Preparation
->
Client Demo Dashboard
```

## Demo Script

### Opening

"AgriRegistry360 is an integrated Farm and Farmer Registry demo designed to show how a government agriculture authority can register farmers, manage farm and crop data, evaluate eligibility, enroll farmers into subsidy programs, reserve inventory through an Odoo-style ERP layer, and expose APIs through WSO2 API Manager."

### Platform Explanation

"OpenG2P is positioned as the registry and program layer. Odoo ERP is positioned as the inventory and operational fulfilment layer. WSO2 API Manager is positioned as the secure API gateway and publishing layer."

### Demo Story

"Today we follow Mohamed Ameen, a smallholder farmer from Anuradhapura. He is registered, his farm and paddy crop are recorded, eligibility is checked, he is enrolled into the fertilizer subsidy program, and fertilizer stock is reserved and issued."

### Closing

"This demo proves the end-to-end concept. The next production stage would be real OpenG2P configuration, real Odoo integration, and deployment of APIs through WSO2 API Manager."

## What To Show In The UI

- Open the dashboard at `http://localhost:4200/dashboard`.
- Show high-level counts for farmers, farms, crops, eligibility checks, enrollments, and inventory reservations.
- Walk through the complete workflow cards from Farmer Registry to OpenG2P Mapping.
- Explain platform responsibility cards for OpenG2P, Odoo ERP, and WSO2 API Manager.
- Use the Mohamed Ameen story card as the client narrative.
- Use quick actions to open the core modules.
- Confirm the client demo checklist is complete.

## What To Show In Swagger

- Open `http://localhost:5001/api/docs`.
- Show the registry APIs for farmers, farms, and crops.
- Show eligibility and enrollment APIs.
- Show Odoo-style inventory reservation APIs.
- Show `GET /api/dashboard/summary`.
- Show `GET /api/openg2p/mapping`.

## What To Explain About OpenG2P

OpenG2P is the target registry and program layer. In the demo, farmer records map to registrants or beneficiaries, eligibility checks map to program eligibility rules, enrollments map to program participation, and recommended entitlements map to subsidy benefits.

## What To Explain About Odoo ERP

Odoo ERP is the target operational fulfilment layer. In the demo, Odoo is represented by inventory items, reservations, issue status, and warehouse stock movement concepts.

## What To Explain About WSO2 API Manager

WSO2 API Manager is the target API governance layer. In the demo, Swagger, OpenAPI JSON, and the API catalog show how the APIs can later be published, secured, throttled, and monitored.

## Known Limitations

- No real OpenG2P instance is connected.
- No real Odoo ERP instance is connected.
- No real WSO2 API Manager gateway is connected.
- Authentication is represented as future OAuth2/JWT readiness, not enforced in the local demo.
- Demo data depends on the local MongoDB state.

## Next Production Steps

- Configure real OpenG2P registry, program, entitlement, and enrollment models.
- Implement real Odoo ERP integration for stock, reservation, issue, and distribution flows.
- Publish APIs through WSO2 API Manager with OAuth2/JWT security and throttling.
- Add production authentication and role-based access control.
- Add deployment configuration, monitoring, backups, and operational reports.

---

## Final Client Demo Section: Showing All Platforms Working Together

Follow this step-by-step presentation script to demonstrate that all platforms function cooperatively:

1. **Open AgriRegistry360 Dashboard**
   - Navigate to `http://localhost:4200/dashboard`.
   - Point out the **Platform Connectivity** status bar showing the live connection state of local Odoo ERP, OpenG2P, and WSO2 APIM servers.

2. **Recount the Mohamed Ameen Flow**
   - Use the **Demo Story** card to explain the business lifecycle of Mohamed Ameen (Farmer ➔ Farm ➔ Crop ➔ Eligibility Check ➔ Enrollment ➔ Reservation).

3. **Open Platform Sync Center**
   - Click **Manage Platforms** or navigate to `http://localhost:4200/platform-sync`.
   - Show the cards detailing the Odoo, OpenG2P, and WSO2 roles in the system.

4. **Verify Connectivity**
   - Click **Check Connection** on each of the cards to verify live database authentication check results immediately.

5. **Trigger Cascade Demo Sync**
   - Click **Sync Full Demo Flow** and show the client the progress steps checking off green.

6. **Examine JSON Payloads**
   - In the **Platform Sync History** table, click **View JSON** on synced logs to show the precise REST payloads transmitted and retrieved.

7. **Show Synced Contacts in Odoo ERP**
   - Open Odoo UI (`http://localhost:8069`), navigate to **Contacts**, search for `Mohamed Ameen` (ID: `FARMER-0001`), and show the synced profile details.

8. **Show Synced Beneficiary in OpenG2P**
   - In the OpenG2P registry UI, show the mapped registrant ID and program memberships.

9. **Examine WSO2 API Manager Publisher**
   - Open `https://localhost:9443/publisher` and show the imported and published API definitions.

10. **Examine Developer Portal Subscriptions**
    - Open `https://localhost:9443/devportal` and show the active application subscription and generated gateway invoke tokens.

11. **Explain production Gateway Routing**
    - Explain that in production mode, all frontend calls route through the WSO2 API Gateway port `8243` to enforce enterprise-grade security and monitoring.

