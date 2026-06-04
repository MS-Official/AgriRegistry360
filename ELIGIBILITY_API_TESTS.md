# Eligibility Check API Tests

Default backend URL:

```bash
BASE_URL=http://localhost:5001/api
```

## Get All Eligibility Checks

```bash
curl "$BASE_URL/eligibility"
```

## Check Eligibility

Replace IDs with values from `GET /api/farmers`, `GET /api/farms`, and `GET /api/crops`.

```bash
curl -X POST "$BASE_URL/eligibility/check" \
  -H "Content-Type: application/json" \
  -d '{
    "farmerId": "REPLACE_WITH_EXISTING_FARMER_ID",
    "farmId": "REPLACE_WITH_EXISTING_FARM_ID",
    "cropId": "REPLACE_WITH_EXISTING_CROP_ID",
    "programCode": "FERTILIZER_SUBSIDY_2026",
    "checkedBy": "Field Officer"
  }'
```

## Search Eligibility Checks

```bash
curl "$BASE_URL/eligibility?search=Mohamed"
curl "$BASE_URL/eligibility?search=FARMER-0001"
curl "$BASE_URL/eligibility?search=FARM-LAND-0001"
curl "$BASE_URL/eligibility?search=CROP-0001"
curl "$BASE_URL/eligibility?search=ELIGIBLE"
```

## Get Eligibility By ID

```bash
curl "$BASE_URL/eligibility/<eligibilityMongoId>"
```

## Get Eligibility By Farmer

```bash
curl "$BASE_URL/farmers/REPLACE_WITH_EXISTING_FARMER_ID/eligibility"
```

## Get Eligibility By Farm

```bash
curl "$BASE_URL/farms/REPLACE_WITH_EXISTING_FARM_ID/eligibility"
```

## Get Eligibility By Crop

```bash
curl "$BASE_URL/crops/REPLACE_WITH_EXISTING_CROP_ID/eligibility"
```

