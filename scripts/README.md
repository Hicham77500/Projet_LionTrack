# Scripts Directory

Ce dossier contient tous les scripts shell du projet, organisés par catégorie.

## Structure

### 📊 airflow/
Scripts pour la gestion d'Apache Airflow :
- `start-airflow.sh` - Démarre les services Airflow
- `stop-airflow.sh` - Arrête les services Airflow
- `airflow-dashboard.sh` - Ouvre le dashboard Airflow
- `view-logs.sh` - Affiche les logs Airflow

### 🚀 deployment/
Scripts de déploiement :
- `deploy.sh` - Script de déploiement de l'application

## Utilisation

Pour exécuter un script depuis la racine du projet :
```bash
# Exemple : démarrer Airflow
./scripts/airflow/start-airflow.sh

# Exemple : déployer l'application
./scripts/deployment/deploy.sh
```

## Note

Le script `generate-icons.sh` reste dans `public/images/` car il est spécifique à la génération des icônes de l'application.
