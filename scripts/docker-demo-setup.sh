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
echo -e "${BLUE}${BOLD}           AgriRegistry360 Portable Demo Setup                 ${NC}"
echo -e "${BLUE}${BOLD}================================================================${NC}"

# 1. Check Docker is running
echo -e "\n${YELLOW}Checking if Docker is running...${NC}"
if ! docker info >/dev/null 2>&1; then
  echo -e "${RED}✗ Error: Docker is not running. Please start Docker Desktop first.${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Docker is running.${NC}"

# 2. Copy environment file
echo -e "\n${YELLOW}Configuring environment files...${NC}"
if [ -f ".env.docker" ]; then
  cp .env.docker backend/.env
  echo -e "${GREEN}✓ Copied .env.docker to backend/.env${NC}"
elif [ -f ".env.docker.example" ]; then
  cp .env.docker.example .env.docker
  cp .env.docker.example backend/.env
  echo -e "${YELLOW}! Created .env.docker from example and copied to backend/.env${NC}"
else
  echo -e "${RED}✗ Error: .env.docker.example not found.${NC}"
  exit 1
fi

# 3. Start Docker stack
echo -e "\n${YELLOW}Starting Docker containers (this may take a few minutes on first run)...${NC}"
docker compose up -d --build
echo -e "${GREEN}✓ Docker compose up completed.${NC}"

# Helper function to wait for ports
wait_for_port() {
  local host=$1
  local port=$2
  local name=$3
  echo -n "Waiting for $name to accept connections on port $port..."
  for i in {1..60}; do
    if nc -z "$host" "$port" >/dev/null 2>&1; then
      echo -e " ${GREEN}OK!${NC}"
      return 0
    fi
    echo -n "."
    sleep 2
  done
  echo -e " ${RED}TIMEOUT!${NC}"
  return 1
}

# Helper function to wait for HTTP URLs
wait_for_url() {
  local url=$1
  local name=$2
  local secure=$3
  echo -n "Waiting for $name service at $url..."
  for i in {1..90}; do
    local status
    if [ "$secure" = "true" ]; then
      status=$(curl -s -k -o /dev/null -w "%{http_code}" "$url" || true)
    else
      status=$(curl -s -o /dev/null -w "%{http_code}" "$url" || true)
    fi
    # If we get a response (even auth redirect or not found), the server is up
    if [ "$status" != "000" ] && [ "$status" != "502" ] && [ "$status" != "503" ]; then
      echo -e " ${GREEN}OK! (HTTP $status)${NC}"
      return 0
    fi
    echo -n "."
    sleep 2
  done
  echo -e " ${RED}TIMEOUT!${NC}"
  return 1
}

# 4. Wait for core services
echo -e "\n${YELLOW}Waiting for services to become ready...${NC}"
wait_for_port "localhost" 27017 "MongoDB"
wait_for_port "localhost" 5001 "Backend"
wait_for_port "localhost" 8069 "Odoo ERP"
wait_for_port "localhost" 8070 "OpenG2P"
wait_for_port "localhost" 9443 "WSO2 API Manager"

wait_for_url "http://localhost:5001/api/health" "AgriRegistry Backend API" "false"
wait_for_url "http://localhost:8069/web/login" "Odoo ERP Web Portal" "false"
wait_for_url "http://localhost:8070/web/login" "OpenG2P Web Portal" "false"
wait_for_url "https://localhost:9443/publisher" "WSO2 Publisher Portal" "true"

# 5. Database restoration and Addon upgrading
if [ -f "demo-data/odoo_db.dump" ] && [ -f "demo-data/openg2p_db.dump" ] && [ -f "demo-data/mongo_dump.archive" ]; then
  echo -e "\n${YELLOW}Demo data dumps detected. Executing automated restore...${NC}"
  chmod +x scripts/import-demo-data.sh
  ./scripts/import-demo-data.sh
  
  echo -e "\n${YELLOW}Upgrading Odoo addon (agriregistry360_base) in Odoo database...${NC}"
  docker exec agriregistry360-odoo odoo -d agriregistry360 -u agriregistry360_base --stop-after-init --db_host=odoo-db --db_user=odoo --db_password=odoo
  
  echo -e "\n${YELLOW}Upgrading Odoo addon (agriregistry360_base) in OpenG2P database...${NC}"
  docker exec agriregistry360-openg2p odoo -d openg2p -u agriregistry360_base --stop-after-init --db_host=openg2p-db --db_user=odoo --db_password=odoo
