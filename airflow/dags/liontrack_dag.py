"""
DAG LionTrack - Orchestration des tâches quotidiennes
Auteur: LionTrack Dev Team
Date: 2026-01-28
Version: 1.0.0
"""

from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.bash import BashOperator
from airflow.providers.http.operators.http import SimpleHttpOperator
from airflow.providers.http.sensors.http import HttpSensor
import requests
import logging
import os
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

# Configuration
LIONTRACK_API_URL = os.getenv('LIONTRACK_API_URL', 'https://liontrack-fxerefd7gneqfqac.canadacentral-01.azurewebsites.net')
MONGODB_URI = os.getenv('MONGODB_URI')
JWT_SECRET = os.getenv('JWT_SECRET')

# Arguments par défaut
default_args = {
    'owner': 'liontrack',
    'retries': 2,
    'retry_delay': timedelta(minutes=5),
    'start_date': datetime(2026, 1, 28),
    'email': ['admin@liontrack.com'],
    'email_on_failure': True,
    'email_on_retry': False,
    'catchup': False,
}

# Définition du DAG
dag = DAG(
    'liontrack_daily_operations',
    default_args=default_args,
    description='🦁 DAG quotidien pour LionTrack - Orchestration des tâches',
    schedule_interval='0 2 * * *',  # Chaque jour à 2h du matin
    tags=['liontrack', 'production', 'daily'],
)

# ============================================================================
# SECTION 1 : TÂCHES DE VÉRIFICATION ET SANTÉ
# ============================================================================

def check_api_health():
    """✅ Vérifier la santé de l'API LionTrack"""
    try:
        logging.info('🏥 Vérification de la santé de l\'API...')
        response = requests.get(
            f'{LIONTRACK_API_URL}/api/health',
            timeout=10
        )
        
        if response.status_code == 200:
            logging.info('✅ API LionTrack en bonne santé')
            return {'status': 'healthy', 'timestamp': datetime.utcnow().isoformat()}
        else:
            logging.error(f'⚠️ API retourne le statut {response.status_code}')
            raise Exception(f'API status code: {response.status_code}')
    except Exception as e:
        logging.error(f'❌ Erreur lors de la vérification de l\'API: {str(e)}')
        raise

def check_database_health():
    """✅ Vérifier la santé de la base de données MongoDB"""
    try:
        from pymongo import MongoClient
        
        logging.info('🗄️ Vérification de la base de données MongoDB...')
        client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
        client.admin.command('ping')
        
        logging.info('✅ MongoDB est accessible et fonctionnel')
        
        # Compter les documents
        db = client['defisDB']
        users_count = db.users.count_documents({})
        challenges_count = db.challenges.count_documents({})
        
        logging.info(f'📊 Utilisateurs: {users_count}, Défis: {challenges_count}')
        return {
            'status': 'healthy',
            'users': users_count,
            'challenges': challenges_count
        }
    except Exception as e:
        logging.error(f'❌ Erreur MongoDB: {str(e)}')
        raise

# ============================================================================
# SECTION 2 : TÂCHES DE MAINTENANCE
# ============================================================================

def clean_old_sessions():
    """🧹 Nettoyer les sessions expirées"""
    try:
        from pymongo import MongoClient
        
        logging.info('🧹 Nettoyage des sessions expirées...')
        client = MongoClient(MONGODB_URI)
        db = client['defisDB']
        
        # Supprimer les sessions de plus de 30 jours
        cutoff_date = datetime.utcnow() - timedelta(days=30)
        
        if 'sessions' in db.list_collection_names():
            result = db.sessions.delete_many({
                'createdAt': {'$lt': cutoff_date}
            })
            logging.info(f'✅ {result.deleted_count} sessions supprimées')
            return result.deleted_count
        else:
            logging.info('ℹ️ Aucune collection sessions trouvée')
            return 0
    except Exception as e:
        logging.error(f'❌ Erreur lors du nettoyage: {str(e)}')
        raise

def clean_old_logs():
    """🧹 Archiver les anciens logs"""
    try:
        from pymongo import MongoClient
        import gzip
        import shutil
        from pathlib import Path
        
        logging.info('📦 Archivage des anciens logs...')
        client = MongoClient(MONGODB_URI)
        db = client['defisDB']
        
        # Archiver les logs de plus de 90 jours
        cutoff_date = datetime.utcnow() - timedelta(days=90)
        
        if 'logs' in db.list_collection_names():
            result = db.logs.delete_many({
                'createdAt': {'$lt': cutoff_date}
            })
            logging.info(f'✅ {result.deleted_count} logs archivés')
            return result.deleted_count
        else:
            logging.info('ℹ️ Aucune collection logs trouvée')
            return 0
    except Exception as e:
        logging.error(f'❌ Erreur lors de l\'archivage: {str(e)}')
        raise

