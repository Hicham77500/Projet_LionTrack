/**
 * Configuration JWT centralisée
 * Assure la cohérence du secret JWT entre la création et la vérification des tokens
 */

require('dotenv').config();

const JWT_CONFIG = {
  // Secret JWT avec fallback pour développement
  secret: process.env.JWT_SECRET || 'MaSuperCleSecreteJWT_DEV_ONLY',
  
  // Durée d'expiration du token
  expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  
  // Durée d'expiration du refreshToken
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  
  // Algorithme de signature
  algorithm: 'HS256'
};

// Validation au démarrage
function validateJWTConfig() {
  if (!JWT_CONFIG.secret || JWT_CONFIG.secret === 'MaSuperCleSecreteJWT_DEV_ONLY') {
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    if (!isDevelopment) {
      throw new Error(
        'ERREUR CRITIQUE: JWT_SECRET n\'est pas défini en production. ' +
        'Veuillez configurer la variable d\'environnement JWT_SECRET.'
      );
    }
    
    console.warn(
      '⚠️  ATTENTION: JWT_SECRET utilise la clé par défaut (développement uniquement). ' +
      'Configurez JWT_SECRET dans .env pour la production.'
    );
  }
  
  return JWT_CONFIG;
}

module.exports = {
  ...validateJWTConfig(),
  validateJWTConfig
};
