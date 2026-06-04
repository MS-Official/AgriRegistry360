# AgriRegistry360 API Catalog

## Registry API Endpoints

Farmer Registry:

- `POST /api/farmers/register`
- `GET /api/farmers`
- `GET /api/farmers/:id`
- `PUT /api/farmers/:id`
- `PATCH /api/farmers/:id/verify`

Farm / Land Registry:

- `POST /api/farms/register`
- `GET /api/farms`
- `GET /api/farms/:id`
- `GET /api/farmers/:farmerId/farms`
- `PUT /api/farms/:id`
- `PATCH /api/farms/:id/verify`

Crop Registry:

- `POST /api/crops/register`
- `GET /api/crops`
- `GET /api/crops/:id`
- `GET /api/farms/:farmId/crops`
- `GET /api/farmers/:farmerId/crops`
- `PUT /api/crops/:id`
- `PATCH /api/crops/:id/verify`

## Program API Endpoints

Eligibility Check:

- `POST /api/eligibility/check`
- `GET /api/eligibility`
- `GET /api/eligibility/:id`
- `GET /api/farmers/:farmerId/eligibility`
- `GET /api/farms/:farmId/eligibility`
- `GET /api/crops/:cropId/eligibility`

Program Enrollment:

- `POST /api/enrollments`
- `GET /api/enrollments`
- `GET /api/enrollments/:id`
- `GET /api/farmers/:farmerId/enrollments`
- `GET /api/farms/:farmId/enrollments`
- `GET /api/crops/:cropId/enrollments`
- `GET /api/eligibility/:eligibilityId/enrollments`
- `PATCH /api/enrollments/:id/approval`
- `PATCH /api/enrollments/:id/cancel`

## Inventory API Endpoints

- `GET /api/odoo/inventory/items`
- `GET /api/odoo/inventory/items/:id`
- `POST /api/odoo/inventory/reserve`
- `GET /api/odoo/inventory/reservations`
- `GET /api/odoo/inventory/reservations/:id`
- `GET /api/enrollments/:enrollmentId/reservations`
- `GET /api/farmers/:farmerId/reservations`
- `GET /api/farms/:farmId/reservations`
- `GET /api/crops/:cropId/reservations`
- `PATCH /api/odoo/inventory/reservations/:id/cancel`
- `PATCH /api/odoo/inventory/reservations/:id/issue`

## Example Demo Flow Endpoints

```text
POST /api/farmers/register
POST /api/farms/register
POST /api/crops/register
PATCH /api/farmers/:id/verify
PATCH /api/farms/:id/verify
PATCH /api/crops/:id/verify
POST /api/eligibility/check
POST /api/enrollments
PATCH /api/enrollments/:id/approval
POST /api/odoo/inventory/reserve
PATCH /api/odoo/inventory/reservations/:id/issue
```

## Suggested WSO2 Publishing Order

1. Publish AgriRegistry360 Registry API.
2. Publish AgriRegistry360 Program API.
3. Publish AgriRegistry360 Inventory API.
4. Add OAuth2/JWT security and throttling policies.
5. Subscribe the Angular Portal and demo integration clients.

