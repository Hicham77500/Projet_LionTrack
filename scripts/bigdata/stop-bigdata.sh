#!/bin/bash

# Arrêter l'infrastructure BigData proprement

echo "🛑 Arrêt de l'infrastructure BigData..."

# Arrêter les services Docker
docker-compose -f docker-compose-bigdata.yml down

# Nettoyer les volumes (optionnel, décommenter si désiré)
# docker-compose -f docker-compose-bigdata.yml down -v

echo "✅ Infrastructure arrêtée"
