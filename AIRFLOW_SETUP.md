# 🦁 Guide d'installation Apache Airflow pour LionTrack

## 📋 Table des matières
1. [Prérequis](#prérequis)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Démarrage](#démarrage)
5. [Utilisation](#utilisation)
6. [Monitoring](#monitoring)
7. [Dépannage](#dépannage)

---

## 🔧 Prérequis

### Option 1 : Docker (Recommandé)
```bash
# Vérifier les versions
docker --version
docker-compose --version
```

### Option 2 : Installation locale
```bash
# Versions requises
- Python 3.8+
- PostgreSQL 12+
- Redis 5+
```

---

## 🚀 Installation

### 1. Préparation des fichiers d'environnement

Créez un fichier `.env.airflow` à la racine du projet :

```bash
# .env.airflow
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/defisDB
JWT_SECRET=votre_secret_jwt
LIONTRACK_API_URL=https://votre-domaine.com
AIRFLOW_API_TOKEN=token_secret_airflow
AIRFLOW_BASE_URL=https://airflow.votre-domaine.com

# Configuration email (pour les digests)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SENDER_EMAIL=your-email@gmail.com
SENDER_PASSWORD=your-app-password

# Configuration de déploiement
GIT_REPO=https://github.com/votre-username/Projet_LionTrack.git
APP_DIR=/app/liontrack
```

### 2. Avec Docker Compose (Recommandé)

```bash
# 1. Charger les variables d'environnement
source .env.airflow

# 2. Lancer les services
docker-compose -f docker-compose-airflow.yml up -d

# 3. Initialiser Airflow (première fois seulement)
docker-compose -f docker-compose-airflow.yml exec airflow-webserver \
  airflow db init

# 4. Créer un utilisateur admin
docker-compose -f docker-compose-airflow.yml exec airflow-webserver \
  airflow users create \
  --username admin \
  --firstname Admin \
  --lastname LionTrack \
  --role Admin \
  --email admin@liontrack.com \
  --password admin123
```

### 3. Installation locale (sans Docker)

```bash
# 1. Créer un environnement virtuel
python3 -m venv airflow_env
source airflow_env/bin/activate

# 2. Installer Airflow
export AIRFLOW_HOME=$(pwd)/airflow
pip install -r airflow/requirements.txt

# 3. Initialiser la base de données
airflow db init

# 4. Créer un utilisateur admin
airflow users create \
  --username admin \
  --firstname Admin \
  --lastname LionTrack \
  --role Admin \
  --email admin@liontrack.com \
  --password admin123

# 5. Copier la configuration
cp airflow/airflow.cfg $AIRFLOW_HOME/

# 6. Démarrer le scheduler (Terminal 1)
airflow scheduler

# 7. Démarrer le webserver (Terminal 2)
airflow webserver --port 8080
```

---

## ⚙️ Configuration

### Configuration Airflow complète

Le fichier `airflow/airflow.cfg` contient :
- ✅ Configuration PostgreSQL
- ✅ Paramètres SMTP pour emails
- ✅ Timeouts et limites
- ✅ Logging configuré
- ✅ Authentification RBAC

### Variables Airflow

Créez les variables dans Airflow :

**Via Docker :**
```bash
docker-compose -f docker-compose-airflow.yml exec airflow-webserver \
  airflow variables set LIONTRACK_API_URL "https://votre-domaine.com"

docker-compose -f docker-compose-airflow.yml exec airflow-webserver \
  airflow variables set MONGODB_URI "mongodb+srv://..."

docker-compose -f docker-compose-airflow.yml exec airflow-webserver \
  airflow variables set BACKUP_RETENTION_DAYS "7"
```

**Via l'interface web :**
1. Aller sur http://localhost:8080/
2. Menu → Admin → Variables
3. Créer les variables nécessaires

---

## 🏃 Démarrage

### Vérifier l'accès

- **Webserver :** http://localhost:8080
- **Utilisateur :** admin
- **Mot de passe :** admin123

### Vérifier que tout fonctionne

```bash
# Vérifier l'état des services
docker-compose -f docker-compose-airflow.yml ps

# Voir les logs du scheduler
docker-compose -f docker-compose-airflow.yml logs -f airflow-scheduler

# Voir les logs du webserver
docker-compose -f docker-compose-airflow.yml logs -f airflow-webserver
```

### DAG LionTrack

Le DAG `liontrack_daily_operations` :
- ⏰ S'exécute quotidiennement à 2h du matin
- ✅ Vérifie la santé de l'API et DB
- 🧹 Nettoie les données anciennes
- 💾 Effectue des sauvegardes
- 📊 Génère les statistiques
- 🏆 Crée les classements
- 📧 Envoie les digests par email
- 🔄 Vérifie les mises à jour disponibles

---

## 📊 Utilisation

### Déclencher manuellement un DAG

**Via l'API REST :**
```bash
curl -X POST http://localhost:8080/api/v1/dags/liontrack_daily_operations/dagRuns \
  -H "Content-Type: application/json" \
  -u admin:admin123 \
  -d '{"execution_date": "2026-01-28T12:00:00Z"}'
```

**Via la CLI :**
```bash
# Dans Docker
docker-compose -f docker-compose-airflow.yml exec airflow-scheduler \
  airflow dags test liontrack_daily_operations 2026-01-28

# Localement
airflow dags test liontrack_daily_operations 2026-01-28
```

### Afficher les exécutions

```bash
# Lister les DAG runs
airflow dags list-runs --dag-id liontrack_daily_operations

# Afficher les tâches d'un DAG run
airflow tasks list-runs --dag-id liontrack_daily_operations
```

### Logs des tâches

**Via l'interface :** http://localhost:8080/home

**Via CLI :**
```bash
airflow tasks logs liontrack_daily_operations check_api_health 2026-01-28
```

---

## 🔍 Monitoring

### Tableaux de bord Airflow

1. **Home** : Vue d'ensemble des DAGs
2. **DAGs** : Liste et état des DAGs
3. **Logs** : Logs détaillés par tâche
4. **Admin** : Configuration et maintenance

### Intégration avec Prometheus/Grafana (Optionnel)

```bash
# Installer les packages
pip install airflow-prometheus-exporter

# Configurer dans airflow.cfg
[metrics]
enabled = True
statsd_on = True
statsd_host = localhost
statsd_port = 8125
```

### Health Check

```bash
# Vérifier la santé d'Airflow
curl http://localhost:8080/health
```

---

## 🐛 Dépannage

### Problème : Le DAG ne s'affiche pas

```bash
# Vérifier la syntaxe Python
python -m py_compile airflow/dags/liontrack_dag.py

# Redémarrer le scheduler
docker-compose -f docker-compose-airflow.yml restart airflow-scheduler
```

### Problème : Les tâches ne s'exécutent pas

```bash
# Vérifier l'état du scheduler
docker-compose -f docker-compose-airflow.yml logs airflow-scheduler

# Vérifier les permissions
docker-compose -f docker-compose-airflow.yml exec airflow-scheduler \
  airflow dags list
```

### Problème : Erreur de connexion MongoDB

```bash
# Vérifier la variable MONGODB_URI
docker-compose -f docker-compose-airflow.yml exec airflow-scheduler \
  airflow variables get MONGODB_URI

# Tester la connexion
docker-compose -f docker-compose-airflow.yml exec airflow-scheduler \
  python -c "import pymongo; print(pymongo.MongoClient('YOUR_URI').admin.command('ping'))"
```

### Problème : Les emails ne sont pas envoyés

1. Vérifier les variables SMTP
2. Cocher "Email on failure" dans les DAG
3. Voir les logs pour les erreurs SMTP
4. Gmail : utiliser un mot de passe d'application (pas le mot de passe du compte)

### Logs de débogage

```bash
# Voir tous les logs
docker-compose -f docker-compose-airflow.yml logs -f

# Logs spécifiques au service
docker-compose -f docker-compose-airflow.yml logs airflow-scheduler
docker-compose -f docker-compose-airflow.yml logs airflow-webserver
docker-compose -f docker-compose-airflow.yml logs postgres
```

---

## 📚 Structure des fichiers

```
Projet_LionTrack/
├── airflow/
│   ├── dags/
│   │   └── liontrack_dag.py          # ← DAG principal
│   ├── plugins/                      # Plugins personnalisés
│   ├── logs/                         # Logs Airflow
│   ├── airflow.cfg                   # Configuration
│   └── requirements.txt              # Dépendances Python
├── docker-compose-airflow.yml        # Configuration Docker
└── .env.airflow                      # Variables d'environnement
```

---

## 🔒 Sécurité

### Production

```bash
# 1. Changer le mot de passe admin
docker-compose -f docker-compose-airflow.yml exec airflow-webserver \
  airflow users delete --username admin
docker-compose -f docker-compose-airflow.yml exec airflow-webserver \
  airflow users create --username admin ...

# 2. Configurer HTTPS
# Utiliser un reverse proxy (Nginx, Apache)

# 3. Restrict Airflow UI
# Configuration dans airflow.cfg : [webserver] > expose_config = False

# 4. Chiffrer les secrets
export FERNET_KEY=$(python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())")
# Ajouter dans airflow/airflow.cfg : fernet_key = $FERNET_KEY
```

---

## 📞 Support

### Documentation officielle
- https://airflow.apache.org/docs/
- https://airflow.apache.org/docs/apache-airflow/stable/

### Ressources LionTrack
- Guide PWA : [PWA_GUIDE.md](PWA_GUIDE.md)
- Guide App Stores : [APP_STORES_GUIDE.md](APP_STORES_GUIDE.md)
- Changelog : [CHANGELOG.md](CHANGELOG.md)

---

**Prêt à lancer ? Lancez la commande :**

```bash
docker-compose -f docker-compose-airflow.yml up -d
```

Puis visitez : **http://localhost:8080** 🚀
