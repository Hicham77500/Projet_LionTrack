#!/bin/bash

# Test complet de la pipeline BigData

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║            🦁 LionTrack BigData - Test Suite                  ║"
echo "╚════════════════════════════════════════════════════════════════╝"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASSED=0
FAILED=0

# ============================================================================
# Helper Functions
# ============================================================================

test_passed() {
    echo -e "${GREEN}✅ $1${NC}"
    ((PASSED++))
}

test_failed() {
    echo -e "${RED}❌ $1${NC}"
    ((FAILED++))
}

# ============================================================================
# TEST 1: Services Docker
# ============================================================================

echo -e "\n${BLUE}[TEST 1]${NC} Vérification des services Docker..."

if docker-compose -f docker-compose-bigdata.yml ps | grep -q "kafka.*Up"; then
    test_passed "Kafka service est running"
else
    test_failed "Kafka service n'est pas running"
fi

if docker-compose -f docker-compose-bigdata.yml ps | grep -q "postgres.*Up"; then
    test_passed "PostgreSQL service est running"
else
    test_failed "PostgreSQL service n'est pas running"
fi

if docker-compose -f docker-compose-bigdata.yml ps | grep -q "spark-master.*Up"; then
    test_passed "Spark Master est running"
else
    test_failed "Spark Master n'est pas running"
fi

# ============================================================================
# TEST 2: Connectivité PostgreSQL
# ============================================================================

echo -e "\n${BLUE}[TEST 2]${NC} Vérification de PostgreSQL..."

if docker-compose -f docker-compose-bigdata.yml exec -T postgres pg_isready -U liontrack -d liontrack_warehouse &>/dev/null; then
    test_passed "Connexion à PostgreSQL réussie"
else
    test_failed "Impossible de se connecter à PostgreSQL"
fi

# Vérifier les tables
TABLE_COUNT=$(docker-compose -f docker-compose-bigdata.yml exec -T postgres psql -U liontrack -d liontrack_warehouse -tc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema IN ('bronze', 'silver', 'gold');" 2>/dev/null || echo "0")

if [ "$TABLE_COUNT" -gt 10 ]; then
    test_passed "Tables créées dans les schémas (count: $TABLE_COUNT)"
else
    test_failed "Tables manquantes ou schémas vides"
fi

# ============================================================================
# TEST 3: Kafka Topics
# ============================================================================

echo -e "\n${BLUE}[TEST 3]${NC} Vérification des topics Kafka..."

KAFKA_TOPICS=$(docker-compose -f docker-compose-bigdata.yml exec -T kafka kafka-topics --list --bootstrap-server localhost:9092 2>/dev/null | grep -E "lions|users|challenges|data" | wc -l)

if [ "$KAFKA_TOPICS" -ge 4 ]; then
    test_passed "Topics Kafka créés (count: $KAFKA_TOPICS)"
else
    test_failed "Topics Kafka manquants"
fi

# ============================================================================
# TEST 4: APIs
# ============================================================================

echo -e "\n${BLUE}[TEST 4]${NC} Vérification des APIs..."

if curl -s http://localhost:4001/api/health | grep -q "ok"; then
    test_passed "API Health endpoint répond"
else
    test_failed "API Health endpoint ne répond pas"
fi

# ============================================================================
# TEST 5: Data Quality Tests
# ============================================================================

echo -e "\n${BLUE}[TEST 5]${NC} Tests de qualité des données..."

# Insérer des données de test
docker-compose -f docker-compose-bigdata.yml exec -T postgres psql -U liontrack -d liontrack_warehouse << EOF
INSERT INTO bronze.lions_raw (lion_id, name, position_lat, position_lng, last_update, source_system, partition_date)
VALUES ('test_lion_1', 'Test Lion', -3.36, 29.81, NOW(), 'test', CURRENT_DATE)
ON CONFLICT DO NOTHING;

INSERT INTO silver.lions (lion_id, name, position_lat, position_lng, status, data_quality_score)
VALUES ('test_lion_1', 'Test Lion', -3.36, 29.81, 'active', 1.0)
ON CONFLICT DO NOTHING;
EOF

# Vérifier les données test
if docker-compose -f docker-compose-bigdata.yml exec -T postgres psql -U liontrack -d liontrack_warehouse -tc "SELECT COUNT(*) FROM silver.lions WHERE lion_id = 'test_lion_1';" 2>/dev/null | grep -q "1"; then
    test_passed "Données test insérées avec succès"
else
    test_failed "Impossible d'insérer les données test"
fi

# ============================================================================
# TEST 6: Analyitcs APIs
# ============================================================================

echo -e "\n${BLUE}[TEST 6]${NC} Vérification des APIs analytiques..."

if curl -s http://localhost:4001/api/analytics/dashboard | grep -q "lions"; then
    test_passed "Dashboard analytics répond"
else
    test_failed "Dashboard analytics ne répond pas"
fi

# ============================================================================
# RÉSUMÉ
# ============================================================================

echo -e "\n${YELLOW}════════════════════════════════════════════════════════════════${NC}"
echo -e "Résumé des tests:"
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"
echo -e "${YELLOW}════════════════════════════════════════════════════════════════${NC}\n"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 Tous les tests sont passés !${NC}\n"
    exit 0
else
    echo -e "${RED}⚠️  Certains tests ont échoué, veuillez vérifier l'installation${NC}\n"
    exit 1
fi
