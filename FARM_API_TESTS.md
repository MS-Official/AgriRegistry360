# Farm / Land Registry API Tests

Default backend URL:

```bash
BASE_URL=http://localhost:5001/api
```

## Get All Farms

```bash
curl "$BASE_URL/farms"
```

## Register Farm

Replace `REPLACE_WITH_EXISTING_FARMER_ID` with a farmer MongoDB `_id` from `GET /api/farmers`.

```bash
curl -X POST "$BASE_URL/farms/register" \
  -H "Content-Type: application/json" \
  -d '{
    "farmerId": "REPLACE_WITH_EXISTING_FARMER_ID",
    "landSize": 2.5,
    "landSizeUnit": "ACRES",
    "ownershipType": "OWNED",
    "district": "Anuradhapura",
    "gnDivision": "Nochchiyagama",
    "gpsLatitude": 8.3432,
    "gpsLongitude": 80.3736,
    "soilType": "LOAM",
    "irrigationType": "CANAL",
    "farmStatus": "ACTIVE",
    "registeredBy": "Field Officer"
  }'
```

## Search Farms

```bash
curl "$BASE_URL/farms?search=anuradhapura"
curl "$BASE_URL/farms?search=FARM-LAND-0001"
curl "$BASE_URL/farms?search=FARMER-0001"
curl "$BASE_URL/farms?search=LOAM"
```

## Get Farm By ID

```bash
curl "$BASE_URL/farms/<farmMongoId>"
```

## Get Farms By Farmer

```bash
curl "$BASE_URL/farmers/<farmerMongoId>/farms"
```

## Update Farm

```bash
curl -X PUT "$BASE_URL/farms/<farmMongoId>" \
  -H "Content-Type: application/json" \
  -d '{
    "landSize": 3,
    "farmStatus": "UNDER_REVIEW"
  }'
```

## Verify Farm

```bash
curl -X PATCH "$BASE_URL/farms/<farmMongoId>/verify" \
  -H "Content-Type: application/json" \
  -d '{
    "verificationStatus": "VERIFIED"
  }'
```

## Reject Farm

```bash
curl -X PATCH "$BASE_URL/farms/<farmMongoId>/verify" \
  -H "Content-Type: application/json" \
  -d '{
    "verificationStatus": "REJECTED"
  }'
```
