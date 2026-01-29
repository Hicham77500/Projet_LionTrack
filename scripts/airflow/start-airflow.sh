#!/bin/bash

# ============================================================================
# Script de lancement complet d'Airflow pour LionTrack
# Usage: ./start-airflow.sh
# ============================================================================

set -e  # Exit on error

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonctions utilitaires
print_header() {
    echo -e "\n${BLUE}════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}🦁 $1${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# ============================================================================
# VÉRIFICATIONS PRÉALABLES
# ============================================================================

print_header "Vérification des prérequis"

# Vérifier Docker
if ! command -v docker &> /dev/null; then
    print_error "Docker n'est pas installé"
    echo "Installez Docker depuis: https://www.docker.com/products/docker-desktop"
    exit 1
fi
print_success "Docker est installé: $(docker --version)"

# Vérifier Docker Compose
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose n'est pas installé"
    echo "Installez Docker Compose depuis: https://docs.docker.com/compose/install/"
    exit 1
fi
print_success "Docker Compose est installé: $(docker-compose --version)"

# Vérifier le fichier .env.airflow
if [ ! -f ".env.airflow" ]; then
    print_error "Le fichier .env.airflow n'existe pas"
    echo "Créant une copie depuis .env.airflow.example..."
    cp .env.airflow.example .env.airflow
    print_warning "Veuillez éditer .env.airflow avec vos paramètres réels"
    print_warning "Commande: nano .env.airflow"
    exit 1
fi
print_success "Fichier .env.airflow trouvé"

# Vérifier les fichiers nécessaires
required_files=(
    "docker-compose-airflow.yml"
    "airflow/dags/liontrack_dag.py"
    "airflow/airflow.cfg"
    "airflow/requirements.txt"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        print_error "Fichier manquant: $file"
        exit 1
    fi
done
print_success "Tous les fichiers nécessaires sont présents"

# ============================================================================
# PRÉPARATION
# ============================================================================

print_header "Préparation de l'environnement"

# Créer les répertoires de logs si nécessaire
mkdir -p airflow/logs
mkdir -p airflow/plugins
print_success "Répertoires créés"

# Charger les variables d'environnement (seulement les valeurs valides)
set -a
source .env.airflow
set +a
print_success "Variables d'environnement chargées"

# ============================================================================
# ARRÊT DES SERVICES EXISTANTS
# ============================================================================

print_header "Arrêt des services existants"

if [ "$(docker-compose -f docker-compose-airflow.yml ps -q)" ]; then
    print_warning "Services Airflow détectés, arrêt en cours..."
    docker-compose -f docker-compose-airflow.yml down --remove-orphans
    sleep 3
    print_success "Services arrêtés"
else
    print_warning "Aucun service en cours d'exécution"
fi

# ============================================================================
# DÉMARRAGE DES SERVICES
# ============================================================================

print_header "Démarrage d'Apache Airflow"

print_warning "Démarrage des services Docker..."
docker-compose -f docker-compose-airflow.yml up -d

print_warning "Attente du démarrage des services (30 secondes)..."
sleep 30

# Vérifier que les services sont en cours d'exécution
print_warning "Vérification de l'état des services..."

# Vérifier PostgreSQL
if docker-compose -f docker-compose-airflow.yml exec -T postgres pg_isready -U airflow &> /dev/null; then
    print_success "PostgreSQL est prêt"
else
    print_error "PostgreSQL ne répond pas"
    exit 1
fi

# Vérifier Redis
if docker-compose -f docker-compose-airflow.yml exec -T redis redis-cli ping &> /dev/null; then
    print_success "Redis est prêt"
else
    print_error "Redis ne répond pas"
    exit 1
fi

# ============================================================================
# INITIALISATION AIRFLOW
# ============================================================================

print_header "Initialisation d'Airflow"

print_warning "Initialisation de la base de données..."
docker-compose -f docker-compose-airflow.yml exec -T airflow-webserver airflow db init

print_success "Base de données initialisée"

# Vérifier si l'utilisateur admin existe
if docker-compose -f docker-compose-airflow.yml exec -T airflow-webserver airflow users list | grep -q admin; then
    print_warning "Utilisateur admin existe déjà"
else
    print_warning "Création de l'utilisateur admin..."
    docker-compose -f docker-compose-airflow.yml exec -T airflow-webserver airflow users create \
        --username admin \
        --firstname Admin \
        --lastname LionTrack \
        --role Admin \
        --email admin@liontrack.com \
        --password admin123
    print_success "Utilisateur admin créé"
fi

# ============================================================================
# AFFICHAGE DES INFORMATIONS
# ============================================================================

print_header "🎉 Airflow est prêt!"

echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}📊 ACCÈS AUX SERVICES${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}🌐 Airflow Web UI:${NC}"
echo -e "   URL: ${GREEN}http://localhost:8080${NC}"
echo -e "   Utilisateur: ${GREEN}admin${NC}"
echo -e "   Mot de passe: ${GREEN}admin123${NC}"
echo ""
echo -e "${BLUE}📊 PostgreSQL:${NC}"
echo -e "   Host: ${GREEN}localhost${NC}"
echo -e "   Port: ${GREEN}5432${NC}"
echo -e "   User: ${GREEN}airflow${NC}"
echo -e "   Password: ${GREEN}airflow${NC}"
echo ""
echo -e "${BLUE}🔴 Redis:${NC}"
echo -e "   Host: ${GREEN}localhost${NC}"
echo -e "   Port: ${GREEN}6379${NC}"
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}📋 COMMANDES UTILES${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}Voir les logs:${NC}"
echo -e "   docker-compose -f docker-compose-airflow.yml logs -f"
echo ""
echo -e "${BLUE}Voir l'état des services:${NC}"
echo -e "   docker-compose -f docker-compose-airflow.yml ps"
echo ""
echo -e "${BLUE}Arrêter Airflow:${NC}"
echo -e "   docker-compose -f docker-compose-airflow.yml down"
echo ""
echo -e "${BLUE}Afficher les DAGs:${NC}"
echo -e "   docker-compose -f docker-compose-airflow.yml exec airflow-scheduler airflow dags list"
echo ""
echo -e "${BLUE}Tester un DAG:${NC}"
echo -e "   docker-compose -f docker-compose-airflow.yml exec airflow-scheduler airflow dags test liontrack_daily_operations 2026-01-28"
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}DAG LionTrack${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}Nom du DAG:${NC} ${GREEN}liontrack_daily_operations${NC}"
echo -e "${BLUE}Horaire:${NC} ${GREEN}Quotidien à 2h du matin${NC}"
echo -e "${BLUE}Tâches:${NC}"
echo -e "  ✅ check_api_health"
echo -e "  ✅ check_database_health"
echo -e "  ✅ clean_old_sessions"
echo -e "  ✅ clean_old_logs"
echo -e "  ✅ backup_database"
echo -e "  ✅ generate_daily_statistics"
echo -e "  ✅ generate_user_rankings"
echo -e "  ✅ send_daily_digest"
echo -e "  ✅ check_updates_available"
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}⏭️  PROCHAINES ÉTAPES${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
echo ""
echo -e "1️⃣  Ouvrez votre navigateur sur ${GREEN}http://localhost:8080${NC}"
echo -e "2️⃣  Connectez-vous avec admin / admin123"
echo -e "3️⃣  Vérifiez que le DAG 'liontrack_daily_operations' est actif"
echo -e "4️⃣  Allez sur l'onglet 'Graph' pour voir les tâches"
echo -e "5️⃣  Cliquez sur 'Trigger DAG' pour tester immédiatement"
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
print_success "Configuration complète!"
echo ""
