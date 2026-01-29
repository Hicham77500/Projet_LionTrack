#!/bin/bash

# ============================================================================
# Dashboard Airflow - Script pour afficher l'état complet
# Usage: ./airflow-dashboard.sh
# ============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

clear

echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       🦁 TABLEAU DE BORD AIRFLOW LIONTRACK         ║${NC}"
echo -e "${BLUE}║                  $(date '+%d/%m/%Y %H:%M:%S')                   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
echo ""

# État des services
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}📊 ÉTAT DES SERVICES${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"

docker-compose -f docker-compose-airflow.yml ps --format "table {{.Service}}\t{{.Status}}" | \
  awk 'NR==1 {print; next} {gsub(/\x1b\[[0-9;]*m//g); print}' | \
  sed 's/^/  /'

echo ""

# Statistiques services
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}💾 STATISTIQUES${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""

# Espace disque Docker
DOCKER_SIZE=$(docker system df --format "table {{.Type}}\t{{.Size}}" | grep "Images" | awk '{print $2}')
echo -e "  ${BLUE}Espace utilisé (Docker):${NC} $DOCKER_SIZE"

# Conteneurs actifs
RUNNING=$(docker-compose -f docker-compose-airflow.yml ps -q | wc -l)
echo -e "  ${BLUE}Conteneurs en cours:${NC} $RUNNING"

echo ""

# Accès aux services
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🌐 ACCÈS AUX SERVICES${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${GREEN}🎯 Airflow UI:${NC}        http://localhost:8080"
echo -e "  ${GREEN}👤 Utilisateur:${NC}       admin"
echo -e "  ${GREEN}🔑 Mot de passe:${NC}      admin123"
echo ""
echo -e "  ${GREEN}🗄️  PostgreSQL:${NC}       localhost:5432"
echo -e "  ${GREEN}🔴 Redis:${NC}             localhost:6379"
echo ""

# DAGs
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}📋 DAG LIONTRACK${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""

if docker-compose -f docker-compose-airflow.yml exec -T airflow-scheduler airflow dags list 2>/dev/null | grep -q liontrack; then
    echo -e "  ${GREEN}✅ DAG 'liontrack_daily_operations' détecté${NC}"
    echo -e "  ${BLUE}📅 Horaire:${NC} Quotidien à 2h du matin"
    echo -e "  ${BLUE}🔄 Exécuteur:${NC} CeleryExecutor"
else
    echo -e "  ${RED}❌ DAG non trouvé${NC}"
fi

echo ""

# Commandes utiles
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}⚙️  COMMANDES UTILES${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${GREEN}Voir les logs en temps réel:${NC}"
echo -e "    ./view-logs.sh [service]"
echo ""
echo -e "  ${GREEN}Lister les DAGs:${NC}"
echo -e "    docker-compose -f docker-compose-airflow.yml exec airflow-scheduler airflow dags list"
echo ""
echo -e "  ${GREEN}Tester un DAG:${NC}"
echo -e "    docker-compose -f docker-compose-airflow.yml exec airflow-scheduler airflow dags test liontrack_daily_operations 2026-01-28"
echo ""
echo -e "  ${GREEN}Afficher les exécutions:${NC}"
echo -e "    docker-compose -f docker-compose-airflow.yml exec airflow-scheduler airflow dags list-runs --dag-id liontrack_daily_operations"
echo ""
echo -e "  ${GREEN}Arrêter Airflow:${NC}"
echo -e "    ./stop-airflow.sh"
echo ""

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""