else
  echo -e "\n${YELLOW}No demo data dumps found. Setting up fresh databases...${NC}"
  # Ensure databases exist
  docker exec agriregistry360-odoo-db psql -U odoo -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'agriregistry360'" | grep -q 1 || \
    docker exec agriregistry360-odoo-db psql -U odoo -d postgres -c "CREATE DATABASE agriregistry360 WITH OWNER = odoo ENCODING = 'UTF8';"
  
  docker exec agriregistry360-openg2p-db psql -U odoo -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'openg2p'" | grep -q 1 || \
    docker exec agriregistry360-openg2p-db psql -U odoo -d postgres -c "CREATE DATABASE openg2p WITH OWNER = odoo ENCODING = 'UTF8';"

  echo -e "\n${YELLOW}Installing Odoo addon in Odoo database...${NC}"
  docker exec agriregistry360-odoo odoo -d agriregistry360 -i agriregistry360_base --stop-after-init --db_host=odoo-db --db_user=odoo --db_password=odoo
  
  echo -e "\n${YELLOW}Installing Odoo addon in OpenG2P database...${NC}"
  docker exec agriregistry360-openg2p odoo -d openg2p -i agriregistry360_base --stop-after-init --db_host=openg2p-db --db_user=odoo --db_password=odoo
fi

# 6. Restart core services to pick up Odoo database changes cleanly
echo -e "\n${YELLOW}Performing final service restart to refresh DB links...${NC}"
docker compose restart odoo openg2p backend frontend

echo -e "\n${YELLOW}Waiting for services to recover...${NC}"
wait_for_url "http://localhost:5001/api/health" "AgriRegistry Backend API" "false"
wait_for_url "http://localhost:4200" "AgriRegistry Frontend" "false"
wait_for_url "http://localhost:8069/web/login" "Odoo ERP Web Portal" "false"
wait_for_url "http://localhost:8070/web/login" "OpenG2P Web Portal" "false"

# 7. Run backend seed/demo setup via curl commands
echo -e "\n${YELLOW}Executing demo verification curls...${NC}"
echo -e "${BLUE}a. Backend Health:${NC}"
curl http://localhost:5001/api/health
echo -e "\n"

echo -e "${BLUE}b. Odoo Connection Check:${NC}"
curl http://localhost:5001/api/platform-sync/odoo/connection-check
echo -e "\n"

echo -e "${BLUE}c. OpenG2P Connection Check:${NC}"
curl http://localhost:5001/api/platform-sync/openg2p/connection-check
echo -e "\n"

echo -e "${BLUE}d. WSO2 Connection Check:${NC}"
curl http://localhost:5001/api/platform-sync/wso2/connection-check
echo -e "\n"

echo -e "${BLUE}e. Trigger Full Demo Platform Sync:${NC}"
curl -X POST http://localhost:5001/api/platform-sync/full-demo
echo -e "\n"

# 8. Print final URLs
echo -e "${GREEN}${BOLD}================================================================${NC}"
echo -e "${GREEN}${BOLD}          AgriRegistry360 Demo Environment Ready!               ${NC}"
echo -e "${GREEN}${BOLD}================================================================${NC}"
echo -e "Open the following URLs in your browser:"
echo -e " - Frontend Portal:          http://localhost:4200"
echo -e " - Backend Health:           http://localhost:5001/api/health"
echo -e " - Swagger Docs:             http://localhost:5001/api/docs"
echo -e " - Odoo ERP UI:              http://localhost:8069"
echo -e " - OpenG2P UI (Simulated):   http://localhost:8070"
echo -e " - WSO2 Publisher:           https://localhost:9443/publisher"
echo -e " - WSO2 Developer Portal:    https://localhost:9443/devportal"
echo -e " - WSO2 Gateway HTTP:        http://localhost:8280"
echo -e " - WSO2 Gateway HTTPS:       https://localhost:8243"
echo -e ""
echo -e "Credentials:"
echo -e " - Odoo/OpenG2P: Email: ${BOLD}admin@example.com${NC}, Password: ${BOLD}admin${NC}"
echo -e " - WSO2 APIM:    Username: ${BOLD}admin${NC}, Password: ${BOLD}admin${NC}"
echo -e "================================================================"
