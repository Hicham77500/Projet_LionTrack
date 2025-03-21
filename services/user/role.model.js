// app/models/role.model.js
// Ce module définit les rôles disponibles. 
// Les rôles seront stockés directement dans le document utilisateur, 
// ce qui évite la création d'une collection séparée pour les rôles.
const ROLES = {
    USER: 'user',
    ADMIN: 'admin'
  };
  
  module.exports = ROLES;