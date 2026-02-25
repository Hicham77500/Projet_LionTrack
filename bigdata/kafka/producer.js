/**
 * Kafka Producer pour LionTrack
 * Envoie les événements Lions, Users, Challenges vers Kafka
 */

const { Kafka, CompressionTypes } = require('kafkajs');
const mongoose = require('mongoose');
const Bull = require('bull');

class LionTrackKafkaProducer {
  constructor(brokers = ['kafka:9092']) {
    this.kafkaClient = new Kafka({
      clientId: 'liontrack-producer',
      brokers: brokers,
      connectionTimeout: 10000,
      requestTimeout: 30000,
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
    });

    this.producer = null;
    this.topics = {
      LIONS_POSITION: 'lions.position.events',
      LIONS_WEIGHT: 'lions.weight.events',
      USERS_ACTIVITY: 'users.activity.events',
      CHALLENGES_STATUS: 'challenges.status.events',
      DATA_QUALITY: 'data.quality.events',
    };
  }

  async initialize() {
    this.producer = this.kafkaClient.producer({
      idempotent: true,
      maxInFlightRequests: 5,
      compression: CompressionTypes.GZIP,
    });

    await this.producer.connect();
    console.log('✅ Kafka Producer initialized');
  }

  /**
   * Envoie un événement de position de lion
   */
  async publishLionPosition(lionData) {
    const event = {
      lion_id: lionData._id,
      name: lionData.name,
      position: {
        lat: lionData.position?.lat,
        lng: lionData.position?.lng,
      },
      timestamp: new Date().toISOString(),
      source: 'mongodb',
      confidence: 0.95,
    };

    try {
      await this.producer.send({
        topic: this.topics.LIONS_POSITION,
        messages: [
          {
            key: lionData._id.toString(),
            value: JSON.stringify(event),
            headers: {
              'event-type': 'lion.position.update',
              'timestamp': new Date().toISOString(),
            },
          },
        ],
        compression: CompressionTypes.GZIP,
      });

      console.log(`📍 Lion position event sent: ${lionData._id}`);
    } catch (error) {
      console.error(`Error publishing lion position: ${error.message}`);
      throw error;
    }
  }

  /**
   * Envoie un événement de poids de lion
   */
  async publishWeight(weightData) {
    const event = {
      weight_id: weightData._id,
      lion_id: weightData.lion_id,
      weight: weightData.weight,
      unit: weightData.unit || 'kg',
      measured_at: weightData.measured_at,
      timestamp: new Date().toISOString(),
      source: 'mongodb',
    };

    try {
      await this.producer.send({
        topic: this.topics.LIONS_WEIGHT,
        messages: [
          {
            key: weightData.lion_id.toString(),
            value: JSON.stringify(event),
            partitionKey: weightData.lion_id.toString(),
          },
        ],
      });

      console.log(`⚖️  Weight event sent: ${weightData.lion_id}`);
    } catch (error) {
      console.error(`Error publishing weight: ${error.message}`);
      throw error;
    }
  }

  /**
   * Envoie un événement d'activité utilisateur
   */
  async publishUserActivity(userId, activityType, metadata = {}) {
    const event = {
      user_id: userId,
      activity_type: activityType,
      timestamp: new Date().toISOString(),
      ...metadata,
    };

    try {
      await this.producer.send({
        topic: this.topics.USERS_ACTIVITY,
        messages: [
          {
            key: userId.toString(),
            value: JSON.stringify(event),
          },
        ],
      });

      console.log(`👤 User activity event sent: ${userId}`);
    } catch (error) {
      console.error(`Error publishing user activity: ${error.message}`);
      throw error;
    }
  }

  /**
   * Envoie un événement de changement de statut challenge
   */
  async publishChallengeStatus(challengeData) {
    const event = {
      challenge_id: challengeData._id,
      user_id: challengeData.user_id,
      title: challengeData.title,
      status: challengeData.status,
      timestamp: new Date().toISOString(),
      updated_at: challengeData.updated_at,
    };

    try {
      await this.producer.send({
        topic: this.topics.CHALLENGES_STATUS,
        messages: [
          {
            key: challengeData._id.toString(),
            value: JSON.stringify(event),
          },
        ],
      });

      console.log(`🎯 Challenge event sent: ${challengeData._id}`);
    } catch (error) {
      console.error(`Error publishing challenge: ${error.message}`);
      throw error;
    }
  }

  /**
   * Envoie un événement de qualité de données
   */
  async publishDataQuality(qualityReport) {
    const event = {
      check_timestamp: new Date().toISOString(),
      ...qualityReport,
    };

    try {
      await this.producer.send({
        topic: this.topics.DATA_QUALITY,
        messages: [
          {
            key: qualityReport.table_name,
            value: JSON.stringify(event),
          },
        ],
      });

      console.log(`📊 Data quality event sent: ${qualityReport.table_name}`);
    } catch (error) {
      console.error(`Error publishing data quality: ${error.message}`);
      throw error;
    }
  }

  async disconnect() {
    if (this.producer) {
      await this.producer.disconnect();
      console.log('Kafka Producer disconnected');
    }
  }
}

module.exports = LionTrackKafkaProducer;
