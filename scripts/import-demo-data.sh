#!/bin/bash
# Exit on error
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0;3m' # No Color
BOLD='\033[1m'

echo -e "${BLUE}${BOLD}================================================================${NC}"
echo -e "${BLUE}${BOLD}             AgriRegistry360 Demo Data Importer                 ${NC}"
echo -e "${BLUE}${BOLD}================================================================${NC}"

# Check if dumps exist
if [ ! -f "demo-data/mongo_dump.archive" ] || [ ! -f "demo-data/odoo_db.dump" ] || [ ! -f "demo-data/openg2p_db.dump" ]; then
  echo -e "${RED}✗ Error: One or more demo data dumps are missing in demo-data/ directory.${NC}"
  echo -e "Make sure you run scripts/export-demo-data.sh first."
  exit 1
fi

echo -e "\n${YELLOW}1. Stopping Odoo and OpenG2P containers to release database locks...${NC}"
docker compose stop odoo openg2p || true
echo -e "${GREEN}✓ Containers stopped${NC}"

echo -e "\n${YELLOW}2. Restoring Odoo ERP Database (agriregistry360)...${NC}"
if docker ps --format '{{.Names}}' | grep -q "agriregistry360-odoo-db"; then
  echo -e "Re-creating database agriregistry360..."
  docker exec agriregistry360-odoo-db psql -U odoo -d postgres -c "DROP DATABASE IF EXISTS agriregistry360 WITH (FORCE);"
  docker exec agriregistry360-odoo-db psql -U odoo -d postgres -c "CREATE DATABASE agriregistry360 WITH OWNER = odoo ENCODING = 'UTF8';"
  echo -e "Importing pg_dump archive..."
  docker exec -i agriregistry360-odoo-db pg_restore -U odoo -d agriregistry360 < demo-data/odoo_db.dump
  echo -e "${GREEN}✓ Odoo ERP database restored successfully.${NC}"
else
  echo -e "${RED}✗ Error: Database container (agriregistry360-odoo-db) is not running.${NC}"
  exit 1
fi

echo -e "\n${YELLOW}3. Restoring OpenG2P Database (openg2p)...${NC}"
if docker ps --format '{{.Names}}' | grep -q "agriregistry360-openg2p-db"; then
  echo -e "Re-creating database openg2p..."
  docker exec agriregistry360-openg2p-db psql -U odoo -d postgres -c "DROP DATABASE IF EXISTS openg2p WITH (FORCE);"
  docker exec agriregistry360-openg2p-db psql -U odoo -d postgres -c "CREATE DATABASE openg2p WITH OWNER = odoo ENCODING = 'UTF8';"
  echo -e "Importing pg_dump archive..."
  docker exec -i agriregistry360-openg2p-db pg_restore -U odoo -d openg2p < demo-data/openg2p_db.dump
  echo -e "${GREEN}✓ OpenG2P database restored successfully.${NC}"
else
  echo -e "${RED}✗ Error: Database container (agriregistry360-openg2p-db) is not running.${NC}"
  exit 1
fi

echo -e "\n${YELLOW}4. Restoring MongoDB database (agriregistry360)...${NC}"
if docker ps --format '{{.Names}}' | grep -q "agriregistry360-mongo"; then
  docker exec -i agriregistry360-mongo mongorestore --archive --drop < demo-data/mongo_dump.archive
  echo -e "${GREEN}✓ MongoDB database restored successfully.${NC}"
else
  echo -e "${RED}✗ Error: MongoDB container (agriregistry360-mongo) is not running.${NC}"
  exit 1
fi

echo -e "\n${YELLOW}5. Starting Odoo and OpenG2P containers...${NC}"
docker compose start odoo openg2p
echo -e "${GREEN}✓ Containers started.${NC}"

echo -e "\n${YELLOW}6. Restarting backend and frontend services to force reconnection...${NC}"
docker compose restart backend frontend
echo -e "${GREEN}✓ Backend and frontend services restarted.${NC}"

echo -e "\n${GREEN}${BOLD}================================================================${NC}"
echo -e "${GREEN}${BOLD}       Demo data successfully restored into Docker containers   ${NC}"
echo -e "${GREEN}${BOLD}================================================================${NC}"
