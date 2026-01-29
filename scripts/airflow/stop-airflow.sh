#!/bin/bash

# ============================================================================
# Script pour arrêter Airflow proprement
# Usage: ./stop-airflow.sh
# ============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🛑 Arrêt d'Apache Airflow${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════${NC}\n"

if [ "$(docker-compose -f docker-compose-airflow.yml ps -q)" ]; then
    echo -e "${BLUE}Arrêt des services Docker...${NC}"
    docker-compose -f docker-compose-airflow.yml down --remove-orphans
    echo -e "${GREEN}✅ Services arrêtés${NC}"
else
    echo -e "${BLUE}Aucun service en cours d'exécution${NC}"
fi

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Arrêt complet${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
