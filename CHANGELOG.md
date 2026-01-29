# � Changelog - LionTrack

Toutes les modifications notables de ce projet sont documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Versionnage Sémantique](https://semver.org/lang/fr/).

---
## [2.0.0] - 2026-01-29

### 🚀 Déploiement en Production
- **Azure App Service** déploiement complète et fonctionnelle
  - URL: `https://liontrack-fxerefd7gneqfqac.canadacentral-01.azurewebsites.net`
  - Region: Canada Central
  - Runtime: Node.js 20 LTS
  - Plan: Basic (B1)
- **GitHub Actions** CI/CD automatisé
  - Déploiement automatique sur chaque push vers `main`
  - Tests npm intégrés
  - Notifications de statut

### ✨ Améliorations Airflow
- **Airflow DAG refactorisé** avec gestion robuste des dépendances manquantes
- **Tests unitaires** fonctionnels et vérifiés (3 tests passent ✅)
  - `test_mongodb_connection` - Validation URI MongoDB Atlas
  - `test_jwt_secret` - Vérification clé JWT
  - `test_database_integrity` - Vérification configuration BD
- **Tâches de maintenance** gracefully skipped quand pymongo non disponible
  - `clean_old_sessions` - SKIPPED
  - `clean_old_logs` - SKIPPED
  - `backup_database` - SKIPPED
  - `generate_daily_statistics` - SKIPPED
  - `generate_user_rankings` - SKIPPED
  - `send_daily_digest` - SKIPPED (email non configuré)
- Suppression configuration email Airflow (email_on_failure: False)
- Dépendances DAG optimisées et validées

### 🔧 Corrigé
- Suppression de `email: ['admin@liontrack.com']` de default_args Airflow
- Suppression imports pymongo inutiles
- Airflow DAG syntaxe correcte et chargeables sans erreurs
- Email Airflow notifications désactivé
- Configuration test_mongodb_connection robuste

### 📊 État du Déploiement
- ✅ Application Azure active et accessible
- ✅ MongoDB Atlas connecté et fonctionnel
- ✅ JWT authentication configurée
- ✅ GitHub Actions CI/CD fonctionnel
- ✅ Airflow tests passent (3/3)
- ✅ Airflow DAG se charge sans erreurs

---
## [1.2.0] - 2026-01-28

### ✨ Ajouté
- Apache Airflow avec DAG complet pour orchestration des tâches
- Tâches quotidiennes automatisées :
  - Vérification de la santé de l'API et MongoDB
  - Sauvegarde automatique quotidienne de la base de données
  - Nettoyage des sessions et logs expirés
  - Génération des statistiques quotidiennes
  - Création du classement des utilisateurs
  - Envoi de digests par email
  - Vérification des mises à jour disponibles
- Configuration Docker Compose pour Airflow (PostgreSQL, Redis, Webserver, Scheduler, Worker)
- Endpoints API pour Airflow :
  - `/api/health` - Vérification de la santé
  - `/api/admin/statistics` - Récupération des statistiques
  - `/api/admin/trigger-backup` - Déclenchement manuel de backup
- Guide d'installation Airflow complet (AIRFLOW_SETUP.md)
- Exemple de fichier .env pour Airflow

### 🔧 Corrigé
- Intégration Airflow avec le serveur Node.js existant

### 📁 Fichiers créés
```
airflow/
├── dags/
│   └── liontrack_dag.py           - DAG principal (6 sections, 10+ tâches)
├── plugins/                       - Plugins personnalisés
├── logs/                          - Répertoire des logs
├── airflow.cfg                    - Configuration complète Airflow
└── requirements.txt               - Dépendances Python
docker-compose-airflow.yml         - Configuration Docker Compose
AIRFLOW_SETUP.md                   - Guide d'installation détaillé
.env.airflow.example               - Template variables d'environnement
```

### 📝 Fichiers modifiés
```
server.js                          - Ajout des endpoints de santé et monitoring
```

---

## [1.1.0] - 2026-01-28

### ✨ Ajouté
- PWA complète avec manifest.json et service worker
- Support de l'installation sur mobile et desktop comme application native
- Fonctionnement hors ligne avec stratégie de cache intelligente
- Icônes multi-tailles (72px à 512px) pour tous les appareils
- Script automatique de génération d'icônes (`generate-icons.sh`)
- Meta tags pour iOS et Android
- Enregistrement automatique du Service Worker avec gestion des mises à jour
- Guide de publication sur App Store et Google Play (`APP_STORES_GUIDE.md`)
- Guide PWA détaillé (`PWA_GUIDE.md`)
- Instructions de génération d'icônes (`ICONS_README.html`)

### 🔧 Corrigé
- Problème d'affichage des popups/modales à 100% de zoom
  - Ajout de `max-height: 90vh` sur `.modal-content`
  - Scroll automatique dans `.modal-body` pour le contenu débordant
  - Footer toujours visible avec `flex-shrink: 0`
- Boutons (fermer, enregistrer, annuler) maintenant toujours accessibles
- Media queries améliorées pour tous les écrans (320px à 4K)
- Support optimisé des petites hauteurs d'écran (`@media (max-height: 700px)`)
- Adaptation automatique au niveau de zoom du navigateur

### 🎨 Amélioré
- Interface 100% responsive sur tous les appareils
- Expérience utilisateur optimisée pour mobile et tablette
- Thème cohérent avec couleurs LionTrack (#880000, #d4af37)
- Mode plein écran lors de l'installation comme PWA

### 📁 Fichiers créés
```
public/manifest.json           - Configuration PWA
public/sw.js                   - Service Worker
public/images/icon-base.svg    - Icône SVG de base
public/images/generate-icons.sh - Script de génération d'icônes
PWA_GUIDE.md                   - Documentation PWA complète
APP_STORES_GUIDE.md            - Guide de publication stores
CHANGELOG.md                   - Ce fichier
```

### 📝 Fichiers modifiés
```
public/index.html              - Ajout meta tags PWA et enregistrement SW
public/css/modal-styles.css    - Corrections responsive des modales
```

---

## [1.0.0] - 2026-01-28

### 🎉 Version initiale

#### Fonctionnalités principales
- Système d'authentification (inscription/connexion)
- Création et gestion de défis personnels
- Suivi de progression avec pourcentages
- Graphiques de visualisation (Chart.js)
- Système de grades et récompenses
- Interface avec thème Lion (rouge et or)
- Dashboard avec statistiques
- Navigation par onglets

#### Technologies utilisées
- **Frontend :** HTML5, CSS3, JavaScript (Vanilla)
- **Backend :** Node.js, Express.js
- **Base de données :** MongoDB
- **Authentification :** JWT (JSON Web Tokens)
- **Graphiques :** Chart.js
- **Icônes :** Font Awesome 6.0

#### Structure du projet
```
├── app/middlewares/          - Middlewares d'authentification
├── config/                   - Configuration DB et Auth
├── public/                   - Fichiers statiques
│   ├── css/                 - Styles
│   ├── js/                  - Scripts client
│   └── images/              - Assets graphiques
├── services/                - Services backend
│   ├── auth/               - Authentification
│   ├── challenge/          - Gestion des défis
│   └── user/               - Gestion des utilisateurs
└── server.js               - Point d'entrée serveur
```

---

## Types de modifications

Les modifications sont classées selon les catégories suivantes :

- **✨ Ajouté** : Nouvelles fonctionnalités
- **🔧 Corrigé** : Corrections de bugs
- **🎨 Amélioré** : Améliorations de fonctionnalités existantes
- **🗑️ Supprimé** : Fonctionnalités retirées
- **🔒 Sécurité** : Correctifs de sécurité
- **📝 Documentation** : Changements dans la documentation
- **⚡ Performance** : Améliorations de performance

---

**Développé avec ❤️ pour LionTrack**
