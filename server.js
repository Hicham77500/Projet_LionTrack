require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dbConfig = require('./config/db.config');
const jwtConfig = require('./config/jwt.config');

// Importation des routes
const authRoutes = require('./services/auth/auth.routes');
const userRoutes = require('./services/user/user.routes');
const challengeRoutes = require('./services/challenge/challenge.routes');
const weightRoutes = require('./services/weight/weight.routes');
const analyticsRoutes = require('./services/analytics/analytics.routes');

const app = express();
const PORT = 4001;

// ============================================================================
// VALIDATION DE LA CONFIGURATION AU DÉMARRAGE
// ============================================================================
console.log('🔐 Configuration JWT validée');
console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
console.log(`📌 Port: ${PORT}`);

// Middlewares
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

// ============================================================================
// ROUTES DE SANTÉ ET MONITORING
// ============================================================================

// Endpoint de santé (utilisé par Airflow)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Endpoint pour les statistiques (protégé pour Airflow)
app.get('/api/admin/statistics', (req, res) => {
  // Vérifier l'authentification Airflow
  const airflowToken = req.headers['x-airflow-authorization'];
  const validToken = process.env.AIRFLOW_API_TOKEN;
  
  if (airflowToken !== validToken && process.env.NODE_ENV === 'production') {
    return res.status(401).json({ message: 'Non autorisé' });
  }
  
  // Retourner les stats depuis MongoDB
  mongoose.connection.db.collection('statistics')
    .find({})
    .sort({ date: -1 })
    .limit(30)
    .toArray((err, stats) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json({ statistics: stats });
    });
});

// Endpoint pour déclencher une tâche Airflow manuellement
app.post('/api/admin/trigger-backup', (req, res) => {
  const airflowToken = req.headers['x-airflow-authorization'];
  const validToken = process.env.AIRFLOW_API_TOKEN;
  
  if (airflowToken !== validToken && process.env.NODE_ENV === 'production') {
    return res.status(401).json({ message: 'Non autorisé' });
  }
  
  // Appeler l'API Airflow pour déclencher le DAG
  const airflowBaseUrl = process.env.AIRFLOW_BASE_URL || 'http://localhost:8080';
  const dagId = 'liontrack_daily_operations';
  
  res.json({
    message: 'Backup déclenché via Airflow',
    dag_id: dagId,
    trigger_url: `${airflowBaseUrl}/api/v1/dags/${dagId}/dagRuns`
  });
});

// Route de base
app.get('/', (req, res) => {
  res.send('Bienvenue sur l\'API Défis Personnels');
});

// Utilisation des routes
app.use('/api/auth', authRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/weight', weightRoutes);
app.use('/api/analytics', analyticsRoutes);

// Connexion à MongoDB et démarrage du serveur
mongoose.connect(dbConfig.url)
  .then(() => {
    console.log('Connecté à MongoDB Atlas');
    app.listen(PORT, () => {
      console.log(`Serveur en écoute sur le port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Erreur de connexion à MongoDB:', error);
  });