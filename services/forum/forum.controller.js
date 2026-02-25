/**
 * Forum Controller - Template pour intégration backend
 * À implémenter selon vos models et ORM
 */

/**
 * Récupère tous les sujets
 * GET /api/forum/subjects
 * Query params: page, limit, sort, category, search
 */
exports.getSubjects = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = 'recent', category, search } = req.query;

    // TODO: Implémenter la logique
    // - Filtrer par catégorie si fourni
    // - Chercher dans les titres/excerpts si search fourni
    // - Trier selon sort (recent, popular, unanswered)
    // - Paginer
    // - Joindre author et category

    res.json({
      subjects: [],
      totalCount: 0,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

/**
 * Récupère un sujet par ID
 * GET /api/forum/subjects/:id
 */
exports.getSubjectById = async (req, res) => {
  try {
    const { id } = req.params;

    // TODO: Implémenter
    // - Récupérer le sujet par ID
    // - Incrémenter les vues
    // - Joindre author et replies

    res.json({
      subject: null,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

/**
 * Crée un nouveau sujet
 * POST /api/forum/subjects
 */
exports.createSubject = async (req, res) => {
  try {
    const { title, excerpt, message, categoryId, tags } = req.body;
    const authorId = req.userId; // Du middleware authJwt

    // Validations
    if (!title || !message || !categoryId) {
      return res.status(400).json({ message: 'Champs obligatoires manquants' });
    }

    if (title.length > 200) {
      return res.status(400).json({ message: 'Le titre ne doit pas dépasser 200 caractères' });
    }

    // TODO: Implémenter
    // - Créer le sujet
    // - Créer des notifications pour les abonnés
    // - Retourner le sujet créé

    res.status(201).json({
      subject: null,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

/**
 * Met à jour un sujet
 * PUT /api/forum/subjects/:id
 */
exports.updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, message } = req.body;
    const userId = req.userId;

    // TODO: Implémenter
    // - Vérifier que l'utilisateur est l'auteur ou modérateur
    // - Mettre à jour le sujet
    // - Retourner le sujet mis à jour

    res.json({ subject: null });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

/**
 * Supprime un sujet
 * DELETE /api/forum/subjects/:id
 */
exports.deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // TODO: Implémenter
    // - Vérifier permissions (auteur ou modérateur)
    // - Supprimer le sujet et ses replies
    // - Retourner succès

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

/**
 * Épingle un sujet
 * POST /api/forum/subjects/:id/pin
 */
exports.pinSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const user = req.user; // Ajouté par authJwt

    // Vérifier modérateur
    if (user.role !== 'moderator' && user.role !== 'admin') {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    // TODO: Implémenter
    // - Épingler le sujet (pinned = true)
    // - Envoyer notification à l'auteur

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

/**
 * Désépingle un sujet
 * POST /api/forum/subjects/:id/unpin
 */
exports.unpinSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (user.role !== 'moderator' && user.role !== 'admin') {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    // TODO: Implémenter (pinned = false)

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

/**
 * Verrouille un sujet
 * POST /api/forum/subjects/:id/lock
 */
exports.lockSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (user.role !== 'moderator' && user.role !== 'admin') {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    // TODO: Implémenter (locked = true)

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

/**
 * Déverrouille un sujet
 * POST /api/forum/subjects/:id/unlock
 */
exports.unlockSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (user.role !== 'moderator' && user.role !== 'admin') {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    // TODO: Implémenter (locked = false)

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

/**
 * Récupère les catégories
 * GET /api/forum/categories
 */
exports.getCategories = async (req, res) => {
  try {
    // TODO: Implémenter
    // - Récupérer toutes les catégories
    // - Inclure count de sujets par catégorie

    res.json([]);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

/**
 * Crée une catégorie
 * POST /api/forum/categories
 */
exports.createCategory = async (req, res) => {
  try {
    const { name, description, icon, color } = req.body;
    const user = req.user;

    // Vérifier admin
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    // TODO: Implémenter

    res.status(201).json({ category: null });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

/**
 * Récupère les sujets tendances
 * GET /api/forum/trending
 */
exports.getTrending = async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    // TODO: Implémenter
    // - Récupérer les top N sujets par vues
    // - Limiter à une période (7 jours)

    res.json([]);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

/**
 * Récupère les réponses d'un sujet
 * GET /api/forum/subjects/:id/replies
 */
exports.getReplies = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // TODO: Implémenter
    // - Récupérer les replies du sujet
    // - Paginer
    // - Joindre author

    res.json({ replies: [] });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

/**
 * Crée une réponse
 * POST /api/forum/subjects/:id/replies
 */
exports.createReply = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const userId = req.userId;

    if (!message) {
      return res.status(400).json({ message: 'Le message est obligatoire' });
    }

    // TODO: Implémenter
    // - Créer la reply
    // - Incrementer replies count du subject
    // - Notifier l'auteur et les abonnés

    res.status(201).json({ reply: null });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

/**
 * Supprime une réponse
 * DELETE /api/forum/subjects/:id/replies/:replyId
 */
exports.deleteReply = async (req, res) => {
  try {
    const { id, replyId } = req.params;
    const userId = req.userId;
    const user = req.user;

    // TODO: Implémenter
    // - Vérifier permissions (auteur ou modérateur)
    // - Supprimer la reply
    // - Décrémenter replies count
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};
