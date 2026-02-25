# 🦁 LionTrack - Architecture BigData Kappa

## Vue d'ensemble

LionTrack a été modernisé avec une **Architecture Kappa** complète pour gérer les données de tracking des lions à grande échelle. Cette architecture combine le streaming temps réel avec l'analytique batch dans une pipeline unifiée.

```
┌─────────────────────────────────────────────────────────────────────┐
│                     SOURCES DE DONNÉES                              │
│  (MongoDB - Lions, Users, Challenges, Weights)                      │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │    KAFKA TOPICS               │
         │  ▪ lions.position.events      │
         │  ▪ lions.weight.events        │
         │  ▪ users.activity.events      │
         │  ▪ challenges.status.events   │
         │  ▪ data.quality.events        │
         └───────────┬───────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
    ┌────────────┐          ┌────────────┐
    │   SPARK    │          │   SPARK    │
    │  STREAMING │          │   BATCH    │
    │(Real-time) │          │(Scheduled) │
    └─────┬──────┘          └─────┬──────┘
          │                       │
          └───────────┬───────────┘
                      ▼
        ┌─────────────────────────────┐
        │   DATA LAKE (PARQUET)       │
        │  ▪ Bronze (Raw)             │
        │  ▪ Silver (Cleansed)        │
        │  ▪ Gold (Business Metrics)  │
        └──────────┬──────────────────┘
                   │
      ┌────────────┴────────────┐
      │                         │
      ▼                         ▼
  ┌─────────────┐       ┌──────────────┐
  │PostgreSQL   │       │Analytics API │
  │ Warehouse   │       │(JSON/CSV)    │
  └─────────────┘       └──────────────┘
      │                         │
      └────────────┬────────────┘
                   ▼
        ┌─────────────────────────┐
        │   DASHBOARDS            │
        │  ▪ Grafana              │
        │  ▪ PWA Frontend         │
        │  ▪ Kibana (optionnel)   │
        └─────────────────────────┘
```

---

## 🏗️ Composants Infrastructure

### 1. **Kafka (Message Streaming)**
- **Service**: `kafka:9092`
- **Topics**:
  - `lions.position.events` - Positions GPS des lions
  - `lions.weight.events` - Mesures de poids
  - `users.activity.events` - Activités utilisateur
  - `challenges.status.events` - Changements de challenge
  - `data.quality.events` - Rapports de qualité

### 2. **Spark (Distributed Computing)**
- **Master**: `spark://spark-master:7077`
- **Workers**: 2 workers (2GB RAM, 2 cores chacun)
- **Jobs**:
  - Batch: Traitement quotidien (Bronze → Silver → Gold)
  - Streaming: Traitement temps réel des événements

### 3. **PostgreSQL (Data Warehouse)**
- **Service**: `postgres:5432`
- **Database**: `liontrack_warehouse`
- **Schémas**:
  - `bronze.*` - Données brutes du Kafka
  - `silver.*` - Données nettoyées et validées
  - `gold.*` - Métriques métier et agrégations
  - `metadata.*` - Data lineage et qualité

### 4. **MinIO (Object Storage)**
- **Service**: `minio:9000`
- **Console**: `minio:9001`
- **Usage**: Stockage distribué pour les données Parquet

### 5. **Monitoring Stack**
- **Prometheus**: `prometheus:9090` (métriques)
- **Grafana**: `grafana:3000` (dashboards)

---

## 📊 Modèle Données

### Bronze Layer (Raw Data)
```sql
bronze.lions_raw
├── lion_id (PK)
├── name
├── position_lat, position_lng
├── last_update
├── metadata (JSONB)
└── partition_date

bronze.weights_raw
├── weight_id (PK)
├── lion_id (FK)
├── weight, unit
├── measured_at
└── metadata (JSONB)

bronze.challenges_raw
├── challenge_id (PK)
├── user_id (FK)
├── title, status
└── metadata (JSONB)
```

### Silver Layer (Cleaned & Validated)
```sql
silver.lions
├── lion_id (PK)
├── name
├── position_lat, position_lng
├── status
├── data_quality_score
└── dw_update_date

silver.weight_history
├── lion_id (FK)
├── weight, unit
└── measured_at

silver.challenges
├── challenge_id (PK)
├── user_id (FK)
├── title, status
└── updated_at
```

