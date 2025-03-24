// services/user/user.controller.js
const User = require('./user.model'); // Modification du chemin d'importation

exports.getProfile = async (req, res) => {
  try {
    // Le middleware authJwt a mis req.user à disposition
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    // Seul l'utilisateur authentifié peut mettre à jour son propre profil
    const userId = req.user.id;
    
    // Vérifier quels champs sont à mettre à jour
    const updateData = {};
    if (req.body.username) updateData.username = req.body.username;
    if (req.body.email) updateData.email = req.body.email;
    if (req.body.bio) updateData.bio = req.body.bio;
    
    // Mise à jour de l'utilisateur
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password'); // Ne pas renvoyer le mot de passe
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Répondre avec l'utilisateur mis à jour
    res.status(200).json({
      message: 'Profil mis à jour avec succès',
      user: updatedUser
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    res.status(500).json({ message: error.message || 'Erreur lors de la mise à jour du profil' });
  }
};