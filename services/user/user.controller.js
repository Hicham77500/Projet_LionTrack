// services/user/user.controller.js
const User = require('./user.model');  // <-- Chemin corrigé

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

exports.updateProfile = async (req, res) => {
  try {
    const updateData = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true }
    ).select('-password');
    res.status(200).json({ message: 'Profil mis à jour', user: updatedUser });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};