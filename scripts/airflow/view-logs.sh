#!/bin/bash

# ============================================================================
# Script pour visualiser les logs Airflow en temps réel
# Usage: ./view-logs.sh [service]
# Services: airflow-webserver, airflow-scheduler, airflow-worker, postgres, redis
# ============================================================================

SERVICE=${1:-airflow-webserver}

echo "🔍 Affichage des logs de: $SERVICE"
echo "Appuyez sur Ctrl+C pour arrêter"
echo ""

docker-compose -f docker-compose-airflow.yml logs -f "$SERVICE"
