// app/routes/challenge.routes.js
const express = require('express');
const router = express.Router();
const challengeController = require('./challenge.controller');
const authJwt = require('../../app/middlewares/authJwt');

// Créer un nouveau défi
router.post('/', authJwt.verifyToken, challengeController.createChallenge);

// Récupérer tous les défis de l'utilisateur connecté
router.get('/', authJwt.verifyToken, challengeController.getAllChallenges);

// Récupérer un défi spécifique par son ID
router.get('/:id', authJwt.verifyToken, challengeController.getChallengeById);

// Mettre à jour un défi par son ID
router.put('/:id', authJwt.verifyToken, challengeController.updateChallenge);

// Supprimer un défi par son ID
router.delete('/:id', authJwt.verifyToken, challengeController.deleteChallenge);

module.exports = router;