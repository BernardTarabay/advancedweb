function isSuperAdmin(user) {
  return user && user.role === 'super admin';
}

module.exports = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.redirect('/auth/login');
    }

    if (isSuperAdmin(req.user)) {
      return next();
    }

    if (!roles.includes(req.user.role)) {
      if (req.accepts('html')) {
        return res.status(403).type('html').send('<!DOCTYPE html><html><head><title>Access denied</title></head><body><p>Access denied.</p><a href="/products">Home</a></body></html>');
      }
      return res.status(403).json({ message: 'Access denied.' });
    }

    next();
  };
};

module.exports.isSuperAdmin = isSuperAdmin;