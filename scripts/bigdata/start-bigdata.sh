#!/bin/bash

# 🦁 LionTrack BigData - Quick Start Guide
# 
# Ce script lance l'infrastructure BigData complète
# Usage: ./start-bigdata.sh

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                 🦁 LionTrack BigData Quick Start              ║"
echo "╚════════════════════════════════════════════════════════════════╝"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# STEP 1: Vérifier les prérequis
# ============================================================================

echo -e "\n${BLUE}[1/6]${NC} Vérification des prérequis..."

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker n'est pas installé${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose n'est pas installé${NC}"
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 n'est pas installé${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Tous les prérequis présents${NC}"

# ============================================================================
# STEP 2: Créer les répertoires nécessaires
# ============================================================================

echo -e "\n${BLUE}[2/6]${NC} Création des répertoires de données..."

mkdir -p bigdata/data/{bronze,silver,gold,streaming}
mkdir -p bigdata/checkpoints
mkdir -p bigdata/notebooks
mkdir -p bigdata/spark/jobs
mkdir -p bigdata/kafka
mkdir -p bigdata/monitoring
mkdir -p logs

echo -e "${GREEN}✅ Répertoires créés${NC}"

# ============================================================================
# STEP 3: Démarrer les services Docker
# ============================================================================

echo -e "\n${BLUE}[3/6]${NC} Démarrage des services Docker..."

docker-compose -f docker-compose-bigdata.yml up -d

echo -e "${YELLOW}⏳ Attente du démarrage des services (30 secondes)...${NC}"
sleep 30

# Vérifier que les services sont up
echo -e "\n${YELLOW}Vérification du statut des services:${NC}"
docker-compose -f docker-compose-bigdata.yml ps

echo -e "${GREEN}✅ Services Docker démarrés${NC}"

# ============================================================================
# STEP 4: Installer les dépendances Python
# ============================================================================

echo -e "\n${BLUE}[4/6]${NC} Installation des dépendances Python..."

python3 -m venv bigdata/.venv
source bigdata/.venv/bin/activate
pip install --upgrade pip
pip install -r bigdata/requirements.txt

echo -e "${GREEN}✅ Dépendances Python installées${NC}"

# ============================================================================
# STEP 5: Initialiser les données
# ============================================================================

echo -e "\n${BLUE}[5/6]${NC} Initialisation de la base de données..."

# Attendre que PostgreSQL soit vraiment prêt
echo -e "${YELLOW}⏳ Attente de PostgreSQL...${NC}"
for i in {1..30}; do
    if docker-compose -f docker-compose-bigdata.yml exec -T postgres pg_isready -U liontrack -d liontrack_warehouse &>/dev/null; then
        echo -e "${GREEN}✅ PostgreSQL prêt${NC}"
        break
    fi
    echo -n "."
    sleep 1
done

# Créer les topics Kafka
echo -e "\n${YELLOW}Création des topics Kafka...${NC}"
docker-compose -f docker-compose-bigdata.yml exec -T kafka kafka-topics --create --topic lions.position.events --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1 2>/dev/null || true
docker-compose -f docker-compose-bigdata.yml exec -T kafka kafka-topics --create --topic lions.weight.events --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1 2>/dev/null || true
docker-compose -f docker-compose-bigdata.yml exec -T kafka kafka-topics --create --topic users.activity.events --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1 2>/dev/null || true
docker-compose -f docker-compose-bigdata.yml exec -T kafka kafka-topics --create --topic challenges.status.events --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1 2>/dev/null || true
docker-compose -f docker-compose-bigdata.yml exec -T kafka kafka-topics --create --topic data.quality.events --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1 2>/dev/null || true

echo -e "${GREEN}✅ Topics Kafka créés${NC}"

# ============================================================================
# STEP 6: Afficher les URLs d'accès
# ============================================================================

echo -e "\n${BLUE}[6/6]${NC} Infrastructure prête ! ${GREEN}✅${NC}"

echo -e "\n${YELLOW}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║              Services disponibles sur votre machine              ║${NC}"
echo -e "${YELLOW}╚════════════════════════════════════════════════════════════════╝${NC}\n"

echo -e "${GREEN}📊 Dashboards & Monitoring:${NC}"
echo -e "  🔴 Prometheus  : http://localhost:9090"
echo -e "  📈 Grafana     : http://localhost:3000 (admin/admin)"
echo -e "  ⚙️  Spark UI    : http://localhost:8080"
echo -e "  📓 Jupyter Lab : http://localhost:8888"

echo -e "\n${GREEN}🗄️  Stockage & Base de données:${NC}"
echo -e "  🪣 MinIO       : http://localhost:9001 (minioadmin/minioadmin)"
echo -e "  🐘 PostgreSQL  : localhost:5432 (liontrack/liontrack_secure_pass)"
echo -e "  🗄️  MongoDB    : Atlas (voir .env)"

echo -e "\n${GREEN}🦁 APIs LionTrack:${NC}"
echo -e "  🔗 API REST    : http://localhost:4001"
echo -e "  📱 Analytics   : http://localhost:4001/api/analytics/dashboard"

echo -e "\n${GREEN}📦 Message Broker:${NC}"
echo -e "  🔔 Kafka       : kafka:9092 (interne Docker)"
echo -e "  📝 Topics      : lions.position.events, lions.weight.events, ..."

echo -e "\n${YELLOW}════════════════════════════════════════════════════════════════${NC}\n"

# ============================================================================
# INSTRUCTIONS SUIVANTES
# ============================================================================

echo -e "${BLUE}🚀 Prochaines étapes:${NC}\n"

echo -e "${YELLOW}1. Démarrer les consommateurs Kafka:${NC}"
echo -e "   source bigdata/.venv/bin/activate"
echo -e "   python bigdata/kafka/consumer.py\n"

echo -e "${YELLOW}2. Démarrer les pipelines Spark (streaming):${NC}"
echo -e "   source bigdata/.venv/bin/activate"
echo -e "   python bigdata/spark/streaming_processor.py\n"

echo -e "${YELLOW}3. Vérifier les données en PostgreSQL:${NC}"
echo -e "   psql -h localhost -U liontrack -d liontrack_warehouse"
echo -e "   SELECT COUNT(*) FROM silver.lions;\n"

echo -e "${YELLOW}4. Consulter le dashboard:${NC}"
echo -e "   curl http://localhost:4001/api/analytics/dashboard\n"

echo -e "${BLUE}✨ Installation terminée ! Bon tracking ! 🦁${NC}\n"

# ============================================================================
# Afficher les logs
# ============================================================================

echo -e "${YELLOW}📋 Logs en direct (Ctrl+C pour quitter):${NC}"
docker-compose -f docker-compose-bigdata.yml logs -f --tail=20
