"""
Service de Monitoring - Data Quality & Pipeline Health
Fournit des métriques pour Prometheus et des alertes
"""

import psycopg2
from prometheus_client import Counter, Gauge, Histogram, generate_latest, CollectorRegistry
from datetime import datetime, timedelta
import logging
import json
from typing import Dict, Any

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ========== PROMETHEUS METRICS ==========

registry = CollectorRegistry()

# Counters
pipeline_runs = Counter(
    'liontrack_pipeline_runs_total',
    'Total pipeline executions',
    ['pipeline_name', 'status'],
    registry=registry
)

records_processed = Counter(
    'liontrack_records_processed_total',
    'Total records processed',
    ['pipeline_name', 'table_name'],
    registry=registry
)

kafka_messages = Counter(
    'liontrack_kafka_messages_total',
    'Total Kafka messages consumed',
    ['topic'],
    registry=registry
)

# Gauges
data_quality_score = Gauge(
    'liontrack_data_quality_score',
    'Data quality percentage',
    ['table_name'],
    registry=registry
)

pipeline_status = Gauge(
    'liontrack_pipeline_status',
    'Pipeline status (1=success, 0=failed)',
    ['pipeline_name'],
    registry=registry
)

ingestion_latency = Gauge(
    'liontrack_ingestion_latency_seconds',
    'Data ingestion latency in seconds',
    ['source'],
    registry=registry
)

table_record_count = Gauge(
    'liontrack_table_records',
    'Number of records per table',
    ['table_name', 'layer'],
    registry=registry
)

# Histograms
pipeline_duration = Histogram(
    'liontrack_pipeline_duration_seconds',
    'Pipeline execution duration',
    ['pipeline_name'],
    buckets=(10, 30, 60, 300, 600, 1800),
    registry=registry
)


