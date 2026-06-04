# OpenG2P Mapping API Tests

Default backend URL:

```bash
BASE_URL=http://localhost:5001/api
```

## Get OpenG2P Mapping Metadata

```bash
curl "$BASE_URL/openg2p/mapping"
```

Expected response includes:

```json
{
  "success": true,
  "message": "OpenG2P mapping metadata retrieved successfully",
  "data": {
    "status": "READY_FOR_OPENG2P_MAPPING",
    "modules": [
      {
        "agriregistryModule": "Farmer Registry",
        "openG2PConcept": "Registrant / Beneficiary",
        "status": "MAPPED"
      }
    ]
  }
}
```

