#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0;3m' # No Color
BOLD='\033[1m'

echo -e "${BLUE}${BOLD}================================================================${NC}"
echo -e "${BLUE}${BOLD}             AgriRegistry360 Demo Data Exporter                 ${NC}"
echo -e "${BLUE}${BOLD}================================================================${NC}"

# Ensure demo-data folder exists
mkdir -p demo-data

echo -e "\n${YELLOW}1. Exporting MongoDB database (agriregistry360)...${NC}"
if docker ps --format '{{.Names}}' | grep -q "agriregistry360-mongo"; then
  docker exec agriregistry360-mongo mongodump --archive --db=agriregistry360 > demo-data/mongo_dump.archive
  echo -e "${GREEN}✓ MongoDB backup saved to demo-data/mongo_dump.archive${NC}"
else
  echo -e "${RED}✗ Error: MongoDB container (agriregistry360-mongo) is not running.${NC}"
  exit 1
fi

echo -e "\n${YELLOW}2. Exporting Odoo ERP PostgreSQL database (agriregistry360)...${NC}"
if docker ps --format '{{.Names}}' | grep -q "agriregistry360-odoo-db"; then
  docker exec agriregistry360-odoo-db pg_dump -U odoo -d agriregistry360 -F c > demo-data/odoo_db.dump
  echo -e "${GREEN}✓ Odoo DB backup saved to demo-data/odoo_db.dump${NC}"
else
  echo -e "${RED}✗ Error: Odoo DB container (agriregistry360-odoo-db) is not running.${NC}"
  exit 1
fi

echo -e "\n${YELLOW}3. Exporting OpenG2P PostgreSQL database (openg2p)...${NC}"
if docker ps --format '{{.Names}}' | grep -q "agriregistry360-openg2p-db"; then
  docker exec agriregistry360-openg2p-db pg_dump -U odoo -d openg2p -F c > demo-data/openg2p_db.dump
  echo -e "${GREEN}✓ OpenG2P DB backup saved to demo-data/openg2p_db.dump${NC}"
else
  echo -e "${RED}✗ Error: OpenG2P DB container (agriregistry360-openg2p-db) is not running.${NC}"
  exit 1
fi

echo -e "\n${YELLOW}4. Creating WSO2 API Manager config notes...${NC}"
cat <<EOF > demo-data/wso2_notes.txt
AgriRegistry360 WSO2 API Manager Import Notes:
----------------------------------------------
The AgriRegistry360 API specifications are hosted dynamically by the backend:
- Main OpenAPI Spec: http://localhost:5001/api/docs.json
- WSO2 Optimized OpenAPI Spec: http://localhost:5001/api/docs/wso2.json

To publish the APIs on a new machine:
1. Save the JSON spec from http://localhost:5001/api/docs/wso2.json to your local disk.
2. Log in to the WSO2 API Publisher at https://localhost:9443/publisher (admin/admin).
3. Click "CREATE API" -> "Design a New REST API" -> "Import OpenAPI Definition".
4. Upload the saved JSON file, keep endpoints default (http://backend:5001/api), and click "Create".
5. Navigate to "Develop -> Configurations -> Endpoints" and set the Production and Sandbox endpoints to:
   - http://backend:5001/api
6. Go to "Deploy -> Deployments" and click "Deploy New Revision".
7. Go to "Lifecycle" and click "Publish".
EOF
echo -e "${GREEN}✓ WSO2 instructions saved to demo-data/wso2_notes.txt${NC}"

echo -e "\n${GREEN}${BOLD}================================================================${NC}"
echo -e "${GREEN}${BOLD}        Demo data successfully exported to demo-data/           ${NC}"
echo -e "${GREEN}${BOLD}================================================================${NC}"
