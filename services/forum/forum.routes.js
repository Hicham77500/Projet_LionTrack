/**
 * Forum Routes - Template pour intégration backend
 * À adapter selon votre architecture (Sequelize, MongoDB, etc.)
 */

const express = require('express');
const router = express.Router();
const forumController = require('./forum.controller');
const authJwt = require('../../app/middlewares/authJwt');

// ==================== SUBJECTS ====================

/**
 * GET /api/forum/subjects
 * Récupère tous les sujets avec pagination/filtrage
 */
router.get('/subjects', forumController.getSubjects);

/**
 * GET /api/forum/subjects/:id
 * Récupère un sujet spécifique
 */
router.get('/subjects/:id', forumController.getSubjectById);

/**
 * POST /api/forum/subjects
 * Crée un nouveau sujet
 */
router.post('/subjects', authJwt.verifyToken, forumController.createSubject);

/**
 * PUT /api/forum/subjects/:id
 * Met à jour un sujet (auteur uniquement)
 */
router.put('/subjects/:id', authJwt.verifyToken, forumController.updateSubject);

/**
 * DELETE /api/forum/subjects/:id
 * Supprime un sujet (modérateur/auteur)
 */
router.delete('/subjects/:id', authJwt.verifyToken, forumController.deleteSubject);

// ==================== MODERATOR ACTIONS ====================

/**
 * POST /api/forum/subjects/:id/pin
 * Épingle un sujet (modérateur)
 */
router.post('/subjects/:id/pin', authJwt.verifyToken, forumController.pinSubject);

/**
 * POST /api/forum/subjects/:id/unpin
 * Désépingle un sujet (modérateur)
 */
router.post('/subjects/:id/unpin', authJwt.verifyToken, forumController.unpinSubject);

/**
 * POST /api/forum/subjects/:id/lock
 * Verrouille un sujet (modérateur)
 */
router.post('/subjects/:id/lock', authJwt.verifyToken, forumController.lockSubject);

/**
 * POST /api/forum/subjects/:id/unlock
 * Déverrouille un sujet (modérateur)
 */
router.post('/subjects/:id/unlock', authJwt.verifyToken, forumController.unlockSubject);

// ==================== CATEGORIES ====================

/**
 * GET /api/forum/categories
 * Récupère toutes les catégories
 */
router.get('/categories', forumController.getCategories);

/**
 * POST /api/forum/categories
 * Crée une catégorie (admin)
 */
router.post('/categories', authJwt.verifyToken, forumController.createCategory);

// ==================== TRENDING ====================

/**
 * GET /api/forum/trending
 * Récupère les sujets tendances
 */
router.get('/trending', forumController.getTrending);

// ==================== REPLIES ====================

/**
 * GET /api/forum/subjects/:id/replies
 * Récupère les réponses d'un sujet
 */
router.get('/subjects/:id/replies', forumController.getReplies);

/**
 * POST /api/forum/subjects/:id/replies
 * Ajoute une réponse
 */
router.post('/subjects/:id/replies', authJwt.verifyToken, forumController.createReply);

/**
 * DELETE /api/forum/subjects/:id/replies/:replyId
 * Supprime une réponse
 */
router.delete('/subjects/:id/replies/:replyId', authJwt.verifyToken, forumController.deleteReply);

module.exports = router;
