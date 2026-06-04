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
| Farm Registration | Register farm or land records under a farmer |
| Crop Registration | Register crop records under a farm or land record |
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
| POST | `/api/farms/register` | Implemented in Farm / Land Registry scope |
| GET | `/api/farms` | Implemented in Farm / Land Registry scope |
| GET | `/api/farms/:id` | Implemented in Farm / Land Registry scope |
| GET | `/api/farmers/:farmerId/farms` | Implemented in Farm / Land Registry scope |
| PUT | `/api/farms/:id` | Implemented in Farm / Land Registry scope |
| PATCH | `/api/farms/:id/verify` | Implemented in Farm / Land Registry scope |
| POST | `/api/crops/register` | Implemented in Crop Registry scope |
| GET | `/api/crops` | Implemented in Crop Registry scope |
| GET | `/api/crops/:id` | Implemented in Crop Registry scope |
| GET | `/api/farms/:farmId/crops` | Implemented in Crop Registry scope |
| GET | `/api/farmers/:farmerId/crops` | Implemented in Crop Registry scope |
| PUT | `/api/crops/:id` | Implemented in Crop Registry scope |
| PATCH | `/api/crops/:id/verify` | Implemented in Crop Registry scope |
| POST | `/api/eligibility/check` | Implemented in Eligibility Check scope |
| GET | `/api/eligibility` | Implemented in Eligibility Check scope |
| GET | `/api/eligibility/:id` | Implemented in Eligibility Check scope |
| GET | `/api/farmers/:farmerId/eligibility` | Implemented in Eligibility Check scope |
| GET | `/api/farms/:farmId/eligibility` | Implemented in Eligibility Check scope |
| GET | `/api/crops/:cropId/eligibility` | Implemented in Eligibility Check scope |
| POST | `/api/enrollments` | Implemented in Program Enrollment scope |
| GET | `/api/enrollments` | Implemented in Program Enrollment scope |
| GET | `/api/enrollments/:id` | Implemented in Program Enrollment scope |
| GET | `/api/farmers/:farmerId/enrollments` | Implemented in Program Enrollment scope |
| GET | `/api/farms/:farmId/enrollments` | Implemented in Program Enrollment scope |
| GET | `/api/crops/:cropId/enrollments` | Implemented in Program Enrollment scope |
| GET | `/api/eligibility/:eligibilityId/enrollments` | Implemented in Program Enrollment scope |
| PATCH | `/api/enrollments/:id/approval` | Implemented in Program Enrollment scope |
| PATCH | `/api/enrollments/:id/cancel` | Implemented in Program Enrollment scope |
| GET | `/api/odoo/inventory/items` | Implemented in Odoo Inventory Reservation scope |
| GET | `/api/odoo/inventory/items/:id` | Implemented in Odoo Inventory Reservation scope |
| POST | `/api/odoo/inventory/reserve` | Implemented in Odoo Inventory Reservation scope |
| GET | `/api/odoo/inventory/reservations` | Implemented in Odoo Inventory Reservation scope |
| GET | `/api/odoo/inventory/reservations/:id` | Implemented in Odoo Inventory Reservation scope |
| GET | `/api/enrollments/:enrollmentId/reservations` | Implemented in Odoo Inventory Reservation scope |
| GET | `/api/farmers/:farmerId/reservations` | Implemented in Odoo Inventory Reservation scope |
| GET | `/api/farms/:farmId/reservations` | Implemented in Odoo Inventory Reservation scope |
| GET | `/api/crops/:cropId/reservations` | Implemented in Odoo Inventory Reservation scope |
| PATCH | `/api/odoo/inventory/reservations/:id/cancel` | Implemented in Odoo Inventory Reservation scope |
| PATCH | `/api/odoo/inventory/reservations/:id/issue` | Implemented in Odoo Inventory Reservation scope |
| GET | `/api/docs` | Implemented in WSO2 API Manager Publishing Preparation scope |
| GET | `/api/docs.json` | Implemented in WSO2 API Manager Publishing Preparation scope |
| GET | `/api/catalog` | Implemented in WSO2 API Manager Publishing Preparation scope |
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

## Implementation Status

### Farmer Registry: Completed

- Farmer registration
- Farmer list with search
- Farmer details
- Farmer update
- Farmer verification or rejection
- Demo seed data for Mohamed Ameen

### Farm / Land Registry: Completed

- Farm / land registration under an existing farmer
- Farm list with search
- Farm details
- Farm update API
- Farm verification or rejection
- Linked farms shown on Farmer Details
- Demo farm seed data for Mohamed Ameen

### Crop Registry: Completed

- Crop registration under an existing farm / land record
- Crop list with search
- Crop details
- Crop update API
- Crop verification or rejection
- Linked crops shown on Farm Details
- Farmer Details crop summary
- Demo crop seed data for Mohamed Ameen's demo farm

### Eligibility Check: Completed

- Fertilizer Subsidy Program 2026 rule evaluation
- Farmer + Farm + Crop relationship validation
- Eligibility result persistence
- Rule results and failure reasons
- Recommended fertilizer entitlement
- Eligibility check form, list, and details screens
- Eligibility summaries on Farmer, Farm, and Crop details

### Program Enrollment: Completed

- Enrollment creation from eligible eligibility checks
- Duplicate active enrollment prevention
- Enrollment list with search
- Enrollment details
- Approval or rejection workflow
- Enrollment cancellation
- Linked enrollments shown on Eligibility Details

### Odoo Inventory Reservation: Completed

- Demo fertilizer inventory item seed
- Inventory item list
- Inventory reservation from approved enrollments
- Entitlement to fertilizer stock mapping
- Duplicate active reservation prevention
- Reservation issue and cancel workflows
- Reservation stock accounting
- Linked reservations shown on Enrollment Details

### WSO2 API Manager Publishing Preparation: Current Module / In Progress

- Swagger UI endpoint at `/api/docs`
- OpenAPI JSON endpoint at `/api/docs.json`
- WSO2-ready API catalog endpoint at `/api/catalog`
- Registry, Program, and Inventory API grouping metadata
- WSO2 publishing guide
- API catalog documentation
- Angular WSO2 API Catalog page

## Future Modules

- Reports
