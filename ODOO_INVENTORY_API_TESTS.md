# Odoo Inventory Reservation API Tests

Default backend URL:

```bash
BASE_URL=http://localhost:5001/api
```

## Get Inventory Items

```bash
curl "$BASE_URL/odoo/inventory/items"
```

## Reserve Inventory

Replace `REPLACE_WITH_APPROVED_ENROLLMENT_ID` with an approved enrollment `_id`.

```bash
curl -X POST "$BASE_URL/odoo/inventory/reserve" \
  -H "Content-Type: application/json" \
  -d '{
    "enrollmentId": "REPLACE_WITH_APPROVED_ENROLLMENT_ID",
    "reservedBy": "Field Officer",
    "notes": "Reserve fertilizer for approved enrollment"
  }'
```

## Get Reservations

```bash
curl "$BASE_URL/odoo/inventory/reservations"
curl "$BASE_URL/odoo/inventory/reservations?search=Mohamed"
curl "$BASE_URL/odoo/inventory/reservations?search=RESERVE-0001"
```

## Get Reservation By ID

```bash
curl "$BASE_URL/odoo/inventory/reservations/<reservationMongoId>"
```

## Get Reservations By Enrollment

```bash
curl "$BASE_URL/enrollments/REPLACE_WITH_ENROLLMENT_ID/reservations"
```

## Get Reservations By Farmer

```bash
curl "$BASE_URL/farmers/REPLACE_WITH_FARMER_ID/reservations"
```

## Get Reservations By Farm

```bash
curl "$BASE_URL/farms/REPLACE_WITH_FARM_ID/reservations"
```

## Get Reservations By Crop

```bash
curl "$BASE_URL/crops/REPLACE_WITH_CROP_ID/reservations"
```

## Issue Reservation

```bash
curl -X PATCH "$BASE_URL/odoo/inventory/reservations/REPLACE_WITH_RESERVATION_ID/issue" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Fertilizer issued to farmer"
  }'
```

## Cancel Reservation

```bash
curl -X PATCH "$BASE_URL/odoo/inventory/reservations/REPLACE_WITH_RESERVATION_ID/cancel" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Cancelled due to incorrect reservation"
  }'
```

