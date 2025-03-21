// app/middlewares/verifySignUp.js
const User = require('../../services/user/user.model');

exports.checkDuplicateEmailOrUsername = async (req, res, next) => {
  try {
    const { email, username } = req.body;
    
    // Vérifier si l'email est déjà utilisé
    const userEmail = await User.findOne({ email });
    if (userEmail) {
      return res.status(400).json({ message: 'Echec! L\'email est déjà utilisé.' });
    }
    
    // Vérifier si le username est déjà utilisé
    const userUsername = await User.findOne({ username });
    if (userUsername) {
      return res.status(400).json({ message: 'Echec! Le nom d\'utilisateur est déjà utilisé.' });
    }
    
    next();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};