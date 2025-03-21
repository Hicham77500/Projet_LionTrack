// app/middlewares/role.middleware.js
exports.isAdmin = (req, res, next) => {
    if (req.user && req.user.roles && req.user.roles.includes('admin')) {
      return next();
    }
    res.status(403).json({ message: 'Accès refusé. Rôle administrateur requis.' });
  };