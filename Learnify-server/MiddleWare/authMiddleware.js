// middleware/authMiddleware.js
const authMiddleware = (req, res, next) => {
  // Check if user is authenticated via Passport.js
  if (req.isAuthenticated && typeof req.isAuthenticated === 'function' && req.isAuthenticated()) {
    console.log("User authorized:", req.user?.email || req.user?._id);
    return next(); // user is logged in
  }

  // Also check if user exists in session (fallback)
  if (req.session && req.session.user) {
    req.user = req.session.user;
    return next();
  }

  res.status(401).json({ 
    message: 'Unauthorized. Please log in.',
    authenticated: false
  });
};

module.exports = authMiddleware;