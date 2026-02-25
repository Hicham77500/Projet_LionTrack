"""
Kafka Consumers pour LionTrack
Consomme les événements et les écrit dans PostgreSQL
"""

import json
import logging
from kafka import KafkaConsumer
from kafka.errors import KafkaError
from datetime import datetime
import psycopg2
from psycopg2.extras import execute_values
from typing import Dict, Any
import threading

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class LionTrackKafkaConsumer:
    def __init__(
        self,
        brokers: list = ["kafka:9092"],
        postgres_conn_string: str = "dbname=liontrack_warehouse user=liontrack password=liontrack_secure_pass host=postgres port=5432"
    ):
        self.brokers = brokers
        self.postgres_conn = postgres_conn_string
        self.consumers = {}
        self.db_connection = None
        
    def connect_db(self):
        """Établit la connexion à PostgreSQL"""
        try:
            self.db_connection = psycopg2.connect(self.postgres_conn)
            logger.info("✅ PostgreSQL connected")
        except psycopg2.Error as e:
            logger.error(f"❌ PostgreSQL connection error: {e}")
            raise

    def create_consumer(self, group_id: str, topics: list):
        """Crée un consommateur Kafka"""
        consumer = KafkaConsumer(
            *topics,
            bootstrap_servers=self.brokers,
            group_id=group_id,
            auto_offset_reset='earliest',
            value_deserializer=lambda m: json.loads(m.decode('utf-8')),
            enable_auto_commit=True,
            max_poll_records=100,
            session_timeout_ms=30000,
            heartbeat_interval_ms=10000,
        )
        self.consumers[group_id] = consumer
        return consumer

    def consume_lions_position(self):
        """Consomme les positions des lions"""
        consumer = self.create_consumer(
            "lions-position-group",
            ["lions.position.events"]
        )
        
        logger.info("🦁 Consumer started: lions.position.events")
        
        for message in consumer:
            try:
                event = message.value
                logger.info(f"📍 Position event received: {event['lion_id']}")
                
                self._insert_lion_position(event)
                
            except Exception as e:
                logger.error(f"Error processing position event: {e}")

    def consume_lions_weight(self):
        """Consomme les événements de poids"""
        consumer = self.create_consumer(
            "lions-weight-group",
            ["lions.weight.events"]
        )
        
        logger.info("⚖️  Consumer started: lions.weight.events")
        
        for message in consumer:
            try:
                event = message.value
                logger.info(f"⚖️  Weight event received: {event['lion_id']}")
                
                self._insert_weight_event(event)
                
            except Exception as e:
                logger.error(f"Error processing weight event: {e}")

    def consume_users_activity(self):
        """Consomme les événements d'activité utilisateur"""
        consumer = self.create_consumer(
            "users-activity-group",
            ["users.activity.events"]
        )
        
        logger.info("👤 Consumer started: users.activity.events")
        
        for message in consumer:
            try:
                event = message.value
                logger.info(f"👤 Activity event received: {event['user_id']}")
                
                self._insert_user_activity(event)
                
            except Exception as e:
                logger.error(f"Error processing activity event: {e}")

    def consume_challenges_status(self):
        """Consomme les changements de statut des challenges"""
        consumer = self.create_consumer(
            "challenges-status-group",
            ["challenges.status.events"]
        )
        
        logger.info("🎯 Consumer started: challenges.status.events")
        
        for message in consumer:
            try:
                event = message.value
                logger.info(f"🎯 Challenge event received: {event['challenge_id']}")
                
                self._insert_challenge_event(event)
                
            except Exception as e:
                logger.error(f"Error processing challenge event: {e}")

    def consume_data_quality(self):
        """Consomme les événements de qualité de données"""
        consumer = self.create_consumer(
            "data-quality-group",
            ["data.quality.events"]
        )
        
        logger.info("📊 Consumer started: data.quality.events")
        
        for message in consumer:
            try:
                event = message.value
                logger.info(f"📊 Quality event received: {event['table_name']}")
                
                self._insert_quality_check(event)
                
            except Exception as e:
                logger.error(f"Error processing quality event: {e}")

    # ========== INSERTS ==========
    
    def _insert_lion_position(self, event: Dict[str, Any]):
        """Insère une position de lion en Bronze"""
        cursor = self.db_connection.cursor()
        try:
            sql = """
            INSERT INTO bronze.lions_raw (
                lion_id, name, position_lat, position_lng, 
                last_update, metadata, source_system, partition_date
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """
            
            values = (
                event['lion_id'],
                event['name'],
                event['position']['lat'],
                event['position']['lng'],
                event['timestamp'],
                json.dumps(event),
                event.get('source', 'kafka'),
                datetime.now().date()
            )
            
            cursor.execute(sql, values)
            self.db_connection.commit()
            logger.info(f"✅ Lion position inserted: {event['lion_id']}")
            
        except psycopg2.Error as e:
            self.db_connection.rollback()
            logger.error(f"Database error: {e}")
        finally:
            cursor.close()

    def _insert_weight_event(self, event: Dict[str, Any]):
        """Insère un événement de poids en Bronze"""
        cursor = self.db_connection.cursor()
        try:
            sql = """
            INSERT INTO bronze.weights_raw (
                weight_id, lion_id, weight, unit, measured_at, 
                metadata, source_system
            ) VALUES (%s, %s, %s, %s, %s, %s, %s)
            """
            
            values = (
                event['weight_id'],
                event['lion_id'],
                event['weight'],
                event.get('unit', 'kg'),
                event['measured_at'],
                json.dumps(event),
                event.get('source', 'kafka')
            )
            
            cursor.execute(sql, values)
            self.db_connection.commit()
            logger.info(f"✅ Weight inserted: {event['lion_id']}")
            
        except psycopg2.Error as e:
            self.db_connection.rollback()
            logger.error(f"Database error: {e}")
        finally:
            cursor.close()

    def _insert_user_activity(self, event: Dict[str, Any]):
        """Insère une activité utilisateur en Bronze"""
        cursor = self.db_connection.cursor()
        try:
            sql = """
            INSERT INTO bronze.users_raw (
                user_id, metadata, source_system
            ) VALUES (%s, %s, %s)
            """
            
            values = (
                event['user_id'],
                json.dumps(event),
                event.get('source', 'kafka')
            )
            
            cursor.execute(sql, values)
            self.db_connection.commit()
            logger.info(f"✅ User activity inserted: {event['user_id']}")
            
        except psycopg2.Error as e:
            self.db_connection.rollback()
            logger.error(f"Database error: {e}")
        finally:
            cursor.close()

    def _insert_challenge_event(self, event: Dict[str, Any]):
        """Insère un événement challenge en Bronze"""
        cursor = self.db_connection.cursor()
        try:
            sql = """
            INSERT INTO bronze.challenges_raw (
                challenge_id, user_id, title, status, 
                metadata, source_system
            ) VALUES (%s, %s, %s, %s, %s, %s)
            """
            
            values = (
                event['challenge_id'],
                event['user_id'],
                event['title'],
                event['status'],
                json.dumps(event),
                event.get('source', 'kafka')
            )
            
            cursor.execute(sql, values)
            self.db_connection.commit()
            logger.info(f"✅ Challenge inserted: {event['challenge_id']}")
            
        except psycopg2.Error as e:
            self.db_connection.rollback()
            logger.error(f"Database error: {e}")
        finally:
            cursor.close()

    def _insert_quality_check(self, event: Dict[str, Any]):
        """Insère un résultat de qualité de données"""
        cursor = self.db_connection.cursor()
        try:
            sql = """
            INSERT INTO metadata.data_quality_checks (
                check_name, table_name, total_records, valid_records,
                invalid_records, quality_percentage, details
            ) VALUES (%s, %s, %s, %s, %s, %s, %s)
            """
            
            values = (
                event.get('check_name'),
                event['table_name'],
                event.get('total_records'),
                event.get('valid_records'),
                event.get('invalid_records'),
                event.get('quality_percentage'),
                json.dumps(event)
            )
            
            cursor.execute(sql, values)
            self.db_connection.commit()
            logger.info(f"✅ Quality check inserted: {event['table_name']}")
            
        except psycopg2.Error as e:
            self.db_connection.rollback()
            logger.error(f"Database error: {e}")
        finally:
            cursor.close()

    def start_all_consumers(self):
        """Démarre tous les consommateurs en parallèle"""
        self.connect_db()
        
        threads = [
            threading.Thread(target=self.consume_lions_position, daemon=True),
            threading.Thread(target=self.consume_lions_weight, daemon=True),
            threading.Thread(target=self.consume_users_activity, daemon=True),
            threading.Thread(target=self.consume_challenges_status, daemon=True),
            threading.Thread(target=self.consume_data_quality, daemon=True),
        ]
        
        for thread in threads:
            thread.start()
        
        logger.info("✅ All consumers started")
        
        # Keep the main thread alive
        for thread in threads:
            thread.join()

    def stop(self):
        """Arrête les consommateurs"""
        for consumer in self.consumers.values():
            consumer.close()
        if self.db_connection:
            self.db_connection.close()
        logger.info("Consumers stopped")


if __name__ == "__main__":
    kwargs = {
        "brokers": ["kafka:9092"],
        "postgres_conn_string": "dbname=liontrack_warehouse user=liontrack password=liontrack_secure_pass host=postgres port=5432"
    }
    
    consumer = LionTrackKafkaConsumer(**kwargs)
    
    try:
        consumer.start_all_consumers()
    except KeyboardInterrupt:
        logger.info("Shutting down...")
        consumer.stop()
