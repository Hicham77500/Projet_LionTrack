// app/middlewares/authJwt.js
const jwt = require('jsonwebtoken');
const authConfig = require('../../config/auth.config');

exports.verifyToken = (req, res, next) => {
  let token = req.headers['authorization'];
  if (!token) {
    return res.status(403).json({ message: 'Aucun token fourni!' });
  }
  if (token.startsWith('Bearer ')) {
    token = token.slice(7);
  }
  jwt.verify(token, authConfig.secret, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Token invalide!' });
    }
    req.user = decoded;
    next();
  });
};