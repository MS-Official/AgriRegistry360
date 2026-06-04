# AgriRegistry360 Docker Environment Verification Tests

Use these `curl` commands in your host terminal to test the containerized backend APIs and verify that MongoDB, Odoo, OpenG2P, and WSO2 sync integrations are functioning correctly inside the Docker stack.

---

## Docker Demo Database Credentials

When creating the Odoo and OpenG2P databases through the browser UI, the login email used during database creation must match the backend Docker environment values.

For this demo:

| Platform | Database | Login Email | Password |
| --- | --- | --- | --- |
| Odoo ERP | `agriregistry360` | `admin@example.com` | `admin` |
| OpenG2P | `openg2p` | `admin@example.com` | `admin` |

After changing Docker credentials or environment values, recreate the backend container:
```bash
docker compose up -d --force-recreate backend
```

---

### 1. Verify Backend Container Health
```bash
curl http://localhost:5001/api/health
```
**Expected Response**:
```json
{"success":true,"message":"AgriRegistry360 API is running"}
```

---

### 2. Verify Demo Readiness Aggregator
```bash
curl http://localhost:5001/api/platform-sync/demo-readiness
```

---

### 3. Test Odoo Container Connection
```bash
curl http://localhost:5001/api/platform-sync/odoo/connection-check
```

---

### 4. Test OpenG2P Container Connection
```bash
curl http://localhost:5001/api/platform-sync/openg2p/connection-check
```

---

### 5. Test WSO2 Container Connection
```bash
curl http://localhost:5001/api/platform-sync/wso2/connection-check
```

---

### 6. Trigger Full Demo Cascade Sync
```bash
curl -X POST http://localhost:5001/api/platform-sync/full-demo
```

---

### 7. Retrieve Outbound Sync Logs
```bash
curl http://localhost:5001/api/platform-sync/logs
```
