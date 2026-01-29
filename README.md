# LionTrack - Application de Suivi des Défis Personnels

## 📋 À propos du projet

**Lion Mindset** est une application web motivante qui vous aide à suivre vos défis personnels et à développer une mentalité de champion. Avec une interface moderne et intuitive, vous pouvez créer des défis personnalisés, suivre votre progression et célébrer vos réussites.

Application déployée en production sur **Microsoft Azure** avec orchestration automatique via **Apache Airflow** pour les tâches de maintenance quotidiennes.

## ✨ Fonctionnalités

- 🔐 Authentification sécurisée (inscription/connexion)
- 🏆 Création et gestion de défis personnels
- 📊 Tableau de bord avec statistiques et graphiques
- 📈 Suivi visuel de progression
- 🎯 Catégorisation des défis (physique, mental, nutrition, etc.)
- 🎖️ Système de rangs et récompenses
- 🎨 Thème Lion Mindset (Rouge sombre)
- ☁️ Déploiement cloud Microsoft Azure
- 🤖 Orchestration Airflow avec tests automatisés quotidiens

## 🌐 Accès en Ligne

L'application est actuellement déployée et accessible à:
```
https://liontrack-fxerefd7gneqfqac.canadacentral-01.azurewebsites.net
```

**Statut**: ✅ Production - Actif et fonctionnel

## 🛠️ Prérequis

