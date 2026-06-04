# Platform Sync API Curl Test Script

Use these `curl` commands in your terminal to verify and test the Platform Sync and WSO2 gateway APIs.

---

## 1. Retrieve Platform Sync Status
Returns counts of records synced, failed, pending, or in demo mode for Odoo and OpenG2P.

```bash
curl -X GET http://localhost:5001/api/platform-sync/status \
  -H "Accept: application/json"
```

---

## 2. Trigger Full End-to-End Demo Sync Flow
Locates the seeded farmer Mohamed Ameen (FARMER-0001) along with their farm, crops, program enrollments, and inventory reservations, and synchronizes them sequentially.

```bash
curl -X POST http://localhost:5001/api/platform-sync/full-demo \
  -H "Accept: application/json"
```

---

## 3. Retrieve Sync Logs History
Fetches a list of all historical sync events, sorted by latest action first.

```bash
curl -X GET http://localhost:5001/api/platform-sync/logs \
  -H "Accept: application/json"
```

---

## 4. Sync a Specific Farmer to Odoo
Manually trigger Odoo res.partner sync for a farmer ID. Replace `FARMER_MONGO_ID` with a valid MongoDB ObjectId.

```bash
curl -X POST http://localhost:5001/api/platform-sync/farmers/FARMER_MONGO_ID/odoo \
  -H "Accept: application/json"
```

---

## 5. Sync a Specific Farmer to OpenG2P
Manually trigger OpenG2P registrant sync for a farmer ID. Replace `FARMER_MONGO_ID` with a valid MongoDB ObjectId.

```bash
curl -X POST http://localhost:5001/api/platform-sync/farmers/FARMER_MONGO_ID/openg2p \
  -H "Accept: application/json"
```

---

## 6. Sync a Specific Reservation to Odoo
Manually trigger Odoo product reservation sync. Replace `RESERVATION_MONGO_ID` with a valid MongoDB ObjectId.

```bash
curl -X POST http://localhost:5001/api/platform-sync/reservations/RESERVATION_MONGO_ID/odoo \
  -H "Accept: application/json"
```

---

## 7. Retrieve WSO2 Gateway Readiness Status
Fetches metadata parameters and context paths ready for WSO2 API Manager publishing.

```bash
curl -X GET http://localhost:5001/api/platform-sync/wso2/gateway-status \
  -H "Accept: application/json"
```

---

## 8. Mark WSO2 API as Published
Saves a sync log state indicating an API has been successfully imported and published in the WSO2 gateway.

```bash
curl -X POST http://localhost:5001/api/platform-sync/wso2/mark-published \
  -H "Content-Type: application/json" \
  -d '{
    "apiName": "AgriRegistry360 Registry API",
    "context": "/agriregistry360/registry",
    "gatewayUrl": "https://localhost:8243/agriregistry360/registry/1.0.0"
  }'
```