# ============================================================================
# SECTION 3 : TÂCHES DE SAUVEGARDE
# ============================================================================

def backup_database():
    """💾 Sauvegarder la base de données MongoDB"""
    try:
        import subprocess
        
        logging.info('💾 Démarrage de la sauvegarde MongoDB...')
        
        backup_dir = '/data/backups/liontrack'
        os.makedirs(backup_dir, exist_ok=True)
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_file = os.path.join(backup_dir, f'liontrack_backup_{timestamp}')
        
        # Commande mongodump
        cmd = [
            'mongodump',
            '--uri', MONGODB_URI,
            '--out', backup_file,
            '--gzip'  # Compression automatique
        ]
        
        logging.info(f'🔄 Exécution: {" ".join(cmd)}')
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        
        logging.info(f'✅ Sauvegarde créée: {backup_file}')
        
        # Garder seulement les 7 dernières sauvegardes
        backups = sorted(os.listdir(backup_dir))
        if len(backups) > 7:
            for old_backup in backups[:-7]:
                shutil.rmtree(os.path.join(backup_dir, old_backup))
                logging.info(f'🗑️ Ancienne sauvegarde supprimée: {old_backup}')
        
        return {
            'status': 'success',
            'backup_file': backup_file,
            'timestamp': datetime.utcnow().isoformat()
        }
    except subprocess.CalledProcessError as e:
        logging.error(f'❌ Erreur de sauvegarde: {e.stderr}')
        raise
    except Exception as e:
        logging.error(f'❌ Erreur: {str(e)}')
        raise

# ============================================================================
# SECTION 4 : TÂCHES D'ANALYSE ET STATISTIQUES
# ============================================================================

def generate_daily_statistics():
    """📊 Générer les statistiques quotidiennes"""
    try:
        from pymongo import MongoClient
        
        logging.info('📊 Génération des statistiques quotidiennes...')
        client = MongoClient(MONGODB_URI)
        db = client['defisDB']
        
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Utilisateurs actifs aujourd'hui
        active_users = db.challenges.distinct('user', {
            'updatedAt': {'$gte': today}
        })
        
        # Statistiques globales
        total_users = db.users.count_documents({})
        total_challenges = db.challenges.count_documents({})
        completed_challenges = db.challenges.count_documents({'progress': 100})
        in_progress_challenges = db.challenges.count_documents({
            'progress': {'$gt': 0, '$lt': 100}
        })
        
        # Progression moyenne
        avg_progression = db.challenges.aggregate([
            {'$group': {'_id': None, 'avg': {'$avg': '$progress'}}}
        ])
        avg_progress = list(avg_progression)[0]['avg'] if list(avg_progression) else 0
        
        stats = {
            'date': datetime.utcnow(),
            'active_users_today': len(active_users),
            'total_users': total_users,
            'total_challenges': total_challenges,
            'completed_challenges': completed_challenges,
            'in_progress_challenges': in_progress_challenges,
            'completion_rate': (completed_challenges / total_challenges * 100) if total_challenges > 0 else 0,
            'average_progress': round(avg_progress, 2),
        }
        
        # Sauvegarder les statistiques
        db.statistics.insert_one(stats)
        
        logging.info(f'✅ Statistiques sauvegardées: {stats}')
        return stats
    except Exception as e:
        logging.error(f'❌ Erreur lors de la génération des stats: {str(e)}')
        raise

def generate_user_rankings():
    """🏆 Générer le classement des utilisateurs"""
    try:
        from pymongo import MongoClient
        
        logging.info('🏆 Génération du classement des utilisateurs...')
        client = MongoClient(MONGODB_URI)
        db = client['defisDB']
        
        # Classement par nombre de défis complétés
        rankings = db.challenges.aggregate([
            {'$match': {'progress': 100}},
            {'$group': {
                '_id': '$user',
                'completed_count': {'$sum': 1},
                'total_progress': {'$sum': '$progress'}
            }},
            {'$sort': {'completed_count': -1}},
            {'$limit': 100}
        ])
        
        rankings_list = list(rankings)
        
        # Sauvegarder
        db.rankings.delete_many({})  # Réinitialiser
        if rankings_list:
            db.rankings.insert_many(rankings_list)
        
        logging.info(f'✅ Classement généré avec {len(rankings_list)} utilisateurs')
        return {'users_ranked': len(rankings_list)}
    except Exception as e:
        logging.error(f'❌ Erreur lors de la génération des rankings: {str(e)}')
        raise

# ============================================================================
# SECTION 5 : TÂCHES DE NOTIFICATION
# ============================================================================

