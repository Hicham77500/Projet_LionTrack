require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dbConfig = require('./config/db.config');

// Importation des routes
const authRoutes = require('./services/auth/auth.routes');
const userRoutes = require('./services/user/user.routes');
const challengeRoutes = require('./services/challenge/challenge.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

// Route de base
app.get('/', (req, res) => {
  res.send('Bienvenue sur l\'API Défis Personnels');
});

// Utilisation des routes
app.use('/api/auth', authRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/users', userRoutes);

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