### Pour le développement local
- [Node.js](https://nodejs.org/) (v18 ou plus recommandé)
- [MongoDB](https://www.mongodb.com/try/download/community) (v4.4 ou plus) OU MongoDB Atlas (cloud)
- [npm](https://www.npmjs.com/) (généralement installé avec Node.js)
- Un navigateur web moderne (Chrome, Firefox, Edge, Safari)

### Pour Airflow (optionnel)
- Python 3.8+
- Apache Airflow 2.0+
- Docker et Docker Compose (pour utiliser docker-compose-airflow.yml)

## 🚀 Installation

### Option 1: Accéder à la version en ligne
L'application est déjà déployée en production. Accédez simplement à:
```
https://liontrack-fxerefd7gneqfqac.canadacentral-01.azurewebsites.net
```

### Option 2: Installation locale pour le développement

Suivez ces étapes pour installer et configurer le projet sur votre machine:

1. **Clonez le dépôt**
   ```bash
   git clone https://github.com/votre-username/Projet_LionTrack.git
   cd Projet_LionTrack
   ```

2. **Installez les dépendances**
   ```bash
   npm install
   ```

3. **Créez un fichier `.env` à la racine du projet**
   ```
   PORT=3000
   NODE_ENV=development
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/defisDB
   JWT_SECRET=votre_clé_secrète_très_complexe_min_32_caractères
   ```

4. **Démarrage local**
   ```bash
   npm run dev   # mode développement
   # ou
   npm start     # mode production
   ```

### Option 3: Déployer avec Airflow

Voir [AIRFLOW_SETUP.md](AIRFLOW_SETUP.md) pour:
- Configuration d'Apache Airflow
- Tests automatisés quotidiens
- Tâches de maintenance programmées
- Orchest ration via Docker Compose

## ⚙️ Configuration

### Configuration de la base de données

Le projet utilise **MongoDB Atlas** (cloud) ou MongoDB local.

**Pour MongoDB Atlas (recommandé)**:
1. Créez un compte sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Créez un cluster (gratuit M0)
3. Obtenez la chaîne de connexion (mongodb+srv://...)
4. Configurez-la dans votre fichier `.env` comme `MONGODB_URI`

**Pour MongoDB local**:
- Assurez-vous que MongoDB est en cours d'exécution
- Utilisez: `MONGODB_URI=mongodb://localhost:27017/defisDB`

### Configuration de l'authentification

L'application utilise **JWT** (JSON Web Tokens) pour l'authentification. 
- Générez une clé secrète sécurisée (minimum 32 caractères)
- Stockez-la dans votre fichier `.env` comme `JWT_SECRET`

### Configuration Azure (Production)

Pour déployer sur Azure:
1. Créez une **Azure App Service** avec Node.js 20 LTS
2. Configurez les variables d'environnement dans le portail Azure
3. Poussez votre code sur GitHub pour déclencher le CI/CD automatique

Les fichiers de déploiement sont présents:
- `web.config` - Configuration IIS
- `.deployment` - Configuration de déploiement Azure
- `deploy.sh` - Script de déploiement

Pour les **GitHub Actions** - Consultez `.github/workflows/` pour le CI/CD

## 🏃‍♂️ Démarrage

### Mode développement local

```bash
npm run dev
```

### Mode production local

```bash
npm start
```

### Production en ligne

L'application est accessible à:
```
https://liontrack-fxerefd7gneqfqac.canadacentral-01.azurewebsites.net
```

L'application sera accessible localement à: `http://localhost:3000`

### Airflow - Tests et Maintenance automatisés

Pour démarrer Airflow avec Docker Compose:
```bash
docker-compose -f docker-compose-airflow.yml up -d
# Accédez à l'interface Web: http://localhost:8080
```

**DAG quotidien**: `liontrack_daily_operations`
- Exécution: Tous les jours à 2h du matin UTC
- Tests: 3 tests unitaires ✅
- Maintenance: 6 tâches de maintenance (SKIPPED si pymongo non disponible)

## 📁 Structure du projet

```
Projet_LionTrack/
├── app/                      # Logique principale de l'application
│   ├── middlewares/          # Middlewares Express (authJwt, role, etc.)
│   └── models/               # Modèles de données Mongoose
├── public/                   # Fichiers statiques frontend
│   ├── css/                  # Feuilles de style
│   │   ├── style.css
│   │   ├── lion-theme.css
│   │   ├── navbar.css
│   │   ├── modal-styles.css
│   │   └── challenge-styles.css
│   ├── js/                   # Scripts frontend
│   │   ├── main.js
│   │   ├── auth-ui.js
│   │   ├── challenge-ui.js
│   │   ├── chart-manager.js
│   │   └── rank-system.js
│   ├── manifest.json         # PWA Configuration
│   └── sw.js                 # Service Worker
├── services/                 # Services backend
│   ├── auth/                 # Service d'authentification
│   │   ├── auth.controller.js
│   │   └── auth.routes.js
│   ├── challenge/            # Service de gestion des défis
│   │   ├── challenge.controller.js
│   │   ├── challenge.model.js
│   │   └── challenge.routes.js
│   └── user/                 # Service de gestion des utilisateurs
│       ├── user.controller.js
│       ├── user.model.js
│       ├── role.model.js
│       └── user.routes.js
├── airflow/                  # Apache Airflow
│   ├── dags/
│   │   └── liontrack_dag.py  # DAG principal (tests + maintenance)
│   ├── plugins/
│   ├── logs/
│   └── airflow.cfg
├── config/                   # Configuration
│   ├── auth.config.js
│   └── db.config.js
├── .github/
│   └── workflows/            # GitHub Actions CI/CD
├── .env                      # Variables d'environnement (ne pas committer)
├── .env.example              # Template variables d'environnement
├── web.config                # Configuration IIS pour Azure
├── .deployment               # Configuration de déploiement Azure
├── deploy.sh                 # Script de déploiement
├── docker-compose-airflow.yml # Configuration Docker Compose Airflow
├── server.js                 # Point d'entrée du serveur Express
├── package.json              # Dépendances et scripts npm
├── CHANGELOG.md              # Historique des modifications
├── README.md                 # Ce fichier
├── AIRFLOW_SETUP.md          # Guide configuration Airflow
└── LICENSE                   # Licence MIT
```

## 🌥️ Déploiement

### Déploiement sur Microsoft Azure

**Prérequis:**
- Compte Microsoft Azure
- Souscription active (ou crédit gratuit)

**Processus de déploiement:**
1. **Création de l'App Service**
   - Région: Canada Central
   - Runtime: Node.js 20 LTS
   - Plan: Basic (B1) - ~€13/mois

2. **Configuration des variables d'environnement** dans le portail Azure:
   ```
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/defisDB
   JWT_SECRET=votre_clé_secrète_complexe
   NODE_ENV=production
   ```

3. **Activation du CI/CD** avec GitHub Actions
   - Push sur `main` déclenche déploiement automatique
   - Statut visible dans l'onglet "Actions" de GitHub

4. **Accès en production**:
   ```
   https://liontrack-fxerefd7gneqfqac.canadacentral-01.azurewebsites.net
   ```

### Configuration MongoDB Atlas

**Étapes:**
1. Créer un compte sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Créer un cluster (M0 gratuit recommandé)
3. Configurer les accès IP (autoriser toutes les adresses: 0.0.0.0/0)
4. Créer un utilisateur de base de données
5. Obtenir la chaîne de connexion `mongodb+srv://...`

### Configuration Airflow

Consultez [AIRFLOW_SETUP.md](AIRFLOW_SETUP.md) pour:
- Installation locale d'Airflow
- Configuration Docker Compose
- Gestion des secrets et variables
- Monitoring des tâches

## 💻 Utilisation

1. **Inscription / Connexion**
   - Créez un compte ou connectez-vous avec un compte existant
   
2. **Créer un défi**
   - Cliquez sur "Créer un défi"
   - Remplissez le titre, la description, la catégorie et la progression initiale
   - Validez en cliquant sur "Créer"
   
3. **Gérer vos défis**
   - Visualisez tous vos défis sur votre tableau de bord
   - Mettez à jour la progression en cliquant sur "Mettre à jour"
   - Modifiez ou supprimez un défi via les icônes correspondantes
   
4. **Consulter vos statistiques**
   - Visualisez votre progression globale sur le tableau de bord
   - Suivez l'évolution de vos défis via le graphique

## 🔧 Dépannage

### Problèmes courants

1. **Erreur de connexion à MongoDB**
   - Vérifiez que MongoDB est bien lancé (local) ou que l'URI est correcte (MongoDB Atlas)
   - Vérifiez l'URL de connexion dans votre fichier `.env`
   - Si MongoDB Atlas: vérifiez que votre adresse IP est autorisée dans les Network Access

2. **Erreur lors de l'authentification**
   - Assurez-vous d'avoir une clé `JWT_SECRET` valide (minimum 32 caractères)
   - Vérifiez les logs du serveur pour plus de détails
   - Videz les cookies du navigateur et reconnectez-vous

3. **Interface utilisateur ne se charge pas correctement**
   - Videz le cache de votre navigateur (Ctrl+Shift+Del ou Cmd+Shift+Del)
   - Assurez-vous d'utiliser un navigateur récent
   - Vérifiez la console de développement (F12) pour les erreurs JavaScript

4. **Problème de déploiement Azure**
   - Vérifiez les logs dans le portail Azure: "App Service > Logs > Log stream"
   - Assurez-vous que les variables d'environnement sont définies
   - Vérifiez que le fichier `package.json` a un script `start` valide

5. **Problème Airflow DAG non chargé**
   - Vérifiez la syntaxe Python: `python -m py_compile airflow/dags/liontrack_dag.py`
   - Assurez-vous que les dépendances Airflow sont installées
   - Vérifiez les logs Airflow dans le dossier `logs/`

## 📊 Architecture et Technologie

**Frontend:**
- HTML5, CSS3, JavaScript vanilla
- Progressive Web App (PWA)
- Charts.js pour les graphiques
- Service Worker pour le fonctionnement hors ligne

**Backend:**
- Express.js (Node.js)
- MongoDB / MongoDB Atlas
- JWT (JSON Web Tokens) pour l'authentification
- Bcrypt pour le hachage des mots de passe

**DevOps & Orchestration:**
- Microsoft Azure App Service (production)
- Apache Airflow (orchestration et tests)
- GitHub Actions (CI/CD automatisé)
- Docker & Docker Compose

## 📞 Support et contribution

Pour toute question ou problème:
- Ouvrez une issue sur le dépôt GitHub
- Consultez la documentation: [AIRFLOW_SETUP.md](AIRFLOW_SETUP.md)
- Vérifiez les logs: `logs/` ou Azure App Service logs

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

© 2025 Lion Mindset. Tous droits réservés.
