const jwt = require('jsonwebtoken');
const asyncHandler = require('./asyncHandler');
const User = require('../models/User');
const rateLimit = require('express-rate-limit');

/**
 * Middleware to verify JWT token from cookie or Authorization header
 * Attaches user object to req.user
 */
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check cookie first, then Authorization header
  if (req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.substring(7);
  }

  if (!token) {
    return res.redirect('/auth/login');
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user to request (without password)
    req.user = await User.findById(decoded.id).select('-password');
    
    if (!req.user) {
      return res.redirect('/auth/login');
    }

    next();
  } catch (error) {
    return res.redirect('/auth/login');
  }
});

/**
 * Rate limiter for login attempts
 */
exports.loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000, // 100 attempts per IP
  message: {
    message: 'Too many login attempts. Try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/** Same role guard as middleware/requireRole.js (includes super admin bypass). */
exports.requireRole = require('./requireRole');