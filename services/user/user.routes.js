// services/user/user.routes.js
const express = require('express');
const router = express.Router();
const userController = require('./user.controller');
const authJwt = require('../../app/middlewares/authJwt'); // <-- Chemin corrigé

// Route pour récupérer le profil
router.get('/profile', authJwt.verifyToken, userController.getProfile);

// Route pour mettre à jour le profil
router.put('/profile', authJwt.verifyToken, userController.updateProfile);

module.exports = router;