### Gold Layer (Business Metrics)
```sql
gold.lions_metrics
├── lion_id, metric_date (PK)
├── avg_weight
├── weight_trend
├── health_score (0-100)
└── tracking_frequency

gold.users_activity
├── user_id, activity_date (PK)
├── challenges_completed
├── weight_entries
└── engagement_score

gold.lions_positions_history
├── lion_id, position_date (PK)
├── lat, lng
└── accuracy
```

---

## 🚀 Démarrage de l'infrastructure

### 1. Démarrer Docker Compose

```bash
# Démarrer tous les services
docker-compose -f docker-compose-bigdata.yml up -d

# Vérifier le statut
docker-compose -f docker-compose-bigdata.yml ps

# Voir les logs
docker-compose -f docker-compose-bigdata.yml logs -f kafka
```

### 2. Initialiser la base de données

```bash
# La BD PostgreSQL se crée automatiquement via le script init.sql

# Vérifier la création
docker exec postgres-container psql -U liontrack -d liontrack_warehouse -c "\dt+"
```

### 3. Démarrer les consommateurs Kafka

```bash
# Installation des dépendances
pip install -r bigdata/requirements.txt

# Démarrer les consommateurs
python bigdata/kafka/consumer.py
```

### 4. Démarrer les pipelines Spark

```bash
# Batch processing (via Airflow)
# Les DAGs se lancent automatiquement à 2h du matin

# Streaming (à la demande)
python bigdata/spark/streaming_processor.py
```

---

## 📡 Producteurs de Données

### Dans MongoDB → Kafka

Quand un changement survient en MongoDB, on envoie l'événement vers Kafka :

```javascript
// services/weight/weight.controller.js
const producer = new LionTrackKafkaProducer();

exports.addWeight = async (req, res) => {
  const weight = new Weight(req.body);
  await weight.save();
  
  // Envoyer vers Kafka
  await producer.publishWeight(weight);
  
  res.json({success: true, data: weight});
};
```

### Topics Kafka et Consommateurs

| Topic | Producteur | Consommateur | Destination |
|-------|-----------|--------------|-------------|
| `lions.position.events` | Node.js | Consumer Python | bronze.lions_raw |
| `lions.weight.events` | Node.js | Spark Streaming | bronze.weights_raw |
| `users.activity.events` | Node.js | Spark Streaming | bronze.users_raw |
| `data.quality.events` | Monitor | Metadata | metadata.data_quality_checks |

---

## 🔄 Pipelines ETL

### Pipeline Batch (Quotidien - 2h du matin)

1. **Airflow DAG**: `liontrack_bigdata_pipeline`
2. **Étapes**:
   - ✅ Santé Kafka & PostgreSQL
   - ✅ Validation qualité Bronze
   - ✅ Spark Job: Bronze → Silver (nettoyage, validation)
   - ✅ Spark Job: Silver → Gold (agrégations métier)
   - ✅ Refresh vues matérialisées
   - ✅ Génération rapport

### Pipeline Streaming (Continu)

1. **Spark Streaming Jobs**
   - Lions position: Fenêtrage 5 min
   - Weight: Streaming vers Parquet
   - User activity: Fenêtrage temps réel

---

## 📈 APIs Analytiques

### Endpoints Disponibles

```bash
# Lions Analytics
GET /api/analytics/lions                          # Tous les lions
GET /api/analytics/lions/{lionId}                 # Détails lion
GET /api/analytics/lions/{lionId}/weight-trend    # Tendance poids
GET /api/analytics/lions/{lionId}/position-history # Historique position

# Users Analytics
GET /api/analytics/users/{userId}/engagement      # Score engagement
GET /api/analytics/users/{userId}/activity-summary # 30 derniers jours
GET /api/analytics/users/{userId}/challenges-analytics # Challenges

# Global
GET /api/analytics/dashboard                      # Vue complète
GET /api/analytics/leaderboard/users              # Classement users
GET /api/analytics/leaderboard/lions              # Classement lions
GET /api/analytics/trends/weight                  # Tendances poids

# Export
GET /api/analytics/export/csv?table=silver.lions  # Export CSV
GET /api/analytics/export/json?table=silver.lions # Export JSON
```

### Exemple Requête

