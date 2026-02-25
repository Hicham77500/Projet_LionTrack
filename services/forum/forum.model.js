/**
 * Forum Model - Template pour intégration backend
 * À adapter selon votre ORM (Sequelize, MongoDB, etc.)
 * 
 * Exemple avec Sequelize (à adapter à votre configuration)
 */

// Importer les librairies ORM appropriées
// const { DataTypes } = require('sequelize');
// const sequelize = require('./path/to/sequelize');

/**
 * Subject Model
 * Structure d'un sujet du forum
 */
const ForumSubject = {
  // Fields
  id: 'UUID PRIMARY KEY', // ou AUTO_INCREMENT INT
  title: 'VARCHAR(200) NOT NULL',
  excerpt: 'VARCHAR(200)',
  message: 'LONGTEXT NOT NULL',
  categoryId: 'VARCHAR(50) REFERENCES forum_categories(id)',
  authorId: 'VARCHAR(50) REFERENCES users(id) NOT NULL',
  views: 'INT DEFAULT 0',
  replies: 'INT DEFAULT 0',
  pinned: 'BOOLEAN DEFAULT FALSE',
  locked: 'BOOLEAN DEFAULT FALSE',
  createdAt: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
  updatedAt: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
  lastActivityAt: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
  tags: 'JSON', // Array of strings
  
  // Indexes
  indexes: [
    { fields: ['categoryId'] },
    { fields: ['authorId'] },
    { fields: ['createdAt'] },
    { fields: ['views'] },
    { fields: ['pinned'] },
  ],
};

/**
 * Category Model
 * Catégories du forum
 */
const ForumCategory = {
  id: 'VARCHAR(50) PRIMARY KEY',
  name: 'VARCHAR(100) NOT NULL UNIQUE',
  description: 'TEXT',
  icon: 'VARCHAR(50)',
  color: 'VARCHAR(7)', // Hex color
  order: 'INT DEFAULT 0',
  createdAt: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
};

/**
 * Reply Model
 * Réponses aux sujets
 */
const ForumReply = {
  id: 'UUID PRIMARY KEY',
  subjectId: 'VARCHAR(50) REFERENCES forum_subjects(id) NOT NULL',
  authorId: 'VARCHAR(50) REFERENCES users(id) NOT NULL',
  message: 'LONGTEXT NOT NULL',
  likes: 'INT DEFAULT 0',
  createdAt: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
  updatedAt: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
  
  indexes: [
    { fields: ['subjectId'] },
    { fields: ['authorId'] },
  ],
};

/**
 * Notification Model
 * Notifications des utilisateurs
 */
const ForumNotification = {
  id: 'UUID PRIMARY KEY',
  userId: 'VARCHAR(50) REFERENCES users(id) NOT NULL',
  subjectId: 'VARCHAR(50) REFERENCES forum_subjects(id)',
  type: 'ENUM("reply", "mention", "like", "update")',
  read: 'BOOLEAN DEFAULT FALSE',
  createdAt: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
  
  indexes: [
    { fields: ['userId', 'read'] },
  ],
};

/**
 * Exemple avec Sequelize
 */
/*
const Subject = sequelize.define('ForumSubject', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  excerpt: {
    type: DataTypes.STRING(200),
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  categoryId: {
    type: DataTypes.STRING(50),
    references: { model: 'forum_categories', key: 'id' },
  },
  authorId: {
    type: DataTypes.STRING(50),
    references: { model: 'users', key: 'id' },
    allowNull: false,
  },
  views: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  replies: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  pinned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  locked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  tags: {
    type: DataTypes.JSON,
  },
}, {
  timestamps: true,
});

// Relations
Subject.belongsTo(User, { foreignKey: 'authorId', as: 'author' });
Subject.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
Subject.hasMany(Reply, { foreignKey: 'subjectId', as: 'replies' });
*/

module.exports = {
  ForumSubject,
  ForumCategory,
  ForumReply,
  ForumNotification,
};