def send_daily_digest():
    """📧 Envoyer les digests quotidiens aux utilisateurs"""
    try:
        from pymongo import MongoClient
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart
        
        logging.info('📧 Envoi des digests quotidiens...')
        client = MongoClient(MONGODB_URI)
        db = client['defisDB']
        
        # Configuration email
        smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        smtp_port = int(os.getenv('SMTP_PORT', 587))
        sender_email = os.getenv('SENDER_EMAIL')
        sender_password = os.getenv('SENDER_PASSWORD')
        
        if not (sender_email and sender_password):
            logging.warning('⚠️ Email non configuré, digest non envoyé')
            return {'emails_sent': 0, 'status': 'skipped'}
        
        # Récupérer les utilisateurs avec au moins un défi
        users_with_challenges = list(db.challenges.aggregate([
            {'$group': {
                '_id': '$user',
                'challenge_count': {'$sum': 1},
                'completed': {
                    '$sum': {'$cond': [{'$eq': ['$progress', 100]}, 1, 0]}
                }
            }}
        ]))
        
        email_count = 0
        
        # Envoyer les emails
        for user_data in users_with_challenges:
            user_id = user_data['_id']
            user = db.users.find_one({'_id': user_id})
            
            if user and user.get('email'):
                try:
                    # Créer le message
                    msg = MIMEMultipart()
                    msg['From'] = sender_email
                    msg['To'] = user['email']
                    msg['Subject'] = '🦁 LionTrack - Votre digest quotidien'
                    
                    # Corps du message
                    body = f"""
                    Bonjour {user.get('username', 'Champion')}!
                    
                    📊 Votre résumé du jour:
                    - Défis complétés: {user_data['completed']}/{user_data['challenge_count']}
                    - Taux de complétion: {(user_data['completed']/user_data['challenge_count']*100):.1f}%
                    
                    Continuez vos efforts! 💪
                    
                    LionTrack Team 🦁
                    """
                    
                    msg.attach(MIMEText(body, 'plain'))
                    
                    # Envoyer
                    with smtplib.SMTP(smtp_server, smtp_port) as server:
                        server.starttls()
                        server.login(sender_email, sender_password)
                        server.send_message(msg)
                    
                    email_count += 1
                    logging.info(f'📧 Email envoyé à {user["email"]}')
                except Exception as e:
                    logging.error(f'❌ Erreur envoi email {user["email"]}: {str(e)}')
        
        logging.info(f'✅ {email_count} emails envoyés')
        return {'emails_sent': email_count}
    except Exception as e:
        logging.error(f'❌ Erreur lors de l\'envoi des digests: {str(e)}')
        raise

# ============================================================================
# SECTION 6 : TÂCHES DE DÉPLOIEMENT
# ============================================================================

def check_updates_available():
    """🔄 Vérifier si des mises à jour sont disponibles"""
    try:
        import subprocess
        
        logging.info('🔄 Vérification des mises à jour...')
        
        os.chdir('/app/liontrack')
        
        # Récupérer les mises à jour
        subprocess.run(['git', 'fetch', 'origin'], check=True, capture_output=True)
        
        # Vérifier s'il y a des différences
        result = subprocess.run(
            ['git', 'diff', '--quiet', 'HEAD', 'origin/main'],
            capture_output=True
        )
        
        has_updates = result.returncode != 0
        
        if has_updates:
            logging.info('✅ Mises à jour disponibles')
            return {'has_updates': True}
        else:
            logging.info('ℹ️ Pas de mises à jour')
            return {'has_updates': False}
    except Exception as e:
        logging.error(f'❌ Erreur lors de la vérification: {str(e)}')
        raise

# ============================================================================
# DÉFINITION DES TÂCHES AIRFLOW
# ============================================================================

# Tâches de vérification
task_check_api = PythonOperator(
    task_id='check_api_health',
    python_callable=check_api_health,
    dag=dag,
)

task_check_db = PythonOperator(
    task_id='check_database_health',
    python_callable=check_database_health,
    dag=dag,
)

# Tâches de maintenance
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

# Tâche de sauvegarde
task_backup = PythonOperator(
    task_id='backup_database',
    python_callable=backup_database,
    dag=dag,
)

# Tâches d'analyse
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

# Tâche de notification
task_digest = PythonOperator(
    task_id='send_daily_digest',
    python_callable=send_daily_digest,
    dag=dag,
)

# Tâche de déploiement
task_check_updates = PythonOperator(
    task_id='check_updates_available',
    python_callable=check_updates_available,
    dag=dag,
)

# ============================================================================
# DÉFINITION DES DÉPENDANCES
# ============================================================================

# Phase 1 : Vérifications (parallèle)
(task_check_api >> task_check_db) >> [task_clean_sessions, task_clean_logs, task_backup]

# Phase 2 : Sauvegarde puis statistiques
task_backup >> task_stats

# Phase 3 : Statistiques puis analyses
task_stats >> task_rankings

# Phase 4 : Analyses puis notifications
task_rankings >> task_digest

# Phase 5 : Vérification des mises à jour (indépendant)
task_check_api >> task_check_updates
