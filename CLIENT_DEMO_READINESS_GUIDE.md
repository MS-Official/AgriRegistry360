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

## Final Live Platform Demo Script

### Script Steps:

1. **Open Dashboard.**
   - Navigate to `http://localhost:4200/dashboard`.
   - Point out the **Platform Connectivity** status bar showing the connection state of local Odoo ERP, OpenG2P, and WSO2 APIM servers.

2. **Explain the full farm registry flow.**
   - Walk through the Mohamed Ameen story card from Farmer Registry to Inventory Reservation.

3. **Open Platform Sync Center.**
   - Click **Manage Platforms** or navigate to `http://localhost:4200/platform-sync`.

4. **Show Odoo/OpenG2P/WSO2 connection cards.**
   - Point out base URLs, roles, and status fields on each platform card.

5. **Run connection checks.**
   - Click **Check Odoo Connection**, **Check OpenG2P Connection**, and **Check WSO2 Connection** to confirm connectivity statuses.

6. **Click Sync Full Demo Flow.**
   - Trigger the full cascade sync by clicking the button.

7. **Show sync logs and payloads.**
   - Show the green checked step-by-step progress cards, click **View Payload** to expand and review request and response JSON payloads.

8. **Open Odoo UI and show synced farmer/contact or inventory item.**
   - Open Odoo UI (`http://localhost:8069`), check the Contacts module for Mohamed Ameen, or review the seed products.

9. **Open OpenG2P UI and show mapped registrant/program data or fallback mapping.**
   - Open OpenG2P Odoo UI (`http://localhost:8069`), verify the registrant membership mapping or partner fallback logs.

10. **Open WSO2 Publisher and show imported APIs.**
    - Open WSO2 Publisher UI (`https://localhost:9443/publisher`) to show imported and published API definitions.

11. **Open WSO2 Developer Portal and explain Gateway URL.**
    - Open WSO2 Developer Portal (`https://localhost:9443/devportal`) and point out the production gateway URL endpoints.

12. **Explain production architecture:**
    - Explain how in a live production environment, the integration flow works as follows:
      ```text
      Frontend UI (Angular) → WSO2 API Manager (Gateway) → AgriRegistry360 Backend (Express) → OpenG2P / Odoo ERP
      ```