```bash
curl http://localhost:4001/api/analytics/lions \
  -H "Content-Type: application/json"

# Réponse:
{
  "count": 5,
  "lions": [
    {
      "lion_id": "simba_001",
      "name": "Simba",
      "status": "active",
      "current_weight": 195.5,
      "health_score": 85.2,
      "tracking_frequency": 12,
      "position_lat": -3.3652,
      "position_lng": 29.8185
    }
  ]
}
```

---

## 🔍 Monitoring & Observabilité

### Prometheus Métriques

Les métriques suivantes sont collectées :

```
liontrack_pipeline_runs_total{pipeline_name="batch_processor", status="success"}
liontrack_data_quality_score{table_name="bronze.lions_raw"} 95.2
liontrack_pipeline_duration_seconds_bucket{pipeline_name="batch_processor", le="300"}
liontrack_table_records{table_name="silver.lions", layer="silver"} 42
```

### Dashboards Grafana

1. **Pipeline Health**: Taux succès, durée exécution
2. **Data Quality**: Scores par table, tendances
3. **System Health**: CPU, mémoire, disque
4. **Kafka Metrics**: Lag consommateurs, throughput

### Data Quality Checks

```
metadata.data_quality_checks
├── check_name (bronze_validation, schema_check)
├── table_name (bronze.lions_raw)
├── quality_percentage (95.2%)
└── details (JSONB)
```

---

## 🚨 Alertes Principales

| Alerte | Seuil | Action |
|--------|--------|--------|
| Kafka Down | - | 🔴 Critical - restart broker |
| PostgreSQL Connections | > 80 | 🟡 Warning - investigate |
| Data Quality | < 80% | 🟡 Warning - review data |
| Pipeline Failed | status = failed | 🔴 Critical - check logs |
| High Consumer Lag | > 10k messages | 🟡 Warning - scale consumers |

---

## 🔧 Configuration

### Variables d'Environnement

```bash
# .env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
NODE_ENV=production

# BigData
PG_DATABASE=liontrack_warehouse
PG_USER=liontrack
PG_PASSWORD=liontrack_secure_pass
PG_HOST=postgres
PG_PORT=5432

KAFKA_BROKERS=kafka:9092
SPARK_MASTER=spark://spark-master:7077
```

### Airflow Variables

```bash
spark_master = spark://spark-master:7077
kafka_servers = kafka:9092
postgres_database = liontrack_warehouse
```

---

## 📝 Cas d'Utilisation & Requêtes

### 1. Santé globale des lions (quotidien)

```sql
SELECT 
  COUNT(*) FILTER (WHERE health_score > 80) as excellent,
  COUNT(*) FILTER (WHERE health_score BETWEEN 60 AND 80) as good,
  AVG(health_score) as avg_health,
  CURRENT_DATE as report_date
FROM gold.lions_metrics
WHERE metric_date = CURRENT_DATE;
```

### 2. Utilisateurs engagés ce mois-ci

```sql
SELECT 
  u.username,
  SUM(a.challenges_completed) as challenges_done,
  AVG(a.engagement_score) as avg_engagement
FROM silver.users u
JOIN gold.users_activity a ON u.user_id = a.user_id
WHERE a.activity_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY u.username
ORDER BY avg_engagement DESC;
```

### 3. Anomalies de poids (lions suspects)

```sql
SELECT 
  l.lion_id,
  l.name,
  m.avg_weight,
  m.weight_trend,
  m.health_score
FROM silver.lions l
JOIN gold.lions_metrics m ON l.lion_id = m.lion_id
WHERE m.metric_date = CURRENT_DATE
  AND m.health_score < 60;
```

---

## 🛣️ Roadmap

- [ ] ML Models pour détection anomalies
- [ ] Data Catalog (Atlas)
- [ ] Elasticsearch pour recherche avancée
- [ ] Streaming mode avec Flink
- [ ] Dbt pour transformation déclarative
- [ ] Great Expectations pour data validation
- [ ] Dremio pour requêtes distribuées

---

## 📚 Ressources

- [Architecture Kappa](https://milinda.pathirage.org/kappa-architecture.html)
- [Spark Documentation](https://spark.apache.org/docs/latest/)
- [Kafka Best Practices](https://kafka.apache.org/documentation/)
- [PostgreSQL Data Warehouse](https://postgresql.org/)

---

**Dernière mise à jour**: 2026-02-25  
**Version**: 3.0.0 (BigData Enhanced)  
**Auteur**: LionTrack Dev Team
