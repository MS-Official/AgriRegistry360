# Crop Registry API Tests

Default backend URL:

```bash
BASE_URL=http://localhost:5001/api
```

## Get All Crops

```bash
curl "$BASE_URL/crops"
```

## Register Crop

Replace `REPLACE_WITH_EXISTING_FARM_ID` with a farm MongoDB `_id` from `GET /api/farms`.

```bash
curl -X POST "$BASE_URL/crops/register" \
  -H "Content-Type: application/json" \
  -d '{
    "farmId": "REPLACE_WITH_EXISTING_FARM_ID",
    "cropType": "PADDY",
    "season": "MAHA",
    "seasonYear": 2026,
    "cultivationArea": 2,
    "cultivationAreaUnit": "ACRES",
    "plantingDate": "2026-06-01",
    "expectedHarvestDate": "2026-09-20",
    "expectedYield": 4500,
    "expectedYieldUnit": "KG",
    "cropStatus": "GROWING",
    "registeredBy": "Field Officer"
  }'
```

## Search Crops

```bash
curl "$BASE_URL/crops?search=paddy"
curl "$BASE_URL/crops?search=CROP-0001"
curl "$BASE_URL/crops?search=FARM-LAND-0001"
curl "$BASE_URL/crops?search=MAHA"
curl "$BASE_URL/crops?search=2026"
```

## Get Crop By ID

```bash
curl "$BASE_URL/crops/<cropMongoId>"
```

## Get Crops By Farm

```bash
curl "$BASE_URL/farms/REPLACE_WITH_EXISTING_FARM_ID/crops"
```

## Get Crops By Farmer

```bash
curl "$BASE_URL/farmers/REPLACE_WITH_EXISTING_FARMER_ID/crops"
```

## Update Crop

```bash
curl -X PUT "$BASE_URL/crops/<cropMongoId>" \
  -H "Content-Type: application/json" \
  -d '{
    "cropStatus": "HARVESTED",
    "expectedYield": 4700
  }'
```

## Verify Crop

```bash
curl -X PATCH "$BASE_URL/crops/REPLACE_WITH_CROP_ID/verify" \
  -H "Content-Type: application/json" \
  -d '{
    "verificationStatus": "VERIFIED"
  }'
```

## Reject Crop

```bash
curl -X PATCH "$BASE_URL/crops/REPLACE_WITH_CROP_ID/verify" \
  -H "Content-Type: application/json" \
  -d '{
    "verificationStatus": "REJECTED"
  }'
```
