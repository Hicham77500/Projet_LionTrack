/**
 * GUIDE D'INTÉGRATION DU FORUM - Modification de server.js
 * 
 * Ajoutez les lignes suivantes à votre server.js
 */

// ============================================================================
// 1. Ajoutez l'import en haut du fichier (après les autres imports de routes)
// ============================================================================

// Importer les routes du forum
const forumRoutes = require('./services/forum/forum.routes');

// ============================================================================
// 2. Enregistrez les routes (après les autres app.use)
// ============================================================================

// Routes du forum
app.use('/api/forum', forumRoutes);

// ============================================================================
// 3. COMPLET - Voici comment votre server.js devrait ressembler
// ============================================================================

/*
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
const forumRoutes = require('./services/forum/forum.routes');  // <-- AJOUTER

const app = express();
const PORT = 4001;

// ...middlewares...

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/weight', weightRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/forum', forumRoutes);  // <-- AJOUTER

// ...rest of server.js
*/

// ============================================================================
// 4. ALTERNATIVES - Selon votre architecture
// ============================================================================

/**
 * Option A: Si vous utilisez un router centralisé
 */
/*
// Dans un fichier router.js central
const apiRouter = express.Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/user', userRoutes);
apiRouter.use('/challenges', challengeRoutes);
apiRouter.use('/weight', weightRoutes);
apiRouter.use('/analytics', analyticsRoutes);
apiRouter.use('/forum', forumRoutes);  // <-- AJOUTER

app.use('/api', apiRouter);
*/

/**
 * Option B: Avec préfixe de versioning
 */
/*
// Routes v1
const v1Router = express.Router();

v1Router.use('/auth', authRoutes);
v1Router.use('/forum', forumRoutes);  // <-- AJOUTER

app.use('/api/v1', v1Router);
*/

// ============================================================================
// 5. CONFIGURATION INITIALE - À exécuter une seule fois
// ============================================================================

/**
 * Script de seed pour initialiser les catégories du forum
 * Exécutez ceci une fois au démarrage :
 */

/*
const initializeForumCategories = async () => {
  try {
    const db = mongoose.connection.db;
    const categoriesCollection = db.collection('forum_categories');
    
    const count = await categoriesCollection.countDocuments();
    if (count === 0) {
      await categoriesCollection.insertMany([
        {
          id: '1',
          name: 'Motivation & Entraide',
          description: 'Partagez votre motivation et aidez les autres',
          icon: 'heart',
          color: '#cc0000',
          order: 1,
          createdAt: new Date(),
        },
        {
          id: '2',
          name: 'Défis & Conseils',
          description: 'Proposez des défis et partagez vos conseils',
          icon: 'trophy',
          color: '#d4af37',
          order: 2,
          createdAt: new Date(),
        },
        {
          id: '3',
          name: 'Partage de Résultats',
          description: 'Célébrez vos succès et vos progrès',
          icon: 'chart-line',
          color: '#4a90e2',
          order: 3,
          createdAt: new Date(),
        },
        {
          id: '4',
          name: 'Bugs & Support',
          description: 'Signalez les bugs et demandez du support',
          icon: 'bug',
          color: '#ff6b6b',
          order: 4,
          createdAt: new Date(),
        },
      ]);
      console.log('✅ Catégories du forum initialisées');
    }
  } catch (error) {
    console.error('Erreur initialisation forum:', error);
  }
};

// Appeler après la connexion MongoDB
mongoose.connection.once('open', () => {
  initializeForumCategories();
});
*/

// ============================================================================
// 6. INDICES DE BASE DE DONNÉES
// ============================================================================

/**
 * Créez ces indices dans votre base de données
 * MongoDB:
 */

/*
db.forum_subjects.createIndex({ categoryId: 1 })
db.forum_subjects.createIndex({ authorId: 1 })
db.forum_subjects.createIndex({ createdAt: -1 })
db.forum_subjects.createIndex({ pinned: 1, createdAt: -1 })
db.forum_subjects.createIndex({ title: "text", message: "text" })

db.forum_replies.createIndex({ subjectId: 1 })
db.forum_replies.createIndex({ authorId: 1 })
db.forum_replies.createIndex({ createdAt: -1 })

db.forum_notifications.createIndex({ userId: 1, read: 1 })
db.forum_notifications.createIndex({ createdAt: -1 })
*/

/**
 * MySQL/Sequelize:
 */

