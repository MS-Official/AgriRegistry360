# AgriRegistry360 — Integrated Farm & Farmer Registry Demo

## Demo Story

A field officer registers Mohamed Ameen, a smallholder farmer from Anuradhapura. Later, the officer will register the farmer's farm or land, add crop details, and complete verification. After verification, the system will check eligibility for a fertilizer subsidy program. If eligible, the farmer will be enrolled into the program and fertilizer stock will be reserved or distributed through Odoo ERP. All APIs will later be exposed securely through WSO2 API Manager.

## Main Demo Flow

```text
Farmer Registration
↓
Farm / Land Registration
↓
Crop Registration
↓
Farmer & Farm Verification
↓
Eligibility Check
↓
Program Enrollment
↓
Odoo Inventory Reservation / Distribution
↓
WSO2 API Manager Exposure
```

## Minimum Screens Needed

| Screen | Purpose |
| --- | --- |
| Login | Officer or admin access |
| Dashboard | Demo summary and navigation |
| Farmer Registration | Register a new farmer |
| Farmer List | Search and manage registered farmers |
| Farmer Details | View a farmer profile and future linked data |
| Farmer Verification | Verify or reject registered farmers |
| Farm Registration | Future farm or land registration |
| Crop Registration | Future crop registration |
| Eligibility Check | Future subsidy eligibility workflow |
| Program Enrollment | Future program enrollment workflow |
| Odoo Inventory / Distribution View | Future inventory reservation and distribution view |
| WSO2 API Manager View | Future API exposure and governance view |
| Reports | Future farm registry reports |

## Minimum APIs Needed

| Method | Endpoint | Current Status |
| --- | --- | --- |
| POST | `/api/farmers/register` | Implemented in Farmer Registry scope |
| GET | `/api/farmers` | Implemented in Farmer Registry scope |
| GET | `/api/farmers/:id` | Implemented in Farmer Registry scope |
| PUT | `/api/farmers/:id` | Implemented in Farmer Registry scope |
| PATCH | `/api/farmers/:id/verify` | Implemented in Farmer Registry scope |
| POST | `/api/farms/register` | Future module |
| POST | `/api/crops/register` | Future module |
| POST | `/api/eligibility/check` | Future module |
| POST | `/api/programs/enroll` | Future module |
| POST | `/api/odoo/inventory/reserve` | Future integration |
| GET | `/api/reports/farm-registry-summary` | Future module |

## Platform Responsibilities

| Platform | Responsibility |
| --- | --- |
| OpenG2P | Farmer registry, farm registry, beneficiary management, eligibility rules, program enrollment, entitlement mapping |
| Odoo ERP | Inventory, fertilizer and seed stock, procurement, distribution, accounting, reports |
| WSO2 API Manager | API gateway, authentication, authorization, throttling, monitoring, API lifecycle management |
| Angular Portal | Admin and officer user interface |
| Node.js Backend | Demo API layer |
| MongoDB | Demo data storage |
| Postman / Swagger | API testing and demo proof |

## Current Implementation Scope

The initial implementation covers only the Farmer Registry module:

- Farmer registration
- Farmer list with search
- Farmer details
- Farmer update
- Farmer verification or rejection
- Demo seed data for Mohamed Ameen

## Future Modules

- Farm / Land Registry
- Crop Registry
- Eligibility Check
- Program Enrollment
- Odoo Inventory Reservation / Distribution
- WSO2 API Publishing
- Reports

