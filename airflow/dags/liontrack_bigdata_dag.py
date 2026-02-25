"""
DAG Airflow - Pipeline BigData LionTrack (Orchestration)
Intègre Kafka + Spark + PostgreSQL
Auteur: LionTrack Dev Team
Version: 3.0.0 (BigData Enhanced)
"""

from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.bash import BashOperator
from airflow.providers.apache.spark.operators.spark_submit import SparkSubmitOperator
from airflow.providers.http.operators.http import SimpleHttpOperator
from airflow.models import Variable
import logging
import subprocess
import psycopg2
from psycopg2.extras import execute_values

logger = logging.getLogger(__name__)

# ============================================================================
# CONFIGURATION
# ============================================================================

default_args = {
    'owner': 'liontrack',
    'retries': 2,
    'retry_delay': timedelta(minutes=5),
    'start_date': datetime(2026, 1, 28),
    'email_on_failure': False,
    'email_on_retry': False,
    'catchup': False,
}

dag = DAG(
    'liontrack_bigdata_pipeline',
    default_args=default_args,
    description='🦁 Pipeline BigData complet - Ingestion Kafka + Spark + Analytics',
    schedule_interval='0 2 * * *',  # Quotidienne à 2h du matin
    tags=['liontrack', 'bigdata', 'kappa-architecture'],
    max_active_runs=1,
)

# Variables Airflow
SPARK_MASTER = Variable.get("spark_master", default_var="spark://spark-master:7077")
KAFKA_SERVERS = Variable.get("kafka_servers", default_var="kafka:9092")
PG_DATABASE = "liontrack_warehouse"
PG_USER = "liontrack"
PG_PASSWORD = "liontrack_secure_pass"
PG_HOST = "postgres"
PG_PORT = 5432

# ============================================================================
# SECTION 1 : SANTÉ DES INFRASTRUCTURES
# ============================================================================

def check_kafka_health():
    """Vérifie que Kafka est accessible"""
    try:
        from kafka import KafkaConsumer
        
        logger.info("🔍 Checking Kafka health...")
        
        consumer = KafkaConsumer(
            bootstrap_servers=KAFKA_SERVERS,
            api_version=(2, 0, 0),
            request_timeout_ms=5000
        )
        
        topics = consumer.topics()
        logger.info(f"✅ Kafka healthy. Found {len(topics)} topics")
        
        consumer.close()
        return {'status': 'healthy', 'topic_count': len(topics)}
        
    except Exception as e:
        logger.error(f"❌ Kafka health check failed: {e}")
        raise

def check_postgres_health():
    """Vérifie PostgreSQL"""
    try:
        logger.info("🔍 Checking PostgreSQL health...")
        
        conn = psycopg2.connect(
            database=PG_DATABASE,
            user=PG_USER,
            password=PG_PASSWORD,
            host=PG_HOST,
            port=PG_PORT
        )
        
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM information_schema.tables;")
        table_count = cursor.fetchone()[0]
        cursor.close()
        conn.close()
        
        logger.info(f"✅ PostgreSQL healthy. Found {table_count} tables")
        return {'status': 'healthy', 'table_count': table_count}
        
    except Exception as e:
        logger.error(f"❌ PostgreSQL health check failed: {e}")
        raise

# ============================================================================
# SECTION 2 : VALIDATION DES DONNÉES
# ============================================================================

