# AgriRegistry360 Live Platform Demo Verification Tests

Use these standard `curl` commands from your command-line terminal to test and verify the AgriRegistry360 connection check APIs and sync behaviors in live mode.

---

### 1. Check Backend Health
Confirm the backend service is up and running on port 5001:
```bash
curl http://localhost:5001/api/health
```

---

### 2. Check Demo Readiness
Retrieve the unified readiness object indicating states for backend, mongodb, Odoo, OpenG2P, and WSO2:
```bash
curl http://localhost:5001/api/platform-sync/demo-readiness
```

---

### 3. Check Odoo Connection
Execute a live JSON-RPC authentication ping to check Odoo connection:
```bash
curl http://localhost:5001/api/platform-sync/odoo/connection-check
```

---

### 4. Check OpenG2P Connection
Execute a live JSON-RPC authentication ping to check OpenG2P connection:
```bash
curl http://localhost:5001/api/platform-sync/openg2p/connection-check
```

---

### 5. Check WSO2 Connection
Ping the WSO2 API gateway URL to verify reachability:
```bash
curl http://localhost:5001/api/platform-sync/wso2/connection-check
```

---

### 6. Run Full Demo Sync Flow
Execute the cascade demo sync (seeding contacts to Odoo, registrants to OpenG2P, reservations to Odoo, and catalog states):
```bash
curl -X POST http://localhost:5001/api/platform-sync/full-demo
```

---

### 7. View Sync Logs
Fetch the complete history logs of all outbound sync actions:
```bash
curl http://localhost:5001/api/platform-sync/logs
```
