// services/weight/weight.routes.js
const express = require('express');
const router = express.Router();
const weightController = require('./weight.controller');
const authJwt = require('../../app/middlewares/authJwt');

// Toutes les routes nécessitent une authentification

// Créer une nouvelle pesée
router.post('/', authJwt.verifyToken, weightController.createWeight);

// Récupérer toutes les pesées de l'utilisateur
router.get('/', authJwt.verifyToken, weightController.getAllWeights);

// Récupérer la dernière pesée
router.get('/latest', authJwt.verifyToken, weightController.getLatestWeight);

// Récupérer les statistiques
router.get('/stats', authJwt.verifyToken, weightController.getWeightStats);

// Récupérer une pesée spécifique par son ID
router.get('/:id', authJwt.verifyToken, weightController.getWeightById);

// Mettre à jour une pesée par son ID
router.put('/:id', authJwt.verifyToken, weightController.updateWeight);

// Supprimer une pesée par son ID
router.delete('/:id', authJwt.verifyToken, weightController.deleteWeight);

module.exports = router;
