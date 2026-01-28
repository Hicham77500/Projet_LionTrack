#!/bin/bash

# Script de déploiement pour Azure App Service

# Étape 1: Navigation vers le répertoire de déploiement
cd $DEPLOYMENT_TARGET

# Étape 2: Installation des dépendances
echo "Installation des dépendances Node.js..."
npm install --production

# Étape 3: Vérification de l'installation
if [ $? -ne 0 ]; then
  echo "Erreur lors de l'installation des dépendances"
  exit 1
fi

echo "Déploiement terminé avec succès!"
