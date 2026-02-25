"""
Spark Streaming Pipeline pour LionTrack (Kappa Architecture)
Traite les événements Kafka en temps réel
"""

from pyspark.sql import SparkSession
from pyspark.sql.functions import (
    col, from_json, schema_of_json, window,
    avg, count, max as spark_max, when, to_timestamp,
    unix_timestamp, explode_outer
)
from pyspark.sql.types import (
    StructType, StructField, StringType, FloatType, 
    TimestampType, DoubleType
)
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class LionTrackSparkStreamingProcessor:
    """Pipeline de streaming temps réel pour LionTrack"""
    
    def __init__(
        self,
        app_name: str = "LionTrack-Streaming",
        master: str = "spark://spark-master:7077"
    ):
        self.spark = SparkSession.builder \
            .appName(app_name) \
            .master(master) \
            .config("spark.streaming.kafka.maxRatePerPartition", "1000") \
            .config("spark.sql.streaming.checkpointLocation", "/checkpoints") \
            .config("spark.sql.streaming.miniBatchOffsetRangeCheckpointLocation", "/checkpoints-offset") \
            .getOrCreate()
        
        self.spark.sparkContext.setLogLevel("INFO")
        logger.info("✅ Spark Streaming Session initialized")

    # ========== SCHEMAS ==========
    
    @staticmethod
    def get_lion_position_schema():
        """Schema pour les événements de position"""
        return StructType([
            StructField("lion_id", StringType(), True),
            StructField("name", StringType(), True),
            StructField("position", StructType([
                StructField("lat", DoubleType(), True),
                StructField("lng", DoubleType(), True),
            ]), True),
            StructField("timestamp", StringType(), True),
            StructField("source", StringType(), True),
            StructField("confidence", FloatType(), True),
        ])

    @staticmethod
    def get_weight_event_schema():
        """Schema pour les événements de poids"""
        return StructType([
            StructField("weight_id", StringType(), True),
            StructField("lion_id", StringType(), True),
            StructField("weight", FloatType(), True),
            StructField("unit", StringType(), True),
            StructField("measured_at", StringType(), True),
            StructField("timestamp", StringType(), True),
            StructField("source", StringType(), True),
        ])

    def read_kafka_stream(self, topic: str, kafka_servers: str = "kafka:9092"):
        """Lit un topic Kafka"""
        df = self.spark.readStream \
            .format("kafka") \
            .option("kafka.bootstrap.servers", kafka_servers) \
            .option("subscribe", topic) \
            .option("startingOffsets", "latest") \
            .option("failOnDataLoss", "false") \
            .option("kafkaConsumer.pollTimeoutMs", "60000") \
            .load()
        
        return df

    def process_lions_position_stream(self, kafka_servers: str = "kafka:9092"):
        """Traite le stream de positions en temps réel"""
        logger.info("🦁 Processing lions position stream...")
        
        try:
            # Lire le stream
            df_raw = self.read_kafka_stream("lions.position.events", kafka_servers)
            
            # Parser JSON
            schema = self.get_lion_position_schema()
            df = df_raw.select(
                from_json(col("value").cast("string"), schema).alias("data")
            ).select("data.*")
            
            # Transformer
            df = df \
                .withColumn("event_timestamp", to_timestamp(col("timestamp"))) \
                .select(
                    col("lion_id"),
                    col("name"),
                    col("position.lat").alias("latitude"),
                    col("position.lng").alias("longitude"),
                    col("confidence"),
                    col("event_timestamp"),
                    col("source")
                )
            
            # Écrire en streaming vers Parquet
            query = df.writeStream \
                .format("parquet") \
                .option("path", "/data/streaming/lions_position") \
                .option("checkpointLocation", "/checkpoints/lions_position") \
                .partitionBy("event_timestamp") \
                .mode("append") \
                .start()
            
            logger.info("✅ Lions position stream started")
            return query
            
        except Exception as e:
            logger.error(f"Error processing lions position stream: {e}")
            raise

    def process_weights_stream(self, kafka_servers: str = "kafka:9092"):
        """Traite le stream de poids en temps réel"""
        logger.info("⚖️  Processing weights stream...")
        
        try:
            # Lire le stream
            df_raw = self.read_kafka_stream("lions.weight.events", kafka_servers)
            
            # Parser JSON
            schema = self.get_weight_event_schema()
            df = df_raw.select(
                from_json(col("value").cast("string"), schema).alias("data")
            ).select("data.*")
            
            # Transformer
            df = df \
                .withColumn("event_timestamp", to_timestamp(col("timestamp"))) \
                .withColumn("measured_timestamp", to_timestamp(col("measured_at"))) \
                .select(
                    col("weight_id"),
                    col("lion_id"),
                    col("weight"),
                    col("unit"),
                    col("measured_timestamp"),
                    col("event_timestamp"),
                    col("source")
                )
            
            # Écrire en streaming
            query = df.writeStream \
                .format("parquet") \
                .option("path", "/data/streaming/weights") \
                .option("checkpointLocation", "/checkpoints/weights") \
                .partitionBy("event_timestamp") \
                .mode("append") \
                .start()
            
            logger.info("✅ Weights stream started")
            return query
            
        except Exception as e:
            logger.error(f"Error processing weights stream: {e}")
            raise

    def process_animals_activity_stream(self, kafka_servers: str = "kafka:9092"):
        """Traite les activités utilisateurs en temps réel avec fenêtrage"""
        logger.info("👤 Processing user activity stream with windowing...")
        
        try:
            # Lire le stream
            df_raw = self.read_kafka_stream("users.activity.events", kafka_servers)
            
            # Parser JSON basique
            df = df_raw.select(
                from_json(col("value").cast("string"), 
                    StructType([
                        StructField("user_id", StringType(), True),
                        StructField("activity_type", StringType(), True),
                        StructField("timestamp", StringType(), True),
                    ])
                ).alias("data")
            ).select("data.*")
            
            # Fenêtrage temps réel (5 min windows)
            df_windowed = df \
                .withColumn("event_timestamp", to_timestamp(col("timestamp"))) \
                .groupBy(
                    window(col("event_timestamp"), "5 minutes"),
                    col("user_id")
                ) \
                .agg(
                    count("activity_type").alias("activity_count")
                ) \
                .select(
                    col("window.start").alias("window_start"),
                    col("window.end").alias("window_end"),
                    col("user_id"),
                    col("activity_count")
                )
            
            # Écrire en streaming
            query = df_windowed.writeStream \
                .format("parquet") \
                .option("path", "/data/streaming/user_activity") \
                .option("checkpointLocation", "/checkpoints/user_activity") \
                .outputMode("append") \
                .start()
            
            logger.info("✅ User activity stream started")
            return query
            
        except Exception as e:
            logger.error(f"Error processing user activity stream: {e}")
            raise

    def start_all_streams(self, kafka_servers: str = "kafka:9092"):
        """Démarre tous les streams"""
        logger.info("=" * 60)
        logger.info("🚀 STARTING ALL STREAMING PIPELINES")
        logger.info("=" * 60)
        
        queries = []
        
        try:
            queries.append(self.process_lions_position_stream(kafka_servers))
            queries.append(self.process_weights_stream(kafka_servers))
            queries.append(self.process_animals_activity_stream(kafka_servers))
            
            logger.info("=" * 60)
            logger.info(f"✅ {len(queries)} streams started")
            logger.info("=" * 60)
            
            # Attendre l'arrêt
            self.spark.streams.awaitAnyTermination()
            
            return queries
            
        except Exception as e:
            logger.error(f"Error starting streams: {e}")
            raise

    def stop(self):
        """Arrête tous les streams"""
        self.spark.streams.stopAll()
        self.spark.stop()
        logger.info("All streams stopped")


if __name__ == "__main__":
    processor = LionTrackSparkStreamingProcessor()
    
    try:
        processor.start_all_streams(kafka_servers="kafka:9092")
    except Exception as e:
        logger.error(f"Fatal error: {e}")
    finally:
        processor.stop()
