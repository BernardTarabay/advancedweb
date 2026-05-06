const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const requireRole = require('../middleware/requireRole');

// Dashboard: managers (read-only), admins, super admin
router.get('/admin-dashboard', protect, requireRole('manager', 'admin', 'super admin'), adminController.showAdminDashboard);

// Grant role - only super admin can do this
router.post('/admin/grant-role', protect, requireRole('super admin'), adminController.grantAdminRole);

module.exports = router;
