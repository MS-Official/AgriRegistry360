# Program Enrollment API Tests

Default backend URL:

```bash
BASE_URL=http://localhost:5001/api
```

## Get All Enrollments

```bash
curl "$BASE_URL/enrollments"
```

## Create Enrollment

Replace `REPLACE_WITH_ELIGIBLE_ELIGIBILITY_ID` with an `_id` from an `ELIGIBLE` result in `GET /api/eligibility`.

```bash
curl -X POST "$BASE_URL/enrollments" \
  -H "Content-Type: application/json" \
  -d '{
    "eligibilityId": "REPLACE_WITH_ELIGIBLE_ELIGIBILITY_ID",
    "enrolledBy": "Field Officer",
    "notes": "Demo enrollment for fertilizer subsidy"
  }'
```

## Search Enrollments

```bash
curl "$BASE_URL/enrollments?search=Mohamed"
curl "$BASE_URL/enrollments?search=ENROLL-0001"
curl "$BASE_URL/enrollments?search=FARMER-0001"
curl "$BASE_URL/enrollments?search=APPROVED"
```

## Get Enrollment By ID

```bash
curl "$BASE_URL/enrollments/<enrollmentMongoId>"
```

## Get Enrollments By Farmer

```bash
curl "$BASE_URL/farmers/REPLACE_WITH_EXISTING_FARMER_ID/enrollments"
```

## Get Enrollments By Farm

```bash
curl "$BASE_URL/farms/REPLACE_WITH_EXISTING_FARM_ID/enrollments"
```

## Get Enrollments By Crop

```bash
curl "$BASE_URL/crops/REPLACE_WITH_EXISTING_CROP_ID/enrollments"
```

## Get Enrollments By Eligibility

```bash
curl "$BASE_URL/eligibility/REPLACE_WITH_EXISTING_ELIGIBILITY_ID/enrollments"
```

## Approve Enrollment

```bash
curl -X PATCH "$BASE_URL/enrollments/REPLACE_WITH_ENROLLMENT_ID/approval" \
  -H "Content-Type: application/json" \
  -d '{
    "approvalStatus": "APPROVED"
  }'
```

## Reject Enrollment

```bash
curl -X PATCH "$BASE_URL/enrollments/REPLACE_WITH_ENROLLMENT_ID/approval" \
  -H "Content-Type: application/json" \
  -d '{
    "approvalStatus": "REJECTED",
    "notes": "Rejected during demo review"
  }'
```

## Cancel Enrollment

```bash
curl -X PATCH "$BASE_URL/enrollments/REPLACE_WITH_ENROLLMENT_ID/cancel" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Cancelled due to incorrect enrollment"
  }'
```

