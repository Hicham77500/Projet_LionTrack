// services/auth/auth.routes.js

const express = require('express');
const router = express.Router();

// Contrôleur d'authentification
const authController = require('./auth.controller');

// Middlewares
const verifySignUp = require('../../app/middlewares/verifySignUp');
const authJwt = require('../../app/middlewares/authJwt');
const roleMiddleware = require('../../app/middlewares/role.middleware');

/**
 * Route d'inscription
 * - Vérifie si l'email ou le username existe déjà (verifySignUp.checkDuplicateEmailOrUsername)
 * - En cas de doublon, renvoie une erreur
 * - Sinon, exécute la logique d'inscription (authController.register)
 */
router.post(
  '/register',
  verifySignUp.checkDuplicateEmailOrUsername,
  authController.register
);

/**
 * Route de connexion
 * - Exécute la logique de connexion (authController.login)
 * - Retourne un token JWT si les identifiants sont valides
 */
router.post('/login', authController.login);

/**
 * Exemple de route protégée par JWT + rôle admin
 * - Vérifie d'abord le token (authJwt.verifyToken)
 * - Vérifie ensuite que l'utilisateur a le rôle 'admin' (roleMiddleware.isAdmin)
 * - Si OK, renvoie un message
 */
router.get('/admin', authJwt.verifyToken, roleMiddleware.isAdmin, (req, res) => {
  res.json({ message: 'Contenu accessible seulement par un admin' });
});

module.exports = router;