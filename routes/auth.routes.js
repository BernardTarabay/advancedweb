const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { protect, loginLimiter, requireRole } = require('../middleware/authMiddleware');

router.get('/register', authController.showRegister);
router.post('/register', authController.register);

// Restrict role creation to super admin (API)
router.post('/register-admin', protect, requireRole('super admin'), authController.registerAdmin);

router.get('/login', authController.showLogin);
router.post('/login', loginLimiter, authController.login);
router.post('/login-admin', loginLimiter, authController.loginAdmin);

router.get('/logout', authController.logout);
router.post('/logout', authController.logout);

module.exports = router;