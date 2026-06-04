# Farmer Registry API Tests

Default backend URL:

```bash
BASE_URL=http://localhost:5000/api
```

## Health Check

```bash
curl http://localhost:5000/health
```

## Register Demo Farmer

```bash
curl -X POST "$BASE_URL/farmers/register" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Mohamed Ameen",
    "nationalId": "901234567V",
    "mobileNumber": "0771234567",
    "district": "Anuradhapura",
    "gnDivision": "Nochchiyagama",
    "farmerType": "SMALLHOLDER",
    "registeredBy": "Field Officer"
  }'
```

## Get All Farmers

```bash
curl "$BASE_URL/farmers"
```

## Search Farmers

```bash
curl "$BASE_URL/farmers?search=ameen"
curl "$BASE_URL/farmers?search=901234567V"
curl "$BASE_URL/farmers?search=Anuradhapura"
curl "$BASE_URL/farmers?search=FARMER-0001"
```

## Get Farmer By ID

```bash
curl "$BASE_URL/farmers/<farmerMongoId>"
```

## Update Farmer

```bash
curl -X PUT "$BASE_URL/farmers/<farmerMongoId>" \
  -H "Content-Type: application/json" \
  -d '{
    "mobileNumber": "0777654321",
    "gnDivision": "Nochchiyagama North"
  }'
```

## Verify Farmer

```bash
curl -X PATCH "$BASE_URL/farmers/<farmerMongoId>/verify" \
  -H "Content-Type: application/json" \
  -d '{
    "verificationStatus": "VERIFIED"
  }'
```

## Reject Farmer

```bash
curl -X PATCH "$BASE_URL/farmers/<farmerMongoId>/verify" \
  -H "Content-Type: application/json" \
  -d '{
    "verificationStatus": "REJECTED"
  }'
```

