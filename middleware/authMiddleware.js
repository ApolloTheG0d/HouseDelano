// Simple authentication middleware for admin routes

const redirectIfNotAuthenticated = (req, res, next) => {
  // For now, allow access. Add session check later.
  next();
};

const requireAdminAuth = (req, res, next) => {
  // Check if user has admin session
  if (!req.session || !req.session.adminId) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }
  next();
};

module.exports = {
  redirectIfNotAuthenticated,
  requireAdminAuth
};