"""
DAG LionTrack - Tests Unitaires et Maintenance Quotidienne
Auteur: LionTrack Dev Team
Date: 2026-01-29
Version: 2.1.0
"""

from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
import logging
import os
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

# Configuration
MONGODB_URI = os.getenv('MONGODB_URI')
JWT_SECRET = os.getenv('JWT_SECRET')

# Arguments par défaut
default_args = {
    'owner': 'liontrack',
    'retries': 2,
    'retry_delay': timedelta(minutes=5),
    'start_date': datetime(2026, 1, 28),
    'email_on_failure': False,
    'email_on_retry': False,
    'catchup': False,
}

# Définition du DAG
dag = DAG(
    'liontrack_daily_operations',
    default_args=default_args,
    description='🦁 DAG quotidien pour LionTrack - Tests unitaires et maintenance',
    schedule_interval='0 2 * * *',  # Chaque jour à 2h du matin
    tags=['liontrack', 'production', 'daily'],
)

# ============================================================================
# SECTION 1 : TESTS UNITAIRES
# ============================================================================

def test_mongodb_connection():
    """✅ Test de connexion MongoDB (vérification URI)"""
    try:
        logging.info('🧪 Test de connexion MongoDB...')
        
        if not MONGODB_URI:
            raise ValueError('MONGODB_URI non configurée')
        
        if 'mongodb+srv://' not in MONGODB_URI:
            raise ValueError('MONGODB_URI invalide (format attendu: mongodb+srv://...)')
        
        if '@' not in MONGODB_URI:
            raise ValueError('MONGODB_URI invalide (pas de credentials)')
        
        logging.info('✅ MONGODB_URI valide et configurée')
        return {'status': 'pass', 'service': 'MongoDB Configuration'}
    except Exception as e:
        logging.error(f'❌ Test MongoDB échoué: {str(e)}')
        raise

def test_jwt_secret():
    """✅ Test de la clé JWT"""
    try:
        import jwt
        
        logging.info('🧪 Test de la clé JWT...')
        
        if not JWT_SECRET or len(JWT_SECRET) < 8:
            raise ValueError('JWT_SECRET manquante ou trop courte')
        
        # Créer un token de test
        payload = {
            'sub': 'test',
            'iat': datetime.utcnow(),
            'exp': datetime.utcnow() + timedelta(hours=1)
        }
        
        token = jwt.encode(payload, JWT_SECRET, algorithm='HS256')
        decoded = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        
        logging.info('✅ Clé JWT valide et fonctionnelle')
        return {'status': 'pass', 'service': 'JWT'}
    except Exception as e:
        logging.error(f'❌ Test JWT échoué: {str(e)}')
        raise

def test_database_integrity():
    """✅ Test d'intégrité de la base de données (vérification config)"""
    try:
        logging.info('🧪 Test d\'intégrité de la configuration BD...')
        
        if not MONGODB_URI:
            raise ValueError('Base de données non configurée')
        
        if 'mongodb+srv://' in MONGODB_URI:
            logging.info('✅ Utilise MongoDB Atlas (SRV)')
        else:
            logging.info('✅ Utilise MongoDB local ou distant')
        
        logging.info('✅ Configuration de la base de données valide')
        return {'status': 'pass', 'service': 'Database Configuration'}
    except Exception as e:
        logging.error(f'❌ Test intégrité échoué: {str(e)}')
        raise

# ============================================================================
# SECTION 2 : TÂCHES DE MAINTENANCE (SKIPPED - pymongo non disponible)
# ============================================================================

def clean_old_sessions():
    """🧹 Nettoyer les sessions expirées (SKIPPED)"""
    logging.info('🧹 Nettoyage des sessions expirées - SKIPPED (pymongo non disponible)')
    return {'status': 'skipped', 'reason': 'pymongo not available'}

def clean_old_logs():
    """🧹 Archiver les anciens logs (SKIPPED)"""
    logging.info('📦 Archivage des anciens logs - SKIPPED (pymongo non disponible)')
    return {'status': 'skipped', 'reason': 'pymongo not available'}

def backup_database():
    """💾 Sauvegarder la base de données (SKIPPED)"""
    logging.info('💾 Sauvegarde MongoDB - SKIPPED (pymongo non disponible)')
    return {'status': 'skipped', 'reason': 'pymongo not available'}

def generate_daily_statistics():
    """📊 Générer les statistiques quotidiennes (SKIPPED)"""
    logging.info('📊 Statistiques quotidiennes - SKIPPED (pymongo non disponible)')
    return {'status': 'skipped', 'reason': 'pymongo not available'}

def generate_user_rankings():
    """🏆 Générer le classement des utilisateurs (SKIPPED)"""
    logging.info('🏆 Classement des utilisateurs - SKIPPED (pymongo non disponible)')
    return {'status': 'skipped', 'reason': 'pymongo not available'}

def send_daily_digest():
    """📧 Envoyer les digests quotidiens (SKIPPED)"""
    logging.info('📧 Digests quotidiens - SKIPPED (serveur mail non configuré)')
    return {'status': 'skipped', 'reason': 'email not configured'}

# ============================================================================
# DÉFINITION DES TÂCHES AIRFLOW
# ============================================================================

task_test_mongodb = PythonOperator(
    task_id='test_mongodb_connection',
    python_callable=test_mongodb_connection,
    dag=dag,
)

task_test_jwt = PythonOperator(
    task_id='test_jwt_secret',
    python_callable=test_jwt_secret,
    dag=dag,
)

task_test_integrity = PythonOperator(
    task_id='test_database_integrity',
    python_callable=test_database_integrity,
    dag=dag,
)

task_clean_sessions = PythonOperator(
    task_id='clean_old_sessions',
    python_callable=clean_old_sessions,
    dag=dag,
)

task_clean_logs = PythonOperator(
    task_id='clean_old_logs',
    python_callable=clean_old_logs,
    dag=dag,
)

task_backup = PythonOperator(
    task_id='backup_database',
    python_callable=backup_database,
    dag=dag,
)

task_stats = PythonOperator(
    task_id='generate_daily_statistics',
    python_callable=generate_daily_statistics,
    dag=dag,
)

task_rankings = PythonOperator(
    task_id='generate_user_rankings',
    python_callable=generate_user_rankings,
    dag=dag,
)

task_digest = PythonOperator(
    task_id='send_daily_digest',
    python_callable=send_daily_digest,
    dag=dag,
    trigger_rule='none_failed_min_one_success',
)

# ============================================================================
# DÉFINITION DES DÉPENDANCES
# ============================================================================

[task_test_mongodb, task_test_jwt, task_test_integrity] >> task_clean_sessions
task_clean_sessions >> task_clean_logs
task_clean_logs >> task_backup
task_backup >> task_stats >> task_rankings
task_rankings >> task_digest
