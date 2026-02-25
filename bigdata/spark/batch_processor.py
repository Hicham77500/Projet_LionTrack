"""
Spark Batch Processing Pipeline pour LionTrack
Traite les données de Bronze -> Silver -> Gold
"""

from pyspark.sql import SparkSession
from pyspark.sql.functions import (
    col, from_json, schema_of_json, window, 
    avg, count, max as spark_max, when, to_timestamp,
    year, month, dayofmonth, date_format
)
from pyspark.sql.types import StructType, StructField, StringType, FloatType, TimestampType
import logging
from datetime import datetime, timedelta

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class LionTrackSparkBatchProcessor:
    """Pipeline de traitement batch pour LionTrack"""
    
    def __init__(
        self,
        app_name: str = "LionTrack-Batch-Processing",
        master: str = "spark://spark-master:7077"
    ):
        self.spark = SparkSession.builder \
            .appName(app_name) \
            .master(master) \
            .config("spark.sql.adaptive.enabled", "true") \
            .config("spark.sql.adaptive.coalescePartitions.enabled", "true") \
            .config("spark.sql.shuffle.partitions", "200") \
            .config("spark.driver.memory", "2g") \
            .config("spark.executor.memory", "2g") \
            .config("spark.executor.cores", "2") \
            .getOrCreate()
        
        self.spark.sparkContext.setLogLevel("INFO")
        logger.info("✅ SparkSession initialized")

    def process_lions_data(self):
        """Traite les données de lions: Bronze -> Silver"""
        logger.info("🦁 Processing lions data...")
        
        try:
            # Lire les données brutes
            df_bronze = self.spark.read.parquet("/data/bronze/lions_raw")
            
            # Nettoyage et transformation
            df_silver = df_bronze \
                .filter(col("position_lat").isNotNull()) \
                .filter(col("position_lng").isNotNull()) \
                .filter((col("position_lat") >= -90) & (col("position_lat") <= 90)) \
                .filter((col("position_lng") >= -180) & (col("position_lng") <= 180)) \
                .select(
                    col("lion_id"),
                    col("name"),
                    col("position_lat"),
                    col("position_lng"),
                    col("last_update"),
                    when(col("position_lat").isNotNull(), "active").otherwise("inactive").alias("status"),
                    when(
                        (col("position_lat").isNotNull()) & (col("position_lng").isNotNull()),
                        1.0
                    ).otherwise(0.0).alias("data_quality_score")
                ) \
                .dropDuplicates(["lion_id"]) \
                .coalesce(10)
            
            # Écrire en Silver
            df_silver.write.mode("overwrite").parquet("/data/silver/lions")
            logger.info(f"✅ {df_silver.count()} lions processed to Silver layer")
            
            return df_silver
            
        except Exception as e:
            logger.error(f"Error processing lions: {e}")
            raise

    def process_weights_data(self):
        """Traite les données de poids: Bronze -> Silver"""
        logger.info("⚖️  Processing weight data...")
        
        try:
            # Lire les données brutes
            df_bronze = self.spark.read.parquet("/data/bronze/weights_raw")
            
            # Nettoyage
            df_silver = df_bronze \
                .filter(col("weight").isNotNull()) \
                .filter(col("weight") > 0) \
                .filter(col("lion_id").isNotNull()) \
                .select(
                    col("weight_id"),
                    col("lion_id"),
                    col("weight"),
                    col("unit"),
                    col("measured_at")
                ) \
                .coalesce(10)
            
            # Écrire en Silver
            df_silver.write.mode("append").parquet("/data/silver/weight_history")
            logger.info(f"✅ {df_silver.count()} weight records processed to Silver layer")
            
            return df_silver
            
        except Exception as e:
            logger.error(f"Error processing weights: {e}")
            raise

    def process_users_challenges(self):
        """Traite les données challanges: Bronze -> Silver"""
        logger.info("🎯 Processing challenges data...")
        
        try:
            # Lire les données brutes
            df_bronze = self.spark.read.parquet("/data/bronze/challenges_raw")
            
            # Nettoyage
            df_silver = df_bronze \
                .filter(col("challenge_id").isNotNull()) \
                .filter(col("user_id").isNotNull()) \
                .select(
                    col("challenge_id"),
                    col("user_id"),
                    col("title"),
                    col("status"),
                    col("created_at"),
                    col("updated_at")
                ) \
                .dropDuplicates(["challenge_id"]) \
                .coalesce(10)
            
            # Écrire en Silver
            df_silver.write.mode("append").parquet("/data/silver/challenges")
            logger.info(f"✅ {df_silver.count()} challenges processed to Silver layer")
            
            return df_silver
            
        except Exception as e:
            logger.error(f"Error processing challenges: {e}")
            raise

    def process_gold_lions_metrics(self):
        """Crée les métriques d'or pour les lions"""
        logger.info("🏅 Generating lions metrics (Gold layer)...")
        
        try:
            # Lire les données Silver
            df_lions = self.spark.read.parquet("/data/silver/lions")
            df_weights = self.spark.read.parquet("/data/silver/weight_history")
            
            # Agréger les poids par lion
            df_weight_agg = df_weights \
                .withColumn("metric_date", date_format(col("measured_at"), "yyyy-MM-dd")) \
                .groupBy("lion_id", "metric_date") \
                .agg(
                    avg("weight").alias("avg_weight"),
                    count("weight_id").alias("weight_entries_count")
                )
            
            # Calculer la tendance
            df_gold = df_weight_agg \
                .join(df_lions, "lion_id", "left") \
                .select(
                    col("lion_id"),
                    col("metric_date"),
                    col("avg_weight"),
                    when(col("avg_weight") > 250, "stable").otherwise("normal").alias("weight_trend"),
                    col("weight_entries_count").alias("tracking_frequency"),
                    (col("weight_entries_count") / 30 * 100).alias("health_score"),
                    col("status")
                )
            
            # Écrire en Gold
            df_gold.write.mode("append").parquet("/data/gold/lions_metrics")
            logger.info(f"✅ Lions metrics generated: {df_gold.count()} records")
            
            return df_gold
            
        except Exception as e:
            logger.error(f"Error generating lions metrics: {e}")
            raise

    def process_gold_user_activity(self):
        """Crée les métriques d'engagement utilisateur"""
        logger.info("👤 Generating user activity metrics (Gold layer)...")
        
        try:
            # Lire les données Silver
            df_challenges = self.spark.read.parquet("/data/silver/challenges")
            df_weights = self.spark.read.parquet("/data/silver/weight_history")
            
            # Agréger par utilisateur et date
            df_activity = df_challenges \
                .withColumn("activity_date", date_format(col("updated_at"), "yyyy-MM-dd")) \
                .groupBy("user_id", "activity_date") \
                .agg(
                    count("challenge_id").alias("total_challenges"),
                    count(when(col("status") == "completed", 1)).alias("challenges_completed"),
                    count(when(col("status") == "in_progress", 1)).alias("challenges_in_progress")
                )
            
            # Ajouter les entrées de poids
            df_gold = df_activity \
                .join(
                    df_weights \
                        .withColumn("activity_date", date_format(col("measured_at"), "yyyy-MM-dd")) \
                        .groupBy("lion_id", "activity_date") \
                        .agg(count("weight_id").alias("weight_entries")),
                    on=col("activity_date"),
                    how="left"
                ) \
                .select(
                    col("user_id"),
                    col("activity_date"),
                    col("challenges_completed"),
                    col("challenges_in_progress"),
                    col("weight_entries").cast("int"),
                    (
                        (col("challenges_completed") / (col("total_challenges") + 1)) * 50 +
                        (col("weight_entries") / 2)
                    ).alias("engagement_score")
                )
            
            # Écrire en Gold
            df_gold.write.mode("append").parquet("/data/gold/user_activity")
            logger.info(f"✅ User activity metrics generated: {df_gold.count()} records")
            
            return df_gold
            
        except Exception as e:
            logger.error(f"Error generating user activity metrics: {e}")
            raise

    def run_full_pipeline(self):
        """Lance le pipeline complet"""
        logger.info("=" * 60)
        logger.info("🚀 START FULL BATCH PIPELINE")
        logger.info("=" * 60)
        
        try:
            start_time = datetime.now()
            
            # Traiter les couches
            self.process_lions_data()
            self.process_weights_data()
            self.process_users_challenges()
            
            # Générer les metrics Gold
            self.process_gold_lions_metrics()
            self.process_gold_user_activity()
            
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            
            logger.info("=" * 60)
            logger.info(f"✅ PIPELINE COMPLETED in {duration:.2f} seconds")
            logger.info("=" * 60)
            
        except Exception as e:
            logger.error(f"Pipeline failed: {e}")
            raise

    def stop(self):
        """Arrête la session Spark"""
        self.spark.stop()
        logger.info("SparkSession stopped")


if __name__ == "__main__":
    processor = LionTrackSparkBatchProcessor()
    
    try:
        processor.run_full_pipeline()
    except Exception as e:
        logger.error(f"Fatal error: {e}")
    finally:
        processor.stop()