/*
CREATE INDEX idx_subject_category ON forum_subjects(categoryId);
CREATE INDEX idx_subject_author ON forum_subjects(authorId);
CREATE INDEX idx_subject_created ON forum_subjects(createdAt DESC);
CREATE INDEX idx_subject_pinned ON forum_subjects(pinned, createdAt DESC);
CREATE FULLTEXT INDEX idx_subject_search ON forum_subjects(title, message);

CREATE INDEX idx_reply_subject ON forum_replies(subjectId);
CREATE INDEX idx_reply_author ON forum_replies(authorId);
CREATE INDEX idx_reply_created ON forum_replies(createdAt DESC);

CREATE INDEX idx_notification_user ON forum_notifications(userId, read);
CREATE INDEX idx_notification_created ON forum_notifications(createdAt DESC);
*/

// ============================================================================
// 7. PERMISSIONS MIDDLEWARE (Optionnel)
// ============================================================================

/**
 * Middleware pour vérifier les permissions de modération
 * À ajouter dans app/middlewares/verifyModerator.js
 */

/*
const verifyModerator = (req, res, next) => {
  if (!req.user || (req.user.role !== 'moderator' && req.user.role !== 'admin')) {
    return res.status(403).json({ message: 'Permissions modérateur requises' });
  }
  next();
};

module.exports = verifyModerator;
*/

/**
 * Utilization dans forum.routes.js :
 */

/*
const verifyModerator = require('../../app/middlewares/verifyModerator');

router.post('/subjects/:id/pin', verifyModerator, forumController.pinSubject);
*/

// ============================================================================
// 8. TÂCHES PLANIFIÉES (Optionnel)
// ============================================================================

/**
 * Nettoyage hebdomadaire des notifications lues
 * À ajouter dans un fichier workers/forum-maintenance.js
 */

/*
const schedule = require('node-schedule');
const mongoose = require('mongoose');

// Exécute tous les dimanches à 3h du matin
schedule.scheduleJob('0 3 * * 0', async () => {
  try {
    const db = mongoose.connection.db;
    const notificationsCollection = db.collection('forum_notifications');
    
    // Supprimer les notifs lues de plus de 30 jours
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const result = await notificationsCollection.deleteMany({
      read: true,
      createdAt: { $lt: thirtyDaysAgo }
    });
    
    console.log(`🧹 Forum maintenance: ${result.deletedCount} notifications supprimées`);
  } catch (error) {
    console.error('Erreur maintenance forum:', error);
  }
});
*/

// ============================================================================
// 9. VARIABLES D'ENVIRONNEMENT À AJOUTER (Optionnel)
// ============================================================================

/*
# .env
FORUM_ITEMS_PER_PAGE=10
FORUM_MAX_TITLE_LENGTH=200
FORUM_MAX_MESSAGE_LENGTH=5000
FORUM_ENABLE_NOTIFICATIONS=true
FORUM_MODERATION_ENABLED=true
*/

// ============================================================================
// 10. TESTS
// ============================================================================

/**
 * Commandes curl pour tester les endpoints
 */

/*
# Récupérer les sujets
curl http://localhost:4001/api/forum/subjects

# Récupérer les catégories
curl http://localhost:4001/api/forum/categories

# Créer un sujet (requiert auth)
curl -X POST http://localhost:4001/api/forum/subjects \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Mon premier sujet",
    "excerpt": "Cet extrait...",
    "message": "Mon message complet...",
    "categoryId": "1"
  }'

# Épingler un sujet (modérateur)
curl -X POST http://localhost:4001/api/forum/subjects/SUBJECT_ID/pin \
  -H "Authorization: Bearer YOUR_MOD_TOKEN"

# Supprimer un sujet
curl -X DELETE http://localhost:4001/api/forum/subjects/SUBJECT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
*/

// ============================================================================
// 11. SUPPORT WEBSOCKET (Futur)
// ============================================================================

/**
 * Pour une version avec notifications en temps réel :
 */

/*
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: { origin: "*" }
});

io.on('connection', (socket) => {
  socket.on('join-forum', (forumId) => {
    socket.join(`forum-${forumId}`);
  });

  socket.on('new-subject', (subject) => {
    io.to(`forum-${subject.categoryId}`).emit('subject-added', subject);
  });
});

http.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
*/

module.exports = {
  message: 'Guide d\'intégration du Forum - Consultez les sections ci-dessus'
};