class DataQualityMonitor:
    """Monitor la qualité des données en temps réel"""
    
    def __init__(self, postgres_config: Dict[str, Any]):
        self.config = postgres_config
        self.conn = None
    
    def connect(self):
        """Connecte à PostgreSQL"""
        try:
            self.conn = psycopg2.connect(**self.config)
            logger.info("✅ Connected to PostgreSQL for monitoring")
        except psycopg2.Error as e:
            logger.error(f"❌ Connection failed: {e}")
            raise
    
    def check_bronze_quality(self) -> Dict[str, Any]:
        """Vérifie la qualité des données en Bronze"""
        cursor = self.conn.cursor()
        
        try:
            # Vérifier les valeurs nulles et invalides
            cursor.execute("""
                SELECT 
                    'lions' as table_name,
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE position_lat BETWEEN -90 AND 90 
                                     AND position_lng BETWEEN -180 AND 180 
                                     AND position_lat IS NOT NULL) as valid
                FROM bronze.lions_raw
                WHERE DATE(ingestion_timestamp) = CURRENT_DATE
                
                UNION ALL
                
                SELECT 
                    'weights' as table_name,
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE weight > 0 AND weight < 1000) as valid
                FROM bronze.weights_raw
                WHERE DATE(ingestion_timestamp) = CURRENT_DATE
                
                UNION ALL
                
                SELECT 
                    'challenges' as table_name,
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE title IS NOT NULL AND status IS NOT NULL) as valid
                FROM bronze.challenges_raw
                WHERE DATE(ingestion_timestamp) = CURRENT_DATE
            """)
            
            results = cursor.fetchall()
            quality_report = {}
            
            for table_name, total, valid in results:
                if total > 0:
                    quality_pct = (valid / total) * 100
                    quality_report[table_name] = {
                        'total': total,
                        'valid': valid,
                        'quality_percentage': round(quality_pct, 2)
                    }
                    
                    # Mettre à jour la métrique Prometheus
                    data_quality_score.labels(table_name=f"bronze.{table_name}").set(quality_pct)
                    
                    # Insérer dans la table de quality checks
                    cursor.execute("""
                        INSERT INTO metadata.data_quality_checks 
                        (check_name, table_name, total_records, valid_records, invalid_records, quality_percentage, details)
                        VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """, (
                        'bronze_validation',
                        f'bronze.{table_name}',
                        total,
                        valid,
                        total - valid,
                        quality_pct,
                        json.dumps({'check_timestamp': datetime.now().isoformat()})
                    ))
            
            self.conn.commit()
            logger.info(f"✅ Bronze quality check completed: {quality_report}")
            return quality_report
            
        except Exception as e:
            logger.error(f"Error checking bronze quality: {e}")
            self.conn.rollback()
            raise
        finally:
            cursor.close()
    
    def check_silver_quality(self) -> Dict[str, Any]:
        """Vérifie la qualité des données Silver (cleansées)"""
        cursor = self.conn.cursor()
        
        try:
            cursor.execute("""
                SELECT 
                    'lions' as table_name,
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE lion_id IS NOT NULL 
                                     AND name IS NOT NULL 
                                     AND data_quality_score > 0.5) as valid
                FROM silver.lions
                
                UNION ALL
                
                SELECT 
                    'weight_history' as table_name,
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE lion_id IS NOT NULL 
                                     AND weight > 0 
                                     AND measured_at IS NOT NULL) as valid
                FROM silver.weight_history
            """)
            
            results = cursor.fetchall()
            quality_report = {}
            
            for table_name, total, valid in results:
                if total > 0:
                    quality_pct = (valid / total) * 100
                    quality_report[table_name] = {
                        'total': total,
                        'valid': valid,
                        'quality_percentage': round(quality_pct, 2)
                    }
                    
                    data_quality_score.labels(table_name=f"silver.{table_name}").set(quality_pct)
            
            self.conn.commit()
            logger.info(f"✅ Silver quality check completed: {quality_report}")
            return quality_report
            
        except Exception as e:
            logger.error(f"Error checking silver quality: {e}")
            self.conn.rollback()
            raise
        finally:
            cursor.close()
    
    def check_table_stats(self) -> Dict[str, Any]:
        """Récupère les statistiques des tables"""
        cursor = self.conn.cursor()
        
        try:
            cursor.execute("""
                SELECT 
                    schemaname || '.' || tablename as table_name,
                    n_live_tup + n_dead_tup as total_rows
                FROM pg_stat_user_tables
                WHERE schemaname IN ('bronze', 'silver', 'gold')
                ORDER BY n_live_tup DESC
            """)
            
            results = cursor.fetchall()
            stats = {}
            
            for table_name, row_count in results:
                schema = table_name.split('.')[0]
                stats[table_name] = row_count
                table_record_count.labels(table_name=table_name, layer=schema).set(row_count)
            
            logger.info(f"✅ Table stats retrieved: {len(stats)} tables")
            return stats
            
        except Exception as e:
            logger.error(f"Error retrieving table stats: {e}")
            raise
        finally:
            cursor.close()
    
    def get_pipeline_health(self) -> Dict[str, Any]:
        """Récupère la santé des pipelines"""
        cursor = self.conn.cursor()
        
        try:
            cursor.execute("""
                SELECT 
                    pipeline_name,
                    COUNT(*) as total_runs,
                    COUNT(*) FILTER (WHERE status = 'success') as successful_runs,
                    AVG(execution_time_ms) FILTER (WHERE status = 'success') as avg_duration,
                    MAX(end_time) as last_run
                FROM metadata.pipeline_logs
                WHERE end_time >= NOW() - INTERVAL '7 days'
                GROUP BY pipeline_name
            """)
            
            results = cursor.fetchall()
            health = {}
            
            for pipeline_name, total, successful, avg_dur, last_run in results:
                success_rate = (successful / total) * 100 if total > 0 else 0
                health[pipeline_name] = {
                    'total_runs': total,
                    'successful_runs': successful,
                    'success_rate': round(success_rate, 2),
                    'avg_duration_ms': round(avg_dur, 2) if avg_dur else 0,
                    'last_run': last_run.isoformat() if last_run else None,
                    'status': 'healthy' if success_rate >= 90 else 'degraded'
                }
                
                # Mettre à jour la métrique Prometheus
                status_value = 1 if success_rate >= 90 else 0
                pipeline_status.labels(pipeline_name=pipeline_name).set(status_value)
            
            logger.info(f"✅ Pipeline health retrieved: {health}")
            return health
            
        except Exception as e:
            logger.error(f"Error retrieving pipeline health: {e}")
            raise
        finally:
            cursor.close()
    
    def run_full_check(self) -> Dict[str, Any]:
        """Lance une vérification complète"""
        logger.info("=" * 60)
        logger.info("🔍 STARTING FULL MONITORING CHECK")
        logger.info("=" * 60)
        
        try:
            self.connect()
            
            check_result = {
                'check_timestamp': datetime.now().isoformat(),
                'bronze_quality': self.check_bronze_quality(),
                'silver_quality': self.check_silver_quality(),
                'table_stats': self.check_table_stats(),
                'pipeline_health': self.get_pipeline_health(),
                'status': 'completed'
            }
            
            logger.info("=" * 60)
            logger.info("✅ MONITORING CHECK COMPLETED")
            logger.info("=" * 60)
            
            return check_result
            
        except Exception as e:
            logger.error(f"Fatal error in monitoring: {e}")
            raise
        finally:
            if self.conn:
                self.conn.close()
    
    def get_metrics(self) -> bytes:
        """Retourne les métriques Prometheus"""
        return generate_latest(registry)


if __name__ == "__main__":
    pg_config = {
        'database': 'liontrack_warehouse',
        'user': 'liontrack',
        'password': 'liontrack_secure_pass',
        'host': 'postgres',
        'port': 5432
    }
    
    monitor = DataQualityMonitor(pg_config)
    
    try:
        result = monitor.run_full_check()
        print(json.dumps(result, indent=2))
    except Exception as e:
        logger.error(f"Error: {e}")
