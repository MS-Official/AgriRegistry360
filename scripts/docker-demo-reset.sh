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
echo -e "${BLUE}${BOLD}            AgriRegistry360 Demo Environment Reset               ${NC}"
echo -e "${BLUE}${BOLD}================================================================${NC}"

# Parse flags
CLEAN_VOLUMES=false
for arg in "$@"; do
  if [ "$arg" == "--fresh" ]; then
    CLEAN_VOLUMES=true
  fi
done

if [ "$CLEAN_VOLUMES" = true ]; then
  echo -e "\n${RED}${BOLD}Stopping containers and wiping all persistent volumes...${NC}"
  docker compose down -v
  echo -e "${GREEN}✓ Containers stopped and database volumes deleted.${NC}"
else
  echo -e "\n${YELLOW}Stopping containers (preserving databases)...${NC}"
  docker compose down
  echo -e "${GREEN}✓ Containers stopped.${NC}"
fi

echo -e "\n${YELLOW}Running setup script to rebuild and relaunch...${NC}"
chmod +x scripts/docker-demo-setup.sh
./scripts/docker-demo-setup.sh
