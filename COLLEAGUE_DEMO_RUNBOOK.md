# AgriRegistry360 Colleague Demo Runbook

This guide enables you to start and verify the complete AgriRegistry360 environment locally on your Mac using Docker Compose.

---

## 1. Prerequisites

Before running the setup:
- Install **Docker Desktop** (Mac/Windows/Linux).
- Open **Docker Desktop -> Settings -> Resources** and allocate at least **8GB RAM** (preferably 10GB+) and **4 CPUs** to avoid virtualization limits, especially for WSO2 API Manager.
- Clone or copy the `FarmRegistry` repository to your local directory.

---

## 2. Setup Commands

Open your terminal, navigate to the project root directory, and run the following commands:

```bash
# Make all scripts executable
chmod +x scripts/*.sh

# Run the automated setup script
./scripts/docker-demo-setup.sh
```

*Note: The setup script will build the frontend and backend, launch the Docker containers, wait for them to become healthy, import the pre-packaged demo database dumps, install/upgrade Odoo custom modules, and verify integrations.*

---

## 3. Demo URLs & Access Points

Use these URLs to interact with the environment from your web browser:

| Application | URL |
| --- | --- |
| **AgriRegistry360 Frontend** | [http://localhost:4200](http://localhost:4200) |
| **Backend API Health** | [http://localhost:5001/api/health](http://localhost:5001/api/health) |
| **Swagger API Docs** | [http://localhost:5001/api/docs](http://localhost:5001/api/docs) |
| **Odoo ERP UI** | [http://localhost:8069](http://localhost:8069) |
| **OpenG2P-compatible Odoo** | [http://localhost:8070](http://localhost:8070) |
| **WSO2 Publisher Portal** | [https://localhost:9443/publisher](https://localhost:9443/publisher) |
| **WSO2 Developer Portal** | [https://localhost:9443/devportal](https://localhost:9443/devportal) |
| **WSO2 Gateway HTTP** | [http://localhost:8280](http://localhost:8280) |
| **WSO2 Gateway HTTPS** | [https://localhost:8243](https://localhost:8243) |

---

## 4. Default Login Details

- **Odoo ERP / OpenG2P Portal**:
  - Email: `admin@example.com`
  - Password: `admin`
- **WSO2 Carbon / Publisher / Dev Portal**:
  - Username: `admin`
  - Password: `admin`

---

## 5. Client Demo Verification Checklist

Verify that the following items are functional to confirm a successful deployment:

- [ ] **Frontend Dashboard**: Open [http://localhost:4200](http://localhost:4200) and confirm the farmer, farm, and crop counts load successfully.
- [ ] **Platform Sync Statuses**: Go to the **Platform Sync Center** on the frontend dashboard and click connection checks:
  - Odoo ERP card shows `CONNECTED`.
  - OpenG2P card shows `CONNECTED`.
  - WSO2 API Manager card shows `CONNECTED` (or `READY_FOR_PUBLISHING` if not yet published).
- [ ] **Odoo Inventory Items**:
  - Log in to Odoo ERP ([http://localhost:8069](http://localhost:8069)).
  - Navigate to **AgriRegistry360 -> Inventory Items** from the top menu.
  - Confirm the item `FERTILIZER_50KG` appears in the list.
- [ ] **Odoo Inventory Reservations**:
  - In Odoo ERP, navigate to **AgriRegistry360 -> Inventory Reservations**.
  - Confirm the reservation `RESERVE-0001` appears and matches the frontend record.
- [ ] **OpenG2P Registry Verification**:
  - Log in to OpenG2P ([http://localhost:8070](http://localhost:8070)).
  - Navigate to **AgriRegistry360** and check the submenus.
  - Confirm that Farmer (`Mohamed Ameen`), Farm (`FARM-LAND-0001`), Crop (`CROP-0001`), Eligibility, and Enrollment records are synced.
- [ ] **WSO2 Developer Portal**:
  - Open [https://localhost:9443/devportal](https://localhost:9443/devportal) and sign in.
  - Confirm the `AgriRegistry360` APIs are available in the catalog.
- [ ] **Gateway Health**:
  - Verify that the gateway health endpoint responds correctly (refer to `demo-data/wso2_notes.txt` for details).

---

## 6. Localhost vs Docker Internal DNS Resolution

To prevent connection failures, always distinguish between **outside** and **inside** container network calls:

1. **From your Host Machine (Mac/Browser)**:
   - Use `localhost` (e.g. `http://localhost:5001` to test APIs, or `http://localhost:8069` to log in to Odoo).
   - Your browser does not know about Docker internal container names.

2. **From Inside Docker Containers**:
   - Containers communicate via the bridge network using **Docker Service DNS Names**:
     - MongoDB: `mongodb://mongo:27017`
     - Backend: `http://backend:5001`
     - Odoo: `http://odoo:8069`
     - OpenG2P: `http://openg2p:8069`
     - WSO2 APIM: `https://wso2-apim:9443`
     - WSO2 Gateway: `https://wso2-apim:8243`
   - *Never use `localhost` inside container environment variables.*

3. **Important**:
   - **Do not run `docker compose` commands from inside containers.** Execute all docker control commands from your host Mac terminal.
