// services/user/user.routes.js
const express = require('express');
const router = express.Router();
const userController = require('./user.controller');

// Correction du chemin d'importation du middleware
const authJwt = require('../../app/middlewares/authJwt');

// Route pour obtenir le profil de l'utilisateur
router.get('/profile', authJwt.verifyToken, userController.getProfile);

// Route pour mettre à jour le profil de l'utilisateur
router.put('/profile', authJwt.verifyToken, userController.updateUser);

module.exports = router;