def check_data_quality(**context):
    """Valide la qualité des données en Bronze"""
    try:
        logger.info("📊 Starting data quality checks...")
        
        conn = psycopg2.connect(
            database=PG_DATABASE,
            user=PG_USER,
            password=PG_PASSWORD,
            host=PG_HOST,
            port=PG_PORT
        )
        
        cursor = conn.cursor()
        
        # Check pour les lions
        cursor.execute("SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE position_lat IS NOT NULL) as valid FROM bronze.lions_raw WHERE DATE(ingestion_timestamp) = CURRENT_DATE;")
        lions_result = cursor.fetchone()
        
        # Check pour les poids
        cursor.execute("SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE weight > 0) as valid FROM bronze.weights_raw WHERE DATE(ingestion_timestamp) = CURRENT_DATE;")
        weights_result = cursor.fetchone()
        
        logger.info(f"Lions: {lions_result[1]}/{lions_result[0]} valid")
        logger.info(f"Weights: {weights_result[1]}/{weights_result[0]} valid")
        
        # Insérer les résultats dans la table de qualité
        if lions_result[0] > 0:
            quality_score = (lions_result[1] / lions_result[0]) * 100
            cursor.execute("""
                INSERT INTO metadata.data_quality_checks 
                (check_name, table_name, total_records, valid_records, invalid_records, quality_percentage, details)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (
                'position_validation',
                'bronze.lions_raw',
                lions_result[0],
                lions_result[1],
                lions_result[0] - lions_result[1],
                quality_score,
                f'{{"check_date": "{datetime.now()}"}}'
            ))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        logger.info("✅ Data quality checks completed")
        
    except Exception as e:
        logger.error(f"Error in data quality check: {e}")
        raise

# ============================================================================
# SECTION 3 : PIPELINES SPARK
# ============================================================================

# Tâche 3.1 - Processing Batch
spark_batch_task = SparkSubmitOperator(
    task_id='spark_batch_processing',
    application='/opt/spark-apps/batch_processor.py',
    conf={
        'spark.master': SPARK_MASTER,
        'spark.app.name': 'liontrack-batch-dag',
    },
    application_args=[],
    verbose=True,
    dag=dag,
)

# ============================================================================
# SECTION 4 : AGRÉGATION GOLD
# ============================================================================

def create_gold_views(**context):
    """Refreshe les vues matérialisées Gold"""
    try:
        logger.info("🏅 Refreshing Gold views...")
        
        conn = psycopg2.connect(
            database=PG_DATABASE,
            user=PG_USER,
            password=PG_PASSWORD,
            host=PG_HOST,
            port=PG_PORT
        )
        
        cursor = conn.cursor()
        
        # Refresh les vues matérialisées
        cursor.execute("REFRESH MATERIALIZED VIEW CONCURRENTLY analytics.lions_current_status;")
        cursor.execute("REFRESH MATERIALIZED VIEW CONCURRENTLY analytics.user_engagement_summary;")
        
        conn.commit()
        cursor.close()
        conn.close()
        
        logger.info("✅ Gold views refreshed")
        
    except Exception as e:
        logger.error(f"Error refreshing Gold views: {e}")
        raise

# ============================================================================
# SECTION 5 : NOTIFICATION & REPORTING
# ============================================================================

def generate_pipeline_report(**context):
    """Génère un rapport du pipeline"""
    try:
        logger.info("📈 Generating pipeline report...")
        
        conn = psycopg2.connect(
            database=PG_DATABASE,
            user=PG_USER,
            password=PG_PASSWORD,
            host=PG_HOST,
            port=PG_PORT
        )
        
        cursor = conn.cursor()
        
        # Stats
        cursor.execute("SELECT COUNT(*) FROM silver.lions;")
        lions_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM silver.weight_history;")
        weights_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM silver.challenges;")
        challenges_count = cursor.fetchone()[0]
        
        report = {
            'date': datetime.now().isoformat(),
            'lions': lions_count,
            'weight_records': weights_count,
            'challenges': challenges_count,
            'status': 'success'
        }
        
        logger.info(f"Pipeline Report: {report}")
        
        cursor.close()
        conn.close()
        
        return report
        
    except Exception as e:
        logger.error(f"Error generating report: {e}")
        raise

# ============================================================================
# SECTION 6 : TASK DEFINITIONS
# ============================================================================

# Santé
check_kafka = PythonOperator(
    task_id='check_kafka_health',
    python_callable=check_kafka_health,
    dag=dag,
)

check_postgres = PythonOperator(
    task_id='check_postgres_health',
    python_callable=check_postgres_health,
    dag=dag,
)

# Qualité
data_quality = PythonOperator(
    task_id='data_quality_checks',
    python_callable=check_data_quality,
    provide_context=True,
    dag=dag,
)

# Gold Refresh
refresh_gold = PythonOperator(
    task_id='refresh_gold_views',
    python_callable=create_gold_views,
    provide_context=True,
    dag=dag,
)

# Report
report = PythonOperator(
    task_id='generate_report',
    python_callable=generate_pipeline_report,
    provide_context=True,
    dag=dag,
)

# ============================================================================
# SECTION 7 : DAG DEPENDENCIES
# ============================================================================

[check_kafka, check_postgres] >> data_quality >> spark_batch_task >> refresh_gold >